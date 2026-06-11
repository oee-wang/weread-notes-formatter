# 微信读书笔记整形工具 / WeChat Reading Notes Formatter

> 📌 本工具的整理方法来自 bilibili up 主 **O鲨鱼Oo**。

一个 Node.js 命令行工具，能把从微信读书导出的杂乱笔记，自动整理成结构清晰的 Word 文档。
*A Node.js command-line tool that turns messy WeChat Reading note exports into clean, structured Word documents.*

---

## 🎯 解决的问题

从微信读书导出笔记时，划线摘录、个人想法、日期标记全部混在一起，没有任何结构，手动整理非常费时：

```
* 2026/05/03 发表想法
神奇

原文：演唱会是如此重要，很多女孩不但坚持要自己亲自到场……

* 这是一种非常不可思议的感觉。
```

---

## ✨ 功能

- **章节标题**：自动识别并设为加粗标题
- **划线摘录**：转换为干净的项目符号列表
- **个人想法**：以灰色括号附加在对应摘录的末尾

### 输出效果

> **第一部分 爱的启程：饭圈萌新历险记**
> - 演唱会是如此重要，很多女孩不但坚持要自己亲自到场……（神奇）
> - 这是一种非常不可思议的感觉。

---

## 🚀 使用方法

**1. 安装依赖**

```bash
npm install
```

**2. 运行**

```bash
node format_notes_v2.js <输入文件> <输出文件>
```

示例：

```bash
# 从 Word 文件
node format_notes_v2.js my_notes.docx output.docx

# 从文本文件
node format_notes_v2.js my_notes.txt output.docx
```

工具会根据文件扩展名（`.docx` / `.txt`）自动判断读取方式。

---

## 🛠 使用技术

- **Node.js** — 运行环境
- **[mammoth](https://www.npmjs.com/package/mammoth)** — 读取 Word 文件内容
- **[docx](https://www.npmjs.com/package/docx)** — 生成 Word 文档
- **正则表达式** — 解析并分类笔记内容

---

## 📄 License

MIT

---

## 日本語について

Node.js 製のコマンドラインツールです。中国の電子書籍プラットフォーム「微信読書（WeChat Reading）」からエクスポートしたノートは、ハイライト抜粋・個人の感想・日付タグがすべて混在しており、手作業での整理に手間がかかります。本ツールはこの乱雑なテキストを解析し、章タイトル・抜粋・感想を整理した Word ドキュメントに自動変換します。

入力ファイルの拡張子（`.docx` / `.txt`）に応じて読み込み方式を自動的に切り替えます。使い方は上記の「使用方法」をご参照ください。

> 本ツールの整形ロジックは、bilibili のクリエイター **O鲨鱼Oo** の方法を参考にしています。
