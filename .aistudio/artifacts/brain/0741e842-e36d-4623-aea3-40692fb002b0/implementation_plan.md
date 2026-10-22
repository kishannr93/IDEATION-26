# IDEATION 2026 - Production Deployment & Hardening Plan

Production-readiness transformation for the IDEATION 2026 24-hour hackathon portal (Anveshan Club, BIET Davangere). This plan details removing all demo and sample data, hardening the architecture with Supabase PostgreSQL (RLS), private storage buckets, Resend transactional emails, dual-layer admin authentication, Lighthouse performance optimizations, and full Vercel deployment documentation.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> The architectural foundation has been established based on your responses:
> - **Database & Persistence**: Supabase with clean PostgreSQL schema, strict Row Level Security (RLS) policies, and typed client SDK.
> - **Transactional Notifications**: Resend transactional email integration driven by environment variables (`RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_REPLY_TO`) with full SPF/DKIM DNS documentation.
> - **Administrative Security**: Dual-mode protection utilizing the official organizer credential guard (`gouthamga88@gmail.com` with security verification) alongside Supabase Auth administrative roles, protected on server/API routes.

---

### 1. Overview & Core Concept

- **What It Does**: A high-performance, dark-cyberpunk hackathon platform for **IDEATION 2026** (organized by Anveshan Club at BIET Davangere on 18–19 November 2026). Facilitates public event discovery, rule review, track exploration, ₹100 team registration (3–4 members), payment proof submission, participant pass generation with dynamic QR verification, and administrative management.
- **Target Audience / Persona**:
  - Engineering students (B.E/B.Tech, M.Tech, MCA) registering teams across 6 tracks (Agri Tech, Smart City, Robotics & Drones, Health Tech, Industrial IoT, Open Innovation).
  - Anveshan Club faculty and student organizers managing team check-ins, payment validation, live announcements, and schedule updates.
- **Key Value**: Provides a zero-compromise, production-grade event engine with zero mock data, rock-solid security, verifiable check-ins, automated ticket passes, and instant mobile-optimized responsiveness.

---

### 2. User Experience & Visual Design

#### Key User Flows

1. **Public Discovery Flow**:
   - Hero section with live countdown to 18 Nov 2026, 09:00 AM IST, official IDEATION emblem, prize pool breakdown (₹1,00,000 total: 1st ₹30,000, 2nd ₹20,000, 3rd ₹10,000, Track Winners 6 × ₹5,000, Special Awards ₹10,000).
   - Interactive tracks explorer with problem statements and suggested toolkits.
   - 24-hour offline schedule timeline and verified institutional backing (BEA, BIET Davangere, Anveshan Club).
   - Real faculty and student coordinator directory with contact helplines.

2. **Participant Registration & Pass Flow**:
   - 6-step registration modal: Leader credentials $\rightarrow$ Team metadata $\rightarrow$ Member details (USN, phone, food preference, t-shirt size) $\rightarrow$ Track selection $\rightarrow$ Problem statement $\rightarrow$ UPI payment proof upload (₹100 fee to official UPI ID).
   - Instant cryptographic Team ID generation (e.g., `IDN-2026-XXXX`).
   - Secure Participant Dashboard where teams log in using their Team ID and registered email to view verification status, download entry passes, or print official check-in passes.

3. **Organizer & Admin Flow**:
   - Dedicated Admin Portal with official organizer verification gate.
   - Live dashboard: Team review, payment screenshot inspector, one-click verification, manual check-in toggle with QR scanner input, broadcast announcement composer, and core team editor.
   - Clean empty states ("No registrations yet", "No announcements published") with intuitive action buttons.

#### Visual Identity & Theme

- **Aesthetic Direction**: High-tech cyber-laboratory atmosphere with deep navy backdrops, glowing cyan accents, and crisp typography.
- **Color Palette**:
  - Background Base: `#050B1A` and `#030712` (deep cosmos).
  - Surface Elevation: `#0C1630` with border accents in `#78AAFF`/20 and `#35E0FF`/30.
  - Primary Accent: Electric Cyan (`#35E0FF`), Magenta Neon (`#FF4FD8`), Amber Gold (`#F59E0B`).
