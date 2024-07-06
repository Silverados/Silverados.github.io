## Executors如果使用newFixedThreadPool(1)和newSingleThreadExecutor有什么区别吗

在JDK17中： 主要区别在于`newSingleThreadExecutor`返回的是`FinalizableDelegatedExecutorService`实例，这是一个包装的`ThreadPoolExecutor`，在Executors中的私有类:
```java
    public static ExecutorService newSingleThreadExecutor() {
    return new FinalizableDelegatedExecutorService
        (new ThreadPoolExecutor(1, 1,
            0L, TimeUnit.MILLISECONDS,
            new LinkedBlockingQueue<Runnable>()));
}
```

拓展一下：
`DelegatedExecutorService`是对`ExecutorService`的代理，实现了`ExecutorService`的所有方法。
`FinalizableDelegatedExecutorService`装饰了`DelegatedExecutorService`，在原本的基础上增加了终结的处理。
```java
/**
 * A wrapper class that exposes only the ExecutorService methods
 * of an ExecutorService implementation.
 */
private static class DelegatedExecutorService
    implements ExecutorService {
    private final ExecutorService e;
    DelegatedExecutorService(ExecutorService executor) { e = executor; }
    public void execute(Runnable command) {
        try {
            e.execute(command);
        } finally { reachabilityFence(this); }
    }
    public void shutdown() { e.shutdown(); }
    public List<Runnable> shutdownNow() {
        try {
            return e.shutdownNow();
        } finally { reachabilityFence(this); }
    }
    public boolean isShutdown() {
        try {
            return e.isShutdown();
        } finally { reachabilityFence(this); }
    }
    public boolean isTerminated() {
        try {
            return e.isTerminated();
        } finally { reachabilityFence(this); }
    }
    public boolean awaitTermination(long timeout, TimeUnit unit)
        throws InterruptedException {
        try {
            return e.awaitTermination(timeout, unit);
        } finally { reachabilityFence(this); }
    }
    public Future<?> submit(Runnable task) {
        try {
            return e.submit(task);
        } finally { reachabilityFence(this); }
    }
    public <T> Future<T> submit(Callable<T> task) {
        try {
            return e.submit(task);
        } finally { reachabilityFence(this); }
    }
    public <T> Future<T> submit(Runnable task, T result) {
        try {
            return e.submit(task, result);
        } finally { reachabilityFence(this); }
    }
    public <T> List<Future<T>> invokeAll(Collection<? extends Callable<T>> tasks)
        throws InterruptedException {
        try {
            return e.invokeAll(tasks);
        } finally { reachabilityFence(this); }
    }
    public <T> List<Future<T>> invokeAll(Collection<? extends Callable<T>> tasks,
        long timeout, TimeUnit unit)
        throws InterruptedException {
        try {
            return e.invokeAll(tasks, timeout, unit);
        } finally { reachabilityFence(this); }
    }
    public <T> T invokeAny(Collection<? extends Callable<T>> tasks)
        throws InterruptedException, ExecutionException {
        try {
            return e.invokeAny(tasks);
        } finally { reachabilityFence(this); }
    }
    public <T> T invokeAny(Collection<? extends Callable<T>> tasks,
        long timeout, TimeUnit unit)
        throws InterruptedException, ExecutionException, TimeoutException {
        try {
            return e.invokeAny(tasks, timeout, unit);
        } finally { reachabilityFence(this); }
    }
}

private static class FinalizableDelegatedExecutorService
    extends DelegatedExecutorService {
    FinalizableDelegatedExecutorService(ExecutorService executor) {
        super(executor);
    }
    @SuppressWarnings("deprecation")
    protected void finalize() {
        super.shutdown();
    }
}
```

在JDK21中，替换成了`AutoShutdownDelegatedExecutorService`, 同样是包内私有的方法：
```java
    public static ExecutorService newSingleThreadExecutor(ThreadFactory threadFactory) {
        return new AutoShutdownDelegatedExecutorService
            (new ThreadPoolExecutor(1, 1,
                                    0L, TimeUnit.MILLISECONDS,
                                    new LinkedBlockingQueue<Runnable>(),
                                    threadFactory));
    }
```

修改的demo：
```java
    public static void main(String[] args) {
        ExecutorService executorService = Executors.newFixedThreadPool(1);
        for (int i = 0; i < 5; i++) {
            print("before: ", executorService);
        }


        try {
            executorService.awaitTermination(1, TimeUnit.SECONDS);
        } catch (InterruptedException e) {
            throw new RuntimeException(e);
        }

        var modifyExecutorService = (ThreadPoolExecutor) executorService;
        modifyExecutorService.setMaximumPoolSize(5);
        modifyExecutorService.setCorePoolSize(5);
        for (int i = 0; i < 5; i++) {
            print("after: ", modifyExecutorService);
        }

        executorService.shutdown();
    }

    public static void print(String prefix, ExecutorService executorService) {
        executorService.execute(() -> {
            System.out.println(prefix + Thread.currentThread());
        });
    }
```

执行后结果输出：
```text
before: Thread[#22,pool-1-thread-1,5,main]
before: Thread[#22,pool-1-thread-1,5,main]
before: Thread[#22,pool-1-thread-1,5,main]
before: Thread[#22,pool-1-thread-1,5,main]
before: Thread[#22,pool-1-thread-1,5,main]
after: Thread[#23,pool-1-thread-2,5,main]
after: Thread[#24,pool-1-thread-3,5,main]
after: Thread[#22,pool-1-thread-1,5,main]
after: Thread[#25,pool-1-thread-4,5,main]
after: Thread[#26,pool-1-thread-5,5,main]
```