# Netty Channel Option extend
## UnixChannelOption
```java
public class UnixChannelOption<T> extends ChannelOption<T>
```
### SO_REUSEPORT 重用端口
当 SO_REUSEPORT 功能启用时，多个进程或线程可以同时绑定同一个 IP 地址和端口号，这样就可以实现负载均衡或者故障转移等功能。
```java
    public static final ChannelOption<Boolean> SO_REUSEPORT = valueOf(UnixChannelOption.class, "SO_REUSEPORT");
```

### DOMAIN_SOCKET_READ_MODE UNIX 域套接字读取模式
UNIX 域套接字是一种本地 IPC 机制，它通过文件系统中的一个特殊文件（即套接字文件）来实现两个进程之间的通信。在使用 UNIX 域套接字进行通信时，需要选择一种读取模式，以决定在读取数据时的行为。

DOMAIN_SOCKET_READ_MODE 只适用于使用 UNIX 域套接字进行通信的场景，对于 TCP 或 UDP 等其他协议的通信不适用。

DOMAIN_SOCKET_READ_MODE 选项用于配置 UNIX 域套接字的读取模式。该选项的取值有以下几种：
- BYTES: 使用字节模式读取数据，即每次读取一个字节，适用于低延迟、高吞吐量的场景。
- FILE_DESCRIPTORS: 使用文件描述符模式读取数据，即每次读取一个完整的文件描述符，适用于需要传输文件描述符的场景。
- STRINGS: 使用字符串模式读取数据，即每次读取一个完整的字符串，适用于需要传输字符串的场景。

用法举例如下：
```java
new ServerBootstrap()
    .channel(EpollServerDomainSocketChannel.class)
    .option(UnixChannelOption.DOMAIN_SOCKET_READ_MODE, DomainSocketReadMode.BYTES)
    .bind(new DomainSocketAddress("/tmp/test.sock"))
    .sync();
```

```java
    public static final ChannelOption<DomainSocketReadMode> DOMAIN_SOCKET_READ_MODE =
            ChannelOption.valueOf(UnixChannelOption.class, "DOMAIN_SOCKET_READ_MODE");
```

## EpollChannelOption
```java
public final class EpollChannelOption<T> extends UnixChannelOption<T>
```

### TCP_CORK 控制TCP发送的延迟和拆分 
当启用TCP_CORK选项时，TCP套接字会将数据缓冲起来，直到应用程序发送完所有数据或者缓冲区达到一定大小，然后再将缓冲区中的数据一次性发送出去。这样做的好处是可以避免发送大量小数据包的情况，从而减少网络开销。

需要注意的是，启用TCP_CORK选项后，TCP套接字并不会立即发送缓冲区中的数据，而是等到缓冲区满了或者应用程序发送完所有数据后才会发送。因此，如果缓冲区过大或者应用程序发送的数据量较小，可能会导致发送延迟较长。
```java
    public static final ChannelOption<Boolean> TCP_CORK = valueOf(EpollChannelOption.class, "TCP_CORK");
```

### TCP_NOTSENT_LOWAT 设置发送数据的阈值
当应用程序调用send()函数发送数据时，如果发送缓冲区已满，send()函数将阻塞等待，直到有足够的空间将数据写入缓冲区中。在阻塞等待时，应用程序会浪费大量的时间等待，同时也会浪费很多的系统资源。为了避免这种情况，TCP_NOTSENT_LOWAT选项可以用来设置一个阈值，当缓冲区中剩余的数据量达到这个阈值时，send()函数就会返回一个EWOULDBLOCK错误，而不是阻塞等待。这样，应用程序就可以在send()函数返回EWOULDBLOCK错误后，将剩余的数据放入到缓冲区中，并进行其他的处理。
```java
    public static final ChannelOption<Long> TCP_NOTSENT_LOWAT = valueOf(EpollChannelOption.class, "TCP_NOTSENT_LOWAT");

    new Bootstrap().option(EpollChannelOption.TCP_NOTSENT_LOWAT, 1024);
```
当发送缓冲区中剩余的数据量达到1024字节时，send()函数将返回EWOULDBLOCK错误。

