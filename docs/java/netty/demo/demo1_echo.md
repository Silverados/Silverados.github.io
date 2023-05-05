# Netty案例(一)--回显服务器
这个案例希望实现的是一个回显的服务端+客户端。例如客户端发送"Hello"，服务端会返回一个"Hello"。通过这个案例，可以了解到以下的知识：
1. 基本的`Bootstrap`和`ServerBootstrap`启动流程。
2. 怎么支持`SSL`。
3. 客户端如何从控制台获得输入并发送到服务端。
4. 编解码器使用。

## 依赖安装
首先引入`Netty`依赖：
```xml
        <dependency>
            <groupId>io.netty</groupId>
            <artifactId>netty-all</artifactId>
            <version>4.1.90.Final</version>
        </dependency>
```

## 实现服务端
首先这里声明下`eventLoopGroup`相关的使用[Native Transports](/java/netty/Netty性能优化_Native_Transports.md)的`NettyEventLoopFactory`实现。
`SSL`相关的使用[TLS](/java/netty/Netty_TLS.md)中的`NettySslUtil`实现。

这里实现`EchoServer`，可以说这个实现就是一个范式:
```java
import io.netty.bootstrap.ServerBootstrap;
import io.netty.channel.ChannelOption;
import io.netty.channel.EventLoopGroup;
import io.netty.handler.ssl.SslContext;
import silverados.github.io.netty.NettyEventLoopFactory;
import silverados.github.io.netty.NettySslUtil;

public class EchoServer {
    public static final int PORT = 8888;

    public static void main(String[] args) {
        EventLoopGroup bossGroup = NettyEventLoopFactory.newEventLoopGroup(1);
        EventLoopGroup workerGroup = NettyEventLoopFactory.newEventLoopGroup();
        try {
            final SslContext sslContext = NettySslUtil.buildSslServerContext();
            ServerBootstrap serverBootstrap = new ServerBootstrap();
            serverBootstrap.group(bossGroup, workerGroup);
            serverBootstrap.channel(NettyEventLoopFactory.serverSocketChannelClass())
                           .option(ChannelOption.SO_BACKLOG, 1024)
                           .childHandler(new EchoServerInitializer(sslContext));
            serverBootstrap.bind(PORT).sync().channel().closeFuture().sync();
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            bossGroup.shutdownGracefully();
            workerGroup.shutdownGracefully();
        }
    }
}

```

接下来实现的是`EchoServerInitializer`, 这个地方因为传来的是字节流首先我们先用`LineBaseFrameDecoder`进行切割, 然后再转为`String`, 最后再对字符串进行处理:
```java
import io.netty.channel.ChannelInitializer;
import io.netty.channel.ChannelPipeline;
import io.netty.channel.socket.SocketChannel;
import io.netty.handler.codec.LineBasedFrameDecoder;
import io.netty.handler.codec.string.StringDecoder;
import io.netty.handler.codec.string.StringEncoder;
import io.netty.handler.ssl.SslContext;


public class EchoServerInitializer extends ChannelInitializer<SocketChannel> {
    private SslContext sslContext;
    private static final StringDecoder STRING_DECODER = new StringDecoder();
    private static final StringEncoder STRING_ENCODER = new StringEncoder();
    private static final EchoServerHandler SERVER_HANDLER = new EchoServerHandler();

    public EchoServerInitializer(SslContext sslContext) {
        this.sslContext = sslContext;
    }

    @Override
    protected void initChannel(SocketChannel ch) throws Exception {
        ChannelPipeline p = ch.pipeline();

        if (sslContext != null) {
            p.addLast(sslContext.newHandler(ch.alloc()));
        }

        p.addLast(new LineBasedFrameDecoder(1024));
        p.addLast(STRING_ENCODER);
        p.addLast(STRING_DECODER);
        p.addLast(SERVER_HANDLER);
    }
}
```

