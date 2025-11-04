#!/bin/bash

echo "🚀 开始部署 ai798 Lab 官网到 Vercel..."
echo ""

# 检查是否已登录 Vercel
if ! vercel whoami &> /dev/null; then
    echo "⚠️  未检测到 Vercel 登录状态"
    echo "正在启动登录流程..."
    vercel login
fi

echo "📦 准备部署..."
echo ""

# 首次部署（预览环境）
echo "正在部署到预览环境..."
vercel

echo ""
echo "✅ 预览环境部署完成！"
echo ""
echo "🌐 要部署到生产环境，请运行："
echo "   vercel --prod"
echo ""

