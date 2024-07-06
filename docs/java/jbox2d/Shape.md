# Shape
包路径为：`org.jbox2d.collision.shapes;`

包内包含形状类型的枚举`ShapeType`和抽象类`Shape`, 以及`ShapeType`对应的具体`Shape`实现。

## ShapeType：
```java
public enum ShapeType {
	CIRCLE, EDGE, POLYGON, CHAIN
}
```

## Shape
形状用于碰撞检测。你可以以任何方式创建形状。在物理世界中用于模拟的形状会在创建 Fixture（夹具）时自动生成。形状可能包含一个或多个子形状。

以下代码有所精简:
```java
/**
 * A shape is used for collision detection. You can create a shape however you like. Shapes used for
 * simulation in World are created automatically when a Fixture is created. Shapes may encapsulate a
 * one or more child shapes.
 */
public abstract class Shape {

    @Getter
    public final ShapeType m_type;

    @Getter @Setter
    public float m_radius;

    public Shape(ShapeType type) {
        this.m_type = type;
    }

    /**
     * Get the number of child primitives
     * 获取子图元的数量
     *
     * @return
     */
    public abstract int getChildCount();

    /**
     * Test a point for containment in this shape. This only works for convex shapes.
     * 测试一个点是否在Shape内，只针对凸形。
     *
     * @param xf the shape world transform.
     * @param p a point in world coordinates.
     */
    public abstract boolean testPoint(final Transform xf, final Vec2 p);

    /**
     * Cast a ray against a child shape.
     * 用于进行射线与形状的碰撞检测或交点计算
     *
     * @param argOutput the ray-cast results.                         存储射线结果
     * @param argInput the ray-cast input parameters.                 存储射线输入
     * @param argTransform the transform to be applied to the shape.
     * @param argChildIndex the child shape index
     * @return if hit
     */
    public abstract boolean raycast(RayCastOutput output, RayCastInput input, Transform transform,
        int childIndex);


    /**
     * Given a transform, compute the associated axis aligned bounding box for a child shape.
     * 计算给定变换（Transform）下一个子形状的轴对齐边界框（AABB）
     *
     * @param argAabb returns the axis aligned box.
     * @param argXf the world transform of the shape.
     */
    public abstract void computeAABB(final AABB aabb, final Transform xf, int childIndex);

    /**
     * Compute the mass properties of this shape using its dimensions and density. The inertia tensor
     * is computed about the local origin.
     * 计算形状的质量属性，包括质量、质心（中心位置）、惯性张量
     *
     * @param massData returns the mass data for this shape.
     * @param density the density in kilograms per meter squared.
     */
    public abstract void computeMass(final MassData massData, final float density);

    /**
     * Compute the distance from the current shape to the specified point. This only works for convex
     * shapes.
     * 计算一个凸形状到指定点的距离。
     *
     * @param xf the shape world transform.
     * @param p a point in world coordinates.
     * @param normalOut returns the direction in which the distance increases.  返回法线的方向
     * @return distance returns the distance from the current shape.
     */
    public abstract float computeDistanceToOut(Transform xf, Vec2 p, int childIndex, Vec2 normalOut);

    public abstract Shape clone();
}
```

## 具体Shape实现

### CircleShape 圆形:

#### 形状定义
用圆心和半径足以定义一个圆：
##### 字段
```java
// 圆心
public final Vec2 m_p;
// 继承自父类的半径
public float m_radius;
```

##### 克隆方法
```java
  @Override
  public final Shape clone() {
    CircleShape shape = new CircleShape();
    shape.m_p.x = m_p.x;
    shape.m_p.y = m_p.y;
    shape.m_radius = m_radius;
    return shape;
  }
```

#### 子图元数量
圆是单一的图形，所以只有一个：
```java
  @Override
  public final int getChildCount() {
    return 1;
  }
```

#### 判断点是否在圆的变换内
变换包含平移和旋转,对圆来说旋转不会改变形状，所以这里我也有点疑惑为什么还要求旋转对圆心的影响。

