
## 构造方法
`ConcurrentHashMap`提供以下几个构造方法：
- `ConcurrentHashMap()`
- `ConcurrentHashMap(int initialCapacity)`
- `ConcurrentHashMap(Map<? extends K, ? extends V> m)`
- `ConcurrentHashMap(int initialCapacity, float loadFactor)`
- `ConcurrentHashMap(int initialCapacity, float loadFactor, int concurrencyLevel)`

实际上大体和`HashMap`的构造方法类似，唯一特殊的地方在于`concurrencyLevel`这个参数。这个参数的作用是：设置并发更新线程的估计数目。默认值是1。
```java
    public ConcurrentHashMap(int initialCapacity,
                             float loadFactor, int concurrencyLevel) {
        if (!(loadFactor > 0.0f) || initialCapacity < 0 || concurrencyLevel <= 0)
            throw new IllegalArgumentException();
        if (initialCapacity < concurrencyLevel)   // Use at least as many bins
            initialCapacity = concurrencyLevel;   // as estimated threads
        long size = (long)(1.0 + (long)initialCapacity / loadFactor);
        int cap = (size >= (long)MAXIMUM_CAPACITY) ?
            MAXIMUM_CAPACITY : tableSizeFor((int)size);
        this.sizeCtl = cap;
    }
```
通过查看该方法的实现，我们可以发现这个参数实际上没多大用处，只是影响初始容量大小。