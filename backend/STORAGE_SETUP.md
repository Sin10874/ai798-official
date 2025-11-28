# Supabase 图片存储配置指南

## 步骤：创建 Storage Bucket

1. 打开你的 Supabase 项目
2. 点击左侧菜单的 **Storage**
3. 点击 **New bucket** 按钮
4. 填写以下信息：
   - **Name**: `checkin-images`
   - **Public bucket**: ✅ **勾选**（允许公开访问图片）
5. 点击 **Create bucket**

## 设置访问策略（可选，建议配置）

为了让前端能上传图片，需要配置 Policy：

1. 点击刚创建的 `checkin-images` bucket
2. 点击 **Policies** 标签
3. 点击 **New policy**
4. 选择 **For full customization**
5. 填写以下内容：

**Policy name**: `Allow public uploads`

**Policy definition**:
```sql
CREATE POLICY "Allow public uploads"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'checkin-images');
```

6. 再创建一个读取策略：

**Policy name**: `Allow public reads`

**Policy definition**:
```sql
CREATE POLICY "Allow public reads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'checkin-images');
```

## 完成

配置完成后，打卡系统就能正常上传和显示图片了！

