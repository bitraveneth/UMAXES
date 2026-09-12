import { prisma } from "@/lib/db";

export type InvoiceBankDetails = {
  companyName: string;
  accountNumber: string;
  bankName: string;
  bankAddress: string;
  swiftCode: string;
  currency: string;
};

/** Printed when no active BankAccount row exists yet. */
export const DEFAULT_INVOICE_BANK: InvoiceBankDetails = {
  companyName: "UMAXES LIMITED",
  accountNumber: "308018443518",
  bankName: "DAH SING BANK LIMITED",
  bankAddress:
    "Dah Sing Bank, 26/F Dah Sing Financial Centre, 248 Queen's Road East, Wan Chai, Hong Kong",
  swiftCode: "DSBAHKHH",
  currency: "USD",
};

export function toInvoiceBankDetails(row: {
  companyName: string;
  accountNumber: string;
  bankName: string;
  bankAddress: string;
  swiftCode: string;
  currency: string;
}): InvoiceBankDetails {
  return {
    companyName: row.companyName,
    accountNumber: row.accountNumber,
    bankName: row.bankName,
    bankAddress: row.bankAddress,
    swiftCode: row.swiftCode,
    currency: row.currency || "USD",
  };
}

/** Active bank for PI / commercial invoices. Falls back to Dah Sing defaults. */
export async function getActiveBankAccount(): Promise<InvoiceBankDetails> {
  try {
    const row = await prisma.bankAccount.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: "desc" },
    });
    return row ? toInvoiceBankDetails(row) : DEFAULT_INVOICE_BANK;
  } catch {
    return DEFAULT_INVOICE_BANK;
  }
}