判断点和圆的关系就是判断点和圆心的距离和半径的关系。
```java
  @Override
  public final boolean testPoint(final Transform transform, final Vec2 p) {
    // Rot.mulToOutUnsafe(transform.q, m_p, center);
    // center.addLocal(transform.p);
    //
    // final Vec2 d = center.subLocal(p).negateLocal();
    // return Vec2.dot(d, d) <= m_radius * m_radius;
    final Rot q = transform.q;
    final Vec2 tp = transform.p;
    float centerx = -(q.c * m_p.x - q.s * m_p.y + tp.x - p.x);
    float centery = -(q.s * m_p.x + q.c * m_p.y + tp.y - p.y);

    return centerx * centerx + centery * centery <= m_radius * m_radius;
  }
```

#### 计算到点的距离
首先计算transform后的圆心，然后求圆心到该点的距离，然后将圆心指向点的方向归一化赋值给normalOut, 最后返回点距离圆心的距离。
```java
  @Override
  public float computeDistanceToOut(Transform xf, Vec2 p, int childIndex, Vec2 normalOut) {
    final Rot xfq = xf.q;
    float centerx = xfq.c * m_p.x - xfq.s * m_p.y + xf.p.x;
    float centery = xfq.s * m_p.x + xfq.c * m_p.y + xf.p.y;
    float dx = p.x - centerx;
    float dy = p.y - centery;
    float d1 = MathUtils.sqrt(dx * dx + dy * dy);
    normalOut.x = dx * 1 / d1;
    normalOut.y = dy * 1 / d1;
    return d1 - m_radius;
  }
```

#### 射线和圆形的碰撞检测
```java
 // Collision Detection in Interactive 3D Environments by Gino van den Bergen
  // From Section 3.1.2
  // x = s + a * r
  // norm(x) = radius
  @Override
  public final boolean raycast(RayCastOutput output, RayCastInput input, Transform transform,
      int childIndex) {

    final Vec2 inputp1 = input.p1;
    final Vec2 inputp2 = input.p2;
    final Rot tq = transform.q;
    final Vec2 tp = transform.p;

    // Rot.mulToOutUnsafe(transform.q, m_p, position);
    // position.addLocal(transform.p);
    final float positionx = tq.c * m_p.x - tq.s * m_p.y + tp.x;
    final float positiony = tq.s * m_p.x + tq.c * m_p.y + tp.y;

    final float sx = inputp1.x - positionx;
    final float sy = inputp1.y - positiony;
    // final float b = Vec2.dot(s, s) - m_radius * m_radius;
    final float b = sx * sx + sy * sy - m_radius * m_radius;

    // Solve quadratic equation.
    final float rx = inputp2.x - inputp1.x;
    final float ry = inputp2.y - inputp1.y;
    // final float c = Vec2.dot(s, r);
    // final float rr = Vec2.dot(r, r);
    final float c = sx * rx + sy * ry;
    final float rr = rx * rx + ry * ry;
    final float sigma = c * c - rr * b;

    // Check for negative discriminant and short segment.
    if (sigma < 0.0f || rr < Settings.EPSILON) {
      return false;
    }

    // Find the point of intersection of the line with the circle.
    float a = -(c + MathUtils.sqrt(sigma));

    // Is the intersection point on the segment?
    if (0.0f <= a && a <= input.maxFraction * rr) {
      a /= rr;
      output.fraction = a;
      output.normal.x = rx * a + sx;
      output.normal.y = ry * a + sy;
      output.normal.normalize();
      return true;
    }

    return false;
  }
```


#### 计算AABB包围盒
计算transform后的点，根据半径算出左下和右上的点。
```java
  @Override
  public final void computeAABB(final AABB aabb, final Transform transform, int childIndex) {
    final Rot tq = transform.q;
    final Vec2 tp = transform.p;
    final float px = tq.c * m_p.x - tq.s * m_p.y + tp.x;
    final float py = tq.s * m_p.x + tq.c * m_p.y + tp.y;

    aabb.lowerBound.x = px - m_radius;
    aabb.lowerBound.y = py - m_radius;
    aabb.upperBound.x = px + m_radius;
    aabb.upperBound.y = py + m_radius;
  }
```

