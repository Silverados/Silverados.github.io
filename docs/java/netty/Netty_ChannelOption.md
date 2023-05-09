# Netty ChannelOption

## SO_BACKLOG 同时等待处理的连接请求数量
在 TCP 协议中，三次握手完成后，服务器端会将连接请求存放在一个已完成队列（Completed Queue）中等待被服务器端通过 accept() 接受。SO_BACKLOG 选项就是用来设置已完成队列的最大长度，也就是可以同时等待处理的连接请求数量。
```java
    public static final ChannelOption<Integer> SO_BACKLOG = valueOf("SO_BACKLOG");
    new ServerBootstrap().option(ChannelOption.SO_BACKLOG, 1024);
```

## TCP_NODELAY 控制 TCP 数据包发送机制
当 TCP_NODELAY 选项被设置为 true 时，TCP 连接会使用 Nagle 算法（Nagle's algorithm）进行数据包的发送，即 TCP 连接会尽可能地发送数据，避免将数据分成多个小的数据包发送。相反，当 TCP_NODELAY 选项被设置为 false 时，TCP 连接会将数据包缓存起来，等待数据量达到一定大小或者等待一定时间后再发送，以减少网络流量和提高网络效率。

在默认情况下，TCP_NODELAY 选项是被启用的，这意味着数据包会立即发送。但是在某些情况下，例如实时通信、在线游戏等对响应时间有严格要求的场景下，启用 Nagle 算法可能会造成一定的延迟，因此需要禁用 TCP_NODELAY。
```java
    public static final ChannelOption<Boolean> TCP_NODELAY = valueOf("TCP_NODELAY");
```


## SO_REUSEADDR 是否允许重用服务器地址的选项 
在默认情况下，当一个服务器停止运行时，该服务器打开的端口会在一段时间内保持被占用的状态，这是因为操作系统为了防止之前的连接请求还没有被处理就新建一个连接请求，所以会保持该端口在一个“TIME_WAIT”的状态下。这样，在下一次启动相同的服务时就会失败，因为该端口已经被标记为正在使用。

通过设置 SO_REUSEADDR 选项，可以告诉操作系统在端口关闭后立即释放该端口，从而允许下一次绑定到该端口的监听套接字不会遇到“端口已被占用”的问题。需要注意的是，如果不设置 SO_REUSEADDR 选项，可能会导致在绑定到相同端口的监听套接字上时出现错误。
```java
    public static final ChannelOption<Boolean> SO_REUSEADDR = valueOf("SO_REUSEADDR");
```


## SO_KEEPALIVE 是否保活
SO_KEEPALIVE 是一个表示是否启用 TCP 连接的保活机制的选项。保活机制是指当一个连接在一段时间内没有进行数据传输时，会向对端发送一个探测包（Keep-Alive packet）以确认连接是否仍然可用。如果探测包得到了回应，则连接仍然保持，否则连接将被关闭。

在默认情况下，TCP 连接是不启用保活机制的，因为在传输过程中，如果出现网络异常、断电等情况，就有可能导致连接意外断开，进而造成数据的丢失。但是在某些应用场景下，例如在线游戏、实时通信等，连接的实时性非常重要，此时启用保活机制可以提高连接的可靠性。
```java
    public static final ChannelOption<Boolean> SO_KEEPALIVE = valueOf("SO_KEEPALIVE");
```

## SO_TIMEOUT 读取超时或者阻塞超时
当读取操作超过指定的时间后，会抛出一个异常（例如 java.net.SocketTimeoutException）以提示读取操作超时。

通常情况下，读取操作会一直阻塞，直到有数据可读或者发生异常。如果读取数据的时间过长，就可能导致应用程序变得不响应，影响用户体验。通过设置 SO_TIMEOUT 选项，可以在一定时间内限制读取操作的阻塞时间，避免应用程序被阻塞。
```java
    public static final ChannelOption<Integer> SO_TIMEOUT = valueOf("SO_TIMEOUT");
```

## SO_SNDBUF 发送缓冲区大小
发送缓冲区是指操作系统内核中用于暂存待发送数据的一块内存区域，当应用程序向网络发送数据时，数据会先被写入发送缓冲区，然后由操作系统负责将数据发送到网络。SO_SNDBUF 选项用于设置发送缓冲区的大小，可以影响网络发送效率和性能。

