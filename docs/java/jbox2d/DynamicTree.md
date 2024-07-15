# DynamicTree
动态树使用二叉树结构来加速查询，如体积查询和光线投射。叶子节点是带有AABB的代理。
在树中，我们通过_fatAABBFactor扩展代理的AABB，使代理的AABB比客户端对象大。这允许客户端对象在小范围内移动而不触发树更新。

Box2D 使用 DynamicTree 类来有效组织大量图形。该类不了解形状。相反，它对带有用户数据指针的轴对齐包围盒（AABB）进行操作。
动态树是一棵分层的 AABB 树。树中的每个内部节点都有两个子节点。叶节点是单用户 AABB。动态树使用旋转来保持树的平衡，即使在输入退化的情况下也是如此。
树形结构可以实现高效的光线投射和区域查询。例如，场景中可能有数百个形状。您可以通过对每个形状进行光线投射，以蛮力方式对场景进行光线投射。
这样做效率很低，因为它无法利用形状分散的特点。相反，您可以维护一个动态树，并针对该树执行光线投射。这样可以跳过大量的形状，在树中遍历光线。

区域查询使用树来查找与查询 AABB 重叠的所有 AABB 叶。由于可以跳过许多形状，因此这种方法比蛮力方法更快。


## BroadPhaseStrategy
BroadPhaseStrategy接口用于处理宽相位（Broad Phase）碰撞检测的策略。在宽相位中，目标是快速缩小可能发生碰撞的物体对的数量，然后在窄相位（Narrow Phase）中进行更精细的碰撞检测。
这个接口定义了一些基本操作，如创建和销毁代理、移动代理、查询AABB、光线投射等。

### 节点操作
#### 创建代理
```java
  /**
   * Create a proxy. Provide a tight fitting AABB and a userData pointer.
   * 创建一个代理。提供一个紧密贴合的AABB和一个userData指针。
   * 
   * @param aabb
   * @param userData
   * @return 返回代理的ID。
   */
  int createProxy(AABB aabb, Object userData);
```

#### 销毁代理
```java
  void destroyProxy(int proxyId);
```

#### 移动代理
```java
  /**
   * Move a proxy with a swepted AABB. If the proxy has moved outside of its fattened AABB, then the
   * proxy is removed from the tree and re-inserted. Otherwise the function returns immediately.
   * 使用一个移动后的AABB移动代理。如果代理移动到了扩展的AABB之外，则将代理从树中移除并重新插入。否则，该函数立即返回。
   * 
   * @return true if the proxy was re-inserted. 如果代理被重新插入，则返回true。
   */
  boolean moveProxy(int proxyId, AABB aabb, Vec2 displacement);
```

### 获取userdata
```java
  /**
   * Get the user data associated with a proxy.
   * 获取与代理关联的用户数据。
   * 
   * @param proxyId 代理的ID。
   * @return 用户数据。
   */
  Object getUserData(int proxyId);
```

### AABB和查询操作
获取拓展的AABB。
```java
  /**
   * Get the fattened AABB for a proxy.
   * 获取代理的扩展AABB。
   * 
   * @param proxyId 代理的ID。
   * @return 扩展的AABB。
   */
  AABB getFatAABB(int proxyId);
```

AABB查询。
```java
  /**
   * Query an AABB for overlapping proxies. The callback class is called for each proxy that
   * overlaps the supplied AABB.
   * 查询与AABB重叠的代理。对于每个重叠的代理，将调用回调类。
   * 
   * @param callback 回调接口。
   * @param aabb 查询的AABB。
   */
  void query(TreeCallback callback, AABB aabb);
```

