# IDEATION 2026 - Official Hackathon Portal

> **National 24-Hour Offline Hackathon**  
> Organized by **Anveshan Club**, Bapuji Institute of Engineering and Technology (BIET), Davangere  
> **Dates**: 18 & 19 November 2026 · **Prize Pool**: ₹1,00,000 · **Team Size**: 3–4 Members · **Entry Fee**: ₹100 / team

---

## 🚀 Overview

The IDEATION 2026 web platform is a dark-cyberpunk, high-performance event management system and participant registration portal. It provides end-to-end team management, track selection, problem statement submissions, UPI QR fee verification, live ticket passes with dynamic QR validation, announcement feeds, and a comprehensive organizer administration desk.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite 8, Tailwind CSS v4
- **State & Context**: Reactive React Context with dual local storage + Supabase PostgreSQL synchronization
- **Database & RLS**: Supabase (PostgreSQL 15+) with Row Level Security (RLS) policies and private storage buckets
- **Transactional Email**: Resend API for ticket pass generation and payment approvals
- **Animations & Dynamics**: GSAP 3 with ScrollTrigger, Canvas Confetti
- **QR Engine**: Client-side `qrcode` generator (zero third-party tracking dependencies)
- **Deployment**: Vercel ready with pre-configured `vercel.json` SPA routing and hardened HTTP security headers

---

## 📁 Project Structure

```
├── .env.example                     # Environment variable blueprint with zero secrets
├── vercel.json                      # Vercel deployment & security headers configuration
├── index.html                       # HTML5 entry with Event Schema.org JSON-LD & OG tags
├── supabase/
│   └── migrations/
│       └── 20261017000000_ideation_init.sql # Clean schema, RLS policies & private storage
├── public/
│   ├── favicon.jpg                  # Official favicon
│   ├── ideation_logo.jpg            # High-res emblem
│   ├── robots.txt                   # Search crawler directives
│   └── sitemap.xml                  # XML sitemap
└── src/
    ├── assets/images/               # Verified event imagery (logo, trophy, arena)
    ├── components/
    │   ├── Navbar.tsx               # Top navigation with live event state
    │   ├── HeroSection.tsx          # 24-hour countdown, track teasers, logo emblem
    │   ├── AboutSection.tsx         # Event background, BIET & BEA legacy
    │   ├── TracksSection.tsx        # 6 Domain tracks, sample problems & toolkits
    │   ├── PrizesSection.tsx        # ₹1,00,000 breakdown (1st, 2nd, 3rd, 6 Tracks, Specials)
    │   ├── ScheduleSection.tsx      # 24-hour chronological timeline
    │   ├── RulesSection.tsx         # Eligibility, team sizing, code integrity rubrics
    │   ├── NewsSection.tsx          # Real-time announcements with category filters
    │   ├── CoreTeamSection.tsx      # Faculty & student coordinator directory
    │   ├── SponsorsGallerySection.tsx # Host institution credentials & visual showcase
    │   ├── RegistrationModal.tsx    # 6-step registration & local UPI QR payment
    │   ├── ParticipantDashboard.tsx # Team login, printable badge & entry pass
    │   ├── AdminPanel.tsx           # Organizer desk (payments, news, core team, check-in)
    │   ├── NotFoundPage.tsx         # Cyber-styled 404 page
    │   ├── Error500Page.tsx         # System anomaly 500 page
    │   └── ErrorBoundary.tsx        # React error boundary component
    ├── context/
    │   └── HackathonContext.tsx     # Clean production state with zero mock entries
    ├── data/
    │   └── initialData.ts           # Real event rules, tracks, prizes, and core team
    └── lib/
        ├── email.ts                 # Resend transactional email utility
        └── supabase.ts              # Supabase client initializer
```

---

## ⚙️ Local Development Setup

1. **Clone & Install**:
   ```bash
   git clone <repo-url>
   cd ideation-hackathon
   npm install
   ```

2. **Configure Environment Variables**:
   ```bash
   cp .env.example .env.local
   ```
   Fill in your Supabase credentials, Resend key, and UPI payment details.

3. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

4. **Verify TypeScript & Production Build**:
   ```bash
   npm run lint
   npm run build
   ```

---

## 🔐 Administrative Access & Content Editing

### Official Organizer Login
- Navigate to `/?view=admin` or click **Admin** in the navigation bar.
- Use any authorized official organizer credential:
  - `ktarunkumar1832@gmai.com` · Security Passkey: `183220` (Tarun Kumar K)
  - `srmegha2009@gmail.com` · Security Passkey: `200906` (Megha S R)
  - `kishannr93@gmail.com` · Security Passkey: `150140` (Kishan N R)
  - `bietdvganveshanclub@gmail.com` · Security Passkey: `111890` (Anveshan Club)
  - Or custom credentials configured in `VITE_ADMIN_EMAIL` and `VITE_ADMIN_SECURITY_CODE`.

### What Admins Can Manage:
- **Teams & Registrations**: Review all registered teams, member lists, USNs, and phone numbers.
- **Payment Verification**: Inspect UPI reference numbers and uploaded payment screenshots. One click marks payment as verified and dispatches an automated ticket pass to the team leader.
- **Event Day Check-In & Pass Printing**: Live camera QR scanner or image drag-and-drop to verify attendees in real time, mark desk attendance, and print official physical entry badges directly.
- **Broadcast Announcements**: Post real-time updates (pinned alerts, schedule shifts, lab workbench availability).
- **Core Team Directory**: Add, edit, or reorder faculty and student coordinators shown on the public site.
- **CSV Data Export**: One-click download of full participant directories formatted for Excel / Google Sheets.

---

## 🚢 Deployment to Vercel

1. Push code to your GitHub repository.
2. In [Vercel Dashboard](https://vercel.com), click **Add New Project** and import the repository.
3. Under **Build and Output Settings**, Vite is auto-detected (`npm run build`, output: `dist`).
4. Under **Environment Variables**, add the keys from `.env.example`.
5. Click **Deploy**.
