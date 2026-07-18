# 项目架构文档（Architecture）

> 产品：**红多营 RedToronto** MVP　版本：v0.1　日期：2026-07-18

---

## 1. 技术选型

| 层 | 选型 | 理由 |
|---|---|---|
| 全栈框架 | Next.js 15（App Router）+ TypeScript | 前后端一体，Vercel 原生支持，Server Action / Route Handler 处理 AI 调用 |
| 样式 | Tailwind CSS | 快速搭建门户与看板 |
| 数据库 | PostgreSQL（Neon 等托管）+ Prisma | 关系数据 + 托管易部署 |
| 向量检索 | pgvector | 博主画像 / Brief embedding 相似度匹配，免额外向量库 |
| AI | Anthropic Claude（Haiku/Sonnet 路由） | Brief/内容/复盘生成；embedding 走兼容接口 |
| 认证 | NextAuth（Auth.js） | 商户/运营登录 |
| 部署 | Vercel | 一键部署、Serverless 函数隐藏密钥 |
| CI / 托管 | GitHub + GitHub Actions | 代码托管与自动部署 |

---

## 2. 分层架构（对齐策略图）

```
接入层    商户门户 / 博主门户 / 代理商后台
   ↓
应用层    CRM(商户) / Creator DB / 内容工作台 / Campaign / Analytics 看板
   ↓
AI 能力层  LLM 编排 / RAG 知识库 / 多模态生成 / 匹配推荐 / Agent 优化
   ↓
数据层    商户库 / 博主库 / 内容库 / 效果数据 / 向量库(pgvector)
```

---

## 3. 目录结构

```
redtoronto/                # 仓库根（Vercel 部署根目录）
├─ app/
│  ├─ layout.tsx
│  ├─ page.tsx              # 首页/概览
│  ├─ creators/             # 博主库页面（列表/详情/编辑）
│  ├─ brief/                # Brief 录入 + AI 生成
│  ├─ match/                # 匹配结果
│  ├─ content/              # 内容工作台
│  ├─ campaigns/            # Campaign + 看板
│  └─ api/                  # Route Handlers
│     ├─ brief/route.ts     # 调 Claude 生成结构化 Brief
│     ├─ match/route.ts     # embedding + 打分匹配
│     ├─ content/route.ts   # 内容生成 + 合规校验
│     └─ campaign/route.ts  # CRUD + 指标
├─ lib/
│  ├─ db.ts                 # Prisma client
│  ├─ ai.ts                 # Claude client + JSON 调用
│  ├─ embed.ts              # embedding 工具
│  ├─ match.ts              # 相似度 + 业务权重打分
│  └─ compliance.ts         # 违禁词/披露校验
├─ prisma/
│  └─ schema.prisma         # 数据模型
├─ vercel.json
├─ next.config.mjs
├─ tailwind.config.ts
├─ package.json
└─ README.md
```

---

## 4. 数据模型（核心）

```prisma
model Creator {
  id             String   @id @default(cuid())
  handle         String
  platformId     String?
  followers      Int
  engagementRate Float
  niche          String[]        // 赛道标签
  city           String
  rateCAD        Float
  availability   Boolean  @default(true)
  pastCases      String[]
  embedding      Float[]         // 画像向量（pgvector）
  createdAt      DateTime @default(now())
}

model Merchant {
  id        String   @id @default(cuid())
  name      String
  industry  String
  contact   String
  createdAt DateTime @default(now())
}

model Brief {
  id         String   @id @default(cuid())
  merchantId String?
  raw        Json            // 表单原始输入
  structured Json            // AI 生成的结构化 Brief
  createdAt  DateTime @default(now())
}

model Campaign {
  id         String   @id @default(cuid())
  briefId    String
  creatorIds String[]
  status     String   @default("draft")
  budgetCAD  Float
  createdAt  DateTime @default(now())
}

model Content {
  id         String   @id @default(cuid())
  campaignId String
  creatorId  String
  body       String
  status     String   @default("draft")
  flags      String[] // 合规标记
  createdAt  DateTime @default(now())
}

model Metric {
  id          String   @id @default(cuid())
  campaignId  String
  date        DateTime
  impressions Int
  engagements Int
  clicks      Int
  leads       Int
}
```

---

## 5. AI 工作流

1. **Brief 生成**：merchant form → Claude（JSON 模式）→ 结构化 Brief。
2. **匹配**：Brief 文本 + Creator 画像 → embedding → cosine + 业务权重 → Top-N。
3. **内容**：Brief + Creator → Claude 生成多版本文案 → 合规校验。
4. **复盘**：Campaign metrics + contents → Claude 生成报告 → 入 RAG 知识库。

> 所有 AI 调用在 Server 端 Route Handler 执行，前端不持有 `ANTHROPIC_API_KEY`。

---

## 6. 部署架构

```
GitHub (main)
   │  push
   ▼
Vercel 自动部署（构建 + Serverless 函数）
   │
   ├─ Neon Postgres (DATABASE_URL)
   └─ 环境变量：ANTHROPIC_API_KEY / NEXTAUTH_SECRET
```

- Vercel 函数处理 AI 调用与 DB 访问，密钥仅服务端可见。
- `vercel.json` 指定框架与构建；环境变量在 Vercel 控制台配置。

---

## 7. 安全与合规

- **密钥隔离**：LLM / DB 密钥仅在 Vercel 服务端环境变量，前端永不可见。
- **数据合规**：商户/博主 PII 加密存储；遵循加拿大 PIPEDA；留资最小化。
- **广告合规**：付费合作强制走蒲公英；博主合作披露（material connection）；违禁词/极限词校验。
- **稳定性**：AI 调用限流与用量监控；embedding 失败回退到标签打分。
