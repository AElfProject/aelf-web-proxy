/**
 * @file index.js
 * @author huangzongzhe
 * @description
 * 转发代理来自浏览器的请求，第一版用于多侧链浏览器的使用
 * Warning：该接口仅限内网使用
 */

const Proxy = require('./proxy');

const proxy = new Proxy();
proxy.init();
