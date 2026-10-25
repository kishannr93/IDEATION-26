import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Middleware
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Central Database Storage Path
const DATA_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'central_database.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export interface TeamMemberRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  usn: string;
  branch: string;
  year: string;
  isLeader?: boolean;
}

export interface RegisteredTeamRecord {
  id: string;
  teamName: string;
  college: string;
  city: string;
  department: string;
  course: 'B.E / B.Tech' | 'M.Tech' | 'MCA';
  members: TeamMemberRecord[];
  primaryTrack: string;
  backupTrack: string;
  ideaTitle: string;
  ideaSummary: string;
  paymentStatus: 'Pending' | 'Verified' | 'Rejected';
  paymentTransactionId: string;
  paymentScreenshotUrl?: string;
  paymentRemarks?: string;
  registeredAt: string;
  checkedIn: boolean;
  checkedInAt?: string;
  submission?: any;
}

// Read database from central JSON file
function readDatabase(): RegisteredTeamRecord[] {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify([], null, 2), 'utf-8');
      return [];
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Error reading central database:', err);
    return [];
  }
}

// Write database atomically to central JSON file
function writeDatabase(teams: RegisteredTeamRecord[]): boolean {
  try {
    const tempFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(teams, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
    return true;
  } catch (err) {
    console.error('Error writing central database:', err);
    return false;
  }
}

// Helper: Escape CSV fields according to RFC 4180
function escapeCsvValue(val: unknown): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/\r\n/g, ' ').replace(/[\r\n]/g, ' ');
  return `"${str.replace(/"/g, '""')}"`;
}

// Helper: Format SQL literal
function sqlEscape(val: unknown): string {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  if (typeof val === 'number') return String(val);
  const str = String(val).replace(/'/g, "''");
  return `'${str}'`;
}

// Helper: Send Resend Email if API key is provided
async function dispatchEmail(to: string, subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM || 'IDEATION 2026 <no-reply@bietdvg.edu>';
  const replyTo = process.env.EMAIL_REPLY_TO || 'anveshan@bietdvg.edu';

  if (!apiKey || apiKey.includes('123456789') || apiKey === '') {
    console.log(`[Central DB Email Dispatcher - Simulated] To: ${to} | Subject: ${subject}`);
    return { success: true, simulated: true };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [to],
        reply_to: replyTo,
        subject,
        html,
      }),
    });
    if (!res.ok) {
      const errText = await res.text();
      console.warn('Resend email error:', errText);
      return { success: false, error: errText };
    }
    return { success: true };
  } catch (err: any) {
    console.warn('Resend dispatch failed:', err.message);
    return { success: false, error: err.message };
  }
}