### TCP_KEEPIDLE 空闲时长(秒)
在 TCP 连接中，如果在一定时间内没有数据传输，则会被认为是空闲状态。TCP_KEEPIDLE 就是用于设置这个时间的，它指定了在没有数据传输时，TCP 连接能够保持空闲状态的最长时间。
```java
    public static final ChannelOption<Integer> TCP_KEEPIDLE = valueOf(EpollChannelOption.class, "TCP_KEEPIDLE");

    new ServerBootstrap()
        .childOption(ChannelOption.TCP_KEEPIDLE, 60)
```
TCP_KEEPIDLE 的实际值可能会被操作系统的设置所覆盖。如果操作系统中的设置时间比应用程序中设置的时间要小，那么实际上 TCP 连接可能会在操作系统规定的时间之后被关闭。


### TCP_KEEPINTVL Keep-Alive消息的时间间隔
如果一个TCP连接在一段时间内没有数据传输，那么操作系统会发送一个Keep-Alive消息给对方，以维持连接的状态。TCP_KEEPINTVL就是用于控制这个Keep-Alive消息的发送间隔的。

默认情况下，Linux操作系统下的TCP_KEEPINTVL选项值为75秒。也就是说，如果一个TCP连接在75秒内没有数据传输，那么操作系统会发送一个Keep-Alive消息给对方；然后，如果在75秒内，双方没有再次进行数据传输，那么操作系统会再次发送一个Keep-Alive消息；以此类推。
```java
    public static final ChannelOption<Integer> TCP_KEEPINTVL = valueOf(EpollChannelOption.class, "TCP_KEEPINTVL");
```

### TCP_KEEPCNT  发送保持存活探测报文的次数
当一个 TCP 连接处于空闲状态时，内核会定期发送 TCP 保持存活探测报文以检测连接是否可用。TCP_KEEPCNT 选项就是用来控制发送这类探测报文的次数。

TCP_KEEPCNT 选项的默认值通常为 9。
```java
    public static final ChannelOption<Integer> TCP_KEEPCNT = valueOf(EpollChannelOption.class, "TCP_KEEPCNT");
```

### TCP_USER_TIMEOUT 超时时间设置
TCP_USER_TIMEOUT 是一个 TCP 套接字选项，用于设置 TCP 连接在没有接收到对方的确认消息时，允许等待的时间上限。当超过这个时间时，内核会发送一个 RST 包，关闭连接。

TCP_USER_TIMEOUT 可以用于处理一些异常情况下的网络连接，比如连接断开但对端没有发送 FIN 包、连接断开但对端的 ACK 包未响应等。这种情况下，如果不设置 TCP_USER_TIMEOUT ，那么会导致连接长时间处于半关闭状态，从而影响系统的性能。
```java
    public static final ChannelOption<Integer> TCP_USER_TIMEOUT =
            valueOf(EpollChannelOption.class, "TCP_USER_TIMEOUT");
```

### IP_FREEBIND 是否允许在一个非本地 IP 地址上绑定套接字
在默认情况下，当使用 bind() 函数来绑定一个套接字到一个非本地 IP 地址上时，会返回一个 EADDRNOTAVAIL 错误，表示该地址不可用。这是因为操作系统会限制套接字只能绑定到本地 IP 地址上。

如果要在一个非本地 IP 地址上绑定套接字，可以通过设置 IP_FREEBIND 选项来实现。在设置了该选项之后，套接字就可以绑定到任意 IP 地址上了。
```java
    public static final ChannelOption<Boolean> IP_FREEBIND = valueOf("IP_FREEBIND");
```
举个例子：
```java
new ServerBootstrap().option(EpollChannelOption.SO_BINDADDR, new InetSocketAddress("0.0.0.0", 80)).option(ChannelOption.IP_FREEBIND, true);
```

### IP_TRANSPARENT 允许在不修改 IP 地址的情况下将数据包发送到不同的地址
```java
    public static final ChannelOption<Boolean> IP_TRANSPARENT = valueOf("IP_TRANSPARENT");
```

### IP_RECVORIGDSTADDR 获取客户端真实的IP地址
```java
    public static final ChannelOption<Boolean> IP_RECVORIGDSTADDR = valueOf("IP_RECVORIGDSTADDR");
```

### TCP_DEFER_ACCEPT 延迟建立连接时间
TCP_DEFER_ACCEPT 的作用是避免应用程序在连接建立的时候立即接受连接，而是等待一段时间，直到连接中有数据到达或者超时时间到达，再接受连接。这样做的好处是可以减少无效连接的数量，节省系统资源。
```java
    public static final ChannelOption<Integer> TCP_DEFER_ACCEPT =
            ChannelOption.valueOf(EpollChannelOption.class, "TCP_DEFER_ACCEPT");
```

