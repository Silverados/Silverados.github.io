# Fixture

## FixtureDef
夹具定义字段：
- shape: 决定夹具的物理形状，用于碰撞检测。
- userData: 用于存储与物理计算无关的自定义数据。
- friction: 控制表面之间的摩擦力。
- restitution: 控制碰撞后的反弹效果。
- density: 影响夹具的质量和惯性。
- isSensor: 决定夹具是否只作为传感器而不生成物理反应。
- filter: 定义夹具的碰撞过滤规则，控制哪些夹具可以与当前夹具发生碰撞。

对getter和setter方法有所精简。
```java

/**
 * A fixture definition is used to create a fixture. This class defines an abstract fixture
 * definition. You can reuse fixture definitions safely.
 * 
 * @author daniel
 */
@Getter @Setter
public class FixtureDef {
  /**
   * The shape, this must be set. The shape will be cloned, so you can create the shape on the
   * stack.
   */
  public Shape shape = null;

  /**
   * Use this to store application specific fixture data.
   */
  public Object userData;

  /**
   * The friction coefficient, usually in the range [0,1].
   */
  public float friction;

  /**
   * The restitution (elasticity) usually in the range [0,1].
   */
  public float restitution;

  /**
   * The density, usually in kg/m^2
   */
  public float density;

  /**
   * A sensor shape collects contact information but never generates a collision response.
   */
  public boolean isSensor;

  /**
   * Contact filtering data;
   */
  public Filter filter;

  public FixtureDef() {
    shape = null;
    userData = null;
    friction = 0.2f;
    restitution = 0f;
    density = 0f;
    filter = new Filter();
    isSensor = false;
  }
}

```

## FixtureProxy
FixtureProxy是用于表示物理世界中的 Fixture（夹具）在(Broad-Phase)广义碰撞检测系统中的代理。

可以理解成增加AABB关联。
```java
public class FixtureProxy {
  final AABB aabb = new AABB();
  Fixture fixture;
  int childIndex;
  int proxyId;
}
```

## Fixture
Fixture 是 JBox2D 中用于将一个几何形状（Shape）附加到物理世界中的物体（Body）上，以便进行碰撞检测的类。
它继承了其父 Body 的变换属性，并持有一些额外的非几何数据，如摩擦系数、碰撞过滤器等。Fixture 由 Body::CreateFixture 方法创建，不能被重用。

### 字段
字段部分大部分同FixtureDef。除了以下字段：
- m_proxies: 代理数组
- m_proxyCount: 代理数量

代码定义如下：
```java
  public float m_density;

  public Fixture m_next;
  public Body m_body;

  public Shape m_shape;

  public float m_friction;
  public float m_restitution;

  public FixtureProxy[] m_proxies;
  public int m_proxyCount;

  public final Filter m_filter;

  public boolean m_isSensor;

  public Object m_userData;
```

设置的方法中多数是直接将FixtureDef设置给Fixture，然后是对FixtureProxy数组的清理和内存空间分配。
```java
  public void create(Body body, FixtureDef def) {
    m_userData = def.userData;
    m_friction = def.friction;
    m_restitution = def.restitution;

    m_body = body;
    m_next = null;


    m_filter.set(def.filter);

    m_isSensor = def.isSensor;

    m_shape = def.shape.clone();

    // Reserve proxy space
    int childCount = m_shape.getChildCount();
    if (m_proxies == null) {
      m_proxies = new FixtureProxy[childCount];
      for (int i = 0; i < childCount; i++) {
        m_proxies[i] = new FixtureProxy();
        m_proxies[i].fixture = null;
        m_proxies[i].proxyId = BroadPhase.NULL_PROXY;
      }
    }

    if (m_proxies.length < childCount) {
      FixtureProxy[] old = m_proxies;
      int newLen = MathUtils.max(old.length * 2, childCount);
      m_proxies = new FixtureProxy[newLen];
      System.arraycopy(old, 0, m_proxies, 0, old.length);
      for (int i = 0; i < newLen; i++) {
        if (i >= old.length) {
          m_proxies[i] = new FixtureProxy();
        }
        m_proxies[i].fixture = null;
        m_proxies[i].proxyId = BroadPhase.NULL_PROXY;
      }
    }
    m_proxyCount = 0;

    m_density = def.density;
  }
```

### FixtureProxy数组
创建是根据形状计算出AABB然后设值。
```java
  public void createProxies(BroadPhase broadPhase, final Transform xf) {
    assert (m_proxyCount == 0);

    // Create proxies in the broad-phase.
    m_proxyCount = m_shape.getChildCount();

    for (int i = 0; i < m_proxyCount; ++i) {
      FixtureProxy proxy = m_proxies[i];
      m_shape.computeAABB(proxy.aabb, xf, i);
      proxy.proxyId = broadPhase.createProxy(proxy.aabb, proxy);
      proxy.fixture = this;
      proxy.childIndex = i;
    }
  }
```

