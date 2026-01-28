# GoNote API 接口文档

后端基于 **Go + Gin + GORM + SQLite** 构建，运行在 `http://localhost:8080`。

---

## 目录

- [认证接口 (Auth)](#认证接口-auth)
- [笔记接口 (Notes)](#笔记接口-notes)
- [事件接口 (Events)](#事件接口-events)

---

## 认证接口 (Auth)

### 用户注册

创建新用户账号。

```http
POST /api/auth/register
```

**请求体：**
```json
{
  "username": "string (3-20字符)",
  "password": "string (至少6字符)"
}
```

**成功响应 (201)：**
```json
{
  "message": "注册成功",
  "token": "mock-jwt-token-for-u-username",
  "user": {
    "id": "u-username",
    "username": "username",
    "avatarColor": "bg-blue-500",
    "createdAt": "2026-01-28T09:14:25.950328+08:00",
    "updatedAt": "2026-01-28T09:14:25.950328+08:00"
  }
}
```

**错误响应：**
| 状态码 | 错误信息 |
|--------|----------|
| 400 | 用户名至少3个字符，密码至少6个字符 |
| 409 | 用户名已被注册 |
| 500 | 注册失败，请稍后重试 |

---

### 用户登录

验证已注册用户的凭据。

```http
POST /api/auth/login
```

**请求体：**
```json
{
  "username": "string",
  "password": "string"
}
```

**成功响应 (200)：**
```json
{
  "token": "mock-jwt-token-for-u-username",
  "user": {
    "id": "u-username",
    "username": "username",
    "avatarColor": "bg-blue-500",
    "createdAt": "2026-01-28T09:14:25.950328+08:00",
    "updatedAt": "2026-01-28T09:14:25.950328+08:00"
  }
}
```

**错误响应：**
| 状态码 | 错误信息 |
|--------|----------|
| 400 | 用户名和密码不能为空 |
| 401 | 用户名或密码错误 |

---

## 笔记接口 (Notes)

### 获取笔记列表

获取当前用户的所有笔记。

```http
GET /api/notes
GET /api/notes?folderId=1
GET /api/notes?search=关键词
```

**查询参数：**
| 参数 | 类型 | 描述 |
|------|------|------|
| folderId | string | 可选，按文件夹筛选 |
| search | string | 可选，搜索标题和内容 |

**成功响应 (200)：**
```json
[
  {
    "id": "note-id",
    "userId": "u1",
    "folderId": "1",
    "title": "笔记标题",
    "content": "笔记内容",
    "isPublic": false,
    "publicPermission": "read",
    "createdAt": "2026-01-28T00:00:00Z",
    "updatedAt": "2026-01-28T00:00:00Z"
  }
]
```

---

### 创建笔记

创建新笔记。

```http
POST /api/notes
```

**请求体：**
```json
{
  "id": "string (可选，不提供则自动生成)",
  "title": "string",
  "content": "string",
  "folderId": "string"
}
```

**成功响应 (201)：**
```json
{
  "id": "note-id",
  "userId": "u1",
  "folderId": "1",
  "title": "笔记标题",
  "content": "笔记内容",
  "createdAt": "2026-01-28T00:00:00Z",
  "updatedAt": "2026-01-28T00:00:00Z"
}
```

---

### 更新笔记

更新已有笔记的内容。

```http
PUT /api/notes/:id
```

**路径参数：**
| 参数 | 类型 | 描述 |
|------|------|------|
| id | string | 笔记 ID |

**请求体：**
```json
{
  "title": "string",
  "content": "string"
}
```

**成功响应 (200)：**
```json
{
  "id": "note-id",
  "title": "更新后的标题",
  "content": "更新后的内容",
  "updatedAt": "2026-01-28T00:00:00Z"
}
```

**错误响应：**
| 状态码 | 错误信息 |
|--------|----------|
| 404 | Note not found |

---

### 删除笔记

删除指定笔记。

```http
DELETE /api/notes/:id
```

**路径参数：**
| 参数 | 类型 | 描述 |
|------|------|------|
| id | string | 笔记 ID |

**成功响应 (200)：**
```json
{
  "message": "Note deleted"
}
```

---

## 事件接口 (Events)

### 获取事件列表

获取当前用户的日历事件。

```http
GET /api/events
GET /api/events?start=2026-01-01&end=2026-12-31
```

**查询参数：**
| 参数 | 类型 | 描述 |
|------|------|------|
| start | string | 可选，开始日期 (YYYY-MM-DD) |
| end | string | 可选，结束日期 (YYYY-MM-DD) |

**成功响应 (200)：**
```json
[
  {
    "id": 1,
    "userId": "u1",
    "title": "事件标题",
    "description": "事件描述",
    "date": "2026-01-28T00:00:00Z",
    "type": "solar",
    "recurrence": "none",
    "notifyUsers": "[\"u1\",\"u2\"]",
    "showCountdown": true,
    "isSystem": false,
    "createdAt": "2026-01-28T00:00:00Z",
    "updatedAt": "2026-01-28T00:00:00Z"
  }
]
```

---

### 创建事件

创建新的日历事件。

```http
POST /api/events
```

**请求体：**
```json
{
  "title": "string",
  "description": "string (可选)",
  "date": "2026-01-28T00:00:00Z",
  "type": "solar | lunar | holiday | term",
  "recurrence": "none | daily | weekly | monthly | yearly",
  "notifyUsers": "[\"u1\",\"u2\"]",
  "showCountdown": true
}
```

**成功响应 (201)：**
```json
{
  "id": 1,
  "userId": "u1",
  "title": "事件标题",
  "date": "2026-01-28T00:00:00Z",
  "type": "solar",
  "recurrence": "none",
  "createdAt": "2026-01-28T00:00:00Z"
}
```

---

### 删除事件

删除指定事件。

```http
DELETE /api/events/:id
```

**路径参数：**
| 参数 | 类型 | 描述 |
|------|------|------|
| id | string | 事件 ID |

**成功响应 (200)：**
```json
{
  "message": "Event deleted"
}
```

---

## 通用错误响应

所有接口在发生错误时返回以下格式：

```json
{
  "error": "错误信息"
}
```

---

## CORS 配置

后端已配置 CORS 中间件，允许：
- **Origin**: `*` (所有来源)
- **Methods**: `POST, GET, OPTIONS, PUT, DELETE`
- **Headers**: `Content-Type, Authorization`
