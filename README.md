# aelf-web-proxy

1.占用端口：7250

2.需要先安装 pm2

3.依赖aelf-block-api服务

4.快速启动

```bash
sh build.sh start reinstall
# sh build.sh start
# sh build.sh restart
# sh build.sh stop
```

## 0.快速

### 用于已有AElf网络

先启动 [aelf-block-api](https://github.com/AElfProject/aelf-block-api)

修改config.js, 指定 nodesInfoHttpProvider

aelf-web-proxy 会调用aelf-block-api的 GET:api/nodes/info 查对应的节点的信息. 如果 aelf-block-api的接口查不到这个数据，请手动录入。

### 开发、自测

如果是单纯用于研发自测，请按以下顺序操作
[AElf Chain](https://github.com/AElfProject/AElf) ->
[aelf-block-scan](https://github.com/AElfProject/aelf-block-scan) ->
[aelf-block-api](https://github.com/AElfProject/aelf-block-api) ->
插入nodes的数据。

## 1.目的

aelf为多链结构, 每一条链有单独的API和DB

aelf-web-proxy根据cookie将前端请求转发到不同的API

启动时将从接口获取对应的api路径，并且可以触发更新。

Warning: 只适合在内网部署; 请做好对应服务的权限控制。

## 2.匹配项

/api: 将请求转发到对应 aelf-block-api服务

/chain: 将请求转发到对应的全节点服务

提示：对应的 aelf-block-api和全节点服务的服务器地址存在数据库里，aelf-web-proxy会通过默认的aelf-block-api从数据库获取。

## 3.额外API, 不走转发逻辑

### 3.1. /api/nodes/info

从指定接口获取节点的数据

### 3.2. /api/aelf/nodes/update

主动更新代理缓存中的节点数据
