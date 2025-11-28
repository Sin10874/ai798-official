/**
 * 通用工具与逻辑
 */

// 北京时间偏移量 (UTC+8)
const BJ_OFFSET = 8 * 60; // minutes

// 获取当前的北京时间 Date 对象
function getBJDate() {
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const bjMs = utc + (3600000 * 8);
    return new Date(bjMs);
}

// 获取 YYYY-MM-DD 格式的日期字符串 (基于北京时间)
function getBJDateString() {
    const date = getBJDate();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * 认证逻辑 (使用 Supabase)
 */
const AUTH_KEY = 'ai798_auth';

async function login(phone) {
    console.log("尝试登陆:", { inputPhone: phone });

    // 从 Supabase 查找用户
    const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .eq('phone', phone)
        .single();
    
    if (error || !users) {
        console.error("登陆失败:", error);
        return { success: false, message: '手机号不存在或未注册' };
    }

    console.log("登陆成功:", users);
    const session = {
        userId: users.id,
        phone: users.phone,
        name: users.name,
        loginTime: Date.now(),
        expiry: Date.now() + (14 * 24 * 60 * 60 * 1000) // 14天过期
    };
    localStorage.setItem(AUTH_KEY, JSON.stringify(session));
    return { success: true };
}

function logout() {
    localStorage.removeItem(AUTH_KEY);
    window.location.href = '/checkin/login';
}

function checkLoginState(redirectIfNot = true) {
    const sessionStr = localStorage.getItem(AUTH_KEY);
    
    if (!sessionStr) {
        if (redirectIfNot) window.location.href = '/checkin/login';
        return null;
    }

    const session = JSON.parse(sessionStr);
    
    // 检查是否过期
    if (Date.now() > session.expiry) {
        localStorage.removeItem(AUTH_KEY);
        if (redirectIfNot) window.location.href = '/checkin/login';
        return null;
    }

    // 如果在登陆页且已登陆，跳到主页
    if (!redirectIfNot && window.location.pathname.includes('/login')) {
        window.location.href = '/checkin';
    }

    return session;
}

function getCurrentUser() {
    const sessionStr = localStorage.getItem(AUTH_KEY);
    return sessionStr ? JSON.parse(sessionStr) : null;
}

/**
 * 页面初始化逻辑
 */

// 1. 登陆页面
function initLoginPage() {
    const form = document.getElementById('loginForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const phone = document.getElementById('phone').value.trim();
        const errorMsg = document.getElementById('errorMessage');
        
        const result = await login(phone);
        
        if (result.success) {
            window.location.href = '/checkin';
        } else {
            errorMsg.textContent = result.message;
        }
    });
}

// 图片上传类 (封装单组上传逻辑)
class ImageUploader {
    constructor(triggerId, inputId, gridId, maxImages = 9) {
        this.triggerBtn = document.getElementById(triggerId);
        this.input = document.getElementById(inputId);
        this.grid = document.getElementById(gridId);
        this.maxImages = maxImages;
        this.currentImages = []; // Stores URLs
        this.onUpdate = null; // Callback for updates

        if (!this.triggerBtn || !this.input || !this.grid) return;

        this.init();
    }

    init() {
        // ... existing code ...
        this.triggerBtn.addEventListener('click', () => {
             // ... existing code ...
             if (this.currentImages.length >= this.maxImages) {
                alert(`最多只能上传 ${this.maxImages} 张图片`);
                return;
            }
            this.input.click();
        });

        this.input.addEventListener('change', async (e) => {
            // ... (保持原有的上传逻辑) ...
            const files = Array.from(e.target.files);
            if (files.length === 0) return;
            
            const user = getCurrentUser();
            if (!user) return;

            if (this.currentImages.length + files.length > this.maxImages) {
                alert(`最多只能再上传 ${this.maxImages - this.currentImages.length} 张图片`);
                return;
            }

            for (const file of files) {
                const previewId = 'preview-' + Date.now() + Math.random();
                const div = document.createElement('div');
                div.className = 'preview-item uploading';
                div.id = previewId;
                div.innerHTML = `<div style="width:100%;height:100%;background:#222;color:#666;display:flex;align-items:center;justify-content:center;font-size:10px;">...</div>`;
                
                this.grid.insertBefore(div, this.triggerBtn);
                
                try {
                    const url = await uploadImage(file, user.userId || user.id);
                    if (url) {
                        this.currentImages.push(url);
                        div.classList.remove('uploading');
                        div.innerHTML = `<img src="${url}">`;
                        
                        const removeBtn = document.createElement('div');
                        removeBtn.className = 'remove-btn';
                        removeBtn.innerHTML = '×';
                        removeBtn.onclick = () => {
                            div.remove();
                            this.currentImages = this.currentImages.filter(u => u !== url);
                            this.updateUI();
                            if(this.onUpdate) this.onUpdate(); // Trigger callback
                        };
                        div.appendChild(removeBtn);
                    } else {
                        div.remove();
                        alert("图片上传失败");
                    }
                } catch (err) {
                    console.error(err);
                    div.remove();
                }
            }
            
            this.updateUI();
            if(this.onUpdate) this.onUpdate(); // Trigger callback
            this.input.value = '';
        });
    }


