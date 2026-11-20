"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { flavors, getFlavor, type FlavorId } from "@/lib/assets";
import { useCatalogPrices } from "@/context/CatalogPricesContext";
import {
  PCS_PER_CASE,
  casesFromPcs,
  snapToCasePcs,
} from "@/lib/pack";

const STORAGE_KEY = "umaxes-cart-v5";
const COUPON_KEY = "umaxes-cart-coupon";

export type CartLine = {
  flavorId: FlavorId;
  quantity: number;
};

type CartContextValue = {
  items: CartLine[];
  quantity: number;
  cases: number;
  open: boolean;
  setOpen: (open: boolean) => void;
  add: (flavorId: FlavorId, amount?: number) => void;
  addMany: (lines: { flavorId: FlavorId; quantity: number }[]) => void;
  setQuantity: (flavorId: FlavorId, qty: number) => void;
  remove: (flavorId: FlavorId) => void;
  clear: () => void;
  total: number;
  couponCode: string;
  setCouponCode: (code: string) => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function isFlavorId(id: string): id is FlavorId {
  return flavors.some((f) => f.id === id);
}

function normalizeLine(raw: unknown): CartLine | null {
  if (!raw || typeof raw !== "object") return null;
  const line = raw as Record<string, unknown>;
  if (!isFlavorId(String(line.flavorId))) return null;
  const quantity = snapToCasePcs(Number(line.quantity));
  if (quantity < PCS_PER_CASE) return null;
  return {
    flavorId: line.flavorId as FlavorId,
    quantity,
  };
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { unitPriceFor } = useCatalogPrices();
  const [items, setItems] = useState<CartLine[]>([]);
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [couponCode, setCouponCodeState] = useState("");

  useEffect(() => {
    try {
      const raw =
        localStorage.getItem(STORAGE_KEY) ||
        localStorage.getItem("umaxes-cart-v4") ||
        localStorage.getItem("umaxes-cart-v3") ||
        localStorage.getItem("umaxes-cart-v2");
      if (raw) {
        const parsed = JSON.parse(raw) as unknown[];
        if (Array.isArray(parsed)) {
          const merged = new Map<FlavorId, number>();
          for (const entry of parsed) {
            const line = normalizeLine(entry);
            if (!line) continue;
            merged.set(
              line.flavorId,
              (merged.get(line.flavorId) ?? 0) + line.quantity,
            );
          }
          setItems(
            [...merged.entries()].map(([flavorId, quantity]) => ({
              flavorId,
              quantity: snapToCasePcs(quantity),
            })),
          );
        }
      }
      const savedCoupon = localStorage.getItem(COUPON_KEY);
      if (savedCoupon) setCouponCodeState(savedCoupon);
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      if (items.length) localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      else localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem("umaxes-cart-v4");
      localStorage.removeItem("umaxes-cart-v3");
      localStorage.removeItem("umaxes-cart-v2");
    } catch {
      /* ignore */
    }
  }, [items, ready]);

  useEffect(() => {
    if (!ready) return;
    try {
      if (couponCode) localStorage.setItem(COUPON_KEY, couponCode);
      else localStorage.removeItem(COUPON_KEY);
    } catch {
      /* ignore */
    }
  }, [couponCode, ready]);

  const add = useCallback((flavorId: FlavorId, amount = PCS_PER_CASE) => {
    const n = snapToCasePcs(amount);
    if (n < PCS_PER_CASE) return;
    setItems((prev) => {
      const existing = prev.find((l) => l.flavorId === flavorId);
      if (existing) {
        return prev.map((l) =>
          l.flavorId === flavorId
            ? { ...l, quantity: snapToCasePcs(l.quantity + n) }
            : l,
        );
      }
      return [...prev, { flavorId, quantity: n }];
    });
  }, []);

  const addMany = useCallback(
    (lines: { flavorId: FlavorId; quantity: number }[]) => {
      setItems((prev) => {
        const next = [...prev];
        for (const line of lines) {
          const n = snapToCasePcs(line.quantity);
          if (n < PCS_PER_CASE) continue;
          const i = next.findIndex((l) => l.flavorId === line.flavorId);
          if (i >= 0) {
            next[i] = {
              ...next[i],
              quantity: snapToCasePcs(next[i].quantity + n),
            };
          } else {
            next.push({ flavorId: line.flavorId, quantity: n });
          }
        }
        return next;
      });
    },
    [],
  );

  const setQuantity = useCallback((flavorId: FlavorId, qty: number) => {
    const next = snapToCasePcs(qty);
    setItems((prev) => {
      if (next < PCS_PER_CASE) return prev.filter((l) => l.flavorId !== flavorId);
      return prev.map((l) =>
        l.flavorId === flavorId ? { ...l, quantity: next } : l,
      );
    });
  }, []);

  const remove = useCallback((flavorId: FlavorId) => {
    setItems((prev) => prev.filter((l) => l.flavorId !== flavorId));
  }, []);

  const clear = useCallback(() => {
    setItems([]);
    setCouponCodeState("");
  }, []);

  const setCouponCode = useCallback((code: string) => {
    setCouponCodeState(code.trim().toUpperCase());
  }, []);

  const quantity = useMemo(
    () => items.reduce((sum, l) => sum + l.quantity, 0),
    [items],
  );

  const cases = useMemo(
    () => items.reduce((sum, l) => sum + casesFromPcs(l.quantity), 0),
    [items],
  );

  const total = useMemo(
    () =>
      items.reduce((sum, l) => {
        const flavor = getFlavor(l.flavorId);
        const unit = unitPriceFor(l.flavorId) || flavor?.price || 0;
        return sum + unit * l.quantity;
      }, 0),
    [items, unitPriceFor],
  );

  const value = useMemo(
    () => ({
      items,
      quantity,
      cases,
      open,
      setOpen,
      add,
      addMany,
      setQuantity,
      remove,
      clear,
      total,
      couponCode,
      setCouponCode,
    }),
    [
      items,
      quantity,
      cases,
      open,
      add,
      addMany,
      setQuantity,
      remove,
      clear,
      total,
      couponCode,
      setCouponCode,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
