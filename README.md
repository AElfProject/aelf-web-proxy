# aelf-web-proxy

## 1.目的

aelf为多链结构, 每一条链有单独的API和DB

aelf-web-proxy根据cookie将前端请求转发到不同的API

Warning: 只适合在内网部署

## 2.匹配项

/api

/chain

## 3.额外API, 不走转发逻辑

### 3.1. /api/nodes/info

从指定接口获取节点的数据

### 3.2. /api/aelf/nodes/update

主动更新代理缓存中的节点数据
