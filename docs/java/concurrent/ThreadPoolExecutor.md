# Java中的线程池
谈到池化，通常我们会想到线程池、连接池、对象池等池子。通常池化都会有以下这些共同的好处：
1. 减少资源的消耗。在线程池中重复利用已经创建的线程可以减少创建和销毁的损耗。
2. 方便资源的管理。在线程池中我们可以制定线程数量、什么情况下会创建线程、线程满了怎么拒绝等。

在Java线程池通常指的是`ThreadPoolExecutor`。

## 类的声明
```java
public class ThreadPoolExecutor extends AbstractExecutorService {}
```

## 构造方法
`ThreadPoolExecutor`提供以下几个构造方法：
- `public ThreadPoolExecutor(int corePoolSize, int maximumPoolSize, long keepAliveTime, TimeUnit unit, BlockingQueue<Runnable> workQueue)`
- `public ThreadPoolExecutor(int corePoolSize, int maximumPoolSize, long keepAliveTime, TimeUnit unit, BlockingQueue<Runnable> workQueue, ThreadFactory threadFactory)`
- `public ThreadPoolExecutor(int corePoolSize, int maximumPoolSize, long keepAliveTime, TimeUnit unit, BlockingQueue<Runnable> workQueue, RejectedExecutionHandler handler)`
- `public ThreadPoolExecutor(int corePoolSize, int maximumPoolSize, long keepAliveTime, TimeUnit unit, BlockingQueue<Runnable> workQueue, ThreadFactory threadFactory, RejectedExecutionHandler handler)`

实际上所有的构造方法都是最后一个构造方法的重载:
- 当没有提供线程工厂`ThreadFactory`时，使用`Executors.defaultThreadFactory`。
- 当没有提供拒绝策略`RejectedExecutionHandler`时，使用`defaultHandler`, 这个`defaultHandler`对应的是抛弃策略`AbortPolicy`。

```java
    // 抛弃策略
    private static final RejectedExecutionHandler defaultHandler = new AbortPolicy();

    public ThreadPoolExecutor(int corePoolSize, int maximumPoolSize, long keepAliveTime, TimeUnit unit, BlockingQueue<Runnable> workQueue) {
        this(corePoolSize, maximumPoolSize, keepAliveTime, unit, workQueue, Executors.defaultThreadFactory(), defaultHandler);
    }

    public ThreadPoolExecutor(int corePoolSize, int maximumPoolSize, long keepAliveTime, TimeUnit unit, BlockingQueue<Runnable> workQueue, ThreadFactory threadFactory) {
        this(corePoolSize, maximumPoolSize, keepAliveTime, unit, workQueue,
             threadFactory, defaultHandler);
    }

    public ThreadPoolExecutor(int corePoolSize, int maximumPoolSize, long keepAliveTime, TimeUnit unit, BlockingQueue<Runnable> workQueue, RejectedExecutionHandler handler) {
        this(corePoolSize, maximumPoolSize, keepAliveTime, unit, workQueue,
             Executors.defaultThreadFactory(), handler);
    }

    public ThreadPoolExecutor(int corePoolSize, int maximumPoolSize, long keepAliveTime, TimeUnit unit, BlockingQueue<Runnable> workQueue, ThreadFactory threadFactory, RejectedExecutionHandler handler) {
        if (corePoolSize < 0 ||
            maximumPoolSize <= 0 ||
            maximumPoolSize < corePoolSize ||
            keepAliveTime < 0)
            throw new IllegalArgumentException();
        if (workQueue == null || threadFactory == null || handler == null)
            throw new NullPointerException();
        this.corePoolSize = corePoolSize;
        this.maximumPoolSize = maximumPoolSize;
        this.workQueue = workQueue;
        this.keepAliveTime = unit.toNanos(keepAliveTime);
        this.threadFactory = threadFactory;
        this.handler = handler;
    }
```

这里虽然提供了很多的参数，但是需要了解这些参数的作用需要往下看`ThreadPoolExecutor`的执行策略。这里先给一个概述：
- int corePoolSize: 核心线程池大小
- int maximumPoolSize: 最大线程池大小
- long keepAliveTime, TimeUnit unit: 空闲线程最大存活时间
- ThreadFactory threadFactory: 线程工厂
- BlockingQueue<Runnable> workQueue: 阻塞队列
- RejectedExecutionHandler handler: 拒绝策略

