# docker file
Docker 映像不包含邮件传输代理 (MTA)。建议的解决方案是在单独的容器中添加一个 MTA（如 Postfix 或 Sendmail）。另一种方法是直接在 GitLab 容器中安装 MTA，但这会增加维护开销，因为每次升级或重启后都可能需要重新安装 MTA。
```docker
services:                                                                                                                                  
  gitlab:                                                                                                                                  
    image: gitlab/gitlab-ce:latest                                                                                                         
    container_name: gitlab                                                                                                                 
    restart: always                                                                                                                        
    hostname: 'gitlab.example.com'                                                                                                         
    environment:                                                                                                                           
      GITLAB_OMNIBUS_CONFIG: |                                                                                                             
        # Add any other gitlab.rb configuration here, each on its own line                                                                 
        external_url 'https://gitlab.example.com'                                                                                          
    ports:                                                                                                                                 
      - '8929:8929'                                                                                                                        
      - '443:443'                                                                                                                          
      - '2424:22'                                                                                                                          
    volumes:                                                                                                                               
      - "/data/docker/gitlab/config:/etc/gitlab"                                                                                           
      - "/data/docker/gitlab/logs:/var/log/gitlab"                                                                                         
      - "/data/docker/gitlab/data:/var/opt/gitlab"                                                                                         
    shm_size: '256m' 
```

```shell
# 进入容器
sudo docker exec -it gitlab /bin/bash

# 修改 gitlab.rb
vi /etc/gitlab/gitlab.rb

# 设置
external_url "http://gitlab.example.com:8929"
gitlab_rails['gitlab_shell_ssh_port'] = 2424
# 保存退出vim

# 重启gitab
gitlab-ctl reconfigure
```

默认账户名为 root, 查看密码方式：
```shell
sudo docker exec -it gitlab grep 'Password:' /etc/gitlab/initial_root_password
```

修改密码方式：
进入容器，同时登陆gitlab控制台：
```shell
sudo docker exec -it gitlab /bin/bash

gitlab-rails console
```

密码8位字符以上
```shell
user = User.find_by(username: 'root')
user.password = 'git123456'
user.password_confirmation = 'git123456'
user.save!
```

## 文档
https://docs.gitlab.com/ee/install/docker/

https://docs.gitlab.com/ee/install/next_steps.html