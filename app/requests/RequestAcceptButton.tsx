"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RequestAcceptButton({
  requestId,
}: {
  requestId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function accept() {
    setLoading(true);
    const res = await fetch(`/api/requests/${requestId}/accept`, { method: "POST" });
    setLoading(false);
    if (res.ok) router.refresh();
  }

  return (
    <button className="btn-primary text-xs" onClick={accept} disabled={loading}>
      {loading ? "处理中…" : "采纳并启动"}
    </button>
  );
}
