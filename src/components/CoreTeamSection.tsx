import React, { useMemo, useState } from 'react';
import { useHackathon } from '../context/HackathonContext';
import { Phone, Mail, GraduationCap, Award, Users, Layers } from 'lucide-react';
import { CustomTeamSection } from '../types';

const getInitials = (name: string): string => {
  if (!name) return 'TM';
  const clean = name.replace(/^(prof\.|dr\.|mr\.|mrs\.|ms\.|shri|smt)\s+/i, '').trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'TM';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const ACCENT_STYLES: Record<
  NonNullable<CustomTeamSection['accentColor']>,
  {
    text: string;
    border: string;
    hoverBorder: string;
    badgeBg: string;
    avatarBorder: string;
  }
> = {
  cyan: {
    text: 'text-[#35E0FF]',
    border: 'border-[#78AAFF]/15',
    hoverBorder: 'hover:border-[#35E0FF]/45',
    badgeBg: 'bg-[#35E0FF]/10 text-[#35E0FF] border-[#35E0FF]/30',
    avatarBorder: 'border-[#35E0FF]/40',
  },
  magenta: {
    text: 'text-[#FF4FD8]',
    border: 'border-[#78AAFF]/15',
    hoverBorder: 'hover:border-[#FF4FD8]/45',
    badgeBg: 'bg-[#FF4FD8]/10 text-[#FF4FD8] border-[#FF4FD8]/30',
    avatarBorder: 'border-[#FF4FD8]/40',
  },
  amber: {
    text: 'text-[#FF8A2A]',
    border: 'border-[#FF8A2A]/20',
    hoverBorder: 'hover:border-[#FF8A2A]/50',
    badgeBg: 'bg-[#FF8A2A]/10 text-[#FF8A2A] border-[#FF8A2A]/30',
    avatarBorder: 'border-[#FF8A2A]/40',
  },
  emerald: {
    text: 'text-emerald-400',
    border: 'border-emerald-400/20',
    hoverBorder: 'hover:border-emerald-400/50',
    badgeBg: 'bg-emerald-500/10 text-emerald-300 border-emerald-400/30',
    avatarBorder: 'border-emerald-400/40',
  },
};

const BUILT_IN_LOWER = new Set(['faculty', 'student co-ordinator', 'contact helpline']);

const MemberAvatar: React.FC<{
  photoUrl?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  borderColor?: string;
  textColor?: string;
  className?: string;
}> = ({
  photoUrl,
  name,
  size = 'md',
  borderColor = 'border-[#35E0FF]/30',
  textColor = 'text-[#35E0FF]',
  className = '',
}) => {
  const [imgError, setImgError] = useState(false);

  const dim = size === 'lg' ? 'w-14 h-14' : size === 'md' ? 'w-12 h-12' : 'w-10 h-10';
  const textSize = size === 'lg' ? 'text-lg' : size === 'md' ? 'text-base' : 'text-xs';

  if (photoUrl && !imgError) {
    return (
      <div className={`${dim} rounded-2xl overflow-hidden border ${borderColor} shrink-0 bg-[#081024] shadow-md ${className}`}>
        <img
          src={photoUrl}
          alt={name}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover object-center"
        />
      </div>
    );
  }

  return (
    <div
      className={`${dim} rounded-2xl bg-gradient-to-br from-[#0C1630] to-[#132247] border ${borderColor} flex items-center justify-center ${textColor} font-display font-bold ${textSize} tracking-wider shrink-0 shadow-md ${className}`}
      title={name}
    >
      {getInitials(name)}
    </div>
  );
};

export const CoreTeamSection: React.FC = () => {
  const { coreTeam, customTeamSections } = useHackathon();

  const faculty = coreTeam.filter(m => m.category === 'Faculty').sort((a, b) => a.order - b.order);
  const students = coreTeam.filter(m => m.category === 'Student Co-ordinator').sort((a, b) => a.order - b.order);
  const contacts = coreTeam.filter(m => m.category === 'Contact Helpline').sort((a, b) => a.order - b.order);

  const customCommittees = useMemo(() => {
    const ordered: CustomTeamSection[] = [...customTeamSections].sort((a, b) => a.order - b.order);
    const seenNames = new Set(ordered.map(s => s.name.trim().toLowerCase()));

    // Also pick up any custom categories directly on members not yet registered in customTeamSections
    coreTeam.forEach((m) => {
      const cat = (m.category || '').trim();
      const lower = cat.toLowerCase();
      if (cat && !BUILT_IN_LOWER.has(lower) && !seenNames.has(lower)) {
        seenNames.add(lower);
        ordered.push({
          id: `auto-${lower}`,
          name: cat,
          accentColor: (['magenta', 'cyan', 'emerald', 'amber'] as const)[ordered.length % 4],
          order: ordered.length + 1,
        });
      }
    });

    return ordered
      .map((sec) => ({
        section: sec,
        members: coreTeam
          .filter(m => (m.category || '').trim().toLowerCase() === sec.name.trim().toLowerCase())
          .sort((a, b) => a.order - b.order),
      }))
      .filter((group) => group.members.length > 0);
  }, [coreTeam, customTeamSections]);

  return (
    <section id="core-team" className="py-24 px-4 sm:px-6 lg:px-8 border-t border-[#78AAFF]/15 bg-[#050B1A] relative">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#FF4FD8] mb-2">
            <Users className="w-3.5 h-3.5" />
            <span>Organizing Committee</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold font-display text-white tracking-tight">
            Meet the <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF4FD8] via-white to-[#35E0FF]">Core Team</span>
          </h2>
          <p className="text-base text-[#9DB0D0] mt-3">
            Anveshan Club and BIET faculty leadership driving innovation, mentorship, and participant care.
          </p>
        </div>

        {/* 1. Faculty Leadership */}
        <div className="mb-14">
          <div className="flex items-center gap-2 mb-6">
            <GraduationCap className="w-5 h-5 text-[#35E0FF]" />
            <h3 className="font-tech text-base font-bold uppercase tracking-wider text-[#35E0FF]">
              Faculty Leadership & Patronage
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {faculty.map((member) => (
              <div
                key={member.id}
                className="p-6 rounded-2xl bg-[#0C1630] border border-[#78AAFF]/20 hover:border-[#35E0FF]/40 transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="mb-4">
                    <MemberAvatar
                      photoUrl={member.photoUrl}
                      name={member.name}
                      size="lg"
                      borderColor="border-[#35E0FF]/40"
                      textColor="text-[#35E0FF]"
                    />
                  </div>
                  <h4 className="font-display font-bold text-lg text-white">{member.name}</h4>
                  <p className="text-xs text-[#9DB0D0] mt-1">{member.role}</p>
                  <p className="text-[11px] font-mono text-[#78AAFF] mt-0.5">BIET Davangere</p>
                </div>
                
                {member.email && (
                  <div className="mt-4 pt-3 border-t border-[#78AAFF]/15">
                    <a
                      href={`mailto:${member.email}`}
                      className="inline-flex items-center gap-1.5 text-xs text-[#35E0FF] hover:underline font-mono"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span className="truncate">{member.email}</span>
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 2. Student Co-ordinators */}
        <div className="mb-14">
          <div className="flex items-center gap-2 mb-6">
            <Award className="w-5 h-5 text-[#FF4FD8]" />
            <h3 className="font-tech text-base font-bold uppercase tracking-wider text-[#FF4FD8]">
              Student Co-ordinators
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {students.map((member) => (
              <div
                key={member.id}
                className="p-4 rounded-xl bg-[#0C1630] border border-[#78AAFF]/15 hover:border-[#FF4FD8]/40 transition-all duration-200 text-center flex flex-col items-center justify-between"
              >
                <div className="flex flex-col items-center">
                  <div className="mb-3">
                    <MemberAvatar
                      photoUrl={member.photoUrl}
                      name={member.name}
                      size="md"
                      borderColor="border-[#FF4FD8]/40"
                      textColor="text-[#FF4FD8]"
                      className="mx-auto"
                    />
                  </div>
                  <div className="font-bold text-white text-xs sm:text-sm line-clamp-1">{member.name}</div>
                  <div className="text-[10px] text-[#9DB0D0] mt-1 font-mono">{member.role}</div>
                </div>
                {member.email && (
                  <div className="text-[9px] text-[#35E0FF] truncate mt-2 font-mono w-full">{member.email}</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 3. Custom Named Committee Sections (Design Committee, Media Committee, etc.) */}
        {customCommittees.map(({ section, members }) => {
          const style = ACCENT_STYLES[section.accentColor || 'cyan'];
          return (
            <div key={section.id} className="mb-14">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
                <div className="flex items-center gap-2.5">
                  <Layers className={`w-5 h-5 ${style.text}`} />
                  <div>
                    <h3 className={`font-tech text-base font-bold uppercase tracking-wider ${style.text}`}>
                      {section.name}
                    </h3>
                    {section.description && (
                      <p className="text-xs text-[#9DB0D0] mt-0.5">{section.description}</p>
                    )}
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-lg border text-[11px] font-mono ${style.badgeBg}`}>
                  {members.length} {members.length === 1 ? 'Member' : 'Members'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className={`p-4 rounded-xl bg-[#0C1630] border ${style.border} ${style.hoverBorder} transition-all duration-200 text-center flex flex-col items-center justify-between`}
                  >
                    <div className="flex flex-col items-center w-full">
                      <div className="mb-3">
                        <MemberAvatar
                          photoUrl={member.photoUrl}
                          name={member.name}
                          size="md"
                          borderColor={style.avatarBorder}
                          textColor={style.text}
                          className="mx-auto"
                        />
                      </div>
                      <div className="font-bold text-white text-xs sm:text-sm line-clamp-1">{member.name}</div>
                      <div className="text-[10px] text-[#9DB0D0] mt-1 font-mono">{member.role}</div>
                    </div>

                    <div className="w-full mt-2 space-y-1">
                      {member.email && (
                        <a
                          href={`mailto:${member.email}`}
                          className="block text-[9px] text-[#35E0FF] hover:underline truncate font-mono w-full"
                        >
                          {member.email}
                        </a>
                      )}
                      {member.phone && member.showPhonePublicly && (
                        <a
                          href={`tel:${member.phone.replace(/\s+/g, '')}`}
                          className="inline-flex items-center justify-center gap-1 text-[10px] font-mono text-amber-300 hover:text-white transition-colors"
                        >
                          <Phone className="w-2.5 h-2.5 text-[#FF8A2A]" />
                          <span>{member.phone}</span>
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* 4. Direct Helpline Contacts */}
        <div id="contact">
          <div className="flex items-center gap-2 mb-6">
            <Phone className="w-5 h-5 text-[#FF8A2A]" />
            <h3 className="font-tech text-base font-bold uppercase tracking-wider text-[#FF8A2A]">
              Direct Helpline & Registrations Support
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {contacts.map((member) => (
              <div
                key={member.id}
                className="p-5 rounded-2xl bg-[#0C1630] border border-[#FF8A2A]/20 hover:border-[#FF8A2A]/50 transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="mb-3">
                    <MemberAvatar
                      photoUrl={member.photoUrl}
                      name={member.name}
                      size="sm"
                      borderColor="border-[#FF8A2A]/40"
                      textColor="text-[#FF8A2A]"
                    />
                  </div>
                  <h4 className="font-display font-bold text-sm text-white">{member.name}</h4>
                  <p className="text-xs text-[#9DB0D0] mt-0.5">{member.role}</p>
                </div>

                {member.phone && member.showPhonePublicly && (
                  <div className="mt-4 pt-3 border-t border-[#78AAFF]/15 flex items-center justify-between">
                    <a
                      href={`tel:${member.phone.replace(/\s+/g, '')}`}
                      className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-amber-300 hover:text-white transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5 text-[#FF8A2A]" />
                      <span>{member.phone}</span>
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
