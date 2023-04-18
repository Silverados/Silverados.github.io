# HashMap详解

这篇文章基于`jdk17`的版本编写。

`HashMap`基于哈希表实现，也就是对`key`进行哈希运算得到在数组中的位置，这个时候如果发生了哈希冲突（即不同的`key`运算得到了相同的地址），在传统的实现方式是将这些值串在一起以链表存储(拉链法)，在`hashmap`的实现里如果链表过大了还会变成一棵树来存储。

`HashMap`是线程不安全的，如果需要线程安全的类可以使用`HashTable`，或者使用`ConcurrentHashMap`，或者用`Collections.synchronizedMap`进行封装。

## 类的声明
`HashMap`的声明如下：
```java
public class HashMap<K,V> extends AbstractMap<K,V>
    implements Map<K,V>, Cloneable, Serializable
```

## 构造方法
`HashMap`的构造方法如下：
- public HashMap(int initialCapacity, float loadFactor)
- public HashMap(int initialCapacity)
- public HashMap()
- public HashMap(Map<? extends K, ? extends V> m)

分析前3个方法的实现可以发现构造方法主要做的是:对`loadFactor`赋值、对`threshold`赋值。如果没传入值`loadFactor`使用`DEFAULT_LOAD_FACTOR`。
第4个方法在这个基础上对传入的参数`m`进行分析得到`threshold`，`loadFactor`同样使用默认值。
这个地方会用`tableSizeFor`将传入的容量变成2的N次方。
在随后的容量分析中我们会看到，默认使用的容量大小为16，扩容因子为0.75，扩容阈值为16*0.75=12.
```java
    static final float DEFAULT_LOAD_FACTOR = 0.75f;
    static final int DEFAULT_INITIAL_CAPACITY = 1 << 4; // aka 16
    int threshold;

    public HashMap(int initialCapacity, float loadFactor) {
        if (initialCapacity < 0)
            throw new IllegalArgumentException("Illegal initial capacity: " +
                                               initialCapacity);
        if (initialCapacity > MAXIMUM_CAPACITY)
            initialCapacity = MAXIMUM_CAPACITY;
        if (loadFactor <= 0 || Float.isNaN(loadFactor))
            throw new IllegalArgumentException("Illegal load factor: " +
                                               loadFactor);
        this.loadFactor = loadFactor;
        this.threshold = tableSizeFor(initialCapacity);
    }

    public HashMap(int initialCapacity) {
        this(initialCapacity, DEFAULT_LOAD_FACTOR);
    }

    public HashMap() {
        this.loadFactor = DEFAULT_LOAD_FACTOR; // all other fields defaulted
    }

    public HashMap(Map<? extends K, ? extends V> m) {
        this.loadFactor = DEFAULT_LOAD_FACTOR;
        putMapEntries(m, false);
    }
```

`tableSizeFor`的实现如下, `Integer.numberOfLeadingZeros`获得整型二进制前导0的个数, 这里减一会让前导的0个数由可能增加一位，例如二进制`100`操作后变成`011`：
```java
    static final int tableSizeFor(int cap) {
        int n = -1 >>> Integer.numberOfLeadingZeros(cap - 1);
        return (n < 0) ? 1 : (n >= MAXIMUM_CAPACITY) ? MAXIMUM_CAPACITY : n + 1;
    }
```
例如`cap`为5, 对应的二进制为`101`,整型有32位, 那么前导0个数为29,`-1`的二进制为32位的1,带符号右移29位得到`1000`即8。

## 数组容量大小相关
我们从上面的构造方法中没有看出来数组被初始化，那么就要联想到在具体使用的时候会进行初始化。 先来看看`put`中和数组容量有关的实现：
- 当`table`没有初始化的时候或者数组大小为0的时候进行`resize`
- 当`size`大于`threshold`是进行`resize`
```java
    public V put(K key, V value) {
        return putVal(hash(key), key, value, false, true);
    }

    transient Node<K,V>[] table;

    final V putVal(int hash, K key, V value, boolean onlyIfAbsent,
                   boolean evict) {
        Node<K,V>[] tab; Node<K,V> p; int n, i;
        if ((tab = table) == null || (n = tab.length) == 0)
            n = (tab = resize()).length;
        if (++size > threshold)
            resize();
        return null;
    }
```