## 线程池的状态和工作线程数量
在开始看任务执行前，我们需要先看一个原子变量`ctl`，这个变量隐含了两个概念一个是工作线程的数量，另一个是线程池的状态。
这两个值通过`或`运算组合在一起，其中低位保存工作线程数量，高位保存状态。这里高位和低位的分隔是第29位，这意味着最多只能有`2^29 - 1`大概500万个工作线程。

线程池的状态包含以下几种：
- RUNNING(运行中): 接受新任务和处理队列中的任务
- SHUTDOWN(): 不再接受新任务，但是仍然会执行队列中的任务
- STOP(停止): 不接受新任务，不执行队列中的任务，中断正在进行的任务
- TIDYING(清理): 所有任务都执行完成，workerCount为0，线程过渡好`TIDYING`状态执行`terminated()`钩子方法
- TERMINATED(): `terminated`已经执行

状态的改变：
- RUNNING -> SHUTDOWN: 调用`shutdown()`
- RUNNING or SHUTDOWN) -> STOP: 调用`shutdownNow()`
- SHUTDOWN -> TIDYING: 当队列和线程池都空了
- STOP -> TIDYING: 当线程池空了
- TIDYING -> TERMINATED: 当`terminated`方法执行完毕

```java
    private final AtomicInteger ctl = new AtomicInteger(ctlOf(RUNNING, 0));
    private static final int COUNT_BITS = Integer.SIZE - 3;
    private static final int COUNT_MASK = (1 << COUNT_BITS) - 1;

    // runState is stored in the high-order bits
    private static final int RUNNING    = -1 << COUNT_BITS;
    private static final int SHUTDOWN   =  0 << COUNT_BITS;
    private static final int STOP       =  1 << COUNT_BITS;
    private static final int TIDYING    =  2 << COUNT_BITS;
    private static final int TERMINATED =  3 << COUNT_BITS;

    // Packing and unpacking ctl
    private static int runStateOf(int c)     { return c & ~COUNT_MASK; }
    private static int workerCountOf(int c)  { return c & COUNT_MASK; }
    private static int ctlOf(int rs, int wc) { return rs | wc; }
    
    
    private static boolean runStateLessThan(int c, int s) {
        return c < s;
    }

    private static boolean runStateAtLeast(int c, int s) {
        return c >= s;
    }

    private static boolean isRunning(int c) {
        return c < SHUTDOWN;
    }
    
    private void decrementWorkerCount() {
        ctl.addAndGet(-1);
    }
```

## 任务的执行
在`execute`概念讲解前，需要先厘清两种线程池，一种称为核心线程池，另一种称为最大线程池。注意这里虽然是这么叫，但是实际上只有一个线程池，`corePoolSize`可以想成是一个边界。
```text
0 ... corePoolSize ... maximumPoolSize
```
边界里的劳工干到死除非有让他停下的理由，边界外的闲了就放假。

当提交一个任务给线程池时，会按以下的逻辑执行：
1. 如果工作线程数量小于`corePoolSize`，那么核心线程池添加一个工作线程执行任务。
2. 如果线程池还在运行，那么添加到工作队列。这里会有一个双重检测再判断一次线程池的状态。如果线程池不在运行状态了，从队列移除执行拒绝策略。如果工作线程数量为0那么添加一个到最大线程池。
3. 如果既无法添加到线程池，又无法添加到队列中，执行拒绝策略。

```java
    public void execute(Runnable command) {
        if (command == null)
            throw new NullPointerException();

        int c = ctl.get();
        if (workerCountOf(c) < corePoolSize) {
            if (addWorker(command, true))
                return;
            c = ctl.get();
        }
        if (isRunning(c) && workQueue.offer(command)) {
            int recheck = ctl.get();
            if (! isRunning(recheck) && remove(command))
                reject(command);
            else if (workerCountOf(recheck) == 0)
                addWorker(null, false);
        }
        else if (!addWorker(command, false))
            reject(command);
    }
```