销毁也很简单，就是设空 或者默认值。
```java
  public void destroyProxies(BroadPhase broadPhase) {
    // Destroy proxies in the broad-phase.
    for (int i = 0; i < m_proxyCount; ++i) {
      FixtureProxy proxy = m_proxies[i];
      broadPhase.destroyProxy(proxy.proxyId);
      proxy.proxyId = BroadPhase.NULL_PROXY;
    }

    m_proxyCount = 0;
  }
```


### getter/setter
多数getter/setter都是默认实现，其中有一些不太一样的摘出来看看：

设置传感器时如果变化了会唤醒body。
```java
  public void setSensor(boolean sensor) {
    if (sensor != m_isSensor) {
      m_body.setAwake(true);
      m_isSensor = sensor;
    }
  }
```

改变过滤器和触发一次filter，这个后面再说。
```java
  public void setFilterData(final Filter filter) {
    m_filter.set(filter);

    refilter();
  }
```

### refilter
主要执行两项任务：
1. 标记关联的接触（Contacts）以便重新进行过滤：
    - 检查与 Fixture 关联的所有 Contact 对象，并标记这些接触对象以便它们在下一次物理仿真中重新进行碰撞过滤。
    - 确保 Fixture 的碰撞过滤条件更新后，这些接触能够根据新条件进行评估。
2. 通知宽相位碰撞检测系统（Broad-Phase）更新 FixtureProxy：
    - 触碰（touch）每个 FixtureProxy，使宽相位碰撞检测系统更新这些代理。这确保了在 Fixture 的过滤条件变化后，所有相关代理都能够根据新条件更新。
```java
  public void refilter() {
    if (m_body == null) {
      return;
    }

    // Flag associated contacts for filtering.
    ContactEdge edge = m_body.getContactList();
    while (edge != null) {
      Contact contact = edge.contact;
      Fixture fixtureA = contact.getFixtureA();
      Fixture fixtureB = contact.getFixtureB();
      if (fixtureA == this || fixtureB == this) {
        contact.flagForFiltering();
      }
      edge = edge.next;
    }

    World world = m_body.getWorld();

    if (world == null) {
      return;
    }

    // Touch each proxy so that new pairs may be created
    BroadPhase broadPhase = world.m_contactManager.m_broadPhase;
    for (int i = 0; i < m_proxyCount; ++i) {
      broadPhase.touchProxy(m_proxies[i].proxyId);
    }
  }

```


### 对shape的方法代理
以下方法对shape进行了一层代理。
```java
public boolean testPoint(final Vec2 p) {
    return m_shape.testPoint(m_body.m_xf, p);
}

public boolean raycast(RayCastOutput output, RayCastInput input, int childIndex) {
    return m_shape.raycast(output, input, m_body.m_xf, childIndex);
}

public void getMassData(MassData massData) {
    m_shape.computeMass(massData, m_density);
}

public float computeDistance(Vec2 p, int childIndex, Vec2 normalOut) {
    return m_shape.computeDistanceToOut(m_body.getTransform(), p, childIndex, normalOut);
}
```

### 内部方法 synchronize
Fixture 类中的 synchronize 方法在物体变换(只有平移)时，用于更新 FixtureProxy 的 AABB（轴对齐边界框）和在宽相位碰撞检测系统（BroadPhase）中的位置。
这确保了物理引擎能够在物体发生移动时正确地检测到可能的碰撞。

```java
  protected void synchronize(BroadPhase broadPhase, final Transform transform1,
      final Transform transform2) {
    if (m_proxyCount == 0) {
      return;
    }

    for (int i = 0; i < m_proxyCount; ++i) {
      FixtureProxy proxy = m_proxies[i];

      // Compute an AABB that covers the swept shape (may miss some rotation effect).
      final AABB aabb1 = pool1;
      final AABB aab = pool2;
      m_shape.computeAABB(aabb1, transform1, proxy.childIndex);
      m_shape.computeAABB(aab, transform2, proxy.childIndex);

      proxy.aabb.lowerBound.x =
          aabb1.lowerBound.x < aab.lowerBound.x ? aabb1.lowerBound.x : aab.lowerBound.x;
      proxy.aabb.lowerBound.y =
          aabb1.lowerBound.y < aab.lowerBound.y ? aabb1.lowerBound.y : aab.lowerBound.y;
      proxy.aabb.upperBound.x =
          aabb1.upperBound.x > aab.upperBound.x ? aabb1.upperBound.x : aab.upperBound.x;
      proxy.aabb.upperBound.y =
          aabb1.upperBound.y > aab.upperBound.y ? aabb1.upperBound.y : aab.upperBound.y;
      displacement.x = transform2.p.x - transform1.p.x;
      displacement.y = transform2.p.y - transform1.p.y;

      broadPhase.moveProxy(proxy.proxyId, proxy.aabb, displacement);
    }
  }
```