    updateUI() {
        if (this.currentImages.length >= this.maxImages) {
            this.triggerBtn.style.display = 'none';
        } else {
            this.triggerBtn.style.display = 'flex';
        }
    }

    getImages() {
        return this.currentImages;
    }
}

// 2. 打卡页面
async function initCheckinPage() {
    const user = getCurrentUser();
    if (!user) return; // checkLoginState 会处理跳转

    // 显示用户信息
    document.getElementById('userName').textContent = user.name;
    document.getElementById('logoutBtn').addEventListener('click', logout);

    // 显示日期
    const todayStr = getBJDateString();
    document.getElementById('currentDate').textContent = todayStr;

    // 获取并显示累计打卡天数
    try {
        const checkinCount = await getUserCheckinCount(user.userId);
        const checkinDaysEl = document.getElementById('checkinDays');
        if (checkinDaysEl) {
            checkinDaysEl.textContent = checkinCount;
        }
    } catch (error) {
        console.error('获取打卡天数失败:', error);
    }

    // 检查今日是否已打卡
    const existingCheckin = await checkTodayCheckin(user.userId, todayStr);
    
    if (existingCheckin) {
        window.location.replace('/checkin/success');
        return;
    }
    
    // 初始化两个上传区域
    const insightUploader = new ImageUploader('insightUploadBtn', 'insightInput', 'insightGrid');
    const confusionUploader = new ImageUploader('confusionUploadBtn', 'confusionInput', 'confusionGrid');

    const form = document.getElementById('checkinForm'); // 定义 form

    // 检查表单状态
    function checkFormCompletion() {
        const insightText = document.getElementById('insightText').value.trim();
        const confusionText = document.getElementById('confusionText').value.trim();
        const planText = document.getElementById('planText').value.trim();
        
        const insightImages = insightUploader.getImages().length;
        const confusionImages = confusionUploader.getImages().length;

        // 逻辑：所有三个部分都必须填写（文字或图片至少有一样）
        const isInsightDone = insightText || insightImages > 0;
        const isConfusionDone = confusionText || confusionImages > 0;
        const isPlanDone = planText.length > 0;

        const isComplete = isInsightDone && isConfusionDone && isPlanDone;
        
        const btn = document.getElementById('submitBtn');
        btn.disabled = !isComplete;
        if (!isComplete) {
            // btn.textContent = "发布打卡"; // 保持文案不变
            btn.style.backgroundColor = "var(--stroke)";
            btn.style.color = "var(--muted)";
        } else {
            // btn.textContent = "发布打卡";
            btn.style.backgroundColor = "var(--primary)";
            btn.style.color = "#000";
        }
    }

    // 监听输入变化
    document.getElementById('insightText').addEventListener('input', checkFormCompletion);
    document.getElementById('confusionText').addEventListener('input', checkFormCompletion);
    document.getElementById('planText').addEventListener('input', checkFormCompletion);
    
    // 监听图片变化 (需要 ImageUploader 回调支持)
    insightUploader.onUpdate = checkFormCompletion;
    confusionUploader.onUpdate = checkFormCompletion;

    // 初始化检查
    checkFormCompletion();
    
    // 表单提交
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const insightText = document.getElementById('insightText').value;
        const confusionText = document.getElementById('confusionText').value;
        const planText = document.getElementById('planText').value;
        
        const insightImages = insightUploader.getImages();
        const confusionImages = confusionUploader.getImages();
        
        // 验证：至少要填一项内容
        if (!insightText.trim() && !confusionText.trim() && !planText.trim() && insightImages.length === 0 && confusionImages.length === 0) {
            alert("请至少填写一项内容");
            return;
        }

        // 构建存储对象
        // answer 字段存储所有文字内容的 JSON
        const answerData = {
            insight: insightText,
            confusion: confusionText,
            plan: planText
        };

        // image_url 字段存储所有图片链接的 JSON
        const imageData = {
            insight: insightImages,
            confusion: confusionImages
        };

        // 显示加载状态
        const btn = document.getElementById('submitBtn');
        const originalText = btn.textContent;
        btn.textContent = "提交中...";
        btn.disabled = true;

        try {
            // 确保 ID 格式正确 (UUID)
            if (!user.userId) {
                 if (user.id) user.userId = user.id;
                 else {
                     alert("用户信息已过期，请重新登陆");
                     logout();
                     return;
                 }
            }

            console.log("Submitting checkin data:", {
                userId: user.userId,
                name: user.name,
                date: todayStr,
                answer: JSON.stringify(answerData),
                image: JSON.stringify(imageData)
            });

            const result = await submitCheckin(
                user.userId,
                user.name,
                user.phone,
                todayStr,
                JSON.stringify(answerData), // 存为 JSON 字符串
                JSON.stringify(imageData)   // 存为 JSON 字符串
            );

            console.log("Submission result:", result);

            if (result.success) {
                // 获取更新后的打卡天数
                const updatedCount = await getUserCheckinCount(user.userId);
                window.location.href = `success.html?new=true&days=${updatedCount}`;
            } else {
                throw new Error(result.error || "未知错误");
            }
        } catch (error) {
            console.error("提交失败:", error);
            alert("提交失败: " + error.message);
            btn.textContent = originalText;
            btn.disabled = false;
        }
    });
}

