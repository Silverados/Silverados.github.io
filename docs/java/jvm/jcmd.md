# jcmd
发送诊断命令给JVM。

## 用法
```shell
jcmd [pid | main-class] command... | PerfCounter.print | -f filename
```
- `pid`: 发送给指定进程ID
- `main-class`: 发送给所有相同主类名的进程
- `PerfCounter.print`: 打印指定Java进程公开的性能计数器。
- `-f filename`: 从特定文件读取和执行命令
- `-l`: 显示未在单独的docker进程中运行的Java虚拟机进程标识符列表，以及用于启动该进程的主类和命令行参数。如果JVM处于docker进程中，则必须使用ps之类的工具来查找PID。


指定pid,例如（22222）后用help查看可用command:
```shell
jcmd 22222 help
```

指定pid,例如（22222）后用`help`和具体的命令名，例如`GC.heap_info`:
```shell
jcmd 22222 help GC.heap_info
```

上面的命令会打印出：
```shell
$ jcmd 9276 help Thread.print
9276:
Thread.print
Print all threads with stacktraces.

Impact: Medium: Depends on the number of threads.

Permission: java.lang.management.ManagementPermission(monitor)

Syntax : Thread.print [options]

Options: (options must be specified using the <key> or <key>=<value> syntax)
        -l : [optional] print java.util.concurrent locks (BOOLEAN, false)
        -e : [optional] print extended thread information (BOOLEAN, false)
```

可用command:
- Compiler.CodeHeap_Analytics
- Compiler.codecache: 打印代码缓存布局和边界
- Compiler.codelist: 打印代码缓存中存活的所有已编译方法。
- Compiler.directives_add:
- Compiler.directives_clear:
- Compiler.directives_print:
- Compiler.directives_remove:
- Compiler.queue:
- GC.class_histogram:
- GC.finalizer_info:
- GC.heap_dump:
- GC.heap_info:
- GC.run:
- GC.run_finalization:
- JFR.check:
- JFR.configure:
- JFR.dump:
- JFR.start:
- JFR.stop:
- JVMTI.agent_load:
- JVMTI.data_dump:
- ManagementAgent.start:
- ManagementAgent.start_local:
- ManagementAgent.status:
- ManagementAgent.stop:
- Thread.print:
- VM.cds:
- VM.class_hierarchy:
- VM.classloader_stats:
- VM.classloaders:
- VM.command_line:
- VM.dynlibs:
- VM.events:
- VM.flags:
- VM.info:
- VM.log:
- VM.metaspace:
- VM.native_memory:
- VM.print_touched_methods:
- VM.set_flag:
- VM.stringtable:
- VM.symboltable:
- VM.system_properties:
- VM.systemdictionary:
- VM.uptime:
- VM.version:
- help:


# 参考
https://docs.oracle.com/en/java/javase/14/docs/specs/man/jcmd.html