通常情况下，发送缓冲区的大小会根据操作系统和网络硬件的性能进行自动调整。但是在某些情况下，例如需要发送大量数据或者需要提高网络发送效率的场景下，可以通过手动设置 SO_SNDBUF 选项来调整发送缓冲区的大小。
```java
    public static final ChannelOption<Integer> SO_SNDBUF = valueOf("SO_SNDBUF");
```

## SO_BROADCAST 是否开启广播发
当 SO_BROADCAST 被设置为 true 时，TCP 连接可以向网络中的所有设备进行广播发送。SO_BROADCAST 选项通常用于实现网络广播或者组播（multicast）功能。

需要注意的是，开启广播发送可能会导致网络拥塞和安全问题。因此，应该在使用时谨慎考虑，并根据实际情况进行选择。
```java
    public static final ChannelOption<Boolean> SO_BROADCAST = valueOf("SO_BROADCAST");
```

## SO_RCVBUF 接收缓冲区大小
接收缓冲区是指操作系统内核中用于暂存待接收数据的一块内存区域，当操作系统从网络接收数据时，数据会先被写入接收缓冲区，然后由应用程序从接收缓冲区读取数据。

SO_RCVBUF 选项用于设置接收缓冲区的大小，可以影响网络接收效率和性能。通常情况下，接收缓冲区的大小会根据操作系统和网络硬件的性能进行自动调整。但是在某些情况下，例如需要接收大量数据或者需要提高网络接收效率的场景下，可以通过手动设置 SO_RCVBUF 选项来调整接收缓冲区的大小。
```java
    public static final ChannelOption<Integer> SO_RCVBUF = valueOf("SO_RCVBUF");
```

## SO_LINGER 设置关闭时等待时间
SO_LINGER 选项用于控制连接关闭时的行为，当 SO_LINGER 被启用时，表示在连接关闭时会等待一段时间（称为 Linger Time），以确保所有未发送的数据都被成功发送或者放弃发送。

需要注意的是，启用 SO_LINGER 选项可能会影响网络性能和稳定性，因此应该根据实际情况进行选择。如果应用程序对数据可靠性要求比较高，可以启用 SO_LINGER 选项；否则，可以关闭 SO_LINGER 选项以提高网络性能和稳定性。
```java
    public static final ChannelOption<Integer> SO_LINGER = valueOf("SO_LINGER");
```

## IP_TOS (Type of Service) IP报文服务类型
用于指定 IP 报文的服务质量和优先级，包括可靠性、延迟、带宽和成本等方面的考虑。

使用 IP 报文服务类型选项可以提高网络应用程序的服务质量和响应速度，但需要注意的是，在网络拥塞或者负载较高的情况下，IP 报文服务类型选项可能会被忽略或者无法生效。
```java
    public static final ChannelOption<Integer> IP_TOS = valueOf("IP_TOS");
```

常见的取值有：
- 最小延迟（Minimum Delay，0x10）：指定该报文需要最小的延迟，常用于实时传输，例如视频、语音等。
- 最大吞吐量（Maximum Throughput，0x08）：指定该报文需要最大的带宽和吞吐量，常用于数据传输。
- 最高可靠性（Maximum Reliability，0x04）：指定该报文需要最高的可靠性和稳定性，常用于关键应用，例如金融、医疗等。
- 最小费用（Minimum Cost，0x02）：指定该报文需要最小的成本，常用于低带宽和高延迟的网络环境。

## ALLOCATOR 内存分配器
内存分配器负责管理 Netty 中的缓冲区和对象池，可以有效地降低内存的分配和回收开销，提高应用程序的性能和可靠性。

默认情况下，Netty 使用的是堆内存（Heap）分配器和直接内存（Direct）分配器。其中，堆内存分配器使用 JVM 的堆内存进行分配，适用于小数据量和频繁分配的情况；直接内存分配器使用操作系统的直接内存进行分配，适用于大数据量和少量分配的情况。

