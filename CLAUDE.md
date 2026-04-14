# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MarkFlow 是一个轻量级 Markdown 编辑器，纯前端项目，无构建步骤，所有依赖通过 CDN 加载。

## Development

**无构建系统** — 直接用浏览器打开 `index.html` 或任意本地 HTTP 服务器即可运行。无 package.json、无 npm、无 bundler。

无测试、无 lint 配置。验证方式是浏览器手动测试。

## Architecture

单页应用，三个核心文件：

- `index.html` — 页面结构、CDN 依赖引入、设置面板
- `scripts/main.js` — 全部业务逻辑（~850 行）
- `styles/style.css` — 自定义样式（Tailwind 处理不了的部分）

### CDN 依赖

| 库 | 用途 |
|---|---|
| Tailwind CSS 3 | 工具类样式 |
| Marked.js 4.3.0 | Markdown → HTML |
| DOMPurify 3.0.6 | HTML 净化防 XSS |
| html2canvas 1.4.1 | 导出 PNG 图片 |
| highlight.js 11.9.0 | 代码块语法高亮 |
| Font Awesome 6.0.0 | 图标 |

### main.js 模块划分

文件内按功能分区，无模块系统，全部在全局作用域：

- **编辑器初始化** — `initEditorContent()`，首次加载 README.md，之后从 localStorage 恢复
- **实时预览** — `renderPreview()` 调用 marked.parse + DOMPurify.sanitize
- **文件操作** — 拖拽导入 .md、保存下载 .md（`saveMdBtn`）
- **导出** — PDF（`window.print()`）、PNG（html2canvas + `createImageWrapper()`）
- **设置管理** — 图片导出设置，localStorage 持久化（key: `image-settings`）
- **编辑器工具栏** — `insertMarkdown()` + `MARKDOWN_TEMPLATES` 模板对象
- **快捷键** — `KEYBOARD_SHORTCUTS` 映射表（Ctrl+B/I/K/H）
- **选中同步** — 编辑器选中文本在预览区高亮，使用 Levenshtein 距离匹配
- **滚动同步** — 编辑器和预览区按比例同步滚动
- **深色模式** — `initDarkMode()` / `toggleDarkMode()`，跟随系统偏好
- **字数统计** — `updateWordCount()`，中英文分别计数 + 阅读时间估算

### localStorage keys

| Key | 内容 |
|---|---|
| `markdown-content` | 编辑器内容自动保存 |
| `image-settings` | 图片导出配置（背景色、边框、水印） |
| `darkMode` | 深色模式状态 |

### 文件命名约定

所有导出文件名通过 `getDocTitle(fallback)` 从正文第一个标题（`# ~ ######`）提取，无标题时使用 fallback。

## Key Conventions

- UI 语言全部为中文
- 按钮分两组：左侧编辑器工具栏（格式化 + 文件操作），右侧预览区工具栏（导出 + 设置）
- `input` 事件中 `renderPreview` 和 `updateLineNumbers` 同步执行，`saveContent` 和 `updateWordCount` 使用 debounce
- 自定义高亮语法：`===text===` 渲染为 `<mark>`