射线查询。
```java
  /**
   * Ray-cast against the proxies in the tree. This relies on the callback to perform an exact
   * ray-cast in the case where the proxy contains a shape. The callback also performs any
   * collision filtering. This has performance roughly equal to k * log(n), where k is the number of
   * collisions and n is the number of proxies in the tree.
   * 对树中的代理进行光线投射。依赖回调来执行精确的光线投射，并进行任何碰撞过滤。性能约等于 k * log(n)，其中 k 是碰撞数量，n 是树中的代理数量。
   * 
   * @param input 光线投射的输入数据。光线从 p1 延伸到 p1 + maxFraction * (p2 - p1)。
   * @param callback 对每个被光线击中的代理调用的回调类。
   */
  void raycast(TreeRayCastCallback callback, RayCastInput input);
```

### 获取树的信息
计算树的高度。
```java
  /**
   * Compute the height of the tree.
   * 计算树的高度。
   */
  int computeHeight();
```

```java
  /**
   * Compute the height of the binary tree in O(N) time. Should not be called often.
   * 在O(N)时间内计算二叉树的高度。不应经常调用。
   * 
   * @return 树的高度。
   */
  int getHeight();
```

获取树的平衡度。
```java
  /**
   * Get the maximum balance of a node in the tree. The balance is the difference in height of the
   * two children of a node.
   * 获取树中节点的最大平衡度。平衡度是一个节点的两个子节点高度的差异。
   * 
   * @return 最大平衡度。
   */
  int getMaxBalance();
```

获取节点面积总和与根节点面积的比率。
```java
  /**
   * Get the ratio of the sum of the node areas to the root area.
   * 获取节点面积总和与根节点面积的比率。
   * 
   * @return 面积比率。
   */
  float getAreaRatio();
```

### 绘制树
```java
  /**
   * Draw the tree.
   * 绘制树。
   * 
   * @param draw 调试绘制对象。
   */
  void drawTree(DebugDraw draw);
```

## DynamicTreeNode
### 字段解析：
- `aabb`：一个 `AABB` 对象，用于存储节点的轴对齐边界框。
- `userData`：存储与节点相关的用户数据。
- `parent`：指向该节点的父节点。
- `child1`：指向该节点的第一个子节点。
- `child2`：指向该节点的第二个子节点。
- `id`：节点的唯一标识符。
- `height`：节点的高度，用于计算树的平衡。

```java
  public final AABB aabb = new AABB();

  public Object userData;

  protected DynamicTreeNode parent;

  protected DynamicTreeNode child1;
  protected DynamicTreeNode child2;
  protected final int id;
  protected int height;
```

## DynamicTree

### 字段解析
- `MAX_STACK_SIZE`：最大堆栈大小，用于深度优先搜索等操作。
- `NULL_NODE`：表示空节点或无效节点的常量值。
- `m_root`：动态树的根节点。
- `m_nodes`：用于存储动态树节点的数组。
- `m_nodeCount`：当前树中的节点计数。
- `m_nodeCapacity`：节点数组的容量，即节点数组能存储的最大节点数量。
- `m_freeList`：指向空闲节点链表的头部，用于快速分配和释放节点。
- `drawVecs`：用于绘制或调试的向量数组。
- `nodeStack`：用于存储节点的堆栈数组，通常用于遍历树等操作。
- `nodeStackIndex`：当前堆栈的索引或指针，指示堆栈顶部的位置。

```java
  public static final int MAX_STACK_SIZE = 64;
  public static final int NULL_NODE = -1;

  private DynamicTreeNode m_root;
  private DynamicTreeNode[] m_nodes;
  private int m_nodeCount;
  private int m_nodeCapacity;

  private int m_freeList;

  private final Vec2[] drawVecs = new Vec2[4];
  private DynamicTreeNode[] nodeStack = new DynamicTreeNode[20];
  private int nodeStackIndex = 0;
```

