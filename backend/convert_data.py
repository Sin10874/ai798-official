import pandas as pd
import os
import datetime

# 路径配置
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, '14day_train')
OUTPUT_FILE = os.path.join(BASE_DIR, 'backend', 'seed.sql')

def generate_sql():
    sql_statements = []
    
    # 1. 处理用户名单
    users_file = os.path.join(DATA_DIR, '名单.xlsx')
    if os.path.exists(users_file):
        print(f"正在处理: {users_file}")
        try:
            df_users = pd.read_excel(users_file)
            # 假设 Excel 列名为 '姓名', '手机号'
            # 如果没有口令列，我们自动生成
            for index, row in df_users.iterrows():
                name = str(row.iloc[0]).strip() # 假设第一列是姓名
                phone = str(row.iloc[1]).strip() # 假设第二列是手机号
                
                # 简单生成口令 (如果是真实数据，建议手动指定或更复杂生成)
                token = "111111" # 默认口令，或者随机生成
                
                sql = f"INSERT INTO public.users (name, phone, token) VALUES ('{name}', '{phone}', '{token}') ON CONFLICT (phone) DO NOTHING;"
                sql_statements.append(sql)
        except Exception as e:
            print(f"读取名单失败: {e}")
    else:
        print(f"未找到文件: {users_file}")

    # 2. 处理打卡任务
    tasks_file = os.path.join(DATA_DIR, '打卡任务.xlsx')
    if os.path.exists(tasks_file):
        print(f"正在处理: {tasks_file}")
        try:
            df_tasks = pd.read_excel(tasks_file)
            # 假设 Excel 列名为 '日期', '题目'
            for index, row in df_tasks.iterrows():
                date_val = row.iloc[0] # 假设第一列是日期
                content = str(row.iloc[1]).strip().replace("'", "''") # 假设第二列是内容，处理单引号转义
                
                # 格式化日期
                if isinstance(date_val, datetime.datetime):
                    date_str = date_val.strftime('%Y-%m-%d')
                else:
                    date_str = str(date_val).split(' ')[0] # 尝试简单处理

                sql = f"INSERT INTO public.questions (date, content) VALUES ('{date_str}', '{content}') ON CONFLICT (date) DO UPDATE SET content = EXCLUDED.content;"
                sql_statements.append(sql)
        except Exception as e:
            print(f"读取任务失败: {e}")
    else:
        print(f"未找到文件: {tasks_file}")

    # 写入 SQL 文件
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write('\n'.join(sql_statements))
    
    print(f"成功生成 SQL 文件: {OUTPUT_FILE}")
    print("请复制该文件内容到 Supabase SQL Editor 中执行。")

if __name__ == "__main__":
    generate_sql()

