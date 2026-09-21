"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useSession } from "next-auth/react";
import { product } from "@/lib/assets";

export const FALLBACK_RETAIL_PRICE = product.price;

export type CatalogPrice = {
  sku: string;
  unitPrice: number;
  retailPrice: number;
};

type CatalogPricesValue = {
  ready: boolean;
  unitPriceFor: (sku?: string) => number;
  retailPriceFor: (sku?: string) => number;
};

const CatalogPricesContext = createContext<CatalogPricesValue | null>(null);

function firstMapValue<T>(map: Map<string, T>) {
  return map.values().next().value as T | undefined;
}

export function CatalogPricesProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const [prices, setPrices] = useState<Map<string, CatalogPrice>>(new Map());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (status !== "authenticated") {
      setPrices(new Map());
      setReady(true);
      return;
    }

    let cancelled = false;
    fetch("/api/catalog")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled) return;
        const map = new Map<string, CatalogPrice>();
        for (const row of data?.products ?? []) {
          const sku = String(row.sku || "");
          if (!sku) continue;
          map.set(sku, {
            sku,
            unitPrice: Number(row.unitPrice) || 0,
            retailPrice: Number(row.retailPrice) || FALLBACK_RETAIL_PRICE,
          });
        }
        setPrices(map);
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) setReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [status]);

  const unitPriceFor = useCallback(
    (sku?: string) => {
      if (sku && prices.has(sku)) return prices.get(sku)!.unitPrice;
      return firstMapValue(prices)?.unitPrice ?? FALLBACK_RETAIL_PRICE;
    },
    [prices],
  );

  const retailPriceFor = useCallback(
    (sku?: string) => {
      if (sku && prices.has(sku)) return prices.get(sku)!.retailPrice;
      return firstMapValue(prices)?.retailPrice ?? FALLBACK_RETAIL_PRICE;
    },
    [prices],
  );

  const value = useMemo(
    () => ({ ready, unitPriceFor, retailPriceFor }),
    [ready, unitPriceFor, retailPriceFor],
  );

  return (
    <CatalogPricesContext.Provider value={value}>
      {children}
    </CatalogPricesContext.Provider>
  );
}

export function useCatalogPrices() {
  const ctx = useContext(CatalogPricesContext);
  if (!ctx) {
    return {
      ready: true,
      unitPriceFor: () => FALLBACK_RETAIL_PRICE,
      retailPriceFor: () => FALLBACK_RETAIL_PRICE,
    };
  }
  return ctx;
}
