# Java Microbenchmark Harness
JMH 是一个 Java 工具包，用于构建、运行和分析以 Java 和其他语言编写的、针对 JVM 的纳米/微米/毫微米/宏观基准。

## 使用方法
官方推荐使用maven设置一个依赖于应用程序jar文件的独立项目。
### 命令行
如果使用官方这个，它支持的jdk版本是6。

1. mvn构建目录test:
   ```shell
    $ mvn archetype:generate \
    -DinteractiveMode=false \
    -DarchetypeGroupId=org.openjdk.jmh \
    -DarchetypeArtifactId=jmh-java-benchmark-archetype \
    -DgroupId=org.sample \
    -DartifactId=test \
    -Dversion=1.0
   ```
2. 进入test目录，构建
    ```shell
    $ cd test/
    $ mvn clean verify
    ```
3. 执行测试：
    ```shell
    $ java -jar target/benchmarks.jar
    ```

### IDEA

使用IDEA的插件也会比较方便。但是不是官方维护的。

https://plugins.jetbrains.com/plugin/7529-jmh-java-microbenchmark-harness


## 使用案例




# 参考文献
- [Github](https://github.com/openjdk/jmh?tab=readme-ov-file)

