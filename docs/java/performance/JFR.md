# Java Flight Record
Java Flight Recorder (JFR) 是一种用于收集运行中 Java 应用程序的诊断和剖析数据的工具。

## 启动JFR
### 程序未启动时
在程序启动时：
```shell
java -XX:StartFlightRecording=name=MyRecording,filename=myrecording.jfr,dumponexit=true -jar YourApp.jar
```
- name: 录制的名称
- filename: 录制的文件名。
- dumponexit: 是否在退出时进行录制

### 程序启动后
在程序启动后：

查看目标进程得到pid：
```shell
jcmd -l
```

启动JFR：
```shell
jcmd <pid> JFR.start name=MyRecording filename=myrecording.jfr
```

### 启动模式
在使用 `jcmd <pid> JFR.start` 启动 Java Flight Recorder (JFR) 时，你可以通过设置录制的模式来控制 JFR 收集的事件类型和详细程度。JFR 提供了几种不同的设置模式，这些模式控制了事件的采样频率、详细程度等。你可以通过 `settings` 参数来指定不同的配置文件。

### 常见的 JFR 启动模式
JFR 自带了几种默认的配置文件，常见的有以下几种：

1. **`default`（默认模式）**：捕获基本的 JVM 性能数据，适合大多数情况。
2. **`profile`（性能分析模式）**：捕获较为详细的性能数据，适用于性能分析和调优。
3. **`continuous`（持续模式）**：适用于长期运行的应用，采样率较低，适合监控应用的整体健康状况。

### 使用 `jcmd` 命令设置启动模式
你可以通过 `settings` 参数来指定使用哪种模式。示例如下：

```bash
jcmd <pid> JFR.start name=MyRecording filename=myrecording.jfr settings=profile
```

在这个示例中，`profile` 模式将被用作启动模式，收集更加详细的事件数据。

### 启动模式的配置文件位置
这些默认模式对应的 JFR 配置文件位于 JDK 的 `lib/jfr` 目录下：

- `default.jfc`：默认配置文件，捕获 JVM 的基础性能信息，文件位置为 `<JAVA_HOME>/lib/jfr/default.jfc`。
- `profile.jfc`：性能分析配置文件，捕获较为详细的事件，文件位置为 `<JAVA_HOME>/lib/jfr/profile.jfc`。
- `continuous.jfc`：适合长期监控的配置文件，文件位置为 `<JAVA_HOME>/lib/jfr/continuous.jfc`。

如果你想要自定义设置，也可以创建自己的 `.jfc` 文件并指定文件路径：

```bash
jcmd <pid> JFR.start name=MyRecording filename=myrecording.jfr settings=/path/to/your/custom_settings.jfc
```

### 其他常用参数

除了 `settings`，你还可以使用以下参数来自定义 JFR 的录制行为：

- **`duration`**：指定录制的持续时间。例如，录制 2 分钟：
  ```bash
  jcmd <pid> JFR.start name=MyRecording filename=myrecording.jfr duration=2m
  ```

- **`maxsize`**：指定录制文件的最大大小（单位可以是 `k`, `m`, `g`）。
  ```bash
  jcmd <pid> JFR.start name=MyRecording filename=myrecording.jfr maxsize=100m
  ```

- **`maxage`**：指定录制事件保留的最长时间（例如，设置为 `30s` 或 `10m`）。超过这个时间，较早的事件将被覆盖：
  ```bash
  jcmd <pid> JFR.start name=MyRecording filename=myrecording.jfr maxage=10m
  ```

通过这些参数，你可以灵活控制 JFR 的启动模式和录制行为，以便适应不同的分析需求。

## 停止JFR
```shell
jcmd <pid> JFR.stop name=MyRecording
```