### 构造方法
构造方法中，对空闲节点进行了预内存分配。这里默认是16的节点，但是在实际上在一个场景中节点数量会远远多于这个数量。类似于hashmap的实现，应该添加传递支持初始容量的构造方法。
```java
  public DynamicTree() {
    m_root = null;
    m_nodeCount = 0;
    m_nodeCapacity = 16;
    m_nodes = new DynamicTreeNode[16];

    // Build a linked list for the free list.
    for (int i = m_nodeCapacity - 1; i >= 0; i--) {
      m_nodes[i] = new DynamicTreeNode(i);
      m_nodes[i].parent = (i == m_nodeCapacity - 1) ? null : m_nodes[i + 1];
      m_nodes[i].height = -1;
    }
    m_freeList = 0;

    for (int i = 0; i < drawVecs.length; i++) {
      drawVecs[i] = new Vec2();
    }
  }
```

### 节点操作

#### 创建代理
1. 获取空闲的链表节点。
2. 给节点的属性赋值。
3. 插入到树中。

```java
  @Override
  public final int createProxy(final AABB aabb, Object userData) {
    assert(aabb.isValid());
    final DynamicTreeNode node = allocateNode();
    int proxyId = node.id;
    // Fatten the aabb
    final AABB nodeAABB = node.aabb;
    nodeAABB.lowerBound.x = aabb.lowerBound.x - Settings.aabbExtension;
    nodeAABB.lowerBound.y = aabb.lowerBound.y - Settings.aabbExtension;
    nodeAABB.upperBound.x = aabb.upperBound.x + Settings.aabbExtension;
    nodeAABB.upperBound.y = aabb.upperBound.y + Settings.aabbExtension;
    node.userData = userData;

    insertLeaf(proxyId);

    return proxyId;
  }
```

分配节点：
1. 检查空闲列表是否为空，如果为空的话，扩展数组节点容量为原本的2倍。
2. 从空闲列表中拿一个节点出来初始化返回。

```java
  private final DynamicTreeNode allocateNode() {
    if (m_freeList == NULL_NODE) {
        assert (m_nodeCount == m_nodeCapacity);

        DynamicTreeNode[] old = m_nodes;
        m_nodeCapacity *= 2;
        m_nodes = new DynamicTreeNode[m_nodeCapacity];
        System.arraycopy(old, 0, m_nodes, 0, old.length);

        // Build a linked list for the free list.
        for (int i = m_nodeCapacity - 1; i >= m_nodeCount; i--) {
            m_nodes[i] = new DynamicTreeNode(i);
            m_nodes[i].parent = (i == m_nodeCapacity - 1) ? null : m_nodes[i + 1];
            m_nodes[i].height = -1;
        }
        m_freeList = m_nodeCount;
    }
    int nodeId = m_freeList;
    final DynamicTreeNode treeNode = m_nodes[nodeId];
    m_freeList = treeNode.parent != null ? treeNode.parent.id : NULL_NODE;

    treeNode.parent = null;
    treeNode.child1 = null;
    treeNode.child2 = null;
    treeNode.height = 0;
    treeNode.userData = null;
    ++m_nodeCount;
    return treeNode;
}
```

插入节点： 
1. 检查树根是否为空：如果树是空的，那么新叶子节点就成为树根，并设置其父节点为空。
2. 寻找最佳兄弟节点：
   - 获取要插入叶子节点的AABB。
   - 从根节点开始，遍历树，寻找插入位置。通过比较每个节点的子节点，选择合适的子节点进行深入查找。
   - 计算不同情况下的代价，并选择代价最小的子节点继续深入。
3. 插入叶子节点：
   - 找到合适的兄弟节点后，创建一个新的父节点。
   - 设置新的父节点的AABB为叶子节点和兄弟节点的合并AABB。
   - 更新兄弟节点和叶子节点的父节点指向新的父节点。  
   - 如果兄弟节点的父节点不为空，则更新其指向新的父节点。
   - 如果兄弟节点的父节点为空，则新的父节点成为树根。
4. 回溯更新树：
   - 从新插入的节点开始，向上回溯，更新每个节点的高度和AABB。
   - 在回溯过程中，保持树的平衡。
   - 直到回溯到树根。
