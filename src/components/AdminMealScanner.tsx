import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';
import { MealDay, MealScanRecord, MealType, RegisteredTeam } from '../types';
import { MealScanResult } from '../context/HackathonContext';
import {
  MEAL_DAYS,
  MEAL_TYPES,
  getTeamMealCode,
  evaluateMealCooldown,
  getTeamMealSlotProgress,
  formatCooldownDuration,
} from '../lib/mealPass';
import {
  Camera,
  CameraOff,
  RotateCw,
  Upload,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Utensils,
  Coffee,
  Cookie,
  Soup,
  Sun,
  Calendar,
  QrCode,
  Lock,
  Unlock,
  Users,
  Sparkles,
  UserCheck,
  Check,
} from 'lucide-react';

interface AdminMealScannerProps {
  registeredTeams: RegisteredTeam[];
  adminName?: string;
  onScanMeal: (
    qrOrTeamQuery: string,
    day: MealDay,
    mealType: MealType,
    scannedBy?: string,
    targetMemberId?: string
  ) => MealScanResult;
}

const MEAL_META: Record<
  MealType,
  { label: string; timeHint: string; icon: React.ComponentType<{ className?: string }>; accent: string }
> = {
  Breakfast: {
    label: 'Breakfast',
    timeHint: 'Morning Service',
    icon: Coffee,
    accent: 'text-amber-300 border-amber-400/40 bg-amber-500/15',
  },
  Lunch: {
    label: 'Lunch',
    timeHint: 'Afternoon Meal',
    icon: Sun,
    accent: 'text-[#35E0FF] border-[#35E0FF]/40 bg-[#35E0FF]/15',
  },
  Snacks: {
    label: 'Snacks',
    timeHint: 'High Tea / Refreshments',
    icon: Cookie,
    accent: 'text-[#FF4FD8] border-[#FF4FD8]/40 bg-[#FF4FD8]/15',
  },
  Dinner: {
    label: 'Dinner',
    timeHint: 'Evening Meal',
    icon: Soup,
    accent: 'text-emerald-300 border-emerald-400/40 bg-emerald-500/15',
  },
};

