"use client";

import Link, { type LinkProps } from "next/link";
import { useSession } from "next-auth/react";
import type { AnchorHTMLAttributes, MouseEvent } from "react";
import { useLoginRequired } from "@/components/LoginRequiredDialog";
import { needsMemberLogin } from "@/lib/member-routes";

type MemberOnlyLinkProps = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href">;

export default function MemberOnlyLink({
  href,
  onClick,
  children,
  ...rest
}: MemberOnlyLinkProps) {
  const { status } = useSession();
  const { askLogin } = useLoginRequired();
  const hrefString = typeof href === "string" ? href : (href.pathname ?? "/");
  const locked = status === "unauthenticated" && needsMemberLogin(hrefString);

  function handleClick(e: MouseEvent<HTMLAnchorElement>) {
    if (locked) {
      e.preventDefault();
      askLogin(hrefString);
    }
    onClick?.(e);
  }

  return (
    <Link href={href} onClick={handleClick} {...rest}>
      {children}
    </Link>
  );
}
