## SiYuan Firefox 扩展

[English](https://github.com/zher52/siyuan-firefox/blob/main/README.md)

### 💡 简介

思源笔记 Firefox 浏览器扩展。这是[原始 Chrome 扩展](https://github.com/siyuan-note/siyuan-chrome)的一个分支。

### 🛠️ 安装

* Firefox：[SiYuan - Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/siyuan/)
* GitHub：[siyuan-firefox](https://github.com/zher52/siyuan-firefox)

### ✨  使用

1. 从 Firefox 扩展商店安装扩展
2. 配置扩展：
   - 打开思源桌面版 > 设置 > 关于 > API token
   - 在扩展设置中，设置 URL 为 `http://127.0.0.1:6806` 并粘贴 API token
3. 在 Web 页面上选择需要剪藏的内容，然后在右键菜单中选择 "Copy to SiYuan"
4. 在思源中粘贴

### ⚠️ 重要说明

* 由于安全设置，当从非本地地址访问时，思源服务必须使用 HTTPS 协议
* 对于本地访问（127.0.0.1），允许使用 HTTP 协议
* 授权码可以是任意代码，但必须与扩展中设置的相匹配

### 🔒 隐私条款

* 所有数据都保存在用户自己完全控制的设备上
* 不会收集任何使用数据

### 🔄 与 Chrome 扩展的区别

* 适配 Firefox 浏览器兼容性
* 更新了本地化支持
* 保持与 Chrome 版本的功能一致性
