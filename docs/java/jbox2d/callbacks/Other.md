# DestructionListener
用于处理关节和夹具在其关联的物体被销毁时的清理工作。通过实现此接口，你可以在关节和夹具被销毁时将其引用设为空，以避免内存泄漏或无效引用。

```java
/**
 * Joints and fixtures are destroyed when their associated
 * body is destroyed. Implement this listener so that you
 * may nullify references to these joints and shapes.
 * @author Daniel Murphy
 */
public interface DestructionListener {
	
	/**
	 * Called when any joint is about to be destroyed due
	 * to the destruction of one of its attached bodies.
	 * @param joint
	 */
	void sayGoodbye(Joint joint);
	
	/**
	 * Called when any fixture is about to be destroyed due
	 * to the destruction of its parent body.
	 * @param fixture
	 */
	void sayGoodbye(Fixture fixture);
}
```


# PairCallback
PairCallback 接口用于处理成对对象的操作，通常在碰撞检测或物理模拟中使用。当检测到两个对象成对出现时，会调用 addPair 方法。
```java
public interface PairCallback {
	public void addPair(Object userDataA, Object userDataB);
}

```

# ParticleDestructionListener 
ParticleDestructionListener 接口用于处理粒子在被销毁时的相关操作。
```java
public interface ParticleDestructionListener {
  /**
   * Called when any particle group is about to be destroyed.
   */
  void sayGoodbye(ParticleGroup group);

  /**
   * Called when a particle is about to be destroyed. The index can be used in conjunction with
   * {@link World#getParticleUserDataBuffer} to determine which particle has been destroyed.
   * 
   * @param index
   */
  void sayGoodbye(int index);
}
```

# ParticleQueryCallback
用于处理粒子查询的回调。在粒子系统中，查询通常用于检测哪些粒子满足某些条件。通过实现此接口，你可以在每个满足条件的粒子上执行特定操作。

```java
public interface ParticleQueryCallback {
  /**
   * Called for each particle found in the query AABB.
   * 
   * @return false to terminate the query.
   */
  boolean reportParticle(int index);
}
```

# ParticleRaycastCallback
ParticleRaycastCallback 接口用于处理粒子光线投射的回调。在粒子系统中，光线投射（Raycasting）用于检测光线与粒子的交点。通过实现此接口，你可以在每个与光线相交的粒子上执行特定操作。
```java
public interface ParticleRaycastCallback {
  /**
   * Called for each particle found in the query. See
   * {@link RayCastCallback#reportFixture(org.jbox2d.dynamics.Fixture, Vec2, Vec2, float)} for
   * argument info.
   * 
   * @param index
   * @param point
   * @param normal
   * @param fraction
   * @return
   */
  float reportParticle(int index, Vec2 point, Vec2 normal, float fraction);

}

```

# QueryCallback
QueryCallback 接口用于处理轴对齐边界框（AABB）查询的回调。在物理引擎中，AABB查询用于检测哪些物体（fixtures）位于特定的区域内。通过实现此接口，你可以在每个查询到的物体上执行特定操作。

reportFixture对每个在查询AABB中的Fixture调用该方法，返回false会终止查询，返回true会继续查询。
```java

/**
 * Callback class for AABB queries.
 * See {@link World#queryAABB(QueryCallback, org.jbox2d.collision.AABB)}.
 * @author Daniel Murphy
 */
public interface QueryCallback {

	/**
	 * Called for each fixture found in the query AABB.
	 * @param fixture
	 * @return false to terminate the query.
	 */
	public boolean reportFixture(Fixture fixture);
}
```

调用在World中：
```java
  public void queryAABB(QueryCallback callback, AABB aabb) {
    wqwrapper.broadPhase = m_contactManager.m_broadPhase;
    wqwrapper.callback = callback;
    m_contactManager.m_broadPhase.query(wqwrapper, aabb);
  }
```

# RayCastCallback
射线投射回调接口。

reportFixture(Fixture fixture, Vec2 point, Vec2 normal, float fraction):
在每个与光线相交的物体上调用此方法。
- 参数 fixture 是与光线相交的物体。
- 参数 point 是光线与物体相交的点。
- 参数 normal 是光线与物体相交点处的法线。
- 参数 fraction 是光线到相交点的比例。
- 返回一个浮点值，通常用于决定是否继续光线投射：
  -  返回 0 表示终止光线投射。  
  -  返回 1 表示继续光线投射。  
  -  返回一个介于 0 和 1 之间的值表示光线投射到该比例位置并停止。  
  
```java
/**
 * Callback class for ray casts.
 * See {@link World#raycast(RayCastCallback, Vec2, Vec2)}
 * @author Daniel Murphy
 */
public interface RayCastCallback {

	/**
	 * Called for each fixture found in the query. You control how the ray cast
	 * proceeds by returning a float:
	 * return -1: ignore this fixture and continue
	 * return 0: terminate the ray cast
	 * return fraction: clip the ray to this point
	 * return 1: don't clip the ray and continue
	 * @param fixture the fixture hit by the ray
	 * @param point the point of initial intersection
	 * @param normal the normal vector at the point of intersection
	 * @return -1 to filter, 0 to terminate, fraction to clip the ray for
	 * closest hit, 1 to continue
	 * @param fraction
	 */
	public float reportFixture(Fixture fixture, Vec2 point, Vec2 normal, float fraction);
}
```

调用在World中：
```java
  public void raycast(RayCastCallback callback, Vec2 point1, Vec2 point2) {
    wrcwrapper.broadPhase = m_contactManager.m_broadPhase;
    wrcwrapper.callback = callback;
    input.maxFraction = 1.0f;
    input.p1.set(point1);
    input.p2.set(point2);
    m_contactManager.m_broadPhase.raycast(wrcwrapper, input);
  }
```

# TreeCallback 
接口用于处理空间划分树（如四叉树或八叉树）中的回调操作。

```java
/**
 * callback for {@link DynamicTree}
 * @author Daniel Murphy
 *
 */
public interface TreeCallback {
	
	/**
	 * Callback from a query request.  
	 * @param proxyId the id of the proxy
	 * @return if the query should be continued
	 */
	public boolean treeCallback(int proxyId);
}

```

# TreeRayCastCallback
处理空间划分树（如四叉树或八叉树）中的光线投射回调操作。
```java
/**
 * callback for {@link DynamicTree}
 * @author Daniel Murphy
 *
 */
public interface TreeRayCastCallback {
	/**
	 * 
	 * @param input
	 * @param nodeId
	 * @return the fraction to the node
	 */
	public float raycastCallback( RayCastInput input, int nodeId);
}
```