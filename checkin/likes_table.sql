-- 创建点赞表
-- 在 Supabase SQL Editor 中执行此脚本

CREATE TABLE IF NOT EXISTS likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_type TEXT NOT NULL CHECK (target_type IN ('checkin', 'comment')),
    target_id UUID NOT NULL,
    user_id UUID NOT NULL,
    user_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    -- 同一用户对同一目标只能点赞一次
    UNIQUE(target_type, target_id, user_id)
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_likes_target ON likes(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_likes_user ON likes(user_id);

-- 启用 RLS (Row Level Security)
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- 创建策略：所有人可以查看点赞
CREATE POLICY "Anyone can view likes"
    ON likes FOR SELECT
    USING (true);

-- 创建策略：登录用户可以点赞
CREATE POLICY "Authenticated users can create likes"
    ON likes FOR INSERT
    WITH CHECK (true);

-- 创建策略：用户只能删除自己的点赞
CREATE POLICY "Users can delete their own likes"
    ON likes FOR DELETE
    USING (auth.uid() = user_id);

-- 添加说明
COMMENT ON TABLE likes IS '点赞表，支持对打卡内容和评论点赞';
COMMENT ON COLUMN likes.target_type IS '点赞目标类型：checkin(打卡) 或 comment(评论)';
COMMENT ON COLUMN likes.target_id IS '点赞目标ID';
COMMENT ON COLUMN likes.user_id IS '点赞用户ID';
COMMENT ON COLUMN likes.user_name IS '点赞用户姓名';

