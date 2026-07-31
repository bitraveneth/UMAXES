"use client";

import { SessionProvider } from "next-auth/react";
import BuyerMobileNav from "@/components/BuyerMobileNav";
import SupportAssistant from "@/components/SupportAssistant";
import { CartProvider } from "@/context/CartContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <CartProvider>
        {children}
        <BuyerMobileNav />
        <SupportAssistant />
      </CartProvider>
    </SessionProvider>
  );
}
