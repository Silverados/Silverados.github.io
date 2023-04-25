# ArrayList详解

距离上一次阅读`ArrayList`源码过去有2,3年了，这次在写博客的时候重新再阅读一遍。过去写过相关的源码分析是基于`jdk8`的版本，现在写的这版会基于`jdk17`的版本，初略看了下应该说大体上这些基础的类都没有太大的变化，只有小部分的方法发生了修改，例如`grow`的实现引入了`ArraysSupport.newLength`来实现。

`ArrayList`基于数组实现，是线程不安全的类。

## 类的声明
`ArrayList`的声明如下：
```java
public class ArrayList<E> extends AbstractList<E>
        implements List<E>, RandomAccess, Cloneable, java.io.Serializable
```

其中需要关注的是`RandomAccess`接口标识了类通常可以在常量时间内快速随机访问:
> support fast(generally constant time) random access

## 构造方法
`ArrayList`提供以下几个构造方法：
- `public ArrayList()`
- `public ArrayList(int initialCapacity)`
- `public ArrayList(Collection<? extends E> c)`

纵观3个构造方法的实现，都是对`elementData`进行赋值，当容量为0时赋予静态的空数组`EMPTY_ELEMENTDATA`，当使用默认的构造方法时使用的也是大小为0的空数组`DEFAULTCAPACITY_EMPTY_ELEMENTDATA`，唯一的区别在于后者在第一次添加元素的时候会用默认的容量进行数组的初始化（有点延迟初始化的概念，如果不添加元素就不会产生新的`Object[]`对象）。：
```java
    private static final Object[] EMPTY_ELEMENTDATA = {};
    private static final Object[] DEFAULTCAPACITY_EMPTY_ELEMENTDATA = {};
    transient Object[] elementData; 

    public ArrayList(int initialCapacity) {
        if (initialCapacity > 0) {
            this.elementData = new Object[initialCapacity];
        } else if (initialCapacity == 0) {
            this.elementData = EMPTY_ELEMENTDATA;
        } else {
            throw new IllegalArgumentException("Illegal Capacity: "+
                                               initialCapacity);
        }
    }

    public ArrayList() {
        this.elementData = DEFAULTCAPACITY_EMPTY_ELEMENTDATA;
    }

    public ArrayList(Collection<? extends E> c) {
        Object[] a = c.toArray();
        if ((size = a.length) != 0) {
            if (c.getClass() == ArrayList.class) {
                elementData = a;
            } else {
                elementData = Arrays.copyOf(a, size, Object[].class);
            }
        } else {
            // replace with empty array.
            elementData = EMPTY_ELEMENTDATA;
        }
    }
```


## 容量相关
在面试中如果问到`ArrayList`通常会问到的一个问题就是默认的容量大小，这个值默认是10：
```java
private static final int DEFAULT_CAPACITY = 10;
```

上面说了如果使用默认无参的构造方法，会在第一次添加元素时使用默认容量进行初始化。我们看具体的`add`实现：
```java
    private void add(E e, Object[] elementData, int s) {
        if (s == elementData.length)
            elementData = grow();
        elementData[s] = e;
        size = s + 1;
    }

    public boolean add(E e) {
        modCount++;
        add(e, elementData, size);
        return true;
    }
```

这里`modCount`是修改（增删等）次数的计数器防止并发修改，或者在迭代中修改机制的重要变量。

我们需要关注的是`grow`方法的实现，这就是常说的扩容，扩容很简单，无非就是两步：
1. 确定新容器的大小
2. 将旧容器的数据写到新容器

首先我们先要知道怎么将旧容器的数据写到新容器, `Arrays.copyOf`是对本地方法`System.arraycopy`的一个封装：
```java
    // Arrays.java
    public static <T> T[] copyOf(T[] original, int newLength) {
        return (T[]) copyOf(original, newLength, original.getClass());
    }

    @IntrinsicCandidate
    public static <T,U> T[] copyOf(U[] original, int newLength, Class<? extends T[]> newType) {
        @SuppressWarnings("unchecked")
        T[] copy = ((Object)newType == (Object)Object[].class)
            ? (T[]) new Object[newLength]
            : (T[]) Array.newInstance(newType.getComponentType(), newLength);
        System.arraycopy(original, 0, copy, 0,
                         Math.min(original.length, newLength));
        return copy;
    }

    // System.java
    public static native void arraycopy(Object src,  int  srcPos,
                                        Object dest, int destPos,
                                        int length);
```

然后是新容器大小的确定，概括来说扩容优先保证程序正常的执行，例如调用`add`时会添加`1`个新元素，`addAll`会增加若干个元素，也就是新数组需要的最小容量，如果可以的话新数组的容量会扩容到原本的1.5倍：
```java
    // add 
    if (s == elementData.length)
        elementData = grow();

    // addAll
    if (numNew > (elementData = this.elementData).length - (s = size))
        elementData = grow(s + numNew);

    private Object[] grow() {
        return grow(size + 1);
    }

    private Object[] grow(int minCapacity) {
        int oldCapacity = elementData.length;
        if (oldCapacity > 0 || elementData != DEFAULTCAPACITY_EMPTY_ELEMENTDATA) {
            int newCapacity = ArraysSupport.newLength(oldCapacity,
                    minCapacity - oldCapacity, /* minimum growth */
                    oldCapacity >> 1           /* preferred growth */);
            return elementData = Arrays.copyOf(elementData, newCapacity);
        } else {
            return elementData = new Object[Math.max(DEFAULT_CAPACITY, minCapacity)];
        }
    }
```

