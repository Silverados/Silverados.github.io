# Native性能优化之Native transports
## 理论方面
理论方面的展开可以看原文：https://netty.io/wiki/native-transports.html

Netty针对不同的操作系统提供了不同的`JNI`协议, 这些协议相比`NIO`通常产生更少的垃圾、提供更高的性能。

### Linux平台
引入`Maven`依赖：
```xml
 <dependencies>
    <dependency>
      <groupId>io.netty</groupId>
      <artifactId>netty-transport-native-epoll</artifactId>
      <version>${project.version}</version>
      <classifier>linux-x86_64</classifier>
    </dependency>
  </dependencies>
```

替代的组件为：
- NioEventLoopGroup → EpollEventLoopGroup
- NioEventLoop → EpollEventLoop
- NioServerSocketChannel → EpollServerSocketChannel
- NioSocketChannel → EpollSocketChannel


### MacOS/BSD平台
引入`Maven`依赖：
```xml
  <dependencies>
    <dependency>
        <groupId>io.netty</groupId>
        <artifactId>netty-transport-native-kqueue</artifactId>
        <version>${project.version}</version>
        <classifier>osx-x86_64</classifier>
    </dependency>
</dependencies>
```

替代的组件为：
- NioEventLoopGroup → KQueueEventLoopGroup
- NioEventLoop → KQueueEventLoop
- NioServerSocketChannel → KQueueServerSocketChannel
- NioSocketChannel → KQueueSocketChannel

## 代码实现
代码实现这块我研究了一下其他库的实现，参考下怎么写好我的实现。

### 前置知识
- 可以通过`Epoll.isAvailable()`判断`Epoll`是否可用。
- 可以通过`KQueue.isAvailable()`判断`KQueue``是否可用。

### sofa-bolt
[SOFABolt](https://github.com/sofastack/sofa-bolt) 是蚂蚁金融服务集团开发的一套基于 Netty 实现的网络通信框架。

这里实现了`NettyEventLoopUtil`， 通过配置开关和判断`Epoll`是否可用来决定使用`Nio`还是`Epoll`：
```java
public class NettyEventLoopUtil {

    private static boolean epollEnabled = ConfigManager.netty_epoll() && Epoll.isAvailable();

    public static EventLoopGroup newEventLoopGroup(int nThreads, ThreadFactory threadFactory) {
        return epollEnabled ? new EpollEventLoopGroup(nThreads, threadFactory)
            : new NioEventLoopGroup(nThreads, threadFactory);
    }
    public static Class<? extends SocketChannel> getClientSocketChannelClass() {
        return epollEnabled ? EpollSocketChannel.class : NioSocketChannel.class;
    }
    
    public static Class<? extends ServerSocketChannel> getServerSocketChannelClass() {
        return epollEnabled ? EpollServerSocketChannel.class : NioServerSocketChannel.class;
    }
}
```

### Kcp
[KCP](https://github.com/l42111996/java-Kcp)是一个基于udp的快速可靠协议(rudp)，能以比 TCP浪费10%-20%的带宽的代价，换取平均延迟降低 30%-40%，且最大延迟降低三倍的传输效果。

这里的的实现没有提取到工具类，复合在`KcpServer`中，相比之类做了`KQueue`的兼容：
```java
        boolean epoll = Epoll.isAvailable();
        boolean kqueue = KQueue.isAvailable();
        bootstrap = new Bootstrap();
        int cpuNum = Runtime.getRuntime().availableProcessors();
        int bindTimes = 1;
        if (epoll||kqueue) {
            //ADD SO_REUSEPORT ？ https://www.jianshu.com/p/61df929aa98b
            bootstrap.option(EpollChannelOption.SO_REUSEPORT, true);
            bindTimes = cpuNum;
        }
        Class<? extends Channel> channelClass = null;
        if(epoll){
            group = new EpollEventLoopGroup(cpuNum);
            channelClass = EpollDatagramChannel.class;
        }else if(kqueue){
            group = new KQueueEventLoopGroup(cpuNum);
            channelClass = KQueueDatagramChannel.class;
        }else{
            group = new NioEventLoopGroup(ports.length);
            channelClass = NioDatagramChannel.class;
        }
```

### 公司自研项目
这个是公司项目的实现, 根据平台来决定使用哪种，但是现在想想这种实现还是有问题的因为`epoll native transport`，需要`Linux with 64-bit kernel 2.6 or higher`和一些其他的库，那么就是说如果是CentOS5,6那么就会有异常：
```java
public class Platform {
    public static final boolean IS_WINDOWS = System.getProperty("os.name").toUpperCase().startsWith("WINDOWS");
    public static final boolean IS_LINUX = System.getProperty("os.name").toUpperCase().startsWith("LINUX");
    public static final boolean IS_UNIX = System.getProperty("os.name").toUpperCase().startsWith("UNIX");
    public static final boolean IS_MAC = System.getProperty("os.name").toUpperCase().startsWith("MAC");

    public static Class<? extends EventLoopGroup> getEventLoopGroupClass() {
        if (IS_LINUX) {
            return EpollEventLoopGroup.class;
        } else if (IS_UNIX) {
            return KQueueEventLoopGroup.class;
        } else if (IS_MAC) {
            return KQueueEventLoopGroup.class;
        } else if (IS_WINDOWS) {
            return NioEventLoopGroup.class;
        } else {
            LoggerFactory.stdout().error(String.format("unsupport platform:%s", System.getProperty("os.name")));
            return null;
        }
    }

