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

export type AccountPriceLevel = "DISTRO" | "WHOLESALER" | "SHOP";

export type CatalogPrice = {
  sku: string;
  unitPrice: number;
  retailPrice: number;
};

type CatalogPricesValue = {
  ready: boolean;
  hideCoupon: boolean;
  accountLevel: AccountPriceLevel | null;
  testStationsPerCase: number;
  pcsPerCase: number;
  unitPriceFor: (sku?: string) => number;
  retailPriceFor: (sku?: string) => number;
};

function parseAccountLevel(value: unknown): AccountPriceLevel | null {
  if (value === "DISTRO" || value === "WHOLESALER" || value === "SHOP") {
    return value;
  }
  return null;
}

const CatalogPricesContext = createContext<CatalogPricesValue | null>(null);

function firstMapValue<T>(map: Map<string, T>) {
  return map.values().next().value as T | undefined;
}

export function CatalogPricesProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const [prices, setPrices] = useState<Map<string, CatalogPrice>>(new Map());
  const [accountUnit, setAccountUnit] = useState<number>(FALLBACK_RETAIL_PRICE);
  const [accountLevel, setAccountLevel] = useState<AccountPriceLevel | null>(null);
  const [hideCoupon, setHideCoupon] = useState(false);
  const [testStationsPerCase, setTestStationsPerCase] = useState(0);
  const [pcsPerCase, setPcsPerCase] = useState(95);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (status !== "authenticated") {
      setPrices(new Map());
      setAccountUnit(FALLBACK_RETAIL_PRICE);
      setAccountLevel(null);
      setHideCoupon(false);
      setTestStationsPerCase(0);
      setPcsPerCase(95);
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
          const unitPrice = Number(row.unitPrice) || 0;
          if (unitPrice <= 0) continue;
          map.set(sku, {
            sku,
            unitPrice,
            retailPrice: FALLBACK_RETAIL_PRICE,
          });
        }
        const channelUnit = Number(data?.channel?.unitPrice);
        setAccountUnit(
          firstMapValue(map)?.unitPrice ||
            (Number.isFinite(channelUnit) && channelUnit > 0
              ? channelUnit
              : FALLBACK_RETAIL_PRICE),
        );
        setPrices(map);
        setAccountLevel(parseAccountLevel(data?.level));
        setHideCoupon(Boolean(data?.channel?.hideCoupon));
        setTestStationsPerCase(
          Math.max(0, Math.floor(Number(data?.channel?.testStationsPerCase) || 0)),
        );
        setPcsPerCase(
          Math.max(1, Math.floor(Number(data?.channel?.pcsPerCase) || 95)),
        );
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
      return firstMapValue(prices)?.unitPrice ?? accountUnit;
    },
    [prices, accountUnit],
  );

  const retailPriceFor = useCallback(
    (_sku?: string) => FALLBACK_RETAIL_PRICE,
    [],
  );

  const value = useMemo(
    () => ({
      ready,
      hideCoupon,
      accountLevel,
      testStationsPerCase,
      pcsPerCase,
      unitPriceFor,
      retailPriceFor,
    }),
    [
      ready,
      hideCoupon,
      accountLevel,
      testStationsPerCase,
      pcsPerCase,
      unitPriceFor,
      retailPriceFor,
    ],
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
      hideCoupon: false,
      accountLevel: null,
      testStationsPerCase: 0,
      pcsPerCase: 95,
      unitPriceFor: () => FALLBACK_RETAIL_PRICE,
      retailPriceFor: () => FALLBACK_RETAIL_PRICE,
    };
  }
  return ctx;
}