## 工作者线程
添加工作者线程有两个参数，第一个`Runnable firstTask`意味着这个线程第一个执行的任务，这个值可能是`null`意味着启动一个工作者线程但是不需要直接执行任务，而是到队列之类的地方拿，后面`getTask`会分析。
第二个参数意味着这个工作线程是否是添加到核心线程池。前面也说了其实只有一个池子，`corePoolSize`只是相当于中间的边界，从下面方法的实现我们也可以看出来，当`core`为`true`时如果线程数量超过`corePoolSize`则添加失败。
```java
    private boolean addWorker(Runnable firstTask, boolean core) {
        retry:
        for (int c = ctl.get();;) {
            // Check if queue empty only if necessary.
            if (runStateAtLeast(c, SHUTDOWN)
                && (runStateAtLeast(c, STOP)
                    || firstTask != null
                    || workQueue.isEmpty()))
                return false;

            for (;;) {
                if (workerCountOf(c)
                    >= ((core ? corePoolSize : maximumPoolSize) & COUNT_MASK))
                    return false;
                if (compareAndIncrementWorkerCount(c))
                    break retry;
                c = ctl.get();  // Re-read ctl
                if (runStateAtLeast(c, SHUTDOWN))
                    continue retry;
                // else CAS failed due to workerCount change; retry inner loop
            }
        }

        boolean workerStarted = false;
        boolean workerAdded = false;
        Worker w = null;
        try {
            w = new Worker(firstTask);
            final Thread t = w.thread;
            if (t != null) {
                final ReentrantLock mainLock = this.mainLock;
                mainLock.lock();
                try {
                    // Recheck while holding lock.
                    // Back out on ThreadFactory failure or if
                    // shut down before lock acquired.
                    int c = ctl.get();

                    if (isRunning(c) ||
                        (runStateLessThan(c, STOP) && firstTask == null)) {
                        if (t.getState() != Thread.State.NEW)
                            throw new IllegalThreadStateException();
                        workers.add(w);
                        workerAdded = true;
                        int s = workers.size();
                        if (s > largestPoolSize)
                            largestPoolSize = s;
                    }
                } finally {
                    mainLock.unlock();
                }
                if (workerAdded) {
                    t.start();
                    workerStarted = true;
                }
            }
        } finally {
            if (! workerStarted)
                addWorkerFailed(w);
        }
        return workerStarted;
    }
```
方法的实现中前面标签`retry`部分是判断能不能添加，后面部分是添加的实际过程。
- 添加一个工作者线程，这个过程会从线程池中创建一个新的线程。
- 将这个工作线程添加进`HashSet<Worker> workers`中，注意本身`HashSet`是线程不安全的，所以实际上所有对它的操作都在持有锁的情况下进行。
- 更新`largestPoolSize`。
- 启动线程。如果失败调用`addWorkerFailed`。

启动线程实际执行的`run`方法：
```java
    private final class Worker extends AbstractQueuedSynchronizer implements Runnable
    {
        Worker(Runnable firstTask) {
            setState(-1); // inhibit interrupts until runWorker
            this.firstTask = firstTask;
            this.thread = getThreadFactory().newThread(this);
        }
        /** Delegates main run loop to outer runWorker. */
        public void run() {
            runWorker(this);
        }
    }
```

工作者线程不断从队列中(getTask())拿任务来执行。如果发现没有任务了就尝试自我毁灭(processWorkerExit())了。
工作者线程在执行的时候会先给自己上个排他锁，所以当`worker`是`isLocked`的时候意味着正在执行任务。
任务的执行分为：`beforeExecute(wt, task);` -> `task.run();` -> `afterExecute(task, ex);`，判断中断线程在`beforeExecute`之前。
```java
    final void runWorker(Worker w) {
        Thread wt = Thread.currentThread();
        Runnable task = w.firstTask;
        w.firstTask = null;
        w.unlock(); // allow interrupts
        boolean completedAbruptly = true;
        try {
            while (task != null || (task = getTask()) != null) {
                w.lock();
                // If pool is stopping, ensure thread is interrupted;
                // if not, ensure thread is not interrupted.  This
                // requires a recheck in second case to deal with
                // shutdownNow race while clearing interrupt
                if ((runStateAtLeast(ctl.get(), STOP) ||
                     (Thread.interrupted() &&
                      runStateAtLeast(ctl.get(), STOP))) &&
                    !wt.isInterrupted())
                    wt.interrupt();
                try {
                    beforeExecute(wt, task);
                    try {
                        task.run();
                        afterExecute(task, null);
                    } catch (Throwable ex) {
                        afterExecute(task, ex);
                        throw ex;
                    }
                } finally {
                    task = null;
                    w.completedTasks++;
                    w.unlock();
                }
            }
            completedAbruptly = false;
        } finally {
            processWorkerExit(w, completedAbruptly);
        }
    }
```

