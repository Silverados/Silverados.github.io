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



## ChannelPipeline

一系列`ChannelHandler`处理`Channel`的入站事件和出站事件。`ChannelPipeline`实现和拦截过滤器模式，给用户提供完全的控制事件怎么被处理和`Channel`之间怎么交互。

### 创建管道

每个通道都有自己的管道，并在创建新通道时自动创建。

### 事件在管道中的流动方式

下图描述了ChannelPipeline 通常如何处理 I/O 事件ChannelHandler。I/O 事件由 或 ChannelInboundHandler 处理ChannelOutboundHandler，并通过调用 中ChannelHandlerContext定义的事件传播方法（如 ChannelHandlerContext.fireChannelRead(Object) 和 ChannelHandlerContext.write(Object)）转发到最近的处理程序。

![image-20230411151649907](C:\Users\QTZ\AppData\Roaming\Typora\typora-user-images\image-20230411151649907.png)



入站事件由入站处理程序以自下而上的方向处理，如关系图左侧所示。入站处理程序通常处理由关系图底部的 I/O 线程生成的入站数据。入站数据通常通过实际输入操作从远程对等方读取，例如 SocketChannel.read(ByteBuffer)。如果入站事件超出顶级入站处理程序，则会以静默方式丢弃该事件，或者在需要您注意时记录该事件。
出站事件由出站处理程序按自上而下的方向处理，如关系图右侧所示。出站处理程序通常会生成或转换出站流量，例如写入请求。如果出站事件超出底部出站处理程序，则由与 关联的 ChannelI/O 线程处理。I/O 线程通常执行实际的输出操作，例如 SocketChannel.write(ByteBuffer)。
例如，假设我们创建了以下管道：

```java
  ChannelPipeline p = ...;
  p.addLast("1", new InboundHandlerA());
  p.addLast("2", new InboundHandlerB());
  p.addLast("3", new OutboundHandlerA());
  p.addLast("4", new OutboundHandlerB());
  p.addLast("5", new InboundOutboundHandlerX());
```

在上面的示例中，名称以 开头的 Inbound 类表示它是一个入站处理程序。名称以 开头的 Outbound 类表示它是一个出站处理程序。
在给定的示例配置中，当事件入站时，处理程序评估顺序为 1、2、3、4、5。当事件出站时，顺序为 5、4、3、2、1。在此原则之上， ChannelPipeline 跳过某些处理程序的评估以缩短堆栈深度：
3 和 4 不实现 ChannelInboundHandler，因此入站事件的实际求值顺序为：1、2 和 5。
1 和 2 不实现 ChannelOutboundHandler，因此出站事件的实际求值顺序为：5、4 和 3。
如果 5 同时实现 ChannelInboundHandler 和 ChannelOutboundHandler，则入站事件和出站事件的求值顺序可能分别为 125 和543。

### 将事件转发到下一个处理程序

正如您可能在图中注意到的那样，处理程序必须调用事件传播方法 ChannelHandlerContext 才能将事件转发到其下一个处理程序。这些方法包括：
入站事件传播方法：

```
ChannelHandlerContext.fireChannelRegistered()
ChannelHandlerContext.fireChannelActive()
ChannelHandlerContext.fireChannelRead(Object)
ChannelHandlerContext.fireChannelReadComplete()
ChannelHandlerContext.fireExceptionCaught(Throwable)
ChannelHandlerContext.fireUserEventTriggered(Object)
ChannelHandlerContext.fireChannelWritabilityChanged()
ChannelHandlerContext.fireChannelInactive()
ChannelHandlerContext.fireChannelUnregistered()
```

出站事件传播方法：

```
ChannelHandlerContext.bind(SocketAddress, ChannelPromise)
ChannelHandlerContext.connect(SocketAddress, SocketAddress, ChannelPromise)
ChannelHandlerContext.write(Object, ChannelPromise)
ChannelHandlerContext.flush()
ChannelHandlerContext.read()
ChannelHandlerContext.disconnect(ChannelPromise)
ChannelHandlerContext.close(ChannelPromise)
ChannelHandlerContext.deregister(ChannelPromise)
```

以下示例显示了通常如何完成事件传播：

```
  public class MyInboundHandler extends ChannelInboundHandlerAdapter {
      @Override
      public void channelActive(ChannelHandlerContext ctx) {
          System.out.println("Connected!");
          ctx.fireChannelActive();
      }
  }

  public class MyOutboundHandler extends ChannelOutboundHandlerAdapter {
      @Override
      public void close(ChannelHandlerContext ctx, ChannelPromise promise) {
          System.out.println("Closing ..");
          ctx.close(promise);
      }
  }
```

### 构建管道

用户应该在管道中有一个或多个 ChannelHandler来接收 I/O 事件（例如读取）和请求 I/O 操作（例如写入和关闭）。例如，典型的服务器在每个通道的管道中具有以下处理程序，但您的里程可能会因协议和业务逻辑的复杂性和特征而异：
协议解码器 - 将二进制数据（例如 ByteBuf）转换为Java对象。
协议编码器 - 将 Java 对象转换为二进制数据。
业务逻辑处理程序 - 执行实际的业务逻辑（例如数据库访问）。
它可以表示如下例所示：

```
  static final EventExecutorGroup group = new DefaultEventExecutorGroup(16);
  ...

  ChannelPipeline pipeline = ch.pipeline();

  pipeline.addLast("decoder", new MyProtocolDecoder());
  pipeline.addLast("encoder", new MyProtocolEncoder());

  // Tell the pipeline to run MyBusinessLogicHandler's event handler methods
  // in a different thread than an I/O thread so that the I/O thread is not blocked by
  // a time-consuming task.
  // If your business logic is fully asynchronous or finished very quickly, you don't
  // need to specify a group.
  pipeline.addLast(group, "handler", new MyBusinessLogicHandler());
```

请注意，在使用 DefaultEventLoopGroup 时将卸载操作 EventLoop ，它仍将以串行方式 ChannelHandlerContext 处理任务，从而保证排序。由于订购，它仍然可能成为一个瓶颈。如果您的用例不需要排序，您可能需要考虑使用 以 UnorderedThreadPoolEventExecutor 最大化任务执行的并行性。

### 线程安全

可以随时添加或删除 ChannelHandler ，因为 是 ChannelPipeline 线程安全的。例如，可以在要交换敏感信息时插入加密处理程序，并在交换后将其删除。





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

