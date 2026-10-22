import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';
import QRCode from 'qrcode';
import { RegisteredTeam } from '../types';
import {
  Camera,
  CameraOff,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Printer,
  RotateCw,
  Search,
  Sparkles,
  ShieldCheck,
  Users,
  Award,
  Clock,
  X,
} from 'lucide-react';
import bulbImg from '../assets/images/ideation_logo.jpg';

interface AdminQRScannerProps {
  registeredTeams: RegisteredTeam[];
  onVerifyAndCheckIn: (teamId: string) => { success: boolean; team?: RegisteredTeam; message: string };
  onAdminPassDetected?: (adminEmail: string, passkey: string) => void;
  onClose?: () => void;
  isStandaloneDeskMode?: boolean;
}

export const AdminQRScanner: React.FC<AdminQRScannerProps> = ({
  registeredTeams,
  onVerifyAndCheckIn,
  onAdminPassDetected,
  onClose,
  isStandaloneDeskMode = false,
}) => {
  // Scanner state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualQuery, setManualQuery] = useState('');

  // Scanned verification result
  const [scannedTeam, setScannedTeam] = useState<RegisteredTeam | null>(null);
  const [scanMessage, setScanMessage] = useState<{ text: string; success: boolean } | null>(null);
  const [verifiedTimestamp, setVerifiedTimestamp] = useState<string>('');
  const [scanFlash, setScanFlash] = useState<'success' | 'failure' | null>(null);

  // Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const passQrCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Browser notification audio: Harmonious Success Chime via Web Audio API
  const playSuccessBeep = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
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

      // Crisp ascending triad: C5 (523.25) -> E5 (659.25) -> A5 (880)
      playTone(523.25, 0, 0.18, 0.22);
      playTone(659.25, 0.08, 0.18, 0.25);
      playTone(880.00, 0.16, 0.28, 0.3);
    } catch {
      // Audio not permitted or device muted
    }
  };

  // Browser notification audio: Low Double Warning Buzz for scan failure
  const playFailureBuzz = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
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

      // Double descending low buzz: 220Hz (A3) -> 146Hz (D3)
      playTone(220, 0, 0.12);
      playTone(146.83, 0.14, 0.22);
    } catch {
      // Audio not permitted
    }
  };

  // Decode QR payload string to extract Team ID or Admin Token
  const processDecodedString = (content: string) => {
    const raw = content.trim();
    if (!raw) return;

    // Check if it's an Admin Pass QR code (e.g. admin:ktarunkumar1832@gmail.com:183220)
    if (raw.startsWith('admin:') && onAdminPassDetected) {
      const parts = raw.split(':');
      if (parts.length >= 3) {
        const email = parts[1];
        const pass = parts[2];
        playSuccessBeep();
        onAdminPassDetected(email, pass);
        return;
      }
    }

    let teamIdToSearch = '';

    // Check JSON payload
    if (raw.startsWith('{') && raw.endsWith('}')) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed.id) teamIdToSearch = parsed.id;
        else if (parsed.teamId) teamIdToSearch = parsed.teamId;
      } catch {
        // Not valid JSON, continue with regex
      }
    }

    // Check URL or raw string
    if (!teamIdToSearch) {
      const match = raw.match(/IDN-\d{4}/i);
      if (match) {
        teamIdToSearch = match[0].toUpperCase();
      } else {
        teamIdToSearch = raw.toUpperCase();
      }
    }

    // Execute verification and desk check-in
    const result = onVerifyAndCheckIn(teamIdToSearch);
    if (result.success && result.team) {
      playSuccessBeep();
      setScanFlash('success');
      setTimeout(() => setScanFlash(null), 1200);
      setScannedTeam(result.team);
      setScanMessage({ text: result.message, success: true });
      setVerifiedTimestamp(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } else {
      playFailureBuzz();
      setScanFlash('failure');
      setTimeout(() => setScanFlash(null), 1200);
      setScanMessage({ text: result.message, success: false });
    }
  };

  // Process live camera feed frame by frame
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
        processDecodedString(code.data);
      }
    }

    animFrameIdRef.current = requestAnimationFrame(scanVideoFrame);
  };

  // Start camera stream
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
      const msg = err instanceof Error ? err.message : 'Unable to activate camera.';
      setCameraError(msg);
      setIsCameraActive(false);
    }
  };

  // Stop camera stream
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

  // Switch between front and back camera
  const toggleCameraFacing = () => {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(nextFacing);
    if (isCameraActive) {
      startCamera(nextFacing);
    }
  };

  // Handle uploaded QR image file
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
            processDecodedString(code.data);
          } else {
            setScanMessage({ text: 'No clear QR code detected in this image. Please upload a clear pass screenshot.', success: false });
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Manual search submit
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualQuery.trim()) return;
    processDecodedString(manualQuery.trim());
    setManualQuery('');
  };

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Generate QR on the official pass preview
  useEffect(() => {
    if (scannedTeam && passQrCanvasRef.current) {
      QRCode.toCanvas(
        passQrCanvasRef.current,
        JSON.stringify({
          id: scannedTeam.id,
          team: scannedTeam.teamName,
          college: scannedTeam.college,
          track: scannedTeam.primaryTrack,
          status: 'VERIFIED_CHECKED_IN',
        }),
        { width: 130, margin: 1, color: { dark: '#050B1A', light: '#FFFFFF' } }
      );
    }
  }, [scannedTeam]);

  // Trigger print dialog
  const handlePrintEntryPass = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Scanner Controls */}
      <div className="p-6 rounded-3xl bg-[#081024] border border-[#35E0FF]/40 shadow-[0_0_40px_rgba(53,224,255,0.12)]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#78AAFF]/20">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-[#35E0FF]/15 text-[#35E0FF] border border-[#35E0FF]/30 font-bold flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5" />
                <span>Desk QR Scanner</span>
              </span>
              <span className="text-xs text-emerald-400 font-mono">Real-Time Verification</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black font-display text-white">
              Scan QR Code to Verify & Print Entry Pass
            </h3>
            <p className="text-xs text-[#9DB0D0] mt-0.5">
              Hold the participant pass QR before the camera or upload an image to verify registration and print the physical entry badge.
            </p>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
            {isCameraActive ? (
              <>
                <button
                  type="button"
                  onClick={toggleCameraFacing}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-[#9DB0D0] hover:text-white bg-[#0C1630] border border-[#78AAFF]/20 flex items-center gap-1.5 transition-colors"
                  title="Switch camera"
                >
                  <RotateCw className="w-3.5 h-3.5 text-[#35E0FF]" />
                  <span className="hidden sm:inline">Flip Camera</span>
                </button>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-white bg-rose-500/10 border border-rose-500/30 flex items-center gap-1.5 transition-colors"
                >
                  <CameraOff className="w-3.5 h-3.5" />
                  <span>Stop Camera</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => startCamera()}
                className="px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-cyan-500 to-blue-600 shadow-[0_0_20px_rgba(53,224,255,0.35)] hover:brightness-110 active:scale-95 transition-all flex items-center gap-2"
              >
                <Camera className="w-4 h-4" />
                <span>Start Camera Scanner</span>
              </button>
            )}

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-[#9DB0D0] hover:text-white rounded-xl bg-[#0C1630] border border-[#78AAFF]/20"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Video Viewfinder & Upload Box Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-6 items-start">
          {/* Viewfinder Column */}
          <div className="md:col-span-7 space-y-4">
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-[#050B1A] border-2 border-dashed border-[#35E0FF]/40 flex items-center justify-center">
              {/* Video Element */}
              <video
                ref={videoRef}
                className={`w-full h-full object-cover ${isCameraActive ? 'block' : 'hidden'}`}
                autoPlay
                muted
                playsInline
              />

              {/* Viewfinder Overlay when Camera is Active */}
              {isCameraActive && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div
                    className={`relative w-52 h-52 sm:w-64 sm:h-64 rounded-2xl transition-all duration-300 border-2 overflow-hidden ${
                      scanFlash === 'success'
                        ? 'border-emerald-400 shadow-[0_0_45px_rgba(52,211,153,0.7)] bg-emerald-500/10'
                        : scanFlash === 'failure'
                        ? 'border-rose-500 shadow-[0_0_45px_rgba(244,63,94,0.7)] bg-rose-500/10'
                        : 'border-[#35E0FF] shadow-[0_0_30px_rgba(53,224,255,0.4)]'
                    }`}
                  >
                    {/* Smooth Sweeping Laser Beam with Luminous Gradient Trail */}
                    <div className="absolute left-0 right-0 animate-scan-sweep pointer-events-none">
                      <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-[#35E0FF] to-transparent shadow-[0_0_16px_#35E0FF]" />
                      <div className="h-10 w-full bg-gradient-to-b from-[#35E0FF]/20 to-transparent" />
                    </div>

                    {/* Corner Targeting Guides */}
                    <div className="absolute top-0 left-0 w-5 h-5 border-t-3 border-l-3 border-[#FF8A2A] rounded-tl-lg" />
                    <div className="absolute top-0 right-0 w-5 h-5 border-t-3 border-r-3 border-[#FF8A2A] rounded-tr-lg" />
                    <div className="absolute bottom-0 left-0 w-5 h-5 border-b-3 border-l-3 border-[#FF8A2A] rounded-bl-lg" />
                    <div className="absolute bottom-0 right-0 w-5 h-5 border-b-3 border-r-3 border-[#FF8A2A] rounded-br-lg" />

                    {/* Center Targeting Crosshair */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-30">
                      <div className="w-8 h-8 border border-dashed border-[#35E0FF] rounded-full" />
                    </div>
                  </div>

                  <div className="absolute bottom-3 font-mono text-[11px] text-[#35E0FF] bg-[#050B1A]/85 px-3.5 py-1 rounded-full border border-[#35E0FF]/30 flex items-center gap-1.5 shadow-lg backdrop-blur-sm">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>Align Attendee Pass in Scanner</span>
                  </div>
                </div>
              )}

              {/* Fallback Idle State when camera is off */}
              {!isCameraActive && (
                <div className="text-center p-6 space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-[#0C1630] border border-[#78AAFF]/20 mx-auto flex items-center justify-center text-[#35E0FF]">
                    <Camera className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Camera Standby</p>
                    <p className="text-xs text-[#9DB0D0] mt-1 max-w-xs mx-auto">
                      Click <strong className="text-[#35E0FF]">Start Camera Scanner</strong> above to scan attendees via webcam or mobile phone camera.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Camera Error Alert */}
            {cameraError && (
              <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{cameraError} You can also upload a pass image or type the Team ID below.</span>
              </div>
            )}
          </div>

          {/* Alternative Scanner Inputs Column */}
          <div className="md:col-span-5 space-y-4">
            {/* File Upload Option */}
            <div className="p-5 rounded-2xl bg-[#0C1630] border border-[#78AAFF]/20 text-center space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#132247] text-[#35E0FF] mx-auto flex items-center justify-center">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-white">Upload QR Screenshot / Photo</h4>
                <p className="text-[11px] text-[#9DB0D0] mt-0.5">
                  Drag and drop a photo of the pass or browse your device.
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                id="qr-file-input"
              />
              <label
                htmlFor="qr-file-input"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-[#35E0FF] bg-[#132247] hover:bg-[#1a2d5c] border border-[#35E0FF]/30 cursor-pointer transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Select Image File</span>
              </label>
            </div>

            {/* Manual Team ID Search */}
            <div className="p-5 rounded-2xl bg-[#0C1630] border border-[#78AAFF]/20 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-[#FF8A2A]" />
                <span>Manual Verification</span>
              </h4>
              <p className="text-[11px] text-[#9DB0D0]">
                If the attendee’s phone screen is cracked or low contrast, enter their Team ID:
              </p>
              <form onSubmit={handleManualSubmit} className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. IDN-0001"
                  value={manualQuery}
                  onChange={(e) => setManualQuery(e.target.value)}
                  className="w-full px-3 py-2 bg-[#081024] border border-[#78AAFF]/20 rounded-xl text-xs text-white focus:outline-none focus:border-[#35E0FF] font-mono uppercase"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-[#FF8A2A] to-[#F5611A] shrink-0 hover:brightness-110 transition-all"
                >
                  Verify
                </button>
              </form>
            </div>

            {/* Scan Feedback Message */}
            {scanMessage && (
              <div
                className={`p-3.5 rounded-2xl text-xs font-mono flex items-start gap-2.5 ${
                  scanMessage.success
                    ? 'bg-emerald-500/15 border border-emerald-400 text-emerald-300'
                    : 'bg-rose-500/15 border border-rose-400 text-rose-300'
                }`}
              >
                {scanMessage.success ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                )}
                <div>
                  <div className="font-bold">{scanMessage.text}</div>
                  {scanMessage.success && verifiedTimestamp && (
                    <div className="text-[10px] text-emerald-400/80 mt-0.5">
                      Verified at {verifiedTimestamp} · Badge Ready
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* VERIFIED TEAM ENTRY PASS & PRINT SECTION */}
      {scannedTeam && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <h3 className="font-display font-bold text-lg text-white">
                Official Entry Pass Verified & Ready to Print
              </h3>
            </div>
            <button
              onClick={handlePrintEntryPass}
              className="px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-[#35E0FF] to-[#3A7BFF] shadow-[0_0_20px_rgba(53,224,255,0.4)] hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Official Entry Pass</span>
            </button>
          </div>

          {/* PRINTABLE PASS CARD (Optimized for both screen display and paper print) */}
          <div
            id="printable-pass"
            className="printable-entry-pass p-6 sm:p-8 rounded-3xl bg-[#081024] border-2 border-emerald-400/60 shadow-[0_0_50px_rgba(52,211,153,0.15)] relative overflow-hidden"
          >
            {/* Watermark Crest */}
            <div className="absolute right-4 bottom-4 opacity-5 pointer-events-none w-64 h-64">
              <img src={bulbImg} alt="" className="w-full h-full object-contain" />
            </div>

            {/* Official Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[#78AAFF]/20">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#0C1630] border border-[#35E0FF]/40 p-1 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(53,224,255,0.3)]">
                  <img src={bulbImg} alt="IDEATION Logo" className="w-full h-full object-contain" />
                </div>
                <div>
                  <div className="text-[10px] font-mono tracking-widest text-[#35E0FF] uppercase font-bold">
                    BIET Davangere · Anveshan Club
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black font-display text-white">
                    IDEATION 2026 · Official Entry Pass
                  </h2>
                  <p className="text-xs text-[#9DB0D0]">
                    24-Hour State-Level Hackathon · 18–19 November 2026
                  </p>
                </div>
              </div>

              {/* Admitted Stamp */}
              <div className="text-right sm:text-right">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-400 font-mono text-xs font-bold uppercase tracking-wider">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>VERIFIED & ADMITTED</span>
                </div>
                <div className="text-[11px] font-mono text-[#9DB0D0] mt-1">
                  Team ID: <span className="font-bold text-white">{scannedTeam.id}</span>
                </div>
              </div>
            </div>

            {/* Team Main Info & Pass QR */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 my-6 items-center">
              <div className="md:col-span-8 space-y-4">
                <div>
                  <span className="text-[11px] font-mono text-[#FF8A2A] uppercase tracking-wider font-bold">
                    Registered Team
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-black font-display text-white">
                    {scannedTeam.teamName}
                  </h3>
                  <div className="text-xs sm:text-sm text-[#9DB0D0] mt-0.5">{scannedTeam.college}</div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-[#0C1630] border border-[#78AAFF]/15">
                    <span className="text-[10px] text-[#9DB0D0] block">Primary Track</span>
                    <span className="font-bold text-white text-xs">{scannedTeam.primaryTrack}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#0C1630] border border-[#78AAFF]/15">
                    <span className="text-[10px] text-[#9DB0D0] block">Course & Dept</span>
                    <span className="font-bold text-white text-xs">{scannedTeam.course} · {scannedTeam.department}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#0C1630] border border-[#78AAFF]/15 col-span-2 sm:col-span-1">
                    <span className="text-[10px] text-[#9DB0D0] block">Reporting Schedule</span>
                    <span className="font-mono text-white text-xs">18 Nov, 08:00 AM</span>
                  </div>
                </div>
              </div>

              {/* Pass QR Box */}
              <div className="md:col-span-4 flex flex-col items-center justify-center p-4 rounded-2xl bg-[#0C1630] border border-[#78AAFF]/20 text-center">
                <div className="p-2.5 bg-white rounded-xl shadow-lg inline-block">
                  <canvas ref={passQrCanvasRef} className="w-32 h-32" />
                </div>
                <div className="font-mono text-xs text-[#35E0FF] font-bold mt-2">
                  {scannedTeam.id}
                </div>
                <div className="text-[10px] text-[#9DB0D0] mt-0.5">
                  Registration Desk Kit Admitted
                </div>
              </div>
            </div>

            {/* Team Members Roster */}
            <div className="pt-4 border-t border-[#78AAFF]/20 space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-[#35E0FF]" />
                <span>Admitted Team Members ({scannedTeam.members.length})</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {scannedTeam.members.map((member) => (
                  <div
                    key={member.id}
                    className="p-3 rounded-xl bg-[#0C1630] border border-[#78AAFF]/15 text-xs space-y-1"
                  >
                    <div className="font-bold text-white flex items-center justify-between">
                      <span className="truncate">{member.name}</span>
                      {member.isLeader && (
                        <span className="text-[9px] font-mono text-[#FF8A2A] bg-[#FF8A2A]/20 px-1 py-0.2 rounded shrink-0">
                          Leader
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] font-mono text-[#9DB0D0]">USN: {member.usn}</div>
                    <div className="text-[10px] text-[#9DB0D0] flex flex-col gap-0.5 pt-1 border-t border-[#78AAFF]/10">
                      <span className="truncate">Email: <strong className="text-white">{member.email}</strong></span>
                      <span>Phone: <strong className="text-white">{member.phone}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Verification Signatures for Paper Copy */}
            <div className="mt-6 pt-4 border-t border-[#78AAFF]/20 grid grid-cols-2 sm:grid-cols-3 gap-4 text-[11px] text-[#9DB0D0]">
              <div>
                <span className="block text-[10px] uppercase font-mono text-[#78AAFF]">Check-in Status</span>
                <span className="font-bold text-emerald-400">Desk Verified · Meals & Lab Allotted</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase font-mono text-[#78AAFF]">Verification Authority</span>
                <span className="font-semibold text-white">Anveshan Club, BIET Davangere</span>
              </div>
              <div className="col-span-2 sm:col-span-1 sm:text-right">
                <span className="block text-[10px] uppercase font-mono text-[#78AAFF]">Desk Volunteer Sign</span>
                <span className="font-mono text-white underline decoration-dotted">Verified Online</span>
              </div>
            </div>

            {/* Print Action Bar */}
            <div className="mt-6 pt-4 border-t border-[#78AAFF]/20 flex flex-wrap items-center justify-between gap-3 no-print">
              <span className="text-xs text-[#9DB0D0]">
                Click below to print this physical badge or press <kbd className="px-1.5 py-0.5 rounded bg-[#0C1630] border border-[#78AAFF]/30 font-mono text-[10px] text-white">Ctrl+P</kbd>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setScannedTeam(null);
                    setScanMessage(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#9DB0D0] hover:text-white bg-[#0C1630] border border-[#78AAFF]/20 transition-colors"
                >
                  Scan Next Attendee
                </button>
                <button
                  type="button"
                  onClick={handlePrintEntryPass}
                  className="px-6 py-2 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-emerald-500 to-teal-600 shadow-[0_0_20px_rgba(52,211,153,0.3)] hover:brightness-110 active:scale-95 transition-all flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Entry Pass</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