#### 计算质量信息
- 质量 = 密度 * 面积
- 质心 = 圆心
- 转动惯量(描述了物体对旋转的抗拒程度)

```java
  @Override
  public final void computeMass(final MassData massData, final float density) {
    massData.mass = density * Settings.PI * m_radius * m_radius;
    massData.center.x = m_p.x;
    massData.center.y = m_p.y;

    // inertia about the local origin
    // massData.I = massData.mass * (0.5f * m_radius * m_radius + Vec2.dot(m_p, m_p));
    massData.I = massData.mass * (0.5f * m_radius * m_radius + (m_p.x * m_p.x + m_p.y * m_p.y));
  }
```

### PolygonShape 凸多边形:
凸多边形的定义是，所有内角都小于180度，任何一条边延长线都不会穿过多边形。三角形、矩形都属于这类。

#### 形状定义
多边形可以通过连续的顶点数据定义出来。两两顶点之间连线，最后一个顶点再和第一个定点连线即可定义出整个多边形。
##### 字段
```java
  /**
 * Local position of the shape centroid in parent body frame.
 * 质心在父刚体坐标系中的局部位置。
 */
public final Vec2 m_centroid = new Vec2();

/**
 * The vertices of the shape. Note: use getVertexCount(), not m_vertices.length, to get number of
 * active vertices.
 * 多边形的顶点数组。
 */
public final Vec2 m_vertices[];

/**
 * The normals of the shape. Note: use getVertexCount(), not m_normals.length, to get number of
 * active normals.
 * 多边形的法线数组。
 */
public final Vec2 m_normals[];

/**
 * Number of active vertices in the shape.
 * 活动顶点的数量
 */
public int m_count;
```

##### 构造方法
默认的构造方法，其中Settings.maxPolygonVertices = 8, Settings.polygonRadius = 2.0f * linearSlop = 2.0f * 0.005f: 
```java
  public PolygonShape() {
    super(ShapeType.POLYGON);

    m_count = 0;
    m_vertices = new Vec2[Settings.maxPolygonVertices];
    for (int i = 0; i < m_vertices.length; i++) {
      m_vertices[i] = new Vec2();
    }
    m_normals = new Vec2[Settings.maxPolygonVertices];
    for (int i = 0; i < m_normals.length; i++) {
      m_normals[i] = new Vec2();
    }
    setRadius(Settings.polygonRadius);
    m_centroid.setZero();
  }
```

构造矩形，传入半宽和半高。
```java
  /**
   * Build vertices to represent an axis-aligned box.
   * 
   * @param hx the half-width.
   * @param hy the half-height.
   */
  public final void setAsBox(final float hx, final float hy) {
    m_count = 4;
    m_vertices[0].set(-hx, -hy);
    m_vertices[1].set(hx, -hy);
    m_vertices[2].set(hx, hy);
    m_vertices[3].set(-hx, hy);
    m_normals[0].set(0.0f, -1.0f);
    m_normals[1].set(1.0f, 0.0f);
    m_normals[2].set(0.0f, 1.0f);
    m_normals[3].set(-1.0f, 0.0f);
    m_centroid.setZero();
  }

  /**
   * Build vertices to represent an oriented box.
   * 
   * @param hx the half-width.
   * @param hy the half-height.
   * @param center the center of the box in local coordinates.
   * @param angle the rotation of the box in local coordinates.
   */
  public final void setAsBox(final float hx, final float hy, final Vec2 center, final float angle) {
    m_count = 4;
    m_vertices[0].set(-hx, -hy);
    m_vertices[1].set(hx, -hy);
    m_vertices[2].set(hx, hy);
    m_vertices[3].set(-hx, hy);
    m_normals[0].set(0.0f, -1.0f);
    m_normals[1].set(1.0f, 0.0f);
    m_normals[2].set(0.0f, 1.0f);
    m_normals[3].set(-1.0f, 0.0f);
    m_centroid.set(center);

    final Transform xf = poolt1;
    xf.p.set(center);
    xf.q.set(angle);

    // Transform vertices and normals.
    for (int i = 0; i < m_count; ++i) {
      Transform.mulToOut(xf, m_vertices[i], m_vertices[i]);
      Rot.mulToOut(xf.q, m_normals[i], m_normals[i]);
    }
  }

```

