# ContactListener
实现此接口以获取接触信息，这些信息可用于声音和游戏逻辑等。实现此接口以获取接触信息，这些信息可用于声音和游戏逻辑等。
也可以在时间步长之后遍历接触列表来获取接触结果，但可能会漏掉一些接触，因为连续物理计算可能会导致子步长。
在单个时间步长内，您可能会收到同一接触的多次回调，因此应尽量使回调函数高效，因为每个时间步长可能会有很多回调。
注意，不要在回调中创建/销毁 Box2D 实体。

包含以下几个方法：
- beginContact(Contact contact): 当两个fixture开始接触时调用。
- endContact(Contact contact): 当两个fixture停止接触时调用。
- preSolve(Contact contact, Manifold oldManifold): 在接触更新后调用。这允许在接触送入求解器之前检查接触。 如果操作小心，可以修改接触流形，例如禁用某些接触点。这对于控制碰撞检测和响应非常有用。
  - 提供旧的接触流形副本，以便检测接触变化。
  - 仅对醒着的物体调用。
  - 即使接触点数量为零，也会调用此方法。
  - 不会对传感器调用。
  - 如果将接触点数量设置为零，将不会收到 endContact 回调。然而，在下一步可能会再次收到 beginContact 回调。
- postSolve(Contact contact, ContactImpulse impulse): 在求解器完成后调用。这对检查冲量非常有用。
  - 接触流形不包括时间撞击冲量（TOI），因为如果子步长很小，TOI 冲量可能会非常大。因此，冲量信息被明确地提供在一个单独的数据结构中。
  - 仅对接触中的、固体的并且醒着的物体调用。


```java
/**
 * Implement this class to get contact information. You can use these results for
 * things like sounds and game logic. You can also get contact results by
 * traversing the contact lists after the time step. However, you might miss
 * some contacts because continuous physics leads to sub-stepping.
 * Additionally you may receive multiple callbacks for the same contact in a
 * single time step.
 * You should strive to make your callbacks efficient because there may be
 * many callbacks per time step.
 * @warning You cannot create/destroy Box2D entities inside these callbacks.
 * @author Daniel Murphy
 *
 */
public interface ContactListener {

	/**
	 * Called when two fixtures begin to touch.
	 * @param contact
	 */
	public void beginContact(Contact contact);
	
	/**
	 * Called when two fixtures cease to touch.
	 * @param contact
	 */
	public void endContact(Contact contact);
	
	/**
	 * This is called after a contact is updated. This allows you to inspect a
	 * contact before it goes to the solver. If you are careful, you can modify the
	 * contact manifold (e.g. disable contact).
	 * A copy of the old manifold is provided so that you can detect changes.
	 * Note: this is called only for awake bodies.
	 * Note: this is called even when the number of contact points is zero.
	 * Note: this is not called for sensors.
	 * Note: if you set the number of contact points to zero, you will not
	 * get an EndContact callback. However, you may get a BeginContact callback
	 * the next step.
	 * Note: the oldManifold parameter is pooled, so it will be the same object for every callback
	 * for each thread.
	 * @param contact
	 * @param oldManifold
	 */
	public void preSolve(Contact contact, Manifold oldManifold);
	
	/**
	 * This lets you inspect a contact after the solver is finished. This is useful
	 * for inspecting impulses.
	 * Note: the contact manifold does not include time of impact impulses, which can be
	 * arbitrarily large if the sub-step is small. Hence the impulse is provided explicitly
	 * in a separate data structure.
	 * Note: this is only called for contacts that are touching, solid, and awake.
	 * @param contact
	 * @param impulse this is usually a pooled variable, so it will be modified after
	 * this call
	 */
	public void postSolve(Contact contact, ContactImpulse impulse);
}

```

## Contract
这个类管理两个shape之间的碰撞。一个接触对象存在于两个形状的轴对齐边界框（AABB）重叠的情况下，即使没有实际的接触点。

### 字段

