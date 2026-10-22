import React, { useState } from 'react';
import { useHackathon } from '../context/HackathonContext';
import { RuleItem } from '../types';
import {
  ChevronDown,
  ChevronUp,
  Scale,
  CheckCircle,
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
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import {
  verifyAdminCredentials,
  isSessionAdmin,
  getSessionAdminUser,
  setSessionAdmin,
} from '../lib/adminAuth';

export const RulesSection: React.FC = () => {
  const { rules, eventConfig, updateRule, addRule, deleteRule, resetRulesToDefault } =
    useHackathon();

  const [openRuleId, setOpenRuleId] = useState<string | null>(rules[0]?.id || null);

  // Admin authentication state
  const [isAdminMode, setIsAdminMode] = useState<boolean>(() => isSessionAdmin());
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPasskey, setAdminPasskey] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccessMsg, setAuthSuccessMsg] = useState('');

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<RuleItem>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRule, setNewRule] = useState<Omit<RuleItem, 'id'>>({
    category: 'Eligibility',
    title: '',
    details: '',
  });

  const toggleRule = (id: string) => {
    if (editingId === id) return; // Don't collapse if editing
    setOpenRuleId((prev) => (prev === id ? null : id));
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

  const handleStartEdit = (rule: RuleItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(rule.id);
    setEditForm({ ...rule });
    setOpenRuleId(rule.id);
  };

  const handleSaveEdit = (id: string) => {
    if (editForm.title?.trim() && editForm.details?.trim()) {
      updateRule(id, editForm);
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
    if (!newRule.title.trim() || !newRule.details.trim()) return;
    addRule(newRule);
    setNewRule({
      category: 'General',
      title: '',
      details: '',
    });
    setShowAddForm(false);
  };

  return (
    <section id="rules" className="py-24 px-4 sm:px-6 lg:px-8 border-t border-[#78AAFF]/15 bg-[#050B1A] relative">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#FF4FD8] mb-2">
            <Scale className="w-3.5 h-3.5" />
            <span>Guidelines & Code of Conduct</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold font-display text-white tracking-tight">
            Rules & <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF4FD8] via-white to-[#35E0FF]">Eligibility</span>
          </h2>
          <p className="text-base text-[#9DB0D0] mt-3">
            Clear, transparent expectations to ensure fair play, intellectual property integrity, and high-impact innovation.
          </p>

          {/* Admin Control Bar */}
          <div className="mt-5 flex items-center justify-center gap-3">
            {!isAdminMode ? (
              <button
                type="button"
                onClick={() => setShowAuthModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono text-[#9DB0D0] hover:text-[#FF4FD8] bg-[#0C1630] border border-[#78AAFF]/20 hover:border-[#FF4FD8]/40 transition-all cursor-pointer shadow-sm"
              >
                <Lock className="w-3.5 h-3.5 text-[#FF4FD8]" />
                <span>Admin Authentication & Rules Editor</span>
              </button>
            ) : (
              <div className="inline-flex flex-wrap items-center gap-2 p-1.5 px-3 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-mono">
                <span className="flex items-center gap-1.5 font-bold">
                  <Unlock className="w-3.5 h-3.5 text-purple-400" />
                  <span>Admin Mode Active</span>
                </span>
                <span className="text-[#9DB0D0]">·</span>
                <button
                  type="button"
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="px-2 py-1 rounded bg-[#FF4FD8]/20 text-[#FF4FD8] hover:bg-[#FF4FD8]/30 font-semibold transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Rule</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Reset all rules back to default event guidelines?')) {
                      resetRulesToDefault();
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
        </div>

        {/* Quick Highlights Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
          <div className="p-4 rounded-xl bg-[#0C1630] border border-[#78AAFF]/20 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <div className="text-xs font-bold text-white">Eligible Programs</div>
              <div className="text-[11px] text-[#9DB0D0]">B.E / B.Tech, M.Tech, MCA</div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#0C1630] border border-[#78AAFF]/20 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-[#35E0FF] shrink-0" />
            <div>
              <div className="text-xs font-bold text-white">Team Composition</div>
              <div className="text-[11px] text-[#9DB0D0]">Strictly 3 or 4 members</div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#0C1630] border border-[#78AAFF]/20 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-[#FF8A2A] shrink-0" />
            <div>
              <div className="text-xs font-bold text-white">Nominal Entry Fee</div>
              <div className="text-[11px] text-[#9DB0D0]">₹{eventConfig.entryFee} per team (Total)</div>
            </div>
          </div>
        </div>

        {/* ADMIN ADD RULE DRAWER */}
        {isAdminMode && showAddForm && (
          <div className="mb-8 p-6 rounded-2xl bg-[#0C1630] border-2 border-[#FF4FD8]/40 shadow-[0_0_30px_rgba(255,79,216,0.15)] animate-in fade-in slide-in-from-top-4 duration-200">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#78AAFF]/20">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#FF4FD8]" />
                <span>Add New Event Rule / Guideline</span>
              </h3>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-[#9DB0D0] hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#9DB0D0] mb-1">Category *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Code of Conduct, Hardware Policy, Judging"
                    value={newRule.category}
                    onChange={(e) => setNewRule({ ...newRule, category: e.target.value })}
                    className="w-full px-3 py-2 bg-[#081024] border border-[#78AAFF]/20 rounded-xl text-white focus:outline-none focus:border-[#FF4FD8]"
                  />
                </div>

                <div>
                  <label className="block text-[#9DB0D0] mb-1">Rule Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. WiFi & Power Strip Access"
                    value={newRule.title}
                    onChange={(e) => setNewRule({ ...newRule, title: e.target.value })}
                    className="w-full px-3 py-2 bg-[#081024] border border-[#78AAFF]/20 rounded-xl text-white focus:outline-none focus:border-[#FF4FD8]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#9DB0D0] mb-1">Full Rule Details *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Detailed clause, requirements, consequences, or evaluation guidance..."
                  value={newRule.details}
                  onChange={(e) => setNewRule({ ...newRule, details: e.target.value })}
                  className="w-full px-3 py-2 bg-[#081024] border border-[#78AAFF]/20 rounded-xl text-white focus:outline-none focus:border-[#FF4FD8]"
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
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#FF4FD8] to-[#9900F0] hover:brightness-110 shadow-md"
                >
                  Save New Rule
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Accordion List */}
        <div className="space-y-3">
          {rules.map((rule) => {
            const isOpen = openRuleId === rule.id;
            const isEditingThis = editingId === rule.id;

            return (
              <div
                key={rule.id}
                className="rounded-2xl bg-[#0C1630] border border-[#78AAFF]/20 overflow-hidden transition-all duration-200 hover:border-[#78AAFF]/40"
              >
                {isEditingThis ? (
                  /* Inline Edit Form */
                  <div className="p-5 space-y-3 text-xs bg-[#081024]">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-[#9DB0D0] mb-1">Category</label>
                        <input
                          type="text"
                          value={editForm.category || ''}
                          onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                          className="w-full px-2.5 py-1.5 bg-[#0C1630] border border-[#FF4FD8]/40 rounded-lg text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-[#9DB0D0] mb-1">Title</label>
                        <input
                          type="text"
                          value={editForm.title || ''}
                          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                          className="w-full px-2.5 py-1.5 bg-[#0C1630] border border-[#FF4FD8]/40 rounded-lg text-white font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] text-[#9DB0D0] mb-1">Details</label>
                      <textarea
                        rows={3}
                        value={editForm.details || ''}
                        onChange={(e) => setEditForm({ ...editForm, details: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-[#0C1630] border border-[#FF4FD8]/40 rounded-lg text-white"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#78AAFF]/15">
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="px-3 py-1.5 rounded-lg text-xs text-[#9DB0D0] hover:text-white bg-[#0C1630]"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(rule.id)}
                        className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-[#35E0FF] flex items-center gap-1.5"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Save Rule</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Normal Accordion View */
                  <div>
                    <div
                      onClick={() => toggleRule(rule.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          toggleRule(rule.id);
                        }
                      }}
                      className="w-full p-5 text-left flex items-center justify-between gap-4 hover:bg-[#132247]/50 transition-colors cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] font-mono uppercase px-2.5 py-0.5 rounded bg-[#35E0FF]/15 text-[#35E0FF] border border-[#35E0FF]/30 shrink-0">
                          {rule.category}
                        </span>
                        <span className="font-semibold text-white text-sm sm:text-base">
                          {rule.title}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {isAdminMode && (
                          <div
                            className="flex items-center gap-1 mr-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={(e) => handleStartEdit(rule, e)}
                              className="p-1 rounded text-[#9DB0D0] hover:text-[#FF4FD8] hover:bg-[#081024] transition-colors cursor-pointer"
                              title="Edit this rule"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm(`Delete rule "${rule.title}"?`)) {
                                  deleteRule(rule.id);
                                }
                              }}
                              className="p-1 rounded text-[#9DB0D0] hover:text-rose-400 hover:bg-[#081024] transition-colors cursor-pointer"
                              title="Delete this rule"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                        {isOpen ? (
                          <ChevronUp className="w-5 h-5 text-[#35E0FF] shrink-0" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-[#9DB0D0] shrink-0" />
                        )}
                      </div>
                    </div>

                    {isOpen && (
                      <div className="px-5 pb-5 pt-1 text-sm text-[#9DB0D0] leading-relaxed border-t border-[#78AAFF]/10">
                        {rule.details}
                      </div>
                    )}
                  </div>
                )}
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
            className="w-full max-w-md bg-[#081024] border border-[#FF4FD8]/40 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(255,79,216,0.25)] relative text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-5 right-5 p-1.5 text-[#9DB0D0] hover:text-white rounded-lg hover:bg-[#0C1630]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-[#0C1630] border border-[#FF4FD8]/30 mx-auto flex items-center justify-center mb-3 text-[#FF4FD8]">
              <Shield className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-bold font-display text-white">Admin Authentication</h3>
            <p className="text-xs text-[#9DB0D0] mt-1 mb-6">
              Enter your official administrator email and security passkey to edit event rules.
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
                  className="w-full px-3.5 py-2.5 bg-[#0C1630] border border-[#78AAFF]/20 rounded-xl text-xs text-white focus:outline-none focus:border-[#FF4FD8]"
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
                  className="w-full px-3.5 py-2.5 bg-[#0C1630] border border-[#78AAFF]/20 rounded-xl text-xs text-white focus:outline-none focus:border-[#FF4FD8]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-[#FF8A2A] to-[#F5611A] shadow-[0_0_20px_rgba(255,138,42,0.4)] hover:brightness-110 active:scale-95 transition-all cursor-pointer"
              >
                Authenticate & Unlock Rules
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
