import React, { useState } from 'react';
import { useHackathon } from '../context/HackathonContext';
import { RegisteredTeam, DomainTrack, Announcement, CoreTeamMember, ScheduleEvent, RuleItem, ProjectSubmission, SubmissionNotification } from '../types';
import { sendTransactionalEmail, generatePassEmailHtml } from '../lib/email';
import { AdminQRScanner } from './AdminQRScanner';
import { generatePptTemplate } from '../lib/pptTemplate';
import {
  ShieldCheck,
  Users,
  CreditCard,
  Bell,
  Sliders,
  QrCode,
  Download,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Edit,
  Trash2,
  Plus,
  RefreshCw,
  Eye,
  LogOut,
  ArrowLeft,
  FileSpreadsheet,
  AlertCircle,
  Camera,
  Layers,
  Printer,
  Newspaper,
  Database,
  Scale,
  RotateCcw,
  Save,
  ExternalLink,
  Award,
  FileText,
  UploadCloud,
  Globe,
  Github,
  Sparkles,
  X,
  MessageSquare,
  Check,
} from 'lucide-react';

export const AdminPanel: React.FC = () => {
  const {
    eventConfig,
    updateEventConfig,
    registeredTeams,
    updatePaymentStatus,
    toggleCheckIn,
    tracks,
    updateTrack,
    addTrack,
    deleteTrack,
    announcements,
    addAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    coreTeam,
    updateCoreMember,
    addCoreMember,
    deleteCoreMember,
    exportTeamsToCSV,
    exportTeamsToSQL,
    resetAllData,
    setActiveView,
    schedule,
    addScheduleEvent,
    updateScheduleEvent,
    deleteScheduleEvent,
    resetScheduleToDefault,
    rules,
    addRule,
    updateRule,
    deleteRule,
    resetRulesToDefault,
    googleUser,
    isGoogleSheetsConnected,
    googleSheetUrl,
    autoSyncGoogleSheets,
    setAutoSyncGoogleSheets,
    connectGoogleSheets,
    disconnectGoogleSheets,
    syncGoogleSheets,
    fetchFromGoogleSheets,
    submissionNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    evaluateProjectSubmission,
  } = useHackathon();

  // Authorized Administrator Accounts
  interface AdminAccount {
    email: string;
    passkey: string;
    name: string;
    role: 'Super Admin' | 'Co-ordinator' | 'Viewer';
  }

  const AUTHORIZED_ADMINS: AdminAccount[] = [
    {
      email: 'ktarunkumar1832@gmai.com',
      passkey: '183220',
      name: 'Tarun Kumar K',
      role: 'Super Admin',
    },
    {
      email: 'ktarunkumar1832@gmail.com',
      passkey: '183220',
      name: 'Tarun Kumar K',
      role: 'Super Admin',
    },
    {
      email: 'srmegha2009@gmail.com',
      passkey: '200906',
      name: 'Megha S R',
      role: 'Super Admin',
    },
    {
      email: 'kishannr93@gmail.com',
      passkey: '150140',
      name: 'Kishan N R',
      role: 'Super Admin',
    },
    {
      email: 'bietdvganveshanclub@gmail.com',
      passkey: '111890',
      name: 'Anveshan Club BIET',
      role: 'Super Admin',
    },
    {
      email: 'gouthamga88@gmail.com',
      passkey: '183202',
      name: 'Goutham G A',
      role: 'Super Admin',
    },
  ];

  // Admin Auth State with session persistence
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('ideation_admin_auth') === 'true';
  });
  const [currentAdminUser, setCurrentAdminUser] = useState<{ email: string; name: string } | null>(() => {
    const saved = sessionStorage.getItem('ideation_admin_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminRole, setAdminRole] = useState<'Super Admin' | 'Co-ordinator' | 'Viewer'>('Super Admin');
  const [authError, setAuthError] = useState('');

  // Active Tab
  const [activeTab, setActiveTab] = useState<'overview' | 'teams' | 'payments' | 'submissions' | 'news' | 'content' | 'coreteam' | 'checkin' | 'schedule' | 'rules'>('overview');

  // Notifications Dropdown State
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);

  // Project PPT Submissions Tab State
  const [submissionSearch, setSubmissionSearch] = useState('');
  const [submissionTrackFilter, setSubmissionTrackFilter] = useState('All');
  const [submissionStatusFilter, setSubmissionStatusFilter] = useState('All');
  const [evaluatingTeam, setEvaluatingTeam] = useState<RegisteredTeam | null>(null);
  const [evalStatus, setEvalStatus] = useState<ProjectSubmission['evaluationStatus']>('Under Review');
  const [evalScore, setEvalScore] = useState<string>('');
  const [evalFeedback, setEvalFeedback] = useState<string>('');
  const [evaluatorName, setEvaluatorName] = useState<string>('');
  const [isSavingEvaluation, setIsSavingEvaluation] = useState(false);
  const [evalSaveMessage, setEvalSaveMessage] = useState<{ text: string; success: boolean } | null>(null);
  const [isDownloadingAdminPpt, setIsDownloadingAdminPpt] = useState(false);

  // Table Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTrack, setFilterTrack] = useState('All');
  const [filterPayment, setFilterPayment] = useState('All');
  const [filterCourse, setFilterCourse] = useState('All');
  const [selectedTeamModal, setSelectedTeamModal] = useState<RegisteredTeam | null>(null);

  // New announcement form
  const [newNews, setNewNews] = useState({
    title: '',
    content: '',
    category: 'Update' as Announcement['category'],
    pinned: false,
    author: 'Anveshan Core Team',
  });

  // Check-in input
  const [checkInInput, setCheckInInput] = useState('');
  const [checkInMessage, setCheckInMessage] = useState<{ text: string; success: boolean } | null>(null);

  // New Core Team Member Form
  const [newMember, setNewMember] = useState({
    name: '',
    role: '',
    category: 'Student Co-ordinator' as CoreTeamMember['category'],
    phone: '',
    email: '',
    showPhonePublicly: true,
    photoUrl: '',
  });
  const [editingPhotoMember, setEditingPhotoMember] = useState<CoreTeamMember | null>(null);
  const [photoModalInput, setPhotoModalInput] = useState('');

  // Schedule Admin State
  const [newScheduleEvent, setNewScheduleEvent] = useState<Omit<ScheduleEvent, 'id'>>({
    time: '10:00 AM',
    title: '',
    description: '',
    category: 'Milestone',
    day: 'Day 1 (18 Nov)',
  });
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [editingScheduleForm, setEditingScheduleForm] = useState<Partial<ScheduleEvent>>({});

  // Rules Admin State
  const [newRuleItem, setNewRuleItem] = useState<Omit<RuleItem, 'id'>>({
    category: 'Eligibility',
    title: '',
    details: '',
  });
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [editingRuleForm, setEditingRuleForm] = useState<Partial<RuleItem>>({});

  // Google Sheets Management State
  const [isSyncingSheets, setIsSyncingSheets] = useState(false);
  const [isFetchingSheets, setIsFetchingSheets] = useState(false);
  const [sheetSyncMessage, setSheetSyncMessage] = useState<{ text: string; success: boolean } | null>(null);

  const handleConnectSheets = async () => {
    setIsSyncingSheets(true);
    setSheetSyncMessage(null);
    try {
      const ok = await connectGoogleSheets();
      if (ok) {
        setSheetSyncMessage({ text: 'Google Sheets connected! All registrations synced.', success: true });
      } else {
        setSheetSyncMessage({ text: 'Google Sheets connection was cancelled or closed.', success: false });
      }
    } catch (err: any) {
      setSheetSyncMessage({ text: err.message || 'Connection failed', success: false });
    } finally {
      setIsSyncingSheets(false);
    }
  };

  const handleSyncSheets = async () => {
    setIsSyncingSheets(true);
    setSheetSyncMessage(null);
    try {
      const res = await syncGoogleSheets();
      if (res.success) {
        setSheetSyncMessage({ text: `Successfully synced ${res.rowsSynced ?? registeredTeams.length} teams to Google Sheets!`, success: true });
      } else {
        setSheetSyncMessage({ text: res.error || 'Failed to sync with Google Sheets', success: false });
      }
    } catch (err: any) {
      setSheetSyncMessage({ text: err.message || 'Sync failed', success: false });
    } finally {
      setIsSyncingSheets(false);
    }
  };

  const handleFetchSheets = async () => {
    setIsFetchingSheets(true);
    setSheetSyncMessage(null);
    try {
      const res = await fetchFromGoogleSheets();
      if (res.success) {
        setSheetSyncMessage({ text: `Fetched & verified ${res.rowsFetched ?? 0} teams from Google Sheets!`, success: true });
      } else {
        setSheetSyncMessage({ text: res.error || 'Failed to fetch from Google Sheets', success: false });
      }
    } catch (err: any) {
      setSheetSyncMessage({ text: err.message || 'Fetch failed', success: false });
    } finally {
      setIsFetchingSheets(false);
    }
  };

  // Handle Admin Login - strictly secured via authorized list and environment variables
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const inputEmail = adminEmail.trim().toLowerCase();
    const inputPass = adminPassword.trim();

    // Check environment override
    const envEmail = (import.meta.env.VITE_ADMIN_EMAIL as string)?.toLowerCase();
    const envPass = import.meta.env.VITE_ADMIN_SECURITY_CODE as string;

    const matchedAdmin = AUTHORIZED_ADMINS.find(
      (admin) => admin.email.toLowerCase() === inputEmail && admin.passkey === inputPass
    );

    const isEnvMatch = envEmail && envPass && inputEmail === envEmail && inputPass === envPass;

    if (matchedAdmin) {
      setIsAdminAuthenticated(true);
      setCurrentAdminUser({ email: matchedAdmin.email, name: matchedAdmin.name });
      setAdminRole(matchedAdmin.role);
      sessionStorage.setItem('ideation_admin_auth', 'true');
      sessionStorage.setItem('ideation_admin_user', JSON.stringify({ email: matchedAdmin.email, name: matchedAdmin.name }));
    } else if (isEnvMatch) {
      setIsAdminAuthenticated(true);
      setCurrentAdminUser({ email: inputEmail, name: 'Lead Administrator' });
      setAdminRole('Super Admin');
      sessionStorage.setItem('ideation_admin_auth', 'true');
      sessionStorage.setItem('ideation_admin_user', JSON.stringify({ email: inputEmail, name: 'Lead Administrator' }));
    } else {
      setAuthError('Access Denied: Invalid official organizer email or security passkey.');
    }
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    setCurrentAdminUser(null);
    setAdminPassword('');
    sessionStorage.removeItem('ideation_admin_auth');
    sessionStorage.removeItem('ideation_admin_user');
  };

  // QR Scan Verification & Desk Check-In Handler
  const handleVerifyAndCheckInTeam = (teamIdQuery: string) => {
    const query = teamIdQuery.trim().toUpperCase();
    const team = registeredTeams.find(
      (t) =>
        t.id.toUpperCase() === query ||
        t.teamName.toUpperCase() === query ||
        t.members.some((m) => m.email.toUpperCase() === query || m.usn.toUpperCase() === query)
    );

    if (!team) {
      return {
        success: false,
        message: `No team found matching "${teamIdQuery}". Please check the Team ID or register first.`,
      };
    }

    // Auto-verify payment if not already verified
    if (team.paymentStatus !== 'Verified') {
      updatePaymentStatus(team.id, 'Verified');
    }

    // Ensure checked-in
    if (!team.checkedIn) {
      toggleCheckIn(team.id);
    }

    const updatedTeam: RegisteredTeam = {
      ...team,
      paymentStatus: 'Verified',
      checkedIn: true,
      checkedInAt: new Date().toISOString(),
    };

    return {
      success: true,
      team: updatedTeam,
      message: `Team ${team.id} (${team.teamName}) verified & checked-in! Entry pass enabled.`,
    };
  };

  const handleAdminPassDetected = (email: string, passkey: string) => {
    const inputEmail = email.trim().toLowerCase();
    const inputPass = passkey.trim();
    const matchedAdmin = AUTHORIZED_ADMINS.find(
      (admin) => admin.email.toLowerCase() === inputEmail && admin.passkey === inputPass
    );
    if (matchedAdmin) {
      setIsAdminAuthenticated(true);
      setCurrentAdminUser({ email: matchedAdmin.email, name: matchedAdmin.name });
      setAdminRole(matchedAdmin.role);
      sessionStorage.setItem('ideation_admin_auth', 'true');
      sessionStorage.setItem('ideation_admin_user', JSON.stringify({ email: matchedAdmin.email, name: matchedAdmin.name }));
    }
  };

  // Metrics Calculations
  const totalTeams = registeredTeams.length;
  const verifiedTeams = registeredTeams.filter(t => t.paymentStatus === 'Verified').length;
  const pendingTeams = registeredTeams.filter(t => t.paymentStatus === 'Pending').length;
  const totalRevenue = verifiedTeams * eventConfig.entryFee;
  const totalCheckedIn = registeredTeams.filter(t => t.checkedIn).length;

  // Project PPT Submission Metrics
  const submittedTeams = registeredTeams.filter(t => Boolean(t.submission));
  const pendingEvaluations = submittedTeams.filter(t => !t.submission?.evaluationStatus || t.submission.evaluationStatus === 'Under Review').length;
  const shortlistedSubmissions = submittedTeams.filter(t => t.submission?.evaluationStatus === 'Shortlisted').length;
  const gradedSubmissions = submittedTeams.filter(t => t.submission?.score !== undefined);
  const averageJuryScore = gradedSubmissions.length > 0
    ? Math.round(gradedSubmissions.reduce((acc, t) => acc + (t.submission?.score || 0), 0) / gradedSubmissions.length)
    : 0;
  const unreadNotificationsCount = submissionNotifications.filter(n => !n.read).length;

  // Filtered Submissions List
  const filteredSubmissions = submittedTeams.filter(team => {
    const sub = team.submission!;
    const term = submissionSearch.trim().toLowerCase();
    const matchesSearch =
      !term ||
      team.id.toLowerCase().includes(term) ||
      team.teamName.toLowerCase().includes(term) ||
      (sub.projectTitle && sub.projectTitle.toLowerCase().includes(term)) ||
      team.members.some(m => m.name.toLowerCase().includes(term));

    const matchesTrack = submissionTrackFilter === 'All' || (sub.projectTrack || team.primaryTrack) === submissionTrackFilter;
    const matchesStatus = submissionStatusFilter === 'All' || sub.evaluationStatus === submissionStatusFilter;

    return matchesSearch && matchesTrack && matchesStatus;
  });

  // Filtered Teams List
  const filteredTeams = registeredTeams.filter(team => {
    const matchesSearch =
      team.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.teamName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.college.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.members.some(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()) || m.usn.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesTrack = filterTrack === 'All' || team.primaryTrack === filterTrack;
    const matchesPayment = filterPayment === 'All' || team.paymentStatus === filterPayment;
    const matchesCourse = filterCourse === 'All' || team.course === filterCourse;

    return matchesSearch && matchesTrack && matchesPayment && matchesCourse;
  });

  const handleManualCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    setCheckInMessage(null);
    const query = checkInInput.trim();
    if (!query) return;

    const result = toggleCheckIn(query.toUpperCase());
    if (result.success) {
      setCheckInMessage({
        text: `Team ${query.toUpperCase()} marked as ${result.checkedIn ? 'CHECKED-IN' : 'UNCHECKED'}.`,
        success: true,
      });
      setCheckInInput('');
    } else {
      setCheckInMessage({
        text: result.error || 'Team not found.',
        success: false,
      });
    }
  };

  const handleVerifyPayment = (team: RegisteredTeam) => {
    updatePaymentStatus(team.id, 'Verified');
    const leader = team.members.find(m => m.isLeader) || team.members[0];
    if (leader?.email) {
      sendTransactionalEmail({
        to: leader.email,
        subject: `Payment Verified! Official Entry Pass Issued - Team ${team.id}`,
        html: generatePassEmailHtml({
          teamId: team.id,
          teamName: team.teamName,
          college: team.college,
          leaderName: leader.name || 'Team Leader',
          trackName: team.primaryTrack,
          paymentStatus: 'Verified · Confirmed',
        }),
      });
    }
  };

  const handleAddNews = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNews.title || !newNews.content) return;
    addAnnouncement(newNews);
    setNewNews({
      title: '',
      content: '',
      category: 'Update',
      pinned: false,
      author: 'Anveshan Core Team',
    });
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMember.name || !newMember.role) return;
    addCoreMember({
      name: newMember.name,
      role: newMember.role,
      category: newMember.category,
      phone: newMember.phone || undefined,
      email: newMember.email || undefined,
      showPhonePublicly: newMember.showPhonePublicly,
      order: coreTeam.length + 1,
      photoUrl: newMember.photoUrl.trim() || undefined,
    });
    setNewMember({
      name: '',
      role: '',
      category: 'Student Co-ordinator',
      phone: '',
      email: '',
      showPhonePublicly: true,
      photoUrl: '',
    });
  };

  const handleOpenEvaluationModal = (team: RegisteredTeam) => {
    setEvaluatingTeam(team);
    const sub = team.submission;
    setEvalStatus(sub?.evaluationStatus || 'Under Review');
    setEvalScore(sub?.score !== undefined ? String(sub.score) : '');
    setEvalFeedback(sub?.feedback || '');
    setEvaluatorName(sub?.evaluatedBy || currentAdminUser?.name || 'Jury Panel');
    setEvalSaveMessage(null);
  };

  const handleSaveEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evaluatingTeam) return;

    setIsSavingEvaluation(true);
    setEvalSaveMessage(null);

    const scoreNum = evalScore.trim() !== '' ? Math.max(0, Math.min(100, Number(evalScore))) : undefined;

    const res = await evaluateProjectSubmission(evaluatingTeam.id, {
      status: evalStatus,
      score: scoreNum,
      feedback: evalFeedback.trim(),
      evaluatedBy: evaluatorName.trim() || currentAdminUser?.name || 'Jury Panel',
    });

    setIsSavingEvaluation(false);

    if (res.success) {
      setEvalSaveMessage({ text: 'Evaluation and score recorded successfully!', success: true });
      setTimeout(() => {
        setEvaluatingTeam(null);
        setEvalSaveMessage(null);
      }, 1400);
    } else {
      setEvalSaveMessage({ text: res.error || 'Failed to save evaluation', success: false });
    }
  };

  const handleAdminDownloadTemplate = async () => {
    try {
      setIsDownloadingAdminPpt(true);
      await generatePptTemplate({
        teamName: 'Official BIET Template',
        teamId: 'IDN-SAMPLE',
        leaderName: 'Team Leader',
        track: 'All Tracks',
        college: 'Bapuji Institute of Engineering and Technology (BIET)',
        problemTitle: 'Official 8-Slide Pitch Deck Presentation Template',
        problemSummary: 'Official 8-slide template with Problem Statement, Proposed Solution, Technical Approach, Feasibility, Demo Plan, Architecture Canvas, and Submission Checklist.',
      });
    } catch (err) {
      console.error('Error generating template:', err);
    } finally {
      setIsDownloadingAdminPpt(false);
    }
  };

  const handleNotificationClick = (notif: SubmissionNotification) => {
    markNotificationAsRead(notif.id);
    const targetTeam = registeredTeams.find(t => t.id === notif.teamId);
    if (targetTeam) {
      setActiveTab('submissions');
      setShowNotificationDropdown(false);
      handleOpenEvaluationModal(targetTeam);
    }
  };

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 bg-[#050B1A] text-white">
      <div className="max-w-7xl mx-auto">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 mb-8 border-b border-[#78AAFF]/20">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-[#FF8A2A]/20 text-[#FF8A2A] border border-[#FF8A2A]/30 font-bold">
                Admin Console
              </span>
              <span className="text-xs text-[#9DB0D0]">BIET Davangere · IDEATION 2026</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-display text-white">
              Executive Management Suite
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveView('home')}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#9DB0D0] hover:text-white bg-[#0C1630] border border-[#78AAFF]/20 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Portal</span>
            </button>

            {isAdminAuthenticated && (
              <div className="flex items-center gap-2.5 sm:gap-3">
                {/* Download PPT Template Button */}
                <button
                  onClick={handleAdminDownloadTemplate}
                  disabled={isDownloadingAdminPpt}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#35E0FF] bg-[#35E0FF]/10 hover:bg-[#35E0FF]/20 border border-[#35E0FF]/30 rounded-xl transition-all cursor-pointer"
                  title="Download standard 10-slide PowerPoint presentation template"
                >
                  <Download className={`w-3.5 h-3.5 ${isDownloadingAdminPpt ? 'animate-bounce' : ''}`} />
                  <span className="hidden md:inline">PPT Template</span>
                </button>

                {/* Real-time Submissions Notification Bell */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
                    className="relative p-2 text-[#9DB0D0] hover:text-white bg-[#0C1630] border border-[#78AAFF]/20 hover:border-[#35E0FF] rounded-xl transition-colors cursor-pointer"
                    title="Team Presentation Submission Alerts"
                  >
                    <Bell className="w-4 h-4" />
                    {unreadNotificationsCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-[#FF8A2A] text-white font-mono text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse shadow-md">
                        {unreadNotificationsCount}
                      </span>
                    )}
                  </button>

                  {/* Notification Dropdown Drawer */}
                  {showNotificationDropdown && (
                    <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl bg-[#081024] border border-[#35E0FF]/40 shadow-[0_10px_40px_rgba(0,0,0,0.8)] z-50 p-4 animate-in fade-in slide-in-from-top-2">
                      <div className="flex items-center justify-between pb-3 border-b border-[#78AAFF]/20 mb-3">
                        <div className="flex items-center gap-2">
                          <Award className="w-4 h-4 text-[#35E0FF]" />
                          <span className="font-display font-bold text-sm text-white">
                            Submissions Inbox
                          </span>
                          {unreadNotificationsCount > 0 && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#FF8A2A]/20 text-[#FF8A2A] font-bold">
                              {unreadNotificationsCount} New
                            </span>
                          )}
                        </div>

                        {submissionNotifications.length > 0 && (
                          <button
                            onClick={markAllNotificationsAsRead}
                            className="text-[10px] font-mono text-[#35E0FF] hover:underline cursor-pointer"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>

                      {submissionNotifications.length === 0 ? (
                        <div className="py-6 text-center text-[#9DB0D0] text-xs">
                          <CheckCircle className="w-8 h-8 text-[#78AAFF]/30 mx-auto mb-2" />
                          <p>No new team presentations submitted yet</p>
                          <p className="text-[10px] text-[#9DB0D0]/70 mt-1">
                            Notifications will chime here when teams upload their PPTs.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                          {submissionNotifications.slice(0, 15).map((notif) => (
                            <div
                              key={notif.id}
                              className={`p-3 rounded-xl border text-xs transition-colors ${
                                notif.read
                                  ? 'bg-[#0C1630]/60 border-[#78AAFF]/15 text-[#9DB0D0]'
                                  : 'bg-[#0C1630] border-[#35E0FF]/40 text-white shadow-sm'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <div className="font-bold flex items-center gap-1.5">
                                    {!notif.read && (
                                      <span className="w-2 h-2 rounded-full bg-[#FF8A2A] shrink-0" />
                                    )}
                                    <span className="text-white">{notif.teamName}</span>
                                    <span className="text-[10px] font-mono text-[#35E0FF]">({notif.teamId})</span>
                                  </div>
                                  <div className="text-[11px] text-[#9DB0D0] mt-0.5 line-clamp-1">
                                    {notif.projectTitle || 'Project PPT Presentation'}
                                  </div>
                                  <div className="text-[10px] text-[#78AAFF] mt-1 font-mono">
                                    Lead: {notif.leaderName} · {new Date(notif.submittedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                </div>

                                <button
                                  onClick={() => handleNotificationClick(notif)}
                                  className="px-2.5 py-1 rounded-lg bg-[#35E0FF]/15 hover:bg-[#35E0FF]/25 text-[#35E0FF] text-[11px] font-bold shrink-0 transition-colors cursor-pointer"
                                >
                                  View
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="pt-3 mt-3 border-t border-[#78AAFF]/20 text-center">
                        <button
                          onClick={() => {
                            setActiveTab('submissions');
                            setShowNotificationDropdown(false);
                          }}
                          className="text-xs text-[#35E0FF] hover:underline font-mono font-bold cursor-pointer"
                        >
                          View All Project Submissions ({submittedTeams.length}) →
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-semibold text-white">
                    {currentAdminUser?.name || 'Authorized Admin'}
                  </span>
                  <span className="text-[10px] text-[#35E0FF] font-mono">
                    {currentAdminUser?.email || adminEmail} · Super Admin
                  </span>
                </div>
                <button
                  onClick={handleAdminLogout}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-mono text-rose-400 hover:text-white bg-rose-500/10 border border-rose-500/30 rounded-xl transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ADMIN AUTHENTICATION LOGIN CARD */}
        {!isAdminAuthenticated ? (
          <div className="max-w-md mx-auto p-8 rounded-3xl bg-[#081024] border border-[#FF8A2A]/30 shadow-[0_0_50px_rgba(255,138,42,0.15)] text-center animate-in fade-in duration-300">
            <div className="w-14 h-14 rounded-2xl bg-[#0C1630] border border-[#FF8A2A]/40 text-[#FF8A2A] mx-auto flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(255,138,42,0.25)]">
              <ShieldCheck className="w-7 h-7" />
            </div>

            <h2 className="text-2xl font-bold font-display text-white">Admin Authentication</h2>
            <p className="text-xs text-[#9DB0D0] mt-1 mb-6">
              Enter official BIET administrator credentials to access management console
            </p>

            {authError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-mono">
                {authError}
              </div>
            )}

            <form onSubmit={handleAdminLogin} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-semibold text-white mb-1">
                  Enter the Official email
                </label>
                <input
                  type="email"
                  required
                  placeholder="Enter the Official email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#0C1630] border border-[#78AAFF]/20 rounded-xl text-xs text-white focus:outline-none focus:border-[#FF8A2A]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white mb-1">
                  Security Passkey
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#0C1630] border border-[#78AAFF]/20 rounded-xl text-xs text-white focus:outline-none focus:border-[#FF8A2A]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-[#FF8A2A] to-[#F5611A] shadow-[0_0_20px_rgba(255,138,42,0.4)] hover:brightness-110 active:scale-95 transition-all cursor-pointer"
              >
                Sign In to Admin Console
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-[#78AAFF]/15 text-xs text-[#9DB0D0] flex items-center justify-center gap-1.5 font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-[#35E0FF]" />
              <span>Authorized Administrator Access Only</span>
            </div>
          </div>
        ) : (
          /* AUTHENTICATED ADMIN DASHBOARD */
          <div className="space-y-8">
            {/* Top Navigation Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#78AAFF]/20">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  activeTab === 'overview'
                    ? 'bg-[#35E0FF]/20 text-[#35E0FF] border border-[#35E0FF]/40'
                    : 'text-[#9DB0D0] hover:text-white'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Overview Analytics</span>
              </button>

              <button
                onClick={() => setActiveTab('teams')}
                className={`px-4 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  activeTab === 'teams'
                    ? 'bg-[#35E0FF]/20 text-[#35E0FF] border border-[#35E0FF]/40'
                    : 'text-[#9DB0D0] hover:text-white'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Registrations Table ({registeredTeams.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('payments')}
                className={`px-4 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  activeTab === 'payments'
                    ? 'bg-[#35E0FF]/20 text-[#35E0FF] border border-[#35E0FF]/40'
                    : 'text-[#9DB0D0] hover:text-white'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Payment Verification ({pendingTeams} Pending)</span>
              </button>

              <button
                onClick={() => setActiveTab('submissions')}
                className={`px-4 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  activeTab === 'submissions'
                    ? 'bg-[#35E0FF]/20 text-[#35E0FF] border border-[#35E0FF]/40'
                    : 'text-[#9DB0D0] hover:text-white'
                }`}
              >
                <Award className="w-4 h-4 text-[#FF4FD8]" />
                <span>PPT Submissions ({submittedTeams.length})</span>
                {unreadNotificationsCount > 0 && (
                  <span className="min-w-[18px] h-[18px] px-1 bg-[#FF8A2A] text-white text-[10px] font-mono font-bold rounded-full flex items-center justify-center animate-pulse">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('checkin')}
                className={`px-4 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  activeTab === 'checkin'
                    ? 'bg-[#35E0FF]/20 text-[#35E0FF] border border-[#35E0FF]/40'
                    : 'text-[#9DB0D0] hover:text-white'
                }`}
              >
                <QrCode className="w-4 h-4" />
                <span>Event Day Check-In ({totalCheckedIn} Present)</span>
              </button>

              <button
                onClick={() => setActiveTab('news')}
                className={`px-4 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  activeTab === 'news'
                    ? 'bg-[#35E0FF]/20 text-[#35E0FF] border border-[#35E0FF]/40'
                    : 'text-[#9DB0D0] hover:text-white'
                }`}
              >
                <Bell className="w-4 h-4" />
                <span>News & Announcements</span>
              </button>

              <button
                onClick={() => setActiveTab('content')}
                className={`px-4 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  activeTab === 'content'
                    ? 'bg-[#35E0FF]/20 text-[#35E0FF] border border-[#35E0FF]/40'
                    : 'text-[#9DB0D0] hover:text-white'
                }`}
              >
                <Sliders className="w-4 h-4" />
                <span>No-Code Content Manager</span>
              </button>

              <button
                onClick={() => setActiveTab('coreteam')}
                className={`px-4 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  activeTab === 'coreteam'
                    ? 'bg-[#35E0FF]/20 text-[#35E0FF] border border-[#35E0FF]/40'
                    : 'text-[#9DB0D0] hover:text-white'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Core Team Manager</span>
              </button>

              <button
                onClick={() => setActiveTab('schedule')}
                className={`px-4 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  activeTab === 'schedule'
                    ? 'bg-[#35E0FF]/20 text-[#35E0FF] border border-[#35E0FF]/40'
                    : 'text-[#9DB0D0] hover:text-white'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>Schedule & Timeline</span>
              </button>

              <button
                onClick={() => setActiveTab('rules')}
                className={`px-4 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  activeTab === 'rules'
                    ? 'bg-[#35E0FF]/20 text-[#35E0FF] border border-[#35E0FF]/40'
                    : 'text-[#9DB0D0] hover:text-white'
                }`}
              >
                <Scale className="w-4 h-4" />
                <span>Rules & Guidelines</span>
              </button>
            </div>

            {/* TAB 1: OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Metric Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-5 rounded-2xl bg-[#0C1630] border border-[#78AAFF]/20">
                    <span className="text-xs font-tech text-[#9DB0D0] uppercase font-semibold">Total Registered Teams</span>
                    <div className="text-3xl font-mono font-bold text-white mt-1.5 tabular-nums">
                      {totalTeams} <span className="text-xs font-normal text-[#9DB0D0]">/ {eventConfig.maxTeamsLimit} max</span>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-[#0C1630] border border-emerald-500/30">
                    <span className="text-xs font-tech text-emerald-400 uppercase font-semibold">Verified Payments</span>
                    <div className="text-3xl font-mono font-bold text-emerald-300 mt-1.5 tabular-nums">
                      {verifiedTeams}
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-[#0C1630] border border-[#FF8A2A]/30">
                    <span className="text-xs font-tech text-amber-300 uppercase font-semibold">Collected Revenue</span>
                    <div className="text-3xl font-mono font-bold text-amber-300 mt-1.5 tabular-nums">
                      ₹{totalRevenue.toLocaleString('en-IN')}
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-[#0C1630] border border-[#35E0FF]/30">
                    <span className="text-xs font-tech text-[#35E0FF] uppercase font-semibold">On-Campus Attendance</span>
                    <div className="text-3xl font-mono font-bold text-[#35E0FF] mt-1.5 tabular-nums">
                      {totalCheckedIn} Teams
                    </div>
                  </div>
                </div>

                {/* Track Distribution Breakdown */}
                <div className="p-6 rounded-2xl bg-[#0C1630] border border-[#78AAFF]/20">
                  <h3 className="text-base font-bold font-display text-white mb-4">
                    Track Distribution Breakdown
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {tracks.map(track => {
                      const count = registeredTeams.filter(t => t.primaryTrack === track.title).length;
                      const percentage = totalTeams > 0 ? Math.round((count / totalTeams) * 100) : 0;
                      return (
                        <div key={track.id} className="p-4 rounded-xl bg-[#081024] border border-[#78AAFF]/15">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-semibold text-white">{track.title}</span>
                            <span className="text-xs font-mono text-[#35E0FF] font-bold">{count} teams</span>
                          </div>
                          <div className="w-full bg-[#132247] h-2 rounded-full overflow-hidden mt-2">
                            <div className="bg-[#35E0FF] h-full" style={{ width: `${percentage}%` }} />
                          </div>
                          <div className="text-[10px] text-[#9DB0D0] mt-1 text-right">{percentage}% of submissions</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Google Sheets Live Cloud Sync Panel */}
                <div className="p-6 rounded-2xl bg-[#081024] border border-[#35E0FF]/30 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <div className="p-2 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-400">
                          <FileSpreadsheet className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-white text-base font-display flex items-center gap-2">
                            <span>Google Sheets Real-Time Sync</span>
                            {isGoogleSheetsConnected ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-[11px] font-mono text-emerald-300 font-semibold">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                <span>Connected</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-[11px] font-mono text-amber-300 font-semibold">
                                <span>Offline / Not Connected</span>
                              </span>
                            )}
                          </h4>
                          <p className="text-xs text-[#9DB0D0] mt-0.5">
                            {isGoogleSheetsConnected
                              ? `Connected via ${googleUser?.email || 'Google Account'}. All submissions are streamed automatically to Google Sheets.`
                              : 'Connect your Google account to automatically fetch and save every team registration to Google Sheets in real-time.'}
                          </p>
                        </div>
                      </div>

                      {/* Auto-Sync Toggle Control */}
                      <div className="pt-2 flex items-center gap-3">
                        <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={autoSyncGoogleSheets}
                            onChange={(e) => setAutoSyncGoogleSheets(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-10 h-5 bg-[#132247] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500 relative"></div>
                          <span className="text-xs font-semibold text-white">
                            Auto-sync each registration at time of submission
                          </span>
                        </label>
                        {autoSyncGoogleSheets && (
                          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            Auto-Push Enabled
                          </span>
                        )}
                      </div>

                      {sheetSyncMessage && (
                        <div
                          className={`text-xs px-3.5 py-2 rounded-xl border flex items-center gap-2 ${
                            sheetSyncMessage.success
                              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                              : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                          }`}
                        >
                          {sheetSyncMessage.success ? (
                            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                          )}
                          <span>{sheetSyncMessage.text}</span>
                        </div>
                      )}
                    </div>

                    {/* Google Sheets Actions */}
                    <div className="flex flex-wrap items-center gap-2.5 lg:justify-end shrink-0">
                      {!isGoogleSheetsConnected ? (
                        <button
                          onClick={handleConnectSheets}
                          disabled={isSyncingSheets}
                          className="px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-emerald-600 to-teal-500 hover:brightness-110 active:scale-95 transition-all shadow-lg flex items-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          <FileSpreadsheet className="w-4 h-4" />
                          <span>{isSyncingSheets ? 'Connecting...' : 'Connect Google Sheets'}</span>
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={handleSyncSheets}
                            disabled={isSyncingSheets}
                            className="px-3.5 py-2 rounded-xl font-bold text-xs text-white bg-emerald-600/80 hover:bg-emerald-500 border border-emerald-400/30 shadow-md flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                            title="Force sync all existing teams to Google Sheets"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingSheets ? 'animate-spin' : ''}`} />
                            <span>{isSyncingSheets ? 'Syncing...' : 'Sync All Teams'}</span>
                          </button>

                          <button
                            onClick={handleFetchSheets}
                            disabled={isFetchingSheets}
                            className="px-3.5 py-2 rounded-xl font-bold text-xs text-[#35E0FF] bg-[#11234D] hover:bg-[#1a3366] border border-[#35E0FF]/30 shadow-md flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                            title="Fetch all rows from Google Sheets"
                          >
                            <Download className={`w-3.5 h-3.5 ${isFetchingSheets ? 'animate-spin' : ''}`} />
                            <span>{isFetchingSheets ? 'Fetching...' : 'Fetch from Sheets'}</span>
                          </button>

                          {googleSheetUrl && (
                            <a
                              href={googleSheetUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3.5 py-2 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-[#35E0FF] to-blue-500 hover:brightness-110 shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>Open Live Sheet</span>
                            </a>
                          )}

                          <button
                            onClick={disconnectGoogleSheets}
                            className="px-2.5 py-2 rounded-xl font-semibold text-xs text-[#9DB0D0] hover:text-white bg-[#0C1630] border border-[#78AAFF]/20 hover:bg-[#132247] transition-all cursor-pointer"
                            title="Disconnect Google Sheets"
                          >
                            Disconnect
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick Export & Management Actions */}
                <div className="p-6 rounded-2xl bg-[#081024] border border-[#78AAFF]/20 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-white text-sm">Data Export & Backup</h4>
                    <p className="text-xs text-[#9DB0D0] mt-0.5">Download full attendee directory for desk registration and badge printing</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={exportTeamsToCSV}
                      className="px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-emerald-500 to-[#35E0FF] shadow-md flex items-center gap-2 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      <span>Export All Teams (CSV)</span>
                    </button>

                    <button
                      onClick={exportTeamsToSQL}
                      className="px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-[#132247] hover:bg-[#1a2d5c] border border-[#35E0FF]/40 shadow-md flex items-center gap-2 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                    >
                      <Database className="w-4 h-4 text-[#35E0FF]" />
                      <span>Export All Teams (SQL)</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: REGISTRATIONS TABLE */}
            {activeTab === 'teams' && (
              <div className="space-y-6">
                {/* Search & Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="sm:col-span-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9DB0D0]" />
                    <input
                      type="text"
                      placeholder="Search ID, name, college, USN..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-[#0C1630] border border-[#78AAFF]/20 rounded-xl text-xs text-white focus:outline-none focus:border-[#35E0FF]"
                    />
                  </div>

                  <div>
                    <select
                      value={filterTrack}
                      onChange={(e) => setFilterTrack(e.target.value)}
                      className="w-full px-3 py-2 bg-[#0C1630] border border-[#78AAFF]/20 rounded-xl text-xs text-white focus:outline-none focus:border-[#35E0FF]"
                    >
                      <option value="All">All Tracks</option>
                      {tracks.map(t => <option key={t.id} value={t.title}>{t.title}</option>)}
                    </select>
                  </div>

                  <div>
                    <select
                      value={filterPayment}
                      onChange={(e) => setFilterPayment(e.target.value)}
                      className="w-full px-3 py-2 bg-[#0C1630] border border-[#78AAFF]/20 rounded-xl text-xs text-white focus:outline-none focus:border-[#35E0FF]"
                    >
                      <option value="All">All Payment Statuses</option>
                      <option value="Verified">Verified</option>
                      <option value="Pending">Pending</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>

                  <div>
                    <select
                      value={filterCourse}
                      onChange={(e) => setFilterCourse(e.target.value)}
                      className="w-full px-3 py-2 bg-[#0C1630] border border-[#78AAFF]/20 rounded-xl text-xs text-white focus:outline-none focus:border-[#35E0FF]"
                    >
                      <option value="All">All Courses</option>
                      <option value="B.E / B.Tech">B.E / B.Tech</option>
                      <option value="M.Tech">M.Tech</option>
                      <option value="MCA">MCA</option>
                    </select>
                  </div>
                </div>

                {/* Table Quick Sync & Action Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-[#081024] border border-[#78AAFF]/20">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-white font-bold">
                      Showing {filteredTeams.length} of {registeredTeams.length} Teams
                    </span>
                    {isGoogleSheetsConnected && autoSyncGoogleSheets && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>Google Sheets Auto-Sync ON</span>
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {isGoogleSheetsConnected ? (
                      <>
                        <button
                          onClick={handleSyncSheets}
                          disabled={isSyncingSheets}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600/80 hover:bg-emerald-500 text-white flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                          title="Sync all teams to Google Sheets"
                        >
                          <RefreshCw className={`w-3 h-3 ${isSyncingSheets ? 'animate-spin' : ''}`} />
                          <span>{isSyncingSheets ? 'Syncing...' : 'Sync to Sheets'}</span>
                        </button>
                        <button
                          onClick={handleFetchSheets}
                          disabled={isFetchingSheets}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#132247] hover:bg-[#1a3366] text-[#35E0FF] border border-[#35E0FF]/30 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                          title="Fetch from Google Sheets"
                        >
                          <Download className={`w-3 h-3 ${isFetchingSheets ? 'animate-spin' : ''}`} />
                          <span>{isFetchingSheets ? 'Fetching...' : 'Fetch from Sheets'}</span>
                        </button>
                        {googleSheetUrl && (
                          <a
                            href={googleSheetUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#11234D] hover:bg-[#1a3366] text-white border border-[#78AAFF]/25 flex items-center gap-1 transition-all"
                          >
                            <ExternalLink className="w-3 h-3 text-[#35E0FF]" />
                            <span>Sheet</span>
                          </a>
                        )}
                      </>
                    ) : (
                      <button
                        onClick={handleConnectSheets}
                        disabled={isSyncingSheets}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <FileSpreadsheet className="w-3 h-3" />
                        <span>Connect Google Sheets</span>
                      </button>
                    )}
                    <button
                      onClick={exportTeamsToCSV}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#0C1630] hover:bg-[#132247] text-white border border-[#78AAFF]/20 flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Download className="w-3 h-3 text-[#35E0FF]" />
                      <span>CSV</span>
                    </button>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto rounded-2xl border border-[#78AAFF]/20 bg-[#0C1630]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#081024] text-[#9DB0D0] uppercase font-mono text-[11px] border-b border-[#78AAFF]/15">
                      <tr>
                        <th className="py-3 px-4">Team ID</th>
                        <th className="py-3 px-4">Team Name & College</th>
                        <th className="py-3 px-4">Course</th>
                        <th className="py-3 px-4">Domain Track</th>
                        <th className="py-3 px-4">Members</th>
                        <th className="py-3 px-4">Payment</th>
                        <th className="py-3 px-4">Check-In</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#78AAFF]/10 text-white">
                      {filteredTeams.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-[#9DB0D0]">
                            No registered teams found matching filters.
                          </td>
                        </tr>
                      ) : (
                        filteredTeams.map((team) => (
                          <tr key={team.id} className="hover:bg-[#132247]/50 transition-colors">
                            <td className="py-3 px-4 font-mono font-bold text-[#35E0FF]">{team.id}</td>
                            <td className="py-3 px-4">
                              <div className="font-bold text-white">{team.teamName}</div>
                              <div className="text-[11px] text-[#9DB0D0] truncate max-w-xs">{team.college}</div>
                            </td>
                            <td className="py-3 px-4 text-[#9DB0D0]">{team.course}</td>
                            <td className="py-3 px-4 font-medium">{team.primaryTrack}</td>
                            <td className="py-3 px-4 font-mono">{team.members.length}</td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                                  team.paymentStatus === 'Verified'
                                    ? 'bg-emerald-500/20 text-emerald-300'
                                    : team.paymentStatus === 'Pending'
                                    ? 'bg-amber-500/20 text-amber-300'
                                    : 'bg-rose-500/20 text-rose-300'
                                }`}
                              >
                                {team.paymentStatus}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <button
                                onClick={() => toggleCheckIn(team.id)}
                                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                                  team.checkedIn
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400'
                                    : 'bg-[#132247] text-[#9DB0D0] hover:text-white'
                                }`}
                              >
                                {team.checkedIn ? 'Checked-In' : 'Mark In'}
                              </button>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => setSelectedTeamModal(team)}
                                className="px-2.5 py-1 text-xs text-[#35E0FF] bg-[#132247] hover:bg-[#1a2d5c] rounded-lg transition-colors"
                              >
                                View Details
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 3: PAYMENT VERIFICATION */}
            {activeTab === 'payments' && (
              <div className="space-y-6">
                <div className="p-4 rounded-xl bg-[#0C1630] border border-[#78AAFF]/20 text-xs text-[#9DB0D0]">
                  Review participant UPI transaction reference numbers and payment screenshots. Once verified, teams are marked confirmed and eligible for desk kit check-in.
                </div>

                {registeredTeams.length === 0 ? (
                  <div className="p-12 rounded-2xl bg-[#0C1630] border border-[#78AAFF]/20 text-center">
                    <CreditCard className="w-10 h-10 text-[#78AAFF]/40 mx-auto mb-3" />
                    <h4 className="text-base font-bold text-white">No payment verifications pending</h4>
                    <p className="text-xs text-[#9DB0D0] mt-1 max-w-md mx-auto">
                      When participants submit their ₹100 registration fee with UPI transaction IDs and receipts, they will appear here for verification.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {registeredTeams.map((team) => (
                      <div
                        key={team.id}
                        className={`p-5 rounded-2xl bg-[#0C1630] border transition-all ${
                          team.paymentStatus === 'Pending'
                            ? 'border-amber-400/40 shadow-[0_0_15px_rgba(251,191,36,0.1)]'
                            : 'border-[#78AAFF]/20'
                        }`}
                      >
                        <div className="flex items-center justify-between pb-3 border-b border-[#78AAFF]/15 mb-3">
                          <div>
                            <span className="font-mono text-xs text-[#35E0FF] font-bold">{team.id}</span>
                            <h4 className="font-bold text-white text-sm">{team.teamName}</h4>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                              team.paymentStatus === 'Verified'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : team.paymentStatus === 'Pending'
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-rose-500/20 text-rose-300'
                            }`}
                          >
                            {team.paymentStatus}
                          </span>
                        </div>

                        <div className="space-y-1.5 text-xs">
                          <div className="flex justify-between">
                            <span className="text-[#9DB0D0]">Transaction Reference (UTR):</span>
                            <span className="font-mono text-white font-bold">{team.paymentTransactionId || 'None'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#9DB0D0]">Leader Name:</span>
                            <span className="text-white">{team.members[0]?.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#9DB0D0]">Contact Phone:</span>
                            <span className="font-mono text-[#35E0FF]">{team.members[0]?.phone}</span>
                          </div>
                        </div>

                        {team.paymentScreenshotUrl && (
                          <div className="mt-3">
                            <span className="text-[10px] text-[#9DB0D0] block mb-1">Attached Screenshot:</span>
                            <img 
                              src={team.paymentScreenshotUrl} 
                              alt="Payment Screenshot" 
                              className="w-full max-h-40 object-cover rounded-lg border border-[#78AAFF]/20"
                            />
                          </div>
                        )}

                        <div className="mt-4 pt-3 border-t border-[#78AAFF]/15 flex items-center justify-end gap-2">
                          {team.paymentStatus !== 'Verified' && (
                            <button
                              onClick={() => handleVerifyPayment(team)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-400 text-xs font-mono font-bold flex items-center gap-1"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Mark Verified</span>
                            </button>
                          )}
                          {team.paymentStatus !== 'Rejected' && (
                            <button
                              onClick={() => updatePaymentStatus(team.id, 'Rejected', 'Invalid transaction reference or uncredited')}
                              className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-400 text-xs font-mono font-bold flex items-center gap-1"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Reject Payment</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3.5: PROJECT PPT SUBMISSIONS & JURY EVALUATION */}
            {activeTab === 'submissions' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Header Summary & Actions */}
                <div className="p-6 rounded-3xl bg-[#081024] border border-[#35E0FF]/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-[#FF4FD8]/20 text-[#FF4FD8] border border-[#FF4FD8]/30 font-bold">
                        Jury Evaluation Portal
                      </span>
                      <span className="text-xs text-[#9DB0D0]">BIET Davangere · IDEATION 2026</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold font-display text-white">
                      Project Presentations & Pitch Decks
                    </h3>
                    <p className="text-xs text-[#9DB0D0] mt-0.5">
                      Review uploaded PPT presentation files, external deck links, evaluate technical viability, and assign jury scores.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={handleAdminDownloadTemplate}
                      disabled={isDownloadingAdminPpt}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold text-[#35E0FF] bg-[#35E0FF]/10 hover:bg-[#35E0FF]/20 border border-[#35E0FF]/30 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download PPT Template (.pptx)</span>
                    </button>

                    {unreadNotificationsCount > 0 && (
                      <button
                        onClick={markAllNotificationsAsRead}
                        className="px-3.5 py-2 rounded-xl text-xs font-mono text-[#9DB0D0] hover:text-white bg-[#0C1630] border border-[#78AAFF]/20 transition-all cursor-pointer"
                      >
                        Clear Notification Badges ({unreadNotificationsCount})
                      </button>
                    )}
                  </div>
                </div>

                {/* PPT Submissions Portal Status & Control Banner */}
                <div
                  className={`p-5 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 transition-all ${
                    eventConfig.pptSubmissionsOpen === false
                      ? 'bg-rose-950/40 border-rose-500/50 shadow-[0_0_30px_rgba(244,63,94,0.15)]'
                      : 'bg-emerald-950/30 border-emerald-500/40 shadow-[0_0_30px_rgba(16,185,129,0.1)]'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-3.5 h-3.5 rounded-full shrink-0 ${
                        eventConfig.pptSubmissionsOpen === false
                          ? 'bg-rose-500 shadow-[0_0_12px_#f43f5e]'
                          : 'bg-emerald-400 shadow-[0_0_12px_#34d399] animate-pulse'
                      }`}
                    />
                    <div>
                      <div className="font-bold text-white text-sm flex items-center gap-2">
                        <span>PPT Submissions Portal: {eventConfig.pptSubmissionsOpen === false ? 'CLOSED (Stopped)' : 'OPEN & ACCEPTING SUBMISSIONS'}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                            eventConfig.pptSubmissionsOpen === false ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          }`}
                        >
                          {eventConfig.pptSubmissionsOpen === false ? 'Locked' : 'Active'}
                        </span>
                      </div>
                      <p className="text-xs text-[#9DB0D0] mt-0.5">
                        {eventConfig.pptSubmissionsOpen === false
                          ? 'Participants cannot upload new pitch decks or edit their existing presentations in the Participant Dashboard.'
                          : 'Teams can submit and update their PowerPoint presentation or deck up to 2 times.'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => updateEventConfig({ pptSubmissionsOpen: eventConfig.pptSubmissionsOpen === false ? true : false })}
                    className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg shrink-0 flex items-center gap-2 cursor-pointer ${
                      eventConfig.pptSubmissionsOpen === false
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/25'
                        : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-500/25'
                    }`}
                  >
                    {eventConfig.pptSubmissionsOpen === false ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        <span>Reopen PPT Submissions</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4" />
                        <span>Stop Taking PPT Submissions</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Submissions KPI Counters */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-5 rounded-2xl bg-[#0C1630] border border-[#78AAFF]/20">
                    <span className="text-xs font-tech text-[#9DB0D0] uppercase font-semibold">Submissions Received</span>
                    <div className="text-3xl font-mono font-bold text-white mt-1.5 tabular-nums">
                      {submittedTeams.length} <span className="text-xs font-normal text-[#9DB0D0]">/ {registeredTeams.length} teams</span>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-[#0C1630] border border-amber-500/30">
                    <span className="text-xs font-tech text-amber-300 uppercase font-semibold">Awaiting Jury Review</span>
                    <div className="text-3xl font-mono font-bold text-amber-300 mt-1.5 tabular-nums">
                      {pendingEvaluations}
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-[#0C1630] border border-purple-500/30">
                    <span className="text-xs font-tech text-purple-300 uppercase font-semibold">Shortlisted for Finals</span>
                    <div className="text-3xl font-mono font-bold text-purple-300 mt-1.5 tabular-nums">
                      {shortlistedSubmissions}
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-[#0C1630] border border-emerald-500/30">
                    <span className="text-xs font-tech text-emerald-400 uppercase font-semibold">Average Jury Score</span>
                    <div className="text-3xl font-mono font-bold text-emerald-300 mt-1.5 tabular-nums">
                      {averageJuryScore > 0 ? `${averageJuryScore}/100` : 'Pending'}
                    </div>
                  </div>
                </div>

                {/* Filters and Search Bar */}
                <div className="p-4 rounded-2xl bg-[#0C1630] border border-[#78AAFF]/20 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
                  <div className="relative w-full md:w-80">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9DB0D0]" />
                    <input
                      type="text"
                      placeholder="Search submissions by team, title, or lead..."
                      value={submissionSearch}
                      onChange={(e) => setSubmissionSearch(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2 bg-[#081024] border border-[#78AAFF]/20 rounded-xl text-white placeholder-[#9DB0D0]/60 focus:outline-none focus:border-[#35E0FF]"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                    <select
                      value={submissionTrackFilter}
                      onChange={(e) => setSubmissionTrackFilter(e.target.value)}
                      className="px-3 py-2 bg-[#081024] border border-[#78AAFF]/20 rounded-xl text-white focus:outline-none focus:border-[#35E0FF]"
                    >
                      <option value="All">All Tracks</option>
                      {tracks.map(t => (
                        <option key={t.id} value={t.title}>{t.title}</option>
                      ))}
                    </select>

                    <select
                      value={submissionStatusFilter}
                      onChange={(e) => setSubmissionStatusFilter(e.target.value)}
                      className="px-3 py-2 bg-[#081024] border border-[#78AAFF]/20 rounded-xl text-white focus:outline-none focus:border-[#35E0FF]"
                    >
                      <option value="All">All Evaluation Statuses</option>
                      <option value="Under Review">Under Review</option>
                      <option value="Shortlisted">Shortlisted</option>
                      <option value="Evaluated">Evaluated</option>
                      <option value="Needs Revision">Needs Revision</option>
                    </select>
                  </div>
                </div>

                {/* Submissions List */}
                {filteredSubmissions.length === 0 ? (
                  <div className="p-12 rounded-2xl bg-[#0C1630] border border-[#78AAFF]/20 text-center">
                    <Award className="w-10 h-10 text-[#78AAFF]/40 mx-auto mb-3" />
                    <h4 className="text-base font-bold text-white">No project submissions match your criteria</h4>
                    <p className="text-xs text-[#9DB0D0] mt-1 max-w-md mx-auto">
                      {submittedTeams.length === 0
                        ? 'Participants can submit their PowerPoint decks from their Participant Dashboard. Once submitted, they will appear here.'
                        : 'Try adjusting your search terms or track filters above.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredSubmissions.map((team) => {
                      const sub = team.submission!;
                      const leader = team.members.find(m => m.isLeader) || team.members[0];
                      return (
                        <div
                          key={team.id}
                          className="p-5 sm:p-6 rounded-2xl bg-[#0C1630] border border-[#78AAFF]/20 hover:border-[#35E0FF]/40 transition-all space-y-4 shadow-sm"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#78AAFF]/15">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-mono text-xs font-bold text-[#35E0FF] bg-[#35E0FF]/15 px-2 py-0.5 rounded border border-[#35E0FF]/30">
                                  {team.id}
                                </span>
                                <h4 className="font-display font-bold text-white text-base">
                                  {team.teamName}
                                </h4>
                                <span className="text-xs text-[#9DB0D0]">· {team.college}</span>
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#132247] text-cyan-300 border border-cyan-400/30">
                                  Attempt {sub.submissionCount || 1}/2
                                </span>
                              </div>
                              <div className="text-xs text-[#9DB0D0] mt-1">
                                <span className="text-[#35E0FF] font-semibold">{sub.projectTrack || team.primaryTrack}</span>
                                {' · '}
                                <span>Leader: <span className="text-white">{leader?.name}</span> ({leader?.phone} · {leader?.email})</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border ${
                                  sub.evaluationStatus === 'Shortlisted'
                                    ? 'bg-purple-500/20 text-purple-300 border-purple-400'
                                    : sub.evaluationStatus === 'Evaluated'
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400'
                                    : sub.evaluationStatus === 'Needs Revision'
                                    ? 'bg-rose-500/20 text-rose-300 border-rose-400'
                                    : 'bg-amber-500/20 text-amber-300 border-amber-400'
                                }`}
                              >
                                ● {sub.evaluationStatus}
                              </span>

                              {sub.score !== undefined && (
                                <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-[#35E0FF]/20 text-[#35E0FF] border border-[#35E0FF]/40">
                                  {sub.score} / 100
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Submission Details */}
                          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 text-xs">
                            <div className="lg:col-span-8 space-y-2">
                              <div>
                                <span className="text-[10px] font-mono uppercase text-[#9DB0D0]">Project Title</span>
                                <div className="text-sm font-bold text-white">
                                  {sub.projectTitle || team.ideaTitle || 'Untitled Presentation'}
                                </div>
                              </div>

                              {sub.problemStatement && (
                                <div>
                                  <span className="text-[10px] font-mono uppercase text-[#9DB0D0]">Problem Addressed</span>
                                  <p className="text-white/80 line-clamp-2 leading-relaxed">
                                    {sub.problemStatement}
                                  </p>
                                </div>
                              )}

                              {sub.ideaSummary && (
                                <div>
                                  <span className="text-[10px] font-mono uppercase text-[#9DB0D0]">Architecture & Solution</span>
                                  <p className="text-[#9DB0D0] line-clamp-2 leading-relaxed">
                                    {sub.ideaSummary}
                                  </p>
                                </div>
                              )}

                              {sub.techStack && sub.techStack.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                  {sub.techStack.map((tech, idx) => (
                                    <span
                                      key={idx}
                                      className="px-2 py-0.5 rounded bg-[#081024] text-[#35E0FF] border border-[#78AAFF]/20 text-[10px] font-mono"
                                    >
                                      {tech}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Presentation Links & Jury Actions */}
                            <div className="lg:col-span-4 flex flex-col justify-between space-y-3 p-4 rounded-xl bg-[#081024] border border-[#78AAFF]/15">
                              <div className="space-y-2">
                                <span className="text-[10px] font-mono uppercase text-[#9DB0D0] block">
                                  Presentation Assets
                                </span>

                                <div className="space-y-1.5">
                                  {sub.pptFileData ? (
                                    <a
                                      href={sub.pptFileData}
                                      download={sub.pptFileName || `${team.id}_Presentation.pptx`}
                                      className="w-full py-1.5 px-3 rounded-lg bg-[#35E0FF]/15 hover:bg-[#35E0FF]/25 text-[#35E0FF] text-xs font-semibold flex items-center justify-between transition-colors"
                                    >
                                      <span className="truncate flex items-center gap-1.5">
                                        <FileText className="w-3.5 h-3.5 shrink-0" />
                                        <span className="truncate">{sub.pptFileName || 'Download PPT'}</span>
                                      </span>
                                      <Download className="w-3.5 h-3.5 shrink-0 ml-1" />
                                    </a>
                                  ) : null}

                                  {sub.pptDeckUrl ? (
                                    <a
                                      href={sub.pptDeckUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="w-full py-1.5 px-3 rounded-lg bg-[#132247] hover:bg-[#1a2d5c] text-white text-xs font-semibold flex items-center justify-between border border-[#78AAFF]/20 transition-colors"
                                    >
                                      <span className="truncate flex items-center gap-1.5">
                                        <Globe className="w-3.5 h-3.5 shrink-0 text-[#35E0FF]" />
                                        <span>Open External Deck</span>
                                      </span>
                                      <ExternalLink className="w-3.5 h-3.5 shrink-0 ml-1 text-[#35E0FF]" />
                                    </a>
                                  ) : null}

                                  <div className="flex items-center gap-2 pt-1">
                                    {sub.githubUrl && (
                                      <a
                                        href={sub.githubUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 py-1 px-2 rounded-lg bg-[#0C1630] hover:bg-[#132247] text-white text-[11px] font-mono flex items-center justify-center gap-1 border border-[#78AAFF]/20"
                                      >
                                        <Github className="w-3 h-3" />
                                        <span>GitHub</span>
                                      </a>
                                    )}
                                    {sub.demoUrl && (
                                      <a
                                        href={sub.demoUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 py-1 px-2 rounded-lg bg-[#0C1630] hover:bg-[#132247] text-white text-[11px] font-mono flex items-center justify-center gap-1 border border-[#78AAFF]/20"
                                      >
                                        <ExternalLink className="w-3 h-3 text-[#35E0FF]" />
                                        <span>Demo</span>
                                      </a>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <button
                                onClick={() => handleOpenEvaluationModal(team)}
                                className="w-full py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-[#FF8A2A] to-[#F5611A] shadow-[0_0_15px_rgba(255,138,42,0.3)] hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <Award className="w-4 h-4" />
                                <span>{sub.score !== undefined ? 'Update Evaluation & Score' : 'Evaluate & Grade PPT'}</span>
                              </button>
                            </div>
                          </div>

                          {/* Feedback Banner if exists */}
                          {sub.feedback && (
                            <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 text-xs text-purple-200">
                              <span className="font-bold text-white mr-1.5">Jury Feedback ({sub.evaluatedBy || 'Jury Panel'}):</span>
                              <span>{sub.feedback}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: EVENT DAY CHECK-IN */}
            {activeTab === 'checkin' && (
              <div className="space-y-6">
                {/* Attendance Summary Banner */}
                <div className="p-6 rounded-3xl bg-[#081024] border border-[#78AAFF]/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-xs font-mono uppercase tracking-wider text-[#9DB0D0]">
                        BIET Main Auditorium · Live Desk Attendance
                      </span>
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold font-mono text-[#35E0FF]">
                      {totalCheckedIn} / {registeredTeams.length} Teams Checked-In
                    </div>
                  </div>
                  <div className="text-right text-xs font-mono text-emerald-400 bg-emerald-500/10 px-4 py-2 rounded-2xl border border-emerald-500/30 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    <span>{Math.round((totalCheckedIn / (registeredTeams.length || 1)) * 100)}% Physical Attendance</span>
                  </div>
                </div>

                {/* QR Scanner Component with Instant Print Pass */}
                <AdminQRScanner
                  registeredTeams={registeredTeams}
                  onVerifyAndCheckIn={handleVerifyAndCheckInTeam}
                  isStandaloneDeskMode={false}
                />
              </div>
            )}

            {/* TAB 5: NEWS & ANNOUNCEMENTS MANAGER */}
            {activeTab === 'news' && (
              <div className="space-y-8">
                {/* Create announcement card */}
                <div className="p-6 rounded-2xl bg-[#0C1630] border border-[#78AAFF]/20">
                  <h3 className="font-display font-bold text-base text-white mb-4 flex items-center gap-2">
                    <Plus className="w-4 h-4 text-[#35E0FF]" />
                    <span>Publish New Announcement</span>
                  </h3>

                  <form onSubmit={handleAddNews} className="space-y-4 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-[#9DB0D0] mb-1">Title *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. WiFi Credentials & Lab Allotment Announced"
                          value={newNews.title}
                          onChange={(e) => setNewNews({ ...newNews, title: e.target.value })}
                          className="w-full px-3 py-2 bg-[#081024] border border-[#78AAFF]/20 rounded-xl text-white focus:outline-none focus:border-[#35E0FF]"
                        />
                      </div>

                      <div>
                        <label className="block text-[#9DB0D0] mb-1">Category</label>
                        <select
                          value={newNews.category}
                          onChange={(e) => setNewNews({ ...newNews, category: e.target.value as any })}
                          className="w-full px-3 py-2 bg-[#081024] border border-[#78AAFF]/20 rounded-xl text-white focus:outline-none focus:border-[#35E0FF]"
                        >
                          <option value="Update">Update</option>
                          <option value="Deadline">Deadline</option>
                          <option value="Urgent">Urgent</option>
                          <option value="Result">Result</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[#9DB0D0] mb-1">Announcement Body *</label>
                      <textarea
                        rows={3}
                        required
                        placeholder="Details of the announcement..."
                        value={newNews.content}
                        onChange={(e) => setNewNews({ ...newNews, content: e.target.value })}
                        className="w-full px-3 py-2 bg-[#081024] border border-[#78AAFF]/20 rounded-xl text-white focus:outline-none focus:border-[#35E0FF]"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 cursor-pointer text-[#9DB0D0]">
                        <input
                          type="checkbox"
                          checked={newNews.pinned}
                          onChange={(e) => setNewNews({ ...newNews, pinned: e.target.checked })}
                          className="rounded text-[#35E0FF]"
                        />
                        <span>Pin to top ticker and highlighted card</span>
                      </label>

                      <button
                        type="submit"
                        className="px-5 py-2 rounded-xl font-bold text-white bg-gradient-to-r from-[#FF8A2A] to-[#F5611A]"
                      >
                        Publish Post Live
                      </button>
                    </div>
                  </form>
                </div>

                {/* Existing announcements list */}
                <div className="space-y-3">
                  <h4 className="font-bold text-white text-sm">Active Dispatches ({announcements.length})</h4>
                  {announcements.length === 0 ? (
                    <div className="p-8 rounded-2xl bg-[#0C1630] border border-[#78AAFF]/15 text-center text-[#9DB0D0]">
                      <Newspaper className="w-8 h-8 text-[#78AAFF]/40 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-white">No active dispatches yet</p>
                      <p className="text-xs text-[#9DB0D0] mt-1">Compose and publish your first official announcement using the form above.</p>
                    </div>
                  ) : (
                    announcements.map((a) => (
                      <div
                        key={a.id}
                        className="p-4 rounded-xl bg-[#0C1630] border border-[#78AAFF]/15 flex items-center justify-between gap-4 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white">{a.title}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#132247] text-[#35E0FF] font-mono">
                              {a.category}
                            </span>
                            {a.pinned && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#FF8A2A]/20 text-[#FF8A2A] font-mono font-bold">
                                PINNED
                              </span>
                            )}
                          </div>
                          <p className="text-[#9DB0D0] line-clamp-1">{a.content}</p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => deleteAnnouncement(a.id)}
                            className="p-1.5 text-rose-400 hover:text-white rounded hover:bg-rose-500/20"
                            title="Delete announcement"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 6: NO-CODE CONTENT MANAGER */}
            {activeTab === 'content' && (
              <div className="space-y-6">
                <div className="p-6 rounded-2xl bg-[#0C1630] border border-[#78AAFF]/20 space-y-4">
                  <h3 className="font-display font-bold text-base text-white">Event Parameters & Editorial Copy</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block text-[#9DB0D0] mb-1">Event Name</label>
                      <input
                        type="text"
                        value={eventConfig.eventName}
                        onChange={(e) => updateEventConfig({ eventName: e.target.value })}
                        className="w-full px-3 py-2 bg-[#081024] border border-[#78AAFF]/20 rounded-xl text-white focus:outline-none focus:border-[#35E0FF]"
                      />
                    </div>

                    <div>
                      <label className="block text-[#9DB0D0] mb-1">Event Dates</label>
                      <input
                        type="text"
                        value={eventConfig.dates}
                        onChange={(e) => updateEventConfig({ dates: e.target.value })}
                        className="w-full px-3 py-2 bg-[#081024] border border-[#78AAFF]/20 rounded-xl text-white focus:outline-none focus:border-[#35E0FF]"
                      />
                    </div>

                    <div>
                      <label className="block text-[#9DB0D0] mb-1">Tagline</label>
                      <input
                        type="text"
                        value={eventConfig.tagline}
                        onChange={(e) => updateEventConfig({ tagline: e.target.value })}
                        className="w-full px-3 py-2 bg-[#081024] border border-[#78AAFF]/20 rounded-xl text-white focus:outline-none focus:border-[#35E0FF]"
                      />
                    </div>

                    <div>
                      <label className="block text-[#9DB0D0] mb-1">Subline</label>
                      <input
                        type="text"
                        value={eventConfig.subline}
                        onChange={(e) => updateEventConfig({ subline: e.target.value })}
                        className="w-full px-3 py-2 bg-[#081024] border border-[#78AAFF]/20 rounded-xl text-white focus:outline-none focus:border-[#35E0FF]"
                      />
                    </div>

                    <div>
                      <label className="block text-[#9DB0D0] mb-1">Registration Fee (₹ per team)</label>
                      <input
                        type="number"
                        value={eventConfig.entryFee}
                        onChange={(e) => updateEventConfig({ entryFee: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-[#081024] border border-[#78AAFF]/20 rounded-xl text-white focus:outline-none focus:border-[#35E0FF]"
                      />
                    </div>

                    <div>
                      <label className="block text-[#9DB0D0] mb-1">Official UPI ID for Payment</label>
                      <input
                        type="text"
                        value={eventConfig.upiId}
                        onChange={(e) => updateEventConfig({ upiId: e.target.value })}
                        className="w-full px-3 py-2 bg-[#081024] border border-[#78AAFF]/20 rounded-xl text-white focus:outline-none focus:border-[#35E0FF]"
                      />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#78AAFF]/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer text-xs text-white">
                        <input
                          type="checkbox"
                          checked={eventConfig.registrationOpen}
                          onChange={(e) => updateEventConfig({ registrationOpen: e.target.checked })}
                          className="rounded text-[#35E0FF]"
                        />
                        <span>Registrations Open</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer text-xs text-white">
                        <input
                          type="checkbox"
                          checked={eventConfig.pptSubmissionsOpen !== false}
                          onChange={(e) => updateEventConfig({ pptSubmissionsOpen: e.target.checked })}
                          className="rounded text-[#35E0FF]"
                        />
                        <span>Accept Project PPT Submissions</span>
                      </label>
                    </div>

                    <span className="text-[11px] font-mono text-emerald-400">All edits sync live across site</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 7: CORE TEAM MANAGER */}
            {activeTab === 'coreteam' && (
              <div className="space-y-6">
                {/* Add member card */}
                <div className="p-6 rounded-2xl bg-[#0C1630] border border-[#78AAFF]/20">
                  <h3 className="font-display font-bold text-base text-white mb-4 flex items-center justify-between">
                    <span>Add Committee Member</span>
                    <span className="text-xs font-mono text-[#35E0FF]">Supports Profile Photo & Initials</span>
                  </h3>
                  <form onSubmit={handleAddMember} className="space-y-4 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[#9DB0D0] mb-1">Full Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Prof. Radhika Priya Y R"
                          value={newMember.name}
                          onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                          className="w-full px-3 py-2 bg-[#081024] border border-[#78AAFF]/20 rounded-xl text-white focus:outline-none focus:border-[#35E0FF]"
                        />
                      </div>

                      <div>
                        <label className="block text-[#9DB0D0] mb-1">Role / Designation *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Lead Student Co-ordinator"
                          value={newMember.role}
                          onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                          className="w-full px-3 py-2 bg-[#081024] border border-[#78AAFF]/20 rounded-xl text-white focus:outline-none focus:border-[#35E0FF]"
                        />
                      </div>

                      <div>
                        <label className="block text-[#9DB0D0] mb-1">Category</label>
                        <select
                          value={newMember.category}
                          onChange={(e) => setNewMember({ ...newMember, category: e.target.value as any })}
                          className="w-full px-3 py-2 bg-[#081024] border border-[#78AAFF]/20 rounded-xl text-white focus:outline-none focus:border-[#35E0FF]"
                        >
                          <option value="Faculty">Faculty</option>
                          <option value="Student Co-ordinator">Student Co-ordinator</option>
                          <option value="Contact Helpline">Contact Helpline</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[#9DB0D0] mb-1">Phone Number (optional)</label>
                        <input
                          type="text"
                          placeholder="e.g. 97409 70278"
                          value={newMember.phone}
                          onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                          className="w-full px-3 py-2 bg-[#081024] border border-[#78AAFF]/20 rounded-xl text-white focus:outline-none focus:border-[#35E0FF]"
                        />
                      </div>

                      <div>
                        <label className="block text-[#9DB0D0] mb-1">Email (optional)</label>
                        <input
                          type="email"
                          placeholder="name@bietdvg.edu"
                          value={newMember.email}
                          onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                          className="w-full px-3 py-2 bg-[#081024] border border-[#78AAFF]/20 rounded-xl text-white focus:outline-none focus:border-[#35E0FF]"
                        />
                      </div>

                      <div className="flex items-center gap-2 pt-5">
                        <label className="flex items-center gap-2 cursor-pointer text-white">
                          <input
                            type="checkbox"
                            checked={newMember.showPhonePublicly}
                            onChange={(e) => setNewMember({ ...newMember, showPhonePublicly: e.target.checked })}
                            className="rounded text-[#35E0FF]"
                          />
                          <span>Show Phone on Public Site</span>
                        </label>
                      </div>
                    </div>

                    {/* Member Photo Controls */}
                    <div className="p-4 rounded-xl bg-[#081024] border border-[#78AAFF]/15 flex flex-col sm:flex-row items-center gap-4">
                      {/* Avatar preview */}
                      <div className="shrink-0 text-center">
                        <div className="w-14 h-14 rounded-2xl overflow-hidden border border-[#35E0FF]/40 bg-[#0C1630] flex items-center justify-center mx-auto shadow-md">
                          {newMember.photoUrl ? (
                            <img src={newMember.photoUrl} alt="Preview" className="w-full h-full object-cover" />
                          ) : (
                            <div className="font-display font-bold text-base text-[#35E0FF]">
                              {newMember.name
                                ? newMember.name
                                    .replace(/^(prof\.|dr\.|mr\.|mrs\.|ms\.)\s+/i, '')
                                    .split(/\s+/)
                                    .map((n) => n[0])
                                    .slice(0, 2)
                                    .join('')
                                    .toUpperCase()
                                : 'TM'}
                            </div>
                          )}
                        </div>
                        <span className="text-[10px] text-[#9DB0D0] mt-1 block">
                          {newMember.photoUrl ? 'Photo Preview' : 'Initials Fallback'}
                        </span>
                      </div>

                      <div className="flex-1 space-y-2 w-full">
                        <label className="block text-[#9DB0D0] font-semibold">
                          Profile Photo (URL or Upload Image)
                        </label>
                        <div className="flex flex-col sm:flex-row items-center gap-2">
                          <input
                            type="url"
                            placeholder="https://example.com/photo.jpg or data URL"
                            value={newMember.photoUrl}
                            onChange={(e) => setNewMember({ ...newMember, photoUrl: e.target.value })}
                            className="flex-1 w-full px-3 py-2 bg-[#0C1630] border border-[#78AAFF]/20 rounded-xl text-white focus:outline-none focus:border-[#35E0FF]"
                          />
                          <label className="px-3 py-2 rounded-xl bg-[#132247] hover:bg-[#1a2d5c] text-[#35E0FF] border border-[#35E0FF]/30 cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                            <Camera className="w-3.5 h-3.5" />
                            <span>Upload File</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                const reader = new FileReader();
                                reader.onload = () => {
                                  if (typeof reader.result === 'string') {
                                    setNewMember({ ...newMember, photoUrl: reader.result });
                                  }
                                };
                                reader.readAsDataURL(file);
                              }}
                            />
                          </label>
                          {newMember.photoUrl && (
                            <button
                              type="button"
                              onClick={() => setNewMember({ ...newMember, photoUrl: '' })}
                              className="px-2.5 py-2 rounded-xl text-rose-400 hover:bg-rose-500/10 border border-rose-400/20 text-xs shrink-0"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                        <span className="text-[10px] text-[#9DB0D0]">
                          If no photo is provided, the member's 2-letter name initials are displayed automatically.
                        </span>
                      </div>

                      <div className="shrink-0 w-full sm:w-auto">
                        <button
                          type="submit"
                          className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-[#FF8A2A] to-[#F5611A] shadow-md hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                        >
                          Add Member
                        </button>
                      </div>
                    </div>
                  </form>
                </div>

                {/* List of members with photo status and editor */}
                <div className="p-6 rounded-2xl bg-[#0C1630] border border-[#78AAFF]/20">
                  <h4 className="font-bold text-white text-sm mb-4 flex items-center justify-between">
                    <span>Current Committee Members ({coreTeam.length})</span>
                    <span className="text-xs text-[#9DB0D0] font-normal">Click "Add/Edit Photo" to update any profile image</span>
                  </h4>

                  <div className="space-y-2.5">
                    {coreTeam.map((m) => {
                      const initials = m.name
                        ? m.name
                            .replace(/^(prof\.|dr\.|mr\.|mrs\.|ms\.)\s+/i, '')
                            .split(/\s+/)
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join('')
                            .toUpperCase()
                        : 'TM';

                      return (
                        <div
                          key={m.id}
                          className="p-3.5 rounded-xl bg-[#081024] border border-[#78AAFF]/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:border-[#35E0FF]/30 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            {/* Member Avatar */}
                            <div className="w-11 h-11 rounded-xl overflow-hidden border border-[#35E0FF]/30 bg-[#0C1630] flex items-center justify-center shrink-0 shadow-sm">
                              {m.photoUrl ? (
                                <img src={m.photoUrl} alt={m.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="font-display font-bold text-xs text-[#35E0FF] tracking-wider">
                                  {initials}
                                </div>
                              )}
                            </div>

                            <div>
                              <div className="font-bold text-white flex items-center gap-2">
                                <span>{m.name}</span>
                                <span className="text-[10px] font-mono text-[#35E0FF] bg-[#132247] px-2 py-0.5 rounded border border-[#35E0FF]/20">
                                  {m.category}
                                </span>
                                {m.photoUrl ? (
                                  <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                    Photo Set
                                  </span>
                                ) : (
                                  <span className="text-[9px] font-mono text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded">
                                    Initials ({initials})
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-[#9DB0D0] mt-0.5">
                                {m.role} {m.phone ? `· ${m.phone}` : ''} {m.email ? `· ${m.email}` : ''}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                            {/* Photo update button */}
                            <button
                              onClick={() => {
                                setEditingPhotoMember(m);
                                setPhotoModalInput(m.photoUrl || '');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-[#132247] hover:bg-[#1a2d5c] text-[#35E0FF] border border-[#35E0FF]/30 text-[11px] font-mono font-semibold flex items-center gap-1 transition-colors"
                            >
                              <Camera className="w-3 h-3" />
                              <span>{m.photoUrl ? 'Change Photo' : 'Add Photo'}</span>
                            </button>

                            {m.photoUrl && (
                              <button
                                onClick={() => updateCoreMember(m.id, { photoUrl: undefined })}
                                title="Remove photo and fallback to name initials"
                                className="px-2 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-400/20 text-[10px] font-mono transition-colors"
                              >
                                Remove
                              </button>
                            )}

                            <button
                              onClick={() => updateCoreMember(m.id, { showPhonePublicly: !m.showPhonePublicly })}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-semibold transition-colors ${
                                m.showPhonePublicly
                                  ? 'text-emerald-300 bg-emerald-500/15 border border-emerald-500/30'
                                  : 'text-[#9DB0D0] bg-[#132247] border border-[#78AAFF]/15'
                              }`}
                            >
                              {m.showPhonePublicly ? 'Phone Public' : 'Phone Hidden'}
                            </button>

                            <button
                              onClick={() => deleteCoreMember(m.id)}
                              className="p-1.5 text-rose-400 hover:text-white hover:bg-rose-500/10 rounded-lg transition-colors"
                              title="Delete member"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* MODAL: Edit Member Photo */}
                {editingPhotoMember && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                    <div className="w-full max-w-md bg-[#081024] border border-[#35E0FF]/40 rounded-3xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95">
                      <button
                        onClick={() => setEditingPhotoMember(null)}
                        className="absolute top-4 right-4 text-[#9DB0D0] hover:text-white p-1 rounded-lg bg-[#0C1630] border border-[#78AAFF]/20"
                      >
                        <X className="w-4 h-4" />
                      </button>

                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-[#35E0FF]/15 text-[#35E0FF] flex items-center justify-center">
                          <Camera className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-white text-base">Edit Committee Member Photo</h4>
                          <p className="text-xs text-[#9DB0D0]">{editingPhotoMember.name} ({editingPhotoMember.role})</p>
                        </div>
                      </div>

                      <div className="my-5 p-4 rounded-2xl bg-[#0C1630] border border-[#78AAFF]/20 flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-[#35E0FF]/50 bg-[#081024] flex items-center justify-center shrink-0 shadow-lg">
                          {photoModalInput ? (
                            <img src={photoModalInput} alt="Preview" className="w-full h-full object-cover" />
                          ) : (
                            <div className="font-display font-bold text-lg text-[#35E0FF]">
                              {editingPhotoMember.name
                                .replace(/^(prof\.|dr\.|mr\.|mrs\.|ms\.)\s+/i, '')
                                .split(/\s+/)
                                .map((n) => n[0])
                                .slice(0, 2)
                                .join('')
                                .toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="text-xs">
                          <div className="font-semibold text-white">
                            {photoModalInput ? 'Active Photo Preview' : 'Initials Avatar Active'}
                          </div>
                          <p className="text-[11px] text-[#9DB0D0] mt-0.5">
                            {photoModalInput
                              ? 'This image will be displayed on the Meet the Core Team section and drawer.'
                              : 'No photo uploaded. The profile displays the 2-letter initials of the member.'}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3 text-xs mb-6">
                        <div>
                          <label className="block text-[#9DB0D0] mb-1 font-semibold">Image URL</label>
                          <input
                            type="url"
                            value={photoModalInput}
                            onChange={(e) => setPhotoModalInput(e.target.value)}
                            placeholder="https://example.com/photo.jpg"
                            className="w-full px-3 py-2 bg-[#0C1630] border border-[#78AAFF]/20 rounded-xl text-white focus:outline-none focus:border-[#35E0FF]"
                          />
                        </div>

                        <div>
                          <label className="block text-[#9DB0D0] mb-1 font-semibold">Or Upload Local Image</label>
                          <label className="w-full py-2.5 px-3 rounded-xl bg-[#132247] hover:bg-[#1a2d5c] text-[#35E0FF] border border-[#35E0FF]/30 cursor-pointer flex items-center justify-center gap-2 font-mono">
                            <UploadCloud className="w-4 h-4" />
                            <span>Select Photo from Device</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                const reader = new FileReader();
                                reader.onload = () => {
                                  if (typeof reader.result === 'string') {
                                    setPhotoModalInput(reader.result);
                                  }
                                };
                                reader.readAsDataURL(file);
                              }}
                            />
                          </label>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-3 pt-3 border-t border-[#78AAFF]/15">
                        <button
                          type="button"
                          onClick={() => setPhotoModalInput('')}
                          className="px-3 py-2 rounded-xl text-xs text-rose-300 hover:text-white bg-rose-500/10 border border-rose-400/20"
                        >
                          Use Initials
                        </button>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingPhotoMember(null)}
                            className="px-4 py-2 rounded-xl text-xs text-[#9DB0D0] hover:text-white bg-[#0C1630] border border-[#78AAFF]/20"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              updateCoreMember(editingPhotoMember.id, {
                                photoUrl: photoModalInput.trim() || undefined,
                              });
                              setEditingPhotoMember(null);
                            }}
                            className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#0052FF] to-[#35E0FF] hover:brightness-110 shadow-md"
                          >
                            Save Photo
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 8: SCHEDULE & TIMELINE MANAGER */}
            {activeTab === 'schedule' && (
              <div className="space-y-6">
                <div className="p-6 rounded-2xl bg-[#0C1630] border border-[#78AAFF]/20">
                  <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#78AAFF]/20">
                    <h3 className="font-display font-bold text-base text-white flex items-center gap-2">
                      <Plus className="w-4 h-4 text-[#35E0FF]" />
                      <span>Add New Schedule Event</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm('Reset all schedule events back to default?')) {
                          resetScheduleToDefault();
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-mono text-amber-300 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 flex items-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset to Default Flow</span>
                    </button>
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!newScheduleEvent.title.trim()) return;
                      addScheduleEvent(newScheduleEvent);
                      setNewScheduleEvent({
                        time: '12:00 PM',
                        title: '',
                        description: '',
                        category: 'Milestone',
                        day: 'Day 1 (18 Nov)',
                      });
                    }}
                    className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs"
                  >
                    <div>
                      <label className="block text-[#9DB0D0] mb-1">Time Slot *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 10:00 AM - 11:30 AM"
                        value={newScheduleEvent.time}
                        onChange={(e) =>
                          setNewScheduleEvent({ ...newScheduleEvent, time: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-[#081024] border border-[#78AAFF]/20 rounded-xl text-white focus:outline-none focus:border-[#35E0FF]"
                      />
                    </div>

                    <div>
                      <label className="block text-[#9DB0D0] mb-1">Day *</label>
                      <select
                        value={newScheduleEvent.day}
                        onChange={(e) =>
                          setNewScheduleEvent({ ...newScheduleEvent, day: e.target.value as any })
                        }
                        className="w-full px-3 py-2 bg-[#081024] border border-[#78AAFF]/20 rounded-xl text-white focus:outline-none focus:border-[#35E0FF]"
                      >
                        <option value="Day 1 (18 Nov)">Day 1 (18 Nov)</option>
                        <option value="Day 2 (19 Nov)">Day 2 (19 Nov)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[#9DB0D0] mb-1">Category *</label>
                      <select
                        value={newScheduleEvent.category}
                        onChange={(e) =>
                          setNewScheduleEvent({
                            ...newScheduleEvent,
                            category: e.target.value as any,
                          })
                        }
                        className="w-full px-3 py-2 bg-[#081024] border border-[#78AAFF]/20 rounded-xl text-white focus:outline-none focus:border-[#35E0FF]"
                      >
                        <option value="Milestone">Milestone</option>
                        <option value="Mentoring">Mentoring</option>
                        <option value="Food & Break">Food & Break</option>
                        <option value="Judging">Judging</option>
                        <option value="Ceremony">Ceremony</option>
                      </select>
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-[#9DB0D0] mb-1">Event Title *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Mid-Hackathon Code Sync & Mentorship"
                        value={newScheduleEvent.title}
                        onChange={(e) =>
                          setNewScheduleEvent({ ...newScheduleEvent, title: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-[#081024] border border-[#78AAFF]/20 rounded-xl text-white focus:outline-none focus:border-[#35E0FF]"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-[#9DB0D0] mb-1">Description *</label>
                      <textarea
                        rows={2}
                        required
                        placeholder="Checkpoint deliverables or logistics notes..."
                        value={newScheduleEvent.description}
                        onChange={(e) =>
                          setNewScheduleEvent({ ...newScheduleEvent, description: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-[#081024] border border-[#78AAFF]/20 rounded-xl text-white focus:outline-none focus:border-[#35E0FF]"
                      />
                    </div>

                    <div className="sm:col-span-3 flex justify-end">
                      <button
                        type="submit"
                        className="px-5 py-2 rounded-xl font-bold text-white bg-gradient-to-r from-[#0052FF] to-[#35E0FF] hover:brightness-110 shadow-md cursor-pointer"
                      >
                        Add to Schedule
                      </button>
                    </div>
                  </form>
                </div>

                {/* Schedule list */}
                <div className="p-6 rounded-2xl bg-[#0C1630] border border-[#78AAFF]/20">
                  <h4 className="font-bold text-white text-sm mb-4">
                    Current 24-Hour Timeline Events ({schedule.length})
                  </h4>
                  <div className="space-y-3">
                    {schedule.map((item) => (
                      <div
                        key={item.id}
                        className="p-4 rounded-xl bg-[#081024] border border-[#78AAFF]/15 text-xs"
                      >
                        {editingScheduleId === item.id ? (
                          <div className="space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              <div>
                                <label className="block text-[#9DB0D0] mb-0.5">Time</label>
                                <input
                                  type="text"
                                  value={editingScheduleForm.time || ''}
                                  onChange={(e) =>
                                    setEditingScheduleForm({
                                      ...editingScheduleForm,
                                      time: e.target.value,
                                    })
                                  }
                                  className="w-full px-2.5 py-1.5 bg-[#0C1630] border border-[#35E0FF]/40 rounded-lg text-white"
                                />
                              </div>
                              <div>
                                <label className="block text-[#9DB0D0] mb-0.5">Day</label>
                                <select
                                  value={editingScheduleForm.day || 'Day 1 (18 Nov)'}
                                  onChange={(e) =>
                                    setEditingScheduleForm({
                                      ...editingScheduleForm,
                                      day: e.target.value as any,
                                    })
                                  }
                                  className="w-full px-2.5 py-1.5 bg-[#0C1630] border border-[#35E0FF]/40 rounded-lg text-white"
                                >
                                  <option value="Day 1 (18 Nov)">Day 1 (18 Nov)</option>
                                  <option value="Day 2 (19 Nov)">Day 2 (19 Nov)</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-[#9DB0D0] mb-0.5">Category</label>
                                <select
                                  value={editingScheduleForm.category || 'Milestone'}
                                  onChange={(e) =>
                                    setEditingScheduleForm({
                                      ...editingScheduleForm,
                                      category: e.target.value as any,
                                    })
                                  }
                                  className="w-full px-2.5 py-1.5 bg-[#0C1630] border border-[#35E0FF]/40 rounded-lg text-white"
                                >
                                  <option value="Milestone">Milestone</option>
                                  <option value="Mentoring">Mentoring</option>
                                  <option value="Food & Break">Food & Break</option>
                                  <option value="Judging">Judging</option>
                                  <option value="Ceremony">Ceremony</option>
                                </select>
                              </div>
                            </div>
                            <div>
                              <label className="block text-[#9DB0D0] mb-0.5">Title</label>
                              <input
                                type="text"
                                value={editingScheduleForm.title || ''}
                                onChange={(e) =>
                                  setEditingScheduleForm({
                                    ...editingScheduleForm,
                                    title: e.target.value,
                                  })
                                }
                                className="w-full px-2.5 py-1.5 bg-[#0C1630] border border-[#35E0FF]/40 rounded-lg text-white font-bold"
                              />
                            </div>
                            <div>
                              <label className="block text-[#9DB0D0] mb-0.5">Description</label>
                              <textarea
                                rows={2}
                                value={editingScheduleForm.description || ''}
                                onChange={(e) =>
                                  setEditingScheduleForm({
                                    ...editingScheduleForm,
                                    description: e.target.value,
                                  })
                                }
                                className="w-full px-2.5 py-1.5 bg-[#0C1630] border border-[#35E0FF]/40 rounded-lg text-white"
                              />
                            </div>
                            <div className="flex justify-end gap-2 pt-2 border-t border-[#78AAFF]/15">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingScheduleId(null);
                                  setEditingScheduleForm({});
                                }}
                                className="px-3 py-1 rounded-lg text-xs text-[#9DB0D0] hover:text-white bg-[#0C1630]"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (editingScheduleForm.title?.trim()) {
                                    updateScheduleEvent(item.id, editingScheduleForm);
                                    setEditingScheduleId(null);
                                    setEditingScheduleForm({});
                                  }
                                }}
                                className="px-4 py-1 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-[#35E0FF] flex items-center gap-1.5"
                              >
                                <Save className="w-3.5 h-3.5" />
                                <span>Save Changes</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-mono font-bold text-[#35E0FF]">
                                  {item.time}
                                </span>
                                <span className="text-[#9DB0D0]">· {item.day}</span>
                                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#132247] text-[#35E0FF] border border-[#78AAFF]/20">
                                  {item.category}
                                </span>
                              </div>
                              <h5 className="font-bold text-white text-sm">{item.title}</h5>
                              <p className="text-[11px] text-[#9DB0D0] mt-0.5">{item.description}</p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => {
                                  setEditingScheduleId(item.id);
                                  setEditingScheduleForm({ ...item });
                                }}
                                className="p-1.5 text-[#9DB0D0] hover:text-[#35E0FF]"
                                title="Edit Event"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm(`Delete event "${item.title}"?`)) {
                                    deleteScheduleEvent(item.id);
                                  }
                                }}
                                className="p-1.5 text-rose-400 hover:text-white"
                                title="Delete Event"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 9: RULES & GUIDELINES MANAGER */}
            {activeTab === 'rules' && (
              <div className="space-y-6">
                <div className="p-6 rounded-2xl bg-[#0C1630] border border-[#78AAFF]/20">
                  <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#78AAFF]/20">
                    <h3 className="font-display font-bold text-base text-white flex items-center gap-2">
                      <Plus className="w-4 h-4 text-[#FF4FD8]" />
                      <span>Add New Rule / Guideline</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm('Reset all rules back to default event guidelines?')) {
                          resetRulesToDefault();
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-mono text-amber-300 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 flex items-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset to Default Rules</span>
                    </button>
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!newRuleItem.title.trim() || !newRuleItem.details.trim()) return;
                      addRule(newRuleItem);
                      setNewRuleItem({
                        category: 'Eligibility',
                        title: '',
                        details: '',
                      });
                    }}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs"
                  >
                    <div>
                      <label className="block text-[#9DB0D0] mb-1">Category *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Eligibility, Team Size, Evaluation"
                        value={newRuleItem.category}
                        onChange={(e) =>
                          setNewRuleItem({ ...newRuleItem, category: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-[#081024] border border-[#78AAFF]/20 rounded-xl text-white focus:outline-none focus:border-[#FF4FD8]"
                      />
                    </div>

                    <div>
                      <label className="block text-[#9DB0D0] mb-1">Rule Title *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Hardware & Laptop Policy"
                        value={newRuleItem.title}
                        onChange={(e) =>
                          setNewRuleItem({ ...newRuleItem, title: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-[#081024] border border-[#78AAFF]/20 rounded-xl text-white focus:outline-none focus:border-[#FF4FD8]"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[#9DB0D0] mb-1">Rule Details *</label>
                      <textarea
                        rows={3}
                        required
                        placeholder="Full description of the rule or requirement..."
                        value={newRuleItem.details}
                        onChange={(e) =>
                          setNewRuleItem({ ...newRuleItem, details: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-[#081024] border border-[#78AAFF]/20 rounded-xl text-white focus:outline-none focus:border-[#FF4FD8]"
                      />
                    </div>

                    <div className="sm:col-span-2 flex justify-end">
                      <button
                        type="submit"
                        className="px-5 py-2 rounded-xl font-bold text-white bg-gradient-to-r from-[#FF4FD8] to-[#9900F0] hover:brightness-110 shadow-md cursor-pointer"
                      >
                        Add Rule
                      </button>
                    </div>
                  </form>
                </div>

                {/* Rules List */}
                <div className="p-6 rounded-2xl bg-[#0C1630] border border-[#78AAFF]/20">
                  <h4 className="font-bold text-white text-sm mb-4">
                    Current Event Rules ({rules.length})
                  </h4>
                  <div className="space-y-3">
                    {rules.map((rule) => (
                      <div
                        key={rule.id}
                        className="p-4 rounded-xl bg-[#081024] border border-[#78AAFF]/15 text-xs"
                      >
                        {editingRuleId === rule.id ? (
                          <div className="space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[#9DB0D0] mb-0.5">Category</label>
                                <input
                                  type="text"
                                  value={editingRuleForm.category || ''}
                                  onChange={(e) =>
                                    setEditingRuleForm({
                                      ...editingRuleForm,
                                      category: e.target.value,
                                    })
                                  }
                                  className="w-full px-2.5 py-1.5 bg-[#0C1630] border border-[#FF4FD8]/40 rounded-lg text-white"
                                />
                              </div>
                              <div>
                                <label className="block text-[#9DB0D0] mb-0.5">Title</label>
                                <input
                                  type="text"
                                  value={editingRuleForm.title || ''}
                                  onChange={(e) =>
                                    setEditingRuleForm({
                                      ...editingRuleForm,
                                      title: e.target.value,
                                    })
                                  }
                                  className="w-full px-2.5 py-1.5 bg-[#0C1630] border border-[#FF4FD8]/40 rounded-lg text-white font-bold"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-[#9DB0D0] mb-0.5">Details</label>
                              <textarea
                                rows={3}
                                value={editingRuleForm.details || ''}
                                onChange={(e) =>
                                  setEditingRuleForm({
                                    ...editingRuleForm,
                                    details: e.target.value,
                                  })
                                }
                                className="w-full px-2.5 py-1.5 bg-[#0C1630] border border-[#FF4FD8]/40 rounded-lg text-white"
                              />
                            </div>
                            <div className="flex justify-end gap-2 pt-2 border-t border-[#78AAFF]/15">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingRuleId(null);
                                  setEditingRuleForm({});
                                }}
                                className="px-3 py-1 rounded-lg text-xs text-[#9DB0D0] hover:text-white bg-[#0C1630]"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (editingRuleForm.title?.trim() && editingRuleForm.details?.trim()) {
                                    updateRule(rule.id, editingRuleForm);
                                    setEditingRuleId(null);
                                    setEditingRuleForm({});
                                  }
                                }}
                                className="px-4 py-1 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-[#35E0FF] flex items-center gap-1.5"
                              >
                                <Save className="w-3.5 h-3.5" />
                                <span>Save Rule</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#132247] text-[#35E0FF] border border-[#78AAFF]/20">
                                  {rule.category}
                                </span>
                                <h5 className="font-bold text-white text-sm">{rule.title}</h5>
                              </div>
                              <p className="text-[11px] text-[#9DB0D0] mt-1 leading-relaxed">
                                {rule.details}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => {
                                  setEditingRuleId(rule.id);
                                  setEditingRuleForm({ ...rule });
                                }}
                                className="p-1.5 text-[#9DB0D0] hover:text-[#35E0FF]"
                                title="Edit Rule"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm(`Delete rule "${rule.title}"?`)) {
                                    deleteRule(rule.id);
                                  }
                                }}
                                className="p-1.5 text-rose-400 hover:text-white"
                                title="Delete Rule"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* DETAILS MODAL FOR A SINGLE REGISTERED TEAM */}
        {selectedTeamModal && (
          <div
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setSelectedTeamModal(null)}
          >
            <div
              className="w-full max-w-2xl bg-[#081024] border border-[#35E0FF]/40 rounded-3xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between pb-4 border-b border-[#78AAFF]/20">
                <div>
                  <span className="text-xs font-mono font-bold text-[#35E0FF]">{selectedTeamModal.id}</span>
                  <h3 className="text-xl font-bold font-display text-white">{selectedTeamModal.teamName}</h3>
                  <div className="text-xs text-[#9DB0D0]">{selectedTeamModal.college}</div>
                </div>
                <button
                  onClick={() => setSelectedTeamModal(null)}
                  className="p-1.5 text-[#9DB0D0] hover:text-white rounded-lg hover:bg-[#132247]"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="py-4 space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-[#0C1630]">
                  <div><strong>Course:</strong> {selectedTeamModal.course}</div>
                  <div><strong>Department:</strong> {selectedTeamModal.department}</div>
                  <div><strong>Primary Track:</strong> {selectedTeamModal.primaryTrack}</div>
                  <div><strong>Backup Track:</strong> {selectedTeamModal.backupTrack}</div>
                  <div><strong>Payment Status:</strong> {selectedTeamModal.paymentStatus}</div>
                  <div><strong>UTR Reference:</strong> {selectedTeamModal.paymentTransactionId}</div>
                </div>

                <div>
                  <h4 className="font-bold text-white mb-2">Team Members ({selectedTeamModal.members.length})</h4>
                  <div className="space-y-2">
                    {selectedTeamModal.members.map((m, i) => (
                      <div key={m.id} className="p-3 rounded-xl bg-[#0C1630] border border-[#78AAFF]/15">
                        <div className="font-bold text-white">{m.name} {m.isLeader ? '(Team Leader)' : ''}</div>
                        <div className="text-[11px] text-[#9DB0D0] font-mono">
                          USN: {m.usn} · Email: {m.email} · Phone: {m.phone} · Branch: {m.branch} ({m.year})
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedTeamModal.ideaTitle && (
                  <div className="p-3 rounded-xl bg-[#0C1630]">
                    <div className="font-bold text-white">Idea Title: {selectedTeamModal.ideaTitle}</div>
                    <p className="text-[#9DB0D0] mt-1">{selectedTeamModal.ideaSummary}</p>
                  </div>
                )}

                <div className="pt-4 border-t border-[#78AAFF]/20 flex items-center justify-between">
                  <span className="text-[11px] text-[#9DB0D0]">Official IDEATION 2026 Check-in Verification</span>
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#132247] hover:bg-[#1a2d5c] border border-[#35E0FF]/30 flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Printer className="w-4 h-4 text-[#35E0FF]" />
                    <span>Print Entry Pass</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* EVALUATE PROJECT PRESENTATION MODAL */}
        {evaluatingTeam && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
            <div className="w-full max-w-xl bg-[#081024] border border-[#FF4FD8]/40 rounded-3xl p-6 sm:p-8 shadow-[0_0_60px_rgba(255,79,216,0.25)] relative my-8 animate-in fade-in zoom-in-95">
              <button
                onClick={() => {
                  setEvaluatingTeam(null);
                  setEvalSaveMessage(null);
                }}
                className="absolute top-5 right-5 text-[#9DB0D0] hover:text-white p-1 rounded-lg bg-[#0C1630] border border-[#78AAFF]/20 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-[#FF4FD8]/15 border border-[#FF4FD8]/40 text-[#FF4FD8] flex items-center justify-center">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-mono text-[#35E0FF] font-bold uppercase tracking-wider">
                    Jury Evaluation & Grading · {evaluatingTeam.id}
                  </span>
                  <h3 className="text-xl font-bold font-display text-white">
                    {evaluatingTeam.teamName}
                  </h3>
                </div>
              </div>

              <div className="text-xs text-[#9DB0D0] mb-5">
                {evaluatingTeam.college} · <span className="text-[#35E0FF] font-semibold">{evaluatingTeam.primaryTrack}</span>
              </div>

              {/* Quick links to review assets */}
              <div className="p-3.5 rounded-xl bg-[#0C1630] border border-[#78AAFF]/20 mb-5 space-y-2 text-xs">
                <div className="font-bold text-white line-clamp-1">
                  Title: {evaluatingTeam.submission?.projectTitle || evaluatingTeam.ideaTitle || 'Untitled Presentation'}
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {evaluatingTeam.submission?.pptFileData && (
                    <a
                      href={evaluatingTeam.submission.pptFileData}
                      download={evaluatingTeam.submission.pptFileName || `${evaluatingTeam.id}_Presentation.pptx`}
                      className="px-2.5 py-1 rounded-lg bg-[#35E0FF]/15 text-[#35E0FF] border border-[#35E0FF]/30 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Deck ({evaluatingTeam.submission.pptFileName})</span>
                    </a>
                  )}
                  {evaluatingTeam.submission?.pptDeckUrl && (
                    <a
                      href={evaluatingTeam.submission.pptDeckUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded-lg bg-[#132247] text-white border border-[#78AAFF]/30 font-semibold flex items-center gap-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-[#35E0FF]" />
                      <span>Open External Deck</span>
                    </a>
                  )}
                  {evaluatingTeam.submission?.githubUrl && (
                    <a
                      href={evaluatingTeam.submission.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded-lg bg-[#081024] text-white border border-[#78AAFF]/30 font-mono text-[11px] flex items-center gap-1"
                    >
                      <Github className="w-3.5 h-3.5" />
                      <span>GitHub</span>
                    </a>
                  )}
                  {evaluatingTeam.submission?.demoUrl && (
                    <a
                      href={evaluatingTeam.submission.demoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded-lg bg-[#081024] text-white border border-[#78AAFF]/30 font-mono text-[11px] flex items-center gap-1"
                    >
                      <Globe className="w-3.5 h-3.5 text-[#35E0FF]" />
                      <span>Live Demo</span>
                    </a>
                  )}
                </div>
              </div>

              {evalSaveMessage && (
                <div
                  className={`mb-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
                    evalSaveMessage.success
                      ? 'bg-emerald-500/15 border border-emerald-400 text-emerald-300'
                      : 'bg-rose-500/15 border border-rose-400 text-rose-300'
                  }`}
                >
                  {evalSaveMessage.success ? (
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-400" />
                  )}
                  <span>{evalSaveMessage.text}</span>
                </div>
              )}

              <form onSubmit={handleSaveEvaluation} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[#9DB0D0] mb-1 font-semibold">
                      Evaluation Status *
                    </label>
                    <select
                      value={evalStatus}
                      onChange={(e) => setEvalStatus(e.target.value as any)}
                      className="w-full px-3 py-2 bg-[#0C1630] border border-[#78AAFF]/20 rounded-xl text-white focus:outline-none focus:border-[#FF4FD8]"
                    >
                      <option value="Under Review">Under Review</option>
                      <option value="Shortlisted">Shortlisted for Finals</option>
                      <option value="Evaluated">Evaluated / Graded</option>
                      <option value="Needs Revision">Needs Revision</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[#9DB0D0] mb-1 font-semibold">
                      Jury Score (0 - 100)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      placeholder="e.g. 88"
                      value={evalScore}
                      onChange={(e) => setEvalScore(e.target.value)}
                      className="w-full px-3 py-2 bg-[#0C1630] border border-[#78AAFF]/20 rounded-xl text-white font-mono focus:outline-none focus:border-[#FF4FD8]"
                    />
                  </div>
                </div>

                {/* Score presets */}
                <div className="flex items-center gap-1.5 pt-0.5">
                  <span className="text-[10px] text-[#9DB0D0]">Score Presets:</span>
                  {[70, 75, 80, 85, 90, 95].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setEvalScore(String(preset))}
                      className="px-2 py-0.5 rounded bg-[#0C1630] text-[#35E0FF] hover:bg-[#35E0FF]/20 border border-[#78AAFF]/20 font-mono text-[10px] cursor-pointer"
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                <div>
                  <label className="block text-[#9DB0D0] mb-1 font-semibold">
                    Evaluator / Jury Member Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. Ramesh K / Prof. Anveshan"
                    value={evaluatorName}
                    onChange={(e) => setEvaluatorName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0C1630] border border-[#78AAFF]/20 rounded-xl text-white focus:outline-none focus:border-[#FF4FD8]"
                  />
                </div>

                <div>
                  <label className="block text-[#9DB0D0] mb-1 font-semibold">
                    Jury Feedback & Critique (Visible to Team)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Notes on feasibility, architecture originality, hardware implementation, and presentation pitch..."
                    value={evalFeedback}
                    onChange={(e) => setEvalFeedback(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0C1630] border border-[#78AAFF]/20 rounded-xl text-white focus:outline-none focus:border-[#FF4FD8]"
                  />
                </div>

                <div className="pt-4 border-t border-[#78AAFF]/20 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setEvaluatingTeam(null);
                      setEvalSaveMessage(null);
                    }}
                    className="px-4 py-2 rounded-xl font-semibold text-[#9DB0D0] hover:text-white bg-[#0C1630] border border-[#78AAFF]/20 cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isSavingEvaluation}
                    className="px-5 py-2 rounded-xl font-bold text-white bg-gradient-to-r from-[#FF8A2A] to-[#F5611A] shadow-[0_0_20px_rgba(255,138,42,0.4)] hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    {isSavingEvaluation ? (
                      <>
                        <Clock className="w-4 h-4 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Save Evaluation</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
