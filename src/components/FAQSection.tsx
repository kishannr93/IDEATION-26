import React, { useState } from 'react';
import { useHackathon } from '../context/HackathonContext';
import { HelpCircle, ChevronDown, ChevronUp, Search } from 'lucide-react';

export const FAQSection: React.FC = () => {
  const { faqs } = useHackathon();
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaqId, setOpenFaqId] = useState<string | null>(faqs[0]?.id || null);

  const filteredFaqs = faqs.filter(f =>
    f.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleFaq = (id: string) => {
    setOpenFaqId(prev => (prev === id ? null : id));
  };

  return (
    <section id="faq" className="py-24 px-4 sm:px-6 lg:px-8 border-t border-[#78AAFF]/15 bg-[#081024] relative">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#35E0FF] mb-2">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Got Questions?</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold font-display text-white tracking-tight">
            Frequently Asked <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#35E0FF] via-white to-[#35E0FF]">Questions</span>
          </h2>
          <p className="text-base text-[#9DB0D0] mt-3">
            Everything you need to know about team registration, accommodation, hardware benches, and judging.
          </p>

          {/* Search bar */}
          <div className="mt-8 relative max-w-md mx-auto">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9DB0D0]" />
            <input
              type="text"
              placeholder="Search questions (e.g. fee, hardware, food)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#0C1630] border border-[#78AAFF]/20 rounded-xl text-xs text-white placeholder-[#9DB0D0]/60 focus:outline-none focus:border-[#35E0FF] transition-colors"
            />
          </div>
        </div>

        {/* FAQs Accordion */}
        <div className="space-y-3">
          {filteredFaqs.length === 0 ? (
            <div className="text-center py-10 rounded-2xl bg-[#0C1630] border border-[#78AAFF]/15 text-sm text-[#9DB0D0]">
              No questions found matching "{searchQuery}". Contact our helpline!
            </div>
          ) : (
            filteredFaqs.map((faq) => {
              const isOpen = openFaqId === faq.id;
              return (
                <div
                  key={faq.id}
                  className="rounded-2xl bg-[#0C1630] border border-[#78AAFF]/20 overflow-hidden transition-all duration-200"
                >
                  <button
                    onClick={() => toggleFaq(faq.id)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 hover:bg-[#132247]/50 transition-colors"
                  >
                    <span className="font-semibold text-white text-sm sm:text-base">
                      {faq.question}
                    </span>
                    {isOpen ? (
                      <ChevronUp className="w-5 h-5 text-[#35E0FF] shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-[#9DB0D0] shrink-0" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-sm text-[#9DB0D0] leading-relaxed border-t border-[#78AAFF]/10">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
};