    public static Class<? extends ServerChannel> getServerSocketChannelClass() {
        if (IS_LINUX) {
            return EpollServerSocketChannel.class;
        } else if (IS_UNIX) {
            return KQueueServerSocketChannel.class;
        } else if (IS_MAC) {
            return KQueueServerSocketChannel.class;
        } else if (IS_WINDOWS) {
            return NioServerSocketChannel.class;
        } else {
            LoggerFactory.stdout().error(String.format("unsupport platform:%s", System.getProperty("os.name")));
            return null;
        }
    }

    public static Class<? extends DatagramChannel> getServerUdpChannelClass() {
        if (Epoll.isAvailable()) {
            return EpollDatagramChannel.class;
        } else if (KQueue.isAvailable()) {
            return KQueueDatagramChannel.class;
        } else {
            return NioDatagramChannel.class;
        }
    }

    public static Class<? extends Channel> getSocketChannelClass() {
        if (IS_LINUX) {
            return EpollSocketChannel.class;
        } else if (IS_UNIX) {
            return KQueueSocketChannel.class;
        } else if (IS_MAC) {
            return KQueueSocketChannel.class;
        } else if (IS_WINDOWS) {
            return NioSocketChannel.class;
        } else {
            LoggerFactory.stdout().error(String.format("unsupport platform:%s", System.getProperty("os.name")));
            return null;
        }
    }
}
```

### Dubbo
[Apache Dubbo](https://github.com/apache/dubbo) 是一个高性能基于Java的RPC框架。

具体的实现在`dubbo-remoting-netty4`的`NettyEventLoopFactory`里，可以看到和前面`SOFABolt`挺相似的。
```java
public class NettyEventLoopFactory {
    /**
     * netty client bootstrap
     */
    public static final GlobalResourceInitializer<EventLoopGroup> NIO_EVENT_LOOP_GROUP = new GlobalResourceInitializer<>(() ->
        eventLoopGroup(Constants.DEFAULT_IO_THREADS, "NettyClientWorker"),
        eventLoopGroup -> eventLoopGroup.shutdownGracefully()
    );

    public static EventLoopGroup eventLoopGroup(int threads, String threadFactoryName) {
        ThreadFactory threadFactory = new DefaultThreadFactory(threadFactoryName, true);
        return shouldEpoll() ? new EpollEventLoopGroup(threads, threadFactory) :
                new NioEventLoopGroup(threads, threadFactory);
    }

    public static Class<? extends SocketChannel> socketChannelClass() {
        return shouldEpoll() ? EpollSocketChannel.class : NioSocketChannel.class;
    }

    public static Class<? extends ServerSocketChannel> serverSocketChannelClass() {
        return shouldEpoll() ? EpollServerSocketChannel.class : NioServerSocketChannel.class;
    }

    private static boolean shouldEpoll() {
        if (Boolean.parseBoolean(System.getProperty(NETTY_EPOLL_ENABLE_KEY, "false"))) {
            String osName = System.getProperty(OS_NAME_KEY);
            return osName.toLowerCase().contains(OS_LINUX_PREFIX) && Epoll.isAvailable();
        }

        return false;
    }
}
```

### 最终实现代码
这里给出一份我最终实现的代码，：

```java
public class NettyEventLoopFactory {
    public static final boolean epollEnabled = Epoll.isAvailable();
    public static final boolean kQueueEnabled = KQueue.isAvailable();
    private static final int DEFAULT_EVENT_LOOP_THREADS;

    static {
        DEFAULT_EVENT_LOOP_THREADS = Math.max(1, SystemPropertyUtil.getInt(
                "io.netty.eventLoopThreads", NettyRuntime.availableProcessors() * 2));
    }

    public static EventLoopGroup newEventLoopGroup() {
        return newEventLoopGroup(DEFAULT_EVENT_LOOP_THREADS);
    }

    public static EventLoopGroup newEventLoopGroup(int threads) {
        return newEventLoopGroup(threads, (ThreadFactory) null);
    }

    public static EventLoopGroup newEventLoopGroup(int threads, String threadFactoryName) {
        return newEventLoopGroup(threads, new DefaultThreadFactory(threadFactoryName));
    }

    public static EventLoopGroup newEventLoopGroup(int threads, ThreadFactory threadFactory) {
        if (epollEnabled) {
            return new EpollEventLoopGroup(threads, threadFactory);
        }
        if (kQueueEnabled) {
            return new KQueueEventLoopGroup(threads, threadFactory);
        }
        return new NioEventLoopGroup(threads, threadFactory);
    }

    public static Class<? extends SocketChannel> newSocketChannel() {
        if (epollEnabled) {
            return EpollSocketChannel.class;
        }
        if (kQueueEnabled) {
            return KQueueSocketChannel.class;
        }
        return NioSocketChannel.class;
    }

    public static Class<? extends ServerSocketChannel> newServerSocketChannel() {
        if (epollEnabled) {
            return EpollServerSocketChannel.class;
        }
        if (kQueueEnabled) {
            return KQueueServerSocketChannel.class;
        }
        return NioServerSocketChannel.class;
    }
}
```