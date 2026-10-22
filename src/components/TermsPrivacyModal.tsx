import React from 'react';
import { X, ShieldCheck, FileText } from 'lucide-react';

interface TermsPrivacyModalProps {
  type: 'terms' | 'privacy' | null;
  onClose: () => void;
}

export const TermsPrivacyModal: React.FC<TermsPrivacyModalProps> = ({ type, onClose }) => {
  if (!type) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl bg-[#081024] border border-[#35E0FF]/30 rounded-3xl p-6 sm:p-8 max-h-[85vh] overflow-y-auto shadow-2xl text-left"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-[#78AAFF]/20">
          <div className="flex items-center gap-2">
            {type === 'terms' ? <FileText className="w-5 h-5 text-[#35E0FF]" /> : <ShieldCheck className="w-5 h-5 text-emerald-400" />}
            <h3 className="text-xl font-bold font-display text-white">
              {type === 'terms' ? 'Terms & Code of Conduct' : 'Data Privacy Policy'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#9DB0D0] hover:text-white rounded-lg hover:bg-[#132247]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-5 space-y-4 text-xs text-[#9DB0D0] leading-relaxed">
          {type === 'terms' ? (
            <>
              <h4 className="font-bold text-white text-sm">1. Event Participation & Eligibility</h4>
              <p>
                IDEATION 2026 is organized by Anveshan Club at Bapuji Institute of Engineering and Technology (BIET), Davangere. Participation is strictly open to students currently pursuing B.E / B.Tech, M.Tech, and MCA. Valid physical institutional identity cards must be produced during reporting.
              </p>

              <h4 className="font-bold text-white text-sm">2. Team Integrity & Code Originality</h4>
              <p>
                Teams must consist of 3 or 4 members. All application development, hardware wiring, and algorithmic scripting must take place within the designated 24 hours (18-19 November 2026). Pre-built proprietary software or hardware submitted without modification will result in instant disqualification.
              </p>

              <h4 className="font-bold text-white text-sm">3. Intellectual Property</h4>
              <p>
                All intellectual property, source code, and design prototypes developed during IDEATION 2026 belong solely to the participating teams. BIET and Anveshan Club claim no ownership over student inventions.
              </p>

              <h4 className="font-bold text-white text-sm">4. Registration Fee & Cancellation</h4>
              <p>
                The registration fee of ₹100 per team covers event badges, meals, snacks, lab access, and participation certificates. Registration fees are non-refundable once desk kits have been assigned.
              </p>
            </>
          ) : (
            <>
              <h4 className="font-bold text-white text-sm">1. Information We Collect</h4>
              <p>
                We collect team leader email addresses, participant names, phone numbers, University Seat Numbers (USNs), departmental branches, and payment transaction identifiers solely for registration processing, event desk verification, and badge issuance.
              </p>

              <h4 className="font-bold text-white text-sm">2. Public vs Private Data</h4>
              <p>
                Phone numbers and emails of student coordinators and participants are kept confidential and are never sold or shared with external advertising third parties. Coordinator contact numbers are displayed only for event helpline purposes.
              </p>

              <h4 className="font-bold text-white text-sm">3. Media & Photography Consent</h4>
              <p>
                By participating in IDEATION 2026, attendees grant Anveshan Club and BIET permission to capture photographs and video recordings of prototype presentations and the awards ceremony for non-commercial educational archives and promotional reporting.
              </p>
            </>
          )}
        </div>

        <div className="pt-4 border-t border-[#78AAFF]/20 text-right">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-[#132247] hover:bg-[#1a2d5c]"
          >
            Understood & Close
          </button>
        </div>
      </div>
    </div>
  );
};
