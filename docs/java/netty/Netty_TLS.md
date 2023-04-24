# Netty TLS(Transport Security)

## OpenSSL
这是推荐的方式。以下是官方给出来的优点：
- 速度：在本地测试中，我们看到了JDK 3倍的性能提高。GCM由HTTP/2 RFC所需的唯一密码套件使用，速度更快10-500倍。
- 密码：OpenSSL有自己的密码，不依赖JDK的局限性。这允许在Java 7上支持GCM。
- ALPN到NPN缩回：OpenSSL可以同时支持ALPN和NPN。Netty的JDK实现仅在任何给定时间支持ALPN或NPN，并且仅在JDK 7中支持NPN。
- Java版本独立性：不需要根据JDK更新使用其他库版本。这是Netty使用的JDK ALPN和NPN实现的限制。

### 依赖引入
下面这种写法会忽略平台：
```xml
<dependency>
    <groupId>io.netty</groupId>
    <artifactId>netty-tcnative-boringssl-static</artifactId>
    <version>2.0.59.Final</version>
</dependency>
```

个人推荐下面这种写法, 只下载对应平台的依赖包：
```xml
<project>
  ...
  <dependencies>
    ...
    <dependency>
      <groupId>io.netty</groupId>
      <artifactId>netty-tcnative-boringssl-static</artifactId>
      <version>2.0.59.Final</version>
      <classifier>${os.detected.classifier}</classifier>
    </dependency>
    ...
  </dependencies>
  ...
  <build>
    ...
    <extensions>
      <extension>
        <groupId>kr.motd.maven</groupId>
        <artifactId>os-maven-plugin</artifactId>
        <version>1.7.1</version>
      </extension>
    </extensions>
    ...
  </build>
  ...
</project>
```

### 代码实现
注意这个方法我没有进行验证验证！！！
```java
import io.netty.handler.ssl.SslContext;
import io.netty.handler.ssl.SslContextBuilder;
import io.netty.handler.ssl.SslProvider;
import io.netty.handler.ssl.util.SelfSignedCertificate;

import javax.net.ssl.SSLException;
import java.io.File;
import java.security.cert.CertificateException;

public class SSLUtil {
    private SSLUtil() {
    }
    
    public static final boolean SSL = System.getProperty("ssl") != null;
    
    public static SslContext buildOpenSslServerContext(File certificate, File privateKey) throws SSLException {
        if (!SSL) {
            return null;
        }

        return SslContextBuilder.forServer(certificate, privateKey).sslProvider(SslProvider.OPENSSL).build();
    }
}
```

## JDK
在读`Netty`提供的案例中通常使用的是这种方式，其中证书是自签名的`SelfSignedCertificate`:
```java
import io.netty.handler.ssl.SslContext;
import io.netty.handler.ssl.SslContextBuilder;
import io.netty.handler.ssl.util.SelfSignedCertificate;

import javax.net.ssl.SSLException;
import java.security.cert.CertificateException;

public class SSLUtil {

    public static final boolean SSL = System.getProperty("ssl") != null;

    private SSLUtil() {
    }

    public static SslContext buildSslContext() throws CertificateException, SSLException {
        if (!SSL) {
            return null;
        }
        SelfSignedCertificate ssc = new SelfSignedCertificate();
        return SslContextBuilder.forServer(ssc.certificate(), ssc.privateKey()).build();
    }
}
```

## 总结
结合这些方法我们可以写出一个这样的类：
```java
import io.netty.handler.ssl.SslContext;
import io.netty.handler.ssl.SslContextBuilder;
import io.netty.handler.ssl.SslProvider;
import io.netty.handler.ssl.util.SelfSignedCertificate;

import javax.net.ssl.SSLException;
import java.io.File;
import java.security.cert.CertificateException;

public class NettySslUtil {

    public static final boolean SSL = System.getProperty("ssl") != null;

    private NettySslUtil() {
    }

    public static SslContext buildSslClientContext() throws SSLException {
        if (!SSL) {
            return null;
        }
        return SslContextBuilder.forClient().build();
    }

    public static SslContext buildSslServerContext() throws CertificateException, SSLException {
        if (!SSL) {
            return null;
        }
        SelfSignedCertificate ssc = new SelfSignedCertificate();
        return SslContextBuilder.forServer(ssc.certificate(), ssc.privateKey()).build();
    }

    public static SslContext buildOpenSslServerContext(File certificate, File privateKey) throws SSLException {
        if (!SSL) {
            return null;
        }

        return SslContextBuilder.forServer(certificate, privateKey).sslProvider(SslProvider.OPENSSL).build();
    }
}
```

具体的使用方式可以查看[案例一](/java/netty/demo/demo1_echo.md)的实现。
