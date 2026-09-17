/**
 * 浏览器端 crypto 兜底 shim
 *
 * sm-crypto 的 rng.js 在 Node 环境兜底 require('crypto'),浏览器环境实际走
 * window.crypto.getRandomValues 分支,此 shim 仅为满足打包解析,消除
 * "Module 'crypto' has been externalized for browser compatibility" 警告。
 * 若未来有依赖需要真实随机数,应使用 window.crypto 而非本 shim。
 */
export default globalThis.crypto ?? {};
