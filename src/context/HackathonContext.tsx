import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  EventConfig,
  DomainTrack,
  PrizeItem,
  ScheduleEvent,
  Announcement,
  CoreTeamMember,
  RuleItem,
  FAQItem,
  RegisteredTeam,
  ProjectSubmission,
  SubmissionNotification,
} from '../types';
import {
  initialEventConfig,
  initialTracks,
  initialPrizes,
  initialSchedule,
  initialAnnouncements,
  initialCoreTeam,
  initialRules,
  initialFAQs,
  initialRegisteredTeams,
} from '../data/initialData';
import {
  signInWithGoogle,
  signOutGoogle,
  getGoogleAccessToken,
  initGoogleAuth,
  saveTeamToFirestore,
  updateTeamPaymentInFirestore,
  updateTeamCheckInInFirestore,
  updateTeamSubmissionInFirestore,
  subscribeFirestoreTeams,
  testFirestoreConnection,
} from '../lib/firebase';
import {
  syncAllTeamsToGoogleSheet,
  appendTeamToGoogleSheet,
  fetchTeamsFromGoogleSheet,
  getOrCreateSpreadsheet,
} from '../lib/googleSheets';
import { sendTransactionalEmail, generateSubmissionNotificationEmailHtml } from '../lib/email';
import type { User } from 'firebase/auth';

interface HackathonContextType {
  eventConfig: EventConfig;
  updateEventConfig: (newConfig: Partial<EventConfig>) => void;
  
  tracks: DomainTrack[];
  updateTrack: (id: string, updated: Partial<DomainTrack>) => void;
  addTrack: (track: DomainTrack) => void;
  deleteTrack: (id: string) => void;
  
  prizes: PrizeItem[];
  updatePrizes: (prizes: PrizeItem[]) => void;
  
  schedule: ScheduleEvent[];
  updateSchedule: (schedule: ScheduleEvent[]) => void;
  addScheduleEvent: (event: Omit<ScheduleEvent, 'id'> | ScheduleEvent) => void;
  updateScheduleEvent: (id: string, updated: Partial<ScheduleEvent>) => void;
  deleteScheduleEvent: (id: string) => void;
  resetScheduleToDefault: () => void;
  
  announcements: Announcement[];
  addAnnouncement: (announcement: Omit<Announcement, 'id' | 'date'>) => void;
  updateAnnouncement: (id: string, updated: Partial<Announcement>) => void;
  deleteAnnouncement: (id: string) => void;
  
  coreTeam: CoreTeamMember[];
  updateCoreMember: (id: string, updated: Partial<CoreTeamMember>) => void;
  addCoreMember: (member: Omit<CoreTeamMember, 'id'>) => void;
  deleteCoreMember: (id: string) => void;
  reorderCoreTeam: (sourceIndex: number, destIndex: number) => void;
  
  rules: RuleItem[];
  updateRules: (rules: RuleItem[]) => void;
  addRule: (rule: Omit<RuleItem, 'id'>) => void;
  updateRule: (id: string, updated: Partial<RuleItem>) => void;
  deleteRule: (id: string) => void;
  resetRulesToDefault: () => void;
  
  faqs: FAQItem[];
  updateFAQs: (faqs: FAQItem[]) => void;
  
  registeredTeams: RegisteredTeam[];
  registerTeam: (teamData: Omit<RegisteredTeam, 'id' | 'registeredAt' | 'checkedIn'>) => { success: boolean; teamId?: string; error?: string };
  updateTeam: (id: string, updated: Partial<RegisteredTeam>) => void;
  updatePaymentStatus: (id: string, status: 'Pending' | 'Verified' | 'Rejected', remarks?: string) => void;
  toggleCheckIn: (id: string) => { success: boolean; checkedIn?: boolean; error?: string };
  
  currentTeamSession: RegisteredTeam | null;
  setCurrentTeamSession: (team: RegisteredTeam | null) => void;
  
  selectedTrackForRegistration: string | null;
  setSelectedTrackForRegistration: (trackTitle: string | null) => void;
  
  activeView: string;
  setActiveView: (view: string) => void;
  
  showRegisterModal: boolean;
  setShowRegisterModal: (show: boolean) => void;
  
  showCoreTeamPanel: boolean;
  setShowCoreTeamPanel: (show: boolean) => void;
  
  exportTeamsToCSV: () => void;
  exportTeamsToSQL: () => void;
  resetAllData: () => void;

  // Google Sheets & Cloud Sync
  googleUser: User | null;
  googleAccessToken: string | null;
  isGoogleSheetsConnected: boolean;
  googleSheetUrl: string | null;
  autoSyncGoogleSheets: boolean;
  setAutoSyncGoogleSheets: (val: boolean) => void;
  connectGoogleSheets: () => Promise<boolean>;
  disconnectGoogleSheets: () => Promise<void>;
  syncGoogleSheets: () => Promise<{ success: boolean; spreadsheetUrl?: string; rowsSynced?: number; error?: string }>;
  fetchFromGoogleSheets: () => Promise<{ success: boolean; rowsFetched?: number; error?: string }>;

  // Project PPT Submissions & Admin Alerts
  submissionNotifications: SubmissionNotification[];
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  submitProjectPresentation: (
    teamId: string,
    submissionData: {
      projectTitle?: string;
      projectTrack?: string;
      problemStatement?: string;
      ideaSummary?: string;
      pptFileName?: string;
      pptFileData?: string;
      pptDeckUrl?: string;
      githubUrl?: string;
      demoUrl?: string;
      techStack?: string[];
    }
  ) => Promise<{ success: boolean; error?: string }>;
  evaluateProjectSubmission: (
    teamId: string,
    evaluation: {
      status: ProjectSubmission['evaluationStatus'];
      score?: number;
      feedback?: string;
      evaluatedBy?: string;
    }
  ) => Promise<{ success: boolean; error?: string }>;
}

