import React, { useState, useEffect } from 'react';
import { useHackathon } from '../context/HackathonContext';
import { Calendar, MapPin, Users, Trophy, IndianRupee, ArrowRight, QrCode, Sparkles, Clock, CheckCircle, Download } from 'lucide-react';
import heroBulbImg from '../assets/images/ideation_logo.jpg';
import { generatePptTemplate } from '../lib/pptTemplate';

interface HeroSectionProps {
  onOpenQR: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onOpenQR }) => {
  const { eventConfig, setShowRegisterModal, registeredTeams, navigateTo } = useHackathon();
  const [downloadingPpt, setDownloadingPpt] = useState(false);

  // Dynamic Countdown timer tracking structured metadata startDate (December 1, 2026)
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const [targetDateLabel, setTargetDateLabel] = useState<string>('December 1, 2026');
  const [isHackathonLive, setIsHackathonLive] = useState<boolean>(false);

  // Helper to extract the event startDate directly from the structured metadata (<script type="application/ld+json">)
  const getEventStartDateFromMetadata = (): { targetTime: number; formattedDate: string } => {
    let dateStr: string | null = null;
    if (typeof document !== 'undefined') {
      try {
        const metadataScript =
          document.getElementById('structured-event-metadata') ||
          document.querySelector('script[type="application/ld+json"]');
        if (metadataScript && metadataScript.textContent) {
          const parsed = JSON.parse(metadataScript.textContent);
          if (parsed && typeof parsed === 'object') {
            if (parsed.startDate) {
              dateStr = parsed.startDate;
            } else if (Array.isArray(parsed['@graph'])) {
              const eventNode = parsed['@graph'].find((item: any) => item.startDate);
              if (eventNode?.startDate) dateStr = eventNode.startDate;
            }
          }
        }
      } catch (err) {
        console.warn('Could not parse structured metadata for countdown start date:', err);
      }
    }

    if (!dateStr && eventConfig?.dateStart) {
      dateStr = eventConfig.dateStart;
    }
    if (!dateStr) {
      dateStr = '2026-12-01T09:00:00+05:30';
    }

    const parsedDate = new Date(dateStr);
    const validDate = isNaN(parsedDate.getTime()) ? new Date('2026-12-01T09:00:00+05:30') : parsedDate;
    const formatted = validDate.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    return {
      targetTime: validDate.getTime(),
      formattedDate: formatted || 'December 1, 2026',
    };
  };

  const handleDownloadTemplate = async () => {
    if (eventConfig?.officialPptLink) {
      window.open(eventConfig.officialPptLink, '_blank', 'noopener,noreferrer');
      return;
    }
    try {
      setDownloadingPpt(true);
      await generatePptTemplate({
        teamName: 'Official IDEATION Team',
        teamId: 'IDN-SAMPLE',
        leaderName: 'Team Leader',
        track: 'Artificial Intelligence & Smart Systems',
        college: 'Bapuji Institute of Engineering and Technology (BIET)',
        problemTitle: 'Official 8-Slide Pitch Deck Presentation Template',
        problemSummary: 'Official 8-slide template with Problem Statement, Proposed Solution, Technical Approach, Feasibility, Demo Plan, Architecture Canvas, and Submission Checklist.',
      });
    } catch (err) {
      console.error('Error downloading template:', err);
    } finally {
      setDownloadingPpt(false);
    }
  };

  useEffect(() => {
    const { targetTime, formattedDate } = getEventStartDateFromMetadata();
    setTargetDateLabel(formattedDate);

    const updateCountdown = () => {
      const now = new Date().getTime();
      const difference = targetTime - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000),
        });
        setIsHackathonLive(false);
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        setIsHackathonLive(true);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [eventConfig?.dateStart]);

  return (
    <section id="hero" className="relative min-h-[92vh] flex items-center justify-center overflow-hidden pt-8 pb-16 px-4 sm:px-6 lg:px-8 bg-circuit-grid">
      {/* Background ambient neon radial glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#35E0FF]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[450px] h-[450px] bg-[#FF4FD8]/10 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute top-10 right-10 w-[400px] h-[400px] bg-[#FF8A2A]/10 rounded-full blur-[130px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Column: Headline, Ribbon, Subline, Info Chips, Countdown, CTAs */}
        <div className="lg:col-span-7 flex flex-col items-start text-left z-10">
          {/* Organization Kicker */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0C1630] border border-[#35E0FF]/30 text-xs font-mono text-[#35E0FF] mb-5 shadow-[0_0_15px_rgba(53,224,255,0.15)]">
            <span className="w-2 h-2 rounded-full bg-[#35E0FF] animate-ping" />
            <span className="tracking-wide uppercase font-semibold">Anveshan Club Presents · BIET Davangere</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-6xl xl:text-7xl font-black font-display tracking-tight text-white leading-none">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-[#35E0FF] to-white drop-shadow-[0_0_35px_rgba(53,224,255,0.45)]">
              IDEATION
            </span>
          </h1>

          {/* Orange Ribbon: "INNOVATE. BUILD. IMPACT." */}
          <div className="mt-4 mb-3 inline-block">
            <div className="relative inline-flex items-center gap-3 px-5 py-2 rounded-lg bg-gradient-to-r from-[#FF8A2A] via-[#F5611A] to-[#FF8A2A] text-white font-tech text-lg sm:text-2xl font-black tracking-widest uppercase shadow-[0_0_25px_rgba(255,138,42,0.5)] transform -rotate-0.5">
              <span>Innovate</span>
              <span className="text-black/40">✦</span>
              <span>Build</span>
              <span className="text-black/40">✦</span>
              <span>Impact</span>
            </div>
          </div>

          {/* Subline */}
          <p className="text-lg sm:text-xl font-medium text-[#9DB0D0] mt-2 mb-6 max-w-2xl">
            {eventConfig.subline} A national-level 24-hour offline hackathon challenging visionary engineers to architect high-stakes solutions.
          </p>

          {/* Event Key Info Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full max-w-2xl mb-8">
            <div className="p-3 rounded-xl bg-[#0C1630]/90 border border-[#78AAFF]/20 backdrop-blur-md">
              <div className="flex items-center gap-1.5 text-xs text-[#9DB0D0] font-tech uppercase">
                <Calendar className="w-3.5 h-3.5 text-[#35E0FF]" />
                <span>Date</span>
              </div>
              <div className="font-semibold text-white text-sm mt-1">{eventConfig.dates}</div>
            </div>

            <div className="p-3 rounded-xl bg-[#0C1630]/90 border border-[#78AAFF]/20 backdrop-blur-md">
              <div className="flex items-center gap-1.5 text-xs text-[#9DB0D0] font-tech uppercase">
                <MapPin className="w-3.5 h-3.5 text-[#35E0FF]" />
                <span>Venue</span>
              </div>
              <div className="font-semibold text-white text-sm mt-1">BIET Davangere</div>
            </div>

            <div className="p-3 rounded-xl bg-[#0C1630]/90 border border-[#78AAFF]/20 backdrop-blur-md">
              <div className="flex items-center gap-1.5 text-xs text-[#9DB0D0] font-tech uppercase">
                <Users className="w-3.5 h-3.5 text-[#35E0FF]" />
                <span>Team Size</span>
              </div>
              <div className="font-semibold text-white text-sm mt-1">3 to 4 Members</div>
            </div>

            <div className="p-3 rounded-xl bg-[#0C1630]/90 border border-[#FFC83D]/30 backdrop-blur-md">
              <div className="flex items-center gap-1.5 text-xs text-amber-300 font-tech uppercase">
                <Trophy className="w-3.5 h-3.5 text-[#FFC83D]" />
                <span>Prize Pool</span>
              </div>
              <div className="font-bold text-[#FFC83D] text-sm mt-1">₹1,00,000</div>
            </div>
          </div>

          {/* 24-Hour Countdown & Ticker */}
          <div className="w-full max-w-2xl p-4 sm:p-5 rounded-2xl bg-[#081024]/90 border border-[#35E0FF]/30 mb-8 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#78AAFF]/15">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#35E0FF]" />
                <span className="font-tech text-xs tracking-wider uppercase font-bold text-[#35E0FF]">
                  Countdown to Hackathon Launch · {targetDateLabel}
                </span>
              </div>
              {/* Looping 24:00:00 Ticker */}
              <div className={`flex items-center gap-2 font-mono text-xs px-2 py-0.5 rounded border ${
                isHackathonLive 
                  ? 'text-amber-300 bg-amber-950/40 border-amber-500/30' 
                  : 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                  isHackathonLive ? 'bg-amber-400' : 'bg-emerald-400'
                }`} />
                <span>{isHackathonLive ? 'HACKATHON IS LIVE!' : 'FORMAT: 24:00:00 SPRINT'}</span>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 sm:gap-4 text-center">
              <div className="p-2 sm:p-3 rounded-xl bg-[#0C1630] border border-[#78AAFF]/20">
                <div className="font-mono text-2xl sm:text-3xl font-bold text-white tabular-nums">
                  {String(timeLeft.days).padStart(2, '0')}
                </div>
                <div className="text-[11px] font-tech uppercase text-[#9DB0D0] mt-0.5">Days</div>
              </div>

              <div className="p-2 sm:p-3 rounded-xl bg-[#0C1630] border border-[#78AAFF]/20">
                <div className="font-mono text-2xl sm:text-3xl font-bold text-[#35E0FF] tabular-nums">
                  {String(timeLeft.hours).padStart(2, '0')}
                </div>
                <div className="text-[11px] font-tech uppercase text-[#9DB0D0] mt-0.5">Hours</div>
              </div>

              <div className="p-2 sm:p-3 rounded-xl bg-[#0C1630] border border-[#78AAFF]/20">
                <div className="font-mono text-2xl sm:text-3xl font-bold text-[#FF4FD8] tabular-nums">
                  {String(timeLeft.minutes).padStart(2, '0')}
                </div>
                <div className="text-[11px] font-tech uppercase text-[#9DB0D0] mt-0.5">Minutes</div>
              </div>

              <div className="p-2 sm:p-3 rounded-xl bg-[#0C1630] border border-[#78AAFF]/20">
                <div className="font-mono text-2xl sm:text-3xl font-bold text-[#FF8A2A] tabular-nums">
                  {String(timeLeft.seconds).padStart(2, '0')}
                </div>
                <div className="text-[11px] font-tech uppercase text-[#9DB0D0] mt-0.5">Seconds</div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={() => setShowRegisterModal(true)}
              className="px-7 py-3.5 rounded-xl font-bold text-base text-white bg-gradient-to-r from-[#FF8A2A] to-[#F5611A] shadow-[0_0_25px_rgba(255,138,42,0.5)] hover:shadow-[0_0_35px_rgba(255,138,42,0.7)] hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2 group"
            >
              <span>Register Team (₹{eventConfig.entryFee})</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => navigateTo('home', 'tracks')}
              className="px-6 py-3.5 rounded-xl font-semibold text-sm text-[#F2F6FF] bg-[#0C1630] hover:bg-[#132247] border border-[#35E0FF]/40 hover:border-[#35E0FF] transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>View 6 Tracks</span>
            </button>

            <button
              onClick={handleDownloadTemplate}
              disabled={downloadingPpt}
              className="px-4 py-3.5 rounded-xl text-xs font-semibold text-[#35E0FF] bg-[#35E0FF]/10 hover:bg-[#35E0FF]/20 border border-[#35E0FF]/40 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Download official 8-slide PowerPoint presentation template"
            >
              <Download className={`w-4 h-4 ${downloadingPpt ? 'animate-bounce' : ''}`} />
              <span>{downloadingPpt ? 'Generating...' : 'PPT Template (.pptx)'}</span>
            </button>

            <button
              onClick={onOpenQR}
              className="px-4 py-3.5 rounded-xl text-xs font-semibold text-[#9DB0D0] hover:text-[#35E0FF] bg-[#0C1630]/60 hover:bg-[#0C1630] border border-[#78AAFF]/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <QrCode className="w-4 h-4 text-[#35E0FF]" />
              <span>Poster QR</span>
            </button>
          </div>

          {/* Eligibility Note */}
          <div className="mt-4 flex items-center gap-2 text-xs text-[#9DB0D0]">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Eligible: <strong>B.E / B.Tech, M.Tech, and MCA students</strong> from all recognized institutions.</span>
          </div>
        </div>

        {/* Right Column: Hero Glowing Lightbulb Emblem */}
        <div className="lg:col-span-5 flex items-center justify-center relative">
          <div className="relative w-full max-w-[420px] aspect-square flex items-center justify-center group">
            {/* Outer Circuit Rings */}
            <div className="absolute inset-0 rounded-full border border-[#35E0FF]/25 border-dashed animate-[spin_40s_linear_infinite]" />
            <div className="absolute inset-4 rounded-full border border-[#FF4FD8]/20 animate-[spin_25s_linear_infinite_reverse]" />
            <div className="absolute inset-10 rounded-full bg-gradient-to-tr from-[#35E0FF]/15 via-transparent to-[#FF4FD8]/15 blur-2xl" />

            {/* Glowing Bulb Asset Container */}
            <div className="relative z-10 w-full h-full rounded-3xl overflow-hidden p-3 bg-gradient-to-b from-[#0C1630]/90 to-[#050B1A]/95 border border-[#35E0FF]/40 shadow-[0_0_55px_rgba(53,224,255,0.35)] animate-float backdrop-blur-sm flex items-center justify-center">
              <img 
                src={heroBulbImg}
                alt="IDEATION 2026 Lightbulb Brain Emblem"
                className="w-full h-full object-contain rounded-2xl filter saturate-[1.12] contrast-[1.05] drop-shadow-[0_0_20px_rgba(53,224,255,0.45)]"
                referrerPolicy="no-referrer"
              />

              {/* Floating Badge Over Bulb */}
              <div className="absolute bottom-5 left-5 right-5 p-3 rounded-xl bg-[#081024]/85 border border-[#35E0FF]/30 backdrop-blur-md flex items-center justify-between text-xs">
                <div>
                  <div className="text-[10px] font-mono text-[#35E0FF] uppercase">Anveshan BIET</div>
                  <div className="font-semibold text-white">From Idea to Impact</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-mono text-amber-300">Prize Pool</div>
                  <div className="font-bold text-[#FFC83D]">₹1,00,000</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
