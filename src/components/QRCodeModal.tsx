import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { X, Download, Share2, Sparkles, Check } from 'lucide-react';
import bulbImg from '../assets/images/ideation_logo.jpg';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({ isOpen, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = React.useState(false);

  const registrationUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}?action=register` 
    : 'https://bietdvg.edu/ideation2026';

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        registrationUrl,
        {
          width: 320,
          margin: 2,
          color: {
            dark: '#050B1A',
            light: '#FFFFFF',
          },
        },
        (error) => {
          if (error) console.error(error);
        }
      );
    }
  }, [isOpen, registrationUrl]);

  if (!isOpen) return null;

  const downloadQR = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = 'IDEATION_2026_Registration_QR.png';
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  const copyLink = () => {
    navigator.clipboard.writeText(registrationUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md bg-[#081024] border border-[#35E0FF]/40 rounded-3xl p-6 sm:p-8 shadow-[0_0_60px_rgba(53,224,255,0.25)] text-center animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#78AAFF]/20 text-left">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl overflow-hidden bg-[#0C1630] border border-[#35E0FF]/40 p-0.5 flex items-center justify-center shadow-[0_0_12px_rgba(53,224,255,0.25)]">
              <img src={bulbImg} alt="IDEATION" className="w-full h-full object-contain" />
            </div>
            <div>
              <h3 className="text-base font-bold font-display text-white">Event Poster QR</h3>
              <p className="text-[11px] text-[#9DB0D0]">Official Registration Link</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#9DB0D0] hover:text-white rounded-lg hover:bg-[#132247]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* QR Canvas Container with Poster Style */}
        <div className="my-6 p-5 rounded-2xl bg-gradient-to-b from-[#0C1630] to-[#050B1A] border border-[#35E0FF]/30 inline-block shadow-inner">
          <div className="p-3 bg-white rounded-xl shadow-lg inline-block">
            <canvas ref={canvasRef} className="w-60 h-60" />
          </div>
          <div className="mt-3 text-xs font-mono text-[#35E0FF] uppercase tracking-wider font-semibold">
            Scan to Register · ₹100 per team
          </div>
        </div>

        {/* URL Pill */}
        <div className="p-2.5 rounded-xl bg-[#0C1630] border border-[#78AAFF]/20 flex items-center justify-between gap-2 text-xs font-mono text-[#9DB0D0] mb-6">
          <span className="truncate">{registrationUrl}</span>
          <button
            onClick={copyLink}
            className="px-2.5 py-1 bg-[#132247] hover:bg-[#1a2d5c] text-white rounded text-[11px] font-sans shrink-0 flex items-center gap-1 transition-colors"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Share2 className="w-3 h-3" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={downloadQR}
            className="w-full py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-[#FF8A2A] to-[#F5611A] shadow-[0_0_20px_rgba(255,138,42,0.4)] hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Download High-Res PNG</span>
          </button>
        </div>
      </div>
    </div>
  );
};
