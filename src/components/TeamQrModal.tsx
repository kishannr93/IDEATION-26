import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { RegisteredTeam } from '../types';
import {
  buildTeamRegistrationQrPayload,
  buildMemberMealQrPayload,
  getTeamMealCode,
  getMemberMealCode,
} from '../lib/mealPass';
import { QrCode, Download, Printer, X, Users, Sparkles } from 'lucide-react';

interface TeamQrCanvasProps {
  payload: string;
  size?: number;
  className?: string;
  canvasId?: string;
}

export const TeamQrCanvas: React.FC<TeamQrCanvasProps> = ({
  payload,
  size = 140,
  className = '',
  canvasId,
}) => {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (ref.current && payload) {
      QRCode.toCanvas(ref.current, payload, {
        width: size,
        margin: 1,
        color: { dark: '#050B1A', light: '#FFFFFF' },
      });
    }
  }, [payload, size]);

  return <canvas id={canvasId} ref={ref} className={className} />;
};

export function downloadQrCanvas(canvasId: string, filename: string) {
  const canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
  if (!canvas) return;
  const dataUrl = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

interface TeamUniqueQrSectionProps {
  team: RegisteredTeam;
  compact?: boolean;
}

export const TeamUniqueQrSection: React.FC<TeamUniqueQrSectionProps> = ({ team, compact = false }) => {
  const uniqueCode = getTeamMealCode(team);
  const teamQrPayload = buildTeamRegistrationQrPayload(team);
  const teamCanvasId = `admin-team-qr-${team.id}`;

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-[#0C1630] border border-[#35E0FF]/30 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#78AAFF]/15">
        <div className="flex items-center gap-2">
          <QrCode className="w-4 h-4 text-[#35E0FF]" />
          <div>
            <h4 className="font-bold text-white text-sm">Unique Team QR Code & Member Passes</h4>
            <p className="text-[11px] text-[#9DB0D0]">
              Unique registration & meal QR generated for <strong className="text-white">{team.teamName}</strong> ({team.id})
            </p>
          </div>
        </div>
        <span className="font-mono text-[11px] px-2.5 py-1 rounded-lg bg-[#081024] border border-[#FF8A2A]/40 text-[#FF8A2A] font-bold self-start sm:self-auto">
          {uniqueCode}
        </span>
      </div>

      {/* Primary Team QR + Actions */}
      <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-xl bg-[#081024] border border-[#78AAFF]/15">
        <div className="p-2.5 bg-white rounded-2xl shadow-lg shrink-0">
          <TeamQrCanvas payload={teamQrPayload} size={compact ? 120 : 148} canvasId={teamCanvasId} />
        </div>
        <div className="flex-1 text-center sm:text-left space-y-2">
          <div className="inline-flex items-center gap-1.5 text-[10px] font-mono text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-400/30">
            <Sparkles className="w-3 h-3" />
            <span>UNIQUE TEAM PASS QR</span>
          </div>
          <div className="text-sm font-bold text-white">
            {team.teamName} <span className="font-mono text-[#35E0FF]">({team.id})</span>
          </div>
          <div className="text-[11px] text-[#9DB0D0]">
            Works for Registration Desk Check-In and Meals &amp; Snacks Counter scanning.
          </div>
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
            <button
              type="button"
              onClick={() => downloadQrCanvas(teamCanvasId, `${team.id}_${uniqueCode}_QR.png`)}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-[#35E0FF] bg-[#132247] hover:bg-[#1a2d5c] border border-[#35E0FF]/35 flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Team QR</span>
            </button>
          </div>
        </div>
      </div>

      {/* Individual Member Unique QRs for Food Counter Scanning */}
      <div className="space-y-2.5">
        <div className="text-[11px] font-mono uppercase tracking-wider text-[#9DB0D0] flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-[#FF8A2A]" />
          <span>Individual Member Meal QR Codes ({team.members.length} Members)</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {team.members.map((member, idx) => {
            const memberCode = getMemberMealCode(team, idx);
            const memberCanvasId = `admin-member-qr-${team.id}-${idx}`;
            return (
              <div
                key={member.id}
                className="p-3 rounded-xl bg-[#081024] border border-[#78AAFF]/15 flex items-center gap-3"
              >
                <div className="p-1.5 bg-white rounded-xl shrink-0">
                  <TeamQrCanvas
                    payload={buildMemberMealQrPayload(team, member, idx)}
                    size={72}
                    canvasId={memberCanvasId}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-white text-xs truncate">
                    {member.name}{' '}
                    {member.isLeader && (
                      <span className="text-[9px] font-mono text-[#FF8A2A] ml-1">(Leader)</span>
                    )}
                  </div>
                  <div className="text-[10px] font-mono text-[#9DB0D0] truncate">USN: {member.usn}</div>
                  <div className="text-[10px] font-mono text-[#35E0FF] truncate mt-0.5">{memberCode}</div>
                  <button
                    type="button"
                    onClick={() => downloadQrCanvas(memberCanvasId, `${memberCode}_${member.usn}.png`)}
                    className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-300 hover:text-white cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    <span>Save PNG</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

interface TeamQrModalProps {
  team: RegisteredTeam;
  onClose: () => void;
}

export const TeamQrModal: React.FC<TeamQrModalProps> = ({ team, onClose }) => {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-[#081024] border border-[#35E0FF]/40 rounded-3xl p-6 sm:p-7 max-h-[90vh] overflow-y-auto shadow-[0_0_50px_rgba(53,224,255,0.2)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between pb-4 mb-4 border-b border-[#78AAFF]/20">
          <div>
            <span className="text-[11px] font-mono font-bold text-[#35E0FF] uppercase">
              Registration Unique QR Pass · {team.id}
            </span>
            <h3 className="text-xl font-bold font-display text-white">{team.teamName}</h3>
            <div className="text-xs text-[#9DB0D0]">{team.college}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#9DB0D0] hover:text-white rounded-lg hover:bg-[#132247] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <TeamUniqueQrSection team={team} />

        <div className="mt-5 pt-4 border-t border-[#78AAFF]/20 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#132247] hover:bg-[#1a2d5c] border border-[#35E0FF]/30 flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-[#35E0FF]" />
            <span>Print Pass</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#35E0FF] to-[#3A7BFF] cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
