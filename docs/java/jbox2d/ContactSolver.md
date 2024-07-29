# 碰撞求解器

## ContactSolverDef 
`ContactSolverDef`类是Box2D物理引擎中用于定义接触求解器的参数类。它包含了时间步长、接触数组、接触数量、位置数组和速度数组等信息。通过这些参数，物理引擎可以初始化并配置接触求解器，处理物体之间的碰撞和约束。

- **TimeStep step**：包含时间步长的信息，如时间增量、速度和位置迭代次数等。
- **Contact[] contacts**：存储所有接触点的数组。
- **int count**：接触点的数量。
- **Position[] positions**：存储所有物体的位置数组。
- **Velocity[] velocities**：存储所有物体的速度数组。

通过`ContactSolverDef`类，我们可以方便地将碰撞检测和响应的相关参数传递给接触求解器，确保物理引擎能够准确计算物体之间的相互作用。
```java
  public static class ContactSolverDef {
    public TimeStep step;
    public Contact[] contacts;
    public int count;
    public Position[] positions;
    public Velocity[] velocities;
  }
```

## ContactPositionConstraint 
`ContactPositionConstraint`类用于在Box2D物理引擎中表示位置约束，特别是处理两个物体之间的接触。这个类包含了许多变量和数据结构，用于描述接触点、法向量、本地坐标等信息。以下是这个类的主要成员变量及其作用的总结：

- `Vec2[] localPoints`：本地接触点数组，用于存储多个接触点的位置。
- `Vec2 localNormal`：本地法向量，用于表示接触的方向。
- `Vec2 localPoint`：本地参考点，用于描述接触点的位置。
- `int indexA`：第一个物体的索引。
- `int indexB`：第二个物体的索引。
- `float invMassA`：第一个物体的逆质量。
- `float invMassB`：第二个物体的逆质量。
- `Vec2 localCenterA`：第一个物体的本地中心点。
- `Vec2 localCenterB`：第二个物体的本地中心点。
- `float invIA`：第一个物体的逆惯性张量。
- `float invIB`：第二个物体的逆惯性张量。
- `ManifoldType type`：接触流形的类型，用于描述接触的几何形状。
- `float radiusA`：第一个物体的碰撞半径。
- `float radiusB`：第二个物体的碰撞半径。
- `int pointCount`：接触点的数量。

### 主要成员变量作用总结

- **localPoints**：存储接触点的位置，用于计算接触响应。
- **localNormal**：描述接触的方向，用于计算法向量。
- **localPoint**：接触的参考点，用于计算接触位置。
- **indexA 和 indexB**：用于识别参与接触的两个物体。
- **invMassA 和 invMassB**：用于计算接触响应时考虑的质量因素。
- **localCenterA 和 localCenterB**：用于描述物体的几何中心。
- **invIA 和 invIB**：用于计算角动量的逆惯性张量。
- **type**：接触的几何形状类型（如点、边、面）。
- **radiusA 和 radiusB**：用于描述物体的碰撞形状。
- **pointCount**：接触点的数量，用于处理多点接触情况。

```java
public class ContactPositionConstraint {
  Vec2[] localPoints = new Vec2[Settings.maxManifoldPoints];
  final Vec2 localNormal = new Vec2();
  final Vec2 localPoint = new Vec2();
  int indexA;
  int indexB;
  float invMassA, invMassB;
  final Vec2 localCenterA = new Vec2();
  final Vec2 localCenterB = new Vec2();
  float invIA, invIB;
  ManifoldType type;
  float radiusA, radiusB;
  int pointCount;

  public ContactPositionConstraint() {
    for (int i = 0; i < localPoints.length; i++) {
      localPoints[i] = new Vec2();
    }
  }
}
```

## PositionSolverManifold
PositionSolverManifold类用于在Box2D物理引擎中处理接触位置约束，特别是计算两个物体之间的接触分离、接触点和法向量。以下是这个类的主要成员变量及其作用的总结：

CIRCLES：当接触类型为圆时，计算两个圆的接触点、法向量和分离距离。
- 将本地点转换为全局点。
- 计算两个圆心的向量差并归一化为法向量。
- 计算接触点为两个圆心的中点。
- 计算分离距离为两个圆心之间的距离减去两个圆的半径之和。

FACE_A：当接触类型为面A时，计算面A与面B的接触点、法向量和分离距离。
- 计算面A的法向量和参考点的全局坐标。
- 计算面B的接触点的全局坐标。
- 计算两个点之间的向量差并投影到法向量上，得到分离距离。
- 接触点为面B的接触点。

