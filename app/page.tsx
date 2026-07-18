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
        <h1 className="text-2xl font-bold text-slate-900">概览</h1>
        <p className="mt-1 text-sm text-slate-500">
          多伦多小红书营销服务商平台：把「找博主 → 出 Brief → 匹配 → 出内容 →
          投放 → 看效果」做成一套 AI 驱动的系统。
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
          <h3 className="font-semibold text-slate-900">1 · 录入 Brief</h3>
          <p className="mt-2 text-sm text-slate-500">
            商户填需求，AI 生成结构化 Campaign Brief（人群包、内容方向、KPI）。
          </p>
        </Link>
        <Link href="/match" className="card hover:shadow-md">
          <h3 className="font-semibold text-slate-900">2 · 博主匹配</h3>
          <p className="mt-2 text-sm text-slate-500">
            按标签/调性/报价打分，输出 Top-N 推荐与匹配理由。
          </p>
        </Link>
        <Link href="/content" className="card hover:hadow-md hover:shadow-md">
          <h3 className="font-semibold text-slate-900">3 · 内容工作台</h3>
          <p className="mt-2 text-sm text-slate-500">
            AI 生成种草文案/脚本，中英本地化 + 合规校验。
          </p>
        </Link>
      </section>

      <section className="card">
        <h3 className="font-semibold text-slate-900">商业模式位置</h3>
        <p className="mt-2 text-sm text-slate-500">
          你是广告代理商的「多伦多本地化服务商」：本地商户 BD + 博主组织 +
          内容本地化 + 效果归因，借助代理商的聚光 / 蒲公英合规通道完成投放。
        </p>
      </section>
    </div>
  );
}