const HackathonContext = createContext<HackathonContextType | undefined>(undefined);

export const HackathonProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [eventConfig, setEventConfig] = useState<EventConfig>(() => {
    const saved = localStorage.getItem('ideation_event_config');
    return saved ? JSON.parse(saved) : initialEventConfig;
  });

  const [tracks, setTracks] = useState<DomainTrack[]>(() => {
    const saved = localStorage.getItem('ideation_tracks');
    return saved ? JSON.parse(saved) : initialTracks;
  });

  const [prizes, setPrizes] = useState<PrizeItem[]>(() => {
    const saved = localStorage.getItem('ideation_prizes_v3');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return initialPrizes;
      }
    }
    return initialPrizes;
  });

  const [schedule, setSchedule] = useState<ScheduleEvent[]>(() => {
    const saved = localStorage.getItem('ideation_schedule');
    return saved ? JSON.parse(saved) : initialSchedule;
  });

  const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
    const saved = localStorage.getItem('ideation_announcements_prod');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed.filter(a => !['a1', 'a2', 'a3', 'a4'].includes(a.id)) : [];
      } catch {
        return [];
      }
    }
    return [];
  });

  const [coreTeam, setCoreTeam] = useState<CoreTeamMember[]>(() => {
    const saved = localStorage.getItem('ideation_core_team');
    return saved ? JSON.parse(saved) : initialCoreTeam;
  });

  const [rules, setRules] = useState<RuleItem[]>(() => {
    const saved = localStorage.getItem('ideation_rules');
    return saved ? JSON.parse(saved) : initialRules;
  });

  const [faqs, setFaqs] = useState<FAQItem[]>(() => {
    const saved = localStorage.getItem('ideation_faqs');
    return saved ? JSON.parse(saved) : initialFAQs;
  });

  const [registeredTeams, setRegisteredTeams] = useState<RegisteredTeam[]>(() => {
    const saved = localStorage.getItem('ideation_registered_teams_prod');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed)
          ? parsed.filter(t => !['IDN-0001', 'IDN-0002', 'IDN-0003', 'IDN-0004'].includes(t.id))
          : [];
      } catch {
        return [];
      }
    }
    return [];
  });

  const [currentTeamSession, setCurrentTeamSession] = useState<RegisteredTeam | null>(null);
  const [selectedTrackForRegistration, setSelectedTrackForRegistration] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<string>('home'); // home, admin, dashboard, news, team, 404
  const [showRegisterModal, setShowRegisterModal] = useState<boolean>(false);
  const [showCoreTeamPanel, setShowCoreTeamPanel] = useState<boolean>(false);

  // Google Sheets & Cloud Sync State
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(() => getGoogleAccessToken());
  const [googleSheetUrl, setGoogleSheetUrl] = useState<string | null>(() => localStorage.getItem('ideation_google_sheet_url'));
  const [autoSyncGoogleSheets, setAutoSyncGoogleSheets] = useState<boolean>(() => {
    return localStorage.getItem('ideation_auto_sync_sheets') !== 'false';
  });
  const isGoogleSheetsConnected = Boolean(googleUser || googleAccessToken);

  // Project PPT Submissions & Admin Alerts State
  const [submissionNotifications, setSubmissionNotifications] = useState<SubmissionNotification[]>(() => {
    const saved = localStorage.getItem('ideation_submission_notifications');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('ideation_submission_notifications', JSON.stringify(submissionNotifications));
  }, [submissionNotifications]);

  useEffect(() => {
    localStorage.setItem('ideation_auto_sync_sheets', String(autoSyncGoogleSheets));
  }, [autoSyncGoogleSheets]);

  useEffect(() => {
    testFirestoreConnection();

    // Track Google Auth state
    const unsubAuth = initGoogleAuth(
      (user, token) => {
        setGoogleUser(user);
        if (token) setGoogleAccessToken(token);
      },
      () => {
        setGoogleUser(null);
        setGoogleAccessToken(null);
      }
    );

    // Live multi-device Firestore subscription (any laptop, mobile, browser globally)
    const unsubFirestore = subscribeFirestoreTeams((cloudTeams) => {
      if (cloudTeams && cloudTeams.length > 0) {
        setRegisteredTeams((prev) => {
          const map = new Map<string, RegisteredTeam>();
          prev.forEach((t) => map.set(t.id, t));
          cloudTeams.forEach((t) => map.set(t.id, t));
          return Array.from(map.values()).sort(
            (a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime()
          );
        });
      }
    });

    return () => {
      unsubAuth();
      unsubFirestore();
    };
  }, []);

  const connectGoogleSheets = async (): Promise<boolean> => {
    try {
      const res = await signInWithGoogle();
      if (res) {
        setGoogleUser(res.user);
        setGoogleAccessToken(res.accessToken);
        try {
          const sheet = await getOrCreateSpreadsheet(res.accessToken);
          setGoogleSheetUrl(sheet.spreadsheetUrl);
          localStorage.setItem('ideation_google_sheet_url', sheet.spreadsheetUrl);
          await syncAllTeamsToGoogleSheet(res.accessToken, registeredTeams);
        } catch (sheetErr) {
          console.warn('Initial sheet sync warning:', sheetErr);
        }
        return true;
      }
      return false;
    } catch (err) {
      console.error('Google Sheets connection error:', err);
      return false;
    }
  };

  const disconnectGoogleSheets = async (): Promise<void> => {
    await signOutGoogle();
    setGoogleUser(null);
    setGoogleAccessToken(null);
  };

  const syncGoogleSheets = async () => {
    const token = googleAccessToken || getGoogleAccessToken();
    if (!token) {
      return { success: false, error: 'Please connect Google Sheets first.' };
    }
    const result = await syncAllTeamsToGoogleSheet(token, registeredTeams);
    if (result.success && result.spreadsheetUrl) {
      setGoogleSheetUrl(result.spreadsheetUrl);
      localStorage.setItem('ideation_google_sheet_url', result.spreadsheetUrl);
    }
    return result;
  };

  const fetchFromGoogleSheets = async () => {
    const token = googleAccessToken || getGoogleAccessToken();
    if (!token) {
      return { success: false, error: 'Please connect Google Sheets first.' };
    }
    const result = await fetchTeamsFromGoogleSheet(token);
    if (result.success && result.teams && result.teams.length > 0) {
      setRegisteredTeams((prev) => {
        const map = new Map<string, RegisteredTeam>();
        prev.forEach((t) => map.set(t.id, t));
        result.teams!.forEach((t) => map.set(t.id, t));
        return Array.from(map.values()).sort(
          (a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime()
        );
      });
      return { success: true, rowsFetched: result.teams.length };
    }
    return { success: result.success, rowsFetched: result.teams?.length || 0, error: result.error };
  };

  // Persistence side-effects
  useEffect(() => {
    localStorage.setItem('ideation_event_config', JSON.stringify(eventConfig));
  }, [eventConfig]);

  useEffect(() => {
    localStorage.setItem('ideation_tracks', JSON.stringify(tracks));
  }, [tracks]);

  useEffect(() => {
    localStorage.setItem('ideation_prizes_v3', JSON.stringify(prizes));
  }, [prizes]);

  useEffect(() => {
    localStorage.setItem('ideation_schedule', JSON.stringify(schedule));
  }, [schedule]);

  useEffect(() => {
    localStorage.setItem('ideation_announcements_prod', JSON.stringify(announcements));
  }, [announcements]);

  useEffect(() => {
    localStorage.setItem('ideation_core_team', JSON.stringify(coreTeam));
  }, [coreTeam]);

  useEffect(() => {
    localStorage.setItem('ideation_rules', JSON.stringify(rules));
  }, [rules]);

  useEffect(() => {
    localStorage.setItem('ideation_faqs', JSON.stringify(faqs));
  }, [faqs]);

  useEffect(() => {
    localStorage.setItem('ideation_registered_teams_prod', JSON.stringify(registeredTeams));
  }, [registeredTeams]);

  // Central Database Synchronization & Live Polling
  useEffect(() => {
    let isMounted = true;

    const syncWithCentralDatabase = async () => {
      try {
        const res = await fetch('/api/teams');
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data) && isMounted) {
            setRegisteredTeams(json.data);
            // If current team session is open, keep it in sync with updated database status
            if (currentTeamSession) {
              const updatedSession = json.data.find((t: RegisteredTeam) => t.id === currentTeamSession.id);
              if (updatedSession) {
                setCurrentTeamSession(updatedSession);
              }
            }
          }
        }
      } catch {
        // Fallback to local state if server route is temporarily unreachable
      }
    };

    // Initial load
    syncWithCentralDatabase();

    // Live polling every 2.5s for real-time status updates without manual refresh
    const pollTimer = setInterval(syncWithCentralDatabase, 2500);

    // Multi-tab broadcast channel
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel('ideation_live_sync');
      channel.onmessage = (event) => {
        if (event.data?.type === 'SYNC_TEAMS' && isMounted) {
          syncWithCentralDatabase();
        }
      };
    } catch {}

    return () => {
      isMounted = false;
      clearInterval(pollTimer);
      channel?.close();
    };
  }, [currentTeamSession?.id]);

  const updateEventConfig = (newConfig: Partial<EventConfig>) => {
    setEventConfig(prev => ({ ...prev, ...newConfig }));
  };

  const updateTrack = (id: string, updated: Partial<DomainTrack>) => {
    setTracks(prev => prev.map(t => (t.id === id ? { ...t, ...updated } : t)));
  };

  const addTrack = (track: DomainTrack) => {
    setTracks(prev => [...prev, track]);
  };

  const deleteTrack = (id: string) => {
    setTracks(prev => prev.filter(t => t.id !== id));
  };

  const updatePrizes = (newPrizes: PrizeItem[]) => {
    setPrizes(newPrizes);
  };

  const updateSchedule = (newSchedule: ScheduleEvent[]) => {
    setSchedule(newSchedule);
  };

  const addScheduleEvent = (event: Omit<ScheduleEvent, 'id'> | ScheduleEvent) => {
    const newEvent: ScheduleEvent = {
      ...event,
      id: 'id' in event && event.id ? event.id : `sch-${Date.now()}`,
    };
    setSchedule(prev => [...prev, newEvent]);
  };

  const updateScheduleEvent = (id: string, updated: Partial<ScheduleEvent>) => {
    setSchedule(prev => prev.map(s => (s.id === id ? { ...s, ...updated } : s)));
  };

  const deleteScheduleEvent = (id: string) => {
    setSchedule(prev => prev.filter(s => s.id !== id));
  };

  const resetScheduleToDefault = () => {
    setSchedule(initialSchedule);
  };

  const addAnnouncement = (item: Omit<Announcement, 'id' | 'date'>) => {
    const newAnnouncement: Announcement = {
      ...item,
      id: `a-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
    };
    setAnnouncements(prev => [newAnnouncement, ...prev]);
  };

  const updateAnnouncement = (id: string, updated: Partial<Announcement>) => {
    setAnnouncements(prev => prev.map(a => (a.id === id ? { ...a, ...updated } : a)));
  };

  const deleteAnnouncement = (id: string) => {
    setAnnouncements(prev => prev.filter(a => a.id !== id));
  };

  const updateCoreMember = (id: string, updated: Partial<CoreTeamMember>) => {
    setCoreTeam(prev => prev.map(m => (m.id === id ? { ...m, ...updated } : m)));
  };

  const addCoreMember = (member: Omit<CoreTeamMember, 'id'>) => {
    const newMember: CoreTeamMember = {
      ...member,
      id: `ct-${Date.now()}`,
    };
    setCoreTeam(prev => [...prev, newMember]);
  };

  const deleteCoreMember = (id: string) => {
    setCoreTeam(prev => prev.filter(m => m.id !== id));
  };

  const reorderCoreTeam = (sourceIndex: number, destIndex: number) => {
    setCoreTeam(prev => {
      const copy = [...prev];
      const [removed] = copy.splice(sourceIndex, 1);
      copy.splice(destIndex, 0, removed);
      return copy.map((m, idx) => ({ ...m, order: idx + 1 }));
    });
  };

  const updateRules = (newRules: RuleItem[]) => {
    setRules(newRules);
  };

  const addRule = (rule: Omit<RuleItem, 'id'>) => {
    const newRule: RuleItem = {
      ...rule,
      id: `r-${Date.now()}`,
    };
    setRules(prev => [...prev, newRule]);
  };

  const updateRule = (id: string, updated: Partial<RuleItem>) => {
    setRules(prev => prev.map(r => (r.id === id ? { ...r, ...updated } : r)));
  };

  const deleteRule = (id: string) => {
    setRules(prev => prev.filter(r => r.id !== id));
  };

  const resetRulesToDefault = () => {
    setRules(initialRules);
  };

  const updateFAQs = (newFaqs: FAQItem[]) => {
    setFaqs(newFaqs);
  };

  const registerTeam = (teamData: Omit<RegisteredTeam, 'id' | 'registeredAt' | 'checkedIn'>) => {
    if (!eventConfig.registrationOpen) {
      return { success: false, error: 'Registration is currently closed by organizers.' };
    }

    if (registeredTeams.length >= eventConfig.maxTeamsLimit) {
      return { success: false, error: 'Registration limit has been reached. Please contact coordinators.' };
    }

    // Check duplicate team name
    const existingName = registeredTeams.find(
      t => t.teamName.trim().toLowerCase() === teamData.teamName.trim().toLowerCase()
    );
    if (existingName) {
      return { success: false, error: `Team name "${teamData.teamName}" is already taken.` };
    }

    // Check duplicate emails within the incoming team
    const incomingEmails = teamData.members.map(m => m.email.trim().toLowerCase());
    if (new Set(incomingEmails).size !== incomingEmails.length) {
      return { success: false, error: 'Each team member must have a distinct, unique email address.' };
    }

    // Check duplicate USN or Email across existing teams (STRICT: 1 Email = 1 Registration)
    const allExistingMembers = registeredTeams.flatMap(t => t.members);
    for (const m of teamData.members) {
      const emailLower = m.email.trim().toLowerCase();
      const dupTeam = registeredTeams.find(t =>
        t.members.some(em => em.email.trim().toLowerCase() === emailLower)
      );
      if (dupTeam) {
        return {
          success: false,
          error: `The email "${m.email}" is already registered under team "${dupTeam.teamName}" (${dupTeam.id}). Each email address can register to IDEATION only once.`,
        };
      }

      const dupUsn = allExistingMembers.find(
        em => em.usn.trim().toUpperCase() === m.usn.trim().toUpperCase() && m.usn.trim() !== ''
      );
      if (dupUsn) {
        return { success: false, error: `Student with USN "${m.usn}" is already registered in another team.` };
      }
    }

    // Generate Team ID
    const nextNumber = registeredTeams.length + 1;
    const teamId = `IDN-${String(nextNumber).padStart(4, '0')}`;

    const newTeam: RegisteredTeam = {
      ...teamData,
      id: teamId,
      registeredAt: new Date().toISOString(),
      checkedIn: false,
    };

    setRegisteredTeams(prev => [newTeam, ...prev]);
    setCurrentTeamSession(newTeam);

    // 1. Save to Firestore Cloud Database (accessible worldwide from any laptop, mobile, browser)
    saveTeamToFirestore(newTeam);

    // 2. Automatically append to Google Sheet if admin has connected Google Sheets
    const currentGToken = googleAccessToken || getGoogleAccessToken();
    if (currentGToken) {
      appendTeamToGoogleSheet(currentGToken, newTeam).catch(err => {
        console.warn('Google Sheet auto-append warning:', err);
      });
    }

    // 3. Save to full-stack central database server API
    fetch('/api/teams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTeam),
    }).catch(err => {
      console.warn('Central DB sync warning:', err);
    });

    // 4. Broadcast live sync to all tabs
    try {
      const channel = new BroadcastChannel('ideation_live_sync');
      channel.postMessage({ type: 'SYNC_TEAMS' });
      channel.close();
    } catch {}

    return { success: true, teamId };
  };

  const updateTeam = (id: string, updated: Partial<RegisteredTeam>) => {
    setRegisteredTeams(prev => prev.map(t => (t.id === id ? { ...t, ...updated } : t)));
    if (currentTeamSession?.id === id) {
      setCurrentTeamSession(prev => (prev ? { ...prev, ...updated } : null));
    }
  };

  const updatePaymentStatus = (id: string, status: 'Pending' | 'Verified' | 'Rejected', remarks?: string) => {
    // 1. Update React state immediately
    setRegisteredTeams(prev =>
      prev.map(t => {
        if (t.id === id) {
          const updated = {
            ...t,
            paymentStatus: status,
            paymentRemarks: remarks !== undefined ? remarks : t.paymentRemarks,
          };
          // Also update current active session immediately if it belongs to this team
          if (currentTeamSession?.id === id) {
            setCurrentTeamSession(updated);
          }
          return updated;
        }
        return t;
      })
    );

    // 2. Persist to Firestore Cloud Database
    updateTeamPaymentInFirestore(id, status, remarks);

    // 3. Persist to central database immediately via API
    fetch(`/api/teams/${encodeURIComponent(id)}/payment`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, remarks }),
    }).catch(err => {
      console.warn('Central DB payment status update warning:', err);
    });

    // 4. If Google Sheets is connected, sync the update
    const currentGToken = googleAccessToken || getGoogleAccessToken();
    if (currentGToken) {
      syncAllTeamsToGoogleSheet(currentGToken, registeredTeams.map(t => t.id === id ? { ...t, paymentStatus: status, paymentRemarks: remarks } : t)).catch(console.warn);
    }

    // 5. Broadcast to all open tabs and windows for instantaneous auto-refresh
    try {
      const channel = new BroadcastChannel('ideation_live_sync');
      channel.postMessage({ type: 'SYNC_TEAMS', teamId: id, status });
      channel.close();
    } catch {}
  };

  const toggleCheckIn = (id: string) => {
    const team = registeredTeams.find(t => t.id === id);
    if (!team) {
      return { success: false, error: 'Team not found with ID ' + id };
    }
    const newStatus = !team.checkedIn;
    const checkedInAt = newStatus ? new Date().toISOString() : undefined;

    setRegisteredTeams(prev =>
      prev.map(t =>
        t.id === id
          ? {
              ...t,
              checkedIn: newStatus,
              checkedInAt,
            }
          : t
      )
    );

    if (currentTeamSession?.id === id) {
      setCurrentTeamSession(prev => (prev ? { ...prev, checkedIn: newStatus, checkedInAt } : null));
    }

    // 1. Persist to Firestore Cloud Database
    updateTeamCheckInInFirestore(id, newStatus, checkedInAt);

    // 2. Persist to central database
    fetch(`/api/teams/${encodeURIComponent(id)}/checkin`, {
      method: 'PATCH',
    }).catch(err => {
      console.warn('Central DB checkin update warning:', err);
    });

    // 3. Broadcast
    try {
      const channel = new BroadcastChannel('ideation_live_sync');
      channel.postMessage({ type: 'SYNC_TEAMS', teamId: id, checkedIn: newStatus });
      channel.close();
    } catch {}

    return { success: true, checkedIn: newStatus };
  };

  const markNotificationAsRead = (id: string) => {
    setSubmissionNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllNotificationsAsRead = () => {
    setSubmissionNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const submitProjectPresentation = async (
    teamId: string,
    submissionData: {
      projectTitle?: string;
      projectTrack?: string;
      problemStatement?: string;
      ideaSummary?: string;
      pptFileName?: string;
      pptFileData?: string;
      pptDeckUrl?: string;
      githubUrl?: string;
      demoUrl?: string;
      techStack?: string[];
    }
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      if (eventConfig.pptSubmissionsOpen === false) {
        return {
          success: false,
          error: 'PPT Submissions are currently closed by the organizers. New submissions or updates are not accepted at this time.',
        };
      }

      const team = registeredTeams.find(t => t.id === teamId);
      if (!team) {
        return { success: false, error: 'Team not found with ID ' + teamId };
      }

      const previousCount = team.submission?.submissionCount || (team.submission?.submittedAt ? 1 : 0);
      if (previousCount >= 2) {
        return {
          success: false,
          error: 'Maximum submission limit reached (each team is permitted a maximum of 2 submissions).',
        };
      }
      const newSubmissionCount = previousCount + 1;

      const leader = team.members.find(m => m.isLeader) || team.members[0];
      const nowIso = new Date().toISOString();

      const newSubmission: ProjectSubmission = {
        submittedAt: team.submission?.submittedAt || nowIso,
        updatedAt: nowIso,
        submissionCount: newSubmissionCount,
        projectTitle: (submissionData.projectTitle || team.ideaTitle || '').trim(),
        projectTrack: submissionData.projectTrack || team.primaryTrack || team.track || 'General Track',
        problemStatement: (submissionData.problemStatement || team.problemStatement || '').trim(),
        ideaSummary: (submissionData.ideaSummary || team.ideaSummary || '').trim(),
        pptFileName: submissionData.pptFileName || team.submission?.pptFileName,
        pptFileData: submissionData.pptFileData || team.submission?.pptFileData,
        pptDeckUrl: (submissionData.pptDeckUrl || team.submission?.pptDeckUrl || '').trim(),
        githubUrl: (submissionData.githubUrl || team.submission?.githubUrl || '').trim(),
        demoUrl: (submissionData.demoUrl || team.submission?.demoUrl || '').trim(),
        techStack: submissionData.techStack || team.submission?.techStack || [],
        evaluationStatus: team.submission?.evaluationStatus || 'Under Review',
        score: team.submission?.score,
        feedback: team.submission?.feedback,
        evaluatedBy: team.submission?.evaluatedBy,
        evaluatedAt: team.submission?.evaluatedAt,
      };

      const updatedTeam: RegisteredTeam = {
        ...team,
        submission: newSubmission,
        ideaTitle: newSubmission.projectTitle || team.ideaTitle,
        ideaSummary: newSubmission.ideaSummary || team.ideaSummary,
      };

      // 1. Update React State
      setRegisteredTeams(prev => prev.map(t => (t.id === teamId ? updatedTeam : t)));
      if (currentTeamSession?.id === teamId) {
        setCurrentTeamSession(updatedTeam);
      }

      // 2. Persist to Firestore
      await updateTeamSubmissionInFirestore(teamId, newSubmission);

      // 3. Persist to Central Database Server API
      fetch(`/api/teams/${encodeURIComponent(teamId)}/submission`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSubmission),
      }).catch(err => {
        console.warn('Central DB submission sync warning:', err);
      });

      // 4. Create and record Admin Notification
      const newNotif: SubmissionNotification = {
        id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        teamId: team.id,
        teamName: team.teamName,
        leaderName: leader ? leader.name : 'Team Leader',
        leaderEmail: leader ? leader.email : '',
        leaderPhone: leader ? leader.phone : '',
        projectTitle: newSubmission.projectTitle,
        projectTrack: newSubmission.projectTrack,
        pptFileName: newSubmission.pptFileName,
        pptDeckUrl: newSubmission.pptDeckUrl,
        submittedAt: newSubmission.updatedAt || newSubmission.submittedAt,
        read: false,
      };

      setSubmissionNotifications(prev => [newNotif, ...prev.filter(n => n.teamId !== teamId)]);

      // 5. Send Real-Time Alert Email to Admin
      try {
        const formattedDate = new Date(newSubmission.updatedAt || newSubmission.submittedAt).toLocaleString('en-IN', {
          timeZone: 'Asia/Kolkata',
          dateStyle: 'medium',
          timeStyle: 'short',
        });

        const emailHtml = generateSubmissionNotificationEmailHtml({
          teamId: team.id,
          teamName: team.teamName,
          college: team.college,
          leaderName: leader ? leader.name : 'Team Leader',
          leaderEmail: leader ? leader.email : 'N/A',
          leaderPhone: leader ? leader.phone : 'N/A',
          projectTitle: newSubmission.projectTitle,
          projectTrack: newSubmission.projectTrack,
          pptFileName: newSubmission.pptFileName,
          pptDeckUrl: newSubmission.pptDeckUrl,
          githubUrl: newSubmission.githubUrl,
          demoUrl: newSubmission.demoUrl,
          techStack: newSubmission.techStack,
          submittedAt: formattedDate,
        });

        await sendTransactionalEmail({
          to: 'ktarunkumar1832@gmail.com',
          subject: `[IDEATION 2026] Project PPT Submitted: Team ${team.teamName} (${team.id})`,
          html: emailHtml,
        });
      } catch (emailErr) {
        console.warn('Admin notification email dispatch error:', emailErr);
      }

      // 6. Multi-tab broadcast
      try {
        const channel = new BroadcastChannel('ideation_live_sync');
        channel.postMessage({ type: 'NEW_SUBMISSION', teamId });
        channel.close();
      } catch {}

      return { success: true };
    } catch (err: any) {
      console.error('submitProjectPresentation error:', err);
      return { success: false, error: err.message || 'Submission failed' };
    }
  };

  const evaluateProjectSubmission = async (
    teamId: string,
    evaluation: {
      status: ProjectSubmission['evaluationStatus'];
      score?: number;
      feedback?: string;
      evaluatedBy?: string;
    }
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const team = registeredTeams.find(t => t.id === teamId);
      if (!team) {
        return { success: false, error: 'Team not found' };
      }

      const existingSubmission: ProjectSubmission = team.submission || {
        submittedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        projectTitle: team.ideaTitle || 'Untitled Project',
        projectTrack: team.primaryTrack || 'General',
        evaluationStatus: 'Under Review',
      };

      const updatedSubmission: ProjectSubmission = {
        ...existingSubmission,
        evaluationStatus: evaluation.status,
        score: evaluation.score !== undefined ? evaluation.score : existingSubmission.score,
        feedback: evaluation.feedback !== undefined ? evaluation.feedback : existingSubmission.feedback,
        evaluatedBy: evaluation.evaluatedBy || 'Jury Panel',
        evaluatedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updatedTeam: RegisteredTeam = {
        ...team,
        submission: updatedSubmission,
      };

      setRegisteredTeams(prev => prev.map(t => (t.id === teamId ? updatedTeam : t)));
      if (currentTeamSession?.id === teamId) {
        setCurrentTeamSession(updatedTeam);
      }

      await updateTeamSubmissionInFirestore(teamId, updatedSubmission);

      fetch(`/api/teams/${encodeURIComponent(teamId)}/evaluation`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(evaluation),
      }).catch(err => {
        console.warn('Central DB evaluation update warning:', err);
      });

      try {
        const channel = new BroadcastChannel('ideation_live_sync');
        channel.postMessage({ type: 'EVALUATION_UPDATED', teamId });
        channel.close();
      } catch {}

      return { success: true };
    } catch (err: any) {
      console.error('evaluateProjectSubmission error:', err);
      return { success: false, error: err.message || 'Evaluation update failed' };
    }
  };

  // Helper for CSV escaping
  const escapeCsv = (val: unknown): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/\r\n/g, ' ').replace(/[\r\n]/g, ' ');
    return `"${str.replace(/"/g, '""')}"`;
  };

  const exportTeamsToCSV = () => {
    // If backend route is reachable, prefer downloading server-generated file
    const headers = [
      'Registration ID',
      'Team Name',
      'College Name',
      'City',
      'Department',
      'Course',
      'Primary Track',
      'Backup Track',
      'Idea Title',
      'Idea Summary',
      'Payment Status',
      'Payment UTR Ref',
      'Desk Check-In',
      'Registration Date',
      'Team Size',
      'Leader Name',
      'Leader Email',
      'Leader Phone',
      'Leader USN',
      'Leader Branch',
      'Leader Year',
      'Member 2 Name',
      'Member 2 Email',
      'Member 2 Phone',
      'Member 2 USN',
      'Member 2 Branch',
      'Member 2 Year',
      'Member 3 Name',
      'Member 3 Email',
      'Member 3 Phone',
      'Member 3 USN',
      'Member 3 Branch',
      'Member 3 Year',
      'Member 4 Name',
      'Member 4 Email',
      'Member 4 Phone',
      'Member 4 USN',
      'Member 4 Branch',
      'Member 4 Year',
    ];

    const rows = registeredTeams.map(t => {
      const leader = t.members.find(m => m.isLeader) || t.members[0];
      const nonLeaders = t.members.filter(m => m !== leader);
      const m2 = nonLeaders[0];
      const m3 = nonLeaders[1];
      const m4 = nonLeaders[2];

      return [
        escapeCsv(t.id),
        escapeCsv(t.teamName),
        escapeCsv(t.college),
        escapeCsv(t.city),
        escapeCsv(t.department),
        escapeCsv(t.course),
        escapeCsv(t.primaryTrack),
        escapeCsv(t.backupTrack || ''),
        escapeCsv(t.ideaTitle || ''),
        escapeCsv(t.ideaSummary || ''),
        escapeCsv(t.paymentStatus),
        escapeCsv(t.paymentTransactionId),
        escapeCsv(t.checkedIn ? 'Yes' : 'No'),
        escapeCsv(t.registeredAt),
        escapeCsv(t.members.length),
        escapeCsv(leader?.name || ''),
        escapeCsv(leader?.email || ''),
        escapeCsv(leader?.phone || ''),
        escapeCsv(leader?.usn || ''),
        escapeCsv(leader?.branch || ''),
        escapeCsv(leader?.year || ''),
        escapeCsv(m2?.name || ''),
        escapeCsv(m2?.email || ''),
        escapeCsv(m2?.phone || ''),
        escapeCsv(m2?.usn || ''),
        escapeCsv(m2?.branch || ''),
        escapeCsv(m2?.year || ''),
        escapeCsv(m3?.name || ''),
        escapeCsv(m3?.email || ''),
        escapeCsv(m3?.phone || ''),
        escapeCsv(m3?.usn || ''),
        escapeCsv(m3?.branch || ''),
        escapeCsv(m3?.year || ''),
        escapeCsv(m4?.name || ''),
        escapeCsv(m4?.email || ''),
        escapeCsv(m4?.phone || ''),
        escapeCsv(m4?.usn || ''),
        escapeCsv(m4?.branch || ''),
        escapeCsv(m4?.year || ''),
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `IDEATION_2026_Registrations_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportTeamsToSQL = () => {
    const sqlEscape = (val: unknown): string => {
      if (val === null || val === undefined) return 'NULL';
      if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
      if (typeof val === 'number') return String(val);
      const str = String(val).replace(/'/g, "''");
      return `'${str}'`;
    };

    let sql = `-- ==============================================================================\n` +
      `-- IDEATION 2026 - Central Database SQL Export\n` +
      `-- Generated: ${new Date().toISOString()}\n` +
      `-- Format: PostgreSQL / ANSI SQL Compatible\n` +
      `-- ==============================================================================\n\n` +
      `CREATE TABLE IF NOT EXISTS public.teams (\n` +
      `  id VARCHAR(20) PRIMARY KEY,\n` +
      `  team_name VARCHAR(150) NOT NULL UNIQUE,\n` +
      `  college VARCHAR(250) NOT NULL,\n` +
      `  city VARCHAR(100) NOT NULL,\n` +
      `  department VARCHAR(120) NOT NULL,\n` +
      `  course VARCHAR(50) NOT NULL,\n` +
      `  primary_track VARCHAR(80) NOT NULL,\n` +
      `  backup_track VARCHAR(80),\n` +
      `  idea_title VARCHAR(200) NOT NULL,\n` +
      `  idea_summary TEXT NOT NULL,\n` +
      `  payment_status VARCHAR(20) NOT NULL DEFAULT 'Pending',\n` +
      `  payment_transaction_id VARCHAR(100),\n` +
      `  payment_remarks TEXT,\n` +
      `  registered_at TIMESTAMPTZ NOT NULL,\n` +
      `  checked_in BOOLEAN NOT NULL DEFAULT FALSE,\n` +
      `  checked_in_at TIMESTAMPTZ\n` +
      `);\n\n` +
      `CREATE TABLE IF NOT EXISTS public.members (\n` +
      `  id VARCHAR(60) PRIMARY KEY,\n` +
      `  team_id VARCHAR(20) NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,\n` +
      `  name VARCHAR(150) NOT NULL,\n` +
      `  email VARCHAR(180) NOT NULL,\n` +
      `  phone VARCHAR(30) NOT NULL,\n` +
      `  usn VARCHAR(40) NOT NULL,\n` +
      `  branch VARCHAR(100) NOT NULL,\n` +
      `  year VARCHAR(30) NOT NULL,\n` +
      `  is_leader BOOLEAN NOT NULL DEFAULT FALSE\n` +
      `);\n\n`;

    if (registeredTeams.length === 0) {
      sql += `-- (No registered teams currently in central database)\n`;
    } else {
      for (const t of registeredTeams) {
        sql += `\n-- Team: ${t.teamName} (${t.id})\n`;
        sql += `INSERT INTO public.teams (id, team_name, college, city, department, course, primary_track, backup_track, idea_title, idea_summary, payment_status, payment_transaction_id, payment_remarks, registered_at, checked_in, checked_in_at) VALUES (\n`;
        sql += `  ${sqlEscape(t.id)},\n`;
        sql += `  ${sqlEscape(t.teamName)},\n`;
        sql += `  ${sqlEscape(t.college)},\n`;
        sql += `  ${sqlEscape(t.city)},\n`;
        sql += `  ${sqlEscape(t.department)},\n`;
        sql += `  ${sqlEscape(t.course)},\n`;
        sql += `  ${sqlEscape(t.primaryTrack)},\n`;
        sql += `  ${sqlEscape(t.backupTrack)},\n`;
        sql += `  ${sqlEscape(t.ideaTitle)},\n`;
        sql += `  ${sqlEscape(t.ideaSummary)},\n`;
        sql += `  ${sqlEscape(t.paymentStatus)},\n`;
        sql += `  ${sqlEscape(t.paymentTransactionId)},\n`;
        sql += `  ${sqlEscape(t.paymentRemarks)},\n`;
        sql += `  ${sqlEscape(t.registeredAt)},\n`;
        sql += `  ${sqlEscape(t.checkedIn)},\n`;
        sql += `  ${sqlEscape(t.checkedInAt || null)}\n`;
        sql += `) ON CONFLICT (id) DO UPDATE SET\n`;
        sql += `  payment_status = EXCLUDED.payment_status,\n`;
        sql += `  payment_remarks = EXCLUDED.payment_remarks,\n`;
        sql += `  checked_in = EXCLUDED.checked_in,\n`;
        sql += `  checked_in_at = EXCLUDED.checked_in_at;\n`;

        for (const m of t.members) {
          sql += `INSERT INTO public.members (id, team_id, name, email, phone, usn, branch, year, is_leader) VALUES (\n`;
          sql += `  ${sqlEscape(m.id)},\n`;
          sql += `  ${sqlEscape(t.id)},\n`;
          sql += `  ${sqlEscape(m.name)},\n`;
          sql += `  ${sqlEscape(m.email)},\n`;
          sql += `  ${sqlEscape(m.phone)},\n`;
          sql += `  ${sqlEscape(m.usn)},\n`;
          sql += `  ${sqlEscape(m.branch)},\n`;
          sql += `  ${sqlEscape(m.year)},\n`;
          sql += `  ${sqlEscape(Boolean(m.isLeader))}\n`;
          sql += `) ON CONFLICT (id) DO NOTHING;\n`;
        }
      }
    }

    const blob = new Blob([sql], { type: 'application/sql;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `IDEATION_2026_Database_Dump_${new Date().toISOString().split('T')[0]}.sql`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const resetAllData = () => {
    if (window.confirm('Reset all hackathon data, teams, and content back to factory defaults?')) {
      localStorage.clear();
      setEventConfig(initialEventConfig);
      setTracks(initialTracks);
      setPrizes(initialPrizes);
      setSchedule(initialSchedule);
      setAnnouncements(initialAnnouncements);
      setCoreTeam(initialCoreTeam);
      setRules(initialRules);
      setFaqs(initialFAQs);
      setRegisteredTeams(initialRegisteredTeams);
      setCurrentTeamSession(null);
    }
  };

  return (
    <HackathonContext.Provider
      value={{
        eventConfig,
        updateEventConfig,
        tracks,
        updateTrack,
        addTrack,
        deleteTrack,
        prizes,
        updatePrizes,
        schedule,
        updateSchedule,
        addScheduleEvent,
        updateScheduleEvent,
        deleteScheduleEvent,
        resetScheduleToDefault,
        announcements,
        addAnnouncement,
        updateAnnouncement,
        deleteAnnouncement,
        coreTeam,
        updateCoreMember,
        addCoreMember,
        deleteCoreMember,
        reorderCoreTeam,
        rules,
        updateRules,
        addRule,
        updateRule,
        deleteRule,
        resetRulesToDefault,
        faqs,
        updateFAQs,
        registeredTeams,
        registerTeam,
        updateTeam,
        updatePaymentStatus,
        toggleCheckIn,
        currentTeamSession,
        setCurrentTeamSession,
        selectedTrackForRegistration,
        setSelectedTrackForRegistration,
        activeView,
        setActiveView,
        showRegisterModal,
        setShowRegisterModal,
        showCoreTeamPanel,
        setShowCoreTeamPanel,
        exportTeamsToCSV,
        exportTeamsToSQL,
        resetAllData,
        googleUser,
        googleAccessToken,
        isGoogleSheetsConnected,
        googleSheetUrl,
        autoSyncGoogleSheets,
        setAutoSyncGoogleSheets,
        connectGoogleSheets,
        disconnectGoogleSheets,
        syncGoogleSheets,
        fetchFromGoogleSheets,
        submissionNotifications,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        submitProjectPresentation,
        evaluateProjectSubmission,
      }}
    >
      {children}
    </HackathonContext.Provider>
  );
};

export const useHackathon = () => {
  const context = useContext(HackathonContext);
  if (!context) {
    throw new Error('useHackathon must be used within a HackathonProvider');
  }
  return context;
};
