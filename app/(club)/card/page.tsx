"use client";

import Link from "next/link";
import QRCode from "qrcode";
import { useEffect, useRef, useState } from "react";
import { api, errorMessage, type Card } from "@/lib/api";
import { CardBack, CardFront, saveCardImage } from "@/components/IdCard";
import { useToast } from "@/components/Toast";
import { TopBar } from "@/components/ui";

/** Inlines the photo so the card can be saved as one self-contained image. */
async function toDataUrl(url: string): Promise<string | undefined> {
  const res = await fetch(url, { credentials: "same-origin" });
  if (!res.ok) return undefined;
  const blob = await res.blob();
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => resolve(undefined);
    reader.readAsDataURL(blob);
  });
}

export default function CardPage() {
  const toast = useToast();
  const [card, setCard] = useState<Card | null>(null);
  const [photo, setPhoto] = useState<string>();
  const [qr, setQr] = useState<string>();
  const [flipped, setFlipped] = useState(false);
  const front = useRef<SVGSVGElement>(null);
  const back = useRef<SVGSVGElement>(null);

  useEffect(() => {
    api<Card>("/me/card").then(async (c) => {
      setCard(c);
      const svg = await QRCode.toString(c.verifyUrl, { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: "#0e1a16", light: "#ffffff" } });
      setQr("data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg));
      if (c.photoUrl) setPhoto(await toDataUrl(c.photoUrl));
    });
  }, []);

  if (!card) return <div className="center-screen"><span className="spinner" /></div>;

  return (
    <>
      <TopBar back="/" />
      <main className="page">
        <div className="spread">
          <h1 className="h1">ID card</h1>
          <span className="muted small">Tap to flip</span>
        </div>

        <div
          className="flip"
          onClick={() => setFlipped(!flipped)}
          role="button"
          aria-pressed={flipped}
          aria-label="Flip card"
          tabIndex={0}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setFlipped(!flipped)}
        >
          <div className={`flip-inner ${flipped ? "flipped" : ""}`}>
            <div className="flip-face"><CardFront ref={front} card={card} photo={photo} /></div>
            <div className="flip-face flip-back"><CardBack ref={back} card={card} qr={qr} /></div>
          </div>
        </div>

        {!card.photoUrl && (
          <Link href="/setup" className="notice notice-caution">Add your photo to finish your card →</Link>
        )}

        <button
          className="btn btn-primary btn-block"
          onClick={async () => {
            try {
              await saveCardImage(front.current!, back.current!, `CVG-ID-${card.code}.png`);
              toast.show("Saved ✓");
            } catch (e) {
              toast.show(errorMessage(e), "alert");
            }
          }}
        >
          Save to phone
        </button>
        <p className="muted small" style={{ textAlign: "center", margin: 0 }}>
          Anyone can scan the QR code to check you&apos;re a current CVG member.
        </p>
      </main>
    </>
  );
}