FACE_B：当接触类型为面B时，计算面B与面A的接触点、法向量和分离距离。
- 计算面B的法向量和参考点的全局坐标。
- 计算面A的接触点的全局坐标。
- 计算两个点之间的向量差并投影到法向量上，得到分离距离。
- 接触点为面A的接触点。
- 确保法向量从A指向B。

```java
class PositionSolverManifold {

  public final Vec2 normal = new Vec2();
  public final Vec2 point = new Vec2();
  public float separation;

  public void initialize(ContactPositionConstraint pc, Transform xfA, Transform xfB, int index) {
    assert (pc.pointCount > 0);

    final Rot xfAq = xfA.q;
    final Rot xfBq = xfB.q;
    final Vec2 pcLocalPointsI = pc.localPoints[index];
    switch (pc.type) {
      case CIRCLES: {
        // Transform.mulToOutUnsafe(xfA, pc.localPoint, pointA);
        // Transform.mulToOutUnsafe(xfB, pc.localPoints[0], pointB);
        // normal.set(pointB).subLocal(pointA);
        // normal.normalize();
        //
        // point.set(pointA).addLocal(pointB).mulLocal(.5f);
        // temp.set(pointB).subLocal(pointA);
        // separation = Vec2.dot(temp, normal) - pc.radiusA - pc.radiusB;
        final Vec2 plocalPoint = pc.localPoint;
        final Vec2 pLocalPoints0 = pc.localPoints[0];
        final float pointAx = (xfAq.c * plocalPoint.x - xfAq.s * plocalPoint.y) + xfA.p.x;
        final float pointAy = (xfAq.s * plocalPoint.x + xfAq.c * plocalPoint.y) + xfA.p.y;
        final float pointBx = (xfBq.c * pLocalPoints0.x - xfBq.s * pLocalPoints0.y) + xfB.p.x;
        final float pointBy = (xfBq.s * pLocalPoints0.x + xfBq.c * pLocalPoints0.y) + xfB.p.y;
        normal.x = pointBx - pointAx;
        normal.y = pointBy - pointAy;
        normal.normalize();

        point.x = (pointAx + pointBx) * .5f;
        point.y = (pointAy + pointBy) * .5f;
        final float tempx = pointBx - pointAx;
        final float tempy = pointBy - pointAy;
        separation = tempx * normal.x + tempy * normal.y - pc.radiusA - pc.radiusB;
        break;
      }

      case FACE_A: {
        // Rot.mulToOutUnsafe(xfAq, pc.localNormal, normal);
        // Transform.mulToOutUnsafe(xfA, pc.localPoint, planePoint);
        //
        // Transform.mulToOutUnsafe(xfB, pc.localPoints[index], clipPoint);
        // temp.set(clipPoint).subLocal(planePoint);
        // separation = Vec2.dot(temp, normal) - pc.radiusA - pc.radiusB;
        // point.set(clipPoint);
        final Vec2 pcLocalNormal = pc.localNormal;
        final Vec2 pcLocalPoint = pc.localPoint;
        normal.x = xfAq.c * pcLocalNormal.x - xfAq.s * pcLocalNormal.y;
        normal.y = xfAq.s * pcLocalNormal.x + xfAq.c * pcLocalNormal.y;
        final float planePointx = (xfAq.c * pcLocalPoint.x - xfAq.s * pcLocalPoint.y) + xfA.p.x;
        final float planePointy = (xfAq.s * pcLocalPoint.x + xfAq.c * pcLocalPoint.y) + xfA.p.y;

        final float clipPointx = (xfBq.c * pcLocalPointsI.x - xfBq.s * pcLocalPointsI.y) + xfB.p.x;
        final float clipPointy = (xfBq.s * pcLocalPointsI.x + xfBq.c * pcLocalPointsI.y) + xfB.p.y;
        final float tempx = clipPointx - planePointx;
        final float tempy = clipPointy - planePointy;
        separation = tempx * normal.x + tempy * normal.y - pc.radiusA - pc.radiusB;
        point.x = clipPointx;
        point.y = clipPointy;
        break;
      }

      case FACE_B: {
        // Rot.mulToOutUnsafe(xfBq, pc.localNormal, normal);
        // Transform.mulToOutUnsafe(xfB, pc.localPoint, planePoint);
        //
        // Transform.mulToOutUnsafe(xfA, pcLocalPointsI, clipPoint);
        // temp.set(clipPoint).subLocal(planePoint);
        // separation = Vec2.dot(temp, normal) - pc.radiusA - pc.radiusB;
        // point.set(clipPoint);
        //
        // // Ensure normal points from A to B
        // normal.negateLocal();
        final Vec2 pcLocalNormal = pc.localNormal;
        final Vec2 pcLocalPoint = pc.localPoint;
        normal.x = xfBq.c * pcLocalNormal.x - xfBq.s * pcLocalNormal.y;
        normal.y = xfBq.s * pcLocalNormal.x + xfBq.c * pcLocalNormal.y;
        final float planePointx = (xfBq.c * pcLocalPoint.x - xfBq.s * pcLocalPoint.y) + xfB.p.x;
        final float planePointy = (xfBq.s * pcLocalPoint.x + xfBq.c * pcLocalPoint.y) + xfB.p.y;

        final float clipPointx = (xfAq.c * pcLocalPointsI.x - xfAq.s * pcLocalPointsI.y) + xfA.p.x;
        final float clipPointy = (xfAq.s * pcLocalPointsI.x + xfAq.c * pcLocalPointsI.y) + xfA.p.y;
        final float tempx = clipPointx - planePointx;
        final float tempy = clipPointy - planePointy;
        separation = tempx * normal.x + tempy * normal.y - pc.radiusA - pc.radiusB;
        point.x = clipPointx;
        point.y = clipPointy;
        normal.x *= -1;
        normal.y *= -1;
      }
        break;
    }
  }
}

```