```java
  private final void insertLeaf(int leaf_index) {
    DynamicTreeNode leaf = m_nodes[leaf_index];
    if (m_root == null) {
      m_root = leaf;
      m_root.parent = null;
      return;
    }

    // find the best sibling
    AABB leafAABB = leaf.aabb;
    DynamicTreeNode index = m_root;
    while (index.child1 != null) {
      final DynamicTreeNode node = index;
      DynamicTreeNode child1 = node.child1;
      DynamicTreeNode child2 = node.child2;

      float area = node.aabb.getPerimeter();

      combinedAABB.combine(node.aabb, leafAABB);
      float combinedArea = combinedAABB.getPerimeter();

      // Cost of creating a new parent for this node and the new leaf
      float cost = 2.0f * combinedArea;

      // Minimum cost of pushing the leaf further down the tree
      float inheritanceCost = 2.0f * (combinedArea - area);

      // Cost of descending into child1
      float cost1;
      if (child1.child1 == null) {
        combinedAABB.combine(leafAABB, child1.aabb);
        cost1 = combinedAABB.getPerimeter() + inheritanceCost;
      } else {
        combinedAABB.combine(leafAABB, child1.aabb);
        float oldArea = child1.aabb.getPerimeter();
        float newArea = combinedAABB.getPerimeter();
        cost1 = (newArea - oldArea) + inheritanceCost;
      }

      // Cost of descending into child2
      float cost2;
      if (child2.child1 == null) {
        combinedAABB.combine(leafAABB, child2.aabb);
        cost2 = combinedAABB.getPerimeter() + inheritanceCost;
      } else {
        combinedAABB.combine(leafAABB, child2.aabb);
        float oldArea = child2.aabb.getPerimeter();
        float newArea = combinedAABB.getPerimeter();
        cost2 = newArea - oldArea + inheritanceCost;
      }

      // Descend according to the minimum cost.
      if (cost < cost1 && cost < cost2) {
        break;
      }

      // Descend
      if (cost1 < cost2) {
        index = child1;
      } else {
        index = child2;
      }
    }

    DynamicTreeNode sibling = index;
    DynamicTreeNode oldParent = m_nodes[sibling.id].parent;
    final DynamicTreeNode newParent = allocateNode();
    newParent.parent = oldParent;
    newParent.userData = null;
    newParent.aabb.combine(leafAABB, sibling.aabb);
    newParent.height = sibling.height + 1;

    if (oldParent != null) {
      // The sibling was not the root.
      if (oldParent.child1 == sibling) {
        oldParent.child1 = newParent;
      } else {
        oldParent.child2 = newParent;
      }

      newParent.child1 = sibling;
      newParent.child2 = leaf;
      sibling.parent = newParent;
      leaf.parent = newParent;
    } else {
      // The sibling was the root.
      newParent.child1 = sibling;
      newParent.child2 = leaf;
      sibling.parent = newParent;
      leaf.parent = newParent;
      m_root = newParent;
    }

    // Walk back up the tree fixing heights and AABBs
    index = leaf.parent;
    while (index != null) {
      index = balance(index);

      DynamicTreeNode child1 = index.child1;
      DynamicTreeNode child2 = index.child2;

      assert (child1 != null);
      assert (child2 != null);

      index.height = 1 + MathUtils.max(child1.height, child2.height);
      index.aabb.combine(child1.aabb, child2.aabb);

      index = index.parent;
    }
    // validate();
  }

```

#### 销毁代理
```java
  @Override
  public final void destroyProxy(int proxyId) {
    assert (0 <= proxyId && proxyId < m_nodeCapacity);
    DynamicTreeNode node = m_nodes[proxyId];
    assert (node.child1 == null);

    removeLeaf(node);
    freeNode(node);
  }
```

