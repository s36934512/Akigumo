import os
import sys

# --- 設定區 ---
# 想要包含的檔案副檔名
EXTENSIONS = {'.py', '.ts', '.html', '.css', '.json', '.md'}
# 想要忽略的資料夾（避免把 node_modules 或 .git 塞進去）
IGNORE_DIRS = {'node_modules', '.git', '__pycache__', 'venv', 'dist', 'build'}
OUTPUT_FILE = 'project_summary.txt'


def merge_files(path='.'):
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as outfile:
        for root, dirs, files in os.walk(path):
            # 過濾掉不想進入的資料夾
            dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]

            for file in files:
                ext = os.path.splitext(file)[1]
                if ext in EXTENSIONS:
                    file_path = os.path.join(root, file)

                    # 寫入分隔標記，讓 Gemini 清楚界線
                    outfile.write(f"\n{'='*20}\n")
                    outfile.write(f"File: {file_path}\n")
                    outfile.write(f"{'='*20}\n\n")

                    try:
                        with open(file_path, 'r', encoding='utf-8') as infile:
                            outfile.write(infile.read())
                            outfile.write("\n")
                    except Exception as e:
                        outfile.write(f"Error reading file: {e}\n")

    print(f"✅ 合併完成！檔案已儲存為：{OUTPUT_FILE}")


if __name__ == "__main__":
    path = sys.argv[1]
    merge_files(path)
