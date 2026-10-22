import React, { useState, useEffect, useRef } from 'react';
import { useHackathon } from '../context/HackathonContext';
import { TeamMember, RegisteredTeam } from '../types';
import confetti from 'canvas-confetti';
import QRCode from 'qrcode';
import bulbImg from '../assets/images/ideation_logo.jpg';
import { sendTransactionalEmail, generatePassEmailHtml } from '../lib/email';
import {
  X,
  ChevronRight,
  ChevronLeft,
  User,
  Users,
  Cpu,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Plus,
  Trash2,
  Upload,
  Download,
  Printer,
  Sparkles,
  QrCode,
  ShieldCheck,
} from 'lucide-react';

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RegistrationModal: React.FC<RegistrationModalProps> = ({ isOpen, onClose }) => {
  const {
    eventConfig,
    tracks,
    registerTeam,
    selectedTrackForRegistration,
    setSelectedTrackForRegistration,
  } = useHackathon();

  const [step, setStep] = useState(1);
  const [errorMsg, setErrorMsg] = useState('');
  const [successTeam, setSuccessTeam] = useState<RegisteredTeam | null>(null);
  const passCanvasRef = useRef<HTMLCanvasElement>(null);
  const upiCanvasRef = useRef<HTMLCanvasElement>(null);

  // Form State
  const [leaderAccount, setLeaderAccount] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  });

  const [teamDetails, setTeamDetails] = useState({
    teamName: '',
    college: '',
    city: '',
    department: '',
    course: 'B.E / B.Tech' as 'B.E / B.Tech' | 'M.Tech' | 'MCA',
  });

  const [members, setMembers] = useState<TeamMember[]>([
    {
      id: '1',
      name: '',
      email: '',
      phone: '',
      usn: '',
      branch: '',
      year: '3rd Year',
      isLeader: true,
    },
    {
      id: '2',
      name: '',
      email: '',
      phone: '',
      usn: '',
      branch: '',
      year: '3rd Year',
      isLeader: false,
    },
    {
      id: '3',
      name: '',
      email: '',
      phone: '',
      usn: '',
      branch: '',
      year: '3rd Year',
      isLeader: false,
    },
  ]);

  const [trackChoice, setTrackChoice] = useState({
    primaryTrack: selectedTrackForRegistration || tracks[0]?.title || 'Agri Tech',
    backupTrack: tracks[1]?.title || 'Smart City',
    ideaTitle: '',
    ideaSummary: '',
  });

  const [paymentData, setPaymentData] = useState({
    transactionId: '',
    screenshotPreview: '',
  });

  const [declarationAccepted, setDeclarationAccepted] = useState(false);

  // Update track when opened from track drawer
  useEffect(() => {
    if (selectedTrackForRegistration) {
      setTrackChoice(prev => ({ ...prev, primaryTrack: selectedTrackForRegistration }));
    }
  }, [selectedTrackForRegistration]);

  // Sync leader member 1 with leader account name, email, and phone
  useEffect(() => {
    setMembers(prev => {
      const copy = [...prev];
      if (copy[0]) {
        copy[0].name = leaderAccount.name;
        copy[0].email = leaderAccount.email;
        copy[0].phone = leaderAccount.phone;
      }
      return copy;
    });
  }, [leaderAccount.name, leaderAccount.email, leaderAccount.phone]);

  // Render QR code on confirmation pass
  useEffect(() => {
    if (successTeam && passCanvasRef.current) {
      QRCode.toCanvas(
        passCanvasRef.current,
        JSON.stringify({
          id: successTeam.id,
          team: successTeam.teamName,
          college: successTeam.college,
          track: successTeam.primaryTrack,
        }),
        { width: 140, margin: 1, color: { dark: '#050B1A', light: '#FFFFFF' } }
      );
    }
  }, [successTeam]);

  // UPI payment link
  const upiUrl = `upi://pay?pa=${eventConfig.upiId}&pn=${encodeURIComponent(eventConfig.upiPayeeName)}&am=${eventConfig.entryFee}&cu=INR&tn=IDEATION_${encodeURIComponent(teamDetails.teamName || 'Team')}`;

  // Render UPI QR code in Step 5
  useEffect(() => {
    if (step === 5 && upiCanvasRef.current && eventConfig.upiId) {
      QRCode.toCanvas(
        upiCanvasRef.current,
        upiUrl,
        { width: 140, margin: 1, color: { dark: '#050B1A', light: '#FFFFFF' } },
        () => {}
      );
    }
  }, [step, upiUrl, eventConfig.upiId]);

  if (!isOpen) return null;

  // Add 4th member
  const addMember = () => {
    if (members.length >= 4) return;
    setMembers([
      ...members,
      {
        id: String(Date.now()),
        name: '',
        email: '',
        phone: '',
        usn: '',
        branch: '',
        year: '3rd Year',
        isLeader: false,
      },
    ]);
  };

  // Remove 4th member
  const removeMember = (index: number) => {
    if (members.length <= 3) {
      setErrorMsg('A minimum of 3 members is strictly required.');
      return;
    }
    setMembers(members.filter((_, i) => i !== index));
  };

  const updateMember = (index: number, field: keyof TeamMember, value: any) => {
    setMembers(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Step Validation
  const validateCurrentStep = () => {
    setErrorMsg('');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (step === 1) {
      if (!leaderAccount.name.trim()) {
        setErrorMsg('Please enter Team Leader name.');
        return false;
      }
      if (!leaderAccount.email.trim() || !emailRegex.test(leaderAccount.email.trim())) {
        setErrorMsg('Please enter a valid Team Leader email address.');
        return false;
      }
      const cleanPhone = leaderAccount.phone.replace(/\D/g, '');
      if (cleanPhone.length < 10) {
        setErrorMsg('Please enter a valid 10-digit Team Leader phone number.');
        return false;
      }
      if (!leaderAccount.password || leaderAccount.password.length < 6) {
        setErrorMsg('Please create a password with at least 6 characters.');
        return false;
      }
    }

    if (step === 2) {
      if (!teamDetails.teamName.trim()) {
        setErrorMsg('Team Name is required.');
        return false;
      }
      if (!teamDetails.college.trim()) {
        setErrorMsg('Please enter your College Name.');
        return false;
      }
      if (!teamDetails.department.trim()) {
        setErrorMsg('Department is required (e.g. CSE, ISE, ECE, MCA).');
        return false;
      }
    }

    if (step === 3) {
      if (members.length < 3 || members.length > 4) {
        setErrorMsg('Team size must be strictly 3 or 4 members.');
        return false;
      }
      for (let i = 0; i < members.length; i++) {
        const m = members[i];
        if (!m.name.trim()) {
          setErrorMsg(`Member ${i + 1} full name is required.`);
          return false;
        }
        if (!m.email.trim() || !emailRegex.test(m.email.trim())) {
          setErrorMsg(`Member ${i + 1} email format is invalid. Please enter a valid email.`);
          return false;
        }
        const cleanPhone = (m.phone || '').replace(/\D/g, '');
        if (cleanPhone.length < 10) {
          setErrorMsg(`Member ${i + 1} requires a valid 10-digit phone number.`);
          return false;
        }
        if (!m.usn.trim()) {
          setErrorMsg(`Member ${i + 1} University Seat Number (USN / Roll No) is required.`);
          return false;
        }
        if (!m.branch.trim()) {
          setErrorMsg(`Member ${i + 1} branch/department is required.`);
          return false;
        }
      }
    }

    if (step === 4) {
      if (!trackChoice.primaryTrack) {
        setErrorMsg('Please select a Primary Track.');
        return false;
      }
      if (trackChoice.primaryTrack === trackChoice.backupTrack) {
        setErrorMsg('Backup track should be different from primary track.');
        return false;
      }
    }

    if (step === 5) {
      if (!paymentData.transactionId.trim()) {
        setErrorMsg('Please enter your 12-digit UPI / UTR Transaction Reference ID.');
        return false;
      }
    }

    return true;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setErrorMsg('');
    setStep(prev => prev - 1);
  };

  // Simulated screenshot upload
  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPaymentData(prev => ({ ...prev, screenshotPreview: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFinalSubmit = () => {
    if (!declarationAccepted) {
      setErrorMsg('You must accept the hackathon rules and code of conduct to proceed.');
      return;
    }

    const result = registerTeam({
      teamName: teamDetails.teamName.trim(),
      college: teamDetails.college.trim(),
      city: teamDetails.city.trim(),
      department: teamDetails.department.trim(),
      course: teamDetails.course,
      members: members.map((m, idx) => ({ ...m, isLeader: idx === 0 })),
      primaryTrack: trackChoice.primaryTrack,
      backupTrack: trackChoice.backupTrack,
      ideaTitle: trackChoice.ideaTitle.trim(),
      ideaSummary: trackChoice.ideaSummary.trim(),
      paymentStatus: 'Pending',
      paymentTransactionId: paymentData.transactionId.trim(),
      paymentScreenshotUrl: paymentData.screenshotPreview,
      paymentRemarks: 'Registration submitted with transaction verification pending.',
    });

    if (!result.success) {
      setErrorMsg(result.error || 'Registration failed. Please check form inputs.');
      return;
    }

    // Fire Confetti!
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });

    setSuccessTeam({
      id: result.teamId!,
      teamName: teamDetails.teamName.trim(),
      college: teamDetails.college.trim(),
      city: teamDetails.city.trim(),
      department: teamDetails.department.trim(),
      course: teamDetails.course,
      members: members.map((m, idx) => ({ ...m, isLeader: idx === 0 })),
      primaryTrack: trackChoice.primaryTrack,
      backupTrack: trackChoice.backupTrack,
      ideaTitle: trackChoice.ideaTitle.trim(),
      ideaSummary: trackChoice.ideaSummary.trim(),
      paymentStatus: 'Pending',
      paymentTransactionId: paymentData.transactionId.trim(),
      registeredAt: new Date().toISOString(),
      checkedIn: false,
    });

    // Send confirmation email asynchronously
    sendTransactionalEmail({
      to: leaderAccount.email.trim(),
      subject: `IDEATION 2026 Registration Confirmed - Team ${result.teamId}`,
      html: generatePassEmailHtml({
        teamId: result.teamId!,
        teamName: teamDetails.teamName.trim(),
        college: teamDetails.college.trim(),
        leaderName: leaderAccount.name.trim() || members[0]?.name || 'Team Leader',
        trackName: trackChoice.primaryTrack,
        paymentStatus: 'Pending Verification',
      }),
    });
  };

  const handleModalClose = () => {
    setStep(1);
    setErrorMsg('');
    setSuccessTeam(null);
    setLeaderAccount({ name: '', email: '', phone: '', password: '' });
    setTeamDetails({ teamName: '', college: '', city: '', department: '', course: 'B.E / B.Tech' });
    setMembers([
      { id: '1', name: '', email: '', phone: '', usn: '', branch: '', year: '3rd Year', isLeader: true },
      { id: '2', name: '', email: '', phone: '', usn: '', branch: '', year: '3rd Year', isLeader: false },
      { id: '3', name: '', email: '', phone: '', usn: '', branch: '', year: '3rd Year', isLeader: false },
    ]);
    setTrackChoice({
      primaryTrack: selectedTrackForRegistration || tracks[0]?.title || 'Agri Tech',
      backupTrack: tracks[1]?.title || 'Smart City',
      ideaTitle: '',
      ideaSummary: '',
    });
    setPaymentData({ transactionId: '', screenshotPreview: '' });
    setDeclarationAccepted(false);
    onClose();
  };

  const printPass = () => {
    window.print();
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      onClick={handleModalClose}
    >
      <div 
        className="w-full max-w-2xl bg-[#081024] border border-[#35E0FF]/40 rounded-3xl p-6 sm:p-8 shadow-[0_0_60px_rgba(53,224,255,0.25)] relative max-h-[92vh] overflow-y-auto animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Close Button */}
        <button
          onClick={handleModalClose}
          className="absolute top-6 right-6 p-2 text-[#9DB0D0] hover:text-white rounded-lg hover:bg-[#132247] transition-colors cursor-pointer"
          aria-label="Close registration"
        >
          <X className="w-5 h-5" />
        </button>

        {/* SUCCESS CONFIRMATION SCREEN */}
        {successTeam ? (
          <div className="text-center py-4 space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 mx-auto flex items-center justify-center animate-bounce">
              <CheckCircle className="w-8 h-8" />
            </div>

            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-[#35E0FF]">Registration Confirmed</span>
              <h2 className="text-2xl sm:text-3xl font-black font-display text-white mt-1">
                Welcome to IDEATION 2026!
              </h2>
              <p className="text-sm text-[#9DB0D0] mt-1">
                Your team has been successfully registered. Save your official check-in pass.
              </p>
            </div>

            {/* Printable Pass Card */}
            <div id="printable-pass" className="p-6 rounded-2xl bg-gradient-to-b from-[#0C1630] to-[#081024] border-2 border-[#35E0FF]/40 text-left shadow-2xl relative overflow-hidden">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#78AAFF]/20">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#081024] border border-[#35E0FF]/40 p-0.5 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(53,224,255,0.25)]">
                    <img src={bulbImg} alt="IDEATION Logo" className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <div className="text-[10px] font-mono text-[#35E0FF] uppercase font-bold">BIET Davangere · Anveshan Club</div>
                    <h3 className="text-xl font-black font-display text-white">{successTeam.teamName}</h3>
                    <div className="text-xs text-[#9DB0D0]">{successTeam.college}</div>
                  </div>
                </div>

                <div className="p-2 bg-white rounded-xl shadow-md shrink-0">
                  <canvas ref={passCanvasRef} className="w-24 h-24" />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4 text-xs">
                <div>
                  <div className="text-[10px] text-[#9DB0D0] font-mono">Team ID</div>
                  <div className="font-mono font-bold text-[#FF8A2A] text-sm">{successTeam.id}</div>
                </div>
                <div>
                  <div className="text-[10px] text-[#9DB0D0] font-mono">Domain Track</div>
                  <div className="font-semibold text-white">{successTeam.primaryTrack}</div>
                </div>
                <div>
                  <div className="text-[10px] text-[#9DB0D0] font-mono">Members</div>
                  <div className="font-semibold text-white">{successTeam.members.length} Members</div>
                </div>
                <div>
                  <div className="text-[10px] text-[#9DB0D0] font-mono">Payment Status</div>
                  <div className="font-semibold text-amber-300">Verification Pending</div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#78AAFF]/15 text-[11px] text-[#9DB0D0] flex items-center justify-between">
                <span>Bring valid College ID Cards on 18 Nov, 08:00 AM</span>
                <span className="font-mono text-[#35E0FF] font-semibold">24-Hour Offline Hackathon</span>
              </div>
            </div>

            {/* Action buttons on success */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={printPass}
                className="px-5 py-2.5 rounded-xl font-semibold text-xs text-white bg-[#132247] hover:bg-[#1a2d5c] border border-[#78AAFF]/30 flex items-center gap-2"
              >
                <Printer className="w-4 h-4 text-[#35E0FF]" />
                <span>Print Digital Pass</span>
              </button>

              <button
                onClick={handleModalClose}
                className="px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-[#FF8A2A] to-[#F5611A] shadow-md hover:brightness-110 cursor-pointer"
              >
                Go to Hackathon Portal
              </button>
            </div>
          </div>
        ) : (
          /* MULTI-STEP REGISTRATION FORM */
          <div>
            {/* Header */}
            <div className="pb-4 border-b border-[#78AAFF]/20">
              <div className="text-[11px] font-mono uppercase text-[#35E0FF] tracking-wider font-semibold">
                Step {step} of 6 · Registration Portal
              </div>
              <h2 className="text-xl sm:text-2xl font-black font-display text-white mt-1">
                {step === 1 && 'Team Leader Account'}
                {step === 2 && 'Team & Institutional Details'}
                {step === 3 && `Team Members (${members.length} Members)`}
                {step === 4 && 'Track & Problem Statement'}
                {step === 5 && `Payment Verification (₹${eventConfig.entryFee})`}
                {step === 6 && 'Declaration & Submission'}
              </h2>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-[#0C1630] h-1.5 rounded-full my-5 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-[#35E0FF] via-[#3A7BFF] to-[#FF8A2A] h-full transition-all duration-300"
                style={{ width: `${(step / 6) * 100}%` }}
              />
            </div>

            {/* Inline Error Notice */}
            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* STEP 1: Account */}
            {step === 1 && (
              <div className="space-y-4 py-2">
                <p className="text-xs text-[#9DB0D0]">
                  Create your team login credentials. You will use this email and password to log in to the Participant Dashboard, edit members, and download your entry badge.
                </p>

                <div>
                  <label className="block text-xs font-semibold text-white mb-1">
                    Team Leader Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    autoComplete="off"
                    placeholder="Enter your name"
                    value={leaderAccount.name}
                    onChange={(e) => setLeaderAccount({ ...leaderAccount, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#0C1630] border border-[#78AAFF]/20 rounded-xl text-xs text-white focus:outline-none focus:border-[#35E0FF]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-white mb-1">
                      Team Leader Email *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="leader@college.edu"
                      value={leaderAccount.email}
                      onChange={(e) => setLeaderAccount({ ...leaderAccount, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-[#0C1630] border border-[#78AAFF]/20 rounded-xl text-xs text-white focus:outline-none focus:border-[#35E0FF]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-white mb-1">
                      Team Leader Phone / WhatsApp *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="10-digit mobile number"
                      value={leaderAccount.phone}
                      onChange={(e) => setLeaderAccount({ ...leaderAccount, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-[#0C1630] border border-[#78AAFF]/20 rounded-xl text-xs text-white focus:outline-none focus:border-[#35E0FF]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white mb-1">
                    Dashboard Password (min 6 characters) *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={leaderAccount.password}
                    onChange={(e) => setLeaderAccount({ ...leaderAccount, password: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#0C1630] border border-[#78AAFF]/20 rounded-xl text-xs text-white focus:outline-none focus:border-[#35E0FF]"
                  />
                </div>
              </div>
            )}

            {/* STEP 2: Team Details */}
            {step === 2 && (
              <div className="space-y-4 py-2">
                <div>
                  <label className="block text-xs font-semibold text-white mb-1">
                    Team Name (Must be unique) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CyberVolt Pioneers"
                    value={teamDetails.teamName}
                    onChange={(e) => setTeamDetails({ ...teamDetails, teamName: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#0C1630] border border-[#78AAFF]/20 rounded-xl text-xs text-white focus:outline-none focus:border-[#35E0FF]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-white mb-1">
                      College Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Enter your College Name"
                      value={teamDetails.college}
                      onChange={(e) => setTeamDetails({ ...teamDetails, college: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-[#0C1630] border border-[#78AAFF]/20 rounded-xl text-xs text-white focus:outline-none focus:border-[#35E0FF]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-white mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Davangere"
                      value={teamDetails.city}
                      onChange={(e) => setTeamDetails({ ...teamDetails, city: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-[#0C1630] border border-[#78AAFF]/20 rounded-xl text-xs text-white focus:outline-none focus:border-[#35E0FF]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-white mb-1">
                      Enrolled Program / Course *
                    </label>
                    <select
                      value={teamDetails.course}
                      onChange={(e) => setTeamDetails({ ...teamDetails, course: e.target.value as any })}
                      className="w-full px-3.5 py-2.5 bg-[#0C1630] border border-[#78AAFF]/20 rounded-xl text-xs text-white focus:outline-none focus:border-[#35E0FF]"
                    >
                      <option value="B.E / B.Tech">B.E / B.Tech (Undergraduate)</option>
                      <option value="M.Tech">M.Tech (Postgraduate)</option>
                      <option value="MCA">MCA (Master of Computer Applications)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-white mb-1">
                      Department / Branch *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Computer Science & Engg."
                      value={teamDetails.department}
                      onChange={(e) => setTeamDetails({ ...teamDetails, department: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-[#0C1630] border border-[#78AAFF]/20 rounded-xl text-xs text-white focus:outline-none focus:border-[#35E0FF]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Members (3 to 4) */}
            {step === 3 && (
              <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto pr-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#9DB0D0]">
                    Rule: Exactly <strong>3 or 4 students</strong>. (Member 1 is designated Team Leader).
                  </span>
                  {members.length < 4 && (
                    <button
                      type="button"
                      onClick={addMember}
                      className="px-2.5 py-1 text-xs font-semibold text-[#35E0FF] bg-[#132247] hover:bg-[#1a2d5c] border border-[#35E0FF]/30 rounded-lg flex items-center gap-1 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add 4th Member</span>
                    </button>
                  )}
                </div>

                {members.map((member, idx) => (
                  <div 
                    key={member.id}
                    className="p-4 rounded-2xl bg-[#0C1630] border border-[#78AAFF]/20 space-y-3"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-[#78AAFF]/15">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-[#35E0FF]">
                          Member #{idx + 1}
                        </span>
                        {idx === 0 && (
                          <span className="text-[10px] bg-[#FF8A2A]/20 text-[#FF8A2A] px-2 py-0.5 rounded font-mono font-semibold">
                            Team Leader
                          </span>
                        )}
                      </div>

                      {idx > 2 && (
                        <button
                          type="button"
                          onClick={() => removeMember(idx)}
                          className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-[#9DB0D0] mb-0.5">Full Name *</label>
                        <input
                          type="text"
                          required
                          autoComplete="off"
                          placeholder="Enter your name"
                          value={member.name}
                          onChange={(e) => updateMember(idx, 'name', e.target.value)}
                          className="w-full px-3 py-1.5 bg-[#081024] border border-[#78AAFF]/20 rounded-lg text-xs text-white focus:outline-none focus:border-[#35E0FF]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-[#9DB0D0] mb-0.5">Email *</label>
                        <input
                          type="email"
                          required
                          value={member.email}
                          onChange={(e) => updateMember(idx, 'email', e.target.value)}
                          className="w-full px-3 py-1.5 bg-[#081024] border border-[#78AAFF]/20 rounded-lg text-xs text-white focus:outline-none focus:border-[#35E0FF]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-[#9DB0D0] mb-0.5">WhatsApp / Phone *</label>
                        <input
                          type="tel"
                          required
                          placeholder="10-digit number"
                          value={member.phone}
                          onChange={(e) => updateMember(idx, 'phone', e.target.value)}
                          className="w-full px-3 py-1.5 bg-[#081024] border border-[#78AAFF]/20 rounded-lg text-xs text-white focus:outline-none focus:border-[#35E0FF]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-[#9DB0D0] mb-0.5">USN / Roll Number *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. 4BD23CS045"
                          value={member.usn}
                          onChange={(e) => updateMember(idx, 'usn', e.target.value)}
                          className="w-full px-3 py-1.5 bg-[#081024] border border-[#78AAFF]/20 rounded-lg text-xs text-white focus:outline-none focus:border-[#35E0FF]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-[#9DB0D0] mb-0.5">Department / Branch *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. CSE, ISE, ECE, MCA"
                          value={member.branch}
                          onChange={(e) => updateMember(idx, 'branch', e.target.value)}
                          className="w-full px-3 py-1.5 bg-[#081024] border border-[#78AAFF]/20 rounded-lg text-xs text-white focus:outline-none focus:border-[#35E0FF]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-[#9DB0D0] mb-0.5">Year of Study *</label>
                        <select
                          value={member.year}
                          onChange={(e) => updateMember(idx, 'year', e.target.value)}
                          className="w-full px-3 py-1.5 bg-[#081024] border border-[#78AAFF]/20 rounded-lg text-xs text-white focus:outline-none focus:border-[#35E0FF]"
                        >
                          <option value="1st Year">1st Year</option>
                          <option value="2nd Year">2nd Year</option>
                          <option value="3rd Year">3rd Year</option>
                          <option value="4th Year">4th Year</option>
                          <option value="PG 1st Year">PG 1st Year</option>
                          <option value="PG 2nd Year">PG 2nd Year</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* STEP 4: Track Selection */}
            {step === 4 && (
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-white mb-1">
                      Primary Domain Track *
                    </label>
                    <select
                      value={trackChoice.primaryTrack}
                      onChange={(e) => setTrackChoice({ ...trackChoice, primaryTrack: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-[#0C1630] border border-[#78AAFF]/20 rounded-xl text-xs text-white focus:outline-none focus:border-[#35E0FF]"
                    >
                      {tracks.map(t => (
                        <option key={t.id} value={t.title}>{t.title}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-white mb-1">
                      Secondary / Backup Track *
                    </label>
                    <select
                      value={trackChoice.backupTrack}
                      onChange={(e) => setTrackChoice({ ...trackChoice, backupTrack: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-[#0C1630] border border-[#78AAFF]/20 rounded-xl text-xs text-white focus:outline-none focus:border-[#35E0FF]"
                    >
                      {tracks.map(t => (
                        <option key={t.id} value={t.title}>{t.title}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white mb-1">
                    Preliminary Idea / Project Title (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Distributed Soil Nutrient Telemetry Sensor"
                    value={trackChoice.ideaTitle}
                    onChange={(e) => setTrackChoice({ ...trackChoice, ideaTitle: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#0C1630] border border-[#78AAFF]/20 rounded-xl text-xs text-white focus:outline-none focus:border-[#35E0FF]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white mb-1">
                    Idea Summary (2 to 3 sentences)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Briefly describe what problem you intend to solve and key technologies you plan to use..."
                    value={trackChoice.ideaSummary}
                    onChange={(e) => setTrackChoice({ ...trackChoice, ideaSummary: e.target.value })}
                    className="w-full px-3.5 py-2 bg-[#0C1630] border border-[#78AAFF]/20 rounded-xl text-xs text-white focus:outline-none focus:border-[#35E0FF]"
                  />
                </div>
              </div>
            )}

            {/* STEP 5: Payment (₹100 UPI) */}
            {step === 5 && (
              <div className="space-y-4 py-2">
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#11234D] to-[#0C1630] border border-[#35E0FF]/40 flex flex-col sm:flex-row items-center gap-6 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#35E0FF]/5 rounded-full blur-2xl pointer-events-none" />

                  {/* Official Attached UPI Payment QR Code */}
                  <div className="flex flex-col items-center gap-2 shrink-0">
                    <div className="p-2 bg-white rounded-2xl shadow-xl border-2 border-[#35E0FF]/40 relative group">
                      <img
                        src="/assets/aistudio/WhatsApp_Image_2026-10-22_at_2.03.09_PM_28c7a4a1.jpeg"
                        alt="Official UPI Payment QR Code"
                        className="w-36 h-36 object-contain rounded-xl select-none"
                      />
                      <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                        <span className="text-[10px] text-white font-bold bg-black/70 px-2 py-1 rounded">Scan to Pay</span>
                      </div>
                    </div>
                    <a
                      href="/assets/aistudio/WhatsApp_Image_2026-10-22_at_2.03.09_PM_28c7a4a1.jpeg"
                      download="IDEATION_2026_Payment_QR.jpeg"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-[#35E0FF] hover:underline flex items-center gap-1 font-mono"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download QR</span>
                    </a>
                  </div>

                  <div className="space-y-2 text-center sm:text-left flex-1">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[11px] font-semibold">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Official Verified Payment QR</span>
                    </div>
                    <div className="text-sm sm:text-base font-extrabold text-white">
                      Entry Fee: ₹{eventConfig.entryFee} Per Team (3-4 Members)
                    </div>
                    <p className="text-xs text-[#9DB0D0]">
                      Open Google Pay, PhonePe, Paytm, BHIM, or any UPI app and scan the QR code to complete registration fee payment.
                    </p>
                    <div className="flex flex-wrap items-center gap-2 pt-1 justify-center sm:justify-start">
                      <div className="text-[11px] font-mono text-[#35E0FF] bg-[#050B1A] px-3 py-1 rounded-lg border border-[#35E0FF]/30">
                        UPI: <span className="font-bold text-white">{eventConfig.upiId}</span>
                      </div>
                      <div className="text-[11px] text-[#9DB0D0] bg-[#050B1A]/60 px-2.5 py-1 rounded-lg border border-[#78AAFF]/20">
                        Payee: <span className="text-white font-medium">{eventConfig.upiPayeeName}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white mb-1">
                    12-Digit UPI / Bank Transaction Reference ID (UTR) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 431980345112"
                    value={paymentData.transactionId}
                    onChange={(e) => setPaymentData({ ...paymentData, transactionId: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#0C1630] border border-[#78AAFF]/20 rounded-xl text-xs text-white focus:outline-none focus:border-[#35E0FF] font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white mb-1">
                    Payment Screenshot (Optional / Recommended for instant verification)
                  </label>
                  <label className="border-2 border-dashed border-[#78AAFF]/30 hover:border-[#35E0FF] rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer bg-[#0C1630]/60 transition-colors">
                    <Upload className="w-6 h-6 text-[#35E0FF] mb-1" />
                    <span className="text-xs text-white font-medium">Click to upload screenshot</span>
                    <span className="text-[10px] text-[#9DB0D0] mt-0.5">PNG, JPG or JPEG up to 5MB</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleScreenshotChange}
                      className="hidden"
                    />
                  </label>
                  {paymentData.screenshotPreview && (
                    <div className="mt-2 text-xs text-emerald-400 font-mono flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Screenshot uploaded & preview attached!</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 6: Review & Declaration */}
            {step === 6 && (
              <div className="space-y-4 py-2">
                <div className="p-4 rounded-xl bg-[#0C1630] border border-[#78AAFF]/20 text-xs space-y-2">
                  <div className="flex justify-between border-b border-[#78AAFF]/15 pb-1">
                    <span className="text-[#9DB0D0]">Team:</span>
                    <span className="font-bold text-white">{teamDetails.teamName} ({teamDetails.college})</span>
                  </div>
                  <div className="flex justify-between border-b border-[#78AAFF]/15 pb-1">
                    <span className="text-[#9DB0D0]">Track:</span>
                    <span className="font-semibold text-[#35E0FF]">{trackChoice.primaryTrack}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#78AAFF]/15 pb-1">
                    <span className="text-[#9DB0D0]">Team Size:</span>
                    <span className="font-bold text-white">{members.length} Members</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#9DB0D0]">Transaction ID:</span>
                    <span className="font-mono text-amber-300">{paymentData.transactionId}</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#081024] border border-[#35E0FF]/30 space-y-2 text-xs text-[#9DB0D0]">
                  <h4 className="font-bold text-white text-xs">Declaration & Consent</h4>
                  <p>1. We confirm that all code and hardware prototyping will be done fresh during the 24 hours of IDEATION 2026.</p>
                  <p>2. We confirm that all team members are genuine students of B.E / B.Tech / M.Tech / MCA with physical college ID cards.</p>
                  <p>3. We agree to abide by the event code of conduct and decisions of the jury and BIET organizers.</p>
                </div>

                <label className="flex items-start gap-3 cursor-pointer pt-2">
                  <input
                    type="checkbox"
                    checked={declarationAccepted}
                    onChange={(e) => setDeclarationAccepted(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded border-gray-600 text-[#35E0FF] focus:ring-[#35E0FF]"
                  />
                  <span className="text-xs text-white font-medium">
                    I, on behalf of my team, accept the terms, rules, photo/media consent, and declaration for IDEATION 2026.
                  </span>
                </label>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="pt-6 mt-6 border-t border-[#78AAFF]/20 flex items-center justify-between">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#9DB0D0] hover:text-white bg-[#0C1630] border border-[#78AAFF]/20 flex items-center gap-1.5"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
              ) : (
                <div />
              )}

              {step < 6 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-[#FF8A2A] to-[#F5611A] shadow-md hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <span>Continue</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  className="px-7 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-emerald-500 to-[#35E0FF] shadow-[0_0_20px_rgba(53,224,255,0.4)] hover:brightness-110 active:scale-95 transition-all flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Submit Team Registration</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
