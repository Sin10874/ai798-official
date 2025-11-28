// Supabase 配置
const SUPABASE_URL = 'https://wxkegebsiiirzkneplle.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind4a2VnZWJzaWlpcnprbmVwbGxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxOTI2ODUsImV4cCI6MjA3OTc2ODY4NX0.XT5cFvXDAbipklTdmLg-uUdhiVA3wPcRur31pqqdWRE';

// 初始化 Supabase 客户端
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * 数据库操作 API
 */

// 获取所有用户
async function getAllUsers() {
    const { data, error } = await supabase
        .from('users')
        .select('*');
    
    if (error) {
        console.error('获取用户失败:', error);
        return [];
    }
    return data;
}

// 根据日期获取题目
async function getQuestionByDate(date) {
    const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('date', date)
        .single();
    
    if (error) {
        console.error('获取题目失败:', error);
        return null;
    }
    return data;
}

// 获取所有有任务的日期（用于历史回顾页面的导航）
async function getAllTaskDates() {
    const { data, error } = await supabase
        .from('questions')
        .select('date')
        .order('date', { ascending: false }); // 最近的日期在前
    
    if (error) {
        console.error('获取任务日期失败:', error);
        return [];
    }
    // 提取日期字符串数组
    return data.map(item => item.date);
}

// 获取用户的打卡记录
async function getUserCheckins(userId) {
    const { data, error } = await supabase
        .from('checkins')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });
    
    if (error) {
        console.error('获取打卡记录失败:', error);
        return [];
    }
    return data;
}

// 获取用户累计打卡天数
async function getUserCheckinCount(userId) {
    const { count, error } = await supabase
        .from('checkins')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
    
    if (error) {
        console.error('获取打卡天数失败:', error);
        return 0;
    }
    return count || 0;
}

// 检查用户当天是否已打卡
async function checkTodayCheckin(userId, date) {
    const { data, error } = await supabase
        .from('checkins')
        .select('*')
        .eq('user_id', userId)
        .eq('date', date)
        .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('检查打卡失败:', error);
        return null;
    }
    return data;
}

// 提交打卡
async function submitCheckin(userId, userName, userPhone, date, answer, imageUrl) {
    const { data, error } = await supabase
        .from('checkins')
        .upsert({
            user_id: userId,
            user_name: userName,
            user_phone: userPhone,
            date: date,
            answer: answer,
            image_url: imageUrl
        }, {
            onConflict: 'user_id,date'
        })
        .select()
        .single();
    
    if (error) {
        console.error('提交打卡失败:', error);
        return { success: false, error: error.message };
    }
    return { success: true, data };
}

// 获取指定日期的所有打卡记录（管理员用）
async function getCheckinsByDate(date) {
    const { data, error } = await supabase
        .from('checkins')
        .select('*')
        .eq('date', date)
        .order('created_at', { ascending: false });
    
    if (error) {
        console.error('获取打卡记录失败:', error);
        return [];
    }
    return data;
}

// 上传图片到 Supabase Storage
async function uploadImage(file, userId) {
    // 健壮的后缀名获取
    let fileExt = 'png'; // 默认
    if (file.name && file.name.includes('.')) {
        const parts = file.name.split('.');
        if (parts.length > 1) {
            fileExt = parts.pop();
        }
    } else if (file.type) {
        if (file.type.includes('jpeg') || file.type.includes('jpg')) fileExt = 'jpg';
        else if (file.type.includes('gif')) fileExt = 'gif';
        else if (file.type.includes('webp')) fileExt = 'webp';
    }

    // 生成唯一文件名 (防止冲突)
    const fileName = `${userId}_${Date.now()}_${Math.floor(Math.random() * 1000)}.${fileExt}`;
    const filePath = `checkins/${fileName}`;

    // 增加重试机制或更详细的错误日志
    try {
        const { data, error } = await supabase.storage
            .from('checkin-images')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) {
            console.error('上传图片API错误:', error);
            // 常见错误：Policy 没配置，或者 Bucket 不存在
            if (error.statusCode === '403' || error.message.includes('policy')) {
                console.error('可能是 Supabase Storage Policy 未配置，请检查后台设置。');
            }
            return null;
        }

        // 获取公开 URL
        const { data: urlData } = supabase.storage
            .from('checkin-images')
            .getPublicUrl(filePath);

        return urlData.publicUrl;
    } catch (err) {
        console.error('上传过程异常:', err);
        return null;
    }
}