// 辅助函数：渲染打卡内容（用于 History 和 Admin）
function renderCheckinContent(answerStr, imageStr) {
    let html = '';
    let data = { insight: '', confusion: '', plan: '' };
    let images = { insight: [], confusion: [] };
    
    // 解析 Answer
    try {
        const parsed = JSON.parse(answerStr);
        if (parsed && typeof parsed === 'object') {
            data = parsed;
        } else {
            data.insight = answerStr; // 旧数据兼容
        }
    } catch (e) {
        data.insight = answerStr;
    }

    // 解析 Images
    try {
        const imgData = JSON.parse(imageStr);
        if (imgData && !Array.isArray(imgData) && typeof imgData === 'object') {
            images = imgData;
        } else if (Array.isArray(imgData)) {
             images.insight = imgData; // 旧数据兼容
        }
    } catch (e) {
        if (imageStr && typeof imageStr === 'string' && imageStr.includes('http')) {
             images.insight = imageStr.split(';');
        }
    }

    // 生成 HTML (Ins 风格：模块化，图文紧凑)
    
    // 1. 今日心得
    if (data.insight || (images.insight && images.insight.length > 0)) {
        html += `<div class="feed-section">
            <div class="section-label">✨ 今日心得</div>
            ${data.insight ? `<div class="section-text">${data.insight.replace(/\n/g, '<br>')}</div>` : ''}
            ${renderImageGrid(images.insight)}
        </div>`;
    }

    // 2. 学习困惑
    if (data.confusion || (images.confusion && images.confusion.length > 0)) {
        html += `<div class="feed-section">
            <div class="section-label">🤔 学习困惑</div>
            ${data.confusion ? `<div class="section-text">${data.confusion.replace(/\n/g, '<br>')}</div>` : ''}
            ${renderImageGrid(images.confusion)}
        </div>`;
    }

    // 3. 明日计划
    if (data.plan) {
        html += `<div class="feed-section">
            <div class="section-label">📅 明日计划</div>
            <div class="section-text">${data.plan.replace(/\n/g, '<br>')}</div>
        </div>`;
    }

    if (!html) html = `<div class="feed-content" style="color:#666;">暂无内容</div>`;

    return html;
}

function renderImageGrid(urls) {
    if (!urls || urls.length === 0) return '';
    
    // 无论图片多少，都保持小图紧凑的 Grid 布局，不搞全宽大图
    // 可以固定用 Grid-3 或根据数量微调，但核心是保持小尺寸
    let gridClass = 'grid-multi'; // 默认3列
    if (urls.length === 1) gridClass = 'grid-1'; // 1张图2列宽
    if (urls.length === 2) gridClass = 'grid-2'; // 2张图2列
    if (urls.length === 4) gridClass = 'grid-2'; // 4张图2列更整齐
    
    return `<div class="feed-images ${gridClass}">
        ${urls.map(url => `<img src="${url}" class="feed-img" loading="lazy" onclick="event.stopPropagation(); openLightbox(this.src)" style="cursor: zoom-in;">`).join('')}
    </div>`;
}

// 3. 管理员页面
async function initAdminPage() {
    const dateInput = document.getElementById('dateFilter');
    const searchInput = document.getElementById('searchUser');
    const listContainer = document.getElementById('checkinList');
    const countDisplay = document.getElementById('countDisplay');

    dateInput.value = getBJDateString();

    async function render() {
        const filterDate = dateInput.value;
        const filterText = searchInput.value.toLowerCase();
        const checkins = await getCheckinsByDate(filterDate);

        const filtered = checkins.filter(item => {
            const matchUser = (item.user_name || '').toLowerCase().includes(filterText) || 
                              (item.user_phone || '').includes(filterText);
            return matchUser;
        });

        countDisplay.textContent = filtered.length;

        if (filtered.length === 0) {
            listContainer.innerHTML = '<div class="pixel-card">暂无打卡记录</div>';
            return;
        }

        listContainer.innerHTML = filtered.map(item => {
            return `
            <div class="checkin-item">
                <div class="user-info">
                    <span>${item.user_name}</span>
                    <span>${item.user_phone}</span>
                </div>
                <div class="checkin-time">打卡时间: ${new Date(item.created_at).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}</div>
                ${renderCheckinContent(item.answer, item.image_url)}
            </div>`;
        }).join('');
    }

    dateInput.addEventListener('change', render);
    searchInput.addEventListener('input', render);
    render();
}