// Email templates
function buildRegistrationConfirmationEmail(team: RegisteredTeamRecord, leaderName: string) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>IDEATION 2026 Registration Confirmation</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #050B1A; color: #FFFFFF; margin: 0; padding: 24px; }
    .card { background-color: #0C1630; border: 1px solid #35E0FF40; border-radius: 16px; max-width: 600px; margin: 0 auto; padding: 32px; }
    .header { text-align: center; border-bottom: 1px solid #78AAFF25; padding-bottom: 20px; }
    .title { color: #35E0FF; font-size: 24px; font-weight: 800; letter-spacing: 2px; margin: 8px 0; }
    .badge { background: #35E0FF20; color: #35E0FF; padding: 4px 12px; border-radius: 6px; font-family: monospace; font-size: 14px; font-weight: bold; display: inline-block; }
    .details { margin: 24px 0; line-height: 1.6; font-size: 14px; color: #CBD5E1; }
    .field { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #78AAFF15; }
    .field-label { color: #94A3B8; }
    .field-value { color: #FFFFFF; font-weight: 600; }
    .disclaimer { background: rgba(255, 138, 42, 0.12); border-left: 4px solid #FF8A2A; padding: 14px 18px; margin: 20px 0; border-radius: 0 8px 8px 0; font-size: 13px; color: #FFD4A8; line-height: 1.5; }
    .footer { text-align: center; font-size: 12px; color: #64748B; margin-top: 24px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="title">IDEATION 2026</div>
      <div style="font-size: 13px; color: #94A3B8;">Anveshan Club · BIET Davangere</div>
      <div style="margin-top: 12px;">
        <span class="badge">Team ID: ${team.id}</span>
      </div>
    </div>
    <div class="details">
      <p>Hello <strong>${leaderName}</strong>,</p>
      <p>Your team <strong>${team.teamName}</strong> from <strong>${team.college}</strong> has been successfully registered for IDEATION 2026 on 18 & 19 November 2026.</p>
      
      <div style="background: #081024; border-radius: 12px; padding: 16px; margin: 16px 0;">
        <div class="field"><span class="field-label">Registration ID:</span><span class="field-value font-mono">${team.id}</span></div>
        <div class="field"><span class="field-label">Team Name:</span><span class="field-value">${team.teamName}</span></div>
        <div class="field"><span class="field-label">College Name:</span><span class="field-value">${team.college}</span></div>
        <div class="field"><span class="field-label">Primary Track:</span><span class="field-value">${team.primaryTrack}</span></div>
        <div class="field"><span class="field-label">Payment Status:</span><span class="field-value" style="color: #FFC83D;">${team.paymentStatus}</span></div>
        <div class="field"><span class="field-label">Transaction UTR:</span><span class="field-value font-mono">${team.paymentTransactionId}</span></div>
        <div class="field"><span class="field-label">Venue:</span><span class="field-value">BIET Main Campus, Davangere, Karnataka</span></div>
        <div class="field"><span class="field-label">Event Schedule:</span><span class="field-value">18 - 19 November 2026 (24-Hour Offline Hackathon)</span></div>
      </div>

      <div class="disclaimer">
        <strong>⚠️ IMPORTANT: Registration Does Not Constitute Payment Approval</strong><br>
        Please note that submitting your registration does <em>not</em> mean your payment has been approved. The ₹100 team entry fee must be manually verified by the Anveshan finance desk against bank transaction records. Once verified, your status will update to <strong>Verified</strong> and your confirmed entry pass will become active in your participant dashboard.
      </div>

      <p style="font-size: 13px; color: #94A3B8;">You can track your live payment verification status anytime by logging in with your Team ID (<strong>${team.id}</strong>) or email on the IDEATION participant dashboard.</p>
    </div>
    <div class="footer">
      <p>Anveshan Club · Bapuji Institute of Engineering and Technology, Davangere</p>
      <p>Official Helpline: anveshan@bietdvg.edu</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

function buildPaymentApprovedEmail(team: RegisteredTeamRecord, leaderName: string) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Payment Approved - IDEATION 2026 Official Entry Pass</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #050B1A; color: #FFFFFF; margin: 0; padding: 24px; }
    .card { background-color: #0C1630; border: 1px solid #34D39960; border-radius: 16px; max-width: 600px; margin: 0 auto; padding: 32px; }
    .header { text-align: center; border-bottom: 1px solid #78AAFF25; padding-bottom: 20px; }
    .title { color: #35E0FF; font-size: 24px; font-weight: 800; letter-spacing: 2px; margin: 8px 0; }
    .badge { background: #34D39920; color: #34D399; padding: 6px 16px; border-radius: 8px; font-family: monospace; font-size: 14px; font-weight: bold; display: inline-block; border: 1px solid #34D39960; }
    .details { margin: 24px 0; line-height: 1.6; font-size: 14px; color: #CBD5E1; }
    .field { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #78AAFF15; }
    .field-label { color: #94A3B8; }
    .field-value { color: #FFFFFF; font-weight: 600; }
    .success-box { background: rgba(52, 211, 153, 0.12); border-left: 4px solid #34D399; padding: 14px 18px; margin: 20px 0; border-radius: 0 8px 8px 0; font-size: 13px; color: #A7F3D0; line-height: 1.5; }
    .footer { text-align: center; font-size: 12px; color: #64748B; margin-top: 24px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="title">IDEATION 2026</div>
      <div style="font-size: 13px; color: #94A3B8;">Anveshan Club · BIET Davangere</div>
      <div style="margin-top: 12px;">
        <span class="badge">PAYMENT VERIFIED · PASS ACTIVE</span>
      </div>
    </div>
    <div class="details">
      <p>Hello <strong>${leaderName}</strong>,</p>
      <div class="success-box">
        <strong>🎉 Payment Verification Successful!</strong><br>
        The Anveshan desk has confirmed your UPI payment transaction (${team.paymentTransactionId}). Your official entry pass for IDEATION 2026 is now fully verified.
      </div>

      <div style="background: #081024; border-radius: 12px; padding: 16px; margin: 16px 0;">
        <div class="field"><span class="field-label">Team ID:</span><span class="field-value font-mono">${team.id}</span></div>
        <div class="field"><span class="field-label">Team Name:</span><span class="field-value">${team.teamName}</span></div>
        <div class="field"><span class="field-label">College:</span><span class="field-value">${team.college}</span></div>
        <div class="field"><span class="field-label">Track:</span><span class="field-value">${team.primaryTrack}</span></div>
        <div class="field"><span class="field-label">Check-in Reporting:</span><span class="field-value font-mono">18 Nov 2026, 08:00 AM</span></div>
        <div class="field"><span class="field-label">Venue:</span><span class="field-value">BIET Main Campus, Davangere</span></div>
      </div>

      <p style="font-size: 13px; color: #94A3B8;">Log in to your participant dashboard anytime to view and print your entry pass badge for check-in on event day.</p>
    </div>
    <div class="footer">
      <p>Anveshan Club · Bapuji Institute of Engineering and Technology, Davangere</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

// -----------------------------------------------------------------------------
// REST API ROUTES
// -----------------------------------------------------------------------------

// 1. GET ALL TEAMS
app.get('/api/teams', (_req: Request, res: Response) => {
  const teams = readDatabase();
  res.json({ success: true, count: teams.length, data: teams });
});

// 2. GET SINGLE TEAM BY ID OR EMAIL
app.get('/api/teams/:id', (req: Request, res: Response) => {
  const query = req.params.id.trim().toLowerCase();
  const teams = readDatabase();
  const found = teams.find(
    t =>
      t.id.toLowerCase() === query ||
      t.teamName.toLowerCase() === query ||
      t.members.some(m => m.email.toLowerCase() === query)
  );
  if (!found) {
    return res.status(404).json({ success: false, error: 'Team not found' });
  }
  return res.json({ success: true, data: found });
});

// 3. REGISTER NEW TEAM
app.post('/api/teams', (req: Request, res: Response) => {
  const body = req.body as Partial<RegisteredTeamRecord>;

  if (!body.teamName || !body.teamName.trim()) {
    return res.status(400).json({ success: false, error: 'Team Name is required' });
  }
  if (!body.college || !body.college.trim()) {
    return res.status(400).json({ success: false, error: 'College Name is required' });
  }
  if (!body.primaryTrack || !body.primaryTrack.trim()) {
    return res.status(400).json({ success: false, error: 'Primary Track is required' });
  }
  if (!body.paymentTransactionId || !body.paymentTransactionId.trim()) {
    return res.status(400).json({ success: false, error: 'Payment Transaction ID is required' });
  }

  const members = Array.isArray(body.members) ? body.members : [];
  if (members.length < 3 || members.length > 4) {
    return res.status(400).json({ success: false, error: 'Team must have strictly 3 or 4 members' });
  }

  // Validate each member (Email, Phone, Name, USN, Branch, Year)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  for (let i = 0; i < members.length; i++) {
    const m = members[i];
    if (!m.name || !m.name.trim()) {
      return res.status(400).json({ success: false, error: `Member ${i + 1} Name is required` });
    }
    if (!m.email || !emailRegex.test(m.email.trim())) {
      return res.status(400).json({ success: false, error: `Member ${i + 1} has an invalid email format` });
    }
    const cleanPhone = (m.phone || '').replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      return res.status(400).json({ success: false, error: `Member ${i + 1} requires a valid 10-digit phone number` });
    }
    if (!m.usn || !m.usn.trim()) {
      return res.status(400).json({ success: false, error: `Member ${i + 1} USN / Roll Number is required` });
    }
  }

  const teams = readDatabase();

  // Check unique team name
  const existingTeam = teams.find(
    t => t.teamName.trim().toLowerCase() === body.teamName!.trim().toLowerCase()
  );
  if (existingTeam) {
    return res.status(400).json({ success: false, error: `Team name "${body.teamName}" is already registered` });
  }

  // Check unique USN and Email across existing teams
  const allExistingMembers = teams.flatMap(t => t.members);
  for (const m of members) {
    const dupUsn = allExistingMembers.find(
      em => em.usn.trim().toUpperCase() === m.usn.trim().toUpperCase()
    );
    if (dupUsn) {
      return res.status(400).json({
        success: false,
        error: `Student with USN "${m.usn}" is already registered in team ${dupUsn.id || 'another team'}`,
      });
    }
    const dupEmail = allExistingMembers.find(
      em => em.email.trim().toLowerCase() === m.email.trim().toLowerCase()
    );
    if (dupEmail) {
      return res.status(400).json({
        success: false,
        error: `Email "${m.email}" is already registered in another team`,
      });
    }
  }

  // Generate Team ID
  const nextNumber = teams.length + 1;
  const teamId = `IDN-${String(nextNumber).padStart(4, '0')}`;

  const newTeam: RegisteredTeamRecord = {
    id: teamId,
    teamName: body.teamName.trim(),
    college: body.college.trim(),
    city: (body.city || '').trim(),
    department: (body.department || '').trim(),
    course: body.course || 'B.E / B.Tech',
    members: members.map((m, idx) => ({
      id: m.id || String(Date.now() + idx),
      name: m.name.trim(),
      email: m.email.trim(),
      phone: m.phone.trim(),
      usn: m.usn.trim().toUpperCase(),
      branch: (m.branch || '').trim(),
      year: (m.year || '3rd Year').trim(),
      isLeader: idx === 0,
    })),
    primaryTrack: body.primaryTrack.trim(),
    backupTrack: (body.backupTrack || '').trim(),
    ideaTitle: (body.ideaTitle || '').trim(),
    ideaSummary: (body.ideaSummary || '').trim(),
    paymentStatus: 'Pending',
    paymentTransactionId: body.paymentTransactionId.trim(),
    paymentScreenshotUrl: body.paymentScreenshotUrl,
    paymentRemarks: body.paymentRemarks || 'Registration submitted with transaction verification pending.',
    registeredAt: new Date().toISOString(),
    checkedIn: false,
  };

  teams.unshift(newTeam);
  const writeSuccess = writeDatabase(teams);
  if (!writeSuccess) {
    return res.status(500).json({ success: false, error: 'Database write failed' });
  }

  // Automatically send confirmation email to the team lead
  const leader = newTeam.members.find(m => m.isLeader) || newTeam.members[0];
  if (leader && leader.email) {
    dispatchEmail(
      leader.email,
      `IDEATION 2026 Registration Confirmed - Team ${newTeam.id}`,
      buildRegistrationConfirmationEmail(newTeam, leader.name)
    );
  }

  return res.status(201).json({
    success: true,
    teamId: newTeam.id,
    data: newTeam,
    message: 'Registration saved in central database and confirmation email queued.',
  });
});

// 4. UPDATE PAYMENT STATUS
app.patch('/api/teams/:id/payment', (req: Request, res: Response) => {
  const teamId = req.params.id.trim().toUpperCase();
  const { status, remarks } = req.body as {
    status: 'Pending' | 'Verified' | 'Rejected';
    remarks?: string;
  };

  if (!status || !['Pending', 'Verified', 'Rejected'].includes(status)) {
    return res.status(400).json({ success: false, error: 'Valid payment status is required' });
  }

  const teams = readDatabase();
  const idx = teams.findIndex(t => t.id.toUpperCase() === teamId);
  if (idx === -1) {
    return res.status(404).json({ success: false, error: `Team ${teamId} not found` });
  }

  const prevStatus = teams[idx].paymentStatus;
  teams[idx].paymentStatus = status;
  if (remarks !== undefined) {
    teams[idx].paymentRemarks = remarks;
  }

  writeDatabase(teams);

  // If approved, trigger celebratory pass email to leader
  if (status === 'Verified' && prevStatus !== 'Verified') {
    const leader = teams[idx].members.find(m => m.isLeader) || teams[idx].members[0];
    if (leader && leader.email) {
      dispatchEmail(
        leader.email,
        `Payment Approved - IDEATION 2026 Entry Pass Confirmed (${teams[idx].id})`,
        buildPaymentApprovedEmail(teams[idx], leader.name)
      );
    }
  }

  return res.json({
    success: true,
    data: teams[idx],
    message: `Team ${teamId} payment updated to ${status} in central database.`,
  });
});

// 5. TOGGLE CHECK-IN
app.patch('/api/teams/:id/checkin', (req: Request, res: Response) => {
  const teamId = req.params.id.trim().toUpperCase();
  const teams = readDatabase();
  const idx = teams.findIndex(t => t.id.toUpperCase() === teamId);
  if (idx === -1) {
    return res.status(404).json({ success: false, error: `Team ${teamId} not found` });
  }

  const newStatus = !teams[idx].checkedIn;
  teams[idx].checkedIn = newStatus;
  teams[idx].checkedInAt = newStatus ? new Date().toISOString() : undefined;

  writeDatabase(teams);
  return res.json({ success: true, data: teams[idx] });
});

// 5.5 SUBMIT PROJECT PRESENTATION (PPT / DECK / DEMO)
app.put('/api/teams/:id/submission', (req: Request, res: Response) => {
  const teamId = req.params.id.trim().toUpperCase();
  const submissionData = req.body;

  const teams = readDatabase();
  const idx = teams.findIndex(t => t.id.toUpperCase() === teamId);
  if (idx === -1) {
    return res.status(404).json({ success: false, error: `Team ${teamId} not found` });
  }

  const team = teams[idx];
  const nowIso = new Date().toISOString();
  const updatedSubmission = {
    submittedAt: team.submission?.submittedAt || nowIso,
    updatedAt: nowIso,
    projectTitle: submissionData.projectTitle || team.ideaTitle || 'Untitled Project',
    projectTrack: submissionData.projectTrack || team.primaryTrack,
    problemStatement: submissionData.problemStatement || '',
    ideaSummary: submissionData.ideaSummary || team.ideaSummary || '',
    pptFileName: submissionData.pptFileName || team.submission?.pptFileName,
    pptFileData: submissionData.pptFileData || team.submission?.pptFileData,
    pptDeckUrl: submissionData.pptDeckUrl || team.submission?.pptDeckUrl,
    githubUrl: submissionData.githubUrl || team.submission?.githubUrl,
    demoUrl: submissionData.demoUrl || team.submission?.demoUrl,
    techStack: submissionData.techStack || team.submission?.techStack || [],
    evaluationStatus: team.submission?.evaluationStatus || 'Under Review',
    score: team.submission?.score,
    feedback: team.submission?.feedback,
    evaluatedBy: team.submission?.evaluatedBy,
    evaluatedAt: team.submission?.evaluatedAt,
  };

  team.submission = updatedSubmission;
  if (updatedSubmission.projectTitle) {
    team.ideaTitle = updatedSubmission.projectTitle;
  }
  if (updatedSubmission.ideaSummary) {
    team.ideaSummary = updatedSubmission.ideaSummary;
  }

  writeDatabase(teams);

  // Notify admin via server email dispatcher
  const leader = team.members.find(m => m.isLeader) || team.members[0];
  dispatchEmail(
    'ktarunkumar1832@gmail.com',
    `[IDEATION 2026] PPT Submitted - Team ${team.teamName} (${team.id})`,
    `<div style="font-family:sans-serif;padding:24px;background:#050B1A;color:#fff;border-radius:12px;border:1px solid #35E0FF40;">
      <h2 style="color:#35E0FF;margin-top:0;">New Project PPT Submission Received</h2>
      <p><strong>Team:</strong> ${team.teamName} (${team.id})</p>
      <p><strong>Track:</strong> ${team.primaryTrack}</p>
      <p><strong>College:</strong> ${team.college}</p>
      <p><strong>Leader:</strong> ${leader?.name || 'N/A'} (${leader?.email || 'N/A'} / ${leader?.phone || 'N/A'})</p>
      <p><strong>Project Title:</strong> ${updatedSubmission.projectTitle}</p>
      <p><strong>PPT Presentation File:</strong> ${updatedSubmission.pptFileName || 'Uploaded directly'}</p>
      ${updatedSubmission.pptDeckUrl ? `<p><strong>Deck URL:</strong> <a href="${updatedSubmission.pptDeckUrl}" style="color:#35E0FF;">${updatedSubmission.pptDeckUrl}</a></p>` : ''}
      ${updatedSubmission.githubUrl ? `<p><strong>GitHub:</strong> <a href="${updatedSubmission.githubUrl}" style="color:#35E0FF;">${updatedSubmission.githubUrl}</a></p>` : ''}
      ${updatedSubmission.demoUrl ? `<p><strong>Live Demo:</strong> <a href="${updatedSubmission.demoUrl}" style="color:#35E0FF;">${updatedSubmission.demoUrl}</a></p>` : ''}
      <hr style="border:0;border-top:1px solid #78AAFF30;margin:20px 0;" />
      <p style="color:#9DB0D0;font-size:12px;">This is an automated notification from the IDEATION 2026 Hackathon Portal. Please log in to the Executive Management Suite to evaluate and score this team's presentation.</p>
    </div>`
  );

  return res.json({ success: true, data: team });
});

// 5.6 EVALUATE PROJECT SUBMISSION
app.patch('/api/teams/:id/evaluation', (req: Request, res: Response) => {
  const teamId = req.params.id.trim().toUpperCase();
  const { status, score, feedback, evaluatedBy } = req.body;

  const teams = readDatabase();
  const idx = teams.findIndex(t => t.id.toUpperCase() === teamId);
  if (idx === -1) {
    return res.status(404).json({ success: false, error: `Team ${teamId} not found` });
  }

  const team = teams[idx];
  if (!team.submission) {
    team.submission = {
      submittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      projectTitle: team.ideaTitle || 'Untitled Project',
      projectTrack: team.primaryTrack,
      evaluationStatus: status || 'Under Review',
    };
  }

  if (status) team.submission.evaluationStatus = status;
  if (score !== undefined) team.submission.score = score;
  if (feedback !== undefined) team.submission.feedback = feedback;
  team.submission.evaluatedBy = evaluatedBy || 'Jury Panel';
  team.submission.evaluatedAt = new Date().toISOString();
  team.submission.updatedAt = new Date().toISOString();

  writeDatabase(teams);
  return res.json({ success: true, data: team });
});

// 6. EXPORT CLEAN, PROPERLY ALIGNED CSV
app.get('/api/export/csv', (_req: Request, res: Response) => {
  const teams = readDatabase();

  const headers = [
    'Registration ID',
    'Team Name',
    'College Name',
    'City',
    'Department',
    'Course',
    'Primary Track',
    'Backup Track',
    'Idea Title',
    'Idea Summary',
    'Payment Status',
    'Payment UTR Ref',
    'Desk Check-In',
    'Registration Date',
    'Team Size',
    'Leader Name',
    'Leader Email',
    'Leader Phone',
    'Leader USN',
    'Leader Branch',
    'Leader Year',
    'Member 2 Name',
    'Member 2 Email',
    'Member 2 Phone',
    'Member 2 USN',
    'Member 2 Branch',
    'Member 2 Year',
    'Member 3 Name',
    'Member 3 Email',
    'Member 3 Phone',
    'Member 3 USN',
    'Member 3 Branch',
    'Member 3 Year',
    'Member 4 Name',
    'Member 4 Email',
    'Member 4 Phone',
    'Member 4 USN',
    'Member 4 Branch',
    'Member 4 Year',
  ];

  const rows = teams.map(t => {
    const leader = t.members.find(m => m.isLeader) || t.members[0];
    const nonLeaders = t.members.filter(m => m !== leader);
    const m2 = nonLeaders[0];
    const m3 = nonLeaders[1];
    const m4 = nonLeaders[2];

    return [
      escapeCsvValue(t.id),
      escapeCsvValue(t.teamName),
      escapeCsvValue(t.college),
      escapeCsvValue(t.city),
      escapeCsvValue(t.department),
      escapeCsvValue(t.course),
      escapeCsvValue(t.primaryTrack),
      escapeCsvValue(t.backupTrack || ''),
      escapeCsvValue(t.ideaTitle || ''),
      escapeCsvValue(t.ideaSummary || ''),
      escapeCsvValue(t.paymentStatus),
      escapeCsvValue(t.paymentTransactionId),
      escapeCsvValue(t.checkedIn ? 'Yes' : 'No'),
      escapeCsvValue(t.registeredAt),
      escapeCsvValue(t.members.length),
      escapeCsvValue(leader?.name || ''),
      escapeCsvValue(leader?.email || ''),
      escapeCsvValue(leader?.phone || ''),
      escapeCsvValue(leader?.usn || ''),
      escapeCsvValue(leader?.branch || ''),
      escapeCsvValue(leader?.year || ''),
      escapeCsvValue(m2?.name || ''),
      escapeCsvValue(m2?.email || ''),
      escapeCsvValue(m2?.phone || ''),
      escapeCsvValue(m2?.usn || ''),
      escapeCsvValue(m2?.branch || ''),
      escapeCsvValue(m2?.year || ''),
      escapeCsvValue(m3?.name || ''),
      escapeCsvValue(m3?.email || ''),
      escapeCsvValue(m3?.phone || ''),
      escapeCsvValue(m3?.usn || ''),
      escapeCsvValue(m3?.branch || ''),
      escapeCsvValue(m3?.year || ''),
      escapeCsvValue(m4?.name || ''),
      escapeCsvValue(m4?.email || ''),
      escapeCsvValue(m4?.phone || ''),
      escapeCsvValue(m4?.usn || ''),
      escapeCsvValue(m4?.branch || ''),
      escapeCsvValue(m4?.year || ''),
    ].join(',');
  });

  const csvString = [headers.join(','), ...rows].join('\r\n');
  const filename = `IDEATION_2026_Registrations_${new Date().toISOString().split('T')[0]}.csv`;

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csvString);
});

// 7. EXPORT COMPLETE SQL DUMP
app.get('/api/export/sql', (_req: Request, res: Response) => {
  const teams = readDatabase();
  const dateStr = new Date().toISOString();

  let sql = `-- ==============================================================================
-- IDEATION 2026 - Central Database SQL Export
-- Generated: ${dateStr}
-- Format: PostgreSQL / ANSI SQL Compatible
-- ==============================================================================

-- 1. Table DDL: Teams Table
CREATE TABLE IF NOT EXISTS public.teams (
  id VARCHAR(20) PRIMARY KEY,
  team_name VARCHAR(150) NOT NULL UNIQUE,
  college VARCHAR(250) NOT NULL,
  city VARCHAR(100) NOT NULL,
  department VARCHAR(120) NOT NULL,
  course VARCHAR(50) NOT NULL,
  primary_track VARCHAR(80) NOT NULL,
  backup_track VARCHAR(80),
  idea_title VARCHAR(200) NOT NULL,
  idea_summary TEXT NOT NULL,
  payment_status VARCHAR(20) NOT NULL DEFAULT 'Pending',
  payment_transaction_id VARCHAR(100),
  payment_remarks TEXT,
  registered_at TIMESTAMPTZ NOT NULL,
  checked_in BOOLEAN NOT NULL DEFAULT FALSE,
  checked_in_at TIMESTAMPTZ
);

-- 2. Table DDL: Members Table (T-shirt size & Food preference completely excluded)
CREATE TABLE IF NOT EXISTS public.members (
  id VARCHAR(60) PRIMARY KEY,
  team_id VARCHAR(20) NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(180) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  usn VARCHAR(40) NOT NULL,
  branch VARCHAR(100) NOT NULL,
  year VARCHAR(30) NOT NULL,
  is_leader BOOLEAN NOT NULL DEFAULT FALSE
);

-- 3. Data Insertion Statements
`;

  if (teams.length === 0) {
    sql += `-- (No registered teams currently in central database)\n`;
  } else {
    for (const t of teams) {
      sql += `\n-- Team: ${t.teamName} (${t.id})\n`;
      sql += `INSERT INTO public.teams (id, team_name, college, city, department, course, primary_track, backup_track, idea_title, idea_summary, payment_status, payment_transaction_id, payment_remarks, registered_at, checked_in, checked_in_at) VALUES (\n`;
      sql += `  ${sqlEscape(t.id)},\n`;
      sql += `  ${sqlEscape(t.teamName)},\n`;
      sql += `  ${sqlEscape(t.college)},\n`;
      sql += `  ${sqlEscape(t.city)},\n`;
      sql += `  ${sqlEscape(t.department)},\n`;
      sql += `  ${sqlEscape(t.course)},\n`;
      sql += `  ${sqlEscape(t.primaryTrack)},\n`;
      sql += `  ${sqlEscape(t.backupTrack)},\n`;
      sql += `  ${sqlEscape(t.ideaTitle)},\n`;
      sql += `  ${sqlEscape(t.ideaSummary)},\n`;
      sql += `  ${sqlEscape(t.paymentStatus)},\n`;
      sql += `  ${sqlEscape(t.paymentTransactionId)},\n`;
      sql += `  ${sqlEscape(t.paymentRemarks)},\n`;
      sql += `  ${sqlEscape(t.registeredAt)},\n`;
      sql += `  ${sqlEscape(t.checkedIn)},\n`;
      sql += `  ${sqlEscape(t.checkedInAt || null)}\n`;
      sql += `) ON CONFLICT (id) DO UPDATE SET\n`;
      sql += `  payment_status = EXCLUDED.payment_status,\n`;
      sql += `  payment_remarks = EXCLUDED.payment_remarks,\n`;
      sql += `  checked_in = EXCLUDED.checked_in,\n`;
      sql += `  checked_in_at = EXCLUDED.checked_in_at;\n`;

      for (const m of t.members) {
        sql += `INSERT INTO public.members (id, team_id, name, email, phone, usn, branch, year, is_leader) VALUES (\n`;
        sql += `  ${sqlEscape(m.id)},\n`;
        sql += `  ${sqlEscape(t.id)},\n`;
        sql += `  ${sqlEscape(m.name)},\n`;
        sql += `  ${sqlEscape(m.email)},\n`;
        sql += `  ${sqlEscape(m.phone)},\n`;
        sql += `  ${sqlEscape(m.usn)},\n`;
        sql += `  ${sqlEscape(m.branch)},\n`;
        sql += `  ${sqlEscape(m.year)},\n`;
        sql += `  ${sqlEscape(Boolean(m.isLeader))}\n`;
        sql += `) ON CONFLICT (id) DO NOTHING;\n`;
      }
    }
  }

  const filename = `IDEATION_2026_Database_Dump_${new Date().toISOString().split('T')[0]}.sql`;
  res.setHeader('Content-Type', 'application/sql; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(sql);
});

// -----------------------------------------------------------------------------
// VITE SPA INTEGRATION (Dev vs Production)
// -----------------------------------------------------------------------------
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`IDEATION 2026 Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