设置多边形：
```java
  /**
   * Create a convex hull from the given array of points. The count must be in the range [3,
   * Settings.maxPolygonVertices].
   * 
   * @warning the points may be re-ordered, even if they form a convex polygon.
   * @warning collinear points are removed.
   */
  public final void set(final Vec2[] vertices, final int count) {
    set(vertices, count, null, null);
  }

  /**
   * Create a convex hull from the given array of points. The count must be in the range [3,
   * Settings.maxPolygonVertices]. This method takes an arraypool for pooling.
   * 
   * @warning the points may be re-ordered, even if they form a convex polygon.
   * @warning collinear points are removed.
   */
  public final void set(final Vec2[] verts, final int num, final Vec2Array vecPool,
      final IntArray intPool) {
    assert (3 <= num && num <= Settings.maxPolygonVertices);
    if (num < 3) {
      setAsBox(1.0f, 1.0f);
      return;
    }

    int n = MathUtils.min(num, Settings.maxPolygonVertices);

    // Perform welding and copy vertices into local buffer.
    Vec2[] ps =
        (vecPool != null)
            ? vecPool.get(Settings.maxPolygonVertices)
            : new Vec2[Settings.maxPolygonVertices];
    int tempCount = 0;
    for (int i = 0; i < n; ++i) {
      Vec2 v = verts[i];
      boolean unique = true;
      for (int j = 0; j < tempCount; ++j) {
        if (MathUtils.distanceSquared(v, ps[j]) < 0.5f * Settings.linearSlop) {
          unique = false;
          break;
        }
      }

      if (unique) {
        ps[tempCount++] = v;
      }
    }

    n = tempCount;
    if (n < 3) {
      // Polygon is degenerate.
      assert (false);
      setAsBox(1.0f, 1.0f);
      return;
    }

    // Create the convex hull using the Gift wrapping algorithm
    // http://en.wikipedia.org/wiki/Gift_wrapping_algorithm

    // Find the right most point on the hull
    int i0 = 0;
    float x0 = ps[0].x;
    for (int i = 1; i < n; ++i) {
      float x = ps[i].x;
      if (x > x0 || (x == x0 && ps[i].y < ps[i0].y)) {
        i0 = i;
        x0 = x;
      }
    }

    int[] hull =
        (intPool != null)
            ? intPool.get(Settings.maxPolygonVertices)
            : new int[Settings.maxPolygonVertices];
    int m = 0;
    int ih = i0;

    while (true) {
      hull[m] = ih;

      int ie = 0;
      for (int j = 1; j < n; ++j) {
        if (ie == ih) {
          ie = j;
          continue;
        }

        Vec2 r = pool1.set(ps[ie]).subLocal(ps[hull[m]]);
        Vec2 v = pool2.set(ps[j]).subLocal(ps[hull[m]]);
        float c = Vec2.cross(r, v);
        if (c < 0.0f) {
          ie = j;
        }

        // Collinearity check
        if (c == 0.0f && v.lengthSquared() > r.lengthSquared()) {
          ie = j;
        }
      }

      ++m;
      ih = ie;

      if (ie == i0) {
        break;
      }
    }

    this.m_count = m;

    // Copy vertices.
    for (int i = 0; i < m_count; ++i) {
      if (m_vertices[i] == null) {
        m_vertices[i] = new Vec2();
      }
      m_vertices[i].set(ps[hull[i]]);
    }

    final Vec2 edge = pool1;

    // Compute normals. Ensure the edges have non-zero length.
    for (int i = 0; i < m_count; ++i) {
      final int i1 = i;
      final int i2 = i + 1 < m_count ? i + 1 : 0;
      edge.set(m_vertices[i2]).subLocal(m_vertices[i1]);

      assert (edge.lengthSquared() > Settings.EPSILON * Settings.EPSILON);
      Vec2.crossToOutUnsafe(edge, 1f, m_normals[i]);
      m_normals[i].normalize();
    }

    // Compute the polygon centroid.
    computeCentroidToOut(m_vertices, m_count, m_centroid);
  }
```

