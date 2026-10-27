import React, { useState, useRef, useEffect } from 'react';
import { useHackathon } from '../context/HackathonContext';
import { RegisteredTeam, TeamMember, ProjectSubmission } from '../types';
import QRCode from 'qrcode';
import bulbImg from '../assets/images/ideation_logo.jpg';
import { generatePptTemplate, PPT_TEMPLATE_GUIDELINES } from '../lib/pptTemplate';
import {
  UserCheck,
  CheckCircle,
  Clock,
  XCircle,
  QrCode,
  Download,
  Printer,
  Edit3,
  Save,
  LogOut,
  Bell,
  Award,
  Users,
  ShieldCheck,
  ArrowLeft,
  Plus,
  Sparkles,
  UserPlus,
  FileText,
  UploadCloud,
  ExternalLink,
  Github,
  Globe,
  FileCheck,
  Info,
  Check,
  ChevronRight,
  Layers,
  HelpCircle,
  AlertCircle,
  X,
} from 'lucide-react';

export const ParticipantDashboard: React.FC = () => {
  const {
    eventConfig,
    registeredTeams,
    currentTeamSession,
    setCurrentTeamSession,
    updateTeam,
    setActiveView,
    setShowRegisterModal,
    submitProjectPresentation,
    announcements,
  } = useHackathon();

  const [loginEmailOrId, setLoginEmailOrId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loggedOutNotice, setLoggedOutNotice] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedIdea, setEditedIdea] = useState({
    ideaTitle: '',
    ideaSummary: '',
  });

  // PPT Template Download State
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const [showGuidelinesModal, setShowGuidelinesModal] = useState(false);

  // PPT Submission Modal State
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [submittingPpt, setSubmittingPpt] = useState(false);
  const [submissionFeedback, setSubmissionFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form Fields
  const [formProjectTitle, setFormProjectTitle] = useState('');
  const [formTrack, setFormTrack] = useState('');
  const [formProblemStatement, setFormProblemStatement] = useState('');
  const [formIdeaSummary, setFormIdeaSummary] = useState('');
  const [formPptDeckUrl, setFormPptDeckUrl] = useState('');
  const [formGithubUrl, setFormGithubUrl] = useState('');
  const [formDemoUrl, setFormDemoUrl] = useState('');
  const [formTechStackInput, setFormTechStackInput] = useState('');
  const [formPptFile, setFormPptFile] = useState<{ name: string; dataUrl?: string } | null>(null);

  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync edited idea if session changes
  useEffect(() => {
    if (currentTeamSession) {
      setEditedIdea({
        ideaTitle: currentTeamSession.ideaTitle || '',
        ideaSummary: currentTeamSession.ideaSummary || '',
      });

      const sub = currentTeamSession.submission;
      setFormProjectTitle(sub?.projectTitle || currentTeamSession.ideaTitle || '');
      setFormTrack(sub?.projectTrack || currentTeamSession.primaryTrack || '');
      setFormProblemStatement(sub?.problemStatement || currentTeamSession.problemStatement || '');
      setFormIdeaSummary(sub?.ideaSummary || currentTeamSession.ideaSummary || '');
      setFormPptDeckUrl(sub?.pptDeckUrl || '');
      setFormGithubUrl(sub?.githubUrl || '');
      setFormDemoUrl(sub?.demoUrl || '');
      setFormTechStackInput(sub?.techStack?.join(', ') || '');
      if (sub?.pptFileName) {
        setFormPptFile({ name: sub.pptFileName, dataUrl: sub.pptFileData });
      }
    }
  }, [currentTeamSession]);

  // Render QR Code on pass
  useEffect(() => {
    if (currentTeamSession && qrCanvasRef.current) {
      QRCode.toCanvas(
        qrCanvasRef.current,
        JSON.stringify({
          id: currentTeamSession.id,
          team: currentTeamSession.teamName,
          college: currentTeamSession.college,
          status: currentTeamSession.paymentStatus,
        }),
        { width: 140, margin: 1, color: { dark: '#050B1A', light: '#FFFFFF' } }
      );
    }
  }, [currentTeamSession]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const query = loginEmailOrId.trim().toLowerCase();
    const foundTeam = registeredTeams.find(
      t =>
        t.id.toLowerCase() === query ||
        t.members.some(m => m.email.toLowerCase() === query) ||
        t.teamName.toLowerCase() === query
    );

    if (foundTeam) {
      setCurrentTeamSession(foundTeam);
    } else {
      setLoginError('No registered team found with this Team ID or Leader Email. Check your registration pass.');
    }
  };

  const handleSaveIdea = () => {
    if (!currentTeamSession) return;
    updateTeam(currentTeamSession.id, {
      ideaTitle: editedIdea.ideaTitle,
      ideaSummary: editedIdea.ideaSummary,
    });
    setIsEditing(false);
  };

  const printPass = () => {
    window.print();
  };

  // Download PPT template
  const handleDownloadPptTemplate = async () => {
    try {
      setIsDownloadingTemplate(true);
      await generatePptTemplate({
        teamName: currentTeamSession?.teamName || 'IDEATION 2026 Team',
        teamId: currentTeamSession?.id || 'IDN-SAMPLE',
        leaderName: currentTeamSession?.members?.find(m => m.isLeader)?.name || currentTeamSession?.members?.[0]?.name,
        track: currentTeamSession?.primaryTrack || 'Artificial Intelligence & Smart Systems',
        college: currentTeamSession?.college || 'Bapuji Institute of Engineering and Technology (BIET)',
        problemTitle: currentTeamSession?.ideaTitle || 'Project Title / Working Prototype',
        problemSummary: currentTeamSession?.ideaSummary || 'Enter your project problem statement, proposed architecture, and impact.',
        members: currentTeamSession?.members,
      });
    } catch (err) {
      console.error('PPT generation error:', err);
      alert('Could not generate PPT file. Please check your browser permissions.');
    } finally {
      setIsDownloadingTemplate(false);
    }
  };

  // Handle file select
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      setSubmissionFeedback({
        type: 'error',
        text: 'File exceeds 25MB. Please upload to Google Drive/Canva and paste the share link below, or compress the presentation.',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFormPptFile({
        name: file.name,
        dataUrl: reader.result as string,
      });
      setSubmissionFeedback(null);
    };
    reader.readAsDataURL(file);
  };

  // Handle submission
  const handleSubmitPresentation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTeamSession) return;

    if (!formPptFile && !formPptDeckUrl.trim()) {
      setSubmissionFeedback({
        type: 'error',
        text: 'Please either upload a PPT file (.pptx / .pdf) or provide a Google Slides / Canva deck link.',
      });
      return;
    }

    setSubmittingPpt(true);
    setSubmissionFeedback(null);

    const techStack = formTechStackInput
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const res = await submitProjectPresentation(currentTeamSession.id, {
      projectTitle: formProjectTitle.trim() || currentTeamSession.ideaTitle,
      projectTrack: formTrack || currentTeamSession.primaryTrack,
      problemStatement: formProblemStatement.trim(),
      ideaSummary: formIdeaSummary.trim(),
      pptFileName: formPptFile?.name,
      pptFileData: formPptFile?.dataUrl,
      pptDeckUrl: formPptDeckUrl.trim(),
      githubUrl: formGithubUrl.trim(),
      demoUrl: formDemoUrl.trim(),
      techStack,
    });

    setSubmittingPpt(false);

    if (res.success) {
      setSubmissionFeedback({
        type: 'success',
        text: 'Project presentation submitted successfully! Admin and jury have been notified via automated alert.',
      });
      setTimeout(() => {
        setShowSubmissionModal(false);
        setSubmissionFeedback(null);
      }, 1800);
    } else {
      setSubmissionFeedback({
        type: 'error',
        text: res.error || 'Failed to submit presentation. Please try again.',
      });
    }
  };

  const submission = currentTeamSession?.submission;
  const isPptOpen = eventConfig?.pptSubmissionsOpen !== false;
  const submissionCount = submission?.submissionCount || (submission?.submittedAt ? 1 : 0);
  const canSubmitAgain = isPptOpen && submissionCount < 2;

  return (
    <div className="min-h-screen py-16 px-4 sm:px-6 lg:px-8 bg-[#050B1A] relative text-white">
      <div className="max-w-5xl mx-auto">
        {/* Top bar back button & actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
          <button
            onClick={() => setActiveView('home')}
            className="flex items-center gap-2 text-xs font-semibold text-[#9DB0D0] hover:text-[#35E0FF] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to IDEATION Home</span>
          </button>

          <div className="flex items-center gap-2.5">
            {/* Global PPT Template Download Button */}
            <button
              onClick={handleDownloadPptTemplate}
              disabled={isDownloadingTemplate}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-[#35E0FF] bg-[#35E0FF]/10 border border-[#35E0FF]/30 hover:bg-[#35E0FF]/20 transition-all cursor-pointer shadow-[0_0_15px_rgba(53,224,255,0.15)] disabled:opacity-50"
              title="Download official 8-slide PowerPoint presentation template"
            >
              <Download className={`w-3.5 h-3.5 ${isDownloadingTemplate ? 'animate-bounce' : ''}`} />
              <span>{isDownloadingTemplate ? 'Generating PPT...' : 'Download PPT Template (.pptx)'}</span>
            </button>

            {currentTeamSession ? (
              <button
                onClick={() => {
                  setCurrentTeamSession(null);
                  setLoggedOutNotice(true);
                }}
                className="flex items-center gap-1.5 text-xs font-mono text-rose-400 hover:text-rose-300 transition-colors cursor-pointer px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            ) : (
              <button
                onClick={() => setShowRegisterModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-[#FF8A2A] to-[#F5611A] shadow-[0_0_15px_rgba(255,138,42,0.3)] hover:brightness-110 transition-all cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Register New Team</span>
              </button>
            )}
          </div>
        </div>

        {!currentTeamSession ? (
          /* LOGIN FORM */
          <div className="max-w-md mx-auto">
            {loggedOutNotice && (
              <div className="mb-4 p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
                <div>
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span>Logged Out Successfully</span>
                  </div>
                  <p className="text-[11px] text-emerald-200/80 mt-0.5">
                    Sign in with another team ID or register a new team now.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(true)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#0052FF] to-[#35E0FF] hover:brightness-110 whitespace-nowrap shadow-md cursor-pointer"
                >
                  Register New
                </button>
              </div>
            )}

            <div className="p-8 rounded-3xl bg-[#081024] border border-[#35E0FF]/30 shadow-[0_0_50px_rgba(53,224,255,0.15)] text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#0C1630] border border-[#35E0FF]/40 mx-auto flex items-center justify-center mb-4 p-1 shadow-[0_0_20px_rgba(53,224,255,0.25)]">
                <img src={bulbImg} alt="IDEATION Logo" className="w-full h-full object-contain" />
              </div>

              <h2 className="text-2xl font-bold font-display text-white">Participant Login</h2>
              <p className="text-xs text-[#9DB0D0] mt-1 mb-6">
                Access your entry pass, submit project PPT presentation, and check jury status
              </p>

              {loginError && (
                <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
                  {loginError}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4 text-left">
                <div>
                  <label className="block text-xs font-semibold text-white mb-1">
                    Team ID or Leader Email
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. IDN-0001 or leader@college.edu"
                    value={loginEmailOrId}
                    onChange={(e) => setLoginEmailOrId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#0C1630] border border-[#78AAFF]/20 rounded-xl text-xs text-white focus:outline-none focus:border-[#35E0FF]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white mb-1">
                    Leader Account Password
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#0C1630] border border-[#78AAFF]/20 rounded-xl text-xs text-white focus:outline-none focus:border-[#35E0FF]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-[#FF8A2A] to-[#F5611A] shadow-[0_0_20px_rgba(255,138,42,0.4)] hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                >
                  Sign In to Dashboard
                </button>
              </form>

              {/* PPT Template Card for unregistered or pre-login students */}
              <div className="mt-6 p-4 rounded-2xl bg-[#0C1630] border border-[#35E0FF]/30 text-left">
                <div className="flex items-center gap-2 mb-1 text-[#35E0FF]">
                  <FileText className="w-4 h-4" />
                  <span className="text-xs font-bold font-mono">Official PPT Template Available</span>
                </div>
                <p className="text-[11px] text-[#9DB0D0] leading-relaxed mb-3">
                  Prepare your presentation using BIET's official 8-slide deck matching the required submission guidelines and format.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadPptTemplate}
                    disabled={isDownloadingTemplate}
                    className="flex-1 py-2 px-3 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#0052FF] to-[#35E0FF] hover:brightness-110 flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isDownloadingTemplate ? 'Downloading...' : 'Download Template (.pptx)'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowGuidelinesModal(true)}
                    className="py-2 px-3 rounded-xl text-xs font-mono text-[#9DB0D0] hover:text-white bg-[#081024] border border-[#78AAFF]/30 hover:border-[#35E0FF] transition-colors cursor-pointer"
                  >
                    Guidelines
                  </button>
                </div>
              </div>

              {/* REGISTER NEW TEAM OPTION ON LOGOUT / LOGIN */}
              <div className="mt-6 pt-5 border-t border-[#78AAFF]/20 text-center">
                <p className="text-xs text-[#9DB0D0] mb-2.5">
                  Haven't registered your team yet, or want to register a new team?
                </p>
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(true)}
                  className="w-full py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-[#0052FF] to-[#35E0FF] shadow-[0_0_20px_rgba(53,224,255,0.25)] hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Register New Team (₹100)</span>
                </button>
              </div>

              <div className="mt-4 pt-3 border-t border-[#78AAFF]/10 text-xs text-[#9DB0D0] flex items-center justify-center gap-1.5 font-mono">
                <ShieldCheck className="w-3.5 h-3.5 text-[#35E0FF]" />
                <span>Use credentials set during team registration</span>
              </div>
            </div>
          </div>
        ) : (
          /* PARTICIPANT DASHBOARD VIEW */
          <div className="space-y-8">
            {/* Top Team Header Banner */}
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#0C1630] via-[#11234D] to-[#0C1630] border border-[#35E0FF]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-[0_0_40px_rgba(53,224,255,0.15)]">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-[#35E0FF]/15 text-[#35E0FF] border border-[#35E0FF]/30 font-bold">
                    {currentTeamSession.id}
                  </span>
                  <span className="text-xs text-[#9DB0D0]">· {currentTeamSession.course}</span>
                  <span className="text-xs text-[#35E0FF]">· {currentTeamSession.primaryTrack}</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black font-display text-white">
                  {currentTeamSession.teamName}
                </h1>
                <p className="text-xs text-[#9DB0D0] mt-1">{currentTeamSession.college}</p>
              </div>

              {/* Payment Verification Status Badge */}
              <div className="flex flex-col items-start sm:items-end gap-1.5">
                <span className="text-[10px] font-mono text-[#9DB0D0] uppercase">Payment Status</span>
                {currentTeamSession.paymentStatus === 'Verified' && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400 text-emerald-300 font-mono text-xs font-bold shadow-[0_0_12px_rgba(16,185,129,0.3)]">
                    <CheckCircle className="w-4 h-4" />
                    <span>Verified & Confirmed</span>
                  </div>
                )}
                {currentTeamSession.paymentStatus === 'Pending' && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-400 text-amber-300 font-mono text-xs font-bold">
                    <Clock className="w-4 h-4 animate-spin" />
                    <span>Awaiting Bank Verification</span>
                  </div>
                )}
                {currentTeamSession.paymentStatus === 'Rejected' && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/20 border border-rose-400 text-rose-300 font-mono text-xs font-bold">
                    <XCircle className="w-4 h-4" />
                    <span>Payment Rejected</span>
                  </div>
                )}
                <span className="text-[10px] font-mono text-[#78AAFF]">
                  Ref: {currentTeamSession.paymentTransactionId}
                </span>
              </div>
            </div>

            {/* Live Approval Message Banner */}
            {currentTeamSession.paymentStatus === 'Verified' && (
              <div className="p-5 rounded-2xl bg-emerald-500/15 border border-emerald-400 text-emerald-200 text-xs sm:text-sm flex items-start gap-3 shadow-[0_0_20px_rgba(16,185,129,0.2)] animate-in fade-in duration-300">
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-white text-sm">Official Payment Approval Confirmed!</div>
                  <p className="text-xs text-emerald-200/90 mt-1 leading-relaxed">
                    The organizing committee has verified and approved your UPI transaction ({currentTeamSession.paymentTransactionId}). Your official entry pass is confirmed and activated for physical check-in at the BIET Main Auditorium on 18 November 2026.
                  </p>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* FEATURE 1 & 2: PPT PRESENTATION SUBMISSION & EVALUATION PANEL */}
            {/* ========================================================================= */}
            <div className="p-6 sm:p-8 rounded-3xl bg-[#081024] border-2 border-[#35E0FF]/40 shadow-[0_0_50px_rgba(53,224,255,0.15)] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-[#0052FF]/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#78AAFF]/20">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="font-mono text-[11px] px-2.5 py-0.5 rounded bg-[#35E0FF]/20 text-[#35E0FF] border border-[#35E0FF]/40 font-bold uppercase tracking-wider">
                        Hackathon Evaluation
                      </span>
                      {submission ? (
                        <span className={`font-mono text-[11px] px-2.5 py-0.5 rounded border font-bold ${
                          submission.evaluationStatus === 'Shortlisted'
                            ? 'bg-purple-500/20 text-purple-300 border-purple-400'
                            : submission.evaluationStatus === 'Evaluated'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400'
                            : submission.evaluationStatus === 'Needs Revision'
                            ? 'bg-rose-500/20 text-rose-300 border-rose-400'
                            : 'bg-amber-500/20 text-amber-300 border-amber-400'
                        }`}>
                          ● {submission.evaluationStatus}
                        </span>
                      ) : (
                        <span className="font-mono text-[11px] px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400/40 font-bold">
                          Submission Pending
                        </span>
                      )}
                      <span className={`font-mono text-[11px] px-2.5 py-0.5 rounded border font-bold ${
                        !isPptOpen
                          ? 'bg-rose-500/20 text-rose-300 border-rose-400/40'
                          : submissionCount >= 2
                          ? 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                      }`}>
                        {!isPptOpen ? 'Submissions Closed' : `${submissionCount}/2 Submissions Used`}
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black font-display text-white flex items-center gap-2">
                      <Award className="w-6 h-6 text-[#35E0FF]" />
                      <span>Project PPT & Pitch Deck Submission</span>
                    </h2>
                    <p className="text-xs text-[#9DB0D0] mt-1">
                      Complete your pitch deck and submit your project for review. Each team can submit their presentation deck a maximum of 2 times.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      onClick={() => setShowGuidelinesModal(true)}
                      className="px-3.5 py-2 rounded-xl text-xs font-mono text-[#9DB0D0] hover:text-white bg-[#0C1630] border border-[#78AAFF]/20 hover:border-[#35E0FF] transition-all cursor-pointer"
                    >
                      Slide Structure
                    </button>

                    {!isPptOpen ? (
                      <div className="px-4 py-2 rounded-xl text-xs font-bold text-rose-300 bg-rose-500/15 border border-rose-500/30 flex items-center gap-1.5 cursor-not-allowed">
                        <XCircle className="w-4 h-4 text-rose-400" />
                        <span>Submissions Closed</span>
                      </div>
                    ) : submissionCount >= 2 ? (
                      <div className="px-4 py-2 rounded-xl text-xs font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 flex items-center gap-1.5 cursor-not-allowed">
                        <CheckCircle className="w-4 h-4 text-amber-400" />
                        <span>Max 2 Submissions Used</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowSubmissionModal(true)}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#FF8A2A] to-[#F5611A] shadow-[0_0_20px_rgba(255,138,42,0.4)] hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <UploadCloud className="w-4 h-4" />
                        <span>{submission ? `Update PPT (${submissionCount + 1} of 2)` : 'Submit Project PPT (Attempt 1 of 2)'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Closed Alert Banner if admin stopped submissions */}
                {!isPptOpen && (
                  <div className="mt-4 p-4 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                    <div>
                      <div className="font-bold text-white text-sm">PPT Submissions are Currently Closed</div>
                      <p className="text-rose-200/80 mt-0.5">
                        The organizing committee has stopped accepting PPT submissions and revisions. If you require emergency assistance, please contact the helpline.
                      </p>
                    </div>
                  </div>
                )}

                {/* Submission State Display */}
                {submission ? (
                  <div className="mt-6 space-y-6">
                    {/* Status Highlights (NO jury score or jury name displayed) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="p-4 rounded-2xl bg-[#0C1630] border border-[#78AAFF]/20">
                        <span className="text-[10px] font-mono uppercase text-[#9DB0D0] block mb-1">
                          Submission Status
                        </span>
                        <div className="font-display font-bold text-white text-base flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                          <span>{submission.evaluationStatus}</span>
                        </div>
                        <div className="text-[10px] text-[#9DB0D0] mt-1 font-mono">
                          Updated: {new Date(submission.updatedAt || submission.submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-[#0C1630] border border-[#78AAFF]/20">
                        <span className="text-[10px] font-mono uppercase text-[#9DB0D0] block mb-1">
                          Submission Attempts
                        </span>
                        <div className="font-display font-bold text-base flex items-center gap-1.5">
                          <span className="text-xl text-[#35E0FF] font-black">
                            {submissionCount} <span className="text-xs text-[#9DB0D0] font-normal">/ 2 attempts used</span>
                          </span>
                        </div>
                        <div className="text-[10px] text-[#9DB0D0] mt-1 font-mono">
                          {submissionCount >= 2 ? (
                            <span className="text-amber-400 font-bold">Maximum limit reached (Locked)</span>
                          ) : (
                            <span className="text-emerald-400 font-bold">1 revision attempt remaining</span>
                          )}
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-[#0C1630] border border-[#78AAFF]/20">
                        <span className="text-[10px] font-mono uppercase text-[#9DB0D0] block mb-1">
                          Presentation File / Deck
                        </span>
                        <div className="text-xs font-bold text-white truncate">
                          {submission.pptFileName || (submission.pptDeckUrl ? 'External Deck Link' : 'Not Uploaded')}
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                          {submission.pptFileData ? (
                            <a
                              href={submission.pptFileData}
                              download={submission.pptFileName || `${currentTeamSession.id}_Presentation.pptx`}
                              className="text-[11px] text-[#35E0FF] hover:underline flex items-center gap-1 font-mono"
                            >
                              <Download className="w-3 h-3" />
                              <span>Download File</span>
                            </a>
                          ) : null}
                          {submission.pptDeckUrl ? (
                            <a
                              href={submission.pptDeckUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] text-[#35E0FF] hover:underline flex items-center gap-1 font-mono"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>Open Deck</span>
                            </a>
                          ) : null}
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-[#0C1630] border border-[#78AAFF]/20">
                        <span className="text-[10px] font-mono uppercase text-[#9DB0D0] block mb-1">
                          Code & Demo Links
                        </span>
                        <div className="flex items-center gap-3 mt-1.5">
                          {submission.githubUrl ? (
                            <a
                              href={submission.githubUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1 rounded-lg bg-[#081024] border border-[#78AAFF]/30 text-xs text-white hover:text-[#35E0FF] hover:border-[#35E0FF] flex items-center gap-1.5 transition-colors"
                            >
                              <Github className="w-3.5 h-3.5" />
                              <span>Repo</span>
                            </a>
                          ) : (
                            <span className="text-[11px] text-[#9DB0D0]">No GitHub URL</span>
                          )}
                          {submission.demoUrl ? (
                            <a
                              href={submission.demoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1 rounded-lg bg-[#081024] border border-[#78AAFF]/30 text-xs text-white hover:text-[#35E0FF] hover:border-[#35E0FF] flex items-center gap-1.5 transition-colors"
                            >
                              <Globe className="w-3.5 h-3.5" />
                              <span>Demo</span>
                            </a>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    {/* Detailed Submission Body */}
                    <div className="p-6 rounded-2xl bg-[#0C1630] border border-[#78AAFF]/20 space-y-4">
                      <div>
                        <span className="text-[10px] font-mono uppercase text-[#35E0FF] font-bold">
                          Project Title
                        </span>
                        <h3 className="text-lg font-bold text-white mt-0.5">
                          {submission.projectTitle || currentTeamSession.ideaTitle}
                        </h3>
                      </div>

                      {submission.problemStatement && (
                        <div>
                          <span className="text-[10px] font-mono uppercase text-[#9DB0D0]">
                            Problem Statement Addressed
                          </span>
                          <p className="text-xs text-white/90 leading-relaxed mt-0.5">
                            {submission.problemStatement}
                          </p>
                        </div>
                      )}

                      {submission.ideaSummary && (
                        <div>
                          <span className="text-[10px] font-mono uppercase text-[#9DB0D0]">
                            Proposed Solution & Architecture
                          </span>
                          <p className="text-xs text-[#9DB0D0] leading-relaxed mt-0.5">
                            {submission.ideaSummary}
                          </p>
                        </div>
                      )}

                      {submission.techStack && submission.techStack.length > 0 && (
                        <div>
                          <span className="text-[10px] font-mono uppercase text-[#9DB0D0] block mb-1.5">
                            Tech Stack & Frameworks
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {submission.techStack.map((tech, idx) => (
                              <span
                                key={idx}
                                className="px-2.5 py-0.5 rounded-md bg-[#35E0FF]/10 text-[#35E0FF] border border-[#35E0FF]/30 text-[11px] font-mono"
                              >
                                {tech}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Review Feedback Notes without displaying jury names or scores */}
                      {submission.feedback && (
                        <div className="mt-4 p-4 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-200 text-xs">
                          <div className="font-bold text-white flex items-center gap-1.5 mb-1">
                            <Sparkles className="w-4 h-4 text-purple-400" />
                            <span>Review Notes & Feedback</span>
                          </div>
                          <p className="leading-relaxed text-purple-200/90">{submission.feedback}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Not yet submitted state */
                  <div className="mt-6 p-6 rounded-2xl bg-[#0C1630] border border-dashed border-[#35E0FF]/40 text-center space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#35E0FF]/10 border border-[#35E0FF]/30 text-[#35E0FF] mx-auto flex items-center justify-center">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <div className="max-w-md mx-auto">
                      <h3 className="font-bold text-base text-white">Your Project Presentation Has Not Been Submitted Yet</h3>
                      <p className="text-xs text-[#9DB0D0] mt-1 leading-relaxed">
                        Teams must submit their PowerPoint presentation (.pptx) or Google Slides deck. Each team is permitted a maximum of 2 submission attempts.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                      {!isPptOpen ? (
                        <div className="px-5 py-2.5 rounded-xl text-xs font-bold text-rose-300 bg-rose-500/15 border border-rose-500/30 flex items-center gap-2">
                          <XCircle className="w-4 h-4 text-rose-400" />
                          <span>PPT Submissions Closed by Organizers</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowSubmissionModal(true)}
                          className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#FF8A2A] to-[#F5611A] shadow-[0_0_20px_rgba(255,138,42,0.4)] hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                        >
                          <UploadCloud className="w-4 h-4" />
                          <span>Submit Project PPT Now (Attempt 1 of 2)</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Grid: Digital Pass + Team Details */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Pass Card with QR */}
              <div 
                id="printable-pass" 
                className="printable-entry-pass lg:col-span-5 p-6 rounded-2xl bg-[#081024] border border-[#35E0FF]/30 flex flex-col justify-between space-y-6 shadow-xl"
              >
                <div>
                  <div className="flex items-center justify-between pb-4 border-b border-[#78AAFF]/20">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#0C1630] border border-[#35E0FF]/40 p-0.5 flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(53,224,255,0.25)]">
                        <img src={bulbImg} alt="IDEATION Logo" className="w-full h-full object-contain" />
                      </div>
                      <div>
                        <div className="text-[10px] font-mono text-[#35E0FF] uppercase font-bold">
                          IDEATION 2026 · BIET Davangere
                        </div>
                        <h3 className="font-display font-bold text-lg text-white mt-0.5">
                          {currentTeamSession.teamName}
                        </h3>
                        <div className="text-[11px] text-[#9DB0D0]">{currentTeamSession.college}</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30 shrink-0">
                      {currentTeamSession.checkedIn ? 'CHECKED-IN' : 'ENTRY PASS'}
                    </span>
                  </div>

                  <div className="my-6 text-center">
                    <div className="p-3 bg-white rounded-2xl shadow-xl inline-block">
                      <canvas ref={qrCanvasRef} className="w-36 h-36" />
                    </div>
                    <div className="font-mono text-xs text-[#35E0FF] font-bold mt-2">
                      {currentTeamSession.id}
                    </div>
                    <div className="text-[11px] text-[#9DB0D0] mt-0.5">
                      Present at BIET Main Auditorium Registration Desk
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-[#78AAFF]/15">
                      <span className="text-[#9DB0D0]">Primary Track</span>
                      <span className="font-semibold text-white">{currentTeamSession.primaryTrack}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#78AAFF]/15">
                      <span className="text-[#9DB0D0]">Backup Track</span>
                      <span className="text-white">{currentTeamSession.backupTrack}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-[#9DB0D0]">Reporting Date</span>
                      <span className="text-white font-mono">18 Nov 2026, 08:00 AM</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#78AAFF]/20 flex items-center gap-3">
                  <button
                    onClick={printPass}
                    className="w-full py-2.5 rounded-xl text-xs font-semibold text-white bg-[#132247] hover:bg-[#1a2d5c] border border-[#35E0FF]/30 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Printer className="w-4 h-4 text-[#35E0FF]" />
                    <span>Print Entry Pass</span>
                  </button>
                </div>
              </div>

              {/* Team Members and Project Idea */}
              <div className="lg:col-span-7 space-y-6">
                {/* Team Members */}
                <div className="p-6 rounded-2xl bg-[#0C1630] border border-[#78AAFF]/20">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display font-bold text-base text-white flex items-center gap-2">
                      <Users className="w-4 h-4 text-[#35E0FF]" />
                      <span>Registered Members ({currentTeamSession.members.length})</span>
                    </h3>
                  </div>

                  <div className="space-y-3">
                    {currentTeamSession.members.map((member) => (
                      <div
                        key={member.id}
                        className="p-3.5 rounded-xl bg-[#081024] border border-[#78AAFF]/15 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-white flex items-center gap-2">
                            <span>{member.name}</span>
                            {member.isLeader && (
                              <span className="text-[10px] font-mono text-[#FF8A2A] bg-[#FF8A2A]/15 px-1.5 py-0.5 rounded">
                                Leader
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-[#9DB0D0] mt-0.5">
                            USN: <span className="font-mono text-white">{member.usn}</span> · {member.branch} ({member.year})
                          </div>
                        </div>

                        <div className="text-right text-[11px] text-[#9DB0D0]">
                          <div className="text-white truncate max-w-[180px]">{member.email}</div>
                          <div className="font-mono text-[#35E0FF] mt-0.5">{member.phone}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Project Idea (Editable until deadline) */}
                <div className="p-6 rounded-2xl bg-[#0C1630] border border-[#78AAFF]/20">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-display font-bold text-base text-white flex items-center gap-2">
                      <Award className="w-4 h-4 text-[#FF4FD8]" />
                      <span>Preliminary Abstract Details</span>
                    </h3>

                    {!isEditing ? (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-1 text-xs text-[#35E0FF] hover:underline font-mono cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit Abstract</span>
                      </button>
                    ) : (
                      <button
                        onClick={handleSaveIdea}
                        className="flex items-center gap-1 px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-400 rounded-lg text-xs font-mono font-bold cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Save Changes</span>
                      </button>
                    )}
                  </div>

                  {!isEditing ? (
                    <div className="space-y-2 text-xs">
                      <div className="font-bold text-white text-sm">
                        {currentTeamSession.ideaTitle || 'No preliminary title provided yet'}
                      </div>
                      <p className="text-[#9DB0D0] leading-relaxed">
                        {currentTeamSession.ideaSummary || 'Abstract summary can be updated before 15 November.'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-[#9DB0D0] mb-1">Project Title</label>
                        <input
                          type="text"
                          value={editedIdea.ideaTitle}
                          onChange={(e) => setEditedIdea({ ...editedIdea, ideaTitle: e.target.value })}
                          className="w-full px-3 py-2 bg-[#081024] border border-[#78AAFF]/20 rounded-lg text-xs text-white focus:outline-none focus:border-[#35E0FF]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-[#9DB0D0] mb-1">Abstract Summary</label>
                        <textarea
                          rows={3}
                          value={editedIdea.ideaSummary}
                          onChange={(e) => setEditedIdea({ ...editedIdea, ideaSummary: e.target.value })}
                          className="w-full px-3 py-2 bg-[#081024] border border-[#78AAFF]/20 rounded-lg text-xs text-white focus:outline-none focus:border-[#35E0FF]"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: SUBMIT PROJECT PRESENTATION FORM */}
      {/* ========================================================================= */}
      {showSubmissionModal && currentTeamSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-2xl bg-[#081024] border border-[#35E0FF]/40 rounded-3xl p-6 sm:p-8 shadow-[0_0_60px_rgba(53,224,255,0.25)] relative my-8 animate-in fade-in zoom-in-95">
            <button
              onClick={() => {
                setShowSubmissionModal(false);
                setSubmissionFeedback(null);
              }}
              className="absolute top-5 right-5 text-[#9DB0D0] hover:text-white p-1 rounded-lg bg-[#0C1630] border border-[#78AAFF]/20"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-[#35E0FF]/15 border border-[#35E0FF]/40 text-[#35E0FF] flex items-center justify-center">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-[#35E0FF] font-bold uppercase tracking-wider">
                    Pitch Deck Submission · Team {currentTeamSession.id}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#35E0FF]/15 text-[#35E0FF] border border-[#35E0FF]/30">
                    Attempt {Math.min(submissionCount + 1, 2)} of 2
                  </span>
                </div>
                <h3 className="text-xl font-bold font-display text-white">
                  {submission ? 'Revise Project Presentation' : 'Submit Project Presentation'}
                </h3>
              </div>
            </div>

            <p className="text-xs text-[#9DB0D0] mb-4">
              Upload your completed PowerPoint presentation file (.pptx / .pdf) or paste a public Google Slides/Canva link. Each registered team is permitted a maximum of 2 submission attempts.
            </p>

            {!isPptOpen && (
              <div className="mb-4 p-3.5 rounded-xl text-xs bg-rose-500/15 border border-rose-400 text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>PPT Submissions are currently closed by the organizers.</span>
              </div>
            )}

            {submissionCount >= 2 && (
              <div className="mb-4 p-3.5 rounded-xl text-xs bg-amber-500/15 border border-amber-400 text-amber-300 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>You have used both of your 2 permitted submission attempts. Further revisions are locked.</span>
              </div>
            )}

            {submissionFeedback && (
              <div
                className={`mb-5 p-3.5 rounded-xl text-xs flex items-center gap-2 ${
                  submissionFeedback.type === 'success'
                    ? 'bg-emerald-500/15 border border-emerald-400 text-emerald-300'
                    : 'bg-rose-500/15 border border-rose-400 text-rose-300'
                }`}
              >
                {submissionFeedback.type === 'success' ? (
                  <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
                ) : (
                  <XCircle className="w-4 h-4 shrink-0 text-rose-400" />
                )}
                <span>{submissionFeedback.text}</span>
              </div>
            )}

            <form onSubmit={handleSubmitPresentation} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-white mb-1">
                  Project Title *
                </label>
                <input
                  type="text"
                  required
                  value={formProjectTitle}
                  onChange={(e) => setFormProjectTitle(e.target.value)}
                  placeholder="e.g. AI-Powered Smart Irrigation System for Arecanut Farms"
                  className="w-full px-3.5 py-2.5 bg-[#0C1630] border border-[#78AAFF]/20 rounded-xl text-xs text-white focus:outline-none focus:border-[#35E0FF]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-white mb-1">
                    Primary Domain Track
                  </label>
                  <input
                    type="text"
                    value={formTrack}
                    onChange={(e) => setFormTrack(e.target.value)}
                    placeholder="e.g. Artificial Intelligence & Smart Systems"
                    className="w-full px-3.5 py-2.5 bg-[#0C1630] border border-[#78AAFF]/20 rounded-xl text-xs text-white focus:outline-none focus:border-[#35E0FF]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white mb-1">
                    Tech Stack / Libraries (Comma separated)
                  </label>
                  <input
                    type="text"
                    value={formTechStackInput}
                    onChange={(e) => setFormTechStackInput(e.target.value)}
                    placeholder="e.g. React, Python, TensorFlow, ESP32, Firebase"
                    className="w-full px-3.5 py-2.5 bg-[#0C1630] border border-[#78AAFF]/20 rounded-xl text-xs text-white focus:outline-none focus:border-[#35E0FF]"
                  />
                </div>
              </div>

              {/* PPT FILE UPLOAD DROPZONE */}
              <div>
                <label className="block text-xs font-semibold text-white mb-1">
                  Upload Presentation File (.pptx, .ppt, .pdf)
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-[#35E0FF]/40 rounded-2xl p-5 text-center bg-[#0C1630]/60 hover:bg-[#0C1630] transition-colors cursor-pointer group"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pptx,.ppt,.pdf,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.ms-powerpoint,application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="w-10 h-10 rounded-xl bg-[#35E0FF]/15 text-[#35E0FF] mx-auto flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <FileText className="w-5 h-5" />
                  </div>
                  {formPptFile ? (
                    <div>
                      <div className="text-xs font-bold text-emerald-400 flex items-center justify-center gap-1.5">
                        <Check className="w-4 h-4" />
                        <span>{formPptFile.name}</span>
                      </div>
                      <span className="text-[10px] text-[#9DB0D0] mt-0.5 block">
                        File selected. Click to replace with another file.
                      </span>
                    </div>
                  ) : (
                    <div>
                      <div className="text-xs font-semibold text-white">
                        Click to browse or drag & drop PPTX presentation file
                      </div>
                      <div className="text-[10px] text-[#9DB0D0] mt-1 font-mono">
                        Supports .pptx, .ppt, .pdf (Max 25MB)
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* OR Google Slides / Pitch Deck URL */}
              <div>
                <label className="block text-xs font-semibold text-white mb-1 flex items-center justify-between">
                  <span>OR Google Slides / Canva / Pitch Deck Share URL</span>
                  <span className="text-[10px] font-normal text-[#9DB0D0] font-mono">(Optional if file uploaded)</span>
                </label>
                <input
                  type="url"
                  value={formPptDeckUrl}
                  onChange={(e) => setFormPptDeckUrl(e.target.value)}
                  placeholder="https://docs.google.com/presentation/d/... or Canva share link"
                  className="w-full px-3.5 py-2.5 bg-[#0C1630] border border-[#78AAFF]/20 rounded-xl text-xs text-white focus:outline-none focus:border-[#35E0FF]"
                />
              </div>

              {/* GitHub and Live Demo Links */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-white mb-1">
                    GitHub Repository Link (Optional)
                  </label>
                  <input
                    type="url"
                    value={formGithubUrl}
                    onChange={(e) => setFormGithubUrl(e.target.value)}
                    placeholder="https://github.com/team-repo"
                    className="w-full px-3.5 py-2.5 bg-[#0C1630] border border-[#78AAFF]/20 rounded-xl text-xs text-white focus:outline-none focus:border-[#35E0FF]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white mb-1">
                    Live Demo / Video Prototype Link (Optional)
                  </label>
                  <input
                    type="url"
                    value={formDemoUrl}
                    onChange={(e) => setFormDemoUrl(e.target.value)}
                    placeholder="https://my-demo-app.vercel.app or YouTube"
                    className="w-full px-3.5 py-2.5 bg-[#0C1630] border border-[#78AAFF]/20 rounded-xl text-xs text-white focus:outline-none focus:border-[#35E0FF]"
                  />
                </div>
              </div>

              {/* Problem statement & Summary */}
              <div>
                <label className="block text-xs font-semibold text-white mb-1">
                  Problem Statement & Impact Description
                </label>
                <textarea
                  rows={2}
                  value={formProblemStatement}
                  onChange={(e) => setFormProblemStatement(e.target.value)}
                  placeholder="Summarize the core engineering or societal challenge your project tackles."
                  className="w-full px-3.5 py-2 bg-[#0C1630] border border-[#78AAFF]/20 rounded-xl text-xs text-white focus:outline-none focus:border-[#35E0FF]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white mb-1">
                  Solution Architecture & Core Innovations
                </label>
                <textarea
                  rows={3}
                  value={formIdeaSummary}
                  onChange={(e) => setFormIdeaSummary(e.target.value)}
                  placeholder="Outline the technical pipeline, models/algorithms, hardware setup, and business feasibility."
                  className="w-full px-3.5 py-2 bg-[#0C1630] border border-[#78AAFF]/20 rounded-xl text-xs text-white focus:outline-none focus:border-[#35E0FF]"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-[#78AAFF]/20 flex flex-col sm:flex-row items-center justify-between gap-3">
                <span className="text-[11px] font-mono text-[#9DB0D0]">
                  {submissionCount >= 2 ? (
                    <span className="text-amber-400 font-bold">Limit: 2/2 attempts used (No further submissions)</span>
                  ) : !isPptOpen ? (
                    <span className="text-rose-400 font-bold">Submissions currently stopped by Admin</span>
                  ) : (
                    <span>Max 2 submissions permitted per team</span>
                  )}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSubmissionModal(false);
                      setSubmissionFeedback(null);
                    }}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#9DB0D0] hover:text-white bg-[#0C1630] border border-[#78AAFF]/20 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={submittingPpt || !canSubmitAgain}
                    className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#FF8A2A] to-[#F5611A] shadow-[0_0_20px_rgba(255,138,42,0.4)] hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submittingPpt ? (
                      <>
                        <Clock className="w-4 h-4 animate-spin" />
                        <span>Submitting to Jury...</span>
                      </>
                    ) : !isPptOpen ? (
                      <span>Submissions Closed</span>
                    ) : submissionCount >= 2 ? (
                      <span>Max Attempts Used</span>
                    ) : (
                      <>
                        <UploadCloud className="w-4 h-4" />
                        <span>{submission ? `Submit Revision (${submissionCount + 1} of 2)` : 'Submit Presentation (Attempt 1 of 2)'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: 10-SLIDE TEMPLATE GUIDELINES ACCORDION / PREVIEW */}
      {/* ========================================================================= */}
      {showGuidelinesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-2xl bg-[#081024] border border-[#35E0FF]/40 rounded-3xl p-6 sm:p-8 shadow-[0_0_60px_rgba(53,224,255,0.25)] relative my-8 animate-in fade-in zoom-in-95">
            <button
              onClick={() => setShowGuidelinesModal(false)}
              className="absolute top-5 right-5 text-[#9DB0D0] hover:text-white p-1 rounded-lg bg-[#0C1630] border border-[#78AAFF]/20 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-[#35E0FF]/15 border border-[#35E0FF]/40 text-[#35E0FF] flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-[#35E0FF] font-bold uppercase tracking-wider">
                  Official BIET Presentation Structure
                </span>
                <h3 className="text-xl font-bold font-display text-white">
                  8-Slide Official Template Guidelines
                </h3>
              </div>
            </div>

            <p className="text-xs text-[#9DB0D0] mb-5">
              Each team has 8 minutes to present followed by 2 minutes of Q&A with the jury. Follow this standardized slide deck flow for maximum scoring.
            </p>

            <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-2">
              {PPT_TEMPLATE_GUIDELINES.map((item) => (
                <div
                  key={item.slideNumber}
                  className="p-3.5 rounded-xl bg-[#0C1630] border border-[#78AAFF]/15 flex items-start gap-3 hover:border-[#35E0FF]/40 transition-colors"
                >
                  <span className="w-6 h-6 rounded-lg bg-[#35E0FF]/20 text-[#35E0FF] font-mono font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {item.slideNumber}
                  </span>
                  <div className="flex-1 text-xs">
                    <div className="font-bold text-white flex items-center justify-between">
                      <span>{item.title}</span>
                      <span className="text-[10px] font-mono text-[#9DB0D0] uppercase">Slide {item.slideNumber}</span>
                    </div>
                    <p className="text-[11px] text-[#9DB0D0] mt-1 leading-relaxed">
                      {item.guidelines}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-[#78AAFF]/20 flex items-center justify-between gap-3">
              <span className="text-xs text-[#9DB0D0] font-mono">
                Duration: 8 Min Pitch + 2 Min Q&A
              </span>
              <button
                type="button"
                onClick={handleDownloadPptTemplate}
                disabled={isDownloadingTemplate}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#0052FF] to-[#35E0FF] hover:brightness-110 flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Ready-to-Use .pptx</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
