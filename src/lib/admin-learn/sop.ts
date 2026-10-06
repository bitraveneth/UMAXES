import type { AdminLocale } from "@/lib/admin-i18n";

export type LearnSop = {
  title: string;
  intro: string;
  steps: { title: string; detail: string }[];
};

const sopEn: LearnSop = {
  title: "Simple daily SOP",
  intro:
    "One short checklist for the usual day. Open a course below when you need more detail.",
  steps: [
    {
      title: "Approve new buyers",
      detail:
        "Approvals → set level (Distributor / Wholesaler / Retail) and credit if needed → Approve.",
    },
    {
      title: "Confirm payment (Orders)",
      detail:
        "Orders → open the row → Payment panel only. Save payment does not change shipping. Mark Paid when money is in.",
    },
    {
      title: "Move shipping separately",
      detail:
        "Same order → Shipping panel → Confirmed / With supplier / Shipped. Save shipping only when fulfillment actually moves.",
    },
    {
      title: "Docs: PI / packing",
      detail:
        "Download PDF or Excel (.xlsx) from the order. Logo is embedded. Excel opens in Excel, WPS, and LibreOffice.",
    },
    {
      title: "Pack & ship",
      detail:
        "Packing → build packing list → Shipments → add tracking. Warehouse stock updates when you manage inventory.",
    },
    {
      title: "Volume rebate (WS / Distro)",
      detail:
        "After Paid, monthly paid pcs update → Issue to wallet → next checkout spends wallet automatically. Do not use Manual correction for normal payments.",
    },
    {
      title: "Credit & aging",
      detail:
        "Record credit payments and watch Aging for overdue balances.",
    },
  ],
};

const sopZh: LearnSop = {
  title: "简易日常 SOP",
  intro: "日常操作一页清单。需要细节时，再打开下方课程。",
  steps: [
    {
      title: "审批新买家",
      detail:
        "审批管理 → 设置等级（分销商 / 批发商 / 零售）与授信（如需）→ 批准。",
    },
    {
      title: "确认付款（订单）",
      detail:
        "订单 → 展开行 → 只改「付款」面板。保存付款不会改物流。确认到账后再标为已到账。",
    },
    {
      title: "单独更新物流",
      detail:
        "同一订单 →「物流」面板 → 已确认 / 已交供应方 / 已发货。只有履约真正推进时才保存物流。",
    },
    {
      title: "单据：PI / 装箱单",
      detail:
        "在订单里下载 PDF 或 Excel（.xlsx）。Logo 已嵌入。Excel / WPS / LibreOffice 均可打开。",
    },
    {
      title: "装箱与发货",
      detail:
        "装箱 → 做装箱单 → 发货 → 填运单号。库存在仓库模块维护。",
    },
    {
      title: "进货返利（批发 / 分销）",
      detail:
        "到账后按月累计已付款支数 → 发放到账户 → 下一单结账自动抵扣。正常付款不要用「手工纠错」。",
    },
    {
      title: "授信与账龄",
      detail: "登记授信回款，用账龄跟进逾期。",
    },
  ],
};

export function getSimpleSop(locale: AdminLocale): LearnSop {
  return locale === "zh" ? sopZh : sopEn;
}
