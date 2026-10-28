import React, { useState } from 'react';
import { useHackathon } from '../context/HackathonContext';
import { ShieldCheck, UserCheck, Menu, X, ArrowUpRight, Megaphone, QrCode, Download } from 'lucide-react';
import bulbImg from '../assets/images/ideation_logo.jpg';
import { generatePptTemplate } from '../lib/pptTemplate';

interface NavbarProps {
  onOpenQR: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenQR }) => {
  const { eventConfig, announcements, activeView, setActiveView, navigateTo, setShowRegisterModal, currentTeamSession } = useHackathon();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);

  const handleDownloadTemplate = async () => {
    try {
      setIsDownloadingTemplate(true);
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
      setIsDownloadingTemplate(false);
    }
  };

  const pinnedAnnouncements = announcements.filter(a => a.pinned);
  const marqueeText = pinnedAnnouncements.length > 0 
    ? pinnedAnnouncements.map(a => `${a.title} — ${a.content}`).join('   ✦   ')
    : 'Registrations Open for IDEATION 2026 ✦ 24-Hour Hackathon at BIET Davangere ✦ ₹1,00,000 Prize Pool ✦ 18 & 19 November';

  return (
    <header className="sticky top-0 z-40 w-full bg-[#050B1A]/90 backdrop-blur-md border-b border-[#35E0FF]/15">
      {/* Live announcement marquee bar */}
      <div 
        onClick={() => navigateTo('home', 'news')}
        className="bg-gradient-to-r from-[#0C1630] via-[#11234D] to-[#0C1630] py-1 px-4 border-b border-[#35E0FF]/10 text-xs text-[#9DB0D0] flex items-center overflow-hidden cursor-pointer hover:bg-[#11234D]/80 transition-colors"
        title="Click to view all live announcements & news"
      >
        <div className="flex items-center gap-2 shrink-0 font-tech text-[#35E0FF] font-semibold tracking-wider uppercase pr-3 border-r border-[#35E0FF]/20">
          <Megaphone className="w-3.5 h-3.5 text-[#FF8A2A] animate-pulse" />
          <span>Live Ticker</span>
        </div>
        <div className="overflow-hidden whitespace-nowrap w-full pl-3">
          <div className="inline-block animate-[marquee_28s_linear_infinite] hover:[animation-play-state:paused] text-xs font-mono text-[#F2F6FF]/90">
            {marqueeText}
          </div>
        </div>
      </div>

      {/* 3-Zone Top Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <div 
          onClick={() => navigateTo('home')}
          className="flex items-center gap-3 cursor-pointer group shrink-0"
        >
          <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-[#0C1630] border border-[#35E0FF]/40 group-hover:border-[#35E0FF] transition-all duration-300 shadow-[0_0_15px_rgba(53,224,255,0.3)] p-0.5 flex items-center justify-center">
            <img 
              src={bulbImg} 
              alt="IDEATION Logo" 
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="flex flex-col">
            <span className="font-display text-xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white via-[#35E0FF] to-white whitespace-nowrap">
              IDEATION
            </span>
          </div>
        </div>

        {/* Zone 2: 4-5 Clean Nav Links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#9DB0D0]">
          <a 
            href="#tracks" 
            onClick={(e) => {
              e.preventDefault();
              navigateTo('home', 'tracks');
            }}
            className="hover:text-[#35E0FF] transition-colors whitespace-nowrap shrink-0 hover:underline underline-offset-8 decoration-[#35E0FF]/40"
          >
            Tracks
          </a>
          <a 
            href="#prizes" 
            onClick={(e) => {
              e.preventDefault();
              navigateTo('home', 'prizes');
            }}
            className="hover:text-[#35E0FF] transition-colors whitespace-nowrap shrink-0 hover:underline underline-offset-8 decoration-[#35E0FF]/40"
          >
            Prizes
          </a>
          <a 
            href="#schedule" 
            onClick={(e) => {
              e.preventDefault();
              navigateTo('home', 'schedule');
            }}
            className="hover:text-[#35E0FF] transition-colors whitespace-nowrap shrink-0 hover:underline underline-offset-8 decoration-[#35E0FF]/40"
          >
            Schedule
          </a>
          <a 
            href="#rules" 
            onClick={(e) => {
              e.preventDefault();
              navigateTo('home', 'rules');
            }}
            className="hover:text-[#35E0FF] transition-colors whitespace-nowrap shrink-0 hover:underline underline-offset-8 decoration-[#35E0FF]/40"
          >
            Rules
          </a>
          <a 
            href="#news" 
            onClick={(e) => {
              e.preventDefault();
              navigateTo('home', 'news');
            }}
            className="hover:text-[#35E0FF] transition-colors whitespace-nowrap shrink-0 hover:underline underline-offset-8 decoration-[#35E0FF]/40"
          >
            News
          </a>
          <a 
            href="#location" 
            onClick={(e) => {
              e.preventDefault();
              navigateTo('home', 'location');
            }}
            className="hover:text-[#35E0FF] transition-colors whitespace-nowrap shrink-0 hover:underline underline-offset-8 decoration-[#35E0FF]/40"
          >
            Location
          </a>
        </nav>

        {/* Zone 3: 1 Primary Action + Quick Utilities */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onOpenQR}
            title="Download Event QR Code for Poster / Share"
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#9DB0D0] hover:text-[#35E0FF] bg-[#0C1630] hover:bg-[#132247] border border-[#78AAFF]/20 rounded-lg transition-all cursor-pointer"
          >
            <QrCode className="w-3.5 h-3.5 text-[#35E0FF]" />
            <span className="whitespace-nowrap">Event QR</span>
          </button>

          <button
            onClick={handleDownloadTemplate}
            disabled={isDownloadingTemplate}
            title="Download standard 10-slide PowerPoint presentation template"
            className="hidden xl:flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#35E0FF] hover:text-white bg-[#35E0FF]/10 hover:bg-[#35E0FF]/20 border border-[#35E0FF]/30 rounded-lg transition-all cursor-pointer shadow-sm disabled:opacity-50"
          >
            <Download className={`w-3.5 h-3.5 ${isDownloadingTemplate ? 'animate-bounce' : ''}`} />
            <span className="whitespace-nowrap">{isDownloadingTemplate ? 'Generating...' : 'PPT Template'}</span>
          </button>

          {currentTeamSession ? (
            <button
              onClick={() => setActiveView('dashboard')}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#35E0FF] bg-[#0C1630] border border-[#35E0FF]/40 rounded-lg hover:border-[#35E0FF] transition-all whitespace-nowrap shadow-[0_0_12px_rgba(53,224,255,0.2)]"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>{currentTeamSession.id}</span>
            </button>
          ) : (
            <button
              onClick={() => navigateTo('dashboard')}
              className="hidden lg:flex items-center gap-1 text-xs text-[#9DB0D0] hover:text-[#35E0FF] transition-colors whitespace-nowrap px-2 cursor-pointer"
            >
              Team Login
            </button>
          )}

          <button
            onClick={() => setShowRegisterModal(true)}
            className="relative group px-4 py-2 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-[#FF8A2A] to-[#F5611A] rounded-lg shadow-[0_0_18px_rgba(255,138,42,0.4)] hover:shadow-[0_0_24px_rgba(255,138,42,0.6)] hover:brightness-110 active:scale-95 transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer"
          >
            <span>Register Now</span>
            <span className="text-[10px] bg-black/30 px-1.5 py-0.5 rounded text-amber-200">₹{eventConfig.entryFee}</span>
          </button>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-[#9DB0D0] hover:text-white rounded-lg hover:bg-[#0C1630] transition-colors cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0C1630]/98 border-b border-[#35E0FF]/20 px-5 py-4 space-y-3">
          <div className="flex flex-col space-y-2 text-sm font-medium">
            <button 
              onClick={() => { setMobileMenuOpen(false); navigateTo('home', 'tracks'); }}
              className="py-2 text-left text-[#9DB0D0] hover:text-[#35E0FF] border-b border-[#78AAFF]/10 cursor-pointer"
            >
              Domain Tracks
            </button>
            <button 
              onClick={() => { setMobileMenuOpen(false); navigateTo('home', 'prizes'); }}
              className="py-2 text-left text-[#9DB0D0] hover:text-[#35E0FF] border-b border-[#78AAFF]/10 cursor-pointer"
            >
              Prizes & Awards
            </button>
            <button 
              onClick={() => { setMobileMenuOpen(false); navigateTo('home', 'schedule'); }}
              className="py-2 text-left text-[#9DB0D0] hover:text-[#35E0FF] border-b border-[#78AAFF]/10 cursor-pointer"
            >
              24-Hour Schedule
            </button>
            <button 
              onClick={() => { setMobileMenuOpen(false); navigateTo('home', 'rules'); }}
              className="py-2 text-left text-[#9DB0D0] hover:text-[#35E0FF] border-b border-[#78AAFF]/10 cursor-pointer"
            >
              Rules & Eligibility
            </button>
            <button 
              onClick={() => { setMobileMenuOpen(false); navigateTo('home', 'news'); }}
              className="py-2 text-left text-[#9DB0D0] hover:text-[#35E0FF] border-b border-[#78AAFF]/10 cursor-pointer"
            >
              Announcements
            </button>
            <button 
              onClick={() => { setMobileMenuOpen(false); navigateTo('home', 'location'); }}
              className="py-2 text-left text-[#9DB0D0] hover:text-[#35E0FF] border-b border-[#78AAFF]/10 cursor-pointer"
            >
              Venue & Location
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleDownloadTemplate();
              }}
              disabled={isDownloadingTemplate}
              className="py-2 text-left text-[#35E0FF] font-semibold border-b border-[#78AAFF]/10 flex items-center justify-between cursor-pointer"
            >
              <span>{isDownloadingTemplate ? 'Generating PPT...' : 'Download PPT Template (.pptx)'}</span>
              <Download className="w-4 h-4 text-[#35E0FF]" />
            </button>
            <button
              onClick={() => { setMobileMenuOpen(false); navigateTo('dashboard'); }}
              className="py-2 text-left text-[#35E0FF] font-semibold border-b border-[#78AAFF]/10 cursor-pointer"
            >
              Participant Dashboard / PPT Submission
            </button>
            <button
              onClick={() => { setMobileMenuOpen(false); navigateTo('admin'); }}
              className="py-2 text-left text-[#FF8A2A] font-semibold flex items-center justify-between cursor-pointer"
            >
              <span>Admin Console</span>
              <ShieldCheck className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