// 4. 打卡回顾墙 (History Page)
async function initHistoryPage() {
    const dateNav = document.getElementById('dateNav');
    const feedList = document.getElementById('feedList');
    const datePicker = document.getElementById('datePicker');
    
    // 获取今天的日期
    const todayStr = getBJDateString();
    
    let dates = await getAllTaskDates();

    if (!dates || dates.length === 0) {
        dates = [];
        const today = getBJDate();
        for (let i = 0; i < 14; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            dates.push(d.toISOString().split('T')[0]);
        }
    }
    
    // 确保今天的日期在列表中
    if (!dates.includes(todayStr)) {
        dates.unshift(todayStr);
    }
    
    // 找到今天日期的索引
    const todayIndex = dates.indexOf(todayStr);
    const defaultDate = todayIndex >= 0 ? todayStr : dates[0];
    
    dateNav.innerHTML = dates.map((date, index) => `
        <div class="date-pill ${date === defaultDate ? 'active' : ''}" onclick="loadHistory('${date}', this)">
            ${date.slice(5)}
        </div>
    `).join('');
    
    datePicker.value = defaultDate;
    
    datePicker.addEventListener('change', (e) => {
        loadHistory(e.target.value);
        document.querySelectorAll('.date-pill').forEach(p => p.classList.remove('active'));
        const matchingPill = Array.from(document.querySelectorAll('.date-pill')).find(p => p.textContent.trim() === e.target.value.slice(5));
        if (matchingPill) matchingPill.classList.add('active');
    });

    loadHistory(defaultDate);
    
    // 自动滚动到今天的日期胶囊
    setTimeout(() => {
        const activePill = document.querySelector('.date-pill.active');
        if (activePill) {
            activePill.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
    }, 100);
}

async function loadHistory(date, clickedEl) {
    const feedList = document.getElementById('feedList');
    
    if (clickedEl) {
        document.querySelectorAll('.date-pill').forEach(p => p.classList.remove('active'));
        clickedEl.classList.add('active');
        document.getElementById('datePicker').value = date;
    }
    
    feedList.innerHTML = '<div class="pixel-card">加载中...</div>';
    
    const checkins = await getCheckinsByDate(date);
    
    if (checkins.length === 0) {
        feedList.innerHTML = '<div class="pixel-card" style="text-align:center; padding:40px;">👻 该日期暂无打卡记录</div>';
        return;
    }
    
    // 保存数据供分享使用
    window.historyCheckinsMap = {};
    checkins.forEach(item => {
        window.historyCheckinsMap[item.id] = item;
    });

    feedList.innerHTML = checkins.map(item => {
        return `
        <div class="feed-card" data-checkin-id="${item.id}">
            <div class="feed-header">
                <span class="feed-user">${item.user_name || '学员'}</span>
                <span style="color:#666; font-size:12px;">${new Date(item.created_at).toLocaleTimeString('zh-CN', {hour:'2-digit', minute:'2-digit'})}</span>
            </div>
            ${renderCheckinContent(item.answer, item.image_url)}
            <div class="checkin-actions" style="display: flex; justify-content: space-between; align-items: center;">
                <button class="like-btn" id="like-checkin-${item.id}" data-target-type="checkin" data-target-id="${item.id}" onclick="toggleLike('checkin', '${item.id}')">
                    <span class="like-icon">👏</span>
                    <span class="like-count" id="like-count-checkin-${item.id}">0</span>
                </button>
                
                <button class="share-btn" onclick="shareCheckin('${item.id}')">
                    <span>📤</span> 分享长图
                </button>
            </div>
            <div class="comments-section" id="comments-${item.id}">
                <div class="comments-title">
                    💬 评论
                    <span class="comments-count" id="count-${item.id}">0</span>
                </div>
                <div class="comment-input-box">
                    <textarea class="comment-input" placeholder="说点什么..." rows="1" id="input-${item.id}"></textarea>
                    <button class="comment-submit-btn" onclick="submitComment('${item.id}')">发送</button>
                </div>
                <div class="comments-list" id="list-${item.id}">
                    <!-- 评论列表将在这里动态加载 -->
                </div>
            </div>
        </div>
        `;
    }).join('');
    
    // 加载所有打卡记录的点赞数据
    const checkinIds = checkins.map(item => item.id);
    await loadLikesForCheckins(checkinIds);
    
    // 加载所有打卡记录的评论
    for (const item of checkins) {
        await loadComments(item.id);
    }
    
    // 为所有输入框添加自动调整高度功能
    document.querySelectorAll('.comment-input').forEach(textarea => {
        textarea.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 120) + 'px';
        });
    });
}

