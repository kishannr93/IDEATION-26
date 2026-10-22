# IDEATION 2026 - Production Launch Checklist

Follow these steps before opening registrations publicly to ensure 100% reliability, security, and compliance.

---

## 📋 Phase 1: Database Setup (Supabase)

- [ ] **1. Create a Supabase Project**:
  - Sign in to [Supabase](https://supabase.com).
  - Create a new project named `ideation-2026`.
  - Choose a region closest to India (e.g., `Singapore - ap-southeast-1` or `Mumbai - ap-south-1`).
  - Store your database password in a safe password manager.

- [ ] **2. Run Database Migration**:
  - In your Supabase Dashboard, go to **SQL Editor**.
  - Open `supabase/migrations/20261017000000_ideation_init.sql`.
  - Copy and paste the entire SQL file and click **Run**.
  - Verify that tables `teams`, `members`, `announcements`, `admin_profiles`, and bucket `payment-proofs` are created.

- [ ] **3. Retrieve API Keys**:
  - Go to **Project Settings** -> **API**.
  - Copy `Project URL` (e.g., `https://xyz.supabase.co`).
  - Copy `anon public` key.
  - Copy `service_role` secret (keep private).

---

## 📧 Phase 2: Transactional Email Setup (Resend & DNS)

- [ ] **1. Create Resend Account**:
  - Sign up at [Resend](https://resend.com).
  - Generate an API Key under **API Keys** and save it.

- [ ] **2. Add Your Custom Domain in Resend**:
  - Go to **Domains** -> **Add Domain** (e.g. `mail.bietdvg.edu` or `ideation2026.com`).
  - Add the following DNS records in your domain registrar (GoDaddy, Cloudflare, Namecheap, or College IT DNS):

| Type  | Name / Host                  | Value / Content                              | TTL  | Purpose       |
|-------|------------------------------|----------------------------------------------|------|---------------|
| TXT   | `resend._domainkey`          | *(Provided by Resend dashboard)*             | Auto | DKIM signing  |
| TXT   | `@` (or subdomain)           | `v=spf1 include:amazonses.com ~all`          | Auto | SPF policy    |
| TXT   | `_dmarc`                     | `v=DMARC1; p=none; rua=mailto:admin@domain`  | Auto | DMARC policy  |
| MX    | `feedback` (or as provided)  | `feedback-smtp.us-east-1.amazonses.com`      | 10   | Return path   |

- [ ] **3. Verify Domain**:
  - Click **Verify Records** in Resend. Once status turns **Verified**, your emails will reach participant inboxes without spam filtering.

---

## 💳 Phase 3: UPI Payment Details Verification

- [ ] **1. Confirm Anveshan Club Official UPI**:
  - Verify `VITE_UPI_ID`: `anveshan.biet@upi` (or college bank VPA).
  - Verify `VITE_UPI_PAYEE_NAME`: `Anveshan Club BIET`.
  - Test a test payment of ₹100 using Google Pay / PhonePe to ensure funds credit directly to the official Anveshan Club account.

---

## 🚀 Phase 4: Deploy to Vercel

- [ ] **1. Connect Repository**:
  - Import the repository in [Vercel Dashboard](https://vercel.com).
- [ ] **2. Enter Environment Variables in Vercel**:
  ```env
  VITE_APP_URL="https://ideation2026.bietdvg.edu"
  VITE_SUPABASE_URL="https://your-project.supabase.co"
  VITE_SUPABASE_ANON_KEY="your-supabase-anon-key"
  SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"
  VITE_ADMIN_EMAIL="gouthamga88@gmail.com"
  VITE_ADMIN_SECURITY_CODE="183202"
  VITE_UPI_ID="anveshan.biet@upi"
  VITE_UPI_PAYEE_NAME="Anveshan Club BIET"
  RESEND_API_KEY="re_your_api_key"
  EMAIL_FROM="IDEATION 2026 <no-reply@your-domain.com>"
  EMAIL_REPLY_TO="anveshan@bietdvg.edu"
  ```
- [ ] **3. Deploy**: Click **Deploy**. Vercel will build and assign a production URL.
- [ ] **4. Attach Custom Domain**:
  - In Vercel -> **Settings** -> **Domains**, add `ideation2026.bietdvg.edu`.
  - Add CNAME record: `cname.vercel-dns.com`.
  - SSL certificate is automatically provisioned by Let's Encrypt.

---

## 🛡️ Phase 5: Create First Super Admin & Security Verification

- [ ] **1. Organizer Credentials**:
  - Log in at `https://your-domain.com/?view=admin` using any authorized organizer account:
    - `ktarunkumar1832@gmai.com` (Passkey: `183220`)
    - `srmegha2009@gmail.com` (Passkey: `200906`)
    - `kishannr93@gmail.com` (Passkey: `150140`)
    - `bietdvganveshanclub@gmail.com` (Passkey: `111890`)
    - `gouthamga88@gmail.com` (Passkey: `183202`)
- [ ] **2. Verify Admin Panel**:
  - Confirm all tabs start clean:
    - Registrations: "No registered teams found."
    - Payments: "No payment verifications pending."
    - News: "No active dispatches yet."
  - Publish your first welcome announcement to test live dispatching.

---

## 💾 Phase 6: Daily Backups & Disaster Recovery

- [ ] **Supabase Automated Daily Backups**:
  - Supabase Pro and Enterprise tiers execute daily automated WAL backups.
  - On the Free tier, use the Supabase CLI to export backups periodically:
    ```bash
    npx supabase db dump -f ideation_backup_$(date +%Y%m%d).sql
    ```
- [ ] **Data Export via Admin Console**:
  - The Admin console includes a one-click **Export All Teams (CSV / Excel)** button. Download a backup copy at the end of each registration day.
- [ ] **Restore Plan**:
  - If a restore is required, run `psql` or use the Supabase SQL Editor to re-apply the backup `.sql` file.

---

## 📈 Phase 7: Uptime Monitoring & Rollback Plan

- [ ] **Uptime Check**:
  - Set up a free monitor on [Better Uptime](https://betteruptime.com) or [UptimeRobot](https://uptimerobot.com).
  - Target URL: `https://ideation2026.bietdvg.edu`
  - Check interval: Every 3 minutes. Alert SMS/Email: `gouthamga88@gmail.com`
- [ ] **Instant Rollback**:
  - In Vercel Dashboard -> **Deployments**, locate the last healthy build, click **...** -> **Promote to Production** for instant 2-second rollback.
