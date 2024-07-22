# Island
岛是指一组相互连接的刚体和它们之间的约束。连接可以通过关节（如铰链、滑动关节）或者碰撞接触点。
岛内的所有刚体和约束会在同一个求解步骤中被处理，独立于其他岛。这意味着每个岛可以被看作是一个独立的物理系统。

## 字段
- **m_listener**：用于监听物理引擎中物体之间的接触事件。它可以用来处理碰撞开始、持续和结束的逻辑。
- **m_bodies**：表示这个岛中的所有刚体。
- **m_contacts**：表示这个岛中所有的接触点。
- **m_joints**：表示这个岛中的所有关节。
- **m_positions**：存储岛中所有刚体的位置数据。
- **m_velocities**：存储岛中所有刚体的速度数据。
- **m_bodyCount**：表示岛中刚体的数量。
- **m_jointCount**：表示岛中关节的数量。
- **m_contactCount**：表示岛中接触点的数量。
- **m_bodyCapacity**：表示岛中刚体的最大容量。
- **m_contactCapacity**：表示岛中接触点的最大容量。
- **m_jointCapacity**：表示岛中关节的最大容量。

### 字段解释

```java
  public ContactListener m_listener;

  public Body[] m_bodies;
  public Contact[] m_contacts;
  public Joint[] m_joints;

  public Position[] m_positions;
  public Velocity[] m_velocities;

  public int m_bodyCount;
  public int m_jointCount;
  public int m_contactCount;

  public int m_bodyCapacity;
  public int m_contactCapacity;
  public int m_jointCapacity;
```

## 岛的构建
在物理仿真开始之前，需要构建这些岛。这个过程通常包括以下步骤：
- 识别连接组件：通过遍历所有的刚体和约束，识别哪些刚体通过关节或碰撞接触点相互连接。
- 分组：将相互连接的刚体和约束分组成独立的岛。
- 处理：对每个岛分别进行物理求解和更新。

```java
  public void init(int bodyCapacity, int contactCapacity, int jointCapacity,
      ContactListener listener) {
    // System.out.println("Initializing Island");
    m_bodyCapacity = bodyCapacity;
    m_contactCapacity = contactCapacity;
    m_jointCapacity = jointCapacity;
    m_bodyCount = 0;
    m_contactCount = 0;
    m_jointCount = 0;

    m_listener = listener;

    if (m_bodies == null || m_bodyCapacity > m_bodies.length) {
      m_bodies = new Body[m_bodyCapacity];
    }
    if (m_joints == null || m_jointCapacity > m_joints.length) {
      m_joints = new Joint[m_jointCapacity];
    }
    if (m_contacts == null || m_contactCapacity > m_contacts.length) {
      m_contacts = new Contact[m_contactCapacity];
    }

    // dynamic array
    if (m_velocities == null || m_bodyCapacity > m_velocities.length) {
      final Velocity[] old = m_velocities == null ? new Velocity[0] : m_velocities;
      m_velocities = new Velocity[m_bodyCapacity];
      System.arraycopy(old, 0, m_velocities, 0, old.length);
      for (int i = old.length; i < m_velocities.length; i++) {
        m_velocities[i] = new Velocity();
      }
    }

    // dynamic array
    if (m_positions == null || m_bodyCapacity > m_positions.length) {
      final Position[] old = m_positions == null ? new Position[0] : m_positions;
      m_positions = new Position[m_bodyCapacity];
      System.arraycopy(old, 0, m_positions, 0, old.length);
      for (int i = old.length; i < m_positions.length; i++) {
        m_positions[i] = new Position();
      }
    }
  }
```

