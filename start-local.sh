#!/bin/bash

PORT=8000

# 检查端口是否被占用
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  端口 $PORT 已被占用，正在尝试释放..."
    lsof -ti:$PORT | xargs kill -9 2>/dev/null
    sleep 1
fi

# 如果还是被占用，尝试其他端口
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null ; then
    PORT=8001
    echo "⚠️  使用备用端口 $PORT"
fi

echo "🚀 启动本地开发服务器..."
echo ""
echo "访问地址："
echo "  - 主页: http://localhost:$PORT"
echo "  - 3D粒子页面: http://localhost:$PORT/particles/"
echo ""
echo "按 Ctrl+C 停止服务器"
echo ""

cd "$(dirname "$0")"
python3 -m http.server $PORT

