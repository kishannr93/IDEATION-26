import React, { useState } from 'react';
import { useHackathon } from '../context/HackathonContext';
import { X, Phone, Mail, Award, GraduationCap } from 'lucide-react';

const getInitials = (name: string): string => {
  if (!name) return 'TM';
  const clean = name.replace(/^(prof\.|dr\.|mr\.|mrs\.|ms\.|shri|smt)\s+/i, '').trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'TM';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const DrawerAvatar: React.FC<{
  photoUrl?: string;
  name: string;
  size?: 'sm' | 'md';
  textColor?: string;
  borderColor?: string;
}> = ({ photoUrl, name, size = 'sm', textColor = 'text-[#35E0FF]', borderColor = 'border-[#35E0FF]/30' }) => {
  const [error, setError] = useState(false);
  const dim = size === 'md' ? 'w-10 h-10' : 'w-8 h-8';

  if (photoUrl && !error) {
    return (
      <div className={`${dim} rounded-xl overflow-hidden border ${borderColor} shrink-0 bg-[#081024]`}>
        <img src={photoUrl} alt={name} onError={() => setError(true)} className="w-full h-full object-cover" />
      </div>
    );
  }

  return (
    <div
      className={`${dim} rounded-xl bg-[#081024] border ${borderColor} flex items-center justify-center ${textColor} font-bold text-[10px] shrink-0 font-mono`}
    >
      {getInitials(name)}
    </div>
  );
};

export const CoreTeamDrawer: React.FC = () => {
  const { coreTeam, showCoreTeamPanel, setShowCoreTeamPanel } = useHackathon();

  if (!showCoreTeamPanel) return null;

  const faculty = coreTeam.filter(m => m.category === 'Faculty').sort((a, b) => a.order - b.order);
  const students = coreTeam.filter(m => m.category === 'Student Co-ordinator').sort((a, b) => a.order - b.order);
  const helplines = coreTeam.filter(m => m.category === 'Contact Helpline').sort((a, b) => a.order - b.order);

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex justify-end transition-opacity duration-300"
      onClick={() => setShowCoreTeamPanel(false)}
    >
      <div 
        className="w-full max-w-2xl bg-[#081024] border-l border-[#35E0FF]/30 h-full overflow-y-auto p-6 md:p-8 flex flex-col justify-between shadow-[0_0_50px_rgba(0,0,0,0.9)] animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-5 border-b border-[#78AAFF]/20">
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-[#FF4FD8]">Anveshan Club · BIET Davangere</span>
              <h2 className="text-2xl font-bold font-display text-white mt-0.5">Core Committee & Co-ordinators</h2>
              <p className="text-xs text-[#9DB0D0] mt-1">Live data maintained by BIET Hackathon Committee</p>
            </div>
            <button
              onClick={() => setShowCoreTeamPanel(false)}
              className="p-2 text-[#9DB0D0] hover:text-white rounded-lg hover:bg-[#132247] transition-colors cursor-pointer"
              aria-label="Close panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Section: Faculty In-Charge & Co-ordinators */}
          <div className="mt-6 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <GraduationCap className="w-4 h-4 text-[#35E0FF]" />
                <h3 className="font-tech text-sm font-bold uppercase tracking-wider text-[#35E0FF]">
                  Faculty Leadership
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {faculty.map(member => (
                  <div 
                    key={member.id}
                    className="p-3.5 rounded-xl bg-[#0C1630] border border-[#78AAFF]/20 hover:border-[#35E0FF]/40 transition-colors flex items-start gap-3"
                  >
                    <DrawerAvatar photoUrl={member.photoUrl} name={member.name} size="md" textColor="text-[#35E0FF]" borderColor="border-[#35E0FF]/40" />
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-white text-sm truncate">{member.name}</div>
                      <div className="text-xs text-[#9DB0D0] mt-0.5">{member.role}</div>
                      {member.email && (
                        <a 
                          href={`mailto:${member.email}`}
                          className="inline-flex items-center gap-1.5 text-xs text-[#35E0FF] hover:underline mt-2 font-mono truncate max-w-full"
                        >
                          <Mail className="w-3 h-3 shrink-0" />
                          <span className="truncate">{member.email}</span>
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section: Student Co-ordinators */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Award className="w-4 h-4 text-[#FF4FD8]" />
                <h3 className="font-tech text-sm font-bold uppercase tracking-wider text-[#FF4FD8]">
                  Student Co-ordinators
                </h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {students.map(member => (
                  <div 
                    key={member.id}
                    className="p-3 rounded-xl bg-[#0C1630] border border-[#78AAFF]/15 hover:border-[#FF4FD8]/40 transition-colors flex flex-col items-center text-center"
                  >
                    <DrawerAvatar photoUrl={member.photoUrl} name={member.name} size="sm" textColor="text-[#FF4FD8]" borderColor="border-[#FF4FD8]/40" />
                    <div className="font-medium text-white text-xs mt-2 line-clamp-1">{member.name}</div>
                    <div className="text-[11px] text-[#9DB0D0] mt-0.5">{member.role}</div>
                    {member.email && (
                      <div className="text-[10px] text-[#35E0FF] truncate mt-1.5 font-mono w-full">{member.email}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Section: Helpline Contacts */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Phone className="w-4 h-4 text-[#FF8A2A]" />
                <h3 className="font-tech text-sm font-bold uppercase tracking-wider text-[#FF8A2A]">
                  Student Helpline & Enquiries
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {helplines.map(member => (
                  <div 
                    key={member.id}
                    className="p-3.5 rounded-xl bg-[#0C1630] border border-[#FF8A2A]/20 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <DrawerAvatar photoUrl={member.photoUrl} name={member.name} size="sm" textColor="text-[#FF8A2A]" borderColor="border-[#FF8A2A]/40" />
                      <div className="min-w-0">
                        <div className="font-semibold text-white text-sm truncate">{member.name}</div>
                        <div className="text-xs text-[#9DB0D0]">{member.role}</div>
                      </div>
                    </div>
                    {member.phone && member.showPhonePublicly && (
                      <a
                        href={`tel:${member.phone.replace(/\s+/g, '')}`}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#FF8A2A]/15 border border-[#FF8A2A]/30 hover:bg-[#FF8A2A]/30 text-amber-300 rounded-lg text-xs font-mono transition-colors shrink-0"
                      >
                        <Phone className="w-3 h-3" />
                        <span>{member.phone}</span>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-6 border-t border-[#78AAFF]/20 mt-8 text-center text-xs text-[#9DB0D0]">
          Bapuji Educational Association (Regd.) · Bapuji Institute of Engineering and Technology, Davangere
        </div>
      </div>
    </div>
  );
};
