# WSL安装Redis 
Ubuntu:
```shell
curl -fsSL https://packages.redis.io/gpg | sudo gpg --dearmor -o /usr/share/keyrings/redis-archive-keyring.gpg

echo "deb [signed-by=/usr/share/keyrings/redis-archive-keyring.gpg] https://packages.redis.io/deb $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/redis.list

sudo apt-get update
sudo apt-get install redis
```

启动Redis:
```shell
sudo service redis-server start
```

# 参考文献
https://redis.io/docs/getting-started/installation/install-redis-on-windows/