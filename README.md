## SiYuan Firefox Extension

[中文](https://github.com/siyuan-note/siyuan-chrome/blob/main/README_zh_CN.md)

### 💡 Introduction

A Firefox extension for SiYuan. This is a fork of the [original Chrome extension](https://github.com/siyuan-note/siyuan-chrome).

### 🛠️ Setup

* Firefox: [SiYuan - Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/siyuan/)
* GitHub: [siyuan-firefox](https://github.com/zher52/siyuan-firefox)

### ✨  Usages

1. Install the extension from Firefox Add-ons
2. Configure the extension:
   - Open SiYuan Desktop > Settings > About > API token
   - In the extension settings, set URL as `http://127.0.0.1:6806` and paste the API token
3. Select the content to be clipped on the web page, and then select "Copy to SiYuan" from the right-click menu
4. Paste in SiYuan

### ⚠️ Important Notes

* Due to security settings, your SiYuan service must use HTTPS protocol when accessing from non-localhost addresses
* For local access (127.0.0.1), HTTP protocol is allowed
* The authorization code can be any code, but it must match what you set in the extension

### 🔒 Privacy policy

* All data is saved on a device under the full control of the user himself
* No usage data will be collected

### 🔄 Differences from Chrome Extension

* Adapted for Firefox browser compatibility
* Updated localization support
* Maintained feature parity with the Chrome version