```text
/*
 位置校正说明
 =========================
 我尝试了几种2D旋转关节的位置校正算法。
 我测试了以下系统：
 - 简单摆（1米直径的球在5米的无质量杆上），初始角速度为100弧度/秒。
 - 吊桥，由30个1米长的板组成。
 - 由30个1米长的链节组成的多链节链条。

 下面是这些算法：

 Baumgarte - 将一部分位置误差添加到速度误差中，没有单独的位置求解器。

 伪速度 - 在速度求解器和位置积分之后，重新计算位置误差、雅可比矩阵和有效质量。然后使用伪速度解决速度约束，并将一部分位置误差添加到伪速度误差中。伪速度初始化为零，没有预启动。在位置求解器之后，伪速度被添加到位置上。这也被称为一阶世界方法或位置LCP方法。

 改进的非线性高斯-赛德尔(NGS) - 类似于伪速度，但每个约束重新计算位置误差并更新位置。也重新计算半径向量（即雅可比矩阵），否则算法会非常不稳定。不需要伪速度状态，因为它们在每次迭代开始时实际上为零。由于我们有当前的位置误差，如果误差小于Settings.linearSlop，我们允许提前终止迭代。

 完整的NGS或简称NGS - 类似于改进的NGS，但每次解决约束时重新计算有效质量。

 结果如下：
 Baumgarte - 这是最便宜的算法，但有一些稳定性问题，尤其是在桥梁上。链条的链节在靠近根部时容易分离，并且在努力拉在一起时会抖动。这是领域中最常见的方法之一。主要缺点是位置校正会人为地影响动量，从而导致不稳定和错误的反弹。我使用了0.2的偏置因子。较大的偏置因子使桥梁不稳定，较小的因子使关节和接触变得柔软。

 伪速度 - 比Baumgarte方法更稳定。桥梁稳定。然而，在大角速度下，关节仍然分离。快速旋转简单摆，关节会分离。链条容易分离且不恢复。我使用了0.2的偏置因子。较大的值会导致当一个重立方体落在桥上时桥梁崩溃。

 改进的NGS - 这个算法在某些方面比Baumgarte和伪速度更好，但在其他方面更糟。桥梁和链条更稳定，但简单摆在高角速度下变得不稳定。

 完整的NGS - 在所有测试中都稳定。关节表现出良好的刚度。桥梁仍然下垂，但这比无限大的力要好。

 推荐
 伪速度并不值得，因为桥梁和链条不能从关节分离中恢复。在其他情况下，伪速度相对于Baumgarte的好处很小。

 改进的NGS对于旋转关节不是一个可靠的方法，因为在简单摆中看到的剧烈不稳定。也许它对其他约束类型是可行的，特别是有效质量为标量的标量约束。

 这留下了Baumgarte和完整的NGS。Baumgarte有小但可管理的不稳定性，而且速度很快。我认为我们无法逃避Baumgarte，尤其是在对约束保真度要求不高的情况下。

 完整的NGS是可靠的，看起来也不错。我推荐它作为高保真度模拟的一个选项，尤其是对于吊桥和长链条。对于布偶，特别是电动布偶，完整的NGS可能是一个不错的选择，因为关节分离可能是个问题。可以减少NGS的迭代次数以提高性能，而不会对可靠性造成太大影响。

 在位置求解器中，每个关节可以被不同地处理。因此，我推荐一个系统，让用户可以为每个关节选择算法。我可能默认使用较慢的完整NGS，并让用户在性能关键的情况下选择更快的Baumgarte方法。
 */

/*
 缓存性能

 Box2D求解器主要受到缓存未命中的影响。数据结构设计的目的是增加缓存命中率。很多未命中是由于对物体数据的随机访问。约束结构线性迭代，这导致很少的缓存未命中。

 在迭代期间不访问物体。相反，将只读数据（如质量值）存储在约束中。可变数据是约束冲量和物体的速度/位置。冲量存储在约束结构中。物体的速度/位置存储在紧凑的临时数组中，以增加缓存命中率。线性和角速度存储在一个数组中，因为多个数组会导致多次未命中。
 */
```


## 求解


