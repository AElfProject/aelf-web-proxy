/**
 * @file proxy.js
 * @author huangzongzhe
 * @description
 */

const request = require('request');
const http = require('http');
const httpProxy = require('http-proxy');
const {
  nodesInfoHttpProvider,
  nodesInfoUpdateInterval
} = require('./config');
const proxy = httpProxy.createProxyServer();

class Proxy {
  constructor(options) {
    this.nodesInfo = {};
    this.lastUpdateTime = (new Date()).getTime();
  }

  async init() {
    await this.updateNodesInfo();
    this.createServer();
  }

  async updateNodesInfo() {
    const nodesInfo = await this.getNodesInfo();
    this.nodesInfo = this.formatNodesInfo(nodesInfo);
  }

  formatNodesInfo(nodesInfo) {
    // {
    //     "list": [{
    //         "contract_address": "3AhZRe8RvTiZUBdcqCsv37K46bMU2L2hH81JF8jKAnAUup9",
    //         "chain_id": "AELF",
    //         "api_ip": "http://localhost:7101",
    //         "api_domain": "http://localhost:7101",
    //         "rpc_ip": "http://192.168.197.70:8000",
    //         "rpc_domain": "http://192.168.197.70:8000",
    //         "token_name": "ELF",
    //         "owner": "hzz780",
    //         "status": 1,
    //         "create_time": "2019-03-19T07:31:39.000Z"
    //     }]
    // }
    const nodesInfoTemp = JSON.parse(nodesInfo);
    const nodesInfoList = nodesInfoTemp.list;
    let nodesInfoFormatted = {};
    if (nodesInfoList) {
      for (let index = 0, length = nodesInfoList.length; index < length; index++) {
        const item = nodesInfoList[index];
        const uniqueKey = item.contract_address + item.chain_id;
        nodesInfoFormatted[uniqueKey] = item;
      }
    }
    return nodesInfoFormatted;
  }

  getNodesInfo() {
    return new Promise((resolve, reject) => {
      const options = {
        method: 'GET',
        url: nodesInfoHttpProvider
      };

      request(options, function (error, response, body) {
        if (error) {
          reject(error);
          throw new Error(error);
        }
        resolve(body);
      });
    });
  }

  proxyWeb(nodeInfo, req, res) {
    let targetUrl;

    // Chain WebAPI accept like "text/plain;v=1.0";
    const isChainWebAPI = /text\/plain;+\s*v=/.test(req.headers.accept.toLowerCase());
    req.url = req.url.replace(/^\/chain/, '');

    if (isChainWebAPI) {
      targetUrl = nodeInfo.rpc_ip || nodeInfo.rpc_domain;
    }
    // /api or /chain
    // api/chain is also need rpc_ip or rcp_domain; but api/chain always isChainWebAPI===true.
    else if (req.url.match(/^\/api\//)) {
      targetUrl = nodeInfo.api_ip || nodeInfo.api_domain;
    } else {
      targetUrl = nodeInfo.rpc_ip || nodeInfo.rpc_domain;
    }
    proxy.web(req, res, {
      target: targetUrl
    });
  }

  createServer() {
    http.createServer(async (req, res) => {

      // 如果是获取节点数据，不再转发
      if (req.url.includes('/api/nodes/info')) {
        const nodesInfo = await this.getNodesInfo();
        httpResponse(res, {
          statusCode: 200,
          output: {
            error: 0,
            message: '',
            result: JSON.parse(nodesInfo)
          }
        });
        return;
      }

      // 如果是更新节点信息，不再转发。
      if (req.url.includes('/api/aelf/nodes/update')) {
        const timeNow = (new Date()).getTime();
        if ((timeNow - this.lastUpdateTime) < nodesInfoUpdateInterval) {
          httpResponse(res, {
            statusCode: 500,
            output: {
              error: 1,
              message: 'Too frequent'
            }
          });
          return;
        }
        this.lastUpdateTime = timeNow;
        await this.updateNodesInfo();
        httpResponse(res, {
          statusCode: 200,
          output: {
            error: 0,
            message: 'updated',
            result: this.nodesInfo
          }
        });
        return;
      }

      // 根据cookie转发到不同的节点服务
      const cookie = req.headers.cookie;
      let uniqueKey;
      try {
        uniqueKey = cookie.match(/aelf_ca_ci=\w*/g)[0].split('=')[1];
      } catch (err) {
        uniqueKey = '';
      }
      if (this.nodesInfo[uniqueKey]) {
        const nodeInfo = this.nodesInfo[uniqueKey];
        this.proxyWeb(nodeInfo, req, res);
      } else {
        await this.updateNodesInfo();
        if (this.nodesInfo[uniqueKey]) {
          const nodeInfo = this.nodesInfo[uniqueKey];
          this.proxyWeb(nodeInfo, req, res);
        } else {
          httpResponse(res, {
            statusCode: 404,
            output: {
              error: 1,
              message: 'Can not find the information of this node',
              result: {
                header: JSON.stringify(req.headers, true, 2)
              }
            }
          });
        }
      }
    }).listen(7250);
  }
}

function httpResponse(res, options) {
  const {
    statusCode,
    contentType,
    output
  } = options;
  res.writeHead(statusCode, {
    'Content-Type': contentType || 'application/json'
  });
  res.write(JSON.stringify(output));
  res.end();
}

module.exports = Proxy;
