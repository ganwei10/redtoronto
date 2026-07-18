# 红多营 RedToronto · 多伦多小红书营销服务商平台（MVP）

面向多伦多华人商户的**小红书营销服务商平台**：博主匹配、Brief 生成、内容工作台与效果看板，AI 驱动。
定位：广告代理商的「多伦多本地化服务商」——本地商户 BD + 博主组织 + 内容本地化 + 效果归因。

## 文档

- [MRD 市场需求文档](docs/MRD.md)
- [PRD 产品需求文档](docs/PRD.md)
- [项目架构文档](docs/ARCHITECTURE.md)

## 技术栈

- Next.js 15（App Router）+ TypeScript + Tailwind CSS
- AI：Anthropic Claude（Brief / 内容生成；未配置 key 时回退规则生成）
- 数据：MVP 内存存储（零依赖即可运行），生产可平滑升级为 Prisma + Postgres（见 `prisma/schema.prisma`）
- 部署：Vercel + GitHub

## 功能

1. **博主库** `/creators`：录入 / 列表 / 标签 / 报价 / 可接单状态
2. **Brief 生成** `/brief`：商户填需求 → AI 输出结构化 Campaign Brief
3. **博主匹配** `/match`：按赛道 / 城市 / 互动率 / 报价打分 → Top-N 推荐 + 理由
4. **内容工作台** `/content`：选中博主 + Brief → AI 生成种草文案 + 中英本地化 + 合规校验
5. **Campaign 看板** `/campaigns`：创建 Campaign、录入指标、查看曝光 / 互动 / 留资 / ROI
6. **AI 复盘报告** `/campaigns`：一键生成结构化复盘（亮点 / 问题 / 下一轮建议），自动沉淀到
7. **复盘知识库** `/kb`：所有 Campaign 复盘自动累积，供后续 Brief / 复盘通过 RAG 调用，沉淀可复制方法论

## 本地运行

```bash
npm install
cp .env.example .env.local   # 可选：填入 ANTHROPIC_API_KEY 启用 AI 生成
npm run dev                  # http://localhost:3000
```

未配置 `ANTHROPIC_API_KEY` 时，Brief / 内容生成会回退到规则模板，应用仍可完整演示。

## 部署到 Vercel

1. 将本仓库推到 GitHub（见下方）。
2. 在 Vercel 导入该仓库，框架选 Next.js（自动识别）。
3. 在 Vercel 控制台 → Environment Variables 配置：
   - `ANTHROPIC_API_KEY`（启用 AI 生成）
   - 可选 `ANTHROPIC_MODEL`
4. Deploy。`vercel.json` 已包含基础配置。

## 升级到 Postgres（生产持久化）

Vercel Serverless 文件系统只读，内存数据在冷启动后会重置。生产环境建议：

```bash
npm i prisma @prisma/client
# 编辑 prisma/schema.prisma（已提供）
# 在 .env 设置 DATABASE_URL（Neon / Supabase 等托管 Postgres）
npx prisma generate && npx prisma db push
```

然后将 `lib/store.ts` 的读写替换为 Prisma client（接口已对齐，迁移成本低）。
向量匹配可选用 pgvector：将 `embedding` 字段改为 `vector` 类型并用 cosine 距离排序（见架构文档）。

## 合规提醒

- 付费合作务必走小红书蒲公英（代理商合规通道），勿私单。
- 加拿大《竞争法》要求博主标注「material connection」（合作披露）——内容工作台已做校验提示。
- 留资数据遵循 PIPEDA，最小化收集并妥善存储。

## 目录结构

```
app/        页面与 API Route Handlers
lib/        store(数据) / ai(Claude) / kb(知识库) / match(匹配) / compliance(合规) / types
data/       种子博主与商户
docs/       MRD / PRD / 架构文档
prisma/     生产数据库 schema
```
