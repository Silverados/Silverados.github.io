# ThreadLocal
## get方法
获取当前执行的线程，通过线程拿`ThreadLocalMap`, 然后再以当前对象拿值。如果取不到这些值，使用`setInitialValue()`设置初始值并且返回。
```java
    public T get() {
        Thread t = Thread.currentThread();
        ThreadLocalMap map = getMap(t);
        if (map != null) {
            ThreadLocalMap.Entry e = map.getEntry(this);
            if (e != null) {
                @SuppressWarnings("unchecked")
                T result = (T)e.value;
                return result;
            }
        }
        return setInitialValue();
    }
```