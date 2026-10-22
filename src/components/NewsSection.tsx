import React, { useState } from 'react';
import { useHackathon } from '../context/HackathonContext';
import { Bell, Search, Pin, Calendar, Tag, AlertTriangle, Megaphone } from 'lucide-react';

export const NewsSection: React.FC = () => {
  const { announcements } = useHackathon();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | 'Update' | 'Deadline' | 'Result' | 'Urgent'>('All');

  const filteredAnnouncements = announcements.filter(item => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'Urgent':
        return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
      case 'Deadline':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'Result':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      case 'Update':
      default:
        return 'bg-[#35E0FF]/15 text-[#35E0FF] border-[#35E0FF]/30';
    }
  };

  return (
    <section id="news" className="py-24 px-4 sm:px-6 lg:px-8 border-t border-[#78AAFF]/15 bg-[#081024] relative">
      <div className="max-w-5xl mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#35E0FF] mb-2">
            <Bell className="w-3.5 h-3.5" />
            <span>Official Dispatches & Updates</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold font-display text-white tracking-tight">
            Latest <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#35E0FF] via-white to-[#35E0FF]">Announcements</span>
          </h2>
          <p className="text-base text-[#9DB0D0] mt-3">
            Real-time logistical bulletins, hardware checkout alerts, schedule notices, and evaluation releases.
          </p>
        </div>

        {/* Controls: Search + Category Filters */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          {/* Search bar */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9DB0D0]" />
            <input
              type="text"
              placeholder="Search announcements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#0C1630] border border-[#78AAFF]/20 rounded-xl text-xs text-white placeholder-[#9DB0D0]/60 focus:outline-none focus:border-[#35E0FF] transition-colors"
            />
          </div>

          {/* Segmented category filters */}
          <div className="flex items-center gap-1 overflow-x-auto p-1 bg-[#0C1630] rounded-xl border border-[#78AAFF]/20 w-full sm:w-auto">
            {(['All', 'Update', 'Deadline', 'Urgent', 'Result'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-[#132247] text-[#35E0FF] shadow-sm'
                    : 'text-[#9DB0D0] hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Announcements Stream */}
        <div className="space-y-4">
          {filteredAnnouncements.length === 0 ? (
            <div className="text-center py-16 rounded-3xl bg-[#0C1630] border border-[#78AAFF]/15 p-8 max-w-xl mx-auto">
              <Megaphone className="w-10 h-10 text-[#78AAFF]/40 mx-auto mb-3" />
              <h4 className="text-base font-bold text-white mb-1">
                {announcements.length === 0 ? 'No Announcements Yet' : 'No Matching Dispatches'}
              </h4>
              <p className="text-xs text-[#9DB0D0]">
                {announcements.length === 0
                  ? 'Official dispatches, lab allocations, and schedule updates will be published here by the Anveshan Core Team.'
                  : 'Try clearing your search query or choosing another category filter.'}
              </p>
            </div>
          ) : (
            filteredAnnouncements.map((item) => (
              <div
                key={item.id}
                className={`p-6 rounded-2xl transition-all duration-200 ${
                  item.pinned
                    ? 'bg-[#0C1630] border-2 border-[#35E0FF]/40 shadow-[0_0_20px_rgba(53,224,255,0.1)]'
                    : 'bg-[#0C1630] border border-[#78AAFF]/20 hover:border-[#78AAFF]/40'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    {item.pinned && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-[#35E0FF] bg-[#35E0FF]/15 px-2 py-0.5 rounded border border-[#35E0FF]/30">
                        <Pin className="w-3 h-3" />
                        <span>PINNED</span>
                      </span>
                    )}
                    <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full border ${getCategoryColor(item.category)}`}>
                      {item.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-[#9DB0D0] font-mono">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{item.date}</span>
                    </span>
                    <span>· {item.author}</span>
                  </div>
                </div>

                <h3 className="text-lg font-bold font-display text-white">
                  {item.title}
                </h3>

                <p className="text-xs sm:text-sm text-[#9DB0D0] mt-2 leading-relaxed">
                  {item.content}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
};
