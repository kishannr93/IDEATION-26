/**
 * IDEATION 2026 - Resend Transactional Email Dispatcher
 * Dispatches confirmation passes and verification updates to participants.
 */

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

export const sendTransactionalEmail = async (payload: EmailPayload): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  const apiKey = (import.meta.env.RESEND_API_KEY || (typeof process !== 'undefined' ? process.env.RESEND_API_KEY : '')) as string | undefined;
  const fromEmail = (import.meta.env.EMAIL_FROM || (typeof process !== 'undefined' ? process.env.EMAIL_FROM : '')) as string | undefined || 'IDEATION 2026 <no-reply@bietdvg.edu>';
  const replyTo = (import.meta.env.EMAIL_REPLY_TO || (typeof process !== 'undefined' ? process.env.EMAIL_REPLY_TO : '')) as string | undefined || 'anveshan@bietdvg.edu';

  if (!apiKey || apiKey.includes('123456789')) {
    // Graceful offline/local mode when API key is not yet configured
    return {
      success: true,
      messageId: `simulated-${Date.now()}`,
    };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [payload.to],
        reply_to: replyTo,
        subject: payload.subject,
        html: payload.html,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.message || `Resend error status ${response.status}`,
      };
    }

    const data = await response.json();
    return { success: true, messageId: data.id };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error sending email' };
  }
};

