import type { Member, MemberStatus, Role } from "./api";

export const ROLE_LABEL: Record<Role, string> = {
  ADMIN: "Admin",
  COACH: "Coach",
  TREASURER: "Treasurer",
  CAPTAIN: "Captain",
};

export const STATUS_LABEL: Record<MemberStatus, string> = {
  ACTIVE: "Active",
  TRIALIST: "Trialist",
  INACTIVE: "Inactive",
  LEFT: "Left",
};

export function firstName(m: Pick<Member, "fullName" | "nickname">): string {
  return m.nickname || m.fullName.split(" ")[0];
}

export function greeting(now = new Date()): string {
  const h = now.getHours();
  return h < 12 ? "Morning" : h < 17 ? "Afternoon" : "Evening";
}

export function jersey(n?: number): string {
  return n == null ? "–" : String(n).padStart(2, "0");
}

export function shortDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}

/** 200000 kobo → "₦2,000". */
export function naira(kobo: number): string {
  const n = Math.abs(kobo) / 100;
  const s = n.toLocaleString("en-NG", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });
  return `${kobo < 0 ? "−" : ""}₦${s}`;
}

export function dayMonth(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/** "WEDNESDAY" for the big card, "WED 16 JUL" for lists. */
export function weekdayLong(dateIso: string): string {
  return new Date(dateIso + "T00:00:00").toLocaleDateString("en-GB", { weekday: "long" }).toUpperCase();
}

export function sessionDay(dateIso: string): string {
  return new Date(dateIso + "T00:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }).toUpperCase().replace(",", "");
}

/** "17:30:00" → "5:30PM" */
export function clock(time: string): string {
  const [h, m] = time.split(":").map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")}${h < 12 ? "AM" : "PM"}`;
}
