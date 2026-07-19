# 红多营运营平台 · 多伦多小红书智能营销运营平台

面向多伦多华人商户的**小红书智能营销运营平台**：博主匹配、Brief 生成、内容工作台与效果看板，AI 驱动。
定位：广告代理商的「多伦多本地化服务商」——本地商户 BD + 博主组织 + 内容本地化 + 效果归因。

## 文档

- [MRD 市场需求文档](docs/MRD.md)
- [PRD 产品需求文档](docs/PRD.md)
- [项目架构文档](docs/ARCHITECTURE.md)

## 技术栈

- Next.js 15（App Router）+ TypeScript + Tailwind CSS
- AI：Anthropic Claude（Brief / 内容 / 复盘生成；未配置 key 时回退规则生成）
- 身份认证：**NextAuth v5（Auth.js）**，Credentials 登录 + JWT 会话 + 角色（RBAC）
- 数据：**Prisma + PostgreSQL**（已生产化，非内存存储）；`lib/store.ts` 统一异步数据访问
- 部署：Vercel + GitHub

## 功能（已上线版本）

**v1.1 · 三角色真实登录与权限（RBAC）**
- `/register` 注册（选角色：商户 / 运营方 / 博主），密码使用 Node `crypto.scrypt` 哈希
- `/login` 真实登录（NextAuth Credentials），会话 JWT 携带角色
- `middleware.ts` 按角色门禁：`/merchant` 仅商户、`/creator` 仅博主，其余需登录
- 运营方：全套运营控制台（博主库 / Brief / 匹配 / 内容 / Campaign / 需求审核 / 知识库）

**v1.0 · 商户门户**
- `/merchant` 商户工作台：需求数、Campaign 数、累计曝光 / 留资等汇总指标
- `/merchant/requests/new` 提交营销需求 → 自动生成结构化 Brief 并创建 Campaign 草稿
- `/requests`（运营方）审核商户需求，一键「采纳并启动」

**通用能力**
- 博主库 `/creators`：单条录入 / 列表 / 标签 / 报价 / 可接单状态；**CSV / JSON 批量导入**（中英文表头别名、按账号去重、互动率百分号归一化）；全字段前后端双重校验，拦截负数 / 越界 / 必填缺失
- Brief 生成 `/brief`、博主匹配 `/match`、内容工作台 `/content`（中英本地化 + 合规校验）
- Campaign 看板 `/campaigns`：内联录入效果指标（均 ≥ 0 整数），查看曝光 / 互动 / 留资 / ROI
- AI 复盘报告 + 复盘知识库 `/kb`（持久化到 Postgres，供后续 RAG）

## 本地运行

> 需要 PostgreSQL。本地可用 [Neon](https://neon.tech) / [Supabase](https://supabase.com) 免费库，或 `brew install postgresql`。

```bash
npm install
cp .env.example .env.local
# 在 .env.local 填入：
#   DATABASE_URL=postgresql://user:pass@host:5432/redtoronto?schema=public
#   AUTH_SECRET=$(openssl rand -base64 32)   # 必填，生产环境务必强随机
npx prisma generate
npx prisma db push        # 创建表结构
npm run db:seed           # 写入初始博主/商户，并创建运营方账号 operator@redtoronto.com / admin123
npm run dev               # http://localhost:3000
```

未配置 `ANTHROPIC_API_KEY` 时，AI 生成回退到规则模板，应用仍可完整运行。

## 部署到 Vercel

1. 将本仓库推到 GitHub。
2. Vercel 导入该仓库，框架选 Next.js（自动识别）。
3. 控制台 → Environment Variables 配置：
   - `DATABASE_URL`（托管 Postgres 连接串，如 Neon）
   - `AUTH_SECRET`（强随机值）
   - `ANTHROPIC_API_KEY`（可选，启用 AI 生成）
4. Deploy。部署后执行一次 `prisma db push`（可在 Vercel 的 Build & Development Settings 的 Install Command 已含 `prisma generate`；建表可在本地或 Vercel Shell 执行）。

## 合规提醒

- 付费合作务必走小红书蒲公英（代理商合规通道），勿私单。
- 加拿大《竞争法》要求博主标注「material connection」（合作披露）——内容工作台已做校验提示。
- 留资数据遵循 PIPEDA，最小化收集并妥善存储。

## 目录结构

```
app/
  (auth)        /login /register
  /merchant     商户门户（v1.0）
  /requests     运营方需求审核（v1.1）
  /creators /brief /match /content /campaigns /kb   运营控制台
  /api          Route Handlers（含 /api/auth/[...nextauth]、注册、需求、审核）
lib/            store(Prisma) / auth / auth.config / password / prisma / ai / kb / match / validation / types
prisma/         schema.prisma + seed.mjs
data/           种子博主与商户（JSON）
docs/           MRD / PRD / 架构文档
middleware.ts   角色门禁
```