```java
  public void solve(Profile profile, TimeStep step, Vec2 gravity, boolean allowSleep) {

    // System.out.println("Solving Island");
    float h = step.dt;

    // Integrate velocities and apply damping. Initialize the body state.
    for (int i = 0; i < m_bodyCount; ++i) {
        final Body b = m_bodies[i];
        final Sweep bm_sweep = b.m_sweep;
        final Vec2 c = bm_sweep.c;
        float a = bm_sweep.a;
        final Vec2 v = b.m_linearVelocity;
        float w = b.m_angularVelocity;

        // Store positions for continuous collision.
        bm_sweep.c0.set(bm_sweep.c);
        bm_sweep.a0 = bm_sweep.a;

        if (b.m_type == BodyType.DYNAMIC) {
            // Integrate velocities.
            // v += h * (b.m_gravityScale * gravity + b.m_invMass * b.m_force);
            v.x += h * (b.m_gravityScale * gravity.x + b.m_invMass * b.m_force.x);
            v.y += h * (b.m_gravityScale * gravity.y + b.m_invMass * b.m_force.y);
            w += h * b.m_invI * b.m_torque;

            // Apply damping.
            // ODE: dv/dt + c * v = 0
            // Solution: v(t) = v0 * exp(-c * t)
            // Time step: v(t + dt) = v0 * exp(-c * (t + dt)) = v0 * exp(-c * t) * exp(-c * dt) = v *
            // exp(-c * dt)
            // v2 = exp(-c * dt) * v1
            // Pade approximation:
            // v2 = v1 * 1 / (1 + c * dt)
            v.x *= 1.0f / (1.0f + h * b.m_linearDamping);
            v.y *= 1.0f / (1.0f + h * b.m_linearDamping);
            w *= 1.0f / (1.0f + h * b.m_angularDamping);
        }

        m_positions[i].c.x = c.x;
        m_positions[i].c.y = c.y;
        m_positions[i].a = a;
        m_velocities[i].v.x = v.x;
        m_velocities[i].v.y = v.y;
        m_velocities[i].w = w;
    }

    timer.reset();

    // Solver data
    solverData.step = step;
    solverData.positions = m_positions;
    solverData.velocities = m_velocities;

    // Initialize velocity constraints.
    solverDef.step = step;
    solverDef.contacts = m_contacts;
    solverDef.count = m_contactCount;
    solverDef.positions = m_positions;
    solverDef.velocities = m_velocities;

    contactSolver.init(solverDef);
    // System.out.println("island init vel");
    contactSolver.initializeVelocityConstraints();

    if (step.warmStarting) {
        // System.out.println("island warm start");
        contactSolver.warmStart();
    }

    for (int i = 0; i < m_jointCount; ++i) {
        m_joints[i].initVelocityConstraints(solverData);
    }

    profile.solveInit.accum(timer.getMilliseconds());

    // Solve velocity constraints
    timer.reset();
    // System.out.println("island solving velocities");
    for (int i = 0; i < step.velocityIterations; ++i) {
        for (int j = 0; j < m_jointCount; ++j) {
            m_joints[j].solveVelocityConstraints(solverData);
        }

        contactSolver.solveVelocityConstraints();
    }

    // Store impulses for warm starting
    contactSolver.storeImpulses();
    profile.solveVelocity.accum(timer.getMilliseconds());

    // Integrate positions
    for (int i = 0; i < m_bodyCount; ++i) {
        final Vec2 c = m_positions[i].c;
        float a = m_positions[i].a;
        final Vec2 v = m_velocities[i].v;
        float w = m_velocities[i].w;

        // Check for large velocities
        float translationx = v.x * h;
        float translationy = v.y * h;

        if (translationx * translationx + translationy * translationy > Settings.maxTranslationSquared) {
            float ratio = Settings.maxTranslation
                / MathUtils.sqrt(translationx * translationx + translationy * translationy);
            v.x *= ratio;
            v.y *= ratio;
        }

        float rotation = h * w;
        if (rotation * rotation > Settings.maxRotationSquared) {
            float ratio = Settings.maxRotation / MathUtils.abs(rotation);
            w *= ratio;
        }

        // Integrate
        c.x += h * v.x;
        c.y += h * v.y;
        a += h * w;

        m_positions[i].a = a;
        m_velocities[i].w = w;
    }

    // Solve position constraints
    timer.reset();
    boolean positionSolved = false;
    for (int i = 0; i < step.positionIterations; ++i) {
        boolean contactsOkay = contactSolver.solvePositionConstraints();

        boolean jointsOkay = true;
        for (int j = 0; j < m_jointCount; ++j) {
            boolean jointOkay = m_joints[j].solvePositionConstraints(solverData);
            jointsOkay = jointsOkay && jointOkay;
        }

        if (contactsOkay && jointsOkay) {
            // Exit early if the position errors are small.
            positionSolved = true;
            break;
        }
    }

    // Copy state buffers back to the bodies
    for (int i = 0; i < m_bodyCount; ++i) {
        Body body = m_bodies[i];
        body.m_sweep.c.x = m_positions[i].c.x;
        body.m_sweep.c.y = m_positions[i].c.y;
        body.m_sweep.a = m_positions[i].a;
        body.m_linearVelocity.x = m_velocities[i].v.x;
        body.m_linearVelocity.y = m_velocities[i].v.y;
        body.m_angularVelocity = m_velocities[i].w;
        body.synchronizeTransform();
    }

    profile.solvePosition.accum(timer.getMilliseconds());

    report(contactSolver.m_velocityConstraints);

    if (allowSleep) {
        float minSleepTime = Float.MAX_VALUE;

        final float linTolSqr = Settings.linearSleepTolerance * Settings.linearSleepTolerance;
        final float angTolSqr = Settings.angularSleepTolerance * Settings.angularSleepTolerance;

        for (int i = 0; i < m_bodyCount; ++i) {
            Body b = m_bodies[i];
            if (b.getType() == BodyType.STATIC) {
                continue;
            }

            if ((b.m_flags & Body.e_autoSleepFlag) == 0
                || b.m_angularVelocity * b.m_angularVelocity > angTolSqr
                || Vec2.dot(b.m_linearVelocity, b.m_linearVelocity) > linTolSqr) {
                b.m_sleepTime = 0.0f;
                minSleepTime = 0.0f;
            } else {
                b.m_sleepTime += h;
                minSleepTime = MathUtils.min(minSleepTime, b.m_sleepTime);
            }
        }

        if (minSleepTime >= Settings.timeToSleep && positionSolved) {
            for (int i = 0; i < m_bodyCount; ++i) {
                Body b = m_bodies[i];
                b.setAwake(false);
            }
        }
    }
}

```