/**
 * 评论相关功能
 */

// 加载评论列表
async function loadComments(checkinId) {
    const comments = await getComments(checkinId);
    const listContainer = document.getElementById(`list-${checkinId}`);
    const countElement = document.getElementById(`count-${checkinId}`);
    
    if (!listContainer) return;
    
    // 分离一级评论和二级评论
    const topLevelComments = comments.filter(c => !c.parent_id);
    const replies = comments.filter(c => c.parent_id);
    
    // 更新评论数量：一级评论 + 二级评论总数
    const totalCommentCount = topLevelComments.length + replies.length;
    if (totalCommentCount === 0) {
        countElement.textContent = '';
        countElement.style.display = 'none';
    } else {
        countElement.textContent = totalCommentCount;
        countElement.style.display = 'inline';
    }
    
    if (topLevelComments.length === 0) {
        listContainer.innerHTML = '<div style="text-align:center; color:var(--muted); font-size:13px; padding:20px;">暂无评论，来抢沙发吧~</div>';
        return;
    }
    
    // 渲染一级评论
    listContainer.innerHTML = topLevelComments.map(comment => {
        const commentReplies = replies.filter(r => r.parent_id === comment.id);
        return renderComment(comment, commentReplies);
    }).join('');
    
    // 加载所有评论的点赞数据
    const allCommentIds = comments.map(c => c.id);
    await loadLikesForComments(allCommentIds);
}

// 渲染单条评论（包括其回复）
function renderComment(comment, replies) {
    const timeStr = formatCommentTime(comment.created_at);
    const hasReplies = replies && replies.length > 0;
    const shouldCollapse = replies && replies.length > 3;
    
    // 如果需要折叠，只显示最新的2条
    const displayedReplies = shouldCollapse ? replies.slice(-2) : replies;
    const hiddenCount = shouldCollapse ? replies.length - 2 : 0;
    
    let repliesHtml = '';
    if (hasReplies) {
        repliesHtml = `
            <div class="replies-section" id="replies-${comment.id}">
                ${shouldCollapse ? `<button class="toggle-replies-btn" onclick="toggleReplies('${comment.id}', ${replies.length})">
                    <span id="toggle-text-${comment.id}">展开全部 ${replies.length} 条回复</span>
                </button>` : ''}
                <div class="replies-list" id="replies-list-${comment.id}">
                    ${displayedReplies.map(reply => renderReply(reply, comment.id)).join('')}
                </div>
                <div class="replies-hidden" id="replies-hidden-${comment.id}" style="display:none;">
                    ${shouldCollapse ? replies.slice(0, -2).map(reply => renderReply(reply, comment.id)).join('') : ''}
                </div>
            </div>
        `;
    }
    
    return `
        <div class="comment-item" data-comment-id="${comment.id}">
            <div class="comment-header">
                <span class="comment-author">${comment.user_name}</span>
                <span class="comment-time">${timeStr}</span>
            </div>
            <div class="comment-actions">
                <button class="like-btn small" id="like-comment-${comment.id}" data-target-type="comment" data-target-id="${comment.id}" onclick="toggleLike('comment', '${comment.id}')">
                    <span class="like-icon">👏</span>
                    <span class="like-count" id="like-count-comment-${comment.id}">0</span>
                </button>
                <button class="comment-reply-btn" onclick="showReplyInput('${comment.id}', '${comment.user_name}')">回复</button>
            </div>
            <div class="comment-content">${escapeHtml(comment.content)}</div>
            <div class="reply-input-box hidden" id="reply-box-${comment.id}">
                <textarea class="reply-input" placeholder="回复 ${comment.user_name}..." rows="1" id="reply-input-${comment.id}"></textarea>
                <button class="reply-submit-btn" onclick="submitReply('${comment.id}', '${comment.id}')">发送</button>
                <button class="reply-cancel-btn" onclick="hideReplyInput('${comment.id}')">取消</button>
            </div>
            ${repliesHtml}
        </div>
    `;
}

// 渲染回复（二级评论也可以被回复）
function renderReply(reply, parentCommentId) {
    const timeStr = formatCommentTime(reply.created_at);
    return `
        <div class="reply-item" data-reply-id="${reply.id}" data-parent-comment="${parentCommentId}">
            <div class="comment-header">
                <span class="comment-author">${reply.user_name}</span>
                <span class="comment-time">${timeStr}</span>
            </div>
            <div class="comment-actions">
                <button class="like-btn small" id="like-comment-${reply.id}" data-target-type="comment" data-target-id="${reply.id}" onclick="toggleLike('comment', '${reply.id}')">
                    <span class="like-icon">👏</span>
                    <span class="like-count" id="like-count-comment-${reply.id}">0</span>
                </button>
                <button class="comment-reply-btn" onclick="showReplyInput('${reply.id}', '${reply.user_name}', '${parentCommentId}')">回复</button>
            </div>
            <div class="comment-content">${escapeHtml(reply.content)}</div>
            <div class="reply-input-box hidden" id="reply-box-${reply.id}">
                <textarea class="reply-input" placeholder="回复 ${reply.user_name}..." rows="1" id="reply-input-${reply.id}"></textarea>
                <button class="reply-submit-btn" onclick="submitReply('${reply.id}', '${parentCommentId}')">发送</button>
                <button class="reply-cancel-btn" onclick="hideReplyInput('${reply.id}')">取消</button>
            </div>
        </div>
    `;
}

