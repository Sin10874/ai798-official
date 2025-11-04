# ai798 Lab 官网

ai798 Lab 官方网站，像素风格设计。

## 部署到 Vercel

### 方法一：使用 Vercel CLI（推荐）

1. **安装 Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **登录 Vercel**
   ```bash
   vercel login
   ```

3. **部署项目**
   ```bash
   vercel
   ```
   首次部署会提示：
   - 是否链接到现有项目？选择 `N`
   - 项目名称：输入 `ai798lab`（或你喜欢的名称）
   - 目录：直接回车（使用当前目录）
   - 是否覆盖设置：选择 `N`

4. **生产环境部署**
   ```bash
   vercel --prod
   ```

### 方法二：通过 GitHub 集成（推荐用于持续部署）

1. **初始化 Git 仓库**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. **创建 GitHub 仓库并推送**
   ```bash
   git remote add origin <你的GitHub仓库URL>
   git branch -M main
   git push -u origin main
   ```

3. **在 Vercel 网站集成**
   - 访问 [vercel.com](https://vercel.com)
   - 点击 "Add New Project"
   - 导入你的 GitHub 仓库
   - Vercel 会自动检测并部署

### 方法三：直接拖拽部署（最简单）

1. 访问 [vercel.com](https://vercel.com)
2. 登录账户
3. 点击 "Add New Project"
4. 选择 "Upload" 或直接拖拽项目文件夹
5. 等待部署完成

## 项目结构

```
ai798/
├── index.html      # 主页面文件
├── vercel.json     # Vercel 配置文件
├── .gitignore      # Git 忽略文件
└── README.md       # 项目说明
```

## 注意事项

- 本项目是纯静态 HTML 网站，无需构建步骤
- Vercel 会自动提供 HTTPS 和全球 CDN
- 部署后会自动获得一个 `.vercel.app` 域名
- 可以在 Vercel 控制台配置自定义域名

## 更新网站

修改 `index.html` 后：

**使用 CLI：**
```bash
vercel --prod
```

**使用 GitHub：**
只需推送到 GitHub，Vercel 会自动部署更新。

