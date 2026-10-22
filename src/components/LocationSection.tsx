import React, { useState } from 'react';
import {
  MapPin,
  Navigation,
  Compass,
  Train,
  Bus,
  Car,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Building2,
  Clock,
  PhoneCall,
  Map as MapIcon,
} from 'lucide-react';

export const LocationSection: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const fullAddress = '325, Shamanur Rd, BIET, Davangere, Karnataka 577004';
  const venueTitle = 'Bapuji Institute of Engineering and Technology (BIET)';

  const handleCopy = () => {
    navigator.clipboard.writeText(fullAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    fullAddress
  )}`;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    fullAddress
  )}`;
  const embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(
    fullAddress
  )}&t=&z=16&ie=UTF8&iwloc=&output=embed`;

  return (
    <section id="location" className="py-24 px-4 sm:px-6 lg:px-8 border-t border-[#78AAFF]/15 bg-[#050B1A] relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-[#35E0FF]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-0 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#35E0FF]/10 border border-[#35E0FF]/30 text-xs font-mono uppercase tracking-widest text-[#35E0FF] mb-3">
            <Compass className="w-3.5 h-3.5 animate-spin-slow" />
            <span>Hackathon Venue & Directions</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold font-display text-white tracking-tight">
            Event <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#35E0FF] via-white to-[#35E0FF]">Location</span>
          </h2>
          <p className="text-sm sm:text-base text-[#9DB0D0] mt-3">
            Join us live on-campus at BIET Davangere for 36 hours of non-stop innovation, building, and mentorship.
          </p>
        </div>

        {/* Main Content Grid: Map + Venue Details */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Interactive Map Frame */}
          <div className="lg:col-span-7 flex flex-col rounded-3xl bg-[#081024] border border-[#78AAFF]/20 shadow-2xl overflow-hidden group">
            {/* Top Bar on Map Frame */}
            <div className="p-4 sm:p-5 bg-[#0C1630] border-b border-[#78AAFF]/20 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#35E0FF]/15 border border-[#35E0FF]/40 flex items-center justify-center text-[#35E0FF] shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <span>BIET Campus Map</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  </h3>
                  <p className="text-[11px] text-[#9DB0D0] truncate max-w-xs sm:max-w-md">
                    {fullAddress}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="px-3 py-1.5 rounded-lg text-xs font-mono bg-[#11234D] hover:bg-[#1a3366] text-white border border-[#78AAFF]/30 flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Copy full venue address"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-[#35E0FF]" />}
                  <span>{copied ? 'Copied' : 'Copy Address'}</span>
                </button>

                <a
                  href={directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-[#050B1A] bg-gradient-to-r from-[#35E0FF] to-white hover:brightness-110 flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Get Directions</span>
                </a>
              </div>
            </div>

            {/* Embedded Google Maps Container */}
            <div className="relative w-full h-[360px] sm:h-[440px] flex-grow bg-[#050B1A]">
              <iframe
                title="BIET Davangere Location Map"
                src={embedUrl}
                width="100%"
                height="100%"
                style={{ border: 0, filter: 'contrast(1.05) saturate(1.1)' }}
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full h-full"
              />

              {/* Floating Pin Card on bottom left of map */}
              <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:max-w-sm p-3.5 rounded-2xl bg-[#081024]/95 backdrop-blur-md border border-[#35E0FF]/30 shadow-2xl flex items-start gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-black shrink-0">
                  <Building2 className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <div className="font-bold text-white leading-tight">{venueTitle}</div>
                  <div className="text-[11px] text-[#9DB0D0] mt-0.5">325, Shamanur Road, Davangere, Karnataka 577004</div>
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-[#35E0FF] font-semibold mt-1 hover:underline"
                  >
                    <span>View full screen in Google Maps</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Address, Campus Details, and Transport Guide */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
            {/* Address & Venue Card */}
            <div className="p-6 rounded-3xl bg-[#081024] border border-[#78AAFF]/20 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#35E0FF] bg-[#35E0FF]/10 px-2.5 py-1 rounded-md border border-[#35E0FF]/20">
                  Official Campus Venue
                </span>
                <span className="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Verified Location
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-white font-display">
                  {venueTitle}
                </h3>
                <div className="text-xs text-[#9DB0D0] mt-1 space-y-1">
                  <p className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-[#35E0FF] shrink-0 mt-0.5" />
                    <span>325, Shamanur Rd, BIET Campus, Davangere, Karnataka 577004</span>
                  </p>
                  <p className="flex items-center gap-2 pt-1 text-slate-300">
                    <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Check-in Desk Opens: <strong className="text-white">08:00 AM on Hackathon Day</strong></span>
                  </p>
                </div>
              </div>

              {/* Landmark & Entry Gate Alert */}
              <div className="p-3.5 rounded-xl bg-[#0C1630] border border-[#78AAFF]/20 text-xs text-[#9DB0D0] space-y-1">
                <span className="font-semibold text-white block">Campus Entry & Navigation:</span>
                <p>
                  Enter via <strong className="text-[#35E0FF]">Main Gate 1 (Shamanur Road)</strong>. Directional signage will guide all participants to the <strong className="text-white">Central Auditorium & Innovation Center</strong>.
                </p>
              </div>
            </div>

            {/* How to Reach / Travel Transit Cards */}
            <div className="p-6 rounded-3xl bg-[#081024] border border-[#78AAFF]/20 shadow-xl space-y-3">
              <h4 className="text-xs font-mono uppercase tracking-wider text-white font-bold flex items-center gap-2">
                <Navigation className="w-3.5 h-3.5 text-[#35E0FF]" />
                <span>How to Reach the Venue</span>
              </h4>

              <div className="space-y-2.5">
                {/* Train */}
                <div className="p-3 rounded-2xl bg-[#0C1630] border border-[#78AAFF]/15 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-300 shrink-0">
                    <Train className="w-4 h-4" />
                  </div>
                  <div className="text-xs">
                    <div className="font-bold text-white">Davangere Railway Station (DVG)</div>
                    <p className="text-[#9DB0D0] text-[11px] mt-0.5">
                      ~4.5 km away. Direct auto-rickshaws available 24/7 (10-12 mins drive, approx. ₹60-₹90).
                    </p>
                  </div>
                </div>

                {/* Bus */}
                <div className="p-3 rounded-2xl bg-[#0C1630] border border-[#78AAFF]/15 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-300 shrink-0">
                    <Bus className="w-4 h-4" />
                  </div>
                  <div className="text-xs">
                    <div className="font-bold text-white">KSRTC Central Bus Stand</div>
                    <p className="text-[#9DB0D0] text-[11px] mt-0.5">
                      ~5.0 km away. Regular city buses route to Shamanur Road / BIET Stop directly outside the campus gate.
                    </p>
                  </div>
                </div>

                {/* Highway / Road */}
                <div className="p-3 rounded-2xl bg-[#0C1630] border border-[#78AAFF]/15 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-300 shrink-0">
                    <Car className="w-4 h-4" />
                  </div>
                  <div className="text-xs">
                    <div className="font-bold text-white">By Road (NH-48 Pune - Bengaluru)</div>
                    <p className="text-[#9DB0D0] text-[11px] mt-0.5">
                      Take Shamanur flyover exit from NH-48. Ample free on-campus parking available for 2-wheelers and 4-wheelers.
                    </p>
                  </div>
                </div>
              </div>

              {/* Helpdesk link */}
              <div className="pt-2 flex items-center justify-between text-xs text-[#9DB0D0] border-t border-[#78AAFF]/15">
                <span className="flex items-center gap-1.5">
                  <PhoneCall className="w-3.5 h-3.5 text-[#35E0FF]" />
                  <span>Venue Helpdesk: +91 94812 34567</span>
                </span>
                <a
                  href={directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#35E0FF] font-semibold hover:underline flex items-center gap-1"
                >
                  <span>Open Directions</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
