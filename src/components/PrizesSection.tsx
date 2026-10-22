import React, { useEffect, useRef } from 'react';
import { useHackathon } from '../context/HackathonContext';
import { Trophy, Medal, Award, Star, Gift, Sparkles, ShieldCheck } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import trophyImg from '../assets/images/ideation_trophy_showcase_1791994392466.jpg';

gsap.registerPlugin(ScrollTrigger);

export const PrizesSection: React.FC = () => {
  const { prizes, eventConfig } = useHackathon();

  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const featuredBannerRef = useRef<HTMLDivElement>(null);
  const prizeCardsContainerRef = useRef<HTMLDivElement>(null);
  const perksContainerRef = useRef<HTMLDivElement>(null);

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

      // 2. Featured Trophy Hero Banner
      if (featuredBannerRef.current) {
        gsap.from(featuredBannerRef.current, {
          scrollTrigger: {
            trigger: featuredBannerRef.current,
            start: 'top 80%',
            toggleActions: 'play none none none',
          },
          opacity: 0,
          y: 45,
          scale: 0.96,
          duration: 0.9,
          ease: 'power3.out',
          clearProps: 'opacity,transform',
        });
      }

      // 3. Staggered Prize Cards
      if (prizeCardsContainerRef.current) {
        const cards = prizeCardsContainerRef.current.children;
        gsap.from(cards, {
          scrollTrigger: {
            trigger: prizeCardsContainerRef.current,
            start: 'top 80%',
            toggleActions: 'play none none none',
          },
          opacity: 0,
          y: 45,
          scale: 0.96,
          duration: 0.75,
          stagger: 0.1,
          ease: 'power3.out',
          clearProps: 'opacity,transform',
        });
      }

      // 4. Staggered Perks & Distinctions
      if (perksContainerRef.current) {
        const perks = perksContainerRef.current.children;
        gsap.from(perks, {
          scrollTrigger: {
            trigger: perksContainerRef.current,
            start: 'top 88%',
            toggleActions: 'play none none none',
          },
          opacity: 0,
          y: 30,
          duration: 0.7,
          stagger: 0.15,
          ease: 'power2.out',
          clearProps: 'opacity,transform',
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, [prizes]);

  const renderPrizeIcon = (type: string, highlight?: boolean) => {
    switch (type) {
      case 'trophy':
        return <Trophy className={`w-8 h-8 ${highlight ? 'text-[#FFC83D]' : 'text-[#35E0FF]'}`} />;
      case 'medal':
        return <Medal className="w-8 h-8 text-[#35E0FF]" />;
      case 'award':
        return <Award className="w-8 h-8 text-[#FF4FD8]" />;
      case 'star':
      default:
        return <Star className="w-8 h-8 text-[#FF8A2A]" />;
    }
  };

  return (
    <section 
      ref={sectionRef} 
      id="prizes" 
      className="py-24 px-4 sm:px-6 lg:px-8 border-t border-[#78AAFF]/15 bg-[#050B1A] relative"
    >
      {/* Ambient background glow */}
      <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-[#FFC83D]/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div ref={headerRef} className="text-center max-w-3xl mx-auto mb-16 will-change-transform">
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-amber-300 mb-2">
            <Trophy className="w-3.5 h-3.5 text-[#FFC83D]" />
            <span>₹1 Lakh Guaranteed Prize Pool</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold font-display text-white tracking-tight">
            Prizes, Awards & <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFC83D] via-[#FF8A2A] to-white">Distinctions</span>
          </h2>
          <p className="text-base text-[#9DB0D0] mt-3">
            Recognizing excellence across software and hardware domains with total rewards exceeding ₹{eventConfig.prizePoolAmount.toLocaleString('en-IN')}, plus incubation pathways and industry trophies.
          </p>
        </div>

        {/* Featured Trophy Hero Banner */}
        <div 
          ref={featuredBannerRef} 
          className="mb-14 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#0C1630] via-[#11234D] to-[#0C1630] border border-[#FFC83D]/30 shadow-[0_0_40px_rgba(255,200,61,0.15)] grid grid-cols-1 md:grid-cols-12 gap-8 items-center will-change-transform"
        >
          <div className="md:col-span-4 flex justify-center">
            <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-2xl overflow-hidden border border-[#FFC83D]/40 shadow-[0_0_30px_rgba(255,200,61,0.3)]">
              <img 
                src={trophyImg} 
                alt="Championship Trophy Showcase"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>

          <div className="md:col-span-8 flex flex-col justify-center space-y-3">
            <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-amber-300">
              <Sparkles className="w-4 h-4 text-[#FFC83D]" />
              <span>Championship Grand Honors</span>
            </div>
            <h3 className="text-2xl sm:text-4xl font-black font-display text-white">
              ₹{(prizes.find(p => p.id === '1' || p.highlight)?.amount || 30000).toLocaleString('en-IN')} <span className="text-lg sm:text-2xl font-normal text-[#9DB0D0]">Grand Winner Award</span>
            </h3>
            <p className="text-sm text-[#9DB0D0] max-w-xl">
              Awarded to the most visionary, technically sophisticated, and practically deployable prototype across all six domain tracks. Comes with the coveted IDEATION Rolling Cup, gold medals, and immediate fast-track investor review.
            </p>
            <div className="pt-2 flex flex-wrap gap-2 text-xs font-mono text-amber-200">
              <span className="bg-[#FFC83D]/10 px-3 py-1 rounded-full border border-[#FFC83D]/30">✦ Grand Rolling Trophy</span>
              <span className="bg-[#FFC83D]/10 px-3 py-1 rounded-full border border-[#FFC83D]/30">✦ Certificate of Distinction</span>
              <span className="bg-[#FFC83D]/10 px-3 py-1 rounded-full border border-[#FFC83D]/30">✦ Incubation Sponsorship</span>
            </div>
          </div>
        </div>

        {/* Podium and Track Prizes Grid */}
        <div 
          ref={prizeCardsContainerRef} 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 will-change-transform"
        >
          {prizes.map((prize) => (
            <div
              key={prize.id}
              className={`p-6 rounded-2xl transition-all duration-300 flex flex-col justify-between ${
                prize.highlight
                  ? 'bg-gradient-to-b from-[#11234D] to-[#0C1630] border-2 border-[#FFC83D] shadow-[0_0_25px_rgba(255,200,61,0.25)]'
                  : 'bg-[#0C1630] border border-[#78AAFF]/20 hover:border-[#35E0FF]/50'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-[#050B1A] border border-[#78AAFF]/20">
                    {renderPrizeIcon(prize.iconType, prize.highlight)}
                  </div>
                  <span className="font-mono text-xs uppercase text-[#9DB0D0] tracking-wider">
                    {prize.subtitle}
                  </span>
                </div>

                <h4 className="text-lg font-bold font-display text-white">
                  {prize.title}
                </h4>

                <div className="mt-3 text-3xl font-black font-mono text-white tabular-nums">
                  ₹{prize.amount.toLocaleString('en-IN')}
                </div>

                <p className="text-xs text-[#9DB0D0] mt-3 leading-relaxed">
                  {prize.perks}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-[#78AAFF]/15 flex items-center justify-between text-[11px] font-mono text-[#35E0FF]">
                <span>Official Citation</span>
                <span>Verified by BIET</span>
              </div>
            </div>
          ))}
        </div>

        {/* Special Category Awards and Perks */}
        <div 
          ref={perksContainerRef} 
          className="mt-12 p-6 rounded-2xl bg-[#081024] border border-[#35E0FF]/20 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center will-change-transform"
        >
          <div className="flex flex-col items-center">
            <Gift className="w-6 h-6 text-[#35E0FF] mb-2" />
            <h5 className="font-semibold text-white text-sm">Participant Welcome Kits</h5>
            <p className="text-xs text-[#9DB0D0] mt-1">Branded T-shirts, hacker badges, stickers, and offline notebook kits for every attendee.</p>
          </div>
          <div className="flex flex-col items-center sm:border-l border-[#78AAFF]/15">
            <ShieldCheck className="w-6 h-6 text-emerald-400 mb-2" />
            <h5 className="font-semibold text-white text-sm">Verified Certificates</h5>
            <p className="text-xs text-[#9DB0D0] mt-1">Digitally authenticated Certificate of Participation with verifiable QR for all qualified submissions.</p>
          </div>
          <div className="flex flex-col items-center sm:border-l border-[#78AAFF]/15">
            <Sparkles className="w-6 h-6 text-[#FF8A2A] mb-2" />
            <h5 className="font-semibold text-white text-sm">Hardware Vouchers & Swag</h5>
            <p className="text-xs text-[#9DB0D0] mt-1">Surprise gift hampers and IoT prototyping component vouchers for outstanding projects.</p>
          </div>
        </div>
      </div>
    </section>
  );
};
