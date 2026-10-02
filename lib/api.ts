// Thin client for cvg-backend. All calls go to /api/* on this origin (proxied, see next.config.ts).

export type Role = "ADMIN" | "COACH" | "TREASURER" | "CAPTAIN";
export type MemberStatus = "TRIALIST" | "ACTIVE" | "INACTIVE" | "LEFT";

export const ROLES: Role[] = ["ADMIN", "COACH", "TREASURER", "CAPTAIN"];
export const STATUSES: MemberStatus[] = ["ACTIVE", "TRIALIST", "INACTIVE", "LEFT"];

export interface Member {
  id: string;
  code: string;
  fullName: string;
  nickname?: string;
  jerseyNumber?: number;
  status: MemberStatus;
  joinedOn: string;
  roles: Role[];
  phone?: string;
}

export interface Me {
  member: Member;
  usesDefaultPasscode: boolean;
}

export interface Season {
  id: string;
  name: string;
  startsOn: string;
  endsOn: string;
  active: boolean;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public fields?: Record<string, string>,
  ) {
    super(message);
  }
}

const CLIENT = "cvg-players";

export async function api<T = void>(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  const { method = "GET", body } = options;
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      method,
      headers: {
        "X-CVG-Client": CLIENT,
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      credentials: "same-origin",
      cache: "no-store",
    });
  } catch {
    throw new ApiError(0, "offline", "No connection. Try again.");
  }

  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    if (res.status === 401 && path !== "/auth/sign-in" && typeof window !== "undefined") {
      window.location.href = "/sign-in";
    }
    throw new ApiError(
      res.status,
      data?.code ?? "error",
      data?.message ?? "Something went wrong.",
      data?.fields,
    );
  }
  return data as T;
}

export function errorMessage(e: unknown): string {
  return e instanceof ApiError ? e.message : "Something went wrong.";
}

// ---------- M2: profile, profiling, ID card ----------

export type PositionGroup = "GK" | "DEF" | "MID" | "ATT";
export type Foot = "RIGHT" | "LEFT" | "BOTH";

export interface Profile {
  memberId: string;
  photoUrl?: string;
  favouredPosition?: string;
  positionGroup?: PositionGroup;
  otherPositions: string[];
  dominantFoot?: Foot;
  weakFoot?: number;
  strengths: string[];
  weaknesses: string[];
  heightCm?: number;
  age?: number;
  stateOfOrigin?: string;
  preferredJersey?: number;
  dateOfBirth?: string;
  emergencyContact?: { name: string; phone: string };
  consentPublic?: boolean;
  complete: boolean;
  missing: string[];
}

export interface ProfileOptions {
  positions: { code: string; label: string; group: PositionGroup }[];
  feet: Foot[];
  traits: string[];
  states: string[];
  maxOtherPositions: number;
  maxTraits: number;
}

export interface Questionnaire {
  version: number;
  title: string;
  subtitle: string;
  group: PositionGroup;
  questions: { id: string; text: string; scored: boolean; options: { id: string; text: string }[] }[];
}

export interface ProfilingResult {
  version: number;
  group: PositionGroup;
  planFits: Record<string, number>;
  topPlan: string;
  mainRole?: { code: string; name: string };
  secondaryRole?: { code: string; name: string };
  label: string;
  lowConfidence: boolean;
  coachPick?: string;
}

export interface Card {
  memberId: string;
  code: string;
  fullName: string;
  nickname?: string;
  jerseyNumber?: number;
  status: MemberStatus;
  current: boolean;
  roles: Role[];
  position?: string;
  photoUrl?: string;
  season?: string;
  validUntil?: string;
  joinedOn: string;
  verifyUrl: string;
  emergencyContact?: { name: string; phone: string };
}

export const PLAN_NAMES: Record<string, string> = {
  POS: "Possession",
  CTR: "Counter",
  PRS: "Press",
  BLK: "Defend",
  DIR: "Direct",
};

/** Multipart upload; the browser sets the boundary header itself. */
export async function upload<T>(path: string, file: Blob, filename = "photo.jpg"): Promise<T> {
  const form = new FormData();
  form.append("file", file, filename);
  const res = await fetch(`/api${path}`, {
    method: "PUT",
    body: form,
    headers: { "X-CVG-Client": "cvg-players" },
    credentials: "same-origin",
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, data?.code ?? "error", data?.message ?? "Upload failed.", data?.fields);
  return data as T;
}