export const generatePassEmailHtml = (params: {
  teamId: string;
  teamName: string;
  college: string;
  leaderName: string;
  trackName: string;
  paymentStatus: string;
}): string => {
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
    .disclaimer { background: rgba(255, 138, 42, 0.12); border-left: 4px solid #FF8A2A; padding: 12px 16px; margin: 20px 0; border-radius: 0 8px 8px 0; font-size: 13px; color: #FFD4A8; line-height: 1.5; }
    .footer { text-align: center; font-size: 12px; color: #64748B; margin-top: 24px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="title">IDEATION 2026</div>
      <div style="font-size: 13px; color: #94A3B8;">Anveshan Club · BIET Davangere</div>
      <div style="margin-top: 12px;">
        <span class="badge">Team ID: ${params.teamId}</span>
      </div>
    </div>
    <div class="details">
      <p>Hello <strong>${params.leaderName}</strong>,</p>
      <p>Your team <strong>${params.teamName}</strong> from <strong>${params.college}</strong> has successfully submitted registration for IDEATION 2026 on 18 & 19 November 2026.</p>
      
      <div style="background: #081024; border-radius: 12px; padding: 16px; margin: 16px 0;">
        <div class="field"><span class="field-label">Primary Track:</span><span class="field-value">${params.trackName}</span></div>
        <div class="field"><span class="field-label">Payment Status:</span><span class="field-value" style="color: #FFC83D;">${params.paymentStatus}</span></div>
        <div class="field"><span class="field-label">Venue:</span><span class="field-value">BIET Main Campus, Davangere</span></div>
        <div class="field"><span class="field-label">Event Dates:</span><span class="field-value">18 - 19 November 2026 (24 Hours)</span></div>
      </div>

      <div class="disclaimer">
        <strong>⚠️ Important Notice Regarding Payment Approval:</strong><br>
        Successful registration submission does <em>not</em> guarantee or constitute final payment approval. The registration fee of ₹100 is subject to manual verification of your UPI transaction reference (UTR) by the Anveshan finance desk. Once credited and verified, your status will update to <strong>Verified</strong> and your confirmed entry pass will be active in the team dashboard.
      </div>

      <p style="font-size: 13px; color: #94A3B8;">You can track your live payment verification status anytime by logging in with your Team ID (<strong>${params.teamId}</strong>) or email on the IDEATION participant dashboard.</p>
    </div>
    <div class="footer">
      <p>Anveshan Club · Bapuji Institute of Engineering and Technology, Davangere</p>
      <p>Need support? Contact: anveshan@bietdvg.edu</p>
    </div>
  </div>
</body>
</html>
  `.trim();
};

export const generateApprovalEmailHtml = (params: {
  teamId: string;
  teamName: string;
  college: string;
  leaderName: string;
  trackName: string;
}): string => {
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
    .success-box { background: rgba(52, 211, 153, 0.12); border-left: 4px solid #34D399; padding: 12px 16px; margin: 20px 0; border-radius: 0 8px 8px 0; font-size: 13px; color: #A7F3D0; line-height: 1.5; }
    .footer { text-align: center; font-size: 12px; color: #64748B; margin-top: 24px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="title">IDEATION 2026</div>
      <div style="font-size: 13px; color: #94A3B8;">Anveshan Club · BIET Davangere</div>
      <div style="margin-top: 12px;">
        <span class="badge">PAYMENT VERIFIED · ADMITTED</span>
      </div>
    </div>
    <div class="details">
      <p>Hello <strong>${params.leaderName}</strong>,</p>
      <div class="success-box">
        <strong>🎉 Payment Approved!</strong><br>
        Your registration fee payment for Team <strong>${params.teamId}</strong> (${params.teamName}) has been officially verified by the Anveshan finance desk. Your entry pass is now fully activated.
      </div>
      
      <div style="background: #081024; border-radius: 12px; padding: 16px; margin: 16px 0;">
        <div class="field"><span class="field-label">Team ID:</span><span class="field-value" style="color: #35E0FF;">${params.teamId}</span></div>
        <div class="field"><span class="field-label">Team Name:</span><span class="field-value">${params.teamName}</span></div>
        <div class="field"><span class="field-label">College:</span><span class="field-value">${params.college}</span></div>
        <div class="field"><span class="field-label">Primary Track:</span><span class="field-value">${params.trackName}</span></div>
        <div class="field"><span class="field-label">Reporting Date:</span><span class="field-value">18 November 2026, 08:00 AM IST</span></div>
        <div class="field"><span class="field-label">Reporting Desk:</span><span class="field-value">BIET Main Auditorium, Davangere</span></div>
      </div>

      <p style="font-size: 13px; color: #94A3B8;">Please present your digital entry pass QR code on your phone or bring a printed copy along with your college identity cards to collect your badges, kits, and food coupons.</p>
    </div>
    <div class="footer">
      <p>Anveshan Club · Bapuji Institute of Engineering and Technology, Davangere</p>
      <p>Help Desk: anveshan@bietdvg.edu</p>
    </div>
  </div>
</body>
</html>
  `.trim();
};

export const generateSubmissionNotificationEmailHtml = (params: {
  teamId: string;
  teamName: string;
  college?: string;
  leaderName: string;
  leaderEmail: string;
  leaderPhone?: string;
  projectTitle: string;
  projectTrack: string;
  pptFileName?: string;
  pptDeckUrl?: string;
  githubUrl?: string;
  demoUrl?: string;
  techStack?: string[];
  submittedAt: string;
}): string => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>New Project PPT Submission Alert</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #050B1A; color: #F2F6FF; margin: 0; padding: 20px; }
    .card { max-width: 600px; margin: 0 auto; background: #0C1630; border: 1px solid #35E0FF40; border-radius: 16px; padding: 32px; box-shadow: 0 10px 40px rgba(0,0,0,0.5); }
    .header { text-align: center; border-bottom: 1px solid #78AAFF20; padding-bottom: 20px; }
    .title { font-size: 24px; font-weight: 800; color: #FFFFFF; letter-spacing: 1px; }
    .badge { display: inline-block; padding: 4px 12px; background: rgba(53, 224, 255, 0.15); border: 1px solid #35E0FF; border-radius: 9999px; font-size: 11px; font-weight: 700; color: #35E0FF; text-transform: uppercase; }
    .details { margin: 24px 0; line-height: 1.6; font-size: 14px; color: #CBD5E1; }
    .field { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #78AAFF15; }
    .field-label { color: #94A3B8; }
    .field-value { color: #FFFFFF; font-weight: 600; text-align: right; }
    .alert-box { background: rgba(53, 224, 255, 0.08); border-left: 4px solid #35E0FF; padding: 12px 16px; margin: 20px 0; border-radius: 0 8px 8px 0; font-size: 13px; color: #E0F2FE; }
    .footer { text-align: center; font-size: 12px; color: #64748B; margin-top: 24px; }
    .btn { display: inline-block; background: #35E0FF; color: #050B1A; font-weight: 700; text-decoration: none; padding: 10px 20px; border-radius: 8px; margin-top: 10px; font-size: 13px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="title">IDEATION 2026</div>
      <div style="font-size: 13px; color: #94A3B8;">Anveshan Admin Notification</div>
      <div style="margin-top: 12px;">
        <span class="badge">NEW PROJECT PPT SUBMITTED</span>
      </div>
    </div>
    <div class="details">
      <div class="alert-box">
        <strong>⚡ Action Required:</strong> Team <strong>${params.teamName} (${params.teamId})</strong> has just uploaded their project pitch deck for judging evaluation.
      </div>
      
      <div style="background: #081024; border-radius: 12px; padding: 16px; margin: 16px 0;">
        <div class="field"><span class="field-label">Team ID:</span><span class="field-value" style="color: #35E0FF;">${params.teamId}</span></div>
        <div class="field"><span class="field-label">Team Name:</span><span class="field-value">${params.teamName}</span></div>
        <div class="field"><span class="field-label">Project Title:</span><span class="field-value">${params.projectTitle}</span></div>
        <div class="field"><span class="field-label">Track:</span><span class="field-value">${params.projectTrack}</span></div>
        <div class="field"><span class="field-label">Institution:</span><span class="field-value">${params.college}</span></div>
        <div class="field"><span class="field-label">Leader:</span><span class="field-value">${params.leaderName} (${params.leaderEmail})</span></div>
        <div class="field"><span class="field-label">Submitted At:</span><span class="field-value">${new Date(params.submittedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</span></div>
        ${params.pptFileName ? `<div class="field"><span class="field-label">PPT File:</span><span class="field-value">${params.pptFileName}</span></div>` : ''}
        ${params.pptDeckUrl ? `<div class="field"><span class="field-label">Deck URL:</span><span class="field-value"><a href="${params.pptDeckUrl}" style="color: #35E0FF;" target="_blank">Open Online Presentation</a></span></div>` : ''}
        ${params.githubUrl ? `<div class="field"><span class="field-label">GitHub Repo:</span><span class="field-value"><a href="${params.githubUrl}" style="color: #35E0FF;" target="_blank">${params.githubUrl}</a></span></div>` : ''}
      </div>

      <p style="text-align: center; margin-top: 20px;">
        <a href="https://ais-pre-usrmtxil4qh7m75g2atyqu-949332054040.asia-southeast1.run.app/?view=admin" class="btn" target="_blank">
          Open Admin Panel to Review & Score Submission
        </a>
      </p>
    </div>
    <div class="footer">
      <p>IDEATION 2026 Admin Alert System · Bapuji Institute of Engineering and Technology</p>
    </div>
  </div>
</body>
</html>
  `.trim();
};
