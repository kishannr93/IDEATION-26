import React from 'react';
import { Building2, Award, Globe, ExternalLink } from 'lucide-react';
import hackathonStageImg from '../assets/images/ideation_hackathon_stage_1791994393908.jpg';
import heroBulbImg from '../assets/images/ideation_logo.jpg';
import trophyImg from '../assets/images/ideation_trophy_showcase_1791994392466.jpg';

export const SponsorsGallerySection: React.FC = () => {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-[#78AAFF]/15 bg-[#050B1A]">
      <div className="max-w-7xl mx-auto">
        {/* Institutional & Organizing Partners */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#35E0FF] mb-2">
            <Building2 className="w-3.5 h-3.5" />
            <span>Under the Auspices of</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold font-display text-white">
            Institutions & Organizers
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="p-6 rounded-2xl bg-[#0C1630] border border-[#78AAFF]/20 text-center flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#132247] mx-auto flex items-center justify-center text-[#35E0FF] font-bold text-lg mb-3">
                BEA
              </div>
              <h3 className="text-lg font-bold font-display text-white">Bapuji Educational Association</h3>
              <p className="text-xs text-[#9DB0D0] mt-2">
                Premier educational body managing premier medical, engineering, and polytechnic institutions across Karnataka since 1958.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#78AAFF]/10 text-[11px] font-mono text-[#35E0FF]">
              Registered Educational Trust
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-gradient-to-b from-[#11234D] to-[#0C1630] border border-[#35E0FF]/40 text-center flex flex-col justify-between shadow-[0_0_25px_rgba(53,224,255,0.15)]">
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#35E0FF]/20 mx-auto flex items-center justify-center text-[#35E0FF] font-bold text-lg mb-3">
                BIET
              </div>
              <h3 className="text-lg font-bold font-display text-white">BIET Davangere</h3>
              <p className="text-xs text-[#9DB0D0] mt-2">
                An Autonomous Institute affiliated to Visvesvaraya Technological University (VTU), Belagavi. Recognized by AICTE and accredited by NBA & NAAC.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#78AAFF]/10 text-[11px] font-mono text-emerald-300">
              Host Campus & Lab Infrastructure
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[#0C1630] border border-[#78AAFF]/20 text-center flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#132247] mx-auto flex items-center justify-center text-[#FF4FD8] font-bold text-lg mb-3">
                AC
              </div>
              <h3 className="text-lg font-bold font-display text-white">Anveshan Club</h3>
              <p className="text-xs text-[#9DB0D0] mt-2">
                The official innovation, research and robotics club of BIET fostering student hackathons, hardware prototypes, and national engineering contests.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#78AAFF]/10 text-[11px] font-mono text-[#FF4FD8]">
              Organizing Body · IDEATION 2026
            </div>
          </div>
        </div>

        {/* Atmosphere Gallery */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display font-bold text-xl text-white">Visual Showcase</h3>
            <span className="text-xs font-mono text-[#9DB0D0]">Innovation Crucible</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="relative rounded-2xl overflow-hidden aspect-video border border-[#78AAFF]/20 group">
              <img 
                src={hackathonStageImg} 
                alt="Hackathon arena" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-4">
                <span className="text-xs font-tech font-bold text-white">24-Hour Hacking Arena</span>
              </div>
            </div>

            <div className="relative rounded-2xl overflow-hidden aspect-video border border-[#78AAFF]/20 group">
              <img 
                src={trophyImg} 
                alt="Grand Trophy" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-4">
                <span className="text-xs font-tech font-bold text-amber-300">₹1,00,000 Grand Trophy</span>
              </div>
            </div>

            <div className="relative rounded-2xl overflow-hidden aspect-video border border-[#78AAFF]/20 group">
              <img 
                src={heroBulbImg} 
                alt="Emblem" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-4">
                <span className="text-xs font-tech font-bold text-[#35E0FF]">From Idea to Impact</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
