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

// ---------- M3: my dues ----------

export type DueState = "PAID" | "PARTIAL" | "UNPAID";

export interface MyDue {
  collectionId: string;
  title: string;
  dueDate: string;
  overdue: boolean;
  amountKobo: number;
  paidKobo: number;
  owedKobo: number;
  state: DueState;
}

export interface PaymentRecord {
  id: string;
  direction: "IN" | "OUT";
  categoryLabel: string;
  amountKobo: number;
  collection?: { id: string; name: string };
  method: "CASH" | "TRANSFER" | "POS";
  occurredOn: string;
  note?: string;
  reversesId?: string;
  reversed: boolean;
  hasReceipt: boolean;
}

export interface MyDues {
  owedKobo: number;
  open: MyDue[];
  history: PaymentRecord[];
}

// ---------- M4: training ----------

export type Availability = "IN" | "OUT";
export type OutReason = "INJURED" | "SICK" | "TRAVELLING" | "WORK" | "FAMILY" | "OTHER";
export type Mark = "PRESENT" | "LATE" | "ABSENT" | "EXCUSED";

export interface Session {
  id: string;
  startsAt: string;
  date: string;
  time: string;
  venue: string;
  kind: "COMPULSORY" | "OPTIONAL";
  impromptu: boolean;
  focus?: string;
  status: "SCHEDULED" | "CLOSED" | "CANCELLED";
  inCount: number;
  outCount: number;
  markedCount: number;
  me?: { status: Availability; reason?: OutReason; locked: boolean; lockAt: string };
  myMark?: Mark;
}

export interface MyAttendance {
  stats: {
    percent?: number;
    counted: number;
    attended: number;
    late: number;
    excused: number;
    absent: number;
    streak: number;
    extras: number;
    noShows: number;
  };
  recent: { sessionId: string; date: string; kind: "COMPULSORY" | "OPTIONAL"; focus?: string; venue: string; mark: Mark }[];
}

export const REASON_LABEL: Record<OutReason, string> = {
  INJURED: "Injured", SICK: "Sick", TRAVELLING: "Travelling", WORK: "Work", FAMILY: "Family", OTHER: "Other",
};

// ---------- M5: matches ----------

export type MatchSide = "HOME" | "AWAY" | "NEUTRAL";
export type MatchType = "FRIENDLY" | "TOURNAMENT" | "LEAGUE" | "INTERNAL";
export type MatchStatus = "SCHEDULED" | "PLAYED" | "CANCELLED";
export type GamePlan = "POS" | "CTR" | "PRS" | "BLK" | "DIR";
export type GoalKind = "OPEN_PLAY" | "PENALTY" | "FREE_KICK" | "HEADER";
export type Factor = "POSITION" | "OVR" | "PLAN" | "ATTENDANCE" | "FORM" | "DUES";

export interface MatchView {
  id: string;
  opponent: string;
  kickoffAt: string;
  date: string;
  time: string;
  meetTime?: string;
  venue: string;
  side: MatchSide;
  type: MatchType;
  teamSize: number;
  gamePlan?: GamePlan;
  planB?: GamePlan;
  kit?: string;
  feeKobo?: number;
  notes?: string;
  status: MatchStatus;
  formation?: string;
  lineupPublished: boolean;
  ourScore?: number;
  theirScore?: number;
  outcome?: "W" | "D" | "L";
  inCount: number;
  outCount: number;
  me?: { status: Availability; reason?: OutReason; locked: boolean; lockAt: string };
  myLineup?: "STARTING" | "BENCH";
  potmOpen: boolean;
  votedPotm: boolean;
  gaveOpinion: boolean;
  inSquad: boolean;
}

export interface FormationSlot { idx: number; position: string; x: number; y: number }
export interface Formation { name: string; teamSize: number; slots: FormationSlot[] }

export interface MatchOptions {
  formations: Formation[];
  gamePlans: { code: GamePlan; label: string }[];
  opponents: string[];
  venues: string[];
  tags: string[];
}

export interface SquadRow {
  memberId: string;
  fullName: string;
  nickname?: string;
  jerseyNumber?: number;
  position?: string;
  availability: Availability;
  reason?: OutReason;
}

export interface SlotView {
  idx: number;
  position?: string;
  x?: number;
  y?: number;
  memberId?: string;
  guestName?: string;
  name?: string;
  jerseyNumber?: number;
  photoUrl?: string;
}

export interface LineupView {
  formation: string;
  slots: SlotView[];
  bench: SlotView[];
  benchSize: number;
  captainId?: string;
  penaltyTakerId?: string;
  freeKickTakerId?: string;
  cornerTakerId?: string;
  publishedAt?: string;
}

export interface PersonRef { memberId?: string; guestName?: string; name: string; jerseyNumber?: number }

export interface ResultView {
  ourScore: number;
  theirScore: number;
  goals: { seq: number; scorer?: PersonRef; ownGoal: boolean; assist?: PersonRef; minute?: number; kind?: GoalKind }[];
  appearances: { person: PersonRef; started: boolean; position?: string }[];
  cards: { person: PersonRef; colour: "YELLOW" | "RED"; minute?: number }[];
  cleanSheets: string[];
  feeCollectionId?: string;
}

export interface Tally { memberId: string; name: string; votes: number }

export interface PotmView {
  open: boolean;
  closesAt?: string;
  canVote: boolean;
  myVote?: string;
  votesCast: number;
  voters: number;
  nominees: { memberId: string; name: string; jerseyNumber?: number; photoUrl?: string }[];
  tally?: Tally[];
  winners: Tally[];
}

export interface OpinionView {
  authorId?: string;
  authorName?: string;
  commendTags: string[];
  commendText?: string;
  critiqueTags: string[];
  critiqueText?: string;
  selfRating?: number;
}

export interface OpinionsView {
  count: number;
  tags: { tag: string; praised: number; criticised: number }[];
  items: OpinionView[];
  mine?: OpinionView;
  allTags: string[];
}

export interface MatchDetail {
  match: MatchView;
  lineup?: LineupView;
  result?: ResultView;
  potm?: PotmView;
  opinions?: OpinionsView;
}

export const TYPE_LABEL: Record<MatchType, string> = { FRIENDLY: "Friendly", TOURNAMENT: "Tournament", LEAGUE: "League", INTERNAL: "Internal" };
export const SIDE_LABEL: Record<MatchSide, string> = { HOME: "Home", AWAY: "Away", NEUTRAL: "Neutral" };

export interface RecordMatch { matchId: string; date: string; opponent: string; ourScore: number; theirScore: number; started: boolean; goals: number; assists: number; potm: boolean }
export interface MatchRecord { played: number; started: number; goals: number; assists: number; potm: number; cleanSheets: number; recent: RecordMatch[] }
