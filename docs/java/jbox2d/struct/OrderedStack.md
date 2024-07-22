# OrderedStack
一个栈的实现，对对象进行内存的预分配。argStackSize控制整个栈的数量，argContainerSize控制单次pop的数量，主打一个有借有还。
实际是个对象池。

```java
public abstract class OrderedStack<E> {

  private final Object[] pool;
  private int index;
  private final int size;
  private final Object[] container;

  public OrderedStack(int argStackSize, int argContainerSize) {
    size = argStackSize;
    pool = new Object[argStackSize];
    for (int i = 0; i < argStackSize; i++) {
      pool[i] = newInstance();
    }
    index = 0;
    container = new Object[argContainerSize];
  }

  @SuppressWarnings("unchecked")
  public final E pop() {
    assert (index < size) : "End of stack reached, there is probably a leak somewhere";
    return (E) pool[index++];
  }

  @SuppressWarnings("unchecked")
  public final E[] pop(int argNum) {
    assert (index + argNum < size) : "End of stack reached, there is probably a leak somewhere";
    assert (argNum <= container.length) : "Container array is too small";
    System.arraycopy(pool, index, container, 0, argNum);
    index += argNum;
    return (E[]) container;
  }

  public final void push(int argNum) {
    index -= argNum;
    assert (index >= 0) : "Beginning of stack reached, push/pops are unmatched";
  }

  /** Creates a new instance of the object contained by this stack. */
  protected abstract E newInstance();
}

```
