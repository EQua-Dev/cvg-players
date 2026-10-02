# cvg-players

**The Club**: the members' web app for CVG FC.
Part of the CVG FC Club Management System, built by Devstrike Digital Limited.

- **Stack:** Next.js 16 · React 19 · TypeScript
- **API:** [cvg-backend](https://github.com/EQua-Dev/cvg-backend) (Kotlin Spring Boot)
- **Plan:** [content plan](https://github.com/EQua-Dev/cvg-backend/blob/main/docs/CONTENT_PLAN.md)

## What's in it (M1)

| Screen | What it does |
|---|---|
| Sign in | Phone + passcode. First time: last 4 digits of the phone |
| Set passcode | Short steps, one box per screen, with "Skip for now" on first sign-in |
| Home | Member pass (name, CVG ID, jersey, status) and a "For you" to-do list |
| Squad | Current squad by jersey, with you highlighted |
| Me | Profile, change passcode, sign out |

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