// 格式化评论时间
function formatCommentTime(timestamp) {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = Math.floor((now - time) / 1000); // 秒
    
    if (diff < 60) return '刚刚';
    if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}天前`;
    
    return time.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
}

// HTML转义（防XSS）
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML.replace(/\n/g, '<br>');
}

// 提交评论
async function submitComment(checkinId) {
    const user = getCurrentUser();
    if (!user) {
        alert('请先登录');
        return;
    }
    
    const input = document.getElementById(`input-${checkinId}`);
    const content = input.value.trim();
    
    if (!content) {
        alert('评论内容不能为空');
        return;
    }
    
    // 提交评论
    const result = await addComment(checkinId, user.userId, user.name, content, null);
    
    if (result.success) {
        input.value = '';
        input.style.height = 'auto';
        // 重新加载评论列表
        await loadComments(checkinId);
    } else {
        alert('评论失败：' + result.error);
    }
}

// 显示回复输入框
function showReplyInput(targetId, targetUserName = '', parentCommentId = null) {
    const replyBox = document.getElementById(`reply-box-${targetId}`);
    const replyInput = document.getElementById(`reply-input-${targetId}`);
    
    if (replyBox) {
        replyBox.classList.remove('hidden');
        replyInput.focus();
        
        // 添加自动调整高度
        replyInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 100) + 'px';
        });
    }
}

// 隐藏回复输入框
function hideReplyInput(targetId) {
    const replyBox = document.getElementById(`reply-box-${targetId}`);
    const replyInput = document.getElementById(`reply-input-${targetId}`);
    
    if (replyBox) {
        replyBox.classList.add('hidden');
        replyInput.value = '';
        replyInput.style.height = 'auto';
    }
}

// 提交回复
// targetId: 当前点击回复的评论ID（可能是一级或二级评论）
// parentCommentId: 一级评论的ID（用于确保所有回复都关联到一级评论）
async function submitReply(targetId, parentCommentId) {
    const user = getCurrentUser();
    if (!user) {
        alert('请先登录');
        return;
    }
    
    const replyInput = document.getElementById(`reply-input-${targetId}`);
    const content = replyInput.value.trim();
    
    if (!content) {
        alert('回复内容不能为空');
        return;
    }
    
    // 获取打卡ID
    // 先尝试从一级评论获取
    let commentItem = document.querySelector(`[data-comment-id="${parentCommentId}"]`);
    if (!commentItem) {
        // 如果找不到，说明可能是直接从reply调用的，尝试从reply元素获取
        const replyItem = document.querySelector(`[data-reply-id="${targetId}"]`);
        if (replyItem) {
            const realParentId = replyItem.dataset.parentComment;
            commentItem = document.querySelector(`[data-comment-id="${realParentId}"]`);
        }
    }
    
    if (!commentItem) {
        alert('无法找到评论所属的打卡记录');
        return;
    }
    
    const feedCard = commentItem.closest('.feed-card');
    const checkinId = feedCard.dataset.checkinId;
    
    // 提交回复，parent_id 始终是一级评论的ID
    const result = await addComment(checkinId, user.userId, user.name, content, parentCommentId);
    
    if (result.success) {
        hideReplyInput(targetId);
        // 重新加载评论列表
        await loadComments(checkinId);
    } else {
        alert('回复失败：' + result.error);
    }
}

// 展开/折叠回复
function toggleReplies(commentId, totalCount) {
    const repliesList = document.getElementById(`replies-list-${commentId}`);
    const repliesHidden = document.getElementById(`replies-hidden-${commentId}`);
    const toggleBtn = document.getElementById(`toggle-text-${commentId}`);
    
    if (!repliesList || !repliesHidden || !toggleBtn) return;
    
    const isExpanded = repliesHidden.style.display !== 'none';
    
    if (isExpanded) {
        // 折叠：只显示最新2条
        repliesHidden.style.display = 'none';
        toggleBtn.textContent = `展开全部 ${totalCount} 条回复`;
    } else {
        // 展开：显示所有回复
        repliesHidden.style.display = 'block';
        // 将隐藏的回复移到列表前面
        const hiddenContent = repliesHidden.innerHTML;
        repliesList.innerHTML = hiddenContent + repliesList.innerHTML;
        repliesHidden.innerHTML = '';
        toggleBtn.textContent = '收起';
    }
}

/**
 * 点赞功能
 */

// 切换点赞状态
async function toggleLike(targetType, targetId) {
    const user = getCurrentUser();
    if (!user) {
        alert('请先登录');
        return;
    }
    
    const likeBtn = document.getElementById(`like-${targetType}-${targetId}`);
    const likeCountEl = document.getElementById(`like-count-${targetType}-${targetId}`);
    
    if (!likeBtn || !likeCountEl) return;
    
    const isLiked = likeBtn.classList.contains('liked');
    
    let result;
    if (isLiked) {
        // 取消点赞
        result = await removeLike(targetType, targetId, user.userId);
    } else {
        // 添加点赞
        result = await addLike(targetType, targetId, user.userId, user.name);
    }
    
    if (result.success) {
        // 更新UI
        likeBtn.classList.toggle('liked');
        const currentCount = parseInt(likeCountEl.textContent) || 0;
        const newCount = isLiked ? currentCount - 1 : currentCount + 1;
        likeCountEl.textContent = newCount;
        
        // 如果数量为0，不显示
        if (newCount === 0) {
            likeCountEl.style.display = 'none';
        } else {
            likeCountEl.style.display = 'inline';
        }
    } else {
        if (result.error === 'already_liked') {
            // 已经点赞过了，更新UI状态
            likeBtn.classList.add('liked');
        } else {
            alert('操作失败：' + result.error);
        }
    }
}

// 加载打卡内容的点赞数据
async function loadLikesForCheckins(checkinIds) {
    if (!checkinIds || checkinIds.length === 0) return;
    
    const user = getCurrentUser();
    
    // 批量获取点赞数
    const likeCounts = await getLikesCounts('checkin', checkinIds);
    
    // 批量获取用户的点赞状态
    let userLikes = {};
    if (user) {
        userLikes = await checkUserLikes('checkin', checkinIds, user.userId);
    }
    
    // 更新UI
    checkinIds.forEach(id => {
        const likeCountEl = document.getElementById(`like-count-checkin-${id}`);
        const likeBtn = document.getElementById(`like-checkin-${id}`);
        
        if (likeCountEl) {
            const count = likeCounts[id] || 0;
            likeCountEl.textContent = count;
            likeCountEl.style.display = count > 0 ? 'inline' : 'none';
        }
        
        if (likeBtn && userLikes[id]) {
            likeBtn.classList.add('liked');
        }
    });
}

// 加载评论的点赞数据
async function loadLikesForComments(commentIds) {
    if (!commentIds || commentIds.length === 0) return;
    
    const user = getCurrentUser();
    
    // 批量获取点赞数
    const likeCounts = await getLikesCounts('comment', commentIds);
    
    // 批量获取用户的点赞状态
    let userLikes = {};
    if (user) {
        userLikes = await checkUserLikes('comment', commentIds, user.userId);
    }
    
    // 更新UI
    commentIds.forEach(id => {
        const likeCountEl = document.getElementById(`like-count-comment-${id}`);
        const likeBtn = document.getElementById(`like-comment-${id}`);
        
        if (likeCountEl) {
            const count = likeCounts[id] || 0;
            likeCountEl.textContent = count;
            likeCountEl.style.display = count > 0 ? 'inline' : 'none';
        }
        
        if (likeBtn && userLikes[id]) {
            likeBtn.classList.add('liked');
        }
    });
}

// 暴露到全局作用域
window.submitComment = submitComment;
window.submitReply = submitReply;
window.showReplyInput = showReplyInput;
window.hideReplyInput = hideReplyInput;
window.toggleReplies = toggleReplies;
window.toggleLike = toggleLike;

// 暴露给控制台使用的工具函数
window.generateUserTokens = function() { /* ... */ }
window.generateTokensForList = function(users) { /* ... */ }

/**
 * 分享生成长图功能
 */
async function shareCheckin(checkinId) {
    const item = window.historyCheckinsMap[checkinId];
    if (!item) return;

    // 1. 填充导出容器的数据
    document.getElementById('exportUsername').textContent = item.user_name || '学员';
    // 移除 Avatar 填充，因为已经没有这个元素了
    document.getElementById('exportTime').textContent = new Date(item.created_at).toLocaleString('zh-CN');

    // 2. 解析内容并填充
    const contentContainer = document.getElementById('exportContent');
    contentContainer.innerHTML = ''; // 清空

    let data = { insight: '', confusion: '', plan: '' };
    let images = { insight: [], confusion: [] };
    
    // 解析 Answer
    try {
        const parsed = JSON.parse(item.answer);
        if (parsed && typeof parsed === 'object') {
            data = parsed;
        } else {
            data.insight = item.answer; 
        }
    } catch (e) {
        data.insight = item.answer;
    }

    // 解析 Images
    try {
        const imgData = JSON.parse(item.image_url);
        if (imgData && !Array.isArray(imgData) && typeof imgData === 'object') {
            images = imgData;
        } else if (Array.isArray(imgData)) {
            images.insight = imgData;
        }
    } catch (e) {
        if (item.image_url && typeof item.image_url === 'string' && item.image_url.includes('http')) {
            images.insight = item.image_url.split(';');
        }
    }

    // 构建导出内容的 HTML
    let html = '';

    // Helper: 生成图片网格 HTML
    const getImagesHTML = (urls) => {
        if (!urls || urls.length === 0) return '';
        return `
            <div class="export-images">
                ${urls.map(url => `<img src="${url}" class="export-img" crossorigin="anonymous">`).join('')}
            </div>
        `;
    };

    if (data.insight || (images.insight && images.insight.length > 0)) {
        html += `
            <div class="export-section">
                <div class="export-section-title">洞察</div>
                <div class="export-text">${data.insight || ''}</div>
                ${getImagesHTML(images.insight)}
            </div>
        `;
    }

    if (data.confusion || (images.confusion && images.confusion.length > 0)) {
        html += `
            <div class="export-section">
                <div class="export-section-title">困惑</div>
                <div class="export-text">${data.confusion || ''}</div>
                ${getImagesHTML(images.confusion)}
            </div>
        `;
    }

    if (data.plan) {
        html += `
            <div class="export-section">
                <div class="export-section-title">计划</div>
                <div class="export-text">${data.plan || ''}</div>
            </div>
        `;
    }

    contentContainer.innerHTML = html;

    // 3. 生成图片
    const container = document.getElementById('export-container');
    
    // 显示 Loading 提示
    const btn = document.querySelector(`button[onclick="shareCheckin('${checkinId}')"]`);
    if (btn) {
        // 保存原始 HTML 以便恢复 (存入 data 属性防止多次点击覆盖)
        if (!btn.dataset.originalHtml) {
            btn.dataset.originalHtml = btn.innerHTML;
        }
        btn.innerHTML = '<span>⏳</span> 生成中...';
        btn.disabled = true;
    }

    try {
        // 等待所有图片加载完成
        const images = Array.from(container.querySelectorAll('img'));
        const imagePromises = images.map(img => {
            if (img.complete) return Promise.resolve();
            return new Promise(resolve => {
                img.onload = resolve;
                img.onerror = resolve; // 即使失败也继续
            });
        });
        
        // 设置一个超时，防止某张图一直加载不出来卡死
        const timeoutPromise = new Promise(resolve => setTimeout(resolve, 5000));
        
        await Promise.race([Promise.all(imagePromises), timeoutPromise]);
        
        // 额外缓冲一小段时间确保渲染稳定
        await new Promise(resolve => setTimeout(resolve, 100));

        const canvas = await html2canvas(container, {
            useCORS: true, // 允许跨域图片
            scale: 2, // 高清
            backgroundColor: '#000000',
            logging: true, // 开启日志方便调试
            allowTaint: true, // 允许跨域图片（注意：这会导致 toDataURL 失败，如果开启了 useCORS 就不需要这个，先去掉）
            // allowTaint: true, 
            onclone: (clonedDoc) => {
                // 可以在这里对克隆的 DOM 进行修改，例如显示某些隐藏元素
                const clonedContainer = clonedDoc.getElementById('export-container');
                if (clonedContainer) {
                    clonedContainer.style.display = 'block'; // 确保它是可见的（虽然我们在主页面是 visible 的，但位置在可视区域外）
                }
            }
        });

        const imgUrl = canvas.toDataURL('image/png');

        // 4. 显示模态框
        const modal = document.getElementById('imgModal');
        const imgContainer = document.getElementById('modalImgContainer');
        imgContainer.innerHTML = `<img src="${imgUrl}" class="generated-img" alt="Share Image">`;
        modal.classList.add('show');

    } catch (err) {
        console.error('生成图片失败:', err);
        alert('生成图片失败: ' + (err.message || '未知错误'));
    } finally {
        if (btn) {
            btn.innerHTML = btn.dataset.originalHtml || '<span>📤</span> 分享长图';
            btn.disabled = false;
        }
    }
}

function closeModal() {
    document.getElementById('imgModal').classList.remove('show');
}

/**
 * 图片浮层功能
 */
function openLightbox(imgSrc) {
    const lightbox = document.getElementById('imageLightbox');
    const lightboxImg = document.getElementById('lightboxImg');
    
    lightboxImg.src = imgSrc;
    lightbox.classList.add('show');
    
    // 阻止body滚动
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    const lightbox = document.getElementById('imageLightbox');
    lightbox.classList.remove('show');
    
    // 恢复body滚动
    document.body.style.overflow = '';
}

// 按 ESC 键关闭浮层
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeLightbox();
    }
});