```java
  private final void removeLeaf(DynamicTreeNode leaf) {
    if (leaf == m_root) {
      m_root = null;
      return;
    }

    DynamicTreeNode parent = leaf.parent;
    DynamicTreeNode grandParent = parent.parent;
    DynamicTreeNode sibling;
    if (parent.child1 == leaf) {
      sibling = parent.child2;
    } else {
      sibling = parent.child1;
    }

    if (grandParent != null) {
      // Destroy parent and connect sibling to grandParent.
      if (grandParent.child1 == parent) {
        grandParent.child1 = sibling;
      } else {
        grandParent.child2 = sibling;
      }
      sibling.parent = grandParent;
      freeNode(parent);

      // Adjust ancestor bounds.
      DynamicTreeNode index = grandParent;
      while (index != null) {
        index = balance(index);

        DynamicTreeNode child1 = index.child1;
        DynamicTreeNode child2 = index.child2;

        index.aabb.combine(child1.aabb, child2.aabb);
        index.height = 1 + MathUtils.max(child1.height, child2.height);

        index = index.parent;
      }
    } else {
      m_root = sibling;
      sibling.parent = null;
      freeNode(parent);
    }

    // validate();
  }
```

node释放后回到池子中。
```java
  private final void freeNode(DynamicTreeNode node) {
    assert (node != null);
    assert (0 < m_nodeCount);
    node.parent = m_freeList != NULL_NODE ? m_nodes[m_freeList] : null;
    node.height = -1;
    m_freeList = node.id;
    m_nodeCount--;
  }
```

平衡树:
这个 `balance` 方法实现了动态AABB树（Dynamic AABB Tree）的平衡操作，主要用于平衡二叉树的高度，以确保树的结构平衡，从而提高查询和更新操作的效率。具体来说，它使用了类似AVL树和红黑树的旋转操作来维护树的平衡。
```java
  // Perform a left or right rotation if node A is imbalanced.
  // Returns the new root index.
  private DynamicTreeNode balance(DynamicTreeNode iA) {
    assert (iA != null);

    DynamicTreeNode A = iA;
    if (A.child1 == null || A.height < 2) {
      return iA;
    }

    DynamicTreeNode iB = A.child1;
    DynamicTreeNode iC = A.child2;
    assert (0 <= iB.id && iB.id < m_nodeCapacity);
    assert (0 <= iC.id && iC.id < m_nodeCapacity);

    DynamicTreeNode B = iB;
    DynamicTreeNode C = iC;

    int balance = C.height - B.height;

    // Rotate C up
    if (balance > 1) {
      DynamicTreeNode iF = C.child1;
      DynamicTreeNode iG = C.child2;
      DynamicTreeNode F = iF;
      DynamicTreeNode G = iG;
      assert (F != null);
      assert (G != null);
      assert (0 <= iF.id && iF.id < m_nodeCapacity);
      assert (0 <= iG.id && iG.id < m_nodeCapacity);

      // Swap A and C
      C.child1 = iA;
      C.parent = A.parent;
      A.parent = iC;

      // A's old parent should point to C
      if (C.parent != null) {
        if (C.parent.child1 == iA) {
          C.parent.child1 = iC;
        } else {
          assert (C.parent.child2 == iA);
          C.parent.child2 = iC;
        }
      } else {
        m_root = iC;
      }

      // Rotate
      if (F.height > G.height) {
        C.child2 = iF;
        A.child2 = iG;
        G.parent = iA;
        A.aabb.combine(B.aabb, G.aabb);
        C.aabb.combine(A.aabb, F.aabb);

        A.height = 1 + MathUtils.max(B.height, G.height);
        C.height = 1 + MathUtils.max(A.height, F.height);
      } else {
        C.child2 = iG;
        A.child2 = iF;
        F.parent = iA;
        A.aabb.combine(B.aabb, F.aabb);
        C.aabb.combine(A.aabb, G.aabb);

        A.height = 1 + MathUtils.max(B.height, F.height);
        C.height = 1 + MathUtils.max(A.height, G.height);
      }

      return iC;
    }

    // Rotate B up
    if (balance < -1) {
      DynamicTreeNode iD = B.child1;
      DynamicTreeNode iE = B.child2;
      DynamicTreeNode D = iD;
      DynamicTreeNode E = iE;
      assert (0 <= iD.id && iD.id < m_nodeCapacity);
      assert (0 <= iE.id && iE.id < m_nodeCapacity);

      // Swap A and B
      B.child1 = iA;
      B.parent = A.parent;
      A.parent = iB;

      // A's old parent should point to B
      if (B.parent != null) {
        if (B.parent.child1 == iA) {
          B.parent.child1 = iB;
        } else {
          assert (B.parent.child2 == iA);
          B.parent.child2 = iB;
        }
      } else {
        m_root = iB;
      }

      // Rotate
      if (D.height > E.height) {
        B.child2 = iD;
        A.child1 = iE;
        E.parent = iA;
        A.aabb.combine(C.aabb, E.aabb);
        B.aabb.combine(A.aabb, D.aabb);

        A.height = 1 + MathUtils.max(C.height, E.height);
        B.height = 1 + MathUtils.max(A.height, D.height);
      } else {
        B.child2 = iE;
        A.child1 = iD;
        D.parent = iA;
        A.aabb.combine(C.aabb, D.aabb);
        B.aabb.combine(A.aabb, E.aabb);

        A.height = 1 + MathUtils.max(C.height, D.height);
        B.height = 1 + MathUtils.max(A.height, E.height);
      }

      return iB;
    }

    return iA;
  }

```