```java
    public static final ChannelOption<ByteBufAllocator> ALLOCATOR = valueOf("ALLOCATOR");

    new Bootstrap().option(ChannelOption.ALLOCATOR, PooledByteBufAllocator.DEFAULT);
```

常见的取值：
- UnpooledByteBufAllocator.DEFAULT：默认的非池化缓冲区分配器，适用于短连接和低并发的情况。
- PooledByteBufAllocator.DEFAULT：默认的池化缓冲区分配器，适用于长连接和高并发的情况。
- UnpooledDirectByteBufAllocator.DEFAULT：默认的非池化直接内存缓冲区分配器，适用于短连接和低并发的情况。
- PooledDirectByteBufAllocator.DEFAULT：默认的池化直接内存缓冲区分配器，适用于长连接和高并发的情况。

## RCVBUF_ALLOCATOR 接收缓冲区分配器
接收缓冲区分配器负责管理网络接收数据的缓冲区，可以有效地降低内存的分配和回收开销，提高应用程序的性能和可靠性。

默认情况下，Netty 使用的是 AdaptiveRecvByteBufAllocator.DEFAULT 接收缓冲区分配器。AdaptiveRecvByteBufAllocator 是一种自适应接收缓冲区分配器，它可以根据接收数据的大小和频率自动调整缓冲区的大小，从而避免缓冲区过大或过小的情况，提高应用程序的性能和可靠性。

```java
    public static final ChannelOption<RecvByteBufAllocator> RCVBUF_ALLOCATOR = valueOf("RCVBUF_ALLOCATOR");

    new Bootstrap().(ChannelOption.RCVBUF_ALLOCATOR, new FixedRecvByteBufAllocator(1024));
```

## MESSAGE_SIZE_ESTIMATOR 消息大小估算器
在 Netty 中，每个传输的消息都需要被编码成字节数据进行传输。在实际应用中，由于消息大小的不确定性，我们无法直接设置传输缓冲区的大小，从而可能会浪费大量的内存资源。

因此，Netty 提供了 MESSAGE_SIZE_ESTIMATOR 选项，用于估计每个消息的大小，从而更加有效地利用传输缓冲区的空间。
```java
    public static final ChannelOption<MessageSizeEstimator> MESSAGE_SIZE_ESTIMATOR = valueOf("MESSAGE_SIZE_ESTIMATOR");
    new Bootstrap().option(ChannelOption.MESSAGE_SIZE_ESTIMATOR, DefaultMessageSizeEstimator.DEFAULT);
```

## CONNECT_TIMEOUT_MILLIS 连接超时时间
当客户端向服务端发起连接请求时，由于网络等原因，连接请求可能会被阻塞或者超时。为了避免连接请求被阻塞或者超时时间过长，可以通过设置 CONNECT_TIMEOUT_MILLIS 选项来控制连接超时时间。

```java
    public static final ChannelOption<Integer> CONNECT_TIMEOUT_MILLIS = valueOf("CONNECT_TIMEOUT_MILLIS");
```

## MAX_MESSAGES_PER_WRITE 设置每次写操作最多发送的消息数量。
在 Netty 中，当进行批量写操作时，可以通过设置 MAX_MESSAGES_PER_WRITE 选项来控制每次写操作最多发送的消息数量。如果设置了该选项，Netty 将会在发送消息之前，先将多个消息合并成一个消息，然后再进行发送。
```java
    public static final ChannelOption<Integer> MAX_MESSAGES_PER_WRITE = valueOf("MAX_MESSAGES_PER_WRITE");

    new Bootstrap().option(ChannelOption.MAX_MESSAGES_PER_WRITE, 16);
```

## WRITE_SPIN_COUNT 控制在进行写操作时，自旋的次数
在 Netty 中，当进行写操作时，Netty 会先将待写入的数据缓存到一个内部的队列中，然后再异步地将缓存的数据写入到底层的网络传输层中。在写入数据时，如果网络传输层的缓存已经满了，那么 Netty 会等待一段时间，直到有空闲的缓存空间为止。在这个等待的过程中，Netty 可以选择一种自旋的方式等待，也可以选择一种阻塞的方式等待。