/**
 * 评论相关操作
 */

// 获取某条打卡的所有评论（包括一级和二级评论）
async function getComments(checkinId) {
    const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('checkin_id', checkinId)
        .order('created_at', { ascending: true });
    
    if (error) {
        console.error('获取评论失败:', error);
        return [];
    }
    return data;
}

// 添加评论
async function addComment(checkinId, userId, userName, content, parentId = null) {
    const { data, error } = await supabase
        .from('comments')
        .insert({
            checkin_id: checkinId,
            user_id: userId,
            user_name: userName,
            content: content,
            parent_id: parentId
        })
        .select()
        .single();
    
    if (error) {
        console.error('添加评论失败:', error);
        return { success: false, error: error.message };
    }
    return { success: true, data };
}

// 删除评论（可选功能）
async function deleteComment(commentId, userId) {
    const { data, error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', userId);
    
    if (error) {
        console.error('删除评论失败:', error);
        return { success: false, error: error.message };
    }
    return { success: true };
}

/**
 * 点赞相关操作
 */

// 获取某个目标的所有点赞
async function getLikes(targetType, targetId) {
    const { data, error } = await supabase
        .from('likes')
        .select('*')
        .eq('target_type', targetType)
        .eq('target_id', targetId);
    
    if (error) {
        console.error('获取点赞失败:', error);
        return [];
    }
    return data;
}

// 批量获取多个目标的点赞数
async function getLikesCounts(targetType, targetIds) {
    if (!targetIds || targetIds.length === 0) return {};
    
    const { data, error } = await supabase
        .from('likes')
        .select('target_id')
        .eq('target_type', targetType)
        .in('target_id', targetIds);
    
    if (error) {
        console.error('获取点赞数失败:', error);
        return {};
    }
    
    // 统计每个目标的点赞数
    const counts = {};
    data.forEach(like => {
        counts[like.target_id] = (counts[like.target_id] || 0) + 1;
    });
    
    return counts;
}

// 添加点赞
async function addLike(targetType, targetId, userId, userName) {
    const { data, error } = await supabase
        .from('likes')
        .insert({
            target_type: targetType,
            target_id: targetId,
            user_id: userId,
            user_name: userName
        })
        .select()
        .single();
    
    if (error) {
        // 如果是重复点赞错误（唯一约束冲突），返回特殊标识
        if (error.code === '23505') {
            return { success: false, error: 'already_liked' };
        }
        console.error('添加点赞失败:', error);
        return { success: false, error: error.message };
    }
    return { success: true, data };
}

// 取消点赞
async function removeLike(targetType, targetId, userId) {
    const { data, error } = await supabase
        .from('likes')
        .delete()
        .eq('target_type', targetType)
        .eq('target_id', targetId)
        .eq('user_id', userId);
    
    if (error) {
        console.error('取消点赞失败:', error);
        return { success: false, error: error.message };
    }
    return { success: true };
}

// 检查用户是否已点赞
async function checkUserLike(targetType, targetId, userId) {
    const { data, error } = await supabase
        .from('likes')
        .select('id')
        .eq('target_type', targetType)
        .eq('target_id', targetId)
        .eq('user_id', userId)
        .single();
    
    if (error && error.code !== 'PGRST116') {
        console.error('检查点赞状态失败:', error);
        return false;
    }
    return !!data;
}

// 批量检查用户的点赞状态
async function checkUserLikes(targetType, targetIds, userId) {
    if (!targetIds || targetIds.length === 0) return {};
    
    const { data, error } = await supabase
        .from('likes')
        .select('target_id')
        .eq('target_type', targetType)
        .in('target_id', targetIds)
        .eq('user_id', userId);
    
    if (error) {
        console.error('批量检查点赞状态失败:', error);
        return {};
    }
    
    // 转换为 { targetId: true } 的映射
    const likedMap = {};
    data.forEach(like => {
        likedMap[like.target_id] = true;
    });
    
    return likedMap;
}

