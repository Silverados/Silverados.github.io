# AbstractQueuedSynchronizer(AQS)

## 类的声明
```java
public abstract class AbstractQueuedSynchronizer extends AbstractOwnableSynchronizer implements java.io.Serializable
```
在类的声明中我们可以看到AQS继承自`AbstractOwnableSynchronizer`，这个父类的实现也很简单：
```java
public abstract class AbstractOwnableSynchronizer implements java.io.Serializable {
    private static final long serialVersionUID = 3737899427754241961L;
    
    protected AbstractOwnableSynchronizer() { }
    
    private transient Thread exclusiveOwnerThread;
    
    protected final void setExclusiveOwnerThread(Thread thread) {
        exclusiveOwnerThread = thread;
    }
    
    protected final Thread getExclusiveOwnerThread() {
        return exclusiveOwnerThread;
    }
}
```
这个父类的描述是：”一个可能仅被线程独占的同步器”，提供一个记录独占线程变量的get/set方法。