`EchoServerHandler`的实现如下，在接收到`bye`时关闭连接，这里有两个需要注意的地方：一个是注解`Sharable`，另一个是`response`里的加上的`\r\n`。
```java
import io.netty.channel.*;

@ChannelHandler.Sharable
public class EchoServerHandler extends SimpleChannelInboundHandler<String> {
    @Override
    protected void channelRead0(ChannelHandlerContext ctx, String msg) throws Exception {
        String response;
        boolean close = false;
        if ("bye".equalsIgnoreCase(msg)) {
            response = "Bye!!!";
            close = true;
        } else {
            response = msg;
        }

        ChannelFuture future = ctx.write(response + "\r\n");
        if (close) {
            future.addListener(ChannelFutureListener.CLOSE);
        }
    }

    @Override
    public void channelReadComplete(ChannelHandlerContext ctx) throws Exception {
        ctx.flush();
    }

    @Override
    public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) throws Exception {
        cause.printStackTrace();
        ctx.close();
    }
}
```

## 实现客户端
这里从控制台接受输入，需要注意的还是`\r\n`，这个而是我们分隔数据的标识。
```java
import io.netty.bootstrap.Bootstrap;
import io.netty.channel.Channel;
import io.netty.channel.ChannelFuture;
import io.netty.channel.ChannelOption;
import io.netty.channel.EventLoopGroup;
import io.netty.handler.ssl.SslContext;
import silverados.github.io.netty.NettyEventLoopFactory;
import silverados.github.io.netty.NettySslUtil;

import java.io.BufferedReader;
import java.io.InputStreamReader;

public class EchoClient {
    public static String HOST = "localhost";
    public static int PORT = EchoServer.PORT;
    public static void main(String[] args) {
        EventLoopGroup group = NettyEventLoopFactory.newEventLoopGroup();
        try {
            final SslContext sslContext = NettySslUtil.buildSslClientContext();
            Bootstrap bootstrap = new Bootstrap();
            bootstrap.group(group);
            bootstrap.channel(NettyEventLoopFactory.socketChannelClass())
                     .option(ChannelOption.TCP_NODELAY, true)
                     .handler(new EchoClientInitializer(sslContext));

            ChannelFuture lastFuture = null;
            BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));
            Channel channel = bootstrap.connect(HOST, PORT).sync().channel();
            for(;;) {
                String line = reader.readLine();
                if (line == null) {
                    break;
                }

                lastFuture = channel.writeAndFlush(line + "\r\n");

                if ("bye".equalsIgnoreCase(line)) {
                    channel.closeFuture().sync();
                    break;
                }
            }

            if (lastFuture != null) {
                lastFuture.sync();
            }

        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            group.shutdownGracefully();
        }
    }
}
```

这里的`sslContext.newHandler`和服务端的参数有所不同，需要注意。
```java
import io.netty.channel.ChannelInitializer;
import io.netty.channel.ChannelPipeline;
import io.netty.channel.socket.SocketChannel;
import io.netty.handler.codec.LineBasedFrameDecoder;
import io.netty.handler.codec.string.StringDecoder;
import io.netty.handler.codec.string.StringEncoder;
import io.netty.handler.ssl.SslContext;

public class EchoClientInitializer extends ChannelInitializer<SocketChannel> {

    private static final StringDecoder STRING_DECODER = new StringDecoder();
    private static final StringEncoder STRING_ENCODER = new StringEncoder();
    private static final EchoClientHandler CLIENT_HANDLER = new EchoClientHandler();
    private final SslContext sslContext;

    public EchoClientInitializer(SslContext sslContext) {
        this.sslContext = sslContext;
    }

    @Override
    protected void initChannel(SocketChannel ch) throws Exception {
        ChannelPipeline p = ch.pipeline();
        if (sslContext != null) {
            p.addLast(sslContext.newHandler(ch.alloc(), EchoClient.HOST, EchoClient.PORT));
        }

        p.addLast(new LineBasedFrameDecoder(1024));
        p.addLast(STRING_DECODER);
        p.addLast(STRING_ENCODER);

        p.addLast(CLIENT_HANDLER);
    }
}
```

只是简单的打印出服务端发过来数据。
```java
import io.netty.channel.ChannelHandler;
import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.SimpleChannelInboundHandler;

@ChannelHandler.Sharable
public class EchoClientHandler extends SimpleChannelInboundHandler<String> {
    @Override
    protected void channelRead0(ChannelHandlerContext ctx, String msg) throws Exception {
        System.out.println(msg);
    }

    @Override
    public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) throws Exception {
        cause.printStackTrace();
        ctx.close();
    }
}
```