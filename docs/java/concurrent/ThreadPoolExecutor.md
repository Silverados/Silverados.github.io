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
- public ThreadPoolExecutor(int corePoolSize, int maximumPoolSize, long keepAliveTime, TimeUnit unit, BlockingQueue<Runnable> workQueue)
- public ThreadPoolExecutor(int corePoolSize, int maximumPoolSize, long keepAliveTime, TimeUnit unit, BlockingQueue<Runnable> workQueue, ThreadFactory threadFactory)
- public ThreadPoolExecutor(int corePoolSize, int maximumPoolSize, long keepAliveTime, TimeUnit unit, BlockingQueue<Runnable> workQueue, RejectedExecutionHandler handler)
- public ThreadPoolExecutor(int corePoolSize, int maximumPoolSize, long keepAliveTime, TimeUnit unit, BlockingQueue<Runnable> workQueue, ThreadFactory threadFactory, RejectedExecutionHandler handler)

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

这里虽然提供了很多的参数，但是需要了解这些参数的作用需要往下看`ThreadPoolExecutor`的执行策略。

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


1. 如果工作线程数量小于`corePoolSize`，那么核心线程池添加一个工作线程执行任务。
2. 如果线程池还在运行，那么添加到工作队列。这里会有一个双重检测再判断一次线程池的状态。如果线程池不在运行状态了，从队列移除执行拒绝策略。如果工作线程数量为0那么添加一个到最大线程池。
3. 如果即无法添加到线程池，又无法添加到队列中，执行拒绝策略。

```java
    public void execute(Runnable command) {
        if (command == null)
            throw new NullPointerException();
        /*
         * Proceed in 3 steps:
         *
         * 1. If fewer than corePoolSize threads are running, try to
         * start a new thread with the given command as its first
         * task.  The call to addWorker atomically checks runState and
         * workerCount, and so prevents false alarms that would add
         * threads when it shouldn't, by returning false.
         *
         * 2. If a task can be successfully queued, then we still need
         * to double-check whether we should have added a thread
         * (because existing ones died since last checking) or that
         * the pool shut down since entry into this method. So we
         * recheck state and if necessary roll back the enqueuing if
         * stopped, or start a new thread if there are none.
         *
         * 3. If we cannot queue task, then we try to add a new
         * thread.  If it fails, we know we are shut down or saturated
         * and so reject the task.
         */
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