##### 克隆方法
```java
  public final Shape clone() {
    PolygonShape shape = new PolygonShape();
    shape.m_centroid.set(this.m_centroid);
    for (int i = 0; i < shape.m_normals.length; i++) {
        shape.m_normals[i].set(m_normals[i]);
        shape.m_vertices[i].set(m_vertices[i]);
    }
    shape.setRadius(this.getRadius());
    shape.m_count = this.m_count;
    return shape;
}
```

#### 子图元数量
多边形是单一的图形，所以只有一个：
```java
  @Override
  public final int getChildCount() {
    return 1;
  }
```

#### 判断点是否在变换内
```java
  @Override
  public final boolean testPoint(final Transform transform, final Vec2 p) {
    float tempx, tempy;
    final Rot xfq = xf.q;

    tempx = p.x - xf.p.x;
    tempy = p.y - xf.p.y;
    final float pLocalx = xfq.c * tempx + xfq.s * tempy;
    final float pLocaly = -xfq.s * tempx + xfq.c * tempy;

    if (m_debug) {
        System.out.println("--testPoint debug--");
        System.out.println("Vertices: ");
        for (int i = 0; i < m_count; ++i) {
            System.out.println(m_vertices[i]);
        }
        System.out.println("pLocal: " + pLocalx + ", " + pLocaly);
    }

    for (int i = 0; i < m_count; ++i) {
        Vec2 vertex = m_vertices[i];
        Vec2 normal = m_normals[i];
        tempx = pLocalx - vertex.x;
        tempy = pLocaly - vertex.y;
        final float dot = normal.x * tempx + normal.y * tempy;
        if (dot > 0.0f) {
            return false;
        }
    }

    return true;
  }
```

#### 计算到点的距离
首先计算transform后的圆心，然后求圆心到该点的距离，然后将圆心指向点的方向归一化赋值给normalOut, 最后返回点距离圆心的距离。
```java
@Override
public float computeDistanceToOut(Transform xf, Vec2 p, int childIndex, Vec2 normalOut) {
    float xfqc = xf.q.c;
    float xfqs = xf.q.s;
    float tx = p.x - xf.p.x;
    float ty = p.y - xf.p.y;
    float pLocalx = xfqc * tx + xfqs * ty;
    float pLocaly = -xfqs * tx + xfqc * ty;

    float maxDistance = -Float.MAX_VALUE;
    float normalForMaxDistanceX = pLocalx;
    float normalForMaxDistanceY = pLocaly;

    for (int i = 0; i < m_count; ++i) {
        Vec2 vertex = m_vertices[i];
        Vec2 normal = m_normals[i];
        tx = pLocalx - vertex.x;
        ty = pLocaly - vertex.y;
        float dot = normal.x * tx + normal.y * ty;
        if (dot > maxDistance) {
            maxDistance = dot;
            normalForMaxDistanceX = normal.x;
            normalForMaxDistanceY = normal.y;
        }
    }

    float distance;
    if (maxDistance > 0) {
        float minDistanceX = normalForMaxDistanceX;
        float minDistanceY = normalForMaxDistanceY;
        float minDistance2 = maxDistance * maxDistance;
        for (int i = 0; i < m_count; ++i) {
            Vec2 vertex = m_vertices[i];
            float distanceVecX = pLocalx - vertex.x;
            float distanceVecY = pLocaly - vertex.y;
            float distance2 = (distanceVecX * distanceVecX + distanceVecY * distanceVecY);
            if (minDistance2 > distance2) {
                minDistanceX = distanceVecX;
                minDistanceY = distanceVecY;
                minDistance2 = distance2;
            }
        }
        distance = MathUtils.sqrt(minDistance2);
        normalOut.x = xfqc * minDistanceX - xfqs * minDistanceY;
        normalOut.y = xfqs * minDistanceX + xfqc * minDistanceY;
        normalOut.normalize();
    } else {
        distance = maxDistance;
        normalOut.x = xfqc * normalForMaxDistanceX - xfqs * normalForMaxDistanceY;
        normalOut.y = xfqs * normalForMaxDistanceX + xfqc * normalForMaxDistanceY;
    }

    return distance;
}
```

