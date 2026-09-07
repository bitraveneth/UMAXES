import AgeGate from "@/components/AgeGate";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import NewsEvents from "@/components/NewsEvents";
import StoreTopPad from "@/components/StoreTopPad";

type Props = {
  searchParams: Promise<{ filter?: string }>;
};

export const metadata = {
  title: "News & Events · UMAXES",
  description:
    "UMAXES news, flavor drops, session nights, and the stories behind HOOKAMAX. Adults 21+ only.",
};

function parseFilter(value: string | undefined) {
  if (value === "News" || value === "Events" || value === "All") return value;
  return "All";
}

export default async function NewsPage({ searchParams }: Props) {
  const { filter } = await searchParams;
  const initialFilter = parseFilter(filter);

  return (
    <>
      <AgeGate />
      <Header />
      <main className="flex-1 bg-umx-cream">
        <StoreTopPad>
          <NewsEvents key={initialFilter} initialFilter={initialFilter} standalone />
        </StoreTopPad>
      </main>
      <Footer />
    </>
  );
}