## ContactVelocityConstraint
`ContactVelocityConstraint`类用于处理Box2D物理引擎中的速度约束，特别是管理两个接触物体之间的速度信息、摩擦力、反弹系数和其他相关属性。以下是这个类的详细说明：
- **VelocityConstraintPoint[] points**：存储每个接触点的速度约束信息。
- **Vec2 normal**：接触法向量。
- **Mat22 normalMass**：用于计算法向量质量。
- **Mat22 K**：速度约束的质量矩阵。
- **int indexA**：物体A的索引。
- **int indexB**：物体B的索引。
- **float invMassA, invMassB**：物体A和物体B的质量倒数。
- **float invIA, invIB**：物体A和物体B的惯性倒数。
- **float friction**：摩擦系数。
- **float restitution**：反弹系数。
- **float tangentSpeed**：切向速度。
- **int pointCount**：接触点的数量。
- **int contactIndex**：接触的索引。

`ContactVelocityConstraint`类在物理引擎中主要用于管理接触点的速度约束信息。它包含了物体的质量、惯性、摩擦系数和反弹系数等重要参数。此外，它还存储了每个接触点的速度信息和偏差，用于在物理模拟过程中计算物体之间的相互作用。通过这些信息，物理引擎可以精确地计算出接触点的速度变化，确保模拟的准确性和稳定性。

这个类在处理接触点的速度约束时发挥了重要作用，通过它的各个成员变量，物理引擎能够有效地处理碰撞响应和物体之间的摩擦力。
```java
public class ContactVelocityConstraint {
    public VelocityConstraintPoint[] points = new VelocityConstraintPoint[Settings.maxManifoldPoints];
    public final Vec2 normal = new Vec2();
    public final Mat22 normalMass = new Mat22();
    public final Mat22 K = new Mat22();
    public int indexA;
    public int indexB;
    public float invMassA, invMassB;
    public float invIA, invIB;
    public float friction;
    public float restitution;
    public float tangentSpeed;
    public int pointCount;
    public int contactIndex;

    public ContactVelocityConstraint() {
        for (int i = 0; i < points.length; i++) {
            points[i] = new VelocityConstraintPoint();
        }
    }

}
```

### VelocityConstraintPoint
单个接触点的速度约束信息。
- Vec2 rA, rB：接触点相对于物体A和物体B的相对位置。
- float normalImpulse：法向冲量。
- float tangentImpulse：切向冲量。
- float normalMass：法向质量。
- float tangentMass：切向质量。
- float velocityBias：速度偏差。

```java
public static class VelocityConstraintPoint {
    public final Vec2 rA = new Vec2();
    public final Vec2 rB = new Vec2();
    public float normalImpulse;
    public float tangentImpulse;
    public float normalMass;
    public float tangentMass;
    public float velocityBias;
}
```

## ContactPositionConstraint
`ContactPositionConstraint`类用于在Box2D物理引擎中处理位置约束，特别是管理两个接触物体之间的位置信息、质量、惯性和其他相关属性。以下是这个类的详细说明：
- **Vec2[] localPoints**：存储每个接触点的局部位置，数组大小由`Settings.maxManifoldPoints`决定。
- **Vec2 localNormal**：接触法向量的局部表示。
- **Vec2 localPoint**：接触点的局部表示。
- **int indexA**：物体A的索引。
- **int indexB**：物体B的索引。
- **float invMassA, invMassB**：物体A和物体B的质量倒数。
- **Vec2 localCenterA**：物体A的局部中心位置。
- **Vec2 localCenterB**：物体B的局部中心位置。
- **float invIA, invIB**：物体A和物体B的惯性倒数。
- **ManifoldType type**：接触类型（如圆形、面等）。
- **float radiusA, radiusB**：物体A和物体B的碰撞半径。
- **int pointCount**：接触点的数量。

