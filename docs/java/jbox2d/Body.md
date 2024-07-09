# Body

## BodyDef
刚体的定义字段：
- type: 刚体类型分为3类。
  - BodyType.STATIC: 静态物体，不受物理作用影响。
  - BodyType.KINEMATIC: 运动物体，不受力影响，但可以有速度。
  - BodyType.DYNAMIC: 动态物体，受力和碰撞影响。
- userData: 存储特定数据。
- position: 位置。
- angle: 初始旋转角度，弧度制。
- linearVelocity: 初始线速度。
- angularVelocity: 初始角速度。
- linearDamping: 线性阻尼。
- angularDamping: 角阻尼。
- allowSleep: 运行物体进入睡眠状态，当物体长时间不受力或不运动时将节省资源。
- awake: 初始是否处于唤醒状态。
- fixedRotation: 固定旋转。如果设置为true表示不会发生旋转。
- bullet: 如果设置为`true`， 物体被标记为子弹。会进行连续碰撞检测。
- active: 初始是否处于活动状态。
- gravityScale: 物体收到的重力影响系数。

```java
  /**
   * The body type: static, kinematic, or dynamic. Note: if a dynamic body would have zero mass, the
   * mass is set to one.
   */
  public BodyType type;

  /**
   * Use this to store application specific body data.
   */
  public Object userData;

  /**
   * The world position of the body. Avoid creating bodies at the origin since this can lead to many
   * overlapping shapes.
   */
  public Vec2 position;

  /**
   * The world angle of the body in radians.
   */
  public float angle;

  /**
   * The linear velocity of the body in world co-ordinates.
   */
  public Vec2 linearVelocity;

  /**
   * The angular velocity of the body.
   */
  public float angularVelocity;

  /**
   * Linear damping is use to reduce the linear velocity. The damping parameter can be larger than
   * 1.0f but the damping effect becomes sensitive to the time step when the damping parameter is
   * large.
   */
  public float linearDamping;

  /**
   * Angular damping is use to reduce the angular velocity. The damping parameter can be larger than
   * 1.0f but the damping effect becomes sensitive to the time step when the damping parameter is
   * large.
   */
  public float angularDamping;

  /**
   * Set this flag to false if this body should never fall asleep. Note that this increases CPU
   * usage.
   */
  public boolean allowSleep;

  /**
   * Is this body initially sleeping?
   */
  public boolean awake;

  /**
   * Should this body be prevented from rotating? Useful for characters.
   */
  public boolean fixedRotation;

  /**
   * Is this a fast moving body that should be prevented from tunneling through other moving bodies?
   * Note that all bodies are prevented from tunneling through kinematic and static bodies. This
   * setting is only considered on dynamic bodies.
   * 
   * @warning You should use this flag sparingly since it increases processing time.
   */
  public boolean bullet;

  /**
   * Does this body start out active?
   */
  public boolean active;

  /**
   * Experimental: scales the inertia tensor.
   */
  public float gravityScale;
```

## BodyType
刚体类型：
- STATIC: 静态。0质量，0速度，手工移动。
- KINEMATIC: 运动。0质量，非0速度，求解器决定位移。
- DYNAMIC: 动态的。正质量，非0速度由力决定，求解器决定位移。

代码如下：
```java
/**
 * The body type.
 * static: zero mass, zero velocity, may be manually moved
 * kinematic: zero mass, non-zero velocity set by user, moved by solver
 * dynamic: positive mass, non-zero velocity determined by forces, moved by solver
 *
 * @author daniel
 */
public enum BodyType {
	STATIC, KINEMATIC, DYNAMIC
}
```

## Sweep
用于时间步长间的计算 (Time Of Impact, TOI) 的物体或形状的运动情况。对于物理仿真中的动态计算，形状是相对于物体的原点定义的，这个原点可能不会与质心（质量中心）重合。
然而，为了支持物体的动态行为，必须插值质心的位置。
- localCenter: 物体的局部质心位置。
- c0: 初始质心位置。
- c: 当前质心位置。
- a0: 初始角度。
- a: 当前角度。
- alpha0: 插值因子，用于计算物体在两个时间点之间的位置。

```java
  /** Local center of mass position */
  public final Vec2 localCenter;
  /** Center world positions */
  public final Vec2 c0, c;
  /** World angles */
  public float a0, a;

  /** Fraction of the current time step in the range [0,1] c0 and a0 are the positions at alpha0. */
  public float alpha0;
```

## Body

### 字段解析

字段部分直接同BodyDef:
```java
  public float m_linearDamping;
  public float m_angularDamping;
  public float m_gravityScale;

  public float m_sleepTime;

  public Object m_userData;
```

还有一部分使用标记位来赋值：
```java
  public int m_flags;

  public static final int e_islandFlag = 0x0001;
  public static final int e_awakeFlag = 0x0002;
  public static final int e_autoSleepFlag = 0x0004;
  public static final int e_bulletFlag = 0x0008;
  public static final int e_fixedRotationFlag = 0x0010;
  public static final int e_activeFlag = 0x0020;
  public static final int e_toiFlag = 0x0040;
  
```

