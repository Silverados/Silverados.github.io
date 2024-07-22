# Profile
Profile 类通常用于记录和分析性能数据，以便进行调试和优化。

## ProfileEntry
`ProfileEntry`类用于存储和管理性能分析数据：

- **longAvg**: 长期平均值，用于记录一段较长时间内的平均值。
- **shortAvg**: 短期平均值，用于记录最近一段时间内的平均值。
- **min**: 最小值，用于记录测量期间的最小值。
- **max**: 最大值，用于记录测量期间的最大值。
- **accum**: 累积值，用于记录当前累积的时间或值，通常用于计算平均值。

这些变量帮助跟踪不同时间段的性能表现，识别出在哪些地方需要进行优化。

```java
  public static class ProfileEntry {
    float longAvg;
    float shortAvg;
    float min;
    float max;
    float accum;

    public ProfileEntry() {
      min = Float.MAX_VALUE;
      max = -Float.MAX_VALUE;
    }

    public void record(float value) {
      longAvg = longAvg * (1 - LONG_FRACTION) + value * LONG_FRACTION;
      shortAvg = shortAvg * (1 - SHORT_FRACTION) + value * SHORT_FRACTION;
      min = MathUtils.min(value, min);
      max = MathUtils.max(value, max);
    }

    public void startAccum() {
      accum = 0;
    }

    public void accum(float value) {
      accum += value;
    }

    public void endAccum() {
      record(accum);
    }

    @Override
    public String toString() {
      return String.format("%.2f (%.2f) [%.2f,%.2f]", shortAvg, longAvg, min, max);
    }
  }
```

## Profile

### 常量
```java
  private static final int LONG_AVG_NUMS = 20;
  private static final float LONG_FRACTION = 1f / LONG_AVG_NUMS;
  private static final int SHORT_AVG_NUMS = 5;
  private static final float SHORT_FRACTION = 1f / SHORT_AVG_NUMS;
```
这些静态常量用于计算`ProfileEntry`类中长期和短期平均值的参数。以下是它们的用途说明：

- **LONG_AVG_NUMS**: 表示用于计算长期平均值的采样数量。这里设置为20，意味着长期平均值是基于最近20个测量值计算的。
- **LONG_FRACTION**: 表示长期平均值计算中的权重。其值为1/20，用于将新的测量值纳入长期平均值计算中。
- **SHORT_AVG_NUMS**: 表示用于计算短期平均值的采样数量。这里设置为5，意味着短期平均值是基于最近5个测量值计算的。
- **SHORT_FRACTION**: 表示短期平均值计算中的权重。其值为1/5，用于将新的测量值纳入短期平均值计算中。

这些常量用于平滑处理性能数据，使得平均值计算更为稳定和准确。


### 记录字段
`ProfileEntry`对象用于在JBox2D中进行性能分析和调试，帮助开发者了解不同阶段的时间消耗，从而优化物理仿真过程。每个`ProfileEntry`代表一个特定的步骤或阶段:
- **step**: 代表整个物理仿真步骤的总时间。用于衡量每个仿真步骤所花费的总时间。
- **stepInit**: 表示初始化步骤所花费的时间。这包括在开始仿真步骤之前所需的初始化操作。
- **collide**: 表示碰撞检测阶段所花费的时间。这包括检测物体之间的碰撞和处理碰撞事件。
- **solveParticleSystem**: 表示粒子系统求解阶段所花费的时间。这包括处理和更新粒子系统中的物理效果。
- **solve**: 代表求解阶段的总时间。用于解决物理系统中的所有约束和力。
- **solveInit**: 表示求解初始化阶段所花费的时间。这包括在实际求解之前的预处理步骤。
- **solveVelocity**: 表示速度求解阶段所花费的时间。这包括根据施加的力和碰撞来更新物体的速度。
- **solvePosition**: 表示位置求解阶段所花费的时间。这包括根据更新后的速度来调整物体的位置。
- **broadphase**: 表示宽相阶段所花费的时间。宽相用于快速粗略地检测可能发生碰撞的物体对，以减少需要进行详细碰撞检测的物体对数量。
- **solveTOI**: 表示时间步长内碰撞（TOI）求解阶段所花费的时间。TOI处理在时间步长内发生的碰撞，确保物体在多个碰撞事件中正确地响应。

这些`ProfileEntry`实例有助于识别和优化物理仿真中的瓶颈，使开发者能够改进引擎性能。
```java
  public final ProfileEntry step = new ProfileEntry();
  public final ProfileEntry stepInit = new ProfileEntry();
  public final ProfileEntry collide = new ProfileEntry();
  public final ProfileEntry solveParticleSystem = new ProfileEntry();
  public final ProfileEntry solve = new ProfileEntry();
  public final ProfileEntry solveInit = new ProfileEntry();
  public final ProfileEntry solveVelocity = new ProfileEntry();
  public final ProfileEntry solvePosition = new ProfileEntry();
  public final ProfileEntry broadphase = new ProfileEntry();
  public final ProfileEntry solveTOI = new ProfileEntry();
```

