"use client";

import SupportAssistant from "@/components/SupportAssistant";
import { CartProvider } from "@/context/CartContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      {children}
      <SupportAssistant />
    </CartProvider>
  );
}