### 查询方法
查询中不断往子节点递归，如果重叠会调用回调方法。

这里，每次会往nodeStack写入两个节点，意味着如果树高为10就会进行扩容，树高10的话实际上大概就1024个节点。但是这么高的深度意味着它和多数的也节点都会重叠，做法可能有问题。
```java
  @Override
  public final void query(TreeCallback callback, AABB aabb) {
    assert(aabb.isValid());
    nodeStackIndex = 0;
    nodeStack[nodeStackIndex++] = m_root;

    while (nodeStackIndex > 0) {
      DynamicTreeNode node = nodeStack[--nodeStackIndex];
      if (node == null) {
        continue;
      }

      if (AABB.testOverlap(node.aabb, aabb)) {
        if (node.child1 == null) {
          boolean proceed = callback.treeCallback(node.id);
          if (!proceed) {
            return;
          }
        } else {
          if (nodeStack.length - nodeStackIndex - 2 <= 0) {
            DynamicTreeNode[] newBuffer = new DynamicTreeNode[nodeStack.length * 2];
            System.arraycopy(nodeStack, 0, newBuffer, 0, nodeStack.length);
            nodeStack = newBuffer;
          }
          nodeStack[nodeStackIndex++] = node.child1;
          nodeStack[nodeStackIndex++] = node.child2;
        }
      }
    }
  }
```


