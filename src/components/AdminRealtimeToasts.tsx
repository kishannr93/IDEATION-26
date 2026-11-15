import React from 'react';
import {
  UserPlus,
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  X,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export interface AdminRealtimeToast {
  id: string;
  type: 'registration' | 'payment';
  teamId: string;
  teamName: string;
  title: string;
  description: string;
  status?: 'Pending' | 'Verified' | 'Rejected';
  track?: string;
  college?: string;
  createdAt: string;
  source: 'supabase' | 'sync';
}

export function playAdminNotificationTone(type: 'registration' | 'payment') {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'registration') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(660, now);
      osc.frequency.setValueAtTime(880, now + 0.09);
    } else {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.08);
      osc.frequency.setValueAtTime(783.99, now + 0.16);
    }

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.08, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

    osc.start(now);
    osc.stop(now + 0.34);
  } catch {
    // Ignore autoplay audio restrictions when user gesture hasn't occurred
  }
}

interface AdminRealtimeToastsProps {
  toasts: AdminRealtimeToast[];
  onDismiss: (id: string) => void;
  onAction: (toast: AdminRealtimeToast) => void;
}

export const AdminRealtimeToasts: React.FC<AdminRealtimeToastsProps> = ({
  toasts,
  onDismiss,
  onAction,
}) => {
  if (toasts.length === 0) return null;

  const getToastTheme = (toast: AdminRealtimeToast) => {
    if (toast.type === 'registration') {
      return {
        border: 'border-[#35E0FF]/50',
        glow: 'shadow-[0_12px_36px_rgba(53,224,255,0.22)]',
        accentBar: 'bg-gradient-to-b from-[#35E0FF] to-[#3A7BFF]',
        iconBg: 'bg-[#35E0FF]/15 border-[#35E0FF]/40 text-[#35E0FF]',
        badgeBg: 'bg-[#35E0FF]/15 text-[#35E0FF] border-[#35E0FF]/30',
        Icon: UserPlus,
      };
    }

    if (toast.status === 'Verified') {
      return {
        border: 'border-emerald-400/50',
        glow: 'shadow-[0_12px_36px_rgba(52,211,153,0.22)]',
        accentBar: 'bg-gradient-to-b from-emerald-400 to-teal-500',
        iconBg: 'bg-emerald-500/15 border-emerald-400/40 text-emerald-400',
        badgeBg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
        Icon: CheckCircle2,
      };
    }

    if (toast.status === 'Rejected') {
      return {
        border: 'border-rose-400/50',
        glow: 'shadow-[0_12px_36px_rgba(244,63,94,0.22)]',
        accentBar: 'bg-gradient-to-b from-rose-400 to-red-600',
        iconBg: 'bg-rose-500/15 border-rose-400/40 text-rose-400',
        badgeBg: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
        Icon: XCircle,
      };
    }

    return {
      border: 'border-[#FF8A2A]/50',
      glow: 'shadow-[0_12px_36px_rgba(255,138,42,0.22)]',
      accentBar: 'bg-gradient-to-b from-[#FFC83D] to-[#FF8A2A]',
      iconBg: 'bg-[#FF8A2A]/15 border-[#FF8A2A]/40 text-[#FFC83D]',
      badgeBg: 'bg-[#FF8A2A]/15 text-[#FFC83D] border-[#FF8A2A]/30',
      Icon: toast.status === 'Pending' ? Clock : CreditCard,
    };
  };

  return (
    <div
      aria-live="polite"
      aria-label="Real-time registration and payment alerts"
      className="fixed top-5 right-5 z-[60] w-[calc(100vw-2rem)] max-w-sm space-y-2.5 pointer-events-none"
    >
      {toasts.map((toast) => {
        const theme = getToastTheme(toast);
        const IconComponent = theme.Icon;
        const formattedTime = new Date(toast.createdAt).toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });

        return (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto relative overflow-hidden rounded-2xl bg-[#081024]/95 backdrop-blur-xl border ${theme.border} ${theme.glow} p-4 text-white animate-in fade-in slide-in-from-right-6 duration-300`}
          >
            {/* Left color stripe */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${theme.accentBar}`} />

            <div className="flex items-start gap-3 pl-1.5">
              <div
                className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 ${theme.iconBg}`}
              >
                <IconComponent className="w-4 h-4" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-display font-bold text-xs text-white truncate">
                      {toast.title}
                    </span>
                    <Sparkles className="w-3 h-3 text-[#35E0FF] shrink-0" />
                  </div>

                  <button
                    type="button"
                    onClick={() => onDismiss(toast.id)}
                    aria-label="Dismiss notification"
                    className="p-1 -mr-1 -mt-1 text-[#9DB0D0] hover:text-white rounded-lg hover:bg-[#132247] transition-colors cursor-pointer shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-xs text-[#CBD5E1] mt-1 leading-relaxed break-words">
                  {toast.description}
                </p>

                <div className="flex items-center justify-between gap-2 mt-2.5 pt-2 border-t border-[#78AAFF]/15">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${theme.badgeBg}`}
                    >
                      {toast.teamId}
                    </span>
                    <span className="text-[10px] font-mono text-[#9DB0D0] truncate">
                      {formattedTime}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onAction(toast)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#35E0FF] hover:text-white transition-colors cursor-pointer shrink-0"
                  >
                    <span>{toast.type === 'registration' ? 'Inspect Team' : 'View Payments'}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
