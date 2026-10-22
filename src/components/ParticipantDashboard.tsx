import React, { useState, useRef, useEffect } from 'react';
import { useHackathon } from '../context/HackathonContext';
import { RegisteredTeam, TeamMember } from '../types';
import QRCode from 'qrcode';
import bulbImg from '../assets/images/ideation_logo.jpg';
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
} from 'lucide-react';

export const ParticipantDashboard: React.FC = () => {
  const {
    registeredTeams,
    currentTeamSession,
    setCurrentTeamSession,
    updateTeam,
    setActiveView,
    setShowRegisterModal,
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

  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  // Sync edited idea if session changes
  useEffect(() => {
    if (currentTeamSession) {
      setEditedIdea({
        ideaTitle: currentTeamSession.ideaTitle || '',
        ideaSummary: currentTeamSession.ideaSummary || '',
      });
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

  return (
    <div className="min-h-screen py-16 px-4 sm:px-6 lg:px-8 bg-[#050B1A] relative">
      <div className="max-w-5xl mx-auto">
        {/* Top bar back button & actions */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => setActiveView('home')}
            className="flex items-center gap-2 text-xs font-semibold text-[#9DB0D0] hover:text-[#35E0FF] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to IDEATION Home</span>
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
                Access your team entry pass, verification status, and announcements
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
                    className="w-full py-2.5 rounded-xl text-xs font-semibold text-white bg-[#132247] hover:bg-[#1a2d5c] border border-[#35E0FF]/30 flex items-center justify-center gap-2 transition-colors"
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
                    {currentTeamSession.members.map((member, i) => (
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
                      <span>Hackathon Project Submission</span>
                    </h3>

                    {!isEditing ? (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-1 text-xs text-[#35E0FF] hover:underline font-mono"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit Abstract</span>
                      </button>
                    ) : (
                      <button
                        onClick={handleSaveIdea}
                        className="flex items-center gap-1 px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-400 rounded-lg text-xs font-mono font-bold"
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
    </div>
  );
};