export const AdminMealScanner: React.FC<AdminMealScannerProps> = ({
  registeredTeams,
  adminName,
  onScanMeal,
}) => {
  const [selectedDay, setSelectedDay] = useState<MealDay>('Day 1 (Dec 1)');
  const [selectedMeal, setSelectedMeal] = useState<MealType>('Breakfast');

  // Camera & input state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualQuery, setManualQuery] = useState('');
  const [tableSearch, setTableSearch] = useState('');
  const [scanFlash, setScanFlash] = useState<'success' | 'failure' | null>(null);

  // Latest scan outcome + active team inspection
  const [lastResult, setLastResult] = useState<MealScanResult | null>(null);
  const [focusedTeamId, setFocusedTeamId] = useState<string | null>(null);
  const [nowTick, setNowTick] = useState<number>(() => Date.now());

  // Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastCameraPayloadRef = useRef<{ data: string; at: number } | null>(null);

  // Keep fresh callback/selections for rAF camera loop
  const latestScanHandlerRef = useRef<(raw: string) => void>(() => {});

  // 1-second live timer for real-time 3-hour cooldown countdowns
  useEffect(() => {
    const timer = setInterval(() => {
      setNowTick(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const playSuccessBeep = (allServed?: boolean) => {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const playTone = (freq: number, start: number, duration: number, gainVal: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
        gain.gain.setValueAtTime(gainVal, ctx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + duration);
      };
      if (allServed) {
        // Extra celebratory 4-note chord when all team members are scanned & marked SERVED
        playTone(523.25, 0, 0.14, 0.2);
        playTone(659.25, 0.08, 0.14, 0.22);
        playTone(783.99, 0.16, 0.14, 0.24);
        playTone(1046.5, 0.24, 0.3, 0.28);
      } else {
        playTone(587.33, 0, 0.16, 0.2);
        playTone(739.99, 0.08, 0.16, 0.24);
        playTone(987.77, 0.16, 0.25, 0.28);
      }
    } catch {
      // Ignore WebAudio block
    }
  };

  const playFailureBuzz = () => {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const playTone = (freq: number, start: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
        gain.gain.setValueAtTime(0.18, ctx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + duration);
      };
      playTone(210, 0, 0.14);
      playTone(140, 0.16, 0.24);
    } catch {
      // Ignore WebAudio block
    }
  };

  const processScanInput = (rawInput: string, targetMemberId?: string) => {
    const clean = rawInput.trim();
    if (!clean) return;

    const result = onScanMeal(
      clean,
      selectedDay,
      selectedMeal,
      adminName || 'Food Counter Desk',
      targetMemberId
    );
    setLastResult(result);
    if (result.team) {
      setFocusedTeamId(result.team.id);
    }

    if (result.success) {
      playSuccessBeep(result.allMembersServed);
      setScanFlash('success');
      setTimeout(() => setScanFlash(null), 1200);
    } else {
      playFailureBuzz();
      setScanFlash('failure');
      setTimeout(() => setScanFlash(null), 1200);
    }
  };

  latestScanHandlerRef.current = (raw: string) => processScanInput(raw);

  const scanVideoFrame = () => {
    if (!videoRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
      animFrameIdRef.current = requestAnimationFrame(scanVideoFrame);
      return;
    }

    const video = videoRef.current;
    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
    }
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (ctx && canvas.width > 0 && canvas.height > 0) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (code && code.data) {
        const now = Date.now();
        const prev = lastCameraPayloadRef.current;
        if (!prev || prev.data !== code.data || now - prev.at > 2200) {
          lastCameraPayloadRef.current = { data: code.data, at: now };
          latestScanHandlerRef.current(code.data);
        }
      }
    }

    animFrameIdRef.current = requestAnimationFrame(scanVideoFrame);
  };

  const stopCamera = () => {
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const startCamera = async (facing: 'environment' | 'user' = cameraFacing) => {
    setCameraError(null);
    stopCamera();
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported on this browser or requires HTTPS.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setIsCameraActive(true);
        animFrameIdRef.current = requestAnimationFrame(scanVideoFrame);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to start camera.';
      setCameraError(msg);
      setIsCameraActive(false);
    }
  };

  const toggleCameraFacing = () => {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(nextFacing);
    if (isCameraActive) {
      startCamera(nextFacing);
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code && code.data) {
            processScanInput(code.data);
          } else {
            playFailureBuzz();
            setLastResult({
              success: false,
              message: 'No clear QR code detected in the uploaded image. Try a clearer pass image or enter the Team/Member Code manually.',
            });
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualQuery.trim()) return;
    processScanInput(manualQuery.trim());
    setManualQuery('');
  };

  // Compute live meal distribution stats for selected day + across both days
  const getMealSlotStats = (day: MealDay, mealType: MealType) => {
    let teamsServed = 0;
    let teamsScanning = 0;
    let membersServed = 0;
    for (const team of registeredTeams) {
      const prog = getTeamMealSlotProgress(team, day, mealType);
      if (prog.isServed) {
        teamsServed += 1;
      } else if (prog.scannedCount > 0) {
        teamsScanning += 1;
      }
      membersServed += prog.scannedCount;
    }
    return { teamsServed, teamsScanning, membersServed };
  };

  const totalTeamSectionsServed = registeredTeams.reduce((sum, team) => {
    let count = 0;
    for (const d of MEAL_DAYS) {
      for (const m of MEAL_TYPES) {
        if (getTeamMealSlotProgress(team, d, m).isServed) count += 1;
      }
    }
    return sum + count;
  }, 0);

  // Recent meal scan feed across all teams
  const recentMealFeed: Array<{ team: RegisteredTeam; log: MealScanRecord; mealCode: string }> = [];
  for (const team of registeredTeams) {
    const mealCode = getTeamMealCode(team);
    for (const log of team.mealLogs || []) {
      recentMealFeed.push({ team, log, mealCode });
    }
  }
  recentMealFeed.sort((a, b) => Date.parse(b.log.scannedAt) - Date.parse(a.log.scannedAt));

  const filteredTeams = registeredTeams.filter((team) => {
    if (!tableSearch.trim()) return true;
    const q = tableSearch.trim().toLowerCase();
    const code = getTeamMealCode(team).toLowerCase();
    return (
      team.id.toLowerCase().includes(q) ||
      team.teamName.toLowerCase().includes(q) ||
      code.includes(q) ||
      team.college.toLowerCase().includes(q) ||
      team.members.some((m) => m.name.toLowerCase().includes(q) || m.usn.toLowerCase().includes(q))
    );
  });

  // Live team reference for the active result card so member checklist stays synced in real time
  const activeTeam =
    (focusedTeamId && registeredTeams.find((t) => t.id === focusedTeamId)) ||
    (lastResult?.team && registeredTeams.find((t) => t.id === lastResult.team?.id)) ||
    lastResult?.team;

  const activeSlotProgress = activeTeam
    ? getTeamMealSlotProgress(activeTeam, selectedDay, selectedMeal)
    : undefined;
  const activeCooldown = activeTeam
    ? evaluateMealCooldown(activeTeam.mealLogs, nowTick, activeTeam, selectedDay, selectedMeal)
    : undefined;

  return (
    <div className="space-y-6">
      {/* Top Catering Mode Banner & Day / Meal Selector */}
      <div className="p-6 rounded-3xl bg-[#081024] border border-[#FF8A2A]/40 shadow-[0_0_40px_rgba(255,138,42,0.12)] space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#78AAFF]/20">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-[#FF8A2A]/15 text-[#FF8A2A] border border-[#FF8A2A]/40 font-bold flex items-center gap-1.5">
                <Utensils className="w-3.5 h-3.5" />
                <span>Catering & Food Counter QR Desk</span>
              </span>
              <span className="font-mono text-[11px] px-2.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                <UserCheck className="w-3 h-3" />
                <span>Marks SERVED After All Members Scan</span>
              </span>
              <span className="font-mono text-[11px] px-2.5 py-0.5 rounded bg-[#35E0FF]/10 text-[#35E0FF] border border-[#35E0FF]/30 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>3-Hour Cooldown After Serving</span>
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black font-display text-white">
              Two-Day Meals & Snacks QR Scanner
            </h3>
            <p className="text-xs text-[#9DB0D0] mt-0.5">
              Scan each team&apos;s unique QR or individual member QR codes. Once <strong className="text-emerald-300">all members in the team</strong> are scanned, that meal section is automatically marked as <strong className="text-emerald-300">SERVED</strong> and enters a <strong className="text-amber-300">3-hour cooldown</strong> before the next meal can be scanned.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="px-4 py-2 rounded-2xl bg-[#0C1630] border border-[#78AAFF]/20 text-right">
              <div className="text-[10px] font-mono uppercase text-[#9DB0D0]">Sections Marked SERVED</div>
              <div className="text-lg font-bold font-mono text-emerald-400">{totalTeamSectionsServed} Completed</div>
            </div>
            {isCameraActive ? (
              <>
                <button
                  type="button"
                  onClick={toggleCameraFacing}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-[#9DB0D0] hover:text-white bg-[#0C1630] border border-[#78AAFF]/20 flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCw className="w-3.5 h-3.5 text-[#35E0FF]" />
                  <span>Flip</span>
                </button>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-white bg-rose-500/10 border border-rose-500/30 flex items-center gap-1.5 cursor-pointer"
                >
                  <CameraOff className="w-3.5 h-3.5" />
                  <span>Stop Camera</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => startCamera()}
                className="px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-[#FF8A2A] to-[#FF4FD8] shadow-[0_0_20px_rgba(255,138,42,0.35)] hover:brightness-110 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                <span>Start Meal QR Camera</span>
              </button>
            )}
          </div>
        </div>

        {/* Event Day & Meal Type Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          {/* Day Switcher */}
          <div className="lg:col-span-4 p-4 rounded-2xl bg-[#0C1630] border border-[#78AAFF]/20 space-y-2.5">
            <div className="text-[11px] font-mono uppercase tracking-wider text-[#9DB0D0] flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#35E0FF]" />
              <span>1. Select Event Day</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {MEAL_DAYS.map((day) => {
                const active = selectedDay === day;
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setSelectedDay(day)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      active
                        ? 'bg-[#35E0FF]/20 border-[#35E0FF] text-white shadow-[0_0_18px_rgba(53,224,255,0.2)]'
                        : 'bg-[#081024] border-[#78AAFF]/15 text-[#9DB0D0] hover:text-white'
                    }`}
                  >
                    <div className="font-bold text-xs">{day.split(' ')[0] + ' ' + day.split(' ')[1]}</div>
                    <div className={`text-[11px] font-mono mt-0.5 ${active ? 'text-[#35E0FF]' : 'text-[#78AAFF]/70'}`}>
                      {day.replace(/Day \d+\s*/, '')}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Meal Selector Cards */}
          <div className="lg:col-span-8 p-4 rounded-2xl bg-[#0C1630] border border-[#78AAFF]/20 space-y-2.5">
            <div className="text-[11px] font-mono uppercase tracking-wider text-[#9DB0D0] flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Utensils className="w-3.5 h-3.5 text-[#FF8A2A]" />
                <span>2. Select Food / Beverage Session ({selectedDay})</span>
              </span>
              <span className="text-[#35E0FF] font-bold">Active: {selectedMeal}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {MEAL_TYPES.map((mealType) => {
                const meta = MEAL_META[mealType];
                const IconComp = meta.icon;
                const active = selectedMeal === mealType;
                const stats = getMealSlotStats(selectedDay, mealType);
                const allTeamsInSlotServed =
                  registeredTeams.length > 0 && stats.teamsServed === registeredTeams.length;
                return (
                  <button
                    key={mealType}
                    type="button"
                    onClick={() => setSelectedMeal(mealType)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      active
                        ? `${meta.accent} ring-1 ring-white/30 shadow-lg`
                        : 'bg-[#081024] border-[#78AAFF]/15 text-[#9DB0D0] hover:text-white hover:border-[#78AAFF]/35'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <IconComp className="w-4 h-4" />
                      <span
                        className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${
                          allTeamsInSlotServed
                            ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-400/50'
                            : 'bg-black/30 text-white'
                        }`}
                      >
                        {allTeamsInSlotServed ? 'ALL SERVED' : `${stats.teamsServed} served`}
                      </span>
                    </div>
                    <div className="font-bold text-sm text-white mt-2">{meta.label}</div>
                    <div className="text-[10px] opacity-85 mt-0.5">
                      {stats.membersServed} plates · {stats.teamsScanning > 0 ? `${stats.teamsScanning} scanning` : `${stats.teamsServed}/${registeredTeams.length} teams`}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Camera + Upload/Manual + Live Result & Team Member Progress */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Viewfinder */}
          <div className="lg:col-span-5 space-y-3">
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-[#050B1A] border-2 border-dashed border-[#FF8A2A]/40 flex items-center justify-center">
              <video
                ref={videoRef}
                className={`w-full h-full object-cover ${isCameraActive ? 'block' : 'hidden'}`}
                autoPlay
                muted
                playsInline
              />

              {isCameraActive && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div
                    className={`relative w-52 h-52 sm:w-56 sm:h-56 rounded-2xl transition-all duration-300 border-2 overflow-hidden ${
                      scanFlash === 'success'
                        ? 'border-emerald-400 shadow-[0_0_45px_rgba(52,211,153,0.75)] bg-emerald-500/15'
                        : scanFlash === 'failure'
                        ? 'border-rose-500 shadow-[0_0_45px_rgba(244,63,94,0.75)] bg-rose-500/15'
                        : 'border-[#FF8A2A] shadow-[0_0_30px_rgba(255,138,42,0.45)]'
                    }`}
                  >
                    <div className="absolute left-0 right-0 animate-scan-sweep pointer-events-none">
                      <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-[#FF8A2A] to-transparent shadow-[0_0_16px_#FF8A2A]" />
                      <div className="h-10 w-full bg-gradient-to-b from-[#FF8A2A]/20 to-transparent" />
                    </div>
                    <div className="absolute top-0 left-0 w-5 h-5 border-t-3 border-l-3 border-[#35E0FF] rounded-tl-lg" />
                    <div className="absolute top-0 right-0 w-5 h-5 border-t-3 border-r-3 border-[#35E0FF] rounded-tr-lg" />
                    <div className="absolute bottom-0 left-0 w-5 h-5 border-b-3 border-l-3 border-[#35E0FF] rounded-bl-lg" />
                    <div className="absolute bottom-0 right-0 w-5 h-5 border-b-3 border-r-3 border-[#35E0FF] rounded-br-lg" />
                  </div>
                  <div className="absolute bottom-3 font-mono text-[11px] text-[#FF8A2A] bg-[#050B1A]/85 px-3.5 py-1 rounded-full border border-[#FF8A2A]/30 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>
                      Scanning Member/Team QR · {selectedMeal}
                    </span>
                  </div>
                </div>
              )}

              {!isCameraActive && (
                <div className="text-center p-6 space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-[#0C1630] border border-[#FF8A2A]/30 mx-auto flex items-center justify-center text-[#FF8A2A]">
                    <QrCode className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Meal QR Scanner Ready</p>
                    <p className="text-xs text-[#9DB0D0] mt-1 max-w-xs mx-auto">
                      Scan a member&apos;s unique QR or the team&apos;s unique QR code. Once all members in the team are scanned, the section marks <strong className="text-emerald-300">SERVED</strong>.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {cameraError && (
              <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{cameraError} Use image upload or manual Team/Member code lookup.</span>
              </div>
            )}

            {/* Manual + Upload row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-[#0C1630] border border-[#78AAFF]/20 space-y-2">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5 text-[#35E0FF]" />
                  <span>Manual Team / Member Code</span>
                </h4>
                <form onSubmit={handleManualSubmit} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="IDN-0001 or -M1..."
                    value={manualQuery}
                    onChange={(e) => setManualQuery(e.target.value)}
                    className="w-full px-3 py-2 bg-[#081024] border border-[#78AAFF]/20 rounded-xl text-xs text-white focus:outline-none focus:border-[#FF8A2A] font-mono uppercase"
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-[#FF8A2A] to-[#F5611A] shrink-0 hover:brightness-110 cursor-pointer"
                  >
                    Scan
                  </button>
                </form>
              </div>

              <div className="p-4 rounded-2xl bg-[#0C1630] border border-[#78AAFF]/20 flex flex-col justify-between space-y-2">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-[#FF4FD8]" />
                  <span>Upload QR Image</span>
                </h4>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="meal-qr-file-input"
                />
                <label
                  htmlFor="meal-qr-file-input"
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#35E0FF] bg-[#132247] hover:bg-[#1a2d5c] border border-[#35E0FF]/30 cursor-pointer transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Select Pass Image</span>
                </label>
              </div>
            </div>
          </div>

          {/* Live Result + Per-Member Scan Checklist Column */}
          <div className="lg:col-span-7 space-y-4">
            {lastResult && (
              <div
                className={`p-4 sm:p-5 rounded-2xl border-2 transition-all ${
                  lastResult.success
                    ? lastResult.allMembersServed
                      ? 'bg-emerald-950/45 border-emerald-400 shadow-[0_0_30px_rgba(52,211,153,0.22)]'
                      : 'bg-cyan-950/35 border-[#35E0FF]/70 shadow-[0_0_25px_rgba(53,224,255,0.16)]'
                    : lastResult.blockedByCooldown
                    ? 'bg-rose-950/40 border-rose-500/75 shadow-[0_0_30px_rgba(244,63,94,0.18)]'
                    : 'bg-amber-950/30 border-amber-400/60'
                }`}
              >
                <div className="flex items-start gap-3">
                  {lastResult.success ? (
                    <div
                      className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${
                        lastResult.allMembersServed
                          ? 'bg-emerald-500/25 border-emerald-400 text-emerald-300'
                          : 'bg-[#35E0FF]/20 border-[#35E0FF] text-[#35E0FF]'
                      }`}
                    >
                      {lastResult.allMembersServed ? (
                        <CheckCircle2 className="w-6 h-6" />
                      ) : (
                        <UserCheck className="w-6 h-6" />
                      )}
                    </div>
                  ) : lastResult.blockedByCooldown ? (
                    <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-400 text-rose-300 flex items-center justify-center shrink-0">
                      <Lock className="w-6 h-6" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400 text-amber-300 flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span
                        className={`text-xs font-mono font-bold uppercase ${
                          lastResult.success
                            ? lastResult.allMembersServed
                              ? 'text-emerald-300'
                              : 'text-[#35E0FF]'
                            : lastResult.blockedByCooldown
                            ? 'text-rose-300'
                            : 'text-amber-300'
                        }`}
                      >
                        {lastResult.success
                          ? lastResult.allMembersServed
                            ? 'ALL MEMBERS SCANNED · SECTION MARKED SERVED'
                            : 'MEMBER SCANNED · SCAN REMAINING TEAM'
                          : lastResult.blockedByCooldown
                          ? 'NOT ALLOWED · 3-HOUR COOLDOWN LOCK'
                          : lastResult.alreadyServed
                          ? 'SECTION ALREADY MARKED SERVED'
                          : 'SCAN NOTICE'}
                      </span>
                      {activeTeam && (
                        <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-[#081024] border border-[#78AAFF]/30 text-[#FF8A2A]">
                          {getTeamMealCode(activeTeam)}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-white/95 leading-relaxed">{lastResult.message}</p>

                    {lastResult.blockedByCooldown && activeCooldown?.blocked && (
                      <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-400/40 flex flex-wrap items-center justify-between gap-2">
                        <div className="text-xs text-rose-200">
                          Rescan unlocks in:{' '}
                          <span className="font-mono font-black text-white text-sm">
                            {formatCooldownDuration(activeCooldown.remainingMs)}
                          </span>
                        </div>
                        {activeCooldown.nextEligibleAt && (
                          <div className="text-[11px] font-mono text-rose-300">
                            Next Eligible:{' '}
                            {new Date(activeCooldown.nextEligibleAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Active Team Per-Member Scanner Checklist Card */}
            {activeTeam && activeSlotProgress ? (
              <div className="p-5 rounded-2xl bg-[#0C1630] border border-[#78AAFF]/25 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#78AAFF]/15">
                  <div>
                    <div className="text-[10px] font-mono uppercase text-[#35E0FF]">
                      Team Member Progress · {selectedDay} · {selectedMeal}
                    </div>
                    <h4 className="font-bold text-white text-base">
                      {activeTeam.teamName} <span className="font-mono text-xs text-[#9DB0D0]">({activeTeam.id})</span>
                    </h4>
                  </div>

                  {activeSlotProgress.isServed ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400 text-emerald-300 font-mono text-xs font-black uppercase shadow-[0_0_20px_rgba(52,211,153,0.25)]">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>SERVED ({activeSlotProgress.scannedCount}/{activeSlotProgress.totalMembers})</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-400/50 text-amber-300 font-mono text-xs font-bold">
                      <Users className="w-4 h-4" />
                      <span>
                        {activeSlotProgress.scannedCount} / {activeSlotProgress.totalMembers} Scanned
                      </span>
                    </span>
                  )}
                </div>

                {/* Progress bar */}
                <div className="w-full h-2.5 rounded-full bg-[#081024] overflow-hidden border border-[#78AAFF]/15">
                  <div
                    className={`h-full transition-all duration-300 ${
                      activeSlotProgress.isServed
                        ? 'bg-gradient-to-r from-emerald-400 to-teal-400'
                        : 'bg-gradient-to-r from-[#FF8A2A] to-[#35E0FF]'
                    }`}
                    style={{
                      width: `${
                        activeSlotProgress.totalMembers > 0
                          ? Math.round(
                              (activeSlotProgress.scannedCount / activeSlotProgress.totalMembers) * 100
                            )
                          : 0
                      }%`,
                    }}
                  />
                </div>

                {/* Member Rows */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {activeTeam.members.map((member, idx) => {
                    const memberLog = activeSlotProgress.slotLogs.find(
                      (l) => l.memberId === member.id || !l.memberId
                    );
                    const isMemberScanned = Boolean(memberLog);

                    return (
                      <div
                        key={member.id}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-2 text-xs transition-all ${
                          isMemberScanned
                            ? 'bg-emerald-500/15 border-emerald-400/50'
                            : 'bg-[#081024] border-[#78AAFF]/20'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="font-bold text-white flex items-center gap-1.5 truncate">
                            <span className="font-mono text-[10px] text-[#35E0FF]">M{idx + 1}</span>
                            <span className="truncate">{member.name}</span>
                          </div>
                          <div className="text-[10px] font-mono text-[#9DB0D0] truncate">
                            {member.usn}
                          </div>
                        </div>

                        {isMemberScanned ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold shrink-0">
                            <Check className="w-3 h-3" />
                            <span>
                              {memberLog?.scannedAt
                                ? new Date(memberLog.scannedAt).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : 'Done'}
                            </span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => processScanInput(activeTeam.id, member.id)}
                            disabled={Boolean(activeCooldown?.blocked)}
                            className={`px-2.5 py-1 rounded-lg font-bold text-[10px] shrink-0 transition-all cursor-pointer ${
                              activeCooldown?.blocked
                                ? 'bg-[#132247] text-[#9DB0D0]/50 cursor-not-allowed'
                                : 'bg-gradient-to-r from-[#FF8A2A] to-[#FF4FD8] text-white hover:brightness-110'
                            }`}
                          >
                            Scan Member
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="p-8 rounded-2xl bg-[#0C1630] border border-dashed border-[#78AAFF]/25 text-center space-y-2">
                <Users className="w-8 h-8 text-[#35E0FF] mx-auto opacity-75" />
                <div className="text-sm font-bold text-white">No Team Selected Yet</div>
                <p className="text-xs text-[#9DB0D0] max-w-md mx-auto">
                  Scan a Team or Member QR pass using the camera, or select any team from the table below to track each member scan until the section is marked <strong className="text-emerald-300">SERVED</strong>.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2-Day Meal Distribution Summary & Team Cooldown Status Matrix */}
      <div className="p-6 rounded-3xl bg-[#0C1630] border border-[#78AAFF]/20 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#78AAFF]/20">
          <div>
            <h4 className="font-display font-bold text-lg text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#35E0FF]" />
              <span>Team-Wise 2-Day Meal Sections &amp; Member Scan Monitor</span>
            </h4>
            <p className="text-xs text-[#9DB0D0] mt-0.5">
              Each meal section turns <strong className="text-emerald-300">SERVED</strong> automatically once all members in the team are scanned, then locks for <strong className="text-amber-300">3 hours</strong>.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-[#9DB0D0] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              placeholder="Search team, ID, or MEAL code..."
              className="w-full pl-9 pr-3 py-2 bg-[#081024] border border-[#78AAFF]/20 rounded-xl text-xs text-white focus:outline-none focus:border-[#35E0FF]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#78AAFF]/20 text-[10px] font-mono uppercase text-[#9DB0D0]">
                <th className="py-3 px-3">Team & Unique Code</th>
                <th className="py-3 px-3">{selectedMeal} Status ({selectedDay.split(' ')[0]} {selectedDay.split(' ')[1]})</th>
                <th className="py-3 px-3">3-Hour Lock</th>
                <th className="py-3 px-3 text-center">Day 1 (Dec 1)<br /><span className="text-[#35E0FF]">B · L · S · D</span></th>
                <th className="py-3 px-3 text-center">Day 2 (Dec 2)<br /><span className="text-[#FF4FD8]">B · L · S · D</span></th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#78AAFF]/10">
              {filteredTeams.map((team) => {
                const mealCode = getTeamMealCode(team);
                const logs = Array.isArray(team.mealLogs) ? team.mealLogs : [];
                const activeProg = getTeamMealSlotProgress(team, selectedDay, selectedMeal);
                const cooldown = evaluateMealCooldown(logs, nowTick, team, selectedDay, selectedMeal);

                const renderDaySlots = (day: MealDay) => (
                  <div className="inline-flex items-center gap-1">
                    {MEAL_TYPES.map((mType) => {
                      const prog = getTeamMealSlotProgress(team, day, mType);
                      const shortLetter = mType[0];
                      return (
                        <span
                          key={mType}
                          title={`${day} - ${mType}: ${
                            prog.isServed
                              ? `SERVED (${prog.scannedCount}/${prog.totalMembers})`
                              : prog.scannedCount > 0
                              ? `${prog.scannedCount}/${prog.totalMembers} Members Scanned`
                              : 'Pending'
                          }`}
                          className={`px-1.5 min-w-[26px] h-6 rounded-md font-mono text-[10px] font-bold flex items-center justify-center border ${
                            prog.isServed
                              ? 'bg-emerald-500/25 text-emerald-300 border-emerald-400'
                              : prog.scannedCount > 0
                              ? 'bg-amber-500/20 text-amber-300 border-amber-400/60'
                              : 'bg-[#081024] text-[#9DB0D0]/50 border-[#78AAFF]/15'
                          }`}
                        >
                          {prog.isServed
                            ? `${shortLetter}✓`
                            : prog.scannedCount > 0
                            ? `${prog.scannedCount}/${prog.totalMembers}`
                            : shortLetter}
                        </span>
                      );
                    })}
                  </div>
                );

                return (
                  <tr
                    key={team.id}
                    onClick={() => setFocusedTeamId(team.id)}
                    className={`hover:bg-[#081024]/70 transition-colors cursor-pointer ${
                      focusedTeamId === team.id ? 'bg-[#081024]/90' : ''
                    }`}
                  >
                    <td className="py-3 px-3">
                      <div className="font-bold text-white">{team.teamName}</div>
                      <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                        <span className="font-mono text-[11px] text-[#35E0FF]">{team.id}</span>
                        <span className="text-[#9DB0D0]">·</span>
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#081024] border border-[#FF8A2A]/30 text-[#FF8A2A]">
                          {mealCode}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      {activeProg.isServed ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-400 text-emerald-300 font-mono font-black text-[10px] uppercase">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>SERVED ({activeProg.scannedCount}/{activeProg.totalMembers})</span>
                        </span>
                      ) : activeProg.scannedCount > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-400/50 text-amber-300 font-mono font-bold text-[10px]">
                          <Users className="w-3.5 h-3.5" />
                          <span>{activeProg.scannedCount}/{activeProg.totalMembers} Scanned</span>
                        </span>
                      ) : (
                        <span className="text-[11px] font-mono text-[#9DB0D0]">
                          0/{activeProg.totalMembers} Pending
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      {cooldown.blocked ? (
                        <div className="inline-flex flex-col gap-0.5 px-2.5 py-1 rounded-xl bg-rose-500/15 border border-rose-400/40">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-300 font-mono">
                            <Lock className="w-3 h-3" />
                            <span>Wait {formatCooldownDuration(cooldown.remainingMs)}</span>
                          </span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-xl bg-emerald-500/15 border border-emerald-400/40 text-emerald-300 font-semibold text-[10px]">
                          <Unlock className="w-3 h-3" />
                          <span>Open</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-center">{renderDaySlots('Day 1 (Dec 1)')}</td>
                    <td className="py-3 px-3 text-center">{renderDaySlots('Day 2 (Dec 2)')}</td>

                    <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                      {activeProg.isServed ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-300 border border-emerald-400/40 font-mono text-[10px] font-bold">
                          SERVED
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => processScanInput(mealCode)}
                          disabled={cooldown.blocked}
                          className={`px-3 py-1.5 rounded-xl font-bold text-[11px] transition-all cursor-pointer ${
                            cooldown.blocked
                              ? 'bg-[#081024] text-[#9DB0D0]/50 border border-[#78AAFF]/10 cursor-not-allowed'
                              : 'bg-gradient-to-r from-[#FF8A2A] to-[#FF4FD8] text-white hover:brightness-110'
                          }`}
                        >
                          {cooldown.blocked
                            ? 'Locked (3h)'
                            : `Scan Member (${activeProg.scannedCount + 1}/${activeProg.totalMembers})`}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}

              {filteredTeams.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#9DB0D0]">
                    No registered teams match your search filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Recent Scans Feed */}
        {recentMealFeed.length > 0 && (
          <div className="pt-4 border-t border-[#78AAFF]/15">
            <h5 className="text-xs font-mono uppercase tracking-wider text-[#9DB0D0] mb-3">
              Recent Member &amp; Team Food Counter Activity
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {recentMealFeed.slice(0, 6).map(({ team, log, mealCode }) => {
                const prog = getTeamMealSlotProgress(team, log.day, log.mealType);
                return (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl bg-[#081024] border border-[#78AAFF]/15 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-white truncate">
                        {team.teamName}{' '}
                        {prog.isServed && (
                          <span className="ml-1 text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                            SERVED
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] font-mono text-[#35E0FF] truncate">
                        {log.day} · {log.mealType}
                        {log.memberName ? ` · ${log.memberName}` : ''}
                      </div>
                      <div className="text-[10px] font-mono text-[#9DB0D0]">{mealCode}</div>
                    </div>
                    <div className="text-right shrink-0 text-[10px] font-mono text-emerald-300">
                      {new Date(log.scannedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
