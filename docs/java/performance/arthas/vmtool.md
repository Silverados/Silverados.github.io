# vmtool

- 查看实体信息：`vmtool -x 3 --action getInstances --className com.qgame.fight.scene.gameobj.hero.Hero  --express 'instances[0]'`
- `vmtool --action forceGc`: 强制GC
- `vmtool --action interruptThread -t 1`: 中断指定线程
- 获取spring配置参数: `vmtool --action getInstances --className org.springframework.context.ConfigurableApplicationContext --express 'instances[0].getEnvironment().getProperty("server.port")'`