构造函数初始化`localPoints`数组的每个元素，确保每个接触点都有一个`Vec2`对象。

`ContactPositionConstraint`类在物理引擎中主要用于管理接触点的位置信息。它包含了物体的质量、惯性、局部中心、碰撞半径等重要参数。此外，它还存储了每个接触点的位置和法向量，用于在物理模拟过程中计算物体之间的相互作用。通过这些信息，物理引擎可以精确地计算出接触点的位置变化，确保模拟的准确性和稳定性。

这个类在处理接触点的位置约束时发挥了重要作用，通过它的各个成员变量，物理引擎能够有效地处理碰撞响应和物体之间的位置调整。它与`ContactVelocityConstraint`类相辅相成，共同确保物理引擎的稳定性和准确性。
```java
public class ContactPositionConstraint {
  Vec2[] localPoints = new Vec2[Settings.maxManifoldPoints];
  final Vec2 localNormal = new Vec2();
  final Vec2 localPoint = new Vec2();
  int indexA;
  int indexB;
  float invMassA, invMassB;
  final Vec2 localCenterA = new Vec2();
  final Vec2 localCenterB = new Vec2();
  float invIA, invIB;
  ManifoldType type;
  float radiusA, radiusB;
  int pointCount;

  public ContactPositionConstraint() {
    for (int i = 0; i < localPoints.length; i++) {
      localPoints[i] = new Vec2();
    }
  }
}

```

## solveVelocityConstraints

在 JBox2D 物理引擎中，`solveVelocityConstraints` 是用于解决速度约束的关键函数。这个函数是物理求解过程的一部分，它在每一时间步中被调用，以处理物体间的速度约束，包括接触和关节的速度约束。

### 主要实现步骤

以下是 JBox2D 中 `solveVelocityConstraints` 方法的实现步骤概要：

1. **遍历所有接触点约束**：
    - 对于每个接触点约束，调用 `solveVelocityConstraints` 方法来计算和应用接触点的速度约束。每个 `ContactVelocityConstraint` 对象代表一个接触点约束。

2. **处理速度约束**：
    - 对于每个 `VelocityConstraintPoint`，计算法向和切向的速度冲量（impulse），并应用到相关的物体上。
    - 计算冲量的方式涉及到法向约束和摩擦约束，并考虑了物体的质量和惯性。

3. **更新物体的速度**：
    - 根据计算的冲量更新每个接触点的相关物体的线速度和角速度。

### 主要部分解释

- **计算相对速度 (`dv`)**：
    - 相对速度是由两个物体的速度及其相对于接触点的相对位置（`rA` 和 `rB`）计算得出的。

- **法向冲量计算 (`impulse`)**：
    - 通过法向质量矩阵（`normalMass`）和相对速度来计算法向冲量。这个冲量应用于物体，以解决接触约束。

- **更新速度**：
    - 根据计算的冲量更新物体的线速度和角速度。

- **切向冲量计算 (`tangentImpulse`)**：
    - 切向冲量用于处理摩擦力约束。摩擦力通过切向冲量应用于物体。

### 总结

`solveVelocityConstraints` 方法在每个时间步内处理接触点和关节的速度约束，确保物体的碰撞响应和摩擦力被准确计算并应用。这是物理引擎模拟物理行为的关键部分，涉及到复杂的数学计算和物理建模。
```java

```

## solvePositionConstraints
在 JBox2D 物理引擎中，`solvePositionConstraints` 是用于解决位置约束的关键函数。它在每个时间步中被调用，以处理物体间的位置约束，包括接触和关节的约束。这确保了物体在物理模拟中的位置调整，使得它们不会重叠，并且符合物理约束条件。

### 主要实现步骤

以下是 JBox2D 中 `solvePositionConstraints` 方法的实现步骤概要：

1. **遍历所有接触点约束**：
    - 对于每个接触点约束，调用 `solvePositionConstraints` 方法来计算和应用位置约束。每个 `ContactPositionConstraint` 对象代表一个接触点约束。

2. **处理位置约束**：
    - 对于每个 `PositionConstraintPoint`，计算法向和切向的位置修正，并应用到相关的物体上。
    - 计算修正的方式涉及到法向约束和摩擦约束，并考虑了物体的质量和惯性。

3. **更新物体的位置**：
    - 根据计算的位置修正更新每个接触点的相关物体的位置。
