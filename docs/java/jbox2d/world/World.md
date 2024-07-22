# World

## 字段解析

### 动态池子大小
```java
  public static final int WORLD_POOL_SIZE = 100;
  public static final int WORLD_POOL_CONTAINER_SIZE = 10;
```

### 标记
1. **`NEW_FIXTURE` (0x0001)**:
    - 这个标记表示在当前时间步中有新的夹具（Fixture）被添加到物理世界中。当添加新的夹具时，可能需要重新计算一些物理属性或者更新一些内部数据结构。

2. **`LOCKED` (0x0002)**:
    - 这个标记表示 `World` 对象当前处于锁定状态。通常在推进物理模拟的时间步时会设置这个标记，以防止在时间步推进过程中修改物理世界的状态（如添加或删除刚体、关节等）。这是为了确保物理模拟的一致性和稳定性。

3. **`CLEAR_FORCES` (0x0004)**:
    - 这个标记表示需要清除所有物体上的外力。在每个时间步结束时，可以设置这个标记以清除所有物体上的外力，从而准备迎接下一个时间步的模拟。这通常在 `step` 方法中设置，用于确保外力不会在时间步之间累积。

```java
  public static final int NEW_FIXTURE = 0x0001;
  public static final int LOCKED = 0x0002;
  public static final int CLEAR_FORCES = 0x0004;

  protected int m_flags;
```

### 碰撞相关字段
```java
  protected ContactManager m_contactManager;

  private Body m_bodyList;
  private Joint m_jointList;

  private int m_bodyCount;
  private int m_jointCount;
  private final Vec2 m_gravity = new Vec2();
  // 标记世界中是否允许物体进入睡眠状态。 默认为true
  private boolean m_allowSleep;
```

### 默认的listener
```java
  private DestructionListener m_destructionListener;
  private ParticleDestructionListener m_particleDestructionListener;
```


### 求解器
- m_warmStarting: 控制是否进行预热，以提高模拟稳定性和性能。
- m_continuousPhysics: 控制是否启用连续物理，以防止高速物体穿透。
- m_subStepping: 控制是否启用子步计算，以提高模拟精度和稳定性。
- m_stepComplete: 表示一个完整的时间步是否已完成，用于管理时间步和子步计算过程。

```java
  // these are for debugging the solver
  private boolean m_warmStarting;
  private boolean m_continuousPhysics;
  private boolean m_subStepping;
  private boolean m_stepComplete; 
```

### 分析器
```java
  private Profile m_profile;
```

### 粒子系统
粒子系统（Particle System）是一种用于模拟各种自然现象和效果的技术，如火焰、烟雾、雨雪、爆炸等。
在计算机图形学和物理引擎中，粒子系统通过大量的小粒子（particles）来模拟复杂的现象。
每个粒子都是一个独立的实体，具有位置、速度、生命期、颜色等属性。粒子系统通常用于创建动态的、具有视觉吸引力的效果。

```java
  private ParticleSystem m_particleSystem;
```

### 碰撞类型管理
```java
public class ContactRegister {
  public IDynamicStack<Contact> creator;
    // 是否为主碰撞处理器
  public boolean primary;
}
```

字段和方法
```java
private ContactRegister[][] contactStacks =
      new ContactRegister[ShapeType.values().length][ShapeType.values().length];

private void addType(IDynamicStack<Contact> creator, ShapeType type1, ShapeType type2) {
    ContactRegister register = new ContactRegister();
    register.creator = creator;
    register.primary = true;
    contactStacks[type1.ordinal()][type2.ordinal()] = register;

    if (type1 != type2) {
        ContactRegister register2 = new ContactRegister();
        register2.creator = creator;
        register2.primary = false;
        contactStacks[type2.ordinal()][type1.ordinal()] = register2;
    }
}

private void initializeRegisters() {
    addType(pool.getCircleContactStack(), ShapeType.CIRCLE, ShapeType.CIRCLE);
    addType(pool.getPolyCircleContactStack(), ShapeType.POLYGON, ShapeType.CIRCLE);
    addType(pool.getPolyContactStack(), ShapeType.POLYGON, ShapeType.POLYGON);
    addType(pool.getEdgeCircleContactStack(), ShapeType.EDGE, ShapeType.CIRCLE);
    addType(pool.getEdgePolyContactStack(), ShapeType.EDGE, ShapeType.POLYGON);
    addType(pool.getChainCircleContactStack(), ShapeType.CHAIN, ShapeType.CIRCLE);
    addType(pool.getChainPolyContactStack(), ShapeType.CHAIN, ShapeType.POLYGON);
}

```

## 构造函数

```java
  public World(Vec2 gravity, IWorldPool pool, BroadPhase broadPhase) {
    this.pool = pool;
    m_destructionListener = null;
    m_debugDraw = null;

    m_bodyList = null;
    m_jointList = null;

    m_bodyCount = 0;
    m_jointCount = 0;

    m_warmStarting = true;
    m_continuousPhysics = true;
    m_subStepping = false;
    m_stepComplete = true;

    m_allowSleep = true;
    m_gravity.set(gravity);

    m_flags = CLEAR_FORCES;

    m_inv_dt0 = 0f;

    m_contactManager = new ContactManager(this, broadPhase);
    m_profile = new Profile();

    m_particleSystem = new ParticleSystem(this);

    initializeRegisters();
  }

```

## body和joint相关的方法
- createBody
- destroyBody
- createJoint
- destroyJoint

## 步进
TimeStep类用于管理和存储物理仿真每一帧中的时间步长信息和相关参数。这些参数用于控制物理引擎的更新过程，包括速度和位置迭代次数、时间步长的倒数等。具体说明如下：
```java
public class TimeStep {
	
	/** time step */
	public float dt;
	
	/** inverse time step (0 if dt == 0). */
	public float inv_dt;
	
	/** dt * inv_dt0 */
	public float dtRatio;
	
	public int velocityIterations;
	
	public int positionIterations;
	
	public boolean warmStarting;
}

```

