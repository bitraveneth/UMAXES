"use client";

import { SessionProvider } from "next-auth/react";
import BuyerMobileNav from "@/components/BuyerMobileNav";
import SupportAssistant from "@/components/SupportAssistant";
import ImpersonationBanner from "@/components/ImpersonationBanner";
import { LoginRequiredProvider } from "@/components/LoginRequiredDialog";
import { CartProvider } from "@/context/CartContext";
import { CatalogPricesProvider } from "@/context/CatalogPricesContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <LoginRequiredProvider>
        <CatalogPricesProvider>
          <CartProvider>
            <ImpersonationBanner />
            {children}
            <BuyerMobileNav />
            <SupportAssistant />
          </CartProvider>
        </CatalogPricesProvider>
      </LoginRequiredProvider>
    </SessionProvider>
  );
}
