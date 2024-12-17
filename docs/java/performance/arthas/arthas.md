# arthas

## 链接
https://arthas.aliyun.com/doc/

## 下载启动
```shell
curl -O https://arthas.aliyun.com/arthas-boot.jar
java -jar arthas-boot.jar
```

镜像：
```shell
java -jar arthas-boot.jar --repo-mirror aliyun --use-http
```

## docker容器内
```shell
docker exec -it  instance_1-instance-1 /bin/bash -c "curl -O https://arthas.aliyun.com/arthas-boot.jar && java -jar arthas-boot.jar"
```

## 表达式核心变量

```java
public class Advice {

    private final ClassLoader loader;
    private final Class<?> clazz;
    private final ArthasMethod method;
    private final Object target;
    private final Object[] params;
    private final Object returnObj;
    private final Throwable throwExp;
    private final boolean isBefore;
    private final boolean isThrow;
    private final boolean isReturn;

    // getter/setter
}
```

| 变量名 | 变量解释 |
| --- | --- |
| `loader` | 本次调用类所在的 ClassLoader |
| `clazz` | 本次调用类的 Class 引用 |
| `method` | 本次调用方法反射引用 |
| `target` | 本次调用类的实例 |
| `params` | 本次调用参数列表，这是一个数组，如果方法是无参方法则为空数组 |
| `returnObj` | 本次调用返回的对象。当且仅当 `isReturn`==true 成立时候有效，表明方法调用是以正常返回的方式结束。如果当前方法无返回值 `void`，则值为 `null` |
| `throwExp` | 本次调用抛出的异常。当且仅当 `isThrow`==true 成立时有效，表明方法调用是以抛出异常的方式结束。 |
| `isBefore` | 辅助判断标记，当前的通知节点有可能是在方法一开始就通知，此时 `isBefore`==true 成立，同时 `isThrow`==false 和 `isReturn`==false，因为在方法刚开始时，还无法确定方法调用将会如何结束。 |
| `isThrow` | 辅助判断标记，当前的方法调用以抛异常的形式结束。 |
| `isReturn` | 辅助判断标记，当前的方法调用以正常返回的形式结束。 |



## 命令列表

### jvm 相关

- dashboard - 当前系统的实时数据面板
- getstatic - 查看类的静态属性
- heapdump - dump java heap, 类似 jmap 命令的 heap dump 功能
  - `heapdump arthas-output/dump.hprof`: dump到指定文件
  - `heapdump --live arthas-output/dump.hprof`: 只dump live对象
- jvm - 查看当前 JVM 的信息
- logger - 查看和修改 logger
- mbean - 查看 Mbean 的信息
- memory - 查看 JVM 的内存信息
- ognl - 执行 ognl 表达式
- perfcounter - 查看当前 JVM 的 Perf Counter 信息
- sysenv - 查看 JVM 的环境变量
- sysprop - 查看和修改 JVM 的系统属性
- thread - 查看当前 JVM 的线程堆栈信息
  - 没有参数时，按CPU增量时间降序排序，只显示第一页数据
  - `thread 1`: 显式指定线程的运行堆栈
  - `thread -n 3`: 展示当前最忙的前N个线程并打印堆栈
  - `thread -b`: 当前阻塞其他线程的线程
- vmoption - 查看和修改 JVM 里诊断相关的 option
  - `vmoption`: 查看所有的option
  - `vmoption PrintGC`: 查看指定的option
  - `vmoption PrintGC true`: 更新指定的option
- vmtool - 从 jvm 里查询对象，执行 forceGc
  - https://docs.oracle.com/javase/8/docs/platform/jvmti/jvmti.html
  - `vmtool --action getInstances --className java.lang.Thread --limit 10`
  - `vmtool --action forceGc`: 强制GC
  - `vmtool --action interruptThread -t 1`: 中断指定线程

### class/classloader 相关

- classloader - 查看 classloader 的继承树，urls，类加载信息，使用 classloader 去 getResource
- dump - dump 已加载类的 byte code 到特定目录.
  - `dump -d /tmp/output java.lang.String`: dump字节码, -d 指定目录
  - `dump demo.*`: dump整个目录
- jad - 反编译指定已加载类的源码
  - `jad java.lang.String`: 反编译字节码, 输出到控制台
  - `jad demo.MathGame main`: 反编译指定函数
- mc - 内存编译器，内存编译`.java`文件为`.class`文件
  - `mc /tmp/Test.java`
  - `mc -d /tmp/output /tmp/TestA.java /tmp/TestB.java`: 多个文件