#### 标记位
- ISLAND_FLAG：用于在形成孤岛时遍历接触图。
- TOUCHING_FLAG：在形状接触时设置。
- ENABLED_FLAG：可以由用户禁用的接触。
- FILTER_FLAG：需要过滤的接触，因为夹具过滤器已更改。
- BULLET_HIT_FLAG：这个子弹接触发生了TOI（时间撞击）事件。
- TOI_FLAG：标志接触包含时间撞击信息。

代码如下：
```java
  // Flags stored in m_flags
// Used when crawling contact graph when forming islands.
public static final int ISLAND_FLAG = 0x0001;
// Set when the shapes are touching.
public static final int TOUCHING_FLAG = 0x0002;
// This contact can be disabled (by user)
public static final int ENABLED_FLAG = 0x0004;
// This contact needs filtering because a fixture filter was changed.
public static final int FILTER_FLAG = 0x0008;
// This bullet contact had a TOI event
public static final int BULLET_HIT_FLAG = 0x0010;

public static final int TOI_FLAG = 0x0020;

public int m_flags;

```

#### 链接和节点字段
```java
  // World pool and list pointers.
  public Contact m_prev;
  public Contact m_next;

  // Nodes for connecting bodies.
  public ContactEdge m_nodeA = null;
  public ContactEdge m_nodeB = null;
```


#### 接触信息字段
- m_fixtureA 和 m_fixtureB：接触的两个夹具。
- m_indexA 和 m_indexB：接触夹具的索引。
- m_manifold：接触流形，包含接触点和其他接触信息。
- m_toiCount：时间撞击计数。
- m_toi：时间撞击值。
- m_friction：摩擦系数。
- m_restitution：恢复系数。
- m_tangentSpeed：切向速度。

代码如下：
```java
public Fixture m_fixtureA;
public Fixture m_fixtureB;

public int m_indexA;
public int m_indexB;

public final Manifold m_manifold;

public float m_toiCount;
public float m_toi;

public float m_friction;
public float m_restitution;

public float m_tangentSpeed;
```

### Manifold
Manifold 类表示两个相交凸形状之间的接触流形。Box2D 支持多种类型的接触:
- 带半径的剪切点与平面之间的接触。
- 带半径的点与点之间的接触（圆形）。

本地点和法线的使用：

|           | 本地点   | 本地法线    |
|-----------|-------|---------|
| e_circles | 圆心    | -       |
| e_faceA   | 面A的中心 | 多边形A的法线 |
| e_faceB   | 面B的中心 | 多边形B的法线 |

我们以这种方式存储接触信息，以便位置校正可以考虑到物体的运动，这对于连续物理计算至关重要。所有的接触场景都必须以这些类型之一表示。由于这个结构在时间步内被存储，所以我们保持其尽可能的小。

#### 字段定义
ManifoldType 枚举:
- CIRCLES: 圆形对圆形的接触。
- FACE_A: 面A的接触。
- FACE_B: 面B的接触。

字段:
- points: 接触点数组，类型为 ManifoldPoint。 
- localNormal: 本地法线向量，不用于 CIRCLES 类型。
- localPoint: 本地点，使用情况取决于接触流形类型。
- type: 流形类型，类型为 ManifoldType。
- pointCount: 接触点数量。

```java
  public static enum ManifoldType {
    CIRCLES, FACE_A, FACE_B
  }

  /** The points of contact. */
  public final ManifoldPoint[] points;

  /** not use for Type::e_points */
  public final Vec2 localNormal;

  /** usage depends on manifold type */
  public final Vec2 localPoint;

  public ManifoldType type;

  /** The number of manifold points. */
  public int pointCount;
```

### ContactImpulse 
ContactImpulse 类表示两个物体之间接触过程中产生的冲量信息。
由于刚体碰撞中的子步长力可能接近无穷大，因此使用冲量代替力。这些冲量与 b2Manifold 中的接触点一一对应。

```java
/**
 * Contact impulses for reporting. Impulses are used instead of forces because sub-step forces may
 * approach infinity for rigid body collisions. These match up one-to-one with the contact points in
 * b2Manifold.
 * 
 * @author Daniel Murphy
 */
public class ContactImpulse {
  public float[] normalImpulses = new float[Settings.maxManifoldPoints];
  public float[] tangentImpulses = new float[Settings.maxManifoldPoints];
  public int count;
}
```
