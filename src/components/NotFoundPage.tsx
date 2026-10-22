import React from 'react';
import { useHackathon } from '../context/HackathonContext';
import { Home, AlertTriangle } from 'lucide-react';
import bulbImg from '../assets/images/ideation_logo.jpg';

export const NotFoundPage: React.FC = () => {
  const { setActiveView } = useHackathon();

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 bg-[#050B1A] relative text-center">
      <div className="max-w-md mx-auto space-y-6">
        {/* Flickering Bulb Container */}
        <div className="relative w-40 h-40 mx-auto rounded-3xl overflow-hidden border border-[#35E0FF]/40 p-2 bg-[#0C1630] shadow-[0_0_35px_rgba(53,224,255,0.35)] flex items-center justify-center">
          <img 
            src={bulbImg} 
            alt="IDEATION Bulb" 
            className="w-full h-full object-contain filter saturate-125"
            referrerPolicy="no-referrer"
          />
        </div>

        <div className="space-y-2">
          <div className="font-mono text-sm uppercase text-[#FF8A2A] font-bold tracking-widest flex items-center justify-center gap-1.5">
            <AlertTriangle className="w-4 h-4" />
            <span>Circuit Disconnected</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-black font-display text-white">404</h1>
          <p className="text-sm text-[#9DB0D0]">
            The innovation node you were looking for doesn't exist or has moved along the circuit board.
          </p>
        </div>

        <button
          onClick={() => setActiveView('home')}
          className="px-6 py-3 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-[#FF8A2A] to-[#F5611A] shadow-[0_0_20px_rgba(255,138,42,0.4)] hover:brightness-110 active:scale-95 transition-all inline-flex items-center gap-2"
        >
          <Home className="w-4 h-4" />
          <span>Return to Hackathon Mainboard</span>
        </button>
      </div>
    </div>
  );
};