例子：
```java
new ServerBootstrap().option(EpollChannelOption.TCP_DEFER_ACCEPT, 5000);
```
其中，5000 表示延迟时间，单位是毫秒。如果超过这个时间，连接中没有数据到达或者超时时间到达，那么应用程序将会自动接受连接。

### TCP_QUICKACK 快速ACK
在默认情况下，TCP会等待一定时间，以便在一次ACK确认中发送尽可能多的数据。这个时间通常称为ACK延迟时间或拖延时间。TCP_QUICKACK选项可以控制是否立即发送ACK确认，从而控制TCP连接的延迟。

当启用TCP_QUICKACK选项时，TCP将在接收到数据时立即发送ACK确认。这样可以减少TCP连接的延迟，但是也会增加网络上的ACK数量。因此，在启用TCP_QUICKACK选项时，需要谨慎地选择延迟时间，以避免网络拥塞。
```java
    public static final ChannelOption<Boolean> TCP_QUICKACK = valueOf(EpollChannelOption.class, "TCP_QUICKACK");
```

### SO_BUSY_POLL 是否开启繁忙轮询
在传统的网络编程中，当调用 read() 或 write() 等方法时，应用程序会被阻塞，直到网络 I/O 完成。这种阻塞式的 I/O 编程方式会带来一些性能问题，因为在等待网络 I/O 完成的过程中，CPU 无法执行其他的任务。

为了解决这个问题，Linux 内核引入了繁忙轮询（busy poll）机制。繁忙轮询是指在等待网络 I/O 完成的过程中，不断地轮询网络 I/O 的状态，以便在网络 I/O 就绪时立即返回。这种方式避免了进程进入阻塞状态，提高了 CPU 的利用率，从而提高了系统的吞吐量。

SO_BUSY_POLL 就是用于控制是否开启繁忙轮询的选项。SO_BUSY_POLL 的值可以是一个整数，表示繁忙轮询的时间（单位为微秒），也可以是一个布尔值，表示是否开启繁忙轮询。如果将 SO_BUSY_POLL 设置为 true，就开启了繁忙轮询；如果将 SO_BUSY_POLL 设置为 false，就关闭了繁忙轮询。

需要注意的是，开启繁忙轮询并不总是能提高系统的性能，因为繁忙轮询会占用一定的 CPU 资源。因此，应该根据实际情况，进行合理的设置。
```java
    public static final ChannelOption<Integer> SO_BUSY_POLL = valueOf(EpollChannelOption.class, "SO_BUSY_POLL");
```

### EPOLL_MODE epoll模式
epoll是Linux操作系统提供的一种高效的I/O事件通知机制，相比于传统的select、poll等机制，epoll具有更高的效率和更好的扩展性。
```java
    public static final ChannelOption<EpollMode> EPOLL_MODE =
            ChannelOption.valueOf(EpollChannelOption.class, "EPOLL_MODE");
    new ServerBootstrap().option(EpollChannelOption.EPOLL_MODE, EpollMode.LEVEL_TRIGGERED);
```

EPOLL_MODE选项的默认值为Edge trigger mode。常用取值：
- Edge trigger mode：边缘触发模式。在边缘触发模式下，当一个事件发生时，epoll会立即通知应用程序处理该事件，并只通知一次。如果应用程序没有及时处理该事件，那么该事件就会被忽略，直到下一次事件发生时才会重新通知应用程序。这种模式适用于数据量较大、事件处理速度较快的场景。
- Level trigger mode：水平触发模式。在水平触发模式下，当一个事件发生时，epoll会通知应用程序处理该事件，并持续通知，直到该事件被处理完毕。这种模式适用于数据量较小、事件处理速度较慢的场景。


### TCP_MD5SIG MD5签名
TCP_MD5SIG是一种TCP连接认证机制，用于验证TCP连接的合法性。它可以防止伪造的TCP连接和拒绝服务攻击。

在TCP连接建立时，双方需要交换MD5签名密钥，用于对TCP数据包进行数字签名。如果签名验证失败，TCP连接将被关闭。这种机制可以确保连接的安全性和完整性，防止数据被篡改或窃听。
```java
    public static final ChannelOption<Map<InetAddress, byte[]>> TCP_MD5SIG = valueOf("TCP_MD5SIG");
```

