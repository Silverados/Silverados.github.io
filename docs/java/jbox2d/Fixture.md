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