`getTask`会不断的尝试在队列中拿任务，除非超时或者终止线程池或者队列空了。
```java
    private Runnable getTask() {
        boolean timedOut = false; // Did the last poll() time out?

        for (;;) {
            int c = ctl.get();

            // Check if queue empty only if necessary.
            if (runStateAtLeast(c, SHUTDOWN)
                && (runStateAtLeast(c, STOP) || workQueue.isEmpty())) {
                decrementWorkerCount();
                return null;
            }

            int wc = workerCountOf(c);

            // Are workers subject to culling?
            boolean timed = allowCoreThreadTimeOut || wc > corePoolSize;

            if ((wc > maximumPoolSize || (timed && timedOut))
                && (wc > 1 || workQueue.isEmpty())) {
                if (compareAndDecrementWorkerCount(c))
                    return null;
                continue;
            }

            try {
                Runnable r = timed ?
                    workQueue.poll(keepAliveTime, TimeUnit.NANOSECONDS) :
                    workQueue.take();
                if (r != null)
                    return r;
                timedOut = true;
            } catch (InterruptedException retry) {
                timedOut = false;
            }
        }
    }
```

## 拒绝策略
当线程池和阻塞队列无法执行任务时，由拒绝策略决定任务何去何从。
```java
public interface RejectedExecutionHandler {
    void rejectedExecution(Runnable r, ThreadPoolExecutor executor);
}
```

接口`RejectedExecutionHandler`定义了`rejectedExecution`方法，该方法接受两个参数一个是待执行的任务，另一个是当前线程池。调用的地方在`ThreadPoolExecutor`中的：
```java
    final void reject(Runnable command) {
        handler.rejectedExecution(command, this);
    }
```

其中内置了以下几种策略：
- CallerRunsPolicy: 调用者线程执行
- AbortPolicy: 抛弃且抛出异常
- DiscardPolicy: 抛弃无异常
- DiscardOldestPolicy: 抛弃最老的任务执行当前的任务

### CallerRunsPolicy 调用者线程执行
如果线程池没有shutdown则执行。
```java
    public static class CallerRunsPolicy implements RejectedExecutionHandler {
        public CallerRunsPolicy() { }

        public void rejectedExecution(Runnable r, ThreadPoolExecutor e) {
            if (!e.isShutdown()) {
                r.run();
            }
        }
    }
```

### AbortPolicy 抛弃并抛异常策略
这是默认的执行方式，拒绝执行并抛出一个异常。
```java
    public static class AbortPolicy implements RejectedExecutionHandler {
        public AbortPolicy() { }

        public void rejectedExecution(Runnable r, ThreadPoolExecutor e) {
            throw new RejectedExecutionException("Task " + r.toString() +
                                                 " rejected from " +
                                                 e.toString());
        }
    }
```

### DiscardPolicy 抛弃不抛异常策略
抛弃但是不做任何事情。
```java
    public static class DiscardPolicy implements RejectedExecutionHandler {
        public DiscardPolicy() { }

        public void rejectedExecution(Runnable r, ThreadPoolExecutor e) {
        }
    }
```

### DiscardOldestPolicy 抛弃队列头的任务
抛弃队列中最老的任务然后执行当前任务。
```java
    public static class DiscardOldestPolicy implements RejectedExecutionHandler {
        public DiscardOldestPolicy() { }

        public void rejectedExecution(Runnable r, ThreadPoolExecutor e) {
            if (!e.isShutdown()) {
                e.getQueue().poll();
                e.execute(r);
            }
        }
    }

```

这里在Javadoc有提到以下的实现，这个实现优于`DiscardOldestPolicy`，它会触发被抛弃任务的回调或者记录一些额外的信息：
```java
     new RejectedExecutionHandler() {
       public void rejectedExecution(Runnable r, ThreadPoolExecutor e) {
         Runnable dropped = e.getQueue().poll();
         if (dropped instanceof Future<?>) {
           ((Future<?>)dropped).cancel(false);
           // also consider logging the failure
         }
         e.execute(r);  // retry
```

## 线程池监控
- getPoolSize(): 返回当前线程池中的线程数量
- getActiveCount(): 返回线程池中(大约)活跃线程的数量
- getLargestPoolSize(): 返回线程池中最多的时候运行的线程数量
- getTaskCount(): 返回(大约)提交过的任务数量
- completedTaskCount(): 返回(大约)执行完成的任务数量

