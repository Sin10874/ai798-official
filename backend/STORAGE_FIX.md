# Supabase Storage 配置修复指南

## 当前问题
Policy 已存在但可能配置不正确，导致上传失败。

## 解决方案

### 方案 1：删除旧 Policy 并重新创建

在 Supabase SQL Editor 中运行以下代码：

```sql
-- 1. 删除可能存在的旧 Policy
drop policy if exists "Allow public uploads" on storage.objects;
drop policy if exists "Allow public reads" on storage.objects;

-- 2. 重新创建上传权限
create policy "Allow public uploads"
on storage.objects for insert
to public
with check ( bucket_id = 'checkin-images' );

-- 3. 重新创建读取权限
create policy "Allow public reads"
on storage.objects for select
to public
using ( bucket_id = 'checkin-images' );

-- 4. 额外添加：允许删除（可选，方便管理）
create policy "Allow public deletes"
on storage.objects for delete
to public
using ( bucket_id = 'checkin-images' );
```

### 方案 2：通过 UI 配置（更简单）

1. 进入 **Storage** > 点击 `checkin-images` bucket
2. 点击 **Policies** 标签
3. 如果看到已有的 Policy，点击右侧的 **...** > **Edit** 或 **Delete**
4. 点击 **New Policy** 按钮
5. 选择 **Get started quickly** 模板
6. 选择以下选项：
   - Policy name: `Allow public uploads`
   - Allowed operation: **INSERT**
   - Target roles: **public**
   - Policy definition: 使用默认或输入 `bucket_id = 'checkin-images'`
7. 重复步骤 4-6，创建 **SELECT** 权限的 Policy

### 方案 3：最简单的方式（推荐）

直接在 SQL Editor 运行这个一键修复脚本：

```sql
-- 清理并重建所有权限
begin;

-- 删除旧策略（如果存在）
drop policy if exists "Allow public uploads" on storage.objects;
drop policy if exists "Allow public reads" on storage.objects;
drop policy if exists "Allow public deletes" on storage.objects;
drop policy if exists "Allow authenticated uploads" on storage.objects;

-- 创建新策略：允许所有人上传到 checkin-images
create policy "Public Access"
on storage.objects
for all
to public
using ( bucket_id = 'checkin-images' )
with check ( bucket_id = 'checkin-images' );

commit;
```

## 验证配置

运行完后，在 SQL Editor 中执行以下查询验证：

```sql
-- 查看当前的 Storage Policies
select * from pg_policies where tablename = 'objects';
```

应该能看到至少一条针对 `checkin-images` 的 policy。

## 完成后

1. 刷新打卡页面
2. 尝试粘贴图片
3. 如果还有问题，打开浏览器控制台查看详细错误信息

