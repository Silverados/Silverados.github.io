# ContactFilter 碰撞过滤器

默认实现的方法逻辑是：
- 首先获取两个夹具的过滤数据 filterA 和 filterB。
- 检查两个夹具是否具有相同的 groupIndex 且该索引不为零：
  - 如果 groupIndex 是正数，则允许碰撞。
  - 如果 groupIndex 是负数，则不允许碰撞。
- 如果 groupIndex 不相同或为零，则通过 maskBits 和 categoryBits 进行进一步检查，确定是否应发生碰撞。

```java
/**
 * Implement this class to provide collision filtering. In other words, you can implement
 * this class if you want finer control over contact creation.
 * 实现此类以提供碰撞过滤。换句话说，如果你想更精细地控制接触的创建，可以实现这个类。
 * 
 * @author Daniel Murphy
 */
public class ContactFilter {

	/**
	 * Return true if contact calculations should be performed between these two shapes.
     * 如果应在这两个形状之间执行接触计算，则返回 true。
	 * @warning for performance reasons this is only called when the AABBs begin to overlap.
     * @警告 出于性能原因，这仅在 AABB 开始重叠时才会调用。
	 * @param fixtureA
	 * @param fixtureB
	 * @return
	 */
	public boolean shouldCollide(Fixture fixtureA, Fixture fixtureB){
		Filter filterA = fixtureA.getFilterData();
		Filter filterB = fixtureB.getFilterData();

		if (filterA.groupIndex == filterB.groupIndex && filterA.groupIndex != 0){
			return filterA.groupIndex > 0;
		}

		boolean collide = (filterA.maskBits & filterB.categoryBits) != 0 &&
						  (filterA.categoryBits & filterB.maskBits) != 0;
		return collide;
	}
}
```

这里我们重点看下`Filter`的实现：
- categoryBits: 指定夹具的类别。通常使用位标志来表示，例如 0x0001 表示类别1，0x0002 表示类别2，依此类推。一个夹具可以属于一个或多个类别。
- maskBits: 指定夹具可以与哪些类别碰撞。通过位运算进行匹配，如果 maskBits 和另一夹具的 categoryBits 有重叠，则允许碰撞。例如，如果 maskBits 为 0x0003，它可以与类别1 (0x0001) 和类别2 (0x0002) 碰撞。
- groupIndex: 允许更精细的控制：
  - 正数：同组中的夹具总是会碰撞。
  - 负数：同组中的夹具永远不会碰撞。
  - 零：表示不属于任何组，使用 categoryBits 和 maskBits 来决定碰撞规则。
```java
public class Filter {
	/**
	 * The collision category bits. Normally you would just set one bit.
	 */
	public int categoryBits;
	
	/**
	 * The collision mask bits. This states the categories that this
	 * shape would accept for collision.
	 */
	public int maskBits;
	
	/**
	 * Collision groups allow a certain group of objects to never collide (negative)
	 * or always collide (positive). Zero means no collision group. Non-zero group
	 * filtering always wins against the mask bits.
	 */
	public int groupIndex;
	
	public Filter() {
	  categoryBits = 0x0001;
      maskBits = 0xFFFF;
      groupIndex = 0;
    }
	
	public void set(Filter argOther) {
		categoryBits = argOther.categoryBits;
		maskBits = argOther.maskBits;
		groupIndex = argOther.groupIndex;
	}
}
```