WRITE_SPIN_COUNT 就是用于控制自旋的次数的。当进行写操作时，如果网络传输层的缓存已经满了，Netty 会先进行一定次数的自旋等待，如果等待超过了 WRITE_SPIN_COUNT 次，还没有空闲的缓存空间，那么 Netty 将会放弃自旋等待，转而使用阻塞等待的方式。

```java
    public static final ChannelOption<Integer> WRITE_SPIN_COUNT = valueOf("WRITE_SPIN_COUNT");
    new Bootstrap().option(ChannelOption.WRITE_SPIN_COUNT, 16);
```
其中，16 表示进行写操作时最多自旋等待的次数。需要注意的是，如果设置的值过小，可能会导致自旋等待的效果不明显；如果设置的值过大，可能会导致自旋等待的时间过长，从而降低系统的吞吐量。因此，应该根据实际应用场景进行合理的设置。

## WRITE_BUFFER_WATER_MARK 设置写缓存区的高低水位线
在 Netty 中，写操作将待写入的数据缓存在内存中的写缓存区中，然后再异步将缓存的数据写入到底层的网络传输层中。为了控制写缓存区的内存使用，Netty 使用了高低水位线的机制。写缓存区的内存使用量在达到高水位线时，Netty 将停止写入数据，直到写缓存区的内存使用量降到低水位线以下时才继续写入数据。
```java
    public static final ChannelOption<WriteBufferWaterMark> WRITE_BUFFER_WATER_MARK =
            valueOf("WRITE_BUFFER_WATER_MARK");
    new Bootstrap().option(ChannelOption.WRITE_BUFFER_WATER_MARK, new WriteBufferWaterMark(1024, 2048));
```
其中，第一个参数表示写缓存区的低水位线，第二个参数表示写缓存区的高水位线。在上面的示例中，低水位线设置为 1024，高水位线设置为 2048。

需要注意的是，如果写缓存区的内存使用量一直维持在高水位线以上，可能会导致 Netty 写入数据的速度变慢，甚至停止写入数据，从而影响系统的吞吐量

## ALLOW_HALF_CLOSURE 控制当一个连接被关闭时，是否允许它的一端先关闭而另一端继续发送数据。
如果 ALLOW_HALF_CLOSURE 被设置为 true，则当一端关闭连接时，另一端仍可以继续发送数据。如果 ALLOW_HALF_CLOSURE 被设置为 false，则当一端关闭连接时，另一端也必须关闭连接，否则会出现异常。
```java
    public static final ChannelOption<Boolean> ALLOW_HALF_CLOSURE = valueOf("ALLOW_HALF_CLOSURE");
```
需要注意的是，在允许半关闭的情况下，如果一端关闭了连接而另一端仍在发送数据，那么在另一端的数据全部发送完毕之前，连接并不会真正关闭。

## AUTO_READ 控制是否自动读取数据
在 Netty 中，当建立一个新的连接时，Netty 会默认开启自动读取功能，也就是说，当有数据到达时，Netty 会自动将数据读取出来，并触发相应的事件处理器对数据进行处理。这种方式可以简化程序的编写，但是在某些场景下，需要关闭自动读取功能，以便更好地控制数据的处理过程。
```java
    public static final ChannelOption<Boolean> AUTO_READ = valueOf("AUTO_READ");
```
关闭自动读取功能后，如果不手动进行读取操作，那么连接可能会一直处于等待状态，直到底层的网络传输层上有数据到达为止。因此，在关闭自动读取功能时，需要手动进行数据的读取。

## AUTO_CLOSE 自动关闭 Channel 相关的资源
默认情况下，当调用 Channel 的 close() 方法时，Netty 会自动关闭 Channel 相关的资源。但是，在某些情况下，可能需要在关闭 Channel 时，只关闭 Channel 本身，而不关闭底层的 socket 连接，以便复用该连接。
```java
    public static final ChannelOption<Boolean> AUTO_CLOSE = valueOf("AUTO_CLOSE");
```
如果禁用了自动关闭功能，那么在关闭 Channel 之前，必须手动关闭底层的 socket 连接，否则可能会导致资源泄露或连接的不可复用。因此，建议在使用该选项时，仔细考虑是否需要手动关闭底层的 socket 连接。

