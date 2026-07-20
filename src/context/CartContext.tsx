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

const STORAGE_KEY = "umaxes-cart-v2";

export type CartLine = {
  flavorId: FlavorId;
  quantity: number;
};

type CartContextValue = {
  items: CartLine[];
  quantity: number;
  open: boolean;
  setOpen: (open: boolean) => void;
  add: (flavorId: FlavorId, amount?: number) => void;
  setQuantity: (flavorId: FlavorId, qty: number) => void;
  remove: (flavorId: FlavorId) => void;
  clear: () => void;
  total: number;
};

const CartContext = createContext<CartContextValue | null>(null);

function isFlavorId(id: string): id is FlavorId {
  return flavors.some((f) => f.id === id);
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartLine[]>([]);
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CartLine[];
        if (Array.isArray(parsed)) {
          setItems(
            parsed.filter(
              (line) =>
                line &&
                isFlavorId(line.flavorId) &&
                Number.isFinite(line.quantity) &&
                line.quantity > 0
            )
          );
        }
      }
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
    } catch {
      /* ignore */
    }
  }, [items, ready]);

  const add = useCallback((flavorId: FlavorId, amount = 1) => {
    const n = Math.max(1, amount);
    setItems((prev) => {
      const existing = prev.find((l) => l.flavorId === flavorId);
      if (existing) {
        return prev.map((l) =>
          l.flavorId === flavorId ? { ...l, quantity: l.quantity + n } : l
        );
      }
      return [...prev, { flavorId, quantity: n }];
    });
    setOpen(true);
  }, []);

  const setQuantity = useCallback((flavorId: FlavorId, qty: number) => {
    const next = Math.max(0, Math.floor(qty));
    setItems((prev) => {
      if (next === 0) return prev.filter((l) => l.flavorId !== flavorId);
      return prev.map((l) =>
        l.flavorId === flavorId ? { ...l, quantity: next } : l
      );
    });
  }, []);

  const remove = useCallback((flavorId: FlavorId) => {
    setItems((prev) => prev.filter((l) => l.flavorId !== flavorId));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const quantity = useMemo(
    () => items.reduce((sum, l) => sum + l.quantity, 0),
    [items]
  );

  const total = useMemo(
    () =>
      items.reduce((sum, l) => {
        const flavor = getFlavor(l.flavorId);
        return sum + (flavor?.price ?? 0) * l.quantity;
      }, 0),
    [items]
  );

  const value = useMemo(
    () => ({
      items,
      quantity,
      open,
      setOpen,
      add,
      setQuantity,
      remove,
      clear,
      total,
    }),
    [items, quantity, open, add, setQuantity, remove, clear, total]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
