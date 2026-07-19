import Link from "next/link";
import { listCreators, listCampaigns, listMerchants } from "@/lib/store";

export default function HomePage() {
  const creators = listCreators();
  const merchants = listMerchants();
  const campaigns = listCampaigns();

  const totalFollowers = creators.reduce((s, c) => s + c.followers, 0);
  const avgEngagement =
    creators.length > 0
      ? (
          (creators.reduce((s, c) => s + c.engagementRate, 0) /
            creators.length) *
          100
        ).toFixed(1)
      : "0";

  const stats = [
    { label: "合作博主", value: creators.length, href: "/creators" },
    { label: "覆盖商户", value: merchants.length, href: "/brief" },
    { label: "进行中 Campaign", value: campaigns.length, href: "/campaigns" },
    { label: "博主总粉丝", value: `${(totalFollowers / 1000).toFixed(0)}k`, href: "/creators" },
    { label: "平均互动率", value: `${avgEngagement}%`, href: "/creators" },
  ];

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-bold text-slate-900">平台概览</h1>
        <p className="mt-1 text-sm text-slate-500">
          红多营运营平台：将「博主匹配 → Brief 生成 → 内容创作 → 投放 → 效果归因」整合为一套 AI 驱动的运营系统，服务于多伦多小红书营销全链路。
        </p>
      </section>

      <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="card hover:shadow-md">
            <div className="text-2xl font-bold text-brand">{s.value}</div>
            <div className="mt-1 text-xs text-slate-500">{s.label}</div>
          </Link>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Link href="/brief" className="card hover:shadow-md">
          <h3 className="font-semibold text-slate-900">1 · 录入营销需求</h3>
          <p className="mt-2 text-sm text-slate-500">
            商户提交需求，AI 生成结构化 Campaign Brief（人群包、内容方向、KPI）。
          </p>
        </Link>
        <Link href="/match" className="card hover:shadow-md">
          <h3 className="font-semibold text-slate-900">2 · 博主智能匹配</h3>
          <p className="mt-2 text-sm text-slate-500">
            按赛道、报价与互动率综合打分，输出 Top-N 推荐与匹配理由。
          </p>
        </Link>
        <Link href="/content" className="card hover:shadow-md">
          <h3 className="font-semibold text-slate-900">3 · 内容创作工作台</h3>
          <p className="mt-2 text-sm text-slate-500">
            AI 生成种草文案与英文本地化版本，内置合规校验。
          </p>
        </Link>
      </section>

      <section className="card">
        <h3 className="font-semibold text-slate-900">平台定位</h3>
        <p className="mt-2 text-sm text-slate-500">
          作为广告代理商的「多伦多本地化运营方」：负责本地商户拓展、博主组织、内容本地化与效果归因，借助代理商的聚光 / 蒲公英合规通道完成投放与结算。
        </p>
      </section>
    </div>
  );
}