这里赋值`tab`和`n`的写法非常的炫技，但是也会加大一些阅读难度，可以细品一下。

那么关键就是这个`resize`方法：
- 如果原本`table`的大小超过最大容量，将`threshold`设置成最大值，不改变容量。
- 如果原本`table`的大小在0到最大容量之间，容量翻倍，如果这个时候容量没有达到最大值，`threshold`也同步翻倍。
- 如果容量为0并且旧的`threshold`不大于0，那么容量设置为默认的容量，`threshold`设置为`DEFAULT_LOAD_FACTOR * DEFAULT_INITIAL_CAPACITY`。
- 如果容量为0并且旧的`threshold`大于0，容量设置为旧的`threshold`。
```java
    static final int MAXIMUM_CAPACITY = 1 << 30;
    static final float DEFAULT_LOAD_FACTOR = 0.75f;
    static final int DEFAULT_INITIAL_CAPACITY = 1 << 4; // aka 16

    final Node<K,V>[] resize() {
        Node<K,V>[] oldTab = table;
        int oldCap = (oldTab == null) ? 0 : oldTab.length;
        int oldThr = threshold;
        int newCap, newThr = 0;
        if (oldCap > 0) {
            if (oldCap >= MAXIMUM_CAPACITY) {
                threshold = Integer.MAX_VALUE;
                return oldTab;
            }
            else if ((newCap = oldCap << 1) < MAXIMUM_CAPACITY &&
                     oldCap >= DEFAULT_INITIAL_CAPACITY)
                newThr = oldThr << 1; // double threshold
        }
        else if (oldThr > 0) // initial capacity was placed in threshold
            newCap = oldThr;
        else {               // zero initial threshold signifies using defaults
            newCap = DEFAULT_INITIAL_CAPACITY;
            newThr = (int)(DEFAULT_LOAD_FACTOR * DEFAULT_INITIAL_CAPACITY);
        }
        if (newThr == 0) {
            float ft = (float)newCap * loadFactor;
            newThr = (newCap < MAXIMUM_CAPACITY && ft < (float)MAXIMUM_CAPACITY ?
                      (int)ft : Integer.MAX_VALUE);
        }
        threshold = newThr;
        // ...
        return newTab;
    }
```

## put的实现
首先分析`hash`方法，将key的哈希码和自身高16位哈希码进行异或：
```java
    static final int hash(Object key) {
        int h;
        return (key == null) ? 0 : (h = key.hashCode()) ^ (h >>> 16);
    }
```

然后通过上面得到的hash值确认在`table`中的下标:实际上就是`hash % table.length`因为`table.length`是2的N次方可以写成位操作`(table.length - 1) & hash`。
- 如果这个下标为0，那么直接新建一个键值对节点。
- 否则，如果key和当前节点的key相同，那么在随后根据参数`onlyIfAbsent`决定是否替换value。如果不同:
  - 判断该节点是否是树节点，是树节点直接添加到树中。
  - 不是树节点按顺序遍历链表同时计数，到达链表尾部如果计数超出`TREEIFY_THRESHOLD`，则进行`treeifyBin`。

