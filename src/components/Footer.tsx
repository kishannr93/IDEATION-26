import React from 'react';
import { useHackathon } from '../context/HackathonContext';
import { MapPin, Mail, Phone, ShieldCheck, Heart } from 'lucide-react';
import bulbImg from '../assets/images/ideation_logo.jpg';

interface FooterProps {
  onOpenTerms: () => void;
  onOpenPrivacy: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenTerms, onOpenPrivacy }) => {
  const { setActiveView, setShowRegisterModal, eventConfig } = useHackathon();

  return (
    <footer className="bg-[#030712] border-t border-[#78AAFF]/20 pt-16 pb-24 md:pb-16 px-4 sm:px-6 lg:px-8 text-[#9DB0D0] text-xs">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-[#78AAFF]/15">
        {/* Col 1: Institute Brand & Identity */}
        <div className="md:col-span-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl overflow-hidden bg-[#0C1630] border border-[#35E0FF]/40 p-0.5 flex items-center justify-center shadow-[0_0_12px_rgba(53,224,255,0.25)]">
              <img src={bulbImg} alt="IDEATION" className="w-full h-full object-contain" />
            </div>
            <span className="font-display font-bold text-lg text-white tracking-wider">
              IDEATION 2026
            </span>
          </div>

          <p className="text-xs leading-relaxed max-w-sm">
            Organized by <strong>Anveshan Club</strong>, Bapuji Institute of Engineering and Technology (BIET), Davangere, Karnataka. Managed by <strong>Bapuji Educational Association (Regd.)</strong>. An autonomous institute affiliated with <strong>VTU, Belagavi</strong>.
          </p>

          <div className="pt-2 text-[11px] text-[#78AAFF] font-mono space-y-1">
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-[#35E0FF] shrink-0" />
              <span>BIET Campus, Shamanur Road, Davangere, Karnataka 577004</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-[#35E0FF] shrink-0" />
              <span>anveshan@bietdvg.edu</span>
            </div>
          </div>
        </div>

        {/* Col 2: Navigation Links */}
        <div className="md:col-span-3 space-y-3">
          <h4 className="font-tech text-xs uppercase font-bold tracking-widest text-white">
            Quick Navigation
          </h4>
          <ul className="space-y-2 text-xs">
            <li>
              <a href="#hero" className="hover:text-[#35E0FF] transition-colors">Home</a>
            </li>
            <li>
              <a href="#tracks" className="hover:text-[#35E0FF] transition-colors">6 Domain Tracks</a>
            </li>
            <li>
              <a href="#prizes" className="hover:text-[#35E0FF] transition-colors">Prizes & Distinctions</a>
            </li>
            <li>
              <a href="#schedule" className="hover:text-[#35E0FF] transition-colors">24-Hour Schedule</a>
            </li>
            <li>
              <a href="#rules" className="hover:text-[#35E0FF] transition-colors">Rules & Eligibility</a>
            </li>
            <li>
              <a href="#core-team" className="hover:text-[#35E0FF] transition-colors">Core Team & Contacts</a>
            </li>
          </ul>
        </div>

        {/* Col 3: Portal Tools */}
        <div className="md:col-span-4 space-y-3">
          <h4 className="font-tech text-xs uppercase font-bold tracking-widest text-white">
            Portal Services
          </h4>
          <div className="space-y-2.5">
            <button
              onClick={() => setShowRegisterModal(true)}
              className="w-full text-left p-2.5 rounded-xl bg-[#0C1630] border border-[#78AAFF]/20 hover:border-[#FF8A2A] text-xs font-semibold text-white flex items-center justify-between transition-colors"
            >
              <span>Register Team (₹{eventConfig.entryFee})</span>
              <span className="text-[10px] font-mono text-[#FF8A2A]">Open</span>
            </button>

            <button
              onClick={() => setActiveView('dashboard')}
              className="w-full text-left p-2.5 rounded-xl bg-[#0C1630] border border-[#78AAFF]/20 hover:border-[#35E0FF] text-xs font-semibold text-white flex items-center justify-between transition-colors"
            >
              <span>Participant Login & Pass</span>
              <span className="text-[10px] font-mono text-[#35E0FF]">Check-in QR</span>
            </button>

            <button
              onClick={() => setActiveView('admin')}
              className="w-full text-left p-2.5 rounded-xl bg-[#0C1630] border border-[#78AAFF]/20 hover:border-[#FF8A2A] text-xs font-semibold text-white flex items-center justify-between transition-colors"
            >
              <span>Admin Management Suite</span>
              <ShieldCheck className="w-3.5 h-3.5 text-[#FF8A2A]" />
            </button>
          </div>
        </div>
      </div>

      {/* Sub-footer */}
      <div className="max-w-7xl mx-auto pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
        <div>
          © {new Date().getFullYear()} IDEATION · Anveshan Club, BIET Davangere. All rights reserved.
        </div>

        <div className="flex items-center gap-6">
          <button onClick={onOpenTerms} className="hover:text-white transition-colors">
            Terms & Conditions
          </button>
          <button onClick={onOpenPrivacy} className="hover:text-white transition-colors">
            Privacy Policy
          </button>
          <span className="text-[#78AAFF]/50">Autonomous VTU Institute</span>
        </div>
      </div>
    </footer>
  );
};