## IP_MULTICAST_ADDR IP多播地址
```java
    public static final ChannelOption<InetAddress> IP_MULTICAST_ADDR = valueOf("IP_MULTICAST_ADDR");
```

## IP_MULTICAST_IF 多播数据包的发送接口
在发送多播数据包时，需要指定发送数据包的接口。这个接口通常是一个网卡接口，它的 IP 地址用于确定数据包的源地址。IP_MULTICAST_IF 可以用于设置这个接口的 IP 地址，从而指定发送数据包的接口。
```java
    public static final ChannelOption<NetworkInterface> IP_MULTICAST_IF = valueOf("IP_MULTICAST_IF");

    InetAddress multicastInterface = InetAddress.getByName("192.168.1.1");
    new ServerBootstrap().channelOption(ChannelOption.IP_MULTICAST_IF, multicastInterface);
```

## IP_MULTICAST_TTL 多播数据报在IP层上的存活时间
在IP层中，当一个多播数据报被发送到一个多播组时，它会被转发到该组中所有的成员。在转发过程中，数据报可能会经过多个网络节点，而每经过一个节点，它的存活时间就会减少1。当存活时间减少到0时，数据报将被丢弃。

默认情况下，它的值为1，也就是说，多播数据报只能经过本地网络中的一个节点。如果要将多播数据报发送到更远的网络，可以将IP_MULTICAST_TTL的值设置为更大的数。
```java
    public static final ChannelOption<Integer> IP_MULTICAST_TTL = valueOf("IP_MULTICAST_TTL");
```

## IP_MULTICAST_LOOP_DISABLED 多播数据包的循环发送行为
在多播通信中，多播数据包通常会被路由器转发到多个接收端，但是有时候这些数据包也可能会被发送到发送端所在的本地网络中。如果此时接收端也在本地网络中，那么接收端有可能会收到多播数据包的多个副本，这就会导致一些问题。例如，对于视频直播等场景，如果接收端收到了多个相同的视频流，那么就会产生画面卡顿、音频不同步等问题。

为了避免这种问题，多播数据包在发送时通常会进行循环发送。具体来说，发送端将多播数据包发送到本地网络中，然后本地网络会将数据包转发到其他网络中，其他网络再将数据包转发到它们所连接的子网络中，依此类推，直到所有的接收端都收到了数据包为止。在这个过程中，每个网络节点都会检查数据包的 TTL 值，如果 TTL 值小于等于 1，就将数据包丢弃，否则将 TTL 减 1，然后将数据包继续向下一级网络发送。

默认情况下，Netty 的多播通道会开启循环发送功能，即 IP_MULTICAST_LOOP_DISABLED 选项默认为 false。
```java
    public static final ChannelOption<Boolean> IP_MULTICAST_LOOP_DISABLED = valueOf("IP_MULTICAST_LOOP_DISABLED");
```
需要注意的是，禁用循环发送功能可能会导致多播数据包不能到达本地网络中的接收端。

## TCP_FASTOPEN / TCP_FASTOPEN_CONNECT
TCP Fast Open是一种针对TCP协议的优化技术，可以在TCP三次握手过程中，将数据一起发送到服务端，从而加快连接建立的速度。TCP Fast Open需要客户端和服务端都支持，且需要在操作系统层面开启相应的支持，因此需要在应用层面显式地开启。
```java
    /**
     * Client-side TCP FastOpen. Sending data with the initial TCP handshake.
     */
    public static final ChannelOption<Boolean> TCP_FASTOPEN_CONNECT = valueOf("TCP_FASTOPEN_CONNECT");
    
    /**
     * Server-side TCP FastOpen. Configures the maximum number of outstanding (waiting to be accepted) TFO connections.
     */
    public static final ChannelOption<Integer> TCP_FASTOPEN = valueOf(ChannelOption.class, "TCP_FASTOPEN");
```

## SINGLE_EVENTEXECUTOR_PER_GROUP 控制是否为每个 ChannelGroup 分别创建一个 EventExecutor
```java
    public static final ChannelOption<Boolean> SINGLE_EVENTEXECUTOR_PER_GROUP =
            valueOf("SINGLE_EVENTEXECUTOR_PER_GROUP");
```