# 单例模式
单例模式是面试常考的模式。需要掌握几种实现。

这几种实现的区别主要在于是否延迟初始化、线程是否安全。

## 懒汉式
### 线程不安全
这种是最原始的实现，问题是线程不安全，多个线程下instance会被重复初始化。
```java
public class Singleton {
    private static Singleton instance;
    private Singleton(){}
    
    public static Singleton getInstance() {
        if (instance == null) {
            instance = new Singleton();
        }
        return instance;
    }
}
```

### 线程安全
这里用`synchronized`来保证多线程下的安全初始化。
```java
public class Singleton {
    private static Singleton instance;
    private Singleton(){}

    public synchronized static Singleton getInstance() {
        if (instance == null) {
            instance = new Singleton();
        }
        return instance;
    }
}
```

### 双重检验锁
双重检验锁细化锁粒度。
```java
public class Singleton {
    private volatile static Singleton instance;

    private Singleton() {}

    public static Singleton getInstance() {
        if (instance == null) {
            synchronized (Singleton.class) {
                if (instance == null) {
                    instance = new Singleton();
                }
            }
        }
        return instance;
    }
}
```

## 饿汉式
饿汉式在类加载式就初始化实例。

```java
public class Singleton {
    private static final Singleton instance = new Singleton();

    private Singleton() {}

    public static Singleton getInstance() {
        return instance;
    }
}
```

## 静态内部类
静态内部类的方式可以延迟初始化，也能保证线程安全。
```java
public class Singleton {
    private Singleton() {}
    private static class SingletonHolder {
        private static final Singleton INSTANCE = new Singleton();
    }

    public static getInstance() {
        return SingletonHolder.INSTANCE;
    }
}
```