#### 射线和多边形的碰撞检测
```java
  @Override
  public final boolean raycast(RayCastOutput output, RayCastInput input, Transform xf,
      int childIndex) {
    final float xfqc = xf.q.c;
    final float xfqs = xf.q.s;
    final Vec2 xfp = xf.p;
    float tempx, tempy;
    // b2Vec2 p1 = b2MulT(xf.q, input.p1 - xf.p);
    // b2Vec2 p2 = b2MulT(xf.q, input.p2 - xf.p);
    tempx = input.p1.x - xfp.x;
    tempy = input.p1.y - xfp.y;
    final float p1x = xfqc * tempx + xfqs * tempy;
    final float p1y = -xfqs * tempx + xfqc * tempy;

    tempx = input.p2.x - xfp.x;
    tempy = input.p2.y - xfp.y;
    final float p2x = xfqc * tempx + xfqs * tempy;
    final float p2y = -xfqs * tempx + xfqc * tempy;

    final float dx = p2x - p1x;
    final float dy = p2y - p1y;

    float lower = 0, upper = input.maxFraction;

    int index = -1;

    for (int i = 0; i < m_count; ++i) {
        Vec2 normal = m_normals[i];
        Vec2 vertex = m_vertices[i];
        // p = p1 + a * d
        // dot(normal, p - v) = 0
        // dot(normal, p1 - v) + a * dot(normal, d) = 0
        float tempxn = vertex.x - p1x;
        float tempyn = vertex.y - p1y;
        final float numerator = normal.x * tempxn + normal.y * tempyn;
        final float denominator = normal.x * dx + normal.y * dy;

        if (denominator == 0.0f) {
            if (numerator < 0.0f) {
                return false;
            }
        } else {
            // Note: we want this predicate without division:
            // lower < numerator / denominator, where denominator < 0
            // Since denominator < 0, we have to flip the inequality:
            // lower < numerator / denominator <==> denominator * lower >
            // numerator.
            if (denominator < 0.0f && numerator < lower * denominator) {
                // Increase lower.
                // The segment enters this half-space.
                lower = numerator / denominator;
                index = i;
            } else if (denominator > 0.0f && numerator < upper * denominator) {
                // Decrease upper.
                // The segment exits this half-space.
                upper = numerator / denominator;
            }
        }

        if (upper < lower) {
            return false;
        }
    }

    assert (0.0f <= lower && lower <= input.maxFraction);

    if (index >= 0) {
        output.fraction = lower;
        // normal = Mul(xf.R, m_normals[index]);
        Vec2 normal = m_normals[index];
        Vec2 out = output.normal;
        out.x = xfqc * normal.x - xfqs * normal.y;
        out.y = xfqs * normal.x + xfqc * normal.y;
        return true;
    }
    return false;
}
```


