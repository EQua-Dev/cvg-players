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
