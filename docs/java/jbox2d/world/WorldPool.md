# WorldPool

## IWorldPool
`IWorldPool` 接口定义了一个用于管理各种对象和数据结构的对象池接口，目的是提高内存分配和回收的效率，减少垃圾回收带来的性能影响。以下是 `IWorldPool` 接口中各个方法的简要说明：

### Contact Stacks
这些方法返回不同类型的 `Contact` 对象的动态栈，主要用于物理引擎中处理不同形状的碰撞检测。

- `getPolyContactStack()`: 获取处理多边形-多边形碰撞的 `Contact` 栈。
- `getCircleContactStack()`: 获取处理圆形-圆形碰撞的 `Contact` 栈。
- `getPolyCircleContactStack()`: 获取处理多边形-圆形碰撞的 `Contact` 栈。
- `getEdgeCircleContactStack()`: 获取处理边缘-圆形碰撞的 `Contact` 栈。
- `getEdgePolyContactStack()`: 获取处理边缘-多边形碰撞的 `Contact` 栈。
- `getChainCircleContactStack()`: 获取处理链形-圆形碰撞的 `Contact` 栈。
- `getChainPolyContactStack()`: 获取处理链形-多边形碰撞的 `Contact` 栈。

### Vector Pools
这些方法用于获取和回收向量对象，避免频繁的对象创建和销毁。

- `popVec2()`: 获取一个 `Vec2` 对象。
- `popVec2(int num)`: 获取指定数量的 `Vec2` 对象数组。
- `pushVec2(int num)`: 回收指定数量的 `Vec2` 对象。
- `popVec3()`: 获取一个 `Vec3` 对象。
- `popVec3(int num)`: 获取指定数量的 `Vec3` 对象数组。
- `pushVec3(int num)`: 回收指定数量的 `Vec3` 对象。

### Matrix Pools
这些方法用于获取和回收矩阵对象。

- `popMat22()`: 获取一个 `Mat22` 对象。
- `popMat22(int num)`: 获取指定数量的 `Mat22` 对象数组。
- `pushMat22(int num)`: 回收指定数量的 `Mat22` 对象。
- `popMat33()`: 获取一个 `Mat33` 对象。
- `pushMat33(int num)`: 回收指定数量的 `Mat33` 对象。

### AABB Pools
这些方法用于获取和回收 AABB (Axis-Aligned Bounding Box) 对象。

- `popAABB()`: 获取一个 `AABB` 对象。
- `popAABB(int num)`: 获取指定数量的 `AABB` 对象数组。
- `pushAABB(int num)`: 回收指定数量的 `AABB` 对象。

### Rotation Pools
这些方法用于获取和回收旋转对象。

- `popRot()`: 获取一个 `Rot` 对象。
- `pushRot(int num)`: 回收指定数量的 `Rot` 对象。

### Utility Methods
这些方法用于获取和回收其他类型的对象和数据结构。

- `getCollision()`: 获取 `Collision` 对象。
- `getTimeOfImpact()`: 获取 `TimeOfImpact` 对象。
- `getDistance()`: 获取 `Distance` 对象。
- `getFloatArray(int argLength)`: 获取指定长度的浮点数组。
- `getIntArray(int argLength)`: 获取指定长度的整型数组。
- `getVec2Array(int argLength)`: 获取指定长度的 `Vec2` 数组。

# DefaultWorldPool
DefaultWorldPool主要是各种池化的实现。其中包含3种结构：
- OrderedStack: 有限个数的池子，不会扩容。参数由World中的WORLD_POOL_SIZE和WORLD_POOL_CONTAINER_SIZE控制。
- MutableStack: 初始为Settings.CONTACT_STACK_INIT_SIZE的池子，每次扩容为原本的2倍。
- HashMap<Integer, E[]>: key为数组容量，value为对应长度容量的数组。
