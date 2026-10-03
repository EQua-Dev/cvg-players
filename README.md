# cvg-players

**The Club**: the members' web app for CVG FC.
Part of the CVG FC Club Management System, built by Devstrike Digital Limited.

- **Stack:** Next.js 16 · React 19 · TypeScript
- **API:** [cvg-backend](https://github.com/EQua-Dev/cvg-backend) (Kotlin Spring Boot)
- **Plan:** [content plan](https://github.com/EQua-Dev/cvg-backend/blob/main/docs/CONTENT_PLAN.md)

## What's in it

| Screen | What it does |
|---|---|
| Sign in | Phone + passcode. First time: last 4 digits of the phone |
| Set passcode | Short steps, one box per screen, with "Skip for now" on first sign-in |
| Home | Member pass (tap for ID card), your style, and a "For you" to-do list (photo, questionnaire, passcode) |
| **Training** | Your attendance %, streak and sessions, every upcoming session with **I'm in / I'm out** (in by default; out asks why with one tap; locks 2h before), and your record. Home shows the next session with the same buttons |
| Squad | Current squad by jersey, with you highlighted |
| **My dues** | What you owe (or "All paid ✓"), each open collection with progress, and your payment history including corrections. Home shows "Pay ₦X" when something is owed |
| Me | Profile, edit profile, ID card, how I play, change passcode, sign out |
| **Join** `/join/{token}` | From the admin's WhatsApp link: welcome → pick a passcode → signed in → profile setup |
| **Profile setup** | 10 one-tap steps: photo (cropped and shrunk on the phone), main position, other positions, foot, weak foot, strengths, weaknesses, about you, emergency contact, photo permission. Saved after every step, resumes where you stopped |
| **How do you play?** | 15 one-tap questions for your position group, auto-advancing; resumes if you leave. Result: label, game plan bars, share on WhatsApp |
| **ID card** | Front and back drawn as SVG; tap to flip; QR links to the public verify page; "Save to phone" downloads a PNG |

Dark "pitch at night" theme with orange accents, per the design.

## Run locally

```bash
npm install
CVG_API_URL=http://localhost:8080 npm run dev     # http://localhost:3002
```

`/api/*` is proxied to `CVG_API_URL` (server side), so the session cookie is first-party.

```bash
npm run typecheck && npm run build
```
