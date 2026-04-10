# Claude Code Skill 开发指南

> 基于 ui-ux-pro-max-skill 项目实战经验总结

## 目录

- [1. 什么是 Skill](#1-什么是-skill)
- [2. 项目结构](#2-项目结构)
- [3. 核心文件详解](#3-核心文件详解)
- [4. 开发流程](#4-开发流程)
- [5. 实战案例](#5-实战案例)
- [6. 最佳实践](#6-最佳实践)
- [7. 多平台支持](#7-多平台支持)

---

## 1. 什么是 Skill

**Skill** 是 Claude Code 的扩展机制，类似于插件或命令，通过斜杠命令（如 `/commit`、`/review-pr`）调用，提供专门的领域知识和能力。

### 1.1 Skill 的特点

- **声明式定义**: 通过 YAML frontmatter 定义元数据
- **自动发现**: Claude Code 扫描 `.claude/skills/` 目录自动加载
- **关键词触发**: 根据 `name` 和 `description` 匹配用户请求
- **可编程**: 支持脚本、数据文件等资源
- **工作流驱动**: 通过 Markdown 指引 AI 执行复杂任务

### 1.2 Skill vs 普通脚本

| 特性 | Skill | 普通脚本 |
|------|-------|---------|
| 发现机制 | 自动扫描 | 手动调用 |
| 参数解析 | AI 理解用户意图 | 命令行参数 |
| 上下文感知 | 了解对话历史 | 无状态 |
| 执行方式 | AI 调用 + 脚本辅助 | 直接执行 |

---

## 2. 项目结构

### 2.1 标准 Skill 目录结构

```
.claude/
└── skills/
    └── your-skill-name/        # skill 目录（与 name 字段一致）
        ├── SKILL.md            # 核心：技能定义文件
        ├── scripts/            # 可选：辅助脚本
        │   ├── core.py         # 核心逻辑
        │   └── cli.py          # CLI 入口
        └── data/               # 可选：数据文件
            ├── database.csv
            └── config.json
```

### 2.2 完整项目结构（推荐）

```
your-skill-project/
├── .claude/                    # Claude Code skill 目录
│   └── skills/
│       └── your-skill/
│
├── .cursor/                    # Cursor AI 配置（可选）
│   └── commands/
│       └── your-skill.md
│
├── .windsurf/                  # Windsurf AI 配置（可选）
│   └── workflows/
│       └── your-skill.md
│
├── .shared/                    # 共享资源（可选）
│   └── your-skill/
│       ├── scripts/
│       └── data/
│
├── cli/                        # NPM CLI 工具（可选）
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       └── index.ts
│
├── README.md                   # 项目文档
└── LICENSE                     # 许可证
```

---

## 3. 核心文件详解

### 3.1 SKILL.md - 技能定义文件

这是**最重要**的文件，定义了 skill 的全部行为。

#### 3.1.1 YAML Frontmatter（必需）

```yaml
---
name: your-skill-name          # skill 标识符，必须与目录名一致
description: "简短描述，包含触发关键词：关键词1、关键词2、关键词3"
---
```

**关键要点**：
- `name`: 唯一标识符，建议使用 kebab-case（如 `ui-ux-pro-max`）
- `description`: 触发关键词的集合，覆盖动词、名词、行业术语
- 必须是有效的 YAML 格式

#### 3.1.2 Markdown 内容

```markdown
# Skill 标题

详细描述 skill 的功能和价值...

## Prerequisites

使用前需要的环境准备，例如：
- 已安装 Python 3.8+
- 已配置 API 密钥

## How to Use This Skill

### 步骤 1：准备工作
具体指令...

### 步骤 2：执行搜索
运行命令：
\`\`\`bash
python3 .claude/skills/your-skill/scripts/search.py "查询内容"
\`\`\`

### 步骤 3：处理结果
根据返回结果...

## Command Reference

| 命令 | 说明 | 示例 |
|------|------|------|
| `--domain` | 指定搜索域 | `--domain style` |
| `--max-results` | 返回结果数量 | `--max-results 5` |

## Best Practices

检查清单和最佳实践...
```

### 3.2 脚本文件（可选）

#### 3.2.1 Python 示例（推荐用于数据处理）

```python
# scripts/search.py
import argparse
import csv
from pathlib import Path

def search(query: str, max_results: int = 3):
    """执行搜索逻辑"""
    results = []
    # ... 实现搜索
    return results

def main():
    parser = argparse.ArgumentParser(description="搜索工具")
    parser.add_argument("query", help="搜索查询")
    parser.add_argument("-n", "--max-results", type=int, default=3)

    args = parser.parse_args()
    results = search(args.query, args.max_results)

    for r in results:
        print(r)

if __name__ == "__main__":
    main()
```

**优势**：
- 无外部依赖（仅标准库）
- 跨平台兼容
- 易于维护

#### 3.2.2 TypeScript/Node.js 示例（推荐用于 CLI 工具）

```typescript
// cli/src/index.ts
import { Command } from 'commander';
import chalk from 'chalk';

const program = new Command();

program
  .name('my-skill')
  .description('My skill CLI tool')
  .version('1.0.0');

program
  .command('search <query>')
  .description('搜索数据库')
  .option('-n, --number <num>', '结果数量', '3')
  .action((query, options) => {
    console.log(chalk.blue(`搜索: ${query}`));
    // ... 执行搜索
  });

program.parse();
```

### 3.3 数据文件（可选）

#### 3.3.1 CSV 格式（推荐）

```csv
ID,Name,Category,Keywords,Description
1,Item 1,Category A,"keyword1, keyword2",详细描述...
2,Item 2,Category B,"keyword3, keyword4",详细描述...
```

**设计原则**：
- 第一列：ID 或序号
- 搜索列：Keywords, Category, Tags
- 输出列：精选的重要信息
- 元数据：Notes, URL, Source

#### 3.3.2 JSON 格式（适用于复杂结构）

```json
{
  "items": [
    {
      "id": 1,
      "name": "Item 1",
      "tags": ["keyword1", "keyword2"],
      "metadata": {
        "source": "...",
        "url": "..."
      }
    }
  ]
}
```

---

## 4. 开发流程

### 4.1 第一步：确定 Skill 范围

**关键问题**：
1. 这个 skill 解决什么问题？
2. 用户会如何触发它？（关键词）
3. 需要什么数据和逻辑？

**示例：office-doc-reader-skill**
- 问题：Claude Code 无法读取 Word/PPT/Excel
- 触发词："read word", "parse ppt", "extract excel"
- 逻辑：调用第三方库解析文档并转换为 Markdown

### 4.2 第二步：创建目录结构

```bash
# 在你的项目根目录
mkdir -p .claude/skills/office-doc-reader/{scripts,data}
```

### 4.3 第三步：编写 SKILL.md

```markdown
---
name: office-doc-reader
description: "Read and parse Microsoft Office documents: Word (.docx), PowerPoint (.pptx), Excel (.xlsx). Extract text, tables, and formatting."
---

# Office Document Reader

读取和解析 Microsoft Office 文档...

## Prerequisites

Python 3.8+ with following packages:
\`\`\`bash
pip install pandas openpyxl python-pptx python-docx
\`\`\`

## How to Use This Skill

### 读取 Word 文档
\`\`\`bash
python3 .claude/skills/office-doc-reader/scripts/read_word.py "path/to/document.docx"
\`\`\`

### 读取 PowerPoint
\`\`\`bash
python3 .claude/skills/office-doc-reader/scripts/read_pptx.py "path/to/presentation.pptx"
\`\`\`

### 读取 Excel
\`\`\`bash
python3 .claude/skills/office-doc-reader/scripts/read_excel.py "path/to/spreadsheet.xlsx"
\`\`\`
```

### 4.4 第四步：实现脚本

```python
# scripts/read_word.py
import sys
from docx import Document

def read_word(path: str):
    doc = Document(path)
    content = []

    for para in doc.paragraphs:
        if para.text.strip():
            content.append(para.text)

    # 处理表格
    for table in doc.tables:
        for row in table.rows:
            row_text = " | ".join([cell.text for cell in row.cells])
            content.append(f"| {row_text} |")

    return "\n\n".join(content)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python read_word.py <path>")
        sys.exit(1)

    result = read_word(sys.argv[1])
    print(result)
```

### 4.5 第五步：测试 Skill

1. **触发测试**：在 Claude Code 中发送消息
   ```
   请读取这个 Word 文档：path/to/document.docx
   ```

2. **验证 AI 调用**：检查是否加载了 SKILL.md

3. **检查脚本输出**：确认脚本正常工作

### 4.6 第六步：优化和文档

- 添加错误处理
- 编写 README.md
- 提供使用示例
- 考虑多平台支持（Cursor、Windsurf 等）

---

## 5. 实战案例

### 5.1 案例：UI/UX Pro Max Skill

**问题**：AI 缺乏 UI/UX 设计专业知识

**解决方案**：
1. 收集 900+ 条设计指南
2. 使用 CSV 结构化存储
3. 实现 BM25 搜索算法
4. 编写详细工作流程

**核心代码**：
```python
# BM25 搜索算法实现
class BM25:
    def __init__(self, corpus, k1=1.5, b=0.75):
        self.k1 = k1
        self.b = b
        self.corpus = corpus
        self.corpus_size = len(corpus)
        self.avgdl = sum(len(doc) for doc in corpus) / self.corpus_size
        self._initialize()

    def score(self, query):
        scores = []
        for i, doc in enumerate(self.corpus):
            score = 0
            for term in query:
                if term in self.doc_freqs[i]:
                    idf = self.idf[term]
                    tf = self.doc_freqs[i][term]
                    score += idf * (tf * (self.k1 + 1)) / (tf + self.k1 * (1 - self.b + self.b * len(doc) / self.avgdl))
            scores.append((score, i))
        return sorted(scores, reverse=True)
```

**数据结构**：
```csv
No,Style Category,Type,Keywords,Primary Colors,Effects & Animation,Best For,Description
1,Minimalism,General,"clean, simple, spacious",Monochromatic,Subtle hover,Enterprise apps,"Minimalism focuses on..."
```

### 5.2 案例：Office Doc Reader Skill（待开发）

**目标**：让 Claude Code 能读取 Word/PPT/Excel

**技术方案**：
- Word: `python-docx` 库
- PowerPoint: `python-pptx` 库
- Excel: `pandas` + `openpyxl` 库

**预期效果**：
```markdown
# 读取 Word
用户：读取 report.docx
AI：
[调用脚本]
文档内容：
# Report Summary

## 数据分析
| 指标 | 数值 |
|------|------|
| 增长率 | 25% |
```

---

## 6. 最佳实践

### 6.1 Skill 设计原则

#### 6.1.1 明确的关键词

**好的描述**：
```yaml
description: "UI/UX design intelligence: 50 styles, 21 palettes, 56 typography pairs, 24 chart types. Landing pages, dashboards, mobile apps, SaaS, dashboard components. Material Design, Ant Design, Chakra UI."
```

**坏的描述**：
```yaml
description: "A design tool"  # 太模糊，难以触发
```

#### 6.1.2 清晰的工作流程

✅ **好的工作流程**：
```markdown
## How to Use This Skill

### Step 1: Identify Requirements
分析用户需求，提取关键信息...

### Step 2: Search for Style
运行命令：
\`\`\`bash
python3 search.py "minimal elegant" --domain style
\`\`\

### Step 3: Search for Colors
运行命令：
\`\`\`bash
python3 search.py "dark blue" --domain color
\`\`\

### Step 4: Generate Code
基于搜索结果生成代码...
```

❌ **坏的工作流程**：
```markdown
## Usage

使用本技能可以帮助你设计...
```
（太模糊，AI 不知道具体步骤）

#### 6.1.3 可执行的脚本

**推荐**：
- Python 标准库（无外部依赖）
- 清晰的 CLI 接口
- JSON/CSV 输出格式

**示例**：
```python
def search(query: str, domain: str = None) -> dict:
    """返回结构化数据"""
    return {
        "domain": domain,
        "query": query,
        "results": [
            {"id": 1, "name": "...", "score": 0.95},
            {"id": 2, "name": "...", "score": 0.87}
        ]
    }
```

### 6.2 数据管理

#### 6.2.1 CSV 设计原则

```csv
ID,Name,Category,Keywords,Description,Tags,Metadata
1,Item 1,CatA,"kw1, kw2",描述内容,"tag1,tag2",额外信息
```

- **搜索列**：Keywords, Category, Tags
- **输出列**：Name, Description
- **元数据列**：URL, Source, Date

#### 6.2.2 数据更新策略

**方案 1：手动更新**
- 直接编辑 CSV 文件
- 适合小规模数据

**方案 2：脚本更新**
- 编写 update.py 脚本
- 从 API 或数据库导入

**方案 3：CLI 工具**
```bash
my-skill update --source https://api.example.com/data
```

### 6.3 性能优化

#### 6.3.1 搜索优化

**BM25 参数调优**：
```python
# 适用于短文档
bm25 = BM25(corpus, k1=1.2, b=0.75)

# 适用于长文档
bm25 = BM25(corpus, k1=2.0, b=0.9)
```

**缓存策略**：
```python
import json
from pathlib import Path

cache_file = Path(".cache/search_results.json")

def search_with_cache(query):
    if cache_file.exists():
        cache = json.loads(cache_file.read_text())
        if query in cache:
            return cache[query]

    results = search(query)

    # 更新缓存
    cache[query] = results
    cache_file.write_text(json.dumps(cache))

    return results
```

#### 6.3.2 并行处理

```python
from concurrent.futures import ThreadPoolExecutor

def search_multiple_domains(query):
    domains = ["style", "color", "typography"]

    with ThreadPoolExecutor(max_workers=3) as executor:
        results = list(executor.map(
            lambda d: search(query, domain=d),
            domains
        ))

    return results
```

---

## 7. 多平台支持

### 7.1 支持的平台

| 平台 | 目录 | 说明 |
|------|------|------|
| Claude Code | `.claude/skills/` | 主要平台 |
| Cursor | `.cursor/commands/` | AI 编辑器 |
| Windsurf | `.windsurf/workflows/` | AI IDE |
| Antigravity | `.agent/workflows/` | AI 助手 |
| GitHub Copilot | `.github/prompts/` | 代码补全 |
| Kiro | `.kiro/steering/` | AI 编程 |

### 7.2 目录映射策略

```typescript
const AI_FOLDERS = {
  claude: ['.claude'],
  cursor: ['.cursor', '.shared'],
  windsurf: ['.windsurf', '.shared'],
  antigravity: ['.agent', '.shared'],
  copilot: ['.github', '.shared'],
  kiro: ['.kiro', '.shared'],
};
```

**共享资源结构**：
```
.shared/
└── your-skill/
    ├── scripts/      # 所有平台共享的脚本
    │   └── core.py
    └── data/         # 所有平台共享的数据
        └── database.csv
```

**各平台引用**：
```markdown
<!-- .claude/skills/your-skill/SKILL.md -->
## Usage
运行命令：
\`\`\`bash
python3 ../../.shared/your-skill/scripts/core.py
\`\`\
```

### 7.3 统一配置文件

**配置文件**: `config.json`
```json
{
  "skillName": "your-skill",
  "version": "1.0.0",
  "supportedPlatforms": ["claude", "cursor", "windsurf"],
  "sharedPath": ".shared/your-skill"
}
```

**安装脚本**: `install.py`
```python
import json
import shutil
from pathlib import Path

config = json.loads(Path("config.json").read_text())

for platform in config["supportedPlatforms"]:
    target = Path(f".{platform}/skills/{config['skillName']}")
    if target.exists():
        shutil.rmtree(target)
    shutil.copytree(config["sharedPath"], target)
    print(f"✓ Installed for {platform}")
```

---

## 8. 常见问题

### Q1: Skill 没有被触发？

**可能原因**：
1. `description` 中没有包含用户使用的关键词
2. SKILL.md 文件格式错误
3. 目录名与 `name` 字段不一致

**解决方法**：
```yaml
---
name: my-skill                    # 必须与目录名一致
description: "包含所有可能的关键词：关键词1、关键词2、动词关键词、名词关键词"
---
```

### Q2: 脚本无法执行？

**检查清单**：
1. Python 脚本是否有可执行权限？
   ```bash
   chmod +x scripts/search.py
   ```
2. 脚本路径是否正确？
3. 依赖是否安装？
   ```bash
   pip install -r requirements.txt
   ```

### Q3: 如何调试 Skill？

**方法 1：添加日志**
```python
import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

logger.debug(f"搜索查询: {query}")
```

**方法 2：输出 JSON 格式**
```python
import json

result = {"status": "success", "data": [...]}
print(json.dumps(result, indent=2, ensure_ascii=False))
```

**方法 3：使用 `-v` 参数**
```python
parser.add_argument("-v", "--verbose", action="store_true")

if args.verbose:
    print(f"调试信息: {debug_data}")
```

---

## 9. 进阶技巧

### 9.1 集成外部 API

```python
import requests

def search_with_api(query: str):
    response = requests.get(
        "https://api.example.com/search",
        params={"q": query},
        headers={"Authorization": "Bearer YOUR_API_KEY"}
    )
    return response.json()
```

### 9.2 使用数据库

```python
import sqlite3

def init_db():
    conn = sqlite3.connect("data/database.db")
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS items (
            id INTEGER PRIMARY KEY,
            name TEXT,
            keywords TEXT,
            description TEXT
        )
    """)
    conn.commit()

def search_db(query: str):
    conn = sqlite3.connect("data/database.db")
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM items WHERE keywords LIKE ?",
        (f"%{query}%",)
    )
    return cursor.fetchall()
```

### 9.3 机器学习集成

```python
from sentence_transformers import SentenceTransformer
import numpy as np

model = SentenceTransformer('all-MiniLM-L6-v2')

def semantic_search(query: str, documents: list):
    query_embedding = model.encode(query)
    doc_embeddings = model.encode(documents)

    similarities = np.dot(query_embedding, doc_embeddings.T)
    top_indices = np.argsort(similarities)[::-1][:5]

    return [documents[i] for i in top_indices]
```

---

## 10. 参考资源

### 10.1 官方文档
- Claude Code Skills: https://docs.anthropic.com/claude-code/skills
- Python Documentation: https://docs.python.org/3/

### 10.2 推荐库
- **数据处理**: pandas, numpy
- **文档解析**: python-docx, python-pptx, openpyxl
- **搜索引擎**: rank-bm25, sentence-transformers
- **CLI 工具**: argparse, click, typer

### 10.3 开源项目
- ui-ux-pro-max-skill: https://github.com/your-org/ui-ux-pro-max-skill
- claude-code-skills: https://github.com/your-org/claudecode-skills

---

## 附录：快速检查清单

### Skill 发布前检查

- [ ] SKILL.md 格式正确（YAML + Markdown）
- [ ] `name` 字段与目录名一致
- [ ] `description` 包含所有触发关键词
- [ ] 脚本无语法错误
- [ ] 脚本有清晰的 CLI 接口
- [ ] 数据文件格式正确
- [ ] 提供使用示例
- [ ] 编写 README.md
- [ ] 测试多平台兼容性（如需要）
- [ ] 添加 LICENSE 文件

---

**文档版本**: v1.0.0
**最后更新**: 2025-02-02
**作者**: 基于 ui-ux-pro-max-skill 项目实战经验
