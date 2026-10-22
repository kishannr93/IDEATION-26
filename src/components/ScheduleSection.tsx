import React, { useState } from 'react';
import { useHackathon } from '../context/HackathonContext';
import { ScheduleEvent } from '../types';
import {
  Clock,
  Calendar,
  Shield,
  ShieldCheck,
  Lock,
  Unlock,
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  RotateCcw,
  Sparkles,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import {
  verifyAdminCredentials,
  isSessionAdmin,
  getSessionAdminUser,
  setSessionAdmin,
} from '../lib/adminAuth';

export const ScheduleSection: React.FC = () => {
  const {
    schedule,
    updateSchedule,
    addScheduleEvent,
    updateScheduleEvent,
    deleteScheduleEvent,
    resetScheduleToDefault,
  } = useHackathon();

  const [selectedDay, setSelectedDay] = useState<'All' | 'Day 1 (18 Nov)' | 'Day 2 (19 Nov)'>('All');

  // Admin authentication state
  const [isAdminMode, setIsAdminMode] = useState<boolean>(() => isSessionAdmin());
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPasskey, setAdminPasskey] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccessMsg, setAuthSuccessMsg] = useState('');

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<ScheduleEvent>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEvent, setNewEvent] = useState<Omit<ScheduleEvent, 'id'>>({
    time: '10:00 AM',
    title: '',
    description: '',
    category: 'Milestone',
    day: 'Day 1 (18 Nov)',
  });

  const filteredSchedule =
    selectedDay === 'All' ? schedule : schedule.filter((s) => s.day === selectedDay);

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'Milestone':
        return 'bg-[#35E0FF]/15 text-[#35E0FF] border-[#35E0FF]/30';
      case 'Mentoring':
        return 'bg-[#FF4FD8]/15 text-[#FF4FD8] border-[#FF4FD8]/30';
      case 'Food & Break':
        return 'bg-[#FF8A2A]/15 text-amber-300 border-[#FF8A2A]/30';
      case 'Judging':
        return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
      case 'Ceremony':
        return 'bg-[#FFC83D]/15 text-[#FFC83D] border-[#FFC83D]/30';
      default:
        return 'bg-slate-500/15 text-slate-300 border-slate-500/30';
    }
  };

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const res = verifyAdminCredentials(adminEmail, adminPasskey);
    if (res.success && res.user) {
      setSessionAdmin(res.user);
      setIsAdminMode(true);
      setAuthSuccessMsg(`Welcome, ${res.user.name}! Admin editing unlocked.`);
      setTimeout(() => {
        setShowAuthModal(false);
        setAuthSuccessMsg('');
        setAdminEmail('');
        setAdminPasskey('');
      }, 1000);
    } else {
      setAuthError(res.error || 'Authentication failed. Please verify credentials.');
    }
  };

  const handleStartEdit = (item: ScheduleEvent) => {
    setEditingId(item.id);
    setEditForm({ ...item });
  };

  const handleSaveEdit = (id: string) => {
    if (editForm.title?.trim()) {
      updateScheduleEvent(id, editForm);
      setEditingId(null);
      setEditForm({});
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title.trim()) return;
    addScheduleEvent(newEvent);
    setNewEvent({
      time: '12:00 PM',
      title: '',
      description: '',
      category: 'Milestone',
      day: 'Day 1 (18 Nov)',
    });
    setShowAddForm(false);
  };

  return (
    <section id="schedule" className="py-24 px-4 sm:px-6 lg:px-8 border-t border-[#78AAFF]/15 bg-[#081024] relative">
      <div className="max-w-5xl mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#35E0FF] mb-2">
            <Clock className="w-3.5 h-3.5" />
            <span>24 Hours Continuous Timeline</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold font-display text-white tracking-tight">
            Event <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#35E0FF] via-white to-[#35E0FF]">Schedule</span>
          </h2>
          <p className="text-base text-[#9DB0D0] mt-3">
            From the opening bell to the final pitch. High-energy checkpoints, mentoring clinics, midnight fuel, and live jury evaluations.
          </p>

          {/* Admin Control Bar */}
          <div className="mt-5 flex items-center justify-center gap-3">
            {!isAdminMode ? (
              <button
                type="button"
                onClick={() => setShowAuthModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono text-[#9DB0D0] hover:text-[#35E0FF] bg-[#0C1630] border border-[#78AAFF]/20 hover:border-[#35E0FF]/40 transition-all cursor-pointer shadow-sm"
              >
                <Lock className="w-3.5 h-3.5 text-[#35E0FF]" />
                <span>Admin Authentication & Schedule Editor</span>
              </button>
            ) : (
              <div className="inline-flex flex-wrap items-center gap-2 p-1.5 px-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono">
                <span className="flex items-center gap-1.5 font-bold">
                  <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Admin Mode Active</span>
                </span>
                <span className="text-[#9DB0D0]">·</span>
                <button
                  type="button"
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="px-2 py-1 rounded bg-[#35E0FF]/20 text-[#35E0FF] hover:bg-[#35E0FF]/30 font-semibold transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Event</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Reset the schedule back to default events?')) {
                      resetScheduleToDefault();
                    }
                  }}
                  className="px-2 py-1 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 font-semibold transition-colors flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Default</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsAdminMode(false)}
                  className="px-2 py-1 rounded bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 font-semibold transition-colors flex items-center gap-1"
                >
                  <Lock className="w-3 h-3" />
                  <span>Lock Editor</span>
                </button>
              </div>
            )}
          </div>

          {/* Interactive Day Filter Tabs */}
          <div className="mt-6 inline-flex items-center gap-1 p-1 bg-[#0C1630] rounded-xl border border-[#78AAFF]/20">
            <button
              onClick={() => setSelectedDay('All')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                selectedDay === 'All'
                  ? 'bg-gradient-to-r from-[#35E0FF] to-[#3A7BFF] text-slate-950 shadow-md'
                  : 'text-[#9DB0D0] hover:text-white'
              }`}
            >
              Full 24-Hr Flow
            </button>
            <button
              onClick={() => setSelectedDay('Day 1 (18 Nov)')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                selectedDay === 'Day 1 (18 Nov)'
                  ? 'bg-gradient-to-r from-[#35E0FF] to-[#3A7BFF] text-slate-950 shadow-md'
                  : 'text-[#9DB0D0] hover:text-white'
              }`}
            >
              Day 1 (18 Nov)
            </button>
            <button
              onClick={() => setSelectedDay('Day 2 (19 Nov)')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                selectedDay === 'Day 2 (19 Nov)'
                  ? 'bg-gradient-to-r from-[#35E0FF] to-[#3A7BFF] text-slate-950 shadow-md'
                  : 'text-[#9DB0D0] hover:text-white'
              }`}
            >
              Day 2 (19 Nov)
            </button>
          </div>
        </div>

        {/* ADMIN ADD EVENT DRAWER */}
        {isAdminMode && showAddForm && (
          <div className="mb-8 p-6 rounded-2xl bg-[#0C1630] border-2 border-[#35E0FF]/40 shadow-[0_0_30px_rgba(53,224,255,0.15)] animate-in fade-in slide-in-from-top-4 duration-200">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#78AAFF]/20">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#35E0FF]" />
                <span>Add New Schedule Event</span>
              </h3>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-[#9DB0D0] hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[#9DB0D0] mb-1">Time Slot *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 08:30 AM - 10:00 AM"
                    value={newEvent.time}
                    onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                    className="w-full px-3 py-2 bg-[#081024] border border-[#78AAFF]/20 rounded-xl text-white focus:outline-none focus:border-[#35E0FF]"
                  />
                </div>

                <div>
                  <label className="block text-[#9DB0D0] mb-1">Day *</label>
                  <select
                    value={newEvent.day}
                    onChange={(e) => setNewEvent({ ...newEvent, day: e.target.value as any })}
                    className="w-full px-3 py-2 bg-[#081024] border border-[#78AAFF]/20 rounded-xl text-white focus:outline-none focus:border-[#35E0FF]"
                  >
                    <option value="Day 1 (18 Nov)">Day 1 (18 Nov)</option>
                    <option value="Day 2 (19 Nov)">Day 2 (19 Nov)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#9DB0D0] mb-1">Category *</label>
                  <select
                    value={newEvent.category}
                    onChange={(e) => setNewEvent({ ...newEvent, category: e.target.value as any })}
                    className="w-full px-3 py-2 bg-[#081024] border border-[#78AAFF]/20 rounded-xl text-white focus:outline-none focus:border-[#35E0FF]"
                  >
                    <option value="Milestone">Milestone</option>
                    <option value="Mentoring">Mentoring</option>
                    <option value="Food & Break">Food & Break</option>
                    <option value="Judging">Judging</option>
                    <option value="Ceremony">Ceremony</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[#9DB0D0] mb-1">Event Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Round 2 Architectural Review"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  className="w-full px-3 py-2 bg-[#081024] border border-[#78AAFF]/20 rounded-xl text-white focus:outline-none focus:border-[#35E0FF]"
                />
              </div>

              <div>
                <label className="block text-[#9DB0D0] mb-1">Event Description *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Details of the checkpoint, deliverables, or refreshments provided..."
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  className="w-full px-3 py-2 bg-[#081024] border border-[#78AAFF]/20 rounded-xl text-white focus:outline-none focus:border-[#35E0FF]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#9DB0D0] hover:text-white bg-[#081024] border border-[#78AAFF]/20"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#0052FF] to-[#35E0FF] hover:brightness-110 shadow-md"
                >
                  Save Schedule Item
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Timeline Stream */}
        <div className="relative pl-6 sm:pl-8 border-l border-[#35E0FF]/30 space-y-8">
          {filteredSchedule.map((item) => {
            const isEditingThis = editingId === item.id;

            return (
              <div key={item.id} className="relative group">
                {/* Timeline Node Dot */}
                <div className="absolute -left-[31px] sm:-left-[39px] top-1.5 w-4 h-4 rounded-full bg-[#081024] border-2 border-[#35E0FF] group-hover:scale-125 group-hover:bg-[#35E0FF] transition-all duration-300 shadow-[0_0_10px_rgba(53,224,255,0.6)]" />

                {/* Event Card / In-place Editor */}
                <div className="p-5 sm:p-6 rounded-2xl bg-[#0C1630] border border-[#78AAFF]/20 hover:border-[#35E0FF]/40 transition-all duration-200">
                  {isEditingThis ? (
                    /* Inline Editing Mode */
                    <div className="space-y-3 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[11px] text-[#9DB0D0] mb-1">Time</label>
                          <input
                            type="text"
                            value={editForm.time || ''}
                            onChange={(e) => setEditForm({ ...editForm, time: e.target.value })}
                            className="w-full px-2.5 py-1.5 bg-[#081024] border border-[#35E0FF]/40 rounded-lg text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-[#9DB0D0] mb-1">Day</label>
                          <select
                            value={editForm.day || 'Day 1 (18 Nov)'}
                            onChange={(e) => setEditForm({ ...editForm, day: e.target.value as any })}
                            className="w-full px-2.5 py-1.5 bg-[#081024] border border-[#35E0FF]/40 rounded-lg text-white"
                          >
                            <option value="Day 1 (18 Nov)">Day 1 (18 Nov)</option>
                            <option value="Day 2 (19 Nov)">Day 2 (19 Nov)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] text-[#9DB0D0] mb-1">Category</label>
                          <select
                            value={editForm.category || 'Milestone'}
                            onChange={(e) =>
                              setEditForm({ ...editForm, category: e.target.value as any })
                            }
                            className="w-full px-2.5 py-1.5 bg-[#081024] border border-[#35E0FF]/40 rounded-lg text-white"
                          >
                            <option value="Milestone">Milestone</option>
                            <option value="Mentoring">Mentoring</option>
                            <option value="Food & Break">Food & Break</option>
                            <option value="Judging">Judging</option>
                            <option value="Ceremony">Ceremony</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] text-[#9DB0D0] mb-1">Title</label>
                        <input
                          type="text"
                          value={editForm.title || ''}
                          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                          className="w-full px-2.5 py-1.5 bg-[#081024] border border-[#35E0FF]/40 rounded-lg text-white font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-[#9DB0D0] mb-1">Description</label>
                        <textarea
                          rows={2}
                          value={editForm.description || ''}
                          onChange={(e) =>
                            setEditForm({ ...editForm, description: e.target.value })
                          }
                          className="w-full px-2.5 py-1.5 bg-[#081024] border border-[#35E0FF]/40 rounded-lg text-white"
                        />
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#78AAFF]/15">
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="px-3 py-1.5 rounded-lg text-xs text-[#9DB0D0] hover:text-white bg-[#081024]"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(item.id)}
                          className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-[#35E0FF] flex items-center gap-1.5"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>Save Changes</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Display Mode */
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-[#35E0FF] tabular-nums">
                            {item.time}
                          </span>
                          <span className="text-xs text-[#9DB0D0] font-tech">· {item.day}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full border ${getCategoryBadgeClass(
                              item.category
                            )}`}
                          >
                            {item.category}
                          </span>

                          {isAdminMode && (
                            <div className="flex items-center gap-1 ml-2">
                              <button
                                type="button"
                                onClick={() => handleStartEdit(item)}
                                className="p-1 rounded text-[#9DB0D0] hover:text-[#35E0FF] hover:bg-[#081024] transition-colors"
                                title="Edit this schedule event"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (window.confirm(`Delete "${item.title}" from schedule?`)) {
                                    deleteScheduleEvent(item.id);
                                  }
                                }}
                                className="p-1 rounded text-[#9DB0D0] hover:text-rose-400 hover:bg-[#081024] transition-colors"
                                title="Delete this event"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <h3 className="text-base sm:text-lg font-bold font-display text-white group-hover:text-[#35E0FF] transition-colors">
                        {item.title}
                      </h3>

                      <p className="text-xs sm:text-sm text-[#9DB0D0] mt-1.5 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ADMIN AUTHENTICATION MODAL */}
      {showAuthModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowAuthModal(false)}
        >
          <div
            className="w-full max-w-md bg-[#081024] border border-[#35E0FF]/40 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(53,224,255,0.25)] relative text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-5 right-5 p-1.5 text-[#9DB0D0] hover:text-white rounded-lg hover:bg-[#0C1630]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-[#0C1630] border border-[#35E0FF]/30 mx-auto flex items-center justify-center mb-3 text-[#35E0FF]">
              <Shield className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-bold font-display text-white">Admin Authentication</h3>
            <p className="text-xs text-[#9DB0D0] mt-1 mb-6">
              Enter your official administrator email and security passkey to edit the schedule.
            </p>

            {authError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 text-left">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            {authSuccessMsg && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 text-left">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{authSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-semibold text-white mb-1">
                  Official Email *
                </label>
                <input
                  type="email"
                  required
                  placeholder="Enter the Official email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#0C1630] border border-[#78AAFF]/20 rounded-xl text-xs text-white focus:outline-none focus:border-[#35E0FF]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white mb-1">
                  Security Passkey *
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••"
                  value={adminPasskey}
                  onChange={(e) => setAdminPasskey(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#0C1630] border border-[#78AAFF]/20 rounded-xl text-xs text-white focus:outline-none focus:border-[#35E0FF]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-[#FF8A2A] to-[#F5611A] shadow-[0_0_20px_rgba(255,138,42,0.4)] hover:brightness-110 active:scale-95 transition-all cursor-pointer"
              >
                Authenticate & Unlock Schedule
              </button>
            </form>

            <div className="mt-5 pt-3 border-t border-[#78AAFF]/15 text-[11px] text-[#9DB0D0] flex items-center justify-center gap-1 font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-[#35E0FF]" />
              <span>Authorized Anveshan Coordinators & BIET Admins</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
