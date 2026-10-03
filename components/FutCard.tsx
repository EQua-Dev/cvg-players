"use client";

import { forwardRef } from "react";
import type { Tier } from "@/lib/api";

export const FUT_W = 300;
export const FUT_H = 420;

/** Calm tier palettes: muted metals, and the club's ink + orange for the top tier. */
const TIERS: Record<Tier, { from: string; to: string; text: string; soft: string; line: string }> = {
  BRONZE: { from: "#5e4232", to: "#8d6449", text: "#f6e9dd", soft: "#d9b496", line: "rgba(246,233,221,0.25)" },
  SILVER: { from: "#7f898d", to: "#c3c9cb", text: "#15201b", soft: "#2f3b36", line: "rgba(21,32,27,0.2)" },
  GOLD: { from: "#9c7b33", to: "#d9bc6e", text: "#1e1a0e", soft: "#4a3b12", line: "rgba(30,26,14,0.22)" },
  ELITE: { from: "#0e1a16", to: "#1f4034", text: "#f4f5ef", soft: "#e8622a", line: "rgba(232,98,42,0.45)" },
};
const NONE = { from: "#1c2f27", to: "#26392f", text: "#c5cfc9", soft: "#8da096", line: "rgba(197,207,201,0.2)" };

export interface FutCardData {
  name: string;
  position?: string;
  ovr?: number;
  tier?: Tier;
  stats: { label: string; value?: number }[];
  /** A data: URL, so the card can be saved as an image. */
  photo?: string;
  jerseyNumber?: number;
  round?: string;
  published: boolean;
  /** Style badge, e.g. "Counter-attacking Inside Forward". */
  label?: string;
}

const SHAPE = "M28 0 H272 L300 28 V392 Q300 420 272 420 H28 Q0 420 0 392 V28 Z";

export const FutCard = forwardRef<SVGSVGElement, { card: FutCardData; width?: number | string }>(function FutCard({ card, width = "100%" }, ref) {
  const t = card.published && card.tier ? TIERS[card.tier] : NONE;
  const id = `fut-${card.tier ?? "none"}`;
  const left = card.stats.slice(0, 3);
  const right = card.stats.slice(3, 6);
  return (
    <svg ref={ref} xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${FUT_W} ${FUT_H}`} width={width} role="img"
      aria-label={`${card.name} ${card.ovr ?? ""} ${card.position ?? ""}`} style={{ display: "block" }}>
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={t.to} />
          <stop offset="1" stopColor={t.from} />
        </linearGradient>
        <pattern id={`${id}-stripes`} width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
          <rect width="6" height="14" fill={t.text} opacity="0.04" />
        </pattern>
        <clipPath id={`${id}-shape`}><path d={SHAPE} /></clipPath>
        <clipPath id={`${id}-photo`}><circle cx="196" cy="108" r="74" /></clipPath>
      </defs>
      <g clipPath={`url(#${id}-shape)`}>
        <path d={SHAPE} fill={`url(#${id}-bg)`} />
        <path d={SHAPE} fill={`url(#${id}-stripes)`} />
        {card.tier === "ELITE" && card.published && <rect x="0" y="0" width="300" height="6" fill="#e8622a" />}
      </g>
      <path d={SHAPE} fill="none" stroke={t.line} strokeWidth="3" />

      {/* OVR, position, badge */}
      <text x="34" y="82" fill={t.text} fontFamily="IBM Plex Mono, monospace" fontWeight="700" fontSize="56">{card.published ? card.ovr : "–"}</text>
      <text x="36" y="110" fill={t.text} fontFamily="Archivo, sans-serif" fontWeight="800" fontSize="20" letterSpacing="1">{card.position ?? ""}</text>
      <g transform="translate(36 128)">
        <path d="M14 0 L28 14 L14 28 L0 14 Z" fill="none" stroke={t.soft} strokeWidth="2.5" />
        <text x="14" y="18.5" textAnchor="middle" fill={t.text} fontFamily="Archivo, sans-serif" fontWeight="800" fontSize="9">CVG</text>
      </g>

      {/* Headshot */}
      <circle cx="196" cy="108" r="76" fill={t.line} />
      {card.photo ? (
        <image href={card.photo} x="122" y="34" width="148" height="148" clipPath={`url(#${id}-photo)`} preserveAspectRatio="xMidYMid slice" />
      ) : (
        <text x="196" y="128" textAnchor="middle" fill={t.text} opacity="0.6" fontFamily="IBM Plex Mono, monospace" fontWeight="700" fontSize="54">{card.jerseyNumber ?? ""}</text>
      )}

      {card.label && (
        <text x="150" y="203" textAnchor="middle" fill={t.soft} fontFamily="Archivo, sans-serif" fontWeight="700"
          fontSize={card.label.length > 30 ? 9.5 : 11} letterSpacing="1">{card.label.toUpperCase()}</text>
      )}

      {/* Name */}
      <text x="150" y="226" textAnchor="middle" fill={t.text} fontFamily="Archivo, sans-serif" fontWeight="900"
        fontSize={card.name.length > 14 ? 22 : 26} letterSpacing="0.5">{card.name.toUpperCase()}</text>
      <line x1="40" y1="242" x2="260" y2="242" stroke={t.line} strokeWidth="2" />

      {/* Stats */}
      {card.published ? (
        <>
          {[left, right].map((col, c) => col.map((s, r) => (
            <g key={`${c}-${r}`} transform={`translate(${c === 0 ? 52 : 172} ${282 + r * 38})`}>
              <text x="0" y="0" fill={t.text} fontFamily="IBM Plex Mono, monospace" fontWeight="700" fontSize="26">{s.value ?? "–"}</text>
              <text x="44" y="-2" fill={t.text} opacity="0.85" fontFamily="Archivo, sans-serif" fontWeight="700" fontSize="16" letterSpacing="1">{s.label}</text>
            </g>
          )))}
          <line x1="150" y1="258" x2="150" y2="352" stroke={t.line} strokeWidth="2" />
        </>
      ) : (
        <text x="150" y="312" textAnchor="middle" fill={t.text} opacity="0.75" fontFamily="Archivo, sans-serif" fontWeight="600" fontSize="16">Not enough ratings yet</text>
      )}

      <text x="150" y="392" textAnchor="middle" fill={t.text} opacity="0.7" fontFamily="Archivo, sans-serif" fontWeight="600" fontSize="11" letterSpacing="1.5">
        {[card.published && card.tier ? (card.tier === "ELITE" ? "CVG ELITE" : card.tier) : null, card.round?.toUpperCase()].filter(Boolean).join(" · ")}
      </text>
    </svg>
  );
});

/** Fetches an image and returns it as a data: URL (needed to save the card as a picture). */
export async function toDataUrl(url?: string): Promise<string | undefined> {
  if (!url) return undefined;
  try {
    const blob = await (await fetch(url)).blob();
    return await new Promise((resolve) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.readAsDataURL(blob);
    });
  } catch {
    return undefined;
  }
}

/** Saves the card as a PNG. */
export async function saveFutImage(svg: SVGSVGElement, filename: string) {
  const scale = 3;
  const canvas = document.createElement("canvas");
  canvas.width = FUT_W * scale;
  canvas.height = FUT_H * scale;
  const ctx = canvas.getContext("2d")!;
  const img = new Image();
  img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(new XMLSerializer().serializeToString(svg));
  await img.decode();
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const a = document.createElement("a");
  a.href = canvas.toDataURL("image/png");
  a.download = filename;
  a.click();
}
