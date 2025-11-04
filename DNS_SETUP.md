# ai798.cn DNS 配置指南

## 问题说明

- `*.vercel.app` 域名在国内可能被墙，无法访问
- 需要完成自定义域名的 DNS 验证才能使用 `ai798.cn` 访问

## DNS 配置步骤

### 1. 登录域名注册商管理后台

登录你购买 `ai798.cn` 的域名注册商（如阿里云、腾讯云、新网等）的 DNS 管理后台。

### 2. 添加 DNS 记录

在域名 DNS 设置中添加以下记录：

#### 方案 A：使用 A 记录（推荐，适合国内访问）

```
类型: A
主机记录: @
记录值: 76.223.126.88
TTL: 600 (或自动)

类型: A
主机记录: www
记录值: 76.223.126.88
TTL: 600 (或自动)
```

#### 方案 B：使用 CNAME 记录（备选）

```
类型: CNAME
主机记录: @
记录值: cname-china.vercel-dns.com
TTL: 600 (或自动)

类型: CNAME
主机记录: www
记录值: cname-china.vercel-dns.com
TTL: 600 (或自动)
```

### 3. 验证 DNS 配置

配置完成后，等待 5-30 分钟让 DNS 生效，然后：

```bash
# 检查 DNS 解析
nslookup ai798.cn
nslookup www.ai798.cn

# 或者使用 dig 命令
dig ai798.cn
```

### 4. 在 Vercel 验证域名

1. 访问 Vercel 控制台：https://vercel.com/sins-projects-1cd81196/ai798-official/settings/domains
2. 找到 `ai798.cn` 域名
3. 点击 "Verify" 或 "Refresh" 按钮
4. 等待验证完成（通常几分钟内）

### 5. 检查域名状态

```bash
# 使用 Vercel CLI 检查
vercel domains ls
vercel domains inspect ai798.cn
```

## 常见问题

### Q: DNS 配置后多久生效？
A: 通常 5-30 分钟，最长可能需要 24-48 小时。

### Q: 为什么 vercel.app 还是打不开？
A: `*.vercel.app` 域名在国内可能被墙，这是正常现象。完成 DNS 验证后，使用 `ai798.cn` 访问即可。

### Q: 如何加快 DNS 生效速度？
A: 
- 将 TTL 设置为较小值（如 600 秒）
- 清除本地 DNS 缓存：`sudo dscacheutil -flushcache` (Mac) 或 `ipconfig /flushdns` (Windows)

### Q: DNS 验证失败怎么办？
A:
1. 确认 DNS 记录已正确添加
2. 等待更长时间（最长 48 小时）
3. 在 Vercel 控制台重新点击 "Verify"
4. 检查域名是否已备案（.cn 域名需要备案）

## 备案说明

如果使用 `.cn` 域名：
- **必须完成 ICP 备案**才能在国内正常访问
- 备案流程：通过域名注册商提交备案申请
- 备案期间：可使用 `*.vercel.app` 域名（需要 VPN）或等待备案完成

## 测试访问

配置完成后，访问：
- https://ai798.cn
- https://www.ai798.cn

如果都能正常访问，说明配置成功！