这里的`ArraysSupport.newLength`我没去深究是哪个版本引入的，我看了下手上的`jdk8`和`jdk11`发现是3个版本。。。并且这个`ArraysSupport`也没写明`since`。

研究下`ArraysSupport.newLength`发现这是个`public`方法，这意味着可以在后续开发中使用。首先上限的大小是`Integer.MAX_VALUE - 8`而不是`MAX_VALUE`这是因为有些VM的实现中限制了上限，如果超出这个软最大值可能会抛出`OOM`：
```java
    public static final int SOFT_MAX_ARRAY_LENGTH = Integer.MAX_VALUE - 8;

    public static int newLength(int oldLength, int minGrowth, int prefGrowth) {
        // preconditions not checked because of inlining
        // assert oldLength >= 0
        // assert minGrowth > 0

        int prefLength = oldLength + Math.max(minGrowth, prefGrowth); // might overflow
        if (0 < prefLength && prefLength <= SOFT_MAX_ARRAY_LENGTH) {
            return prefLength;
        } else {
            // put code cold in a separate method
            return hugeLength(oldLength, minGrowth);
        }
    }

    private static int hugeLength(int oldLength, int minGrowth) {
        int minLength = oldLength + minGrowth;
        if (minLength < 0) { // overflow
            throw new OutOfMemoryError(
                "Required array length " + oldLength + " + " + minGrowth + " is too large");
        } else if (minLength <= SOFT_MAX_ARRAY_LENGTH) {
            return SOFT_MAX_ARRAY_LENGTH;
        } else {
            return minLength;
        }
    }
```

接下来我们观察下移除元素的方法是否会导致数组的容量发生变化。
```java
    public E remove(int index) {
        Objects.checkIndex(index, size);
        final Object[] es = elementData;

        @SuppressWarnings("unchecked") E oldValue = (E) es[index];
        fastRemove(es, index);

        return oldValue;
    }

    private void fastRemove(Object[] es, int i) {
        modCount++;
        final int newSize;
        if ((newSize = size - 1) > i)
            System.arraycopy(es, i + 1, es, i, newSize - i);
        es[size = newSize] = null;
    }
```

`fastRemove`中`System.arraycopy`使用原数组直接进行了复制，将目标后的元素向前位移一格，但是不会改变数组的容量。


## 迭代中增删元素

在`ArrayList`循环中增删元素正确的方式是使用它的迭代器操作：
```java
    public static void main(String[] args) throws Exception {
        List<String> list = new ArrayList<>();
        list.add("A");
        list.add("A");
        list.add("B");
        remove(list, "A");
        System.out.println(list);
    }

    public static void remove(List<String> list, String element) {
        Iterator<String> iterator = list.iterator();
        while (iterator.hasNext()) {
            if (element.equals(iterator.next())) {
                iterator.remove();
            }
        }
    }

```
输出的结果为：
```shell
[B]
```

这里因为是`Iterator`，所以无法实现在迭代器中添加元素，要用`listIterator`才可以实现。这个实现是在当前元素后执行：
```java
    public static void main(String[] args) throws Exception {
        List<String> list = new ArrayList<>();
        list.add("A");
        list.add("A");
        list.add("B");
        add(list, "A");
        System.out.println(list);
    }

    public static void add(List<String> list, String element) {
        ListIterator<String> iterator = list.listIterator();
        while (iterator.hasNext()) {
            if (element.equals(iterator.next())) {
                iterator.add("C");
            }
        }
    }
```
输出的结果为：
```shell
[A, C, A, C, B]
```

下面再展示一些错误的做法：
```java
    public static void main(String[] args) throws Exception {
        List<String> list = new ArrayList<>();
        list.add("A");
        list.add("A");
        list.add("B");
        remove(list, "A");
        System.out.println(list);
    }

    public static void remove(List<String> list, String element) {
        for(var val: list) {
            if (element.equals(val)) {
                list.remove(element);
            }
        }
    }

```

输出结果为：
```shell
Exception in thread "main" java.util.ConcurrentModificationException
	at java.base/java.util.ArrayList$Itr.checkForComodification(ArrayList.java:1013)
	at java.base/java.util.ArrayList$Itr.next(ArrayList.java:967)
	at org.example.App.remove(App.java:19)
	at org.example.App.main(App.java:14)
```


## subList
这里特别需要注意的`subList`返回的是`SubList`类型，这个类型会和原本的`ArrayList`共享内存空间，实际上各种操作都是操作原数组, 大体区别只是下标做了偏移, 具体看相应的方法实现。
```java
    public List<E> subList(int fromIndex, int toIndex) {
        subListRangeCheck(fromIndex, toIndex, size);
        return new SubList<>(this, fromIndex, toIndex);
    }

    public SubList(ArrayList<E> root, int fromIndex, int toIndex) {
        this.root = root;
        this.parent = null;
        this.offset = fromIndex;
        this.size = toIndex - fromIndex;
        this.modCount = root.modCount;
    }
```

举个例子：
```java
    public static void main(String[] args) throws Exception {
        List<String> list = new ArrayList<>();
        list.add("A");
        list.add("A");
        list.add("B");
        List<String> subList = list.subList(0, list.size());
        subList.add("C");
        System.out.println(list);
    }

```
输出结果为：
```shell
[A, A, B, C]
```

这里缩短一点让`subList`小一点：
```java
    public static void main(String[] args) throws Exception {
        List<String> list = new ArrayList<>();
        list.add("A");
        list.add("A");
        list.add("B");
        List<String> subList = list.subList(0, list.size() - 1);
        subList.add("C");
        System.out.println(list);
    }

```
输出结果为：
```shell
[A, A, C, B]
```