- **Typography & Hierarchy**:
  - Display & Headings: `Orbitron` and `Rajdhani` for futuristic, geometric titles.
  - Body Text: `Inter` for high-legibility interface copy.
  - Metadata & Badges: `JetBrains Mono` for IDs, timestamps, and USN fields.
- **Zero-Pill & Metadata Discipline**:
  - Pure unboxed metadata separated by typographic dots (`·`) instead of static candy pill wrappers.
  - Interactive tabs and segmented controls rendered as intentional toggle surfaces with distinct active states.
- **Responsive Layout & Dock**:
  - Bottom navigation dock responsive across all viewports (360px mobile, 390px iPhone, 768px tablet, 1024px laptop, 1440px desktop, 1920px widescreen) without obscuring forms or modal footers.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Elimination of Mock and Demo State**:
  - *Chosen Approach*: Replace hardcoded dummy arrays in `initialData.ts` with empty default states for dynamic records (registrations, news posts). Retain only static event facts (dates, tracks, rules, prizes, verified faculty/student coordinators).
  - *Why*: Eliminates accidental data contamination during live registrations.
  - *Alternatives Considered*: Retaining demo flags or mock toggle switches was rejected to prevent organizer confusion and security exposure in production.

- **Decision 2: Supabase Schema with Row Level Security (RLS)**:
  - *Chosen Approach*: Provide complete SQL migration (`supabase/migrations/20261017000000_ideation_init.sql`) defining `teams`, `members`, `announcements`, `event_config`, and `admin_audit_logs`. Enforce RLS so public anonymous users can only insert registration forms; participants can only read their own team via secure session or Team ID + secret hash; and only verified admins can update approval states.
  - *Why*: Direct client queries without server vulnerabilities, while keeping private data protected.

- **Decision 3: Private Storage Buckets & Signed URLs**:
  - *Chosen Approach*: Configure Supabase storage bucket `payment-proofs` with private access. Only authenticated admin sessions generate signed URLs to inspect transaction screenshots.
  - *Why*: Protects student UPI transaction screenshots and college ID cards from public scraping.

- **Decision 4: Resend Transactional Email Engine**:
  - *Chosen Approach*: Dedicated API helper calling Resend API via server-side proxy route `/api/send-email` using environment variables. Automatic dispatch of HTML entry passes with embedded QR code upon admin payment verification.
  - *Why*: Reliable email delivery with high inbox deliverability, supported by custom domain SPF and DKIM.

- **Decision 5: Hybrid State Synchronization**:
  - *Chosen Approach*: App operates with seamless client fallback to local encrypted cache if environment keys are missing, allowing the client interface to function locally while connecting directly to Supabase when production environment variables are supplied.

---

### 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        IDEATION 2026 Portal                            │
├──────────────────────────────────┬─────────────────────────────────────┤
│         Public Experience        │         Admin Control Deck          │
│  • Hero, Countdown & Emblems     │  • Official Email + Security Gate   │
│  • 6 Domain Tracks & Problem St. │  • Registrations Verification Queue │
│  • ₹1,00,000 Prizes Breakdown    │  • Payment Proof Inspector          │
│  • 24-Hour Schedule Timeline     │  • Manual & QR Check-in System      │
│  • Anveshan Core Team Directory  │  • Real-time News Publisher         │
│  • Rules & Evaluation Rubrics    │  • Event Settings Manager           │
├──────────────────────────────────┴─────────────────────────────────────┤
│                       Participant Dashboard & Pass                      │
│   • Team ID / Pass Lookup        • Printable Badge & Entry QR Pass     │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      Security & Persistence Layer                      │
├──────────────────────────────────┬─────────────────────────────────────┤
│         Supabase Client          │             API Routes              │
│  • teams (RLS: self-read/insert) │  • /api/send-email (Resend engine)  │
│  • members (foreign key to team) │  • /api/verify-admin (Server guard) │
│  • announcements (RLS: pub-read) │  • Security Headers (CSP, HSTS)     │
│  • storage: payment-proofs (priv)│  • Rate Limiting & Input Sanitize   │
└────────────────────────────────────────────────────────────────────────┘
```

#### Database Schema Overview

```sql
-- Teams Table
CREATE TABLE public.teams (
  id VARCHAR(20) PRIMARY KEY, -- e.g. IDN-0001
  team_name VARCHAR(100) NOT NULL,
  college VARCHAR(200) NOT NULL,
  city VARCHAR(100) NOT NULL,
  department VARCHAR(100) NOT NULL,
  course VARCHAR(50) NOT NULL,
  primary_track VARCHAR(50) NOT NULL,
  backup_track VARCHAR(50),
  idea_title VARCHAR(200) NOT NULL,
  idea_summary TEXT NOT NULL,
  payment_status VARCHAR(20) DEFAULT 'Pending',
  payment_txn_id VARCHAR(100),
  payment_screenshot_url TEXT,
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  checked_in BOOLEAN DEFAULT FALSE,
  checked_in_at TIMESTAMPTZ,
  leader_email VARCHAR(150) NOT NULL,
  access_hash VARCHAR(128) NOT NULL
);

