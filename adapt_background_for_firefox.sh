#!/bin/bash
#
# 将上游的 MV3 service worker 后台脚本适配为 Firefox 的 event page。
#
# 上游 siyuan-chrome 使用 "background": {"service_worker": "background.js"}，
# 并在 background.js 第一行用 importScripts() 加载共享库。
# 本仓库使用 "background": {"scripts": [...]}（Firefox MV3 的 event page），
# 而 event page 中不存在 importScripts，脚本会在第一行直接抛出
#   Uncaught ReferenceError: importScripts is not defined
# 导致整个后台脚本失效，剪藏时只会提示“请启动思源并确保网络连通后再试”。
#
# 这里把 importScripts() 里的库改为在 manifest 的 background.scripts 中声明，
# 二者加载顺序和时机一致。脚本是幂等的：没有 importScripts 时不做任何修改。
#
# Adapts the upstream MV3 service-worker background to a Firefox event page:
# moves the libraries from importScripts() into manifest background.scripts.
# Idempotent - a no-op once background.js has no importScripts call.

set -e

cd "$(dirname "$0")"

BACKGROUND_JS="background.js"
MANIFEST="manifest.json"

if [ ! -f "$BACKGROUND_JS" ] || [ ! -f "$MANIFEST" ]; then
    echo "[adapt-background] 未找到 $BACKGROUND_JS 或 $MANIFEST，跳过"
    exit 0
fi

if ! grep -q '^\s*importScripts(' "$BACKGROUND_JS"; then
    echo "[adapt-background] background.js 中没有 importScripts，无需处理"
    exit 0
fi

node - "$BACKGROUND_JS" "$MANIFEST" <<'NODE'
const fs = require("fs");
const [backgroundPath, manifestPath] = process.argv.slice(2);

const source = fs.readFileSync(backgroundPath, "utf8");
const call = source.match(/^[ \t]*importScripts\(([^)]*)\);?[ \t]*\r?\n?/m);
if (!call) {
    console.log("[adapt-background] 未匹配到 importScripts 调用，跳过");
    process.exit(0);
}

const libs = call[1]
    .split(",")
    .map((arg) => arg.trim().replace(/^["'`]|["'`]$/g, ""))
    .filter(Boolean);
if (0 === libs.length) {
    console.log("[adapt-background] importScripts 参数为空，跳过");
    process.exit(0);
}

fs.writeFileSync(backgroundPath, source.replace(call[0], ""));

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
manifest.background = manifest.background || {};
delete manifest.background.service_worker;
manifest.background.scripts = [...libs, backgroundPath];
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");

console.log("[adapt-background] 已移入 manifest background.scripts: " + libs.join(", "));
NODE
