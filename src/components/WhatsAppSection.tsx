import React, { useState } from 'react';
import { useHackathon } from '../context/HackathonContext';
import { MessageCircle, ExternalLink, Copy, Check, Bell, Users, Zap, ShieldCheck } from 'lucide-react';

const DEFAULT_WHATSAPP_LINK = 'https://chat.whatsapp.com/EHLiMxxfkOBLUCqnz8kolh';

export const WhatsAppSection: React.FC = () => {
  const { eventConfig } = useHackathon();
  const [copied, setCopied] = useState(false);

  const whatsappUrl = (eventConfig.whatsappGroupLink || '').trim() || DEFAULT_WHATSAPP_LINK;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(whatsappUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // Clipboard fallback
      const input = document.createElement('input');
      input.value = whatsappUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  return (
    <section
      id="whatsapp"
      className="py-20 px-4 sm:px-6 lg:px-8 border-t border-[#78AAFF]/15 bg-[#050B1A] relative overflow-hidden"
    >
      {/* Subtle ambient glow */}
      <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[520px] h-[220px] bg-emerald-500/10 blur-[110px] rounded-full" />

      <div className="max-w-5xl mx-auto relative">
        <div className="rounded-3xl bg-gradient-to-br from-[#0C1630] via-[#0B192E] to-[#081322] border border-emerald-500/30 shadow-[0_0_50px_rgba(16,185,129,0.12)] p-6 sm:p-10 md:p-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Info */}
            <div className="lg:col-span-7 space-y-5">
              <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-emerald-400">
                <MessageCircle className="w-4 h-4" />
                <span>Official Event Community</span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-extrabold font-display text-white tracking-tight leading-tight">
                Join the <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-[#35E0FF] to-emerald-300">WhatsApp Group</span>
              </h2>

              <p className="text-sm sm:text-base text-[#9DB0D0] leading-relaxed">
                Connect directly with {eventConfig.eventName} organizers, mentors, and fellow participants. All urgent dispatches, lab allocations, and real-time updates are shared here first.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="p-3 rounded-xl bg-[#081024]/80 border border-emerald-500/20 flex items-start gap-2.5">
                  <Bell className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-white">Live Alerts</div>
                    <div className="text-[11px] text-[#9DB0D0]">Schedule & rule updates</div>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-[#081024]/80 border border-emerald-500/20 flex items-start gap-2.5">
                  <Zap className="w-4 h-4 text-[#35E0FF] shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-white">Quick Support</div>
                    <div className="text-[11px] text-[#9DB0D0]">Direct organizer helpdesk</div>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-[#081024]/80 border border-emerald-500/20 flex items-start gap-2.5">
                  <Users className="w-4 h-4 text-[#FF4FD8] shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-white">Networking</div>
                    <div className="text-[11px] text-[#9DB0D0]">Meet builders & mentors</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Action Card */}
            <div className="lg:col-span-5">
              <div className="p-6 rounded-2xl bg-[#081024] border border-emerald-500/30 space-y-5 shadow-inner">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-400/40 flex items-center justify-center shrink-0 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.25)]">
                    <MessageCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-display font-bold text-white text-base">
                      {eventConfig.eventName} 2026 Group
                    </div>
                    <div className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Verified Official Invite</span>
                    </div>
                  </div>
                </div>

                {/* Invite URL Display */}
                <div className="p-3 rounded-xl bg-[#0C1630] border border-[#78AAFF]/20 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-mono text-[#9DB0D0] truncate">
                    {whatsappUrl}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="px-2.5 py-1.5 rounded-lg bg-[#132247] hover:bg-[#1a2d5c] text-[#35E0FF] border border-[#35E0FF]/30 text-[11px] font-mono flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                    title="Copy WhatsApp invite link"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>

                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-5 rounded-xl font-bold text-sm text-slate-950 bg-gradient-to-r from-emerald-400 via-[#25D366] to-emerald-300 hover:brightness-110 active:scale-[0.99] transition-all shadow-[0_0_24px_rgba(37,211,102,0.4)] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Join WhatsApp Group</span>
                  <ExternalLink className="w-4 h-4" />
                </a>

                <p className="text-[11px] text-center text-[#9DB0D0]/80">
                  Recommended for all registered team leaders and members.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
