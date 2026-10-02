"use client";

import { forwardRef } from "react";
import type { Card } from "@/lib/api";
import { ROLE_LABEL, jersey } from "@/lib/format";

// Card proportions match a real ID card (85.6 × 54 mm).
export const CARD_W = 856;
export const CARD_H = 540;

const INK = "#0e1a16";
const SURFACE = "#16261f";
const LINE = "#26392f";
const TEXT = "#edefe7";
const MUTED = "#8da096";
const ORANGE = "#e8622a";
const TEAL = "#2a8c99";
const GOOD = "#46c08a";
const FONT = "Archivo, 'Helvetica Neue', Arial, sans-serif";
const MONO = "'IBM Plex Mono', 'Courier New', monospace";

function nameLines(name: string): { lines: string[]; size: number } {
  if (name.length <= 16) return { lines: [name], size: 46 };
  if (name.length <= 21) return { lines: [name], size: 38 };
  const words = name.split(" ");
  const first = words.slice(0, Math.ceil(words.length / 2)).join(" ");
  return { lines: [first, words.slice(Math.ceil(words.length / 2)).join(" ")], size: 36 };
}

/** Front: photo, name, member ID, jersey, season. `photo` must be a data: URL so the card can be saved as an image. */
export const CardFront = forwardRef<SVGSVGElement, { card: Card; photo?: string }>(function CardFront({ card, photo }, ref) {
  const { lines, size } = nameLines(card.fullName.toUpperCase());
  const roles = card.roles.map((r) => ROLE_LABEL[r]).join(" · ");
  const subtitle = [card.position, roles].filter(Boolean).join(" · ");
  const nameTop = 190;
  return (
    <svg ref={ref} xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${CARD_W} ${CARD_H}`} role="img" aria-label={`CVG ID card for ${card.fullName}`}>
      <defs>
        <clipPath id="photoClip"><rect x="44" y="118" width="232" height="290" rx="14" /></clipPath>
        <clipPath id="cardFront"><rect width={CARD_W} height={CARD_H} rx="28" /></clipPath>
        <linearGradient id="sheen" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1b2e26" />
          <stop offset="1" stopColor={INK} />
        </linearGradient>
      </defs>
      <g clipPath="url(#cardFront)">
      <rect width={CARD_W} height={CARD_H} fill="url(#sheen)" />
      <rect x="0" y="0" width={CARD_W} height="8" fill={ORANGE} />

      {/* header */}
      <path d="M58 52 l14 -14 l14 14 l-14 14 z" fill={ORANGE} />
      <text x="100" y="62" fill={TEXT} fontFamily={FONT} fontWeight="800" fontSize="30" letterSpacing="2">CVG FC</text>
      <text x="100" y="86" fill={MUTED} fontFamily={FONT} fontWeight="600" fontSize="14" letterSpacing="4">ABUJA · MEMBER</text>
      <text x={CARD_W - 44} y="62" textAnchor="end" fill={MUTED} fontFamily={MONO} fontWeight="600" fontSize="22">{card.code}</text>

      {/* photo */}
      <rect x="44" y="118" width="232" height="290" rx="14" fill={SURFACE} stroke={LINE} strokeWidth="2" />
      {photo ? (
        <image href={photo} x="44" y="118" width="232" height="290" preserveAspectRatio="xMidYMid slice" clipPath="url(#photoClip)" />
      ) : (
        <text x="160" y="285" textAnchor="middle" fill={MUTED} fontFamily={MONO} fontWeight="600" fontSize="72">{jersey(card.jerseyNumber)}</text>
      )}

      {/* name & details */}
      {lines.map((l, i) => (
        <text key={i} x="312" y={nameTop + i * (size + 4)} fill={TEXT} fontFamily={FONT} fontWeight="900" fontSize={size} letterSpacing="-0.5">{l}</text>
      ))}
      {card.nickname && (
        <text x="312" y={nameTop + lines.length * (size + 4) + 4} fill={MUTED} fontFamily={FONT} fontWeight="500" fontSize="22">“{card.nickname}”</text>
      )}
      {subtitle && (
        <text x="312" y="318" fill={TEAL} fontFamily={FONT} fontWeight="700" fontSize="20">{subtitle}</text>
      )}
      <text x="312" y="372" fill={MUTED} fontFamily={FONT} fontWeight="600" fontSize="13" letterSpacing="3">JOINED</text>
      <text x="312" y="398" fill={TEXT} fontFamily={FONT} fontWeight="600" fontSize="20">
        {new Date(card.joinedOn + "T00:00:00").toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
      </text>

      {/* jersey */}
      <text x={CARD_W - 44} y="408" textAnchor="end" fill={ORANGE} fontFamily={MONO} fontWeight="600" fontSize="120">{jersey(card.jerseyNumber)}</text>

      {/* footer */}
      <line x1="44" y1="440" x2={CARD_W - 44} y2="440" stroke={LINE} strokeWidth="2" />
      <circle cx="58" cy="484" r="8" fill={card.current ? GOOD : MUTED} />
      <text x="76" y="491" fill={card.current ? GOOD : MUTED} fontFamily={FONT} fontWeight="700" fontSize="18" letterSpacing="2">
        {card.current ? "CURRENT MEMBER" : "NOT CURRENT"}
      </text>
      <text x={CARD_W - 44} y="491" textAnchor="end" fill={MUTED} fontFamily={FONT} fontWeight="600" fontSize="18">
        {card.season ? `Season ${card.season}` : ""}
      </text>
      </g>
    </svg>
  );
});

/** Back: QR code to the public verify page, emergency contact, return note. `qr` is an SVG data: URL. */
export const CardBack = forwardRef<SVGSVGElement, { card: Card; qr?: string }>(function CardBack({ card, qr }, ref) {
  const shortUrl = card.verifyUrl.replace(/^https?:\/\//, "").replace(/\/[0-9a-f]+$/, "");
  return (
    <svg ref={ref} xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${CARD_W} ${CARD_H}`} role="img" aria-label="Back of the ID card">
      <defs><clipPath id="cardBack"><rect width={CARD_W} height={CARD_H} rx="28" /></clipPath></defs>
      <g clipPath="url(#cardBack)">
      <rect width={CARD_W} height={CARD_H} fill={INK} />
      <rect x="0" y={CARD_H - 8} width={CARD_W} height="8" fill={ORANGE} />

      <rect x="44" y="60" width="300" height="300" rx="18" fill="#ffffff" />
      {qr && <image href={qr} x="56" y="72" width="276" height="276" />}
      <text x="194" y="400" textAnchor="middle" fill={TEXT} fontFamily={FONT} fontWeight="700" fontSize="20">Scan to verify</text>
      <text x="194" y="428" textAnchor="middle" fill={MUTED} fontFamily={MONO} fontWeight="500" fontSize="14">{shortUrl}</text>

      <text x="384" y="92" fill={MUTED} fontFamily={FONT} fontWeight="600" fontSize="13" letterSpacing="3">IN AN EMERGENCY CALL</text>
      <text x="384" y="128" fill={TEXT} fontFamily={FONT} fontWeight="700" fontSize="26">{card.emergencyContact?.name ?? "—"}</text>
      <text x="384" y="162" fill={TEXT} fontFamily={MONO} fontWeight="600" fontSize="24">{card.emergencyContact?.phone ?? ""}</text>

      <line x1="384" y1="200" x2={CARD_W - 44} y2="200" stroke={LINE} strokeWidth="2" />
      <text x="384" y="242" fill={MUTED} fontFamily={FONT} fontWeight="600" fontSize="13" letterSpacing="3">MEMBER</text>
      <text x="384" y="276" fill={TEXT} fontFamily={FONT} fontWeight="700" fontSize="22">{card.fullName}</text>
      <text x="384" y="306" fill={MUTED} fontFamily={MONO} fontWeight="600" fontSize="20">{card.code}</text>

      <text x="384" y="388" fill={MUTED} fontFamily={FONT} fontWeight="500" fontSize="17">If found, please return to</text>
      <text x="384" y="414" fill={TEXT} fontFamily={FONT} fontWeight="700" fontSize="17">CVG FC · Abuja</text>
      <text x="384" y="470" fill={MUTED} fontFamily={FONT} fontWeight="500" fontSize="14">
        {card.validUntil ? `Valid until ${new Date(card.validUntil + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}` : ""}
      </text>
      </g>
    </svg>
  );
});

/** Renders both sides into one PNG (front over back) and starts a download. */
export async function saveCardImage(front: SVGSVGElement, back: SVGSVGElement, filename: string) {
  const scale = 2;
  const gap = 40;
  const canvas = document.createElement("canvas");
  canvas.width = CARD_W * scale;
  canvas.height = (CARD_H * 2 + gap) * scale;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(scale, scale);
  for (const [svg, y] of [[front, 0], [back, CARD_H + gap]] as const) {
    const xml = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(xml);
    await img.decode();
    ctx.drawImage(img, 0, y, CARD_W, CARD_H);
  }
  const url = canvas.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
}