标记赋值:
```java
    m_flags = 0;

    if (bd.bullet) {
      m_flags |= e_bulletFlag;
    }
    if (bd.fixedRotation) {
      m_flags |= e_fixedRotationFlag;
    }
    if (bd.allowSleep) {
      m_flags |= e_autoSleepFlag;
    }
    if (bd.awake) {
      m_flags |= e_awakeFlag;
    }
    if (bd.active){
      m_flags |=e_activeFlag;
    }
```

位置和角度：
```java
  public final Transform m_xf = new Transform();
```

赋值：
```java
    m_xf.p.set(bd.position);
    m_xf.q.set(bd.angle);
```


一些链表结构：
```java
public World m_world;
public Body m_prev;
public Body m_next;

public Fixture m_fixtureList;
public int m_fixtureCount;

public JointEdge m_jointList;
public ContactEdge m_contactList;
```


### Fixture
创建夹具的步骤为：
1. 创建新的Fixture。
2. 处理Fixture代理。
3. 更新Fixture列表。
4. 调整质量属性。
5. 通知World。

代码如下：
```java
  public final Fixture createFixture(FixtureDef def) {
    assert (m_world.isLocked() == false);

    if (m_world.isLocked() == true) {
      return null;
    }

    Fixture fixture = new Fixture();
    fixture.create(this, def);

    if ((m_flags & e_activeFlag) == e_activeFlag) {
      BroadPhase broadPhase = m_world.m_contactManager.m_broadPhase;
      fixture.createProxies(broadPhase, m_xf);
    }

    fixture.m_next = m_fixtureList;
    m_fixtureList = fixture;
    ++m_fixtureCount;

    fixture.m_body = this;

    // Adjust mass properties if needed.
    if (fixture.m_density > 0.0f) {
      resetMassData();
    }

    // Let the world know we have a new fixture. This will cause new contacts
    // to be created at the beginning of the next time step.
    m_world.m_flags |= World.NEW_FIXTURE;

    return fixture;
  }
```

此外还提供重载的方法：
```java
  public final Fixture createFixture(Shape shape, float density) {
    fixDef.shape = shape;
    fixDef.density = density;

    return createFixture(fixDef);
  }
```

销毁Fixture的步骤为：
1. 在列表中查找Fixture，移除该Fixture。
2. 消耗和Fixture相关的接触。
3. 销毁和Fixture相关的代理。
4. 销毁Fixture对象。
5. 重置质量属性。

```java
  public final void destroyFixture(Fixture fixture) {
    assert (m_world.isLocked() == false);
    if (m_world.isLocked() == true) {
      return;
    }

    assert (fixture.m_body == this);

    // Remove the fixture from this body's singly linked list.
    assert (m_fixtureCount > 0);
    Fixture node = m_fixtureList;
    Fixture last = null; // java change
    boolean found = false;
    while (node != null) {
      if (node == fixture) {
        node = fixture.m_next;
        found = true;
        break;
      }
      last = node;
      node = node.m_next;
    }

    // You tried to remove a shape that is not attached to this body.
    assert (found);

    // java change, remove it from the list
    if (last == null) {
      m_fixtureList = fixture.m_next;
    } else {
      last.m_next = fixture.m_next;
    }

    // Destroy any contacts associated with the fixture.
    ContactEdge edge = m_contactList;
    while (edge != null) {
      Contact c = edge.contact;
      edge = edge.next;

      Fixture fixtureA = c.getFixtureA();
      Fixture fixtureB = c.getFixtureB();

      if (fixture == fixtureA || fixture == fixtureB) {
        // This destroys the contact and removes it from
        // this body's contact list.
        m_world.m_contactManager.destroy(c);
      }
    }

    if ((m_flags & e_activeFlag) == e_activeFlag) {
      BroadPhase broadPhase = m_world.m_contactManager.m_broadPhase;
      fixture.destroyProxies(broadPhase);
    }

    fixture.destroy();
    fixture.m_body = null;
    fixture.m_next = null;
    fixture = null;

    --m_fixtureCount;

    // Reset the mass data.
    resetMassData();
  }
```

### 设置Transform
用于设置刚体 (Body) 的位置和旋转。这个操作会更新刚体的世界位置和角度，但也可能破坏当前的物理接触（Contact）和唤醒其他受影响的刚体。
由于直接操作变换（Transform）可能导致不符合物理规律的行为，所以应谨慎使用。更新的接触将在下一次调用 World.step() 时处理。
```java
  public final void setTransform(Vec2 position, float angle) {
    assert (m_world.isLocked() == false);
    if (m_world.isLocked() == true) {
      return;
    }

    m_xf.q.set(angle);
    m_xf.p.set(position);

    // m_sweep.c0 = m_sweep.c = Mul(m_xf, m_sweep.localCenter);
    Transform.mulToOutUnsafe(m_xf, m_sweep.localCenter, m_sweep.c);
    m_sweep.a = angle;

    m_sweep.c0.set(m_sweep.c);
    m_sweep.a0 = m_sweep.a;

    BroadPhase broadPhase = m_world.m_contactManager.m_broadPhase;
    for (Fixture f = m_fixtureList; f != null; f = f.m_next) {
      f.synchronize(broadPhase, m_xf, m_xf);
    }
  }
```