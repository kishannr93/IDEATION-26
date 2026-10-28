import React, { useState, useEffect } from 'react';
import { useHackathon } from '../context/HackathonContext';
import {
  Home,
  Cpu,
  UserPlus,
  Bell,
  Trophy,
  Calendar,
  Users,
  PhoneCall,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  X,
} from 'lucide-react';

export const BottomDock: React.FC = () => {
  const {
    announcements,
    activeView,
    navigateTo,
    setShowRegisterModal,
    showCoreTeamPanel,
    setShowCoreTeamPanel,
  } = useHackathon();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');

  // Track scroll position to highlight active section on the landing page
  useEffect(() => {
    if (activeView !== 'home') return;

    const handleScroll = () => {
      const sections = ['hero', 'tracks', 'prizes', 'schedule', 'rules', 'news', 'location', 'core-team', 'contact'];
      const scrollY = window.scrollY + 200;

      for (const sectionId of sections) {
        const el = document.getElementById(sectionId);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollY >= top && scrollY < top + height) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeView]);

  const scrollToSection = (id: string) => {
    navigateTo('home', id);
  };

  const unreadNewsCount = announcements.length;

  return (
    <>
      {/* DESKTOP & TABLET: Floating Glass Dock (Fixed Bottom-Left) */}
      <aside 
        aria-label="Quick Access Dock"
        className="hidden md:flex fixed bottom-6 left-6 z-50 items-center pointer-events-auto transition-all duration-300"
      >
        {collapsed ? (
          <button
            onClick={() => setCollapsed(false)}
            aria-label="Expand IDEATION Taskbar"
            className="flex items-center gap-2 px-3 py-2.5 bg-[#0C1630]/90 hover:bg-[#132247] border border-[#35E0FF]/40 hover:border-[#35E0FF] text-[#35E0FF] rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.6)] backdrop-blur-xl group transition-all"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-[#35E0FF] animate-pulse" />
            <span className="font-tech text-xs tracking-wider uppercase font-semibold">IDEATION Dock</span>
            <ChevronRight className="w-4 h-4 text-[#9DB0D0] group-hover:translate-x-0.5 transition-transform" />
          </button>
        ) : (
          <div className="relative flex items-center gap-1.5 p-2 bg-[#081024]/90 backdrop-blur-2xl border border-[#35E0FF]/30 rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.8),0_0_20px_rgba(53,224,255,0.15)]">
            {/* Collapse toggle */}
            <button
              onClick={() => setCollapsed(true)}
              aria-label="Minimize taskbar"
              className="p-2 text-[#9DB0D0] hover:text-[#35E0FF] hover:bg-[#132247]/60 rounded-xl transition-colors"
              title="Collapse Dock"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="h-6 w-px bg-[#78AAFF]/20 mx-0.5" />

            {/* Home */}
            <button
              onClick={() => scrollToSection('hero')}
              className={`group relative p-2.5 rounded-xl transition-all ${
                activeView === 'home' && activeSection === 'hero'
                  ? 'bg-[#35E0FF]/15 text-[#35E0FF] shadow-[0_0_12px_rgba(53,224,255,0.3)]'
                  : 'text-[#9DB0D0] hover:text-[#35E0FF] hover:bg-[#132247]/60'
              }`}
            >
              <Home className="w-4 h-4" />
              <span className="absolute -top-9 left-1/2 -translate-x-1/2 px-2 py-1 bg-[#0C1630] border border-[#35E0FF]/30 rounded text-[11px] font-mono text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg">
                Home
              </span>
            </button>

            {/* Tracks */}
            <button
              onClick={() => scrollToSection('tracks')}
              className={`group relative p-2.5 rounded-xl transition-all ${
                activeSection === 'tracks'
                  ? 'bg-[#35E0FF]/15 text-[#35E0FF] shadow-[0_0_12px_rgba(53,224,255,0.3)]'
                  : 'text-[#9DB0D0] hover:text-[#35E0FF] hover:bg-[#132247]/60'
              }`}
            >
              <Cpu className="w-4 h-4" />
              <span className="absolute -top-9 left-1/2 -translate-x-1/2 px-2 py-1 bg-[#0C1630] border border-[#35E0FF]/30 rounded text-[11px] font-mono text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg">
                6 Tracks
              </span>
            </button>

            {/* Register */}
            <button
              onClick={() => setShowRegisterModal(true)}
              className="group relative p-2.5 rounded-xl text-white bg-gradient-to-r from-[#FF8A2A] to-[#F5611A] shadow-[0_0_14px_rgba(255,138,42,0.4)] hover:shadow-[0_0_20px_rgba(255,138,42,0.6)] hover:scale-105 active:scale-95 transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span className="absolute -top-9 left-1/2 -translate-x-1/2 px-2 py-1 bg-[#0C1630] border border-[#FF8A2A]/40 rounded text-[11px] font-mono text-amber-200 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg">
                Register (₹100)
              </span>
            </button>

            {/* News */}
            <button
              onClick={() => scrollToSection('news')}
              className={`group relative p-2.5 rounded-xl transition-all ${
                activeSection === 'news'
                  ? 'bg-[#35E0FF]/15 text-[#35E0FF] shadow-[0_0_12px_rgba(53,224,255,0.3)]'
                  : 'text-[#9DB0D0] hover:text-[#35E0FF] hover:bg-[#132247]/60'
              }`}
            >
              <Bell className="w-4 h-4" />
              {unreadNewsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {unreadNewsCount}
                </span>
              )}
              <span className="absolute -top-9 left-1/2 -translate-x-1/2 px-2 py-1 bg-[#0C1630] border border-[#35E0FF]/30 rounded text-[11px] font-mono text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg">
                Announcements
              </span>
            </button>

            {/* Prizes */}
            <button
              onClick={() => scrollToSection('prizes')}
              className={`group relative p-2.5 rounded-xl transition-all ${
                activeSection === 'prizes'
                  ? 'bg-[#35E0FF]/15 text-[#35E0FF] shadow-[0_0_12px_rgba(53,224,255,0.3)]'
                  : 'text-[#9DB0D0] hover:text-[#FFC83D] hover:bg-[#132247]/60'
              }`}
            >
              <Trophy className="w-4 h-4" />
              <span className="absolute -top-9 left-1/2 -translate-x-1/2 px-2 py-1 bg-[#0C1630] border border-[#FFC83D]/30 rounded text-[11px] font-mono text-amber-200 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg">
                ₹1 Lakh Prizes
              </span>
            </button>

            {/* Schedule */}
            <button
              onClick={() => scrollToSection('schedule')}
              className={`group relative p-2.5 rounded-xl transition-all ${
                activeSection === 'schedule'
                  ? 'bg-[#35E0FF]/15 text-[#35E0FF] shadow-[0_0_12px_rgba(53,224,255,0.3)]'
                  : 'text-[#9DB0D0] hover:text-[#35E0FF] hover:bg-[#132247]/60'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span className="absolute -top-9 left-1/2 -translate-x-1/2 px-2 py-1 bg-[#0C1630] border border-[#35E0FF]/30 rounded text-[11px] font-mono text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg">
                24-Hr Timeline
              </span>
            </button>

            {/* Core Team - Opens live slide-up drawer! */}
            <button
              onClick={() => setShowCoreTeamPanel(true)}
              className={`group relative p-2.5 rounded-xl transition-all ${
                showCoreTeamPanel
                  ? 'bg-[#FF4FD8]/20 text-[#FF4FD8] shadow-[0_0_12px_rgba(255,79,216,0.4)]'
                  : 'text-[#9DB0D0] hover:text-[#FF4FD8] hover:bg-[#132247]/60'
              }`}
            >
              <Users className="w-4 h-4" />
              <span className="absolute -top-9 left-1/2 -translate-x-1/2 px-2 py-1 bg-[#0C1630] border border-[#FF4FD8]/40 rounded text-[11px] font-mono text-[#FF4FD8] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg">
                Core Team Drawer
              </span>
            </button>

            {/* Contact */}
            <button
              onClick={() => scrollToSection('contact')}
              className={`group relative p-2.5 rounded-xl transition-all ${
                activeSection === 'contact'
                  ? 'bg-[#35E0FF]/15 text-[#35E0FF] shadow-[0_0_12px_rgba(53,224,255,0.3)]'
                  : 'text-[#9DB0D0] hover:text-[#35E0FF] hover:bg-[#132247]/60'
              }`}
            >
              <PhoneCall className="w-4 h-4" />
              <span className="absolute -top-9 left-1/2 -translate-x-1/2 px-2 py-1 bg-[#0C1630] border border-[#35E0FF]/30 rounded text-[11px] font-mono text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg">
                Helpline Contacts
              </span>
            </button>

            <div className="h-6 w-px bg-[#78AAFF]/20 mx-0.5" />

            {/* Admin Console */}
            <button
              onClick={() => navigateTo(activeView === 'admin' ? 'home' : 'admin')}
              className={`group relative p-2.5 rounded-xl transition-all cursor-pointer ${
                activeView === 'admin'
                  ? 'bg-[#FF8A2A]/20 text-[#FF8A2A] shadow-[0_0_12px_rgba(255,138,42,0.4)]'
                  : 'text-[#9DB0D0] hover:text-[#FF8A2A] hover:bg-[#132247]/60'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span className="absolute -top-9 left-1/2 -translate-x-1/2 px-2 py-1 bg-[#0C1630] border border-[#FF8A2A]/40 rounded text-[11px] font-mono text-amber-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg">
                Admin CMS
              </span>
            </button>
          </div>
        )}
      </aside>

      {/* MOBILE BOTTOM TASKBAR (Sleek, Fixed) */}
      <nav 
        aria-label="Mobile Navigation Bar"
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#081024]/95 backdrop-blur-xl border-t border-[#35E0FF]/20 px-3 py-2 flex items-center justify-around shadow-[0_-8px_30px_rgba(0,0,0,0.8)]"
      >
        <button
          onClick={() => scrollToSection('hero')}
          className={`flex flex-col items-center gap-0.5 text-[10px] ${
            activeView === 'home' && activeSection === 'hero' ? 'text-[#35E0FF]' : 'text-[#9DB0D0]'
          }`}
        >
          <Home className="w-4 h-4" />
          <span>Home</span>
        </button>

        <button
          onClick={() => scrollToSection('tracks')}
          className={`flex flex-col items-center gap-0.5 text-[10px] ${
            activeSection === 'tracks' ? 'text-[#35E0FF]' : 'text-[#9DB0D0]'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>Tracks</span>
        </button>

        <button
          onClick={() => setShowRegisterModal(true)}
          className="flex flex-col items-center gap-0.5 text-[10px] text-white -mt-4 bg-gradient-to-r from-[#FF8A2A] to-[#F5611A] p-2 rounded-full shadow-[0_0_16px_rgba(255,138,42,0.6)]"
        >
          <UserPlus className="w-5 h-5" />
          <span className="font-bold">Register</span>
        </button>

        <button
          onClick={() => setShowCoreTeamPanel(true)}
          className={`flex flex-col items-center gap-0.5 text-[10px] ${
            showCoreTeamPanel ? 'text-[#FF4FD8]' : 'text-[#9DB0D0]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Team</span>
        </button>

        <button
          onClick={() => setMobileMoreOpen(!mobileMoreOpen)}
          className="flex flex-col items-center gap-0.5 text-[10px] text-[#9DB0D0] hover:text-[#35E0FF]"
        >
          <MoreHorizontal className="w-4 h-4" />
          <span>More</span>
        </button>
      </nav>

      {/* Mobile More Sheet */}
      {mobileMoreOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end">
          <div className="w-full bg-[#0C1630] border-t border-[#35E0FF]/30 rounded-t-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#78AAFF]/20">
              <span className="font-tech text-base font-bold text-[#35E0FF]">IDEATION Navigation</span>
              <button 
                onClick={() => setMobileMoreOpen(false)}
                className="p-1 text-[#9DB0D0] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <button
                onClick={() => { scrollToSection('prizes'); setMobileMoreOpen(false); }}
                className="flex items-center gap-2 p-3 bg-[#132247] rounded-xl text-left text-[#F2F6FF]"
              >
                <Trophy className="w-4 h-4 text-[#FFC83D]" />
                <span>₹1,00,000 Prizes</span>
              </button>
              <button
                onClick={() => { scrollToSection('schedule'); setMobileMoreOpen(false); }}
                className="flex items-center gap-2 p-3 bg-[#132247] rounded-xl text-left text-[#F2F6FF]"
              >
                <Calendar className="w-4 h-4 text-[#35E0FF]" />
                <span>24h Schedule</span>
              </button>
              <button
                onClick={() => { scrollToSection('news'); setMobileMoreOpen(false); }}
                className="flex items-center gap-2 p-3 bg-[#132247] rounded-xl text-left text-[#F2F6FF]"
              >
                <Bell className="w-4 h-4 text-rose-400" />
                <span>Announcements ({unreadNewsCount})</span>
              </button>
              <button
                onClick={() => { scrollToSection('contact'); setMobileMoreOpen(false); }}
                className="flex items-center gap-2 p-3 bg-[#132247] rounded-xl text-left text-[#F2F6FF]"
              >
                <PhoneCall className="w-4 h-4 text-[#35E0FF]" />
                <span>Helpline Numbers</span>
              </button>
              <button
                onClick={() => { navigateTo('dashboard'); setMobileMoreOpen(false); }}
                className="col-span-2 flex items-center justify-between p-3 bg-[#081024] border border-[#35E0FF]/30 rounded-xl text-left text-[#35E0FF] font-semibold cursor-pointer"
              >
                <span>Participant Dashboard & Pass</span>
                <span className="text-xs bg-[#35E0FF]/20 px-2 py-0.5 rounded text-[#35E0FF]">Login</span>
              </button>
              <button
                onClick={() => { navigateTo('admin'); setMobileMoreOpen(false); }}
                className="col-span-2 flex items-center justify-between p-3 bg-[#081024] border border-[#FF8A2A]/30 rounded-xl text-left text-[#FF8A2A] font-semibold cursor-pointer"
              >
                <span>Admin CMS Console</span>
                <ShieldCheck className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