- redefine - 加载外部的`.class`文件，redefine 到 JVM 里
  - redefine 的 class 不能修改、添加、删除类的 field 和 method，包括方法参数、方法名称及返回值
  - 正在跑的函数，没有退出不能生效
- retransform - 加载外部的`.class`文件，retransform 到 JVM 里
  - `retransform /tmp/MathGame.class`: retransform指定的class，每加载一个class文件，则会记录一个retransform entry
  - `retransform -l`: 查看所有的retransform entry
  - `retransform -d 1`: 删除指定的retransform entry
  - `retransform --deleteAll`: 删除所有的retransform entry
  - `retransform --classPattern demo.MathGame`: 显式触发retransform
  - 某个类执行 retransform 之后，想消除影响可以删除该类的 retransform entry也可以触发 retransform
- sc - 查看 JVM 已加载的类信息
- sm - 查看已加载类的方法信息

结合jad/mc/retransform，热更新某个类：
```shell
jad --source-only com.example.demo.arthas.user.UserController > /tmp/UserController.java
mc /tmp/UserController.java -d /tmp
retransform /tmp/com/example/demo/arthas/user/UserController.class
```


## monitor/watch/trace 相关

::: warning
请注意，这些命令，都通过字节码增强技术来实现的，会在指定类的方法中插入一些切面来实现数据统计和观测，因此在线上、预发使用时，请尽量明确需要观测的类、方法以及条件，诊断结束要执行 `stop` 或将增强过的类执行 `reset` 命令。
:::

- monitor - 方法执行监控
- stack - 输出当前方法被调用的调用路径
- trace - 方法内部调用路径，并输出方法路径上的每个节点上耗时
- tt - 方法执行数据的时空隧道，记录下指定方法每次调用的入参和返回信息，并能对这些不同的时间下调用进行观测
- watch - 方法执行数据观测
  - watch 命令定义了 4 个观察事件点，即 -b 函数调用前，-e 函数异常后，-s 函数返回后，-f 函数结束后。-f 默认打开
  - -x 指定输出结果的属性遍历深度，默认值为1，最大值为4。 m <arg>指定Class最大匹配数量，默认为50
  - 观察表达式，默认值是{params, target, returnObj}, 参数，this对象，返回值
  - `watch demo.MathGame primeFactors 'target.illegalArgumentCount'`: 访问当前对象的某个属性

## profiler/火焰图

- profiler对应用采样，生成火焰图
- jfr - 动态开启关闭 JFR 记录

## 鉴权

- auth - 鉴权

## options

- options - 查看或设置 Arthas 全局开关

## 管道

Arthas 支持使用管道对上述命令的结果进行进一步的处理，如`sm java.lang.String * | grep 'index'`

- grep - 搜索满足条件的结果
- plaintext - 将命令的结果去除 ANSI 颜色
- wc - 按行统计输出结果

## 后台异步任务

当线上出现偶发的问题，比如需要 watch 某个条件，而这个条件一天可能才会出现一次时，异步后台任务就派上用场了，详情请参考这里

- 使用 `>` 将结果重写向到日志文件，使用 `&` 指定命令是后台运行，session 断开不影响任务执行（生命周期默认为 1 天）
- jobs - 列出所有 job
- kill - 强制终止任务
- fg - 将暂停的任务拉到前台执行
- bg - 将暂停的任务放到后台执行


## 基础命令

- base64 - base64 编码转换，和 linux 里的 base64 命令类似
- cat - 打印文件内容，和 linux 里的 cat 命令类似
- cls - 清空当前屏幕区域
- echo - 打印参数，和 linux 里的 echo 命令类似
- grep - 匹配查找，和 linux 里的 grep 命令类似
- help - 查看命令帮助信息
- history - 打印命令历史
- keymap - Arthas 快捷键列表及自定义快捷键
- pwd - 返回当前的工作目录，和 linux 命令类似
- quit - 退出当前 Arthas 客户端，其他 Arthas 客户端不受影响
- reset - 重置增强类，将被 Arthas 增强过的类全部还原，Arthas 服务端关闭时会重置所有增强过的类
- session - 查看当前会话的信息
- stop - 关闭 Arthas 服务端，所有 Arthas 客户端全部退出
- tee - 复制标准输入到标准输出和指定的文件，和 linux 里的 tee 命令类似
- version - 输出当前目标 Java 进程所加载的 Arthas 版本号