#### 计算AABB包围盒
计算transform后的点，遍历顶点数据找到最小的x,y作为左下的点和最大的x,y作为右上的点。
```java
  @Override
public final void computeAABB(final AABB aabb, final Transform xf, int childIndex) {
    final Vec2 lower = aabb.lowerBound;
    final Vec2 upper = aabb.upperBound;
    final Vec2 v1 = m_vertices[0];
    final float xfqc = xf.q.c;
    final float xfqs = xf.q.s;
    final float xfpx = xf.p.x;
    final float xfpy = xf.p.y;
    lower.x = (xfqc * v1.x - xfqs * v1.y) + xfpx;
    lower.y = (xfqs * v1.x + xfqc * v1.y) + xfpy;
    upper.x = lower.x;
    upper.y = lower.y;

    for (int i = 1; i < m_count; ++i) {
        Vec2 v2 = m_vertices[i];
        // Vec2 v = Mul(xf, m_vertices[i]);
        float vx = (xfqc * v2.x - xfqs * v2.y) + xfpx;
        float vy = (xfqs * v2.x + xfqc * v2.y) + xfpy;
        lower.x = lower.x < vx ? lower.x : vx;
        lower.y = lower.y < vy ? lower.y : vy;
        upper.x = upper.x > vx ? upper.x : vx;
        upper.y = upper.y > vy ? upper.y : vy;
    }

    lower.x -= m_radius;
    lower.y -= m_radius;
    upper.x += m_radius;
    upper.y += m_radius;
}
```

#### 计算质量信息
- 质量 = 密度 * 面积
- 质心 = 圆心
- 转动惯量(描述了物体对旋转的抗拒程度)

```java
  public void computeMass(final MassData massData, float density) {
    // Polygon mass, centroid, and inertia.
    // Let rho be the polygon density in mass per unit area.
    // Then:
    // mass = rho * int(dA)
    // centroid.x = (1/mass) * rho * int(x * dA)
    // centroid.y = (1/mass) * rho * int(y * dA)
    // I = rho * int((x*x + y*y) * dA)
    //
    // We can compute these integrals by summing all the integrals
    // for each triangle of the polygon. To evaluate the integral
    // for a single triangle, we make a change of variables to
    // the (u,v) coordinates of the triangle:
    // x = x0 + e1x * u + e2x * v
    // y = y0 + e1y * u + e2y * v
    // where 0 <= u && 0 <= v && u + v <= 1.
    //
    // We integrate u from [0,1-v] and then v from [0,1].
    // We also need to use the Jacobian of the transformation:
    // D = cross(e1, e2)
    //
    // Simplification: triangle centroid = (1/3) * (p1 + p2 + p3)
    //
    // The rest of the derivation is handled by computer algebra.

    assert (m_count >= 3);

    final Vec2 center = pool1;
    center.setZero();
    float area = 0.0f;
    float I = 0.0f;

    // pRef is the reference point for forming triangles.
    // It's location doesn't change the result (except for rounding error).
    final Vec2 s = pool2;
    s.setZero();
    // This code would put the reference point inside the polygon.
    for (int i = 0; i < m_count; ++i) {
        s.addLocal(m_vertices[i]);
    }
    s.mulLocal(1.0f / m_count);

    final float k_inv3 = 1.0f / 3.0f;

    final Vec2 e1 = pool3;
    final Vec2 e2 = pool4;

    for (int i = 0; i < m_count; ++i) {
        // Triangle vertices.
        e1.set(m_vertices[i]).subLocal(s);
        e2.set(s).negateLocal().addLocal(i + 1 < m_count ? m_vertices[i + 1] : m_vertices[0]);

        final float D = Vec2.cross(e1, e2);

        final float triangleArea = 0.5f * D;
        area += triangleArea;

        // Area weighted centroid
        center.x += triangleArea * k_inv3 * (e1.x + e2.x);
        center.y += triangleArea * k_inv3 * (e1.y + e2.y);

        final float ex1 = e1.x, ey1 = e1.y;
        final float ex2 = e2.x, ey2 = e2.y;

        float intx2 = ex1 * ex1 + ex2 * ex1 + ex2 * ex2;
        float inty2 = ey1 * ey1 + ey2 * ey1 + ey2 * ey2;

        I += (0.25f * k_inv3 * D) * (intx2 + inty2);
    }

    // Total mass
    massData.mass = density * area;

    // Center of mass
    assert (area > Settings.EPSILON);
    center.mulLocal(1.0f / area);
    massData.center.set(center).addLocal(s);

    // Inertia tensor relative to the local origin (point s)
    massData.I = I * density;

    // Shift to center of mass then to original body origin.
    massData.I += massData.mass * (Vec2.dot(massData.center, massData.center));
}
```
