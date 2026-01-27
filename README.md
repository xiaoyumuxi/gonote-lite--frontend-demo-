<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# GoNote Lite (Frontend Demo)

一个轻量级、Notion 风格的 Markdown 笔记应用前端演示。支持多人协作模拟、富文本编辑以及可配置的 AI 辅助功能。

## ✅ 已完成功能 (Completed Features)

### 1. 核心笔记功能 (Core Note Taking)
*   **多视图编辑器**: 支持 **编辑模式**、**预览模式** 和 **分屏模式** (Split View)。
*   **Markdown 支持**: 基础格式（加粗/斜体/标题）、待办事项列表、代码块高亮。
*   **富文本操作**: 支持文本变色、背景高亮、引用文本。
*   **笔记管理**: 创建/删除笔记、文件夹分类、全文搜索。

### 2. 协作与社交 (Collaboration & Social)
*   **@提及功能**: 输入 `@` 触发用户列表。
*   **评论系统**: 选中/右键文本添加评论，支持侧边栏回复。
*   **分享功能**: 模拟生成只读/编辑权限的分享链接。

### 3. AI 智能增强 (AI Features)
*   **内容润色 (AI Polish)**: 使用 AI 优化笔记的语法和语气。
*   **多模型兼容**: 兼容任何 OpenAI 格式的 API（如 **阿里云通义千问**、DeepSeek、OpenAI 等）。

### 4. 界面与交互 (UI/UX)
*   **Notion 风格**: 极简侧边栏、面包屑导航。
*   **响应式设计**: 完美支持移动端。
*   **模拟用户系统**: 登录界面演示及本地状态持久化。

---

## 🚀 快速开始 (Getting Started)

### 1. 安装依赖

```bash
npm install
```

### 2. 配置 AI 服务 (可选)

本项目支持配置任意兼容 OpenAI 接口格式的 AI 模型（推荐使用阿里云通义千问）。

在项目根目录创建或修改 `.env.local` 文件：

```env
# AI 服务配置 (以阿里云通义千问为例)
NEXT_PUBLIC_AI_ENDPOINT=https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions
NEXT_PUBLIC_AI_API_KEY=你的_API_KEY
NEXT_PUBLIC_AI_MODEL=qwen-turbo
```

### 3. 运行开发服务器

```bash
npm run dev
```

打开浏览器访问 `http://localhost:5173` 即可体验。
