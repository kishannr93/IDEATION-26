import React from 'react';
import { RefreshCw, Home, ShieldAlert } from 'lucide-react';
import bulbImg from '../assets/images/ideation_logo.jpg';

interface Error500PageProps {
  error?: Error | null;
  onReset?: () => void;
}

export const Error500Page: React.FC<Error500PageProps> = ({ error, onReset }) => {
  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 bg-[#050B1A] relative text-center">
      <div className="max-w-md mx-auto space-y-6">
        <div className="relative w-36 h-36 mx-auto rounded-3xl overflow-hidden border border-rose-500/40 p-2 bg-[#0C1630] shadow-[0_0_35px_rgba(244,63,94,0.3)] flex items-center justify-center">
          <img 
            src={bulbImg} 
            alt="IDEATION Error" 
            className="w-full h-full object-contain filter grayscale opacity-70"
            referrerPolicy="no-referrer"
          />
        </div>

        <div className="space-y-2">
          <div className="font-mono text-sm uppercase text-rose-400 font-bold tracking-widest flex items-center justify-center gap-1.5">
            <ShieldAlert className="w-4 h-4" />
            <span>Telemetry Overload · 500</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black font-display text-white">System Anomaly</h1>
          <p className="text-xs sm:text-sm text-[#9DB0D0] leading-relaxed">
            An unexpected error interrupted the portal connection. Our systems have logged this event for the Anveshan technical team.
          </p>
          {error && (
            <p className="font-mono text-[11px] p-2 rounded bg-black/50 text-rose-300/80 border border-rose-500/20 max-w-sm mx-auto overflow-x-auto text-left">
              {error.message}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={() => {
              if (onReset) onReset();
              window.location.reload();
            }}
            className="px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-cyan-500 to-blue-600 shadow-[0_0_20px_rgba(53,224,255,0.3)] hover:brightness-110 active:scale-95 transition-all inline-flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Re-initialize Circuit</span>
          </button>

          <button
            onClick={() => {
              window.location.href = '/';
            }}
            className="px-5 py-2.5 rounded-xl font-semibold text-xs text-[#9DB0D0] hover:text-white bg-[#0C1630] border border-[#78AAFF]/20 hover:border-[#35E0FF] transition-colors inline-flex items-center gap-2"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Back to Portal Home</span>
          </button>
        </div>
      </div>
    </div>
  );
};