```java
  @Override
  public void raycast(TreeRayCastCallback callback, RayCastInput input) {
    final Vec2 p1 = input.p1;
    final Vec2 p2 = input.p2;
    float p1x = p1.x, p2x = p2.x, p1y = p1.y, p2y = p2.y;
    float vx, vy;
    float rx, ry;
    float absVx, absVy;
    float cx, cy;
    float hx, hy;
    float tempx, tempy;
    r.x = p2x - p1x;
    r.y = p2y - p1y;
    assert ((r.x * r.x + r.y * r.y) > 0f);
    r.normalize();
    rx = r.x;
    ry = r.y;

    // v is perpendicular to the segment.
    vx = -1f * ry;
    vy = 1f * rx;
    absVx = MathUtils.abs(vx);
    absVy = MathUtils.abs(vy);

    // Separating axis for segment (Gino, p80).
    // |dot(v, p1 - c)| > dot(|v|, h)

    float maxFraction = input.maxFraction;

    // Build a bounding box for the segment.
    final AABB segAABB = aabb;
    // Vec2 t = p1 + maxFraction * (p2 - p1);
    // before inline
    // temp.set(p2).subLocal(p1).mulLocal(maxFraction).addLocal(p1);
    // Vec2.minToOut(p1, temp, segAABB.lowerBound);
    // Vec2.maxToOut(p1, temp, segAABB.upperBound);
    tempx = (p2x - p1x) * maxFraction + p1x;
    tempy = (p2y - p1y) * maxFraction + p1y;
    segAABB.lowerBound.x = p1x < tempx ? p1x : tempx;
    segAABB.lowerBound.y = p1y < tempy ? p1y : tempy;
    segAABB.upperBound.x = p1x > tempx ? p1x : tempx;
    segAABB.upperBound.y = p1y > tempy ? p1y : tempy;
    // end inline

    nodeStackIndex = 0;
    nodeStack[nodeStackIndex++] = m_root;
    while (nodeStackIndex > 0) {
      final DynamicTreeNode node = nodeStack[--nodeStackIndex];
      if (node == null) {
        continue;
      }

      final AABB nodeAABB = node.aabb;
      if (!AABB.testOverlap(nodeAABB, segAABB)) {
        continue;
      }

      // Separating axis for segment (Gino, p80).
      // |dot(v, p1 - c)| > dot(|v|, h)
      // node.aabb.getCenterToOut(c);
      // node.aabb.getExtentsToOut(h);
      cx = (nodeAABB.lowerBound.x + nodeAABB.upperBound.x) * .5f;
      cy = (nodeAABB.lowerBound.y + nodeAABB.upperBound.y) * .5f;
      hx = (nodeAABB.upperBound.x - nodeAABB.lowerBound.x) * .5f;
      hy = (nodeAABB.upperBound.y - nodeAABB.lowerBound.y) * .5f;
      tempx = p1x - cx;
      tempy = p1y - cy;
      float separation = MathUtils.abs(vx * tempx + vy * tempy) - (absVx * hx + absVy * hy);
      if (separation > 0.0f) {
        continue;
      }

      if (node.child1 == null) {
        subInput.p1.x = p1x;
        subInput.p1.y = p1y;
        subInput.p2.x = p2x;
        subInput.p2.y = p2y;
        subInput.maxFraction = maxFraction;

        float value = callback.raycastCallback(subInput, node.id);

        if (value == 0.0f) {
          // The client has terminated the ray cast.
          return;
        }

        if (value > 0.0f) {
          // Update segment bounding box.
          maxFraction = value;
          // temp.set(p2).subLocal(p1).mulLocal(maxFraction).addLocal(p1);
          // Vec2.minToOut(p1, temp, segAABB.lowerBound);
          // Vec2.maxToOut(p1, temp, segAABB.upperBound);
          tempx = (p2x - p1x) * maxFraction + p1x;
          tempy = (p2y - p1y) * maxFraction + p1y;
          segAABB.lowerBound.x = p1x < tempx ? p1x : tempx;
          segAABB.lowerBound.y = p1y < tempy ? p1y : tempy;
          segAABB.upperBound.x = p1x > tempx ? p1x : tempx;
          segAABB.upperBound.y = p1y > tempy ? p1y : tempy;
        }
      } else {
        if (nodeStack.length - nodeStackIndex - 2 <= 0) {
          DynamicTreeNode[] newBuffer = new DynamicTreeNode[nodeStack.length * 2];
          System.arraycopy(nodeStack, 0, newBuffer, 0, nodeStack.length);
          nodeStack = newBuffer;
        }
        nodeStack[nodeStackIndex++] = node.child1;
        nodeStack[nodeStackIndex++] = node.child2;
      }
    }
  }
```