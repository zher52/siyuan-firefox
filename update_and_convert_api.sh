#!/bin/bash

# 设置错误时退出
set -e

# 定义颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# 定义常量
RESET_COMMIT="babdf0c7de97a040560aeea6e0d7197ad93644f3"
UPSTREAM_REMOTE="upstream"
UPSTREAM_BRANCH="main"
ORIGIN_REMOTE="origin"
ORIGIN_BRANCH="main"

# 函数：打印信息
function info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

function warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

function error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# 函数：重置代码到指定提交
to_reset_code() {
    info "开始重置代码到提交 $RESET_COMMIT"
    
    # 重置本地代码
    git checkout $ORIGIN_BRANCH || error "切换到 $ORIGIN_BRANCH 分支失败"
    git reset --hard $RESET_COMMIT || error "重置本地代码失败"
    
    # 强制推送重置到远程
    git push -f $ORIGIN_REMOTE $ORIGIN_BRANCH || error "强制推送重置到远程失败"
    
    info "代码已成功重置到提交 $RESET_COMMIT"
}

# 函数：从upstream拉取代码并解决冲突
to_pull_from_upstream() {
    info "从 $UPSTREAM_REMOTE/$UPSTREAM_BRANCH 拉取代码"
    
    # 确保有upstream远程仓库
    if ! git remote | grep -q "^$UPSTREAM_REMOTE$"; then
        error "未找到 $UPSTREAM_REMOTE 远程仓库，请先添加"
    fi
    
    # 获取最新的upstream代码
    git fetch $UPSTREAM_REMOTE || error "获取 $UPSTREAM_REMOTE 代码失败"
    
    # 尝试合并，优先使用远端版本解决冲突，使用--no-edit避免交互式输入
    info "尝试合并代码，优先使用远端版本解决冲突"
    if ! git merge -X theirs --no-edit $UPSTREAM_REMOTE/$UPSTREAM_BRANCH; then
        # 如果仍有冲突，检查是否有未解决的冲突
        if git diff --name-only --diff-filter=U | grep -q .; then
            error "合并后仍存在未解决的冲突，请手动处理"
        fi
    fi
    
    info "从 $UPSTREAM_REMOTE 拉取并合并完成"
}

# 函数：将chrome API转换为browser API
to_convert_chrome_to_browser() {
    info "开始将chrome API转换为browser API"
    
    # 查找所有需要转换的JavaScript文件
    js_files=$(find . -name "*.js" -not -path "*/node_modules/*" -not -path "*/.git/*")
    
    if [ -z "$js_files" ]; then
        warning "未找到需要转换的JavaScript文件"
        return 0
    fi
    
    # 对每个文件进行转换
    for file in $js_files; do
        info "转换文件: $file"
        
        # 使用sed替换chrome API为browser API
        # 注意：需要处理chrome.xxx这样的模式，而不是简单替换所有chrome字符串
        sed -i '' 's/chrome\./browser\./g' "$file"
        
        # 检查是否还有chrome API未转换
        if grep -q 'chrome\.' "$file"; then
            warning "文件 $file 中可能还有未转换的chrome API"
        fi
    done
    
    info "chrome API转换为browser API完成"
}

# 函数：提交代码到origin
to_commit_and_push() {
    info "提交代码到 $ORIGIN_REMOTE/$ORIGIN_BRANCH"
    
    # 暂存所有修改
    git add . || error "暂存代码失败"
    
    # 提交代码
    git commit -m "自动提交：从upstream拉取代码并转换chrome API为browser API" || error "提交代码失败"
    
    # 推送到origin
    git push $ORIGIN_REMOTE $ORIGIN_BRANCH || error "推送代码到 $ORIGIN_REMOTE 失败"
    
    info "代码已成功推送到 $ORIGIN_REMOTE/$ORIGIN_BRANCH"
}

# 主函数
function main() {
    # 切换到脚本所在目录
    cd "$(dirname "$0")"
    
    # 检查是否在git仓库中
    if [ ! -d ".git" ]; then
        error "当前目录不是git仓库"
    fi
    
    # 在测试阶段自动进入测试模式
    info "自动进入测试模式"
    to_reset_code
    
    # 执行主要任务
    to_pull_from_upstream
    to_convert_chrome_to_browser
    to_commit_and_push
    
    info "所有任务已成功完成！"
}

# 执行主函数
main