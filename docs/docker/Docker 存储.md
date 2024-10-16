# Docker 存储
默认情况下，容器内创建的所有文件都存储在可写容器层上。这意味着：
1. 当容器不存在时，数据不会持久存在，而且如果另一个进程需要，从容器中获取数据也很困难。
2. 容器的可写层与运行容器的主机紧密相连。你无法轻易将数据转移到其他地方。
3. 写入容器的可写层需要一个存储驱动程序来管理文件系统。存储驱动程序使用 Linux 内核提供一个联合文件系统。与直接写入主机文件系统的数据卷相比，这种额外的抽象会降低性能。

Docker 为容器提供了两种在主机上存储文件的选项，这样即使容器停止运行，文件也会持续存在：卷(volumes)和绑定挂载(bind amounts)。
Docker 还支持容器在主机内存中存储文件。这些文件不会被持久化。如果在 Linux 上运行 Docker， tmpfs mount 用于将文件存储在主机的系统内存中。如果在 Windows 上运行 Docker，则使用 named pipe 将文件存储在主机的系统内存中。

## 存储类型的选择
No matter which type of mount you choose to use, the data looks the same from within the container. It is exposed as either a directory or an individual file in the container's filesystem.
无论您选择使用哪种挂载类型，数据在容器内看起来都是一样的。它在容器的文件系统中以目录或单个文件的形式显示。

An easy way to visualize the difference among volumes, bind mounts, and tmpfs mounts is to think about where the data lives on the Docker host.
要直观了解卷、绑定挂载和 tmpfs 挂载之间的区别，一个简单的方法就是思考数据在 Docker 主机上的位置。

- Volumes are stored in a part of the host filesystem which is managed by Docker (/var/lib/docker/volumes/ on Linux). Non-Docker processes should not modify this part of the filesystem. Volumes are the best way to persist data in Docker.
- Bind mounts may be stored anywhere on the host system. They may even be important system files or directories. Non-Docker processes on the Docker host or a Docker container can modify them at any time.
- tmpfs mounts are stored in the host system's memory only, and are never written to the host system's filesystem.

- 卷存储在主机文件系统的一部分，由 Docker（Linux 上为 /var/lib/docker/volumes/ ）管理。非 Docker 进程不应修改这部分文件系统。卷是在 Docker 中保存数据的最佳方式。
- 绑定挂载可以存储在主机系统的任何位置。它们甚至可能是重要的系统文件或目录。Docker 主机或 Docker 容器上的非 Docker 进程可以随时修改它们。
- 挂载只存储在主机系统内存中，不会写入主机系统的文件系统。

Bind mounts and volumes can both be mounted into containers using the -v or --volume flag, but the syntax for each is slightly different. For tmpfs mounts, you can use the --tmpfs flag. We recommend using the --mount flag for both containers and services, for bind mounts, volumes, or tmpfs mounts, as the syntax is more clear.
绑定挂载和卷都可以使用 -v 或 --volume 标记挂载到容器中，但两者的语法略有不同。对于 tmpfs 挂载，可以使用 --tmpfs 标志。对于绑定挂载、卷或 tmpfs 挂载，我们建议对容器和服务使用 --mount 标志，因为语法更清晰。

## 卷

### 两种语法
`-v 或 --volume`: 由三个字段组成，中间用冒号分隔（ : ）。字段的顺序必须正确，每个字段的含义并不是一目了然的
- 对于已命名加密卷，第一个字段是加密卷的名称，在指定主机上是唯一的。对于匿名加密卷，则省略第一个字段。
- 第二个字段是文件或目录在容器中的挂载路径。
- 第三个字段是可选的，是一个以逗号分隔的选项列表，如 ro。

`-- mount`: 由多个键值对组成，每个键值对之间用逗号隔开，每个键值对由一个 <key>=<value> 元组组成。
- 挂载的 type。可以是`bind`,`volume`或`tmpfs`。
- 挂载的 source。对于已命名加密卷，这是加密卷的名称。对于匿名加密卷，此字段省略。可指定为 source 或 src。
- destination 的值是文件或目录在容器中的挂载路径。可以指定为 destination, dst 或 target 。
- volume-subpath 选项将卷中一个子目录的路径挂载到容器中。在将卷挂载到容器之前，该子目录必须存在于卷中。请参阅挂载卷子目录。
- 如果存在 readonly 选项，绑定挂载将以只读方式挂载到容器中。可以指定为 readonly 或 ro 。
- volume-opt 选项可以指定多次，它包含一个键值对，由选项名称及其值组成。

### 管理卷
1. 创建卷:
    ```shell
    docker volume create <volume-name>
    ```
2. 删除卷
    ```shell
    docker volume rm <volume-name>
    ```
3. 查看卷
    ```shell
    docker volume ls
    ```
4. 查看卷详细信息
    ```shell
    docker volume inspect <volume-name>
    ```
   
### 使用docker cli
如果你用一个还不存在的卷启动一个容器，Docker 会为你创建该卷。下面的示例将卷 myvol2 挂载到容器中的 /app/
-v:
```shell
docker run -d \
  --name devtest \
  -v myvol2:/app \
  nginx:latest
```

--mount:
```shell
docker run -d \
  --name devtest \
  --mount source=myvol2,target=/app \
  nginx:latest
```

### 使用docker compose
首次运行 docker compose up 会创建一个卷。之后再运行该命令时，Docker 会重复使用同一个卷。
```docker
services:
  frontend:
    image: node:lts
    volumes:
      - myapp:/home/node/app
volumes:
  myapp:
```

如果事前已经创建了myapp卷，可以直接使用myapp卷:
```docker
services:
  frontend:
    image: node:lts
    volumes:
      - myapp:/home/node/app
volumes:
  myapp:
    external: true
```

## 绑定挂载
使用绑定挂载时，主机上的文件或目录会被挂载到容器中。文件或目录通过其在主机上的绝对路径进行引用。相比之下，使用卷时，会在主机上的 Docker 存储目录中创建一个新目录，并由 Docker 管理该目录的内容。
### 使用docker compose
```docker
services:
  frontend:
    image: node:lts
    volumes:
      - type: bind
        source: ./static
        target: /opt/app/static
volumes:
  myapp:
```

# 参考链接
- [Docker 存储](https://docs.docker.com/storage/)
- [Docker 存储：卷和目录](https://docs.docker.com/storage/volumes/)