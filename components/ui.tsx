"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { jersey } from "@/lib/format";

export function JerseyBadge({ n, size = "md" }: { n?: number; size?: "md" | "lg" }) {
  return <span className={`jersey jersey-${size}`}>{jersey(n)}</span>;
}

export function TopBar({ back }: { back?: string }) {
  return (
    <header className="topbar">
      {back ? (
        <Link href={back} className="back">← Back</Link>
      ) : (
        <span className="brand"><span className="brand-mark">◆</span> CVG</span>
      )}
    </header>
  );
}

const TABS = [
  { href: "/", label: "Home", icon: "M4 10.5 12 4l8 6.5M6 9.5V20h12V9.5" },
  { href: "/squad", label: "Squad", icon: "M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3.5 19a5.5 5.5 0 0 1 11 0M16 6.5a3 3 0 0 1 0 5.5M17 14.5a5.5 5.5 0 0 1 3.5 4.5" },
  { href: "/me", label: "Me", icon: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 20a8 8 0 0 1 16 0" },
];

export function BottomNav() {
  const path = usePathname();
  return (
    <nav className="bottomnav">
      {TABS.map((t) => {
        const active = t.href === "/" ? path === "/" : path === t.href || path.startsWith(t.href + "/");
        return (
          <Link key={t.href} href={t.href} className={`tab ${active ? "tab-on" : ""}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d={t.icon} />
            </svg>
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
