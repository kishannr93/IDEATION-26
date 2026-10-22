import React, { useEffect, useRef } from 'react';
import { useHackathon } from '../context/HackathonContext';
import { Award, Zap, Compass, Check, Shield, Building2 } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import hackathonStageImg from '../assets/images/ideation_hackathon_stage_1791994393908.jpg';

gsap.registerPlugin(ScrollTrigger);

export const AboutSection: React.FC = () => {
  const { eventConfig } = useHackathon();
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const imageCardRef = useRef<HTMLDivElement>(null);
  const narrativeRef = useRef<HTMLDivElement>(null);
  const statsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Respect prefers-reduced-motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const ctx = gsap.context(() => {
      // 1. Header Fade-Up
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

      // 2. 2-Column Split: Image Card and Narrative
      if (imageCardRef.current && narrativeRef.current) {
        gsap.from(imageCardRef.current, {
          scrollTrigger: {
            trigger: imageCardRef.current,
            start: 'top 80%',
            toggleActions: 'play none none none',
          },
          opacity: 0,
          x: -40,
          scale: 0.97,
          duration: 0.9,
          ease: 'power3.out',
          clearProps: 'opacity,transform',
        });

        const narrativeChildren = narrativeRef.current.children;
        gsap.from(narrativeChildren, {
          scrollTrigger: {
            trigger: narrativeRef.current,
            start: 'top 80%',
            toggleActions: 'play none none none',
          },
          opacity: 0,
          x: 40,
          duration: 0.85,
          stagger: 0.2,
          ease: 'power3.out',
          clearProps: 'opacity,transform',
        });
      }

      // 3. Staggered Stat Counter Cards
      if (statsContainerRef.current) {
        const statCards = statsContainerRef.current.children;
        gsap.from(statCards, {
          scrollTrigger: {
            trigger: statsContainerRef.current,
            start: 'top 88%',
            toggleActions: 'play none none none',
          },
          opacity: 0,
          y: 30,
          scale: 0.94,
          duration: 0.75,
          stagger: 0.12,
          ease: 'back.out(1.4)',
          clearProps: 'opacity,transform',
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section 
      ref={sectionRef} 
      id="about" 
      className="py-20 px-4 sm:px-6 lg:px-8 border-t border-[#78AAFF]/15 bg-[#050B1A] relative"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div ref={headerRef} className="text-center max-w-3xl mx-auto mb-16 will-change-transform">
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#35E0FF] mb-2">
            <Building2 className="w-3.5 h-3.5" />
            <span>Legacy of Engineering Excellence</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold font-display text-white tracking-tight">
            About <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#35E0FF] via-[#FF4FD8] to-white">IDEATION & Anveshan</span>
          </h2>
          <p className="text-base text-[#9DB0D0] mt-4">
            Brought to you by <strong>Anveshan Club</strong> of Bapuji Institute of Engineering and Technology (BIET), Davangere. Run by Bapuji Educational Association (Regd.) — an autonomous institution affiliated with Visvesvaraya Technological University (VTU), Belagavi.
          </p>
        </div>

        {/* 2-Column Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch mb-16">
          {/* Image & Stage Atmosphere Card */}
          <div 
            ref={imageCardRef} 
            className="lg:col-span-6 relative rounded-2xl overflow-hidden border border-[#35E0FF]/25 shadow-[0_0_30px_rgba(53,224,255,0.15)] group min-h-[360px] will-change-transform"
          >
            <img 
              src={hackathonStageImg}
              alt="Collegiate Hackathon Atmosphere at BIET" 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050B1A] via-[#050B1A]/40 to-transparent" />
            
            <div className="absolute bottom-6 left-6 right-6">
              <span className="text-xs font-mono text-[#FF8A2A] uppercase font-semibold">24 Hours Non-Stop</span>
              <h3 className="text-xl font-bold font-display text-white mt-1">High-Intensity Prototyping Crucible</h3>
              <p className="text-xs text-[#9DB0D0] mt-2">
                Uninterrupted gigabit network, hardware testing stations, expert mentors, and midnight fuel to translate ideas into functional reality.
              </p>
            </div>
          </div>

          {/* Narrative & Pillars */}
          <div ref={narrativeRef} className="lg:col-span-6 flex flex-col justify-between space-y-6 will-change-transform">
            <div className="p-6 rounded-2xl bg-[#0C1630] border border-[#78AAFF]/20 space-y-4">
              <h3 className="text-lg font-bold font-display text-white flex items-center gap-2">
                <Compass className="w-5 h-5 text-[#35E0FF]" />
                <span>What is IDEATION?</span>
              </h3>
              <p className="text-sm text-[#9DB0D0] leading-relaxed">
                IDEATION is not a passive coding competition—it is a relentless 24-hour sprint engineered to bridge academic rigor with real-world deployment. From rural agricultural mechanics to high-frequency IoT telemetry and medical diagnostics, teams tackle authentic problems designed alongside industry advisors.
              </p>
              <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                <div className="flex items-center gap-2 text-[#F2F6FF]">
                  <Check className="w-4 h-4 text-[#35E0FF] shrink-0" />
                  <span>Real Hardware Testing Bays</span>
                </div>
                <div className="flex items-center gap-2 text-[#F2F6FF]">
                  <Check className="w-4 h-4 text-[#35E0FF] shrink-0" />
                  <span>Jury of Industry Leads</span>
                </div>
                <div className="flex items-center gap-2 text-[#F2F6FF]">
                  <Check className="w-4 h-4 text-[#35E0FF] shrink-0" />
                  <span>Full-Spectrum Mentoring</span>
                </div>
                <div className="flex items-center gap-2 text-[#F2F6FF]">
                  <Check className="w-4 h-4 text-[#35E0FF] shrink-0" />
                  <span>Incubation Direct Pathway</span>
                </div>
              </div>
            </div>

            {/* Who can participate */}
            <div className="p-6 rounded-2xl bg-[#0C1630] border border-[#78AAFF]/20">
              <h3 className="text-lg font-bold font-display text-white flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-[#FF8A2A]" />
                <span>Eligibility & Diversity</span>
              </h3>
              <p className="text-sm text-[#9DB0D0] leading-relaxed">
                Undergraduate and postgraduate students enrolled in <strong>B.E / B.Tech, M.Tech, and MCA</strong> from any accredited university. Cross-college and multi-disciplinary teams (developers, circuit designers, data engineers) are highly encouraged.
              </p>
            </div>
          </div>
        </div>

        {/* Quantified Stat Counters Bar */}
        <div 
          ref={statsContainerRef} 
          className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 rounded-2xl bg-[#081024] border border-[#35E0FF]/25 shadow-[0_10px_35px_rgba(0,0,0,0.6)] will-change-transform"
        >
          <div className="text-center p-3">
            <div className="text-3xl sm:text-4xl font-extrabold font-mono text-[#35E0FF] tabular-nums">
              ₹1,00,000
            </div>
            <div className="text-xs font-tech uppercase tracking-wider text-[#9DB0D0] mt-1 font-semibold">
              Guaranteed Cash Pool
            </div>
          </div>

          <div className="text-center p-3 border-l border-[#78AAFF]/15">
            <div className="text-3xl sm:text-4xl font-extrabold font-mono text-white tabular-nums">
              24<span className="text-[#FF8A2A]">h</span>
            </div>
            <div className="text-xs font-tech uppercase tracking-wider text-[#9DB0D0] mt-1 font-semibold">
              Continuous Sprint
            </div>
          </div>

          <div className="text-center p-3 border-l border-[#78AAFF]/15">
            <div className="text-3xl sm:text-4xl font-extrabold font-mono text-[#FF4FD8] tabular-nums">
              6
            </div>
            <div className="text-xs font-tech uppercase tracking-wider text-[#9DB0D0] mt-1 font-semibold">
              Specialized Tracks
            </div>
          </div>

          <div className="text-center p-3 border-l border-[#78AAFF]/15">
            <div className="text-3xl sm:text-4xl font-extrabold font-mono text-amber-300 tabular-nums">
              120
            </div>
            <div className="text-xs font-tech uppercase tracking-wider text-[#9DB0D0] mt-1 font-semibold">
              Max Team Capacity
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