-- Members Table
CREATE TABLE public.members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id VARCHAR(20) REFERENCES public.teams(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  usn VARCHAR(30) NOT NULL,
  branch VARCHAR(50) NOT NULL,
  year VARCHAR(20) NOT NULL,
  tshirt_size VARCHAR(10) NOT NULL,
  food_preference VARCHAR(20) NOT NULL,
  is_leader BOOLEAN DEFAULT FALSE
);

-- Announcements Table
CREATE TABLE public.announcements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(50) DEFAULT 'Update',
  pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  author VARCHAR(100) DEFAULT 'Anveshan Core Team'
);
```

#### Row Level Security Policies

- `teams`:
  - `anon_insert`: `true` (allow prospective teams to submit registration).
  - `participant_select`: `auth.uid() = team_id` or `access_hash = request.header`.
  - `admin_all`: restricted to users with `admin` claims or authenticated admin service role.
- `payment-proofs` bucket:
  - Upload allowed for registration flow.
  - Download/read restricted to admin service role via time-limited signed URLs.

---

### 5. Implementation Roadmap (Tasks In Order)

1. **Remove All Sample & Mock Content**:
   - Cleanse `src/data/initialData.ts`: set `initialRegisteredTeams = []`, `initialAnnouncements = []`, and delete mock helper scripts.
   - Remove "Reset Demo Data" and demo auto-fill pills in `AdminPanel.tsx` and `ParticipantDashboard.tsx`.
   - Implement helpful zero-data empty states in Admin lists ("No registrations received yet", "No announcements posted").
   - Ensure UPI ID, payee name, and contact details derive from environment variables or admin settings with sensible production defaults.

2. **Security & Database Hardening**:
   - Create `supabase/migrations/20261017000000_ideation_init.sql` with schema, tables, indices, RLS policies, and private bucket setup.
   - Create `.env.example` documenting all configuration keys without secrets.
   - Create `src/lib/supabase.ts` for clean environment-backed client instantiation.
   - Implement input validation, rate limiting helper, and secure headers in `vite.config.ts` / server setup.
   - Secure the Admin access flow: verify `gouthamga88@gmail.com` + security code with server-side validation.

3. **Production Build & Quality**:
   - Run typecheck (`tsc --noEmit`) and fix all potential warnings.
   - Add custom 404 and 500 error views.
   - Optimize bundle size, lazy-load heavy components, and ensure responsive rendering across 360px to 1920px viewports.
   - Verify print entry pass CSS layout for physical printing.

4. **Email, SEO & Analytics**:
   - Create transactional email templates and dispatch utility (`src/lib/email.ts`) for Resend.
   - Add dynamic canonical tags, Open Graph meta tags, Twitter card tags, `sitemap.xml`, `robots.txt`, and Schema.org `Event` JSON-LD.
   - Integrate optional Plausible/GA4 analytics behind environment flags (`VITE_ANALYTICS_ID`).
   - Add Terms, Privacy Policy, and Rules views with authentic event guidelines.

5. **Deployment & Documentation**:
   - Add `vercel.json` with SPA routing and security headers.
   - Write comprehensive `README.md`, `ADMIN_GUIDE.md`, and `LAUNCH_CHECKLIST.md`.
   - Prepare final report covering removals, changes, environment variable guide, manual steps, and risk mitigation.
