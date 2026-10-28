import React, { useState, useEffect, useRef } from 'react';
import { useHackathon } from '../context/HackathonContext';
import { DomainTrack } from '../types';
import { Sprout, Building2, Bot, HeartPulse, Cpu, Lightbulb, ArrowRight, X, Wrench, CheckCircle2, ExternalLink } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const TracksSection: React.FC = () => {
  const { tracks, setSelectedTrackForRegistration, setShowRegisterModal, eventConfig } = useHackathon();
  const [activeTrack, setActiveTrack] = useState<DomainTrack | null>(null);

  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const cardsContainerRef = useRef<HTMLDivElement>(null);
  const noteRef = useRef<HTMLDivElement>(null);

  const activeTracks = tracks.filter(t => t.active);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const ctx = gsap.context(() => {
      // 1. Header Entrance
      if (headerRef.current) {
        gsap.from(headerRef.current, {
          scrollTrigger: {
            trigger: headerRef.current,
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
          opacity: 0,
          y: 40,
          duration: 0.85,
          ease: 'power3.out',
          clearProps: 'opacity,transform',
        });
      }

      // 2. Staggered Hexagon Track Cards
      if (cardsContainerRef.current) {
        const cards = cardsContainerRef.current.children;
        gsap.from(cards, {
          scrollTrigger: {
            trigger: cardsContainerRef.current,
            start: 'top 82%',
            toggleActions: 'play none none none',
          },
          opacity: 0,
          y: 50,
          scale: 0.95,
          duration: 0.8,
          stagger: 0.12,
          ease: 'power3.out',
          clearProps: 'opacity,transform',
        });
      }

      // 3. Open Innovation Note Entrance
      if (noteRef.current) {
        gsap.from(noteRef.current, {
          scrollTrigger: {
            trigger: noteRef.current,
            start: 'top 92%',
            toggleActions: 'play none none none',
          },
          opacity: 0,
          y: 25,
          duration: 0.7,
          ease: 'power2.out',
          clearProps: 'opacity,transform',
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, [tracks]);

  // Custom inline SVG / Lucide icons matching the poster requirements
  const renderTrackIcon = (iconName: string, className = "w-8 h-8") => {
    switch (iconName) {
      case 'leaf':
        return <Sprout className={className} />;
      case 'city':
        return <Building2 className={className} />;
      case 'drone':
        return <Bot className={className} />;
      case 'health':
        return <HeartPulse className={className} />;
      case 'iot':
        return <Cpu className={className} />;
      case 'lightbulb':
      default:
        return <Lightbulb className={className} />;
    }
  };

  const handleSelectTrack = (trackTitle: string) => {
    setSelectedTrackForRegistration(trackTitle);
    setActiveTrack(null);
    setShowRegisterModal(true);
  };

  return (
    <section 
      ref={sectionRef} 
      id="tracks" 
      className="py-24 px-4 sm:px-6 lg:px-8 border-t border-[#78AAFF]/15 bg-[#081024] relative"
    >
      {/* Ambient background glows */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-[#35E0FF]/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#FF4FD8]/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div ref={headerRef} className="text-center max-w-3xl mx-auto mb-16 will-change-transform">
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#35E0FF] mb-2">
            <span>Specialized Innovation Domains</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold font-display text-white tracking-tight">
            Six Focus <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#35E0FF] via-[#3A7BFF] to-[#FF4FD8]">Domain Tracks</span>
          </h2>
          <p className="text-base text-[#9DB0D0] mt-3">
            Choose your arena. Build a functional prototype addressing real challenges in agriculture, robotics, healthcare, smart cities, and frontier technology.
          </p>
        </div>

        {/* 6 Hexagonal / Glass Cards Grid */}
        <div 
          ref={cardsContainerRef} 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 will-change-transform"
        >
          {activeTracks.map((track, idx) => {
            return (
              <div
                key={track.id}
                onClick={() => setActiveTrack(track)}
                className="group relative cursor-pointer p-7 rounded-2xl bg-[#0C1630] border border-[#78AAFF]/20 hover:border-[#35E0FF] transition-all duration-300 hover:shadow-[0_0_30px_rgba(53,224,255,0.25)] hover:-translate-y-1 flex flex-col justify-between"
              >
                <div>
                  {/* Top Row: Hexagon Icon + Index */}
                  <div className="flex items-center justify-between mb-5">
                    {/* Hexagon icon badge */}
                    <div className="relative w-14 h-14 flex items-center justify-center">
                      <div className="absolute inset-0 bg-gradient-to-tr from-[#35E0FF]/20 to-[#FF4FD8]/20 clip-hexagon group-hover:scale-110 transition-transform duration-300 border border-[#35E0FF]/40" />
                      <div className="relative text-[#35E0FF] group-hover:text-white transition-colors">
                        {renderTrackIcon(track.iconName, "w-7 h-7")}
                      </div>
                    </div>

                    <span className="font-mono text-xs text-[#9DB0D0] group-hover:text-[#35E0FF] transition-colors">
                      0{idx + 1}
                    </span>
                  </div>

                  {/* Title & Short Description */}
                  <h3 className="text-xl font-bold font-display text-white group-hover:text-[#35E0FF] transition-colors">
                    {track.title}
                  </h3>
                  <p className="text-xs text-[#9DB0D0] mt-2.5 leading-relaxed line-clamp-3">
                    {track.shortDesc}
                  </p>
                </div>

                {/* Card Action footer */}
                <div className="pt-6 mt-6 border-t border-[#78AAFF]/15 flex items-center justify-between text-xs font-semibold text-[#35E0FF]">
                  <span className="group-hover:underline underline-offset-4">Explore Track Details</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Note on open innovation */}
        <div ref={noteRef} className="mt-12 text-center p-4 rounded-xl bg-[#0C1630]/70 border border-[#78AAFF]/15 max-w-2xl mx-auto text-xs text-[#9DB0D0]">
          💡 Don't see your exact domain? Select <strong>Open Innovation</strong> to build novel hardware, web applications, or clean-tech solutions that break boundaries.
        </div>
      </div>

      {/* Track Details Modal / Drawer */}
      {activeTrack && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
          onClick={() => setActiveTrack(null)}
        >
          <div 
            className="w-full max-w-2xl bg-[#081024] border border-[#35E0FF]/40 rounded-3xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto shadow-[0_0_60px_rgba(53,224,255,0.3)] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between pb-5 border-b border-[#78AAFF]/20">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-[#0C1630] border border-[#35E0FF]/40 text-[#35E0FF]">
                  {renderTrackIcon(activeTrack.iconName, "w-6 h-6")}
                </div>
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#FF4FD8]">Domain Track</span>
                  <h3 className="text-2xl font-bold font-display text-white">{activeTrack.title}</h3>
                </div>
              </div>

              <button
                onClick={() => setActiveTrack(null)}
                className="p-2 text-[#9DB0D0] hover:text-white rounded-lg hover:bg-[#132247] transition-colors"
                aria-label="Close track details"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="py-6 space-y-6">
              <div>
                <h4 className="text-xs font-mono uppercase text-[#35E0FF] tracking-wider mb-2">Scope & Vision</h4>
                <p className="text-sm text-[#F2F6FF] leading-relaxed">
                  {activeTrack.fullDesc}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-mono uppercase text-[#35E0FF] tracking-wider mb-2.5">
                  Illustrative Problem Statements
                </h4>
                <div className="space-y-2">
                  {activeTrack.sampleProblems.map((problem, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs text-[#9DB0D0] bg-[#0C1630] p-3 rounded-xl border border-[#78AAFF]/15">
                      <CheckCircle2 className="w-4 h-4 text-[#35E0FF] shrink-0 mt-0.5" />
                      <span>{problem}</span>
                    </div>
                  ))}
                </div>

                {eventConfig?.problemStatementsLink && (
                  <div className="mt-2.5">
                    <a
                      href={eventConfig.problemStatementsLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#35E0FF]/15 hover:bg-[#35E0FF]/25 text-[#35E0FF] text-xs font-semibold border border-[#35E0FF]/30 transition-all cursor-pointer"
                    >
                      <span>Open Full Detailed Problem Statements Folder</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-xs font-mono uppercase text-[#35E0FF] tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5" />
                  <span>Suggested Toolsets & Tech Stacks</span>
                </h4>
                <div className="flex flex-wrap gap-2">
                  {activeTrack.suggestedTools.map((tool, i) => (
                    <span key={i} className="px-2.5 py-1 text-xs font-mono bg-[#132247] text-[#35E0FF] rounded-lg border border-[#35E0FF]/20">
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-5 border-t border-[#78AAFF]/20 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-[#9DB0D0]">
                Pre-fill this track directly in your team application
              </span>

              <button
                onClick={() => handleSelectTrack(activeTrack.title)}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-[#FF8A2A] to-[#F5611A] shadow-[0_0_20px_rgba(255,138,42,0.4)] hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <span>Choose This Track & Register</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
