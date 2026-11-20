import { NextResponse } from "next/server";
import { listPublishedFaqs } from "@/lib/faqs";

export async function GET() {
  const items = await listPublishedFaqs();
  return NextResponse.json({
    faqs: items.map((item) => ({
      q: item.q,
      a: item.a,
      keys: [...item.keys],
    })),
  });
}
