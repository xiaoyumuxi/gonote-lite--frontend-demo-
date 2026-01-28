

# GoNote Lite

一个轻量级、Notion 风格的 Markdown 笔记应用。支持多人协作模拟、富文本编辑以及可配置的 AI 辅助功能。

## 🏗️ 技术栈

| 层级 | 技术 |
|------|------|
| **前端** | React + TypeScript + Vite |
| **后端** | Go + Gin + GORM |
| **数据库** | SQLite |
| **样式** | TailwindCSS |

---

## ✅ 已完成功能 (Completed Features)

### 1. 核心笔记功能 (Core Note Taking)
*   **多视图编辑器**: 支持 **编辑模式**、**预览模式** 和 **分屏模式** (Split View)。
*   **Markdown 支持**: 基础格式（加粗/斜体/标题）、待办事项列表、代码块高亮。
*   **富文本操作**: 支持文本变色、背景高亮、引用文本。
*   **笔记管理**: 创建/删除笔记、文件夹分类、全文搜索。
*   **数据持久化**: 笔记数据通过后端 API 保存到 SQLite 数据库。

### 2. 用户认证 (Authentication)
*   **用户注册**: 独立注册流程，密码使用 bcrypt 加密存储。
*   **用户登录**: 验证已注册用户，支持错误提示。
*   **安全性**: 登录与注册分离，防止恶意脚本攻击。

### 3. 协作与社交 (Collaboration & Social)
*   **@提及功能**: 输入 `@` 触发用户列表。
*   **评论系统**: 选中/右键文本添加评论，支持侧边栏回复。
*   **分享功能**: 模拟生成只读/编辑权限的分享链接。

### 4. AI 智能增强 (AI Features)
*   **内容润色 (AI Polish)**: 使用 AI 优化笔记的语法和语气。
*   **多模型兼容**: 兼容任何 OpenAI 格式的 API（如 **阿里云通义千问**、DeepSeek、OpenAI 等）。

### 5. 界面与交互 (UI/UX)
*   **Notion 风格**: 极简侧边栏、面包屑导航。
*   **响应式设计**: 完美支持移动端。
*   **中文界面**: 登录/注册界面已汉化。

---

## 🚀 快速开始 (Getting Started)

### 1. 安装前端依赖

```bash
npm install
```

### 2. 启动后端服务

```bash
cd backend
go run main.go
```

后端服务将在 `http://localhost:8080` 启动。

### 3. 启动前端开发服务器

```bash
npm run dev
```

前端服务将在 `http://localhost:3000` 启动，打开浏览器访问即可体验。

### 4. 配置 AI 服务 (可选)

本项目支持配置任意兼容 OpenAI 接口格式的 AI 模型（推荐使用阿里云通义千问）。

在项目根目录创建或修改 `.env.local` 文件：

```env
# AI 服务配置 (以阿里云通义千问为例)
NEXT_PUBLIC_AI_ENDPOINT=https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions
NEXT_PUBLIC_AI_API_KEY=你的_API_KEY
NEXT_PUBLIC_AI_MODEL=qwen-turbo
```

---

## 📚 API 文档

详细的后端 API 接口文档请参阅 [API.md](./API.md)。

---

## 📁 项目结构

```
gonote-lite/
├── App.tsx              # 前端主应用
├── components/          # React 组件
├── services/
│   ├── api.ts           # 后端 API 封装
│   └── aiService.ts     # AI 服务封装
├── types.ts             # TypeScript 类型定义
├── backend/
│   ├── main.go          # 后端入口
│   ├── handlers/        # API 处理器
│   │   ├── auth.go      # 认证相关
│   │   ├── notes.go     # 笔记相关
│   │   └── events.go    # 事件相关
│   ├── models/          # 数据模型
│   └── db/              # 数据库连接
└── README.md
```
