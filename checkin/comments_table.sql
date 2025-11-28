-- 创建评论表
-- 在 Supabase SQL Editor 中执行此脚本

CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    checkin_id UUID NOT NULL REFERENCES checkins(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    user_name TEXT NOT NULL,
    content TEXT NOT NULL,
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_comments_checkin_id ON comments(checkin_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

-- 启用 RLS (Row Level Security)
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- 创建策略：所有人可以查看评论
CREATE POLICY "Anyone can view comments"
    ON comments FOR SELECT
    USING (true);

-- 创建策略：登录用户可以创建评论
CREATE POLICY "Authenticated users can create comments"
    ON comments FOR INSERT
    WITH CHECK (true);

-- 创建策略：用户只能删除自己的评论
CREATE POLICY "Users can delete their own comments"
    ON comments FOR DELETE
    USING (auth.uid() = user_id);

-- 创建策略：用户可以更新自己的评论
CREATE POLICY "Users can update their own comments"
    ON comments FOR UPDATE
    USING (auth.uid() = user_id);

-- 添加评论说明
COMMENT ON TABLE comments IS '打卡评论表，支持一级评论和二级回复';
COMMENT ON COLUMN comments.checkin_id IS '关联的打卡记录ID';
COMMENT ON COLUMN comments.user_id IS '评论者用户ID';
COMMENT ON COLUMN comments.user_name IS '评论者姓名';
COMMENT ON COLUMN comments.content IS '评论内容';
COMMENT ON COLUMN comments.parent_id IS '父评论ID，NULL表示一级评论';
COMMENT ON COLUMN comments.created_at IS '创建时间';
COMMENT ON COLUMN comments.updated_at IS '更新时间';

