document.addEventListener('DOMContentLoaded', function () {
    browser.runtime.onMessage.addListener(
        async (request, sender, sendResponse) => {
            if ('tip' === request.func && request.tip) {
                siyuanShowTip(request.msg, request.timeout)
                return
            }

            if ('copy2Clipboard' === request.func) {
                copyToClipboard(request.data)
                return
            }

            if ('copy' !== request.func) {
                return
            }

            siyuanShowTip('Clipping, please wait a moment...')

            const selection = window.getSelection()
            if (selection && 0 < selection.rangeCount) {
                const range = selection.getRangeAt(0)
                const tempElement = document.createElement('div')
                tempElement.appendChild(range.cloneContents())
                siyuanSendUpload(tempElement, request.tabId, request.srcUrl, "part")
            }
        })
    const copyToClipboard = (textToCopy) => {
        if (navigator.clipboard && window.isSecureContext) {
            return navigator.clipboard.writeText(textToCopy)
        }

        let textArea = document.createElement('textarea')
        textArea.value = textToCopy
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        textArea.style.top = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        return new Promise((res, rej) => {
            document.execCommand('copy') ? res() : rej()
            textArea.remove()
        })
    }
})

let tipTimeoutId

const siyuanShowTip = (msg, timeout) => {
    let messageElement = document.getElementById('siyuanmessage')
    if (!messageElement) {
        document.body.insertAdjacentHTML('afterend', `<div style=" position:fixed;top: 0;z-index: 999999999;transform: translate3d(0, -100px, 0);opacity: 0;transition: opacity 0.15s cubic-bezier(0, 0, 0.2, 1) 0ms, transform 0.15s cubic-bezier(0, 0, 0.2, 1) 0ms;width: 100%;align-items: center;justify-content: center;height: 0;display: flex;" id="siyuanmessage">
<div style="line-height: 20px;border-radius: 4px;padding: 8px 16px;color: #fff;font-size: inherit;background-color: #4285f4;box-sizing: border-box;box-shadow: 0 3px 5px -1px rgba(0, 0, 0, 0.2), 0 6px 10px 0 rgba(0, 0, 0, 0.14), 0 1px 18px 0 rgba(0, 0, 0, 0.12);transition: transform 0.15s cubic-bezier(0, 0, 0.2, 1) 0ms;transform: scale(0.8);top: 16px;position: absolute;word-break: break-word;max-width: 80vw;"></div></div>`)
        messageElement = document.getElementById('siyuanmessage')
    }

    messageElement.style.transform = 'translate3d(0, 0, 0)'
    messageElement.style.opacity = '1'
    messageElement.firstElementChild.innerHTML = msg
    if (!timeout) {
        timeout = 5000
    }

    if (tipTimeoutId) {
        clearTimeout(tipTimeoutId);
    }

    tipTimeoutId = setTimeout(() => {
        siyuanClearTip();
    }, timeout);
}

const siyuanClearTip = () => {
    let messageElement = document.getElementById('siyuanmessage')
    if (!messageElement) {
        return
    }
    messageElement.style.transform = 'translate3d(0, -100px, 0)'
    messageElement.style.opacity = '0'
}

const siyuanConvertBlobToBase64 = (blob) => new Promise((resolve, reject) => {
    const reader = new FileReader
    reader.onerror = reject
    reader.onload = () => resolve(reader.result)
    reader.readAsDataURL(blob)
})

const siyuanSendUpload = async (tempElement, tabId, srcUrl, type, article, href) => {
    chrome.storage.sync.get({
        ip: 'http://127.0.0.1:6806',
        showTip: true,
        token: '',
        notebook: '',
        parentDoc: '',
        parentHPath: '',
        tags: '',
        assets: true,
    }, async function (items) {
        if (!items.token) {
            siyuanShowTip('Please config API token before clipping content 剪藏前请先配置 API token')
            return
        }

        if (!items.notebook) {
            siyuanShowTip('Please select save path before clipping content 剪藏前请先选择保存路径')
            return
        }

        let srcList = []
        if (srcUrl) {
            srcList.push(srcUrl)
        }
        const images = tempElement.querySelectorAll('img')
        images.forEach(item => {
            let src = item.getAttribute('src')
            if (!src) {
                return
            }

            // 处理使用 data-original 属性的情况 https://github.com/siyuan-note/siyuan/issues/11826
            let dataOriginal = item.getAttribute('data-original')
            if (dataOriginal) {
                if (!src || !src.endsWith('.gif')) {
                    src = dataOriginal
                }
            }

            if ('https:' === window.location.protocol) {
                if (src.startsWith('http:')) {
                    src = src.replace('http:', 'https:')
                } else if (src.startsWith('//')) {
                    src = 'https:' + src
                }
                item.setAttribute('src', src)
            }
            srcList.push(src)
        })

        const files = {}
        srcList = [...new Set(srcList)]

        if (!items.assets) { // 不剪藏资源文件 https://github.com/siyuan-note/siyuan/issues/12583
            srcList = []
        }

        let fetchFileErr = false;
        for (let i = 0; i < srcList.length; i++) {
            let src = srcList[i]
            siyuanShowTip('Clipping images [' + i + '/' + srcList.length + ']...')
            let response;
            try {
                // Wikipedia 使用图片原图 https://github.com/siyuan-note/siyuan/issues/11640
                if (-1 !== src.indexOf('wikipedia/commons/thumb/')) {
                    let idx = src.lastIndexOf('.')
                    let ext = src.substring(idx)
                    if (0 < src.indexOf('.svg.png')) {
                        ext = '.svg'
                    }
                    idx = src.indexOf(ext + '/')
                    if (0 < idx) {
                        src = src.substring(0, idx + ext.length)
                        src = src.replace('/commons/thumb/', '/commons/')
                    }
                }
                response = await fetch(src, {
                    "headers": {
                        "accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
                        "sec-fetch-dest": "image",
                    },
                });
            } catch (e) {
                console.warn("fetch [" + src + "] failed", e)
                fetchFileErr = true;
                continue
            }
            const image = await response.blob()
            files[escape(src)] = {
                type: image.type,
                data: await siyuanConvertBlobToBase64(image),
            }
        }

        let title = article && article.title ? article.title : "";
        let siteName = article && article.siteName ? article.siteName : "";
        let excerpt = article && article.excerpt ? article.excerpt : "";
        const msgJSON = {
            fetchFileErr,
            files: files,
            dom: tempElement.innerHTML,
            api: items.ip,
            token: items.token,
            notebook: items.notebook,
            parentDoc: items.parentDoc,
            parentHPath: items.parentHPath.substring(items.parentHPath.indexOf('/')),
            tags: items.tags,
            assets: items.assets,
            tip: items.showTip,
            title: title,
            siteName: siteName,
            excerpt: excerpt,
            href,
            type,
            tabId,
        };
        const jsonStr = JSON.stringify(msgJSON);
        const base64Data = btoa(unescape(encodeURIComponent(jsonStr)));
        const dataURL =`data:application/json;base64,${base64Data}`;
    console.log(dataURL);
        browser.runtime.sendMessage({func: 'upload-copy', dataURL: dataURL})
    })
}