```java
    static final int TREEIFY_THRESHOLD = 8;
    static final int UNTREEIFY_THRESHOLD = 6;
    static final int MIN_TREEIFY_CAPACITY = 64;
    
    public V put(K key, V value) {
        return putVal(hash(key), key, value, false, true);
    }
    
    final V putVal(int hash, K key, V value, boolean onlyIfAbsent,
                   boolean evict) {
        Node<K,V>[] tab; Node<K,V> p; int n, i;
        if ((tab = table) == null || (n = tab.length) == 0)
            n = (tab = resize()).length;
        if ((p = tab[i = (n - 1) & hash]) == null)
            tab[i] = newNode(hash, key, value, null);
        else {
            Node<K,V> e; K k;
            if (p.hash == hash &&
                ((k = p.key) == key || (key != null && key.equals(k))))
                e = p;
            else if (p instanceof TreeNode)
                e = ((TreeNode<K,V>)p).putTreeVal(this, tab, hash, key, value);
            else {
                for (int binCount = 0; ; ++binCount) {
                    if ((e = p.next) == null) {
                        p.next = newNode(hash, key, value, null);
                        if (binCount >= TREEIFY_THRESHOLD - 1) // -1 for 1st
                            treeifyBin(tab, hash);
                        break;
                    }
                    if (e.hash == hash &&
                        ((k = e.key) == key || (key != null && key.equals(k))))
                        break;
                    p = e;
                }
            }
            if (e != null) { // existing mapping for key
                V oldValue = e.value;
                if (!onlyIfAbsent || oldValue == null)
                    e.value = value;
                afterNodeAccess(e);
                return oldValue;
            }
        }
        ++modCount;
        if (++size > threshold)
            resize();
        afterNodeInsertion(evict);
        return null;
    }
```

树化需要满足数组的容量大于`MIN_TREEIFY_CAPACITY`。然后遍历链表将节点从`Node`变成`TreeNode`，因为`Node`里只有`next`，这里换成树节点后需要把`prev`也设置一下。
这里`treeify`的实现就不再展开了。
```java
    final void treeifyBin(Node<K,V>[] tab, int hash) {
        int n, index; Node<K,V> e;
        if (tab == null || (n = tab.length) < MIN_TREEIFY_CAPACITY)
            resize();
        else if ((e = tab[index = (n - 1) & hash]) != null) {
            TreeNode<K,V> hd = null, tl = null;
            do {
                TreeNode<K,V> p = replacementTreeNode(e, null);
                if (tl == null)
                    hd = p;
                else {
                    p.prev = tl;
                    tl.next = p;
                }
                tl = p;
            } while ((e = e.next) != null);
            if ((tab[index] = hd) != null)
                hd.treeify(tab);
        }
    }
```

如果超出阈值进行扩容`resize`容器大小部分已经说过了，现在要把扩容相关的操作说完：
这个过程会遍历整个旧的数组`oldTab`，如果当前节点是:
- 普通的节点, 那么重新计算坐标放入新的数组。
- 链表节点，通过`e.hash & oldCap == 0`将节点分为`lo`和`hi`两种，这个区分如果换成求余的说法比较好理解，原本求余会落在j处，现在数组放大了一倍，求余后要么落在j处,要么落在j + oldCap处。根据这个特效原本的一个链表会裂变成两条，并且保持相应的顺序。
- 树节点, 树节点其实和链表节点类似同样区分`lo`和`hi`，区分后变成两棵树，最后根据树是否小于`UNTREEIFY_THRESHOLD`决定是否要解除。
```java
    final Node<K,V>[] resize() {
        Node<K,V>[] oldTab = table;
        // ...
        Node<K,V>[] newTab = (Node<K,V>[])new Node[newCap];
        table = newTab;
        if (oldTab != null) {
            for (int j = 0; j < oldCap; ++j) {
                Node<K,V> e;
                if ((e = oldTab[j]) != null) {
                    oldTab[j] = null;
                    if (e.next == null)
                        newTab[e.hash & (newCap - 1)] = e;
                    else if (e instanceof TreeNode)
                        ((TreeNode<K,V>)e).split(this, newTab, j, oldCap);
                    else { // preserve order
                        Node<K,V> loHead = null, loTail = null;
                        Node<K,V> hiHead = null, hiTail = null;
                        Node<K,V> next;
                        do {
                            next = e.next;
                            if ((e.hash & oldCap) == 0) {
                                if (loTail == null)
                                    loHead = e;
                                else
                                    loTail.next = e;
                                loTail = e;
                            }
                            else {
                                if (hiTail == null)
                                    hiHead = e;
                                else
                                    hiTail.next = e;
                                hiTail = e;
                            }
                        } while ((e = next) != null);
                        if (loTail != null) {
                            loTail.next = null;
                            newTab[j] = loHead;
                        }
                        if (hiTail != null) {
                            hiTail.next = null;
                            newTab[j + oldCap] = hiHead;
                        }
                    }
                }
            }
        }
        return newTab;
    }
```
