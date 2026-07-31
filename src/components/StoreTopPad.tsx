"use client";

import type { ReactNode } from "react";
import {
  storeTopPadClass,
  useCompactMobileStoreChrome,
} from "@/hooks/useStoreChrome";

/** Applies store-header top padding; compact on mobile when logged in. */
export default function StoreTopPad({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const compact = useCompactMobileStoreChrome();
  return (
    <div className={`${storeTopPadClass(compact)} ${className}`.trim()}>
      {children}
    </div>
  );
}
