export type BuyerRebateMonth = {
  yearMonth: string;
  paidQty: number;
  tierRate: number;
  rebateAmount: number;
  issuedAmount: number;
  status: string;
};

export type BuyerRebateLedger = {
  id: string;
  type: string;
  amount: number;
  note: string | null;
  createdAt: string;
};

export type BuyerRebateStatus = {
  level: string;
  live: boolean;
  walletUsd: number;
  monthKey: string;
  monthPaidQty: number;
  monthProjectedRate: number;
  nextTierQty: number | null;
  nextTierRate: number | null;
  isFirstOrder: boolean;
  pcsPerCase: number;
  testStationsPerCase: number;
  firstOrderCases: number;
  firstOrderUnpaidPcs: number;
  unitPrice: number | null;
  tiers: { minQty: number; rateUsd: number }[];
  months: BuyerRebateMonth[];
  ledger: BuyerRebateLedger[];
};
