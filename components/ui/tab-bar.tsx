"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/cn";

import { Icon, type IconName } from "./icon";

type Tab = { href: string; label: string; icon: IconName; badge?: number };

const TABS: Tab[] = [
  { href: "/", label: "Today", icon: "today" },
  { href: "/closet", label: "Closet", icon: "closet" },
  { href: "/outfits", label: "Outfits", icon: "outfits" },
  { href: "/history", label: "History", icon: "history" },
];

function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

/** Fixed bottom navigation. `badges` maps a tab href to a count (e.g. drafts on Closet). */
export function TabBar({ badges }: { badges?: Partial<Record<string, number>> }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Main" className="fc-tabbar">
      {TABS.map((tab) => {
        const active = isActive(pathname, tab.href);
        const badge = badges?.[tab.href];
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn("fc-tab", active && "is-active")}
          >
            <span className="fc-tab__pill">
              <Icon name={tab.icon} />
            </span>
            <span className="fc-tab__label">{tab.label}</span>
            {badge ? (
              <span className="fc-tab__badge">
                {badge}
                <span className="sr-only"> new</span>
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