计时器：
```java
/**
 * Timer for profiling
 * 
 * @author Daniel
 */
public class Timer {

  private long resetNanos;

  public Timer() {
    reset();
  }

  public void reset() {
    resetNanos = System.nanoTime();
  }

  public float getMilliseconds() {
    return (System.nanoTime() - resetNanos) / 1000 * 1f / 1000;
  }
}
```


step包含以下操作：
- stepInit: 检查并处理新添加的夹具，更新标志。
- collide: 处理碰撞检测。
- solveParticleSystem: 处理粒子系统解算。
- solve: 解算速度和位置约束。
- solveTOI: 处理时间飞行（TOI）事件。
- step: 记录总时长。

```java
  private final TimeStep step = new TimeStep();
  private final Timer stepTimer = new Timer();
  private final Timer tempTimer = new Timer();

  /**
   * Take a time step. This performs collision detection, integration, and constraint solution.
   * 
   * @param timeStep the amount of time to simulate, this should not vary.
   * @param velocityIterations for the velocity constraint solver.
   * @param positionIterations for the position constraint solver.
   */
  public void step(float dt, int velocityIterations, int positionIterations) {
    stepTimer.reset();
    tempTimer.reset();
    // log.debug("Starting step");
    // If new fixtures were added, we need to find the new contacts.
    if ((m_flags & NEW_FIXTURE) == NEW_FIXTURE) {
      // log.debug("There's a new fixture, lets look for new contacts");
      m_contactManager.findNewContacts();
      m_flags &= ~NEW_FIXTURE;
    }

    m_flags |= LOCKED;

    step.dt = dt;
    step.velocityIterations = velocityIterations;
    step.positionIterations = positionIterations;
    if (dt > 0.0f) {
      step.inv_dt = 1.0f / dt;
    } else {
      step.inv_dt = 0.0f;
    }

    step.dtRatio = m_inv_dt0 * dt;

    step.warmStarting = m_warmStarting;
    m_profile.stepInit.record(tempTimer.getMilliseconds());

    // Update contacts. This is where some contacts are destroyed.
    tempTimer.reset();
    m_contactManager.collide();
    m_profile.collide.record(tempTimer.getMilliseconds());

    // Integrate velocities, solve velocity constraints, and integrate positions.
    if (m_stepComplete && step.dt > 0.0f) {
      tempTimer.reset();
      m_particleSystem.solve(step); // Particle Simulation
      m_profile.solveParticleSystem.record(tempTimer.getMilliseconds());
      tempTimer.reset();
      solve(step);
      m_profile.solve.record(tempTimer.getMilliseconds());
    }

    // Handle TOI events.
    if (m_continuousPhysics && step.dt > 0.0f) {
      tempTimer.reset();
      solveTOI(step);
      m_profile.solveTOI.record(tempTimer.getMilliseconds());
    }

    if (step.dt > 0.0f) {
      m_inv_dt0 = step.inv_dt;
    }

    if ((m_flags & CLEAR_FORCES) == CLEAR_FORCES) {
      clearForces();
    }

    m_flags &= ~LOCKED;
    // log.debug("ending step");

    m_profile.step.record(stepTimer.getMilliseconds());
  }
```

## 求解
`solve`方法负责模拟物理世界中的动态过程，处理刚体和约束，确保物理模拟的稳定性和准确性。以下是`solve`方法的主要步骤总结：

1. **初始化性能计时器**：
    - 启动初始化、速度求解和位置求解的性能计时器。

2. **更新之前的变换**：
    - 为每个刚体保存当前的变换状态。

3. **初始化岛**：
    - 根据最大可能数量初始化岛的数据结构，包括刚体、接触和关节。

4. **清除岛标志**：
    - 清除所有刚体、接触和关节的岛标志，确保每个元素只被处理一次。

5. **构建并模拟所有唤醒的岛**：
    - 遍历所有刚体，进行深度优先搜索（DFS）构建物理岛，包含相关的刚体、接触和关节。
    - 对每个构建的岛进行物理模拟。

6. **后处理**：
    - 清除静态刚体的岛标志，允许它们在其他岛中参与模拟。
    - 记录性能计时器的结果。

7. **同步夹具并查找新接触**：
    - 同步夹具，检查刚体是否超出范围。
    - 查找新的接触点并更新接触管理器。

### 详细步骤描述
1. **初始化性能计时器**：启动初始化、速度求解和位置求解的计时器来监测性能。
2. **更新之前的变换**：遍历所有刚体，保存其当前的变换状态，为后续的物理模拟做好准备。
3. **初始化岛**：根据当前的刚体、接触和关节数量初始化岛的数据结构，准备进行物理模拟。
4. **清除岛标志**：清除所有刚体、接触和关节的岛标志，确保它们在构建和模拟物理岛时不会被重复处理。
5. **构建并模拟所有唤醒的岛**：
    - 遍历所有刚体，使用深度优先搜索（DFS）构建物理岛。
    - 对每个岛进行物理模拟，包括处理速度约束和位置约束，确保模拟结果的准确性和稳定性。
6. **后处理**：
    - 清除静态刚体的岛标志，使它们能够在其他岛中继续参与物理模拟。
    - 记录性能计时器的结果，以便分析和优化物理引擎的性能。
7. **同步夹具并查找新接触**：
    - 同步所有刚体的夹具，确保它们的位置和变换状态与物理模拟结果一致。
    - 查找新的接触点，并更新接触管理器，以便在下一个时间步长中处理新的碰撞和接触事件。

```java

```