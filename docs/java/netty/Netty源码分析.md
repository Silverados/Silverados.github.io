# Netty源码分析

## Channel

通道为用户提供：

- 通道的当前状态（例如，通道是否打开？是否已连接？）
- 通道的配置参数（例如接收缓冲区大小）
- 通道支持的IO操作（例如读取，写入，连接和绑定）
- 以及处理与通道关联的所有IO事件和请求的ChannelPipeline。



Netty 中的所有 IO 操作都是异步的。这意味着任何 IO 调用都将立即返回，而不保证请求的 IO 操作在调用结束时已完成。相反，您将返回一个 ChannelFuture 实例，该实例将在请求的 IO 操作成功、失败或取消时通知您。



Channel可以有父Channel，具体取决于其创建方式。例如，被`ServerSocketChannel`接受的`SocketChannel`将在`parent()`上返回`ServerSocketChannel`作为其父级。层次结构的语义取决于通道所属的传输实现。例如，您可以编写一个新的通道实现，用于创建共享一个套接字连接的子通道，就像 BEEP 和 SSH 所做的那样。



某些传输公开特定于传输的其他操作。将`Channel`向下转换为子类型以调用此类操作。例如，对于旧的 IO 数据报传输，`DatagramChannel`提供多播联接离开操作。



调用`close`或`close(ChannelPromise)`以释放所有资源非常重要，一旦你完成了通道。这可确保以正确的方式释放所有资源，即文件句柄。



## Bootstrap&&ServerBootstrap





## EventLoopGroup

特殊事件执行器组，允许注册在事件循环期间处理以供以后选择的通道。

```java
public interface EventLoopGroup extends EventExecutorGroup {
    @Override
    EventLoop next();

    ChannelFuture register(Channel channel);

    ChannelFuture register(ChannelPromise promise);
}
```



`EventExecutorGroup` 负责通过其 `next()` 方法提供 `EventExecutor` 以供使用。除此之外，它还负责处理它们的生命周期，并允许以全局方式关闭它们。

```java
public interface EventExecutorGroup extends ScheduledExecutorService, Iterable<EventExecutor> {
    EventExecutor next();
}
```



`EventExecutor` 是一个特殊的 `EventExecutorGroup`，它附带了一些方便的方法来查看线程是否在事件循环中执行。除此之外，它还扩展了 `EventExecutorGroup`，以允许访问方法的通用方法

```java
public interface EventExecutor extends EventExecutorGroup {
    @Override
    EventExecutor next();
    
    EventExecutorGroup parent();
}
```







注册后将处理通道的所有 IO 操作。一个 EventLoop 实例通常会处理多个通道，但这可能取决于实现细节和内部结构。

```java
public interface EventLoop extends OrderedEventExecutor, EventLoopGroup {
    @Override
    EventLoopGroup parent();
}
```