使用案例：
```java
bootstrap.option(ChannelOption.TCP_MD5SIG, new TcpMd5SigOption(
  "192.168.1.1", // local address
  "192.168.2.2", // remote address
  "mykey"        // md5 signature key
));
```

### MAX_DATAGRAM_PAYLOAD_SIZE UDP数据报的最大有效载荷大小
在UDP协议中，一个数据报可以包含最多65535字节的数据，其中包括8字节的UDP头和20字节的IP头。实际上，IP层和物理层也会对每个数据包进行一定的分片和重组，因此每个数据包的实际最大大小是由底层网络协议栈的MTU（最大传输单元）决定的。一般来说，MTU的大小是由底层网络设备（如网卡）决定的，常见的MTU大小是1500字节。因此，在使用UDP协议时，我们需要控制每个数据包的大小，以便在网络传输中不会被分片或重组，从而避免了额外的性能损耗。
```java
    public static final ChannelOption<Integer> MAX_DATAGRAM_PAYLOAD_SIZE = valueOf("MAX_DATAGRAM_PAYLOAD_SIZE");
```

### UDP_GRO (UDP Generic Receive Offload)
在 UDP 数据报到达网卡时，如果开启了 UDP GRO，那么网卡会将多个数据报合并成一个大的数据报，然后再将这个大的数据报交给操作系统的协议栈处理。这样可以减少操作系统协议栈中的处理开销，提高 UDP 数据报的接收效率。

UDP GRO 的实现依赖于网卡硬件和驱动的支持。在 Linux 操作系统下，UDP GRO 的实现主要由内核的 GRO 模块和驱动程序实现。
```java
    public static final ChannelOption<Boolean> UDP_GRO = valueOf("UDP_GRO");
```

## KQueueChannelOption
```java
public final class KQueueChannelOption<T> extends UnixChannelOption<T>
```

### SO_SNDLOWAT 可写字节数的下限
如果内核缓冲区中的可写字节数低于SO_SNDLOWAT设置的值，那么send()函数将会阻塞，直到内核缓冲区中的可写字节数达到或超过SO_SNDLOWAT设置的值，或者出现错误为止。
```java
    public static final ChannelOption<Integer> SO_SNDLOWAT = valueOf(KQueueChannelOption.class, "SO_SNDLOWAT");
```

### TCP_NOPUSH
TCP_NOPUSH 是一种可选的 TCP 套接字选项，它可以在发送数据时控制 TCP 栈的行为，将数据缓存并一次性发送出去，以减少发送数据的次数，从而提高数据发送的效率。

在发送数据时，应用程序将数据写入套接字缓冲区中，然后通过 write() 函数将缓冲区中的数据发送到对端。当 TCP_NOPUSH 选项被开启时，操作系统会缓存数据，直到缓存区满或者接收到一个关闭套接字的指令（即发送 FIN 包）才会发送数据。这样可以避免发送大量的小数据包，从而减少网络拥塞的风险。
```java
    public static final ChannelOption<Boolean> TCP_NOPUSH = valueOf(KQueueChannelOption.class, "TCP_NOPUSH");
```

### SO_ACCEPTFILTER 接受过滤器
在Unix系统上，接受过滤器是一个用于过滤新连接的内核级别过滤器，可以用于过滤连接源IP地址、端口等。使用SO_ACCEPTFILTER选项，可以在Netty的KQueueChannel上启用或禁用接受过滤器，并设置其相关参数。
```java
    public static final ChannelOption<AcceptFilter> SO_ACCEPTFILTER =
            valueOf(KQueueChannelOption.class, "SO_ACCEPTFILTER");

    new ServerBootstrap().option(KQueueChannelOption.SO_ACCEPTFILTER, new AcceptFilter("myfilter", "myfilter"))
```

### RCV_ALLOC_TRANSPORT_PROVIDES_GUESS
该选项用于告诉操作系统网络栈是否应该在接收数据时分配接收缓冲区的大小，如果设置为true，则表示应该由操作系统网络栈负责分配接收缓冲区的大小。如果设置为false，则表示应用程序需要显式地分配接收缓冲区。
```java
    /**
     * If this is {@code true} then the {@link RecvByteBufAllocator.Handle#guess()} will be overridden to always attempt
     * to read as many bytes as kqueue says are available.
     */
    public static final ChannelOption<Boolean> RCV_ALLOC_TRANSPORT_PROVIDES_GUESS =
            valueOf(KQueueChannelOption.class, "RCV_ALLOC_TRANSPORT_PROVIDES_GUESS");
```



