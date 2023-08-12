# Lock
锁是用来控制多个线程访问共享资源的方式。`Lock`接口相比`synchronized`主要有几点不同：
1. 显式的控制锁的获取和释放，更加灵活。
2. 提供尝试获取锁的方法。
3. 提供可中断获取锁的方法。
4. 提过可超时获取锁的方法。

## 主要实现
`Lock`接口的主要实现有以下几种：
- `ReentrantLock`
- `ReadLock`
- `WriteLock`

这里注意一点，`ReentrantReadWriteLock`并不实现`Lock`，而是组合了`Lock`。首先`ReentrantReadWriteLock`继承自`ReadWriteLock`, 其实现如下：
```java
public interface ReadWriteLock {
    Lock readLock();
    Lock writeLock();
}
```

## 使用范式
```java
Lock l = ...;
l.lock();
try {
    // 访问资源
} finally {
    l.unlock();
}
```

## 方法
- `void lock();`：阻塞直到获取到锁。
- `void lockInterruptibly() throws InterruptedException;`：阻塞直到获取到锁，但是可以响应中断。
- `boolean tryLock();`：尝试获取锁，能获取到就返回true，否则false。范式查看下文具体细节。
- `boolean tryLock(long time, TimeUnit unit) throws InterruptedException;`：复合上面的可中断和尝试获取锁。
- `void unlock();`：解锁。
- `Condition newCondition();`

### `tryLock()`范式
```java
Lock l = ...;
if(l.tryLock()){
    try{
        // 访问资源
    }finally{
        l.unlock();
    }
}
```
