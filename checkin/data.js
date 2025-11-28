// 模拟后端数据存储 (Mock Data)
// 在实际生产环境中，这部分应该被 API 调用取代

// 1. 用户名单 (稍后由你提供)
// 结构: phone -> { name, token }
// 为了演示，我先放入一些测试数据
const MOCK_USERS = [
    { phone: "13800138000", name: "张三", token: "ABC12345" },
    { phone: "13900139000", name: "李四", token: "XYZ98765" },
    { phone: "15626179745", name: "测试学员", token: "111111" }
];

// 2. 每日题目配置 (日期 -> 题目)
// 日期格式: YYYY-MM-DD
const MOCK_QUESTIONS = {
    "2023-10-27": "请分享你今天最想感谢的一件事。",
    "2023-10-28": "拍一张你今天工作的书桌。",
    "2025-11-26": "测试题目：今天你学习AI的感受是什么？(如果今天是11月26日)",
    // 默认题目 (防止未配置)
    "default": "今日暂无特定题目，请分享你的学习心得。"
};

// 3. 模拟的打卡记录存储 (在浏览器中使用 localStorage 模拟数据库)
// 结构: Array of { phone, date, answer, image, timestamp }
const STORAGE_KEY_CHECKINS = "ai798_checkins_db";

// 辅助函数：获取模拟的数据库
function getMockDB() {
    const data = localStorage.getItem(STORAGE_KEY_CHECKINS);
    return data ? JSON.parse(data) : [];
}

// 辅助函数：写入模拟数据库
function saveToMockDB(record) {
    const db = getMockDB();
    // 简单的去重逻辑：同一人同一天只能打卡一次 (或者覆盖)
    // 这里我们允许覆盖
    const existingIndex = db.findIndex(item => item.phone === record.phone && item.date === record.date);
    
    if (existingIndex >= 0) {
        db[existingIndex] = record;
    } else {
        db.push(record);
    }
    
    localStorage.setItem(STORAGE_KEY_CHECKINS, JSON.stringify(db));
    return true;
}

