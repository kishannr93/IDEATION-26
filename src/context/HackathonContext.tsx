import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  EventConfig,
  DomainTrack,
  PrizeItem,
  ScheduleEvent,
  Announcement,
  CoreTeamMember,
  CustomTeamSection,
  RuleItem,
  FAQItem,
  RegisteredTeam,
  ProjectSubmission,
  SubmissionNotification,
  MealDay,
  MealType,
  MealScanRecord,
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
  updateTeamMealLogsInFirestore,
  deleteTeamFromFirestore,
  subscribeFirestoreTeams,
  testFirestoreConnection,
  saveSiteConfigToFirestore,
  subscribeFirestoreSiteConfig,
  saveAnnouncementToFirestore,
  deleteAnnouncementFromFirestore,
  subscribeFirestoreAnnouncements,
  saveCoreMemberToFirestore,
  deleteCoreMemberFromFirestore,
  subscribeFirestoreCoreTeam,
  saveSiteContentToFirestore,
  subscribeFirestoreSiteContent,
  fetchAllFromFirestore,
  SiteContentSection,
} from '../lib/firebase';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  syncAllTeamsToGoogleSheet,
  appendTeamToGoogleSheet,
  fetchTeamsFromGoogleSheet,
  getOrCreateSpreadsheet,
} from '../lib/googleSheets';
import { sendTransactionalEmail, generateSubmissionNotificationEmailHtml } from '../lib/email';
import {
  getTeamMealCode,
  parseMealQrInput,
  evaluateMealCooldown,
  getTeamMealSlotProgress,
  TeamMealSlotProgress,
  formatCooldownDuration,
  mergeMealLogs,
} from '../lib/mealPass';
import type { User } from 'firebase/auth';

export interface MealScanResult {
  success: boolean;
  team?: RegisteredTeam;
  scanRecord?: MealScanRecord;
  scannedMemberName?: string;
  scannedMemberUsn?: string;
  slotProgress?: TeamMealSlotProgress;
  allMembersServed?: boolean;
  alreadyServed?: boolean;
  alreadyMemberScanned?: boolean;
  blockedByCooldown?: boolean;
  remainingMs?: number;
  nextEligibleAt?: string;
  lastScan?: MealScanRecord;
  message: string;
}

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

  customTeamSections: CustomTeamSection[];
  addCustomTeamSection: (section: Omit<CustomTeamSection, 'id' | 'order'>) => CustomTeamSection | null;
  updateCustomTeamSection: (id: string, updated: Partial<CustomTeamSection>) => void;
  deleteCustomTeamSection: (id: string, reassignTo?: string) => void;
  ensureCustomTeamSection: (name: string) => void;
  
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
  deleteTeam: (id: string) => Promise<{ success: boolean; error?: string }>;
  updatePaymentStatus: (id: string, status: 'Pending' | 'Verified' | 'Rejected', remarks?: string) => void;
  toggleCheckIn: (id: string) => { success: boolean; checkedIn?: boolean; error?: string };
  removeCheckInEntry: (id: string) => { success: boolean; error?: string };
  recordTeamMealScan: (
    qrOrTeamQuery: string,
    day: MealDay,
    mealType: MealType,
    scannedBy?: string,
    targetMemberId?: string
  ) => MealScanResult;
  
  currentTeamSession: RegisteredTeam | null;
  setCurrentTeamSession: (team: RegisteredTeam | null) => void;
  
  selectedTrackForRegistration: string | null;
  setSelectedTrackForRegistration: (trackTitle: string | null) => void;
  
  activeView: string;
  setActiveView: (view: string) => void;
  navigateTo: (view: string, sectionId?: string) => void;
  
  showRegisterModal: boolean;
  setShowRegisterModal: (show: boolean) => void;
  
  showCoreTeamPanel: boolean;
  setShowCoreTeamPanel: (show: boolean) => void;
  
  exportTeamsToCSV: () => void;
  exportTeamsToSQL: () => void;
  resetAllData: () => void;
  syncAllToCloud: () => Promise<{ success: boolean; syncedAt: string }>;
  isSyncingAll: boolean;

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
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.dateStart && parsed.dateStart.includes('2026-11')) {
          return {
            ...parsed,
            dates: '1 & 2 December 2026',
            dateStart: '2026-12-01T09:00:00+05:30',
            dateEnd: '2026-12-02T10:00:00+05:30',
            whatsappGroupLink: parsed.whatsappGroupLink || initialEventConfig.whatsappGroupLink,
          };
        }
        return {
          ...parsed,
          whatsappGroupLink: parsed.whatsappGroupLink || initialEventConfig.whatsappGroupLink,
        };
      } catch {
        return initialEventConfig;
      }
    }
    return initialEventConfig;
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

  const normalizeScheduleDays = (items: ScheduleEvent[]): ScheduleEvent[] =>
    items.map((ev) => {
      const rawDay = String(ev.day || '');
      if (rawDay === 'Day 1 (18 Nov)' || rawDay.includes('18 Nov')) {
        return { ...ev, day: 'Day 1 (Dec 1)' };
      }
      if (rawDay === 'Day 2 (19 Nov)' || rawDay.includes('19 Nov')) {
        return { ...ev, day: 'Day 2 (Dec 2)' };
      }
      return ev;
    });

  const [schedule, setSchedule] = useState<ScheduleEvent[]>(() => {
    const saved = localStorage.getItem('ideation_schedule');
    if (saved) {
      try {
        return normalizeScheduleDays(JSON.parse(saved));
      } catch {
        return initialSchedule;
      }
    }
    return initialSchedule;
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

  const [customTeamSections, setCustomTeamSections] = useState<CustomTeamSection[]>(() => {
    const saved = localStorage.getItem('ideation_team_sections');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
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
        if (!Array.isArray(parsed)) return [];
        const savedDeleted = localStorage.getItem('ideation_deleted_teams');
        const deletedIds: string[] = savedDeleted ? JSON.parse(savedDeleted) : [];
        const deletedSet = new Set(Array.isArray(deletedIds) ? deletedIds.map((id) => String(id).toUpperCase()) : []);
        return parsed.filter((t) => t?.id && !deletedSet.has(String(t.id).toUpperCase()));
      } catch {
        return [];
      }
    }
    return [];
  });

  const [isSyncingAll, setIsSyncingAll] = useState<boolean>(false);

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

  // Timestamp map for conflict-free cross-device sync (ms since epoch)
  const syncTimestampsRef = React.useRef<Record<string, number>>((() => {
    try {
      const saved = localStorage.getItem('ideation_sync_timestamps');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  })());

  // Track deleted team IDs across tabs/URLs/devices so deleted teams never resurrect
  const deletedTeamIdsRef = React.useRef<string[]>((() => {
    try {
      const saved = localStorage.getItem('ideation_deleted_teams');
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed.map((id) => String(id).toUpperCase()) : [];
    } catch {
      return [];
    }
  })());

  const coreTeamIndexIdsRef = React.useRef<string[] | null>(null);

  const recordSyncTimestamp = (key: string, isoOrMs?: string | number): number => {
    const ms =
      typeof isoOrMs === 'number'
        ? isoOrMs
        : isoOrMs
        ? Date.parse(isoOrMs) || Date.now()
        : Date.now();
    syncTimestampsRef.current[key] = ms;
    try {
      localStorage.setItem('ideation_sync_timestamps', JSON.stringify(syncTimestampsRef.current));
    } catch {}
    return ms;
  };

  const shouldApplyRemoteUpdate = (key: string, remoteUpdatedAt?: string): boolean => {
    const localTs = syncTimestampsRef.current[key] || 0;
    if (!remoteUpdatedAt) return localTs === 0;
    const remoteTs = Date.parse(remoteUpdatedAt) || 0;
    if (localTs === 0) return true;
    return remoteTs > localTs;
  };

  const applyDeletedIdsUpdate = (incomingIds: string[], updatedAt?: string, replaceExact = false) => {
    const normalizedIncoming = incomingIds.map((id) => String(id).toUpperCase()).filter(Boolean);
    const nextIds = replaceExact
      ? Array.from(new Set(normalizedIncoming))
      : Array.from(new Set([...deletedTeamIdsRef.current, ...normalizedIncoming]));

    deletedTeamIdsRef.current = nextIds;
    if (updatedAt) {
      recordSyncTimestamp('deleted_teams', updatedAt);
    }
    try {
      localStorage.setItem('ideation_deleted_teams', JSON.stringify(nextIds));
    } catch {}

    const deletedSet = new Set(nextIds);
    setRegisteredTeams((prev) => prev.filter((t) => !deletedSet.has(t.id.toUpperCase())));
    setCurrentTeamSession((prev) => (prev && deletedSet.has(prev.id.toUpperCase()) ? null : prev));
  };

  const applyTeamsSnapshot = (incomingTeams: RegisteredTeam[], authoritative: boolean) => {
    const deletedSet = new Set(deletedTeamIdsRef.current.map((id) => id.toUpperCase()));
    const cleanIncoming = incomingTeams.filter((t) => t?.id && !deletedSet.has(t.id.toUpperCase()));

    setRegisteredTeams((prev) => {
      const prevMap = new Map<string, RegisteredTeam>();
      prev.forEach((t) => prevMap.set(t.id, t));

      const mergeTeamRecord = (incoming: RegisteredTeam, existing?: RegisteredTeam): RegisteredTeam => {
        const mergedLogs = mergeMealLogs(existing?.mealLogs, incoming.mealLogs);
        return {
          ...incoming,
          mealCode: incoming.mealCode || existing?.mealCode || getTeamMealCode(incoming),
          mealLogs: mergedLogs.length > 0 ? mergedLogs : undefined,
        };
      };

      let nextList: RegisteredTeam[];
      if (authoritative) {
        const map = new Map<string, RegisteredTeam>();
        cleanIncoming.forEach((t) => map.set(t.id, mergeTeamRecord(t, prevMap.get(t.id))));
        // Preserve very recent (<15s) local registrations still propagating to cloud
        const now = Date.now();
        prev.forEach((t) => {
          if (!deletedSet.has(t.id.toUpperCase()) && !map.has(t.id)) {
            const ageMs = now - new Date(t.registeredAt).getTime();
            if (!Number.isNaN(ageMs) && ageMs >= 0 && ageMs < 15000) {
              map.set(t.id, mergeTeamRecord(t));
            }
          }
        });
        nextList = Array.from(map.values());
      } else {
        const map = new Map<string, RegisteredTeam>();
        prev.forEach((t) => {
          if (!deletedSet.has(t.id.toUpperCase())) map.set(t.id, mergeTeamRecord(t));
        });
        cleanIncoming.forEach((t) => map.set(t.id, mergeTeamRecord(t, prevMap.get(t.id))));
        nextList = Array.from(map.values());
      }
      nextList.sort((a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime());

      setCurrentTeamSession((cur) => {
        if (!cur) return null;
        if (deletedSet.has(cur.id.toUpperCase())) return null;
        return nextList.find((t) => t.id === cur.id) || (authoritative ? null : cur);
      });

      return nextList;
    });
  };

  const applyCoreTeamSnapshot = (remoteMembers: CoreTeamMember[], fromServer: boolean) => {
    if (!Array.isArray(remoteMembers)) return;
    if (remoteMembers.length === 0 && !fromServer) return;

    setCoreTeam((prev) => {
      const indexIds = coreTeamIndexIdsRef.current;
      if (indexIds && indexIds.length > 0) {
        const map = new Map<string, CoreTeamMember>();
        prev.forEach((m) => map.set(m.id, m));
        remoteMembers.forEach((m) => map.set(m.id, m));
        const ordered: CoreTeamMember[] = [];
        indexIds.forEach((id) => {
          const item = map.get(id);
          if (item) ordered.push(item);
        });
        // Include any newly added docs not yet in index
        remoteMembers.forEach((m) => {
          if (!indexIds.includes(m.id)) ordered.push(m);
        });
        return ordered.sort((a, b) => a.order - b.order);
      }

      // If remote has fewer members than default set without an explicit index, merge safely
      if (remoteMembers.length < prev.length && remoteMembers.length <= 3) {
        const map = new Map<string, CoreTeamMember>();
        prev.forEach((m) => map.set(m.id, m));
        remoteMembers.forEach((m) => map.set(m.id, m));
        return Array.from(map.values()).sort((a, b) => a.order - b.order);
      }

      return remoteMembers.length > 0 || fromServer ? [...remoteMembers].sort((a, b) => a.order - b.order) : prev;
    });
  };

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

    // Live multi-device Firestore subscriptions (any laptop, mobile, browser, and URL globally)
    const unsubDeletedTeams = subscribeFirestoreSiteContent<string>('deleted_teams', (payload) => {
      if (shouldApplyRemoteUpdate('deleted_teams', payload.updatedAt)) {
        applyDeletedIdsUpdate(payload.items, payload.updatedAt, true);
      } else if (payload.items.length > 0) {
        applyDeletedIdsUpdate(payload.items);
      }
    });

    const unsubTeams = subscribeFirestoreTeams((cloudTeams, fromServer) => {
      if (cloudTeams && (cloudTeams.length > 0 || fromServer)) {
        applyTeamsSnapshot(cloudTeams, fromServer);
      }
    });

    const unsubConfig = subscribeFirestoreSiteConfig((remoteConfig) => {
      if (remoteConfig && Object.keys(remoteConfig).length > 0) {
        if (shouldApplyRemoteUpdate('config', remoteConfig.updatedAt)) {
          recordSyncTimestamp('config', remoteConfig.updatedAt);
          setEventConfig((prev) => ({
            ...prev,
            ...remoteConfig,
            whatsappGroupLink: remoteConfig.whatsappGroupLink || prev.whatsappGroupLink || initialEventConfig.whatsappGroupLink,
          }));
        }
      }
    });

    const unsubAnnouncementsContent = subscribeFirestoreSiteContent<Announcement>('announcements', (payload) => {
      if (shouldApplyRemoteUpdate('announcements', payload.updatedAt)) {
        recordSyncTimestamp('announcements', payload.updatedAt);
        setAnnouncements(payload.items);
      }
    });

    const unsubAnnouncements = subscribeFirestoreAnnouncements((remoteAnnouncements, fromServer) => {
      if (!syncTimestampsRef.current['announcements'] && remoteAnnouncements && (remoteAnnouncements.length > 0 || fromServer)) {
        setAnnouncements(remoteAnnouncements);
      }
    });

    const unsubCoreTeamIndex = subscribeFirestoreSiteContent<string>('core_team_index', (payload) => {
      if (shouldApplyRemoteUpdate('core_team_index', payload.updatedAt)) {
        recordSyncTimestamp('core_team_index', payload.updatedAt);
        coreTeamIndexIdsRef.current = payload.items;
        setCoreTeam((prev) => {
          const map = new Map(prev.map((m) => [m.id, m]));
          const filtered = payload.items.map((id) => map.get(id)).filter((m): m is CoreTeamMember => Boolean(m));
          return filtered.length > 0 ? filtered.sort((a, b) => a.order - b.order) : prev;
        });
      }
    });

    const unsubCoreTeam = subscribeFirestoreCoreTeam((remoteMembers, fromServer) => {
      applyCoreTeamSnapshot(remoteMembers, fromServer);
    });

    const unsubTeamSections = subscribeFirestoreSiteContent<CustomTeamSection>('team_sections', (payload) => {
      if (shouldApplyRemoteUpdate('team_sections', payload.updatedAt)) {
        recordSyncTimestamp('team_sections', payload.updatedAt);
        setCustomTeamSections([...payload.items].sort((a, b) => a.order - b.order));
      }
    });

    // Live cross-device subscriptions for Rules, Schedule, Tracks, Prizes, and FAQs
    const unsubRules = subscribeFirestoreSiteContent<RuleItem>('rules', (payload) => {
      if (shouldApplyRemoteUpdate('rules', payload.updatedAt)) {
        recordSyncTimestamp('rules', payload.updatedAt);
        setRules(payload.items);
      }
    });

    const unsubSchedule = subscribeFirestoreSiteContent<ScheduleEvent>('schedule', (payload) => {
      if (shouldApplyRemoteUpdate('schedule', payload.updatedAt)) {
        recordSyncTimestamp('schedule', payload.updatedAt);
        setSchedule(normalizeScheduleDays(payload.items));
      }
    });

    const unsubTracks = subscribeFirestoreSiteContent<DomainTrack>('tracks', (payload) => {
      if (shouldApplyRemoteUpdate('tracks', payload.updatedAt)) {
        recordSyncTimestamp('tracks', payload.updatedAt);
        setTracks(payload.items);
      }
    });

    const unsubPrizes = subscribeFirestoreSiteContent<PrizeItem>('prizes', (payload) => {
      if (shouldApplyRemoteUpdate('prizes', payload.updatedAt)) {
        recordSyncTimestamp('prizes', payload.updatedAt);
        setPrizes(payload.items);
      }
    });

    const unsubFaqs = subscribeFirestoreSiteContent<FAQItem>('faqs', (payload) => {
      if (shouldApplyRemoteUpdate('faqs', payload.updatedAt)) {
        recordSyncTimestamp('faqs', payload.updatedAt);
        setFAQsSafe(payload.items);
      }
    });

    return () => {
      unsubAuth();
      unsubDeletedTeams();
      unsubTeams();
      unsubConfig();
      unsubAnnouncementsContent();
      unsubAnnouncements();
      unsubCoreTeamIndex();
      unsubCoreTeam();
      unsubTeamSections();
      unsubRules();
      unsubSchedule();
      unsubTracks();
      unsubPrizes();
      unsubFaqs();
    };
  }, []);

  const setFAQsSafe = (items: FAQItem[]) => {
    setFaqs(items);
  };

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
    localStorage.setItem('ideation_team_sections', JSON.stringify(customTeamSections));
  }, [customTeamSections]);

  useEffect(() => {
    localStorage.setItem('ideation_rules', JSON.stringify(rules));
  }, [rules]);

  useEffect(() => {
    localStorage.setItem('ideation_faqs', JSON.stringify(faqs));
  }, [faqs]);

  useEffect(() => {
    localStorage.setItem('ideation_registered_teams_prod', JSON.stringify(registeredTeams));
  }, [registeredTeams]);

  const broadcastLiveSync = (type = 'SYNC_ALL') => {
    try {
      const channel = new BroadcastChannel('ideation_live_sync');
      channel.postMessage({ type, timestamp: Date.now() });
      channel.close();
    } catch {}
  };

  const navigateTo = (view: string, sectionId?: string) => {
    setActiveView(view);
    if (view === 'home') {
      if (sectionId) {
        setTimeout(() => {
          const el = document.getElementById(sectionId);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
            try {
              window.history.pushState(null, '', `#${sectionId}`);
            } catch {}
          }
        }, 100);
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        try {
          window.history.pushState(null, '', window.location.pathname);
        } catch {}
      }
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      try {
        window.history.pushState(null, '', `?view=${view}`);
      } catch {}
    }
  };

  // Persist structured content section globally (Firestore + Central Express DB + BroadcastChannel)
  const persistContentSection = <T,>(section: SiteContentSection, items: T[]) => {
    const nowIso = new Date().toISOString();
    recordSyncTimestamp(section, nowIso);
    saveSiteContentToFirestore(section, items, nowIso);
    fetch(`/api/content/${section}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items, updatedAt: nowIso }),
    }).catch(() => {});
    broadcastLiveSync(`SYNC_${section.toUpperCase()}`);
  };

  // Pull all state from Firestore (cross-URL / cross-device) + local Express DB
  const pullAllFromCloud = async () => {
    try {
      const snapshot = await fetchAllFromFirestore();
      const deletedDoc = snapshot.sections.deleted_teams;
      if (deletedDoc) {
        if (shouldApplyRemoteUpdate('deleted_teams', deletedDoc.updatedAt)) {
          applyDeletedIdsUpdate(deletedDoc.items as string[], deletedDoc.updatedAt, true);
        } else {
          applyDeletedIdsUpdate(deletedDoc.items as string[]);
        }
      }
      if (snapshot.config && Object.keys(snapshot.config).length > 0) {
        if (shouldApplyRemoteUpdate('config', snapshot.config.updatedAt)) {
          recordSyncTimestamp('config', snapshot.config.updatedAt);
          setEventConfig((prev) => ({
            ...prev,
            ...snapshot.config,
            whatsappGroupLink: snapshot.config?.whatsappGroupLink || prev.whatsappGroupLink || initialEventConfig.whatsappGroupLink,
          }));
        }
      }
      if (snapshot.sections.rules && shouldApplyRemoteUpdate('rules', snapshot.sections.rules.updatedAt)) {
        recordSyncTimestamp('rules', snapshot.sections.rules.updatedAt);
        setRules(snapshot.sections.rules.items as RuleItem[]);
      }
      if (snapshot.sections.schedule && shouldApplyRemoteUpdate('schedule', snapshot.sections.schedule.updatedAt)) {
        recordSyncTimestamp('schedule', snapshot.sections.schedule.updatedAt);
        setSchedule(normalizeScheduleDays(snapshot.sections.schedule.items as ScheduleEvent[]));
      }
      if (snapshot.sections.tracks && shouldApplyRemoteUpdate('tracks', snapshot.sections.tracks.updatedAt)) {
        recordSyncTimestamp('tracks', snapshot.sections.tracks.updatedAt);
        setTracks(snapshot.sections.tracks.items as DomainTrack[]);
      }
      if (snapshot.sections.prizes && shouldApplyRemoteUpdate('prizes', snapshot.sections.prizes.updatedAt)) {
        recordSyncTimestamp('prizes', snapshot.sections.prizes.updatedAt);
        setPrizes(snapshot.sections.prizes.items as PrizeItem[]);
      }
      if (snapshot.sections.faqs && shouldApplyRemoteUpdate('faqs', snapshot.sections.faqs.updatedAt)) {
        recordSyncTimestamp('faqs', snapshot.sections.faqs.updatedAt);
        setFaqs(snapshot.sections.faqs.items as FAQItem[]);
      }
      if (snapshot.sections.announcements && shouldApplyRemoteUpdate('announcements', snapshot.sections.announcements.updatedAt)) {
        recordSyncTimestamp('announcements', snapshot.sections.announcements.updatedAt);
        setAnnouncements(snapshot.sections.announcements.items as Announcement[]);
      } else if (!syncTimestampsRef.current['announcements'] && snapshot.announcements.length > 0) {
        setAnnouncements(snapshot.announcements);
      }
      if (snapshot.sections.core_team_index && shouldApplyRemoteUpdate('core_team_index', snapshot.sections.core_team_index.updatedAt)) {
        recordSyncTimestamp('core_team_index', snapshot.sections.core_team_index.updatedAt);
        coreTeamIndexIdsRef.current = snapshot.sections.core_team_index.items as string[];
      }
      if (snapshot.coreTeam.length > 0) {
        applyCoreTeamSnapshot(snapshot.coreTeam, true);
      }
      if (snapshot.sections.team_sections && shouldApplyRemoteUpdate('team_sections', snapshot.sections.team_sections.updatedAt)) {
        recordSyncTimestamp('team_sections', snapshot.sections.team_sections.updatedAt);
        setCustomTeamSections([...(snapshot.sections.team_sections.items as CustomTeamSection[])].sort((a, b) => a.order - b.order));
      }
      if (snapshot.teams.length > 0 || deletedDoc) {
        applyTeamsSnapshot(snapshot.teams, true);
      }
    } catch {}
  };

  // Central Database Synchronization & Live Polling (Teams, Config, News, Team, Rules, Schedule, Tracks, Prizes, FAQs)
  useEffect(() => {
    let isMounted = true;

    const syncWithCentralDatabase = async () => {
      try {
        const res = await fetch('/api/sync/all');
        if (res.ok) {
          const json = await res.json();
          if (json.success && isMounted) {
            if (json.deletedTeamsSection && Array.isArray(json.deletedTeamsSection.items)) {
              if (shouldApplyRemoteUpdate('deleted_teams', json.deletedTeamsSection.updatedAt)) {
                applyDeletedIdsUpdate(json.deletedTeamsSection.items, json.deletedTeamsSection.updatedAt, true);
              } else {
                applyDeletedIdsUpdate(json.deletedTeamsSection.items);
              }
            } else if (Array.isArray(json.deletedTeamIds) && json.deletedTeamIds.length > 0) {
              applyDeletedIdsUpdate(json.deletedTeamIds);
            }

            if (Array.isArray(json.teams) && json.teams.length > 0) {
              applyTeamsSnapshot(json.teams, false);
            }
            if (json.config && typeof json.config === 'object' && Object.keys(json.config).length > 0) {
              if (shouldApplyRemoteUpdate('config', json.config.updatedAt)) {
                recordSyncTimestamp('config', json.config.updatedAt);
                setEventConfig(prev => ({
                  ...prev,
                  ...json.config,
                  whatsappGroupLink: json.config?.whatsappGroupLink || prev.whatsappGroupLink || initialEventConfig.whatsappGroupLink,
                }));
              }
            }
            if (json.announcementsSection && Array.isArray(json.announcementsSection.items) && shouldApplyRemoteUpdate('announcements', json.announcementsSection.updatedAt)) {
              recordSyncTimestamp('announcements', json.announcementsSection.updatedAt);
              setAnnouncements(json.announcementsSection.items);
            } else if (!syncTimestampsRef.current['announcements'] && Array.isArray(json.announcements) && json.announcements.length > 0) {
              setAnnouncements(json.announcements);
            }
            if (json.coreTeamIndex && Array.isArray(json.coreTeamIndex.items) && shouldApplyRemoteUpdate('core_team_index', json.coreTeamIndex.updatedAt)) {
              recordSyncTimestamp('core_team_index', json.coreTeamIndex.updatedAt);
              coreTeamIndexIdsRef.current = json.coreTeamIndex.items;
            }
            if (Array.isArray(json.coreTeam) && json.coreTeam.length > 0) {
              applyCoreTeamSnapshot(json.coreTeam, false);
            }
            if (json.teamSections && Array.isArray(json.teamSections.items) && shouldApplyRemoteUpdate('team_sections', json.teamSections.updatedAt)) {
              recordSyncTimestamp('team_sections', json.teamSections.updatedAt);
              setCustomTeamSections([...json.teamSections.items].sort((a: CustomTeamSection, b: CustomTeamSection) => a.order - b.order));
            }
            if (json.rules && Array.isArray(json.rules.items) && shouldApplyRemoteUpdate('rules', json.rules.updatedAt)) {
              recordSyncTimestamp('rules', json.rules.updatedAt);
              setRules(json.rules.items);
            }
            if (json.schedule && Array.isArray(json.schedule.items) && shouldApplyRemoteUpdate('schedule', json.schedule.updatedAt)) {
              recordSyncTimestamp('schedule', json.schedule.updatedAt);
              setSchedule(normalizeScheduleDays(json.schedule.items));
            }
            if (json.tracks && Array.isArray(json.tracks.items) && shouldApplyRemoteUpdate('tracks', json.tracks.updatedAt)) {
              recordSyncTimestamp('tracks', json.tracks.updatedAt);
              setTracks(json.tracks.items);
            }
            if (json.prizes && Array.isArray(json.prizes.items) && shouldApplyRemoteUpdate('prizes', json.prizes.updatedAt)) {
              recordSyncTimestamp('prizes', json.prizes.updatedAt);
              setPrizes(json.prizes.items);
            }
            if (json.faqs && Array.isArray(json.faqs.items) && shouldApplyRemoteUpdate('faqs', json.faqs.updatedAt)) {
              recordSyncTimestamp('faqs', json.faqs.updatedAt);
              setFaqs(json.faqs.items);
            }
          }
        } else {
          const teamsRes = await fetch('/api/teams');
          if (teamsRes.ok) {
            const teamsJson = await teamsRes.json();
            if (teamsJson.success && Array.isArray(teamsJson.data) && isMounted) {
              applyTeamsSnapshot(teamsJson.data, false);
            }
          }
        }
      } catch {
        // Fallback to local state if server route is temporarily unreachable
      }
    };

    // Initial load: pull both Firestore (shared across all URLs) and local Express DB
    pullAllFromCloud();
    syncWithCentralDatabase();

    // Live polling every 2.5s for same-server updates + 15s cloud refresh fallback
    const pollTimer = setInterval(syncWithCentralDatabase, 2500);
    const cloudRefreshTimer = setInterval(() => {
      if (isMounted) pullAllFromCloud();
    }, 15000);

    // Refresh immediately whenever tab gains focus or becomes visible on any device
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible' && isMounted) {
        pullAllFromCloud();
        syncWithCentralDatabase();
      }
    };
    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    // Multi-tab broadcast channel
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel('ideation_live_sync');
      channel.onmessage = () => {
        if (isMounted) {
          syncWithCentralDatabase();
          pullAllFromCloud();
        }
      };
    } catch {}

    return () => {
      isMounted = false;
      clearInterval(pollTimer);
      clearInterval(cloudRefreshTimer);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      channel?.close();
    };
  }, [currentTeamSession?.id]);

  const updateEventConfig = (newConfig: Partial<EventConfig>) => {
    const nowIso = new Date().toISOString();
    recordSyncTimestamp('config', nowIso);
    setEventConfig(prev => {
      const merged = { ...prev, ...newConfig, updatedAt: nowIso };
      saveSiteConfigToFirestore(merged, nowIso);
      fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(merged),
      }).catch(() => {});
      broadcastLiveSync('SYNC_CONFIG');
      return merged;
    });
  };

  const updateTrack = (id: string, updated: Partial<DomainTrack>) => {
    setTracks(prev => {
      const next = prev.map(t => (t.id === id ? { ...t, ...updated } : t));
      persistContentSection('tracks', next);
      return next;
    });
  };

  const addTrack = (track: DomainTrack) => {
    setTracks(prev => {
      const next = [...prev, track];
      persistContentSection('tracks', next);
      return next;
    });
  };

  const deleteTrack = (id: string) => {
    setTracks(prev => {
      const next = prev.filter(t => t.id !== id);
      persistContentSection('tracks', next);
      return next;
    });
  };

  const updatePrizes = (newPrizes: PrizeItem[]) => {
    setPrizes(newPrizes);
    persistContentSection('prizes', newPrizes);
  };

  const updateSchedule = (newSchedule: ScheduleEvent[]) => {
    setSchedule(newSchedule);
    persistContentSection('schedule', newSchedule);
  };

  const addScheduleEvent = (event: Omit<ScheduleEvent, 'id'> | ScheduleEvent) => {
    const newEvent: ScheduleEvent = {
      ...event,
      id: 'id' in event && event.id ? event.id : `sch-${Date.now()}`,
    };
    setSchedule(prev => {
      const next = [...prev, newEvent];
      persistContentSection('schedule', next);
      return next;
    });
  };

  const updateScheduleEvent = (id: string, updated: Partial<ScheduleEvent>) => {
    setSchedule(prev => {
      const next = prev.map(s => (s.id === id ? { ...s, ...updated } : s));
      persistContentSection('schedule', next);
      return next;
    });
  };

  const deleteScheduleEvent = (id: string) => {
    setSchedule(prev => {
      const next = prev.filter(s => s.id !== id);
      persistContentSection('schedule', next);
      return next;
    });
  };

  const resetScheduleToDefault = () => {
    setSchedule(initialSchedule);
    persistContentSection('schedule', initialSchedule);
  };

  const persistAnnouncementsSnapshot = (next: Announcement[]) => {
    persistContentSection('announcements', next);
    fetch('/api/announcements/sync', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: next }),
    }).catch(() => {});
  };

  const addAnnouncement = (item: Omit<Announcement, 'id' | 'date'>) => {
    const newAnnouncement: Announcement = {
      ...item,
      id: `a-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
    };
    setAnnouncements(prev => {
      const next = [newAnnouncement, ...prev];
      saveAnnouncementToFirestore(newAnnouncement);
      persistAnnouncementsSnapshot(next);
      return next;
    });
  };

  const updateAnnouncement = (id: string, updated: Partial<Announcement>) => {
    setAnnouncements(prev => {
      const next = prev.map(a => (a.id === id ? { ...a, ...updated } : a));
      const target = next.find(a => a.id === id);
      if (target) {
        saveAnnouncementToFirestore(target);
      }
      persistAnnouncementsSnapshot(next);
      return next;
    });
  };

  const deleteAnnouncement = (id: string) => {
    setAnnouncements(prev => {
      const next = prev.filter(a => a.id !== id);
      deleteAnnouncementFromFirestore(id);
      persistAnnouncementsSnapshot(next);
      return next;
    });
  };

  const persistCoreTeamSnapshot = (next: CoreTeamMember[], removedId?: string) => {
    const ids = next.map((m) => m.id);
    coreTeamIndexIdsRef.current = ids;
    Promise.all(next.map((m) => saveCoreMemberToFirestore(m))).catch(() => {});
    if (removedId) {
      deleteCoreMemberFromFirestore(removedId).catch(() => {});
    }
    persistContentSection('core_team_index', ids);
    fetch('/api/core-team/sync', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: next }),
    }).catch(() => {});
    broadcastLiveSync('SYNC_CORE_TEAM');
  };

  const updateCoreMember = (id: string, updated: Partial<CoreTeamMember>) => {
    setCoreTeam(prev => {
      const next = prev.map(m => (m.id === id ? { ...m, ...updated } : m));
      persistCoreTeamSnapshot(next);
      return next;
    });
  };

  const addCoreMember = (member: Omit<CoreTeamMember, 'id'>) => {
    const newMember: CoreTeamMember = {
      ...member,
      id: `ct-${Date.now()}`,
    };
    setCoreTeam(prev => {
      const next = [...prev, newMember];
      persistCoreTeamSnapshot(next);
      return next;
    });
  };

  const deleteCoreMember = (id: string) => {
    setCoreTeam(prev => {
      const next = prev.filter(m => m.id !== id);
      persistCoreTeamSnapshot(next, id);
      return next;
    });
  };

  const reorderCoreTeam = (sourceIndex: number, destIndex: number) => {
    setCoreTeam(prev => {
      const copy = [...prev];
      const [removed] = copy.splice(sourceIndex, 1);
      copy.splice(destIndex, 0, removed);
      const reordered = copy.map((m, idx) => ({ ...m, order: idx + 1 }));
      persistCoreTeamSnapshot(reordered);
      return reordered;
    });
  };

  const BUILT_IN_CATEGORIES = new Set(['faculty', 'student co-ordinator', 'contact helpline']);

  const ensureCustomTeamSection = (rawName: string) => {
    const cleanName = rawName.trim();
    if (!cleanName || BUILT_IN_CATEGORIES.has(cleanName.toLowerCase())) return;
    setCustomTeamSections(prev => {
      if (prev.some(s => s.name.trim().toLowerCase() === cleanName.toLowerCase())) {
        return prev;
      }
      const next: CustomTeamSection[] = [
        ...prev,
        {
          id: `sec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: cleanName,
          accentColor: (['magenta', 'cyan', 'emerald', 'amber'] as const)[prev.length % 4],
          order: prev.length + 1,
        },
      ];
      persistContentSection('team_sections', next);
      return next;
    });
  };

  const addCustomTeamSection = (section: Omit<CustomTeamSection, 'id' | 'order'>): CustomTeamSection | null => {
    const cleanName = section.name.trim();
    if (!cleanName || BUILT_IN_CATEGORIES.has(cleanName.toLowerCase())) return null;

    let created: CustomTeamSection | null = null;
    setCustomTeamSections(prev => {
      const existing = prev.find(s => s.name.trim().toLowerCase() === cleanName.toLowerCase());
      if (existing) {
        created = existing;
        return prev;
      }
      const newSec: CustomTeamSection = {
        id: `sec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: cleanName,
        description: section.description?.trim() || undefined,
        accentColor: section.accentColor || (['magenta', 'cyan', 'emerald', 'amber'] as const)[prev.length % 4],
        order: prev.length + 1,
      };
      created = newSec;
      const next = [...prev, newSec];
      persistContentSection('team_sections', next);
      return next;
    });
    return created;
  };

  const updateCustomTeamSection = (id: string, updated: Partial<CustomTeamSection>) => {
    const existing = customTeamSections.find(s => s.id === id);
    if (!existing) return;

    const nextName = updated.name !== undefined ? updated.name.trim() : existing.name;
    if (!nextName) return;

    setCustomTeamSections(prev => {
      const next = prev.map(s =>
        s.id === id
          ? {
              ...s,
              ...updated,
              name: nextName,
              description: updated.description !== undefined ? updated.description.trim() || undefined : s.description,
            }
          : s
      );
      persistContentSection('team_sections', next);
      return next;
    });

    if (nextName !== existing.name) {
      const oldLower = existing.name.trim().toLowerCase();
      setCoreTeam(prev => {
        let changed = false;
        const next = prev.map(m => {
          if (m.category.trim().toLowerCase() === oldLower) {
            changed = true;
            return { ...m, category: nextName };
          }
          return m;
        });
        if (changed) {
          persistCoreTeamSnapshot(next);
        }
        return next;
      });
    }
  };

  const deleteCustomTeamSection = (id: string, reassignTo = 'Student Co-ordinator') => {
    const target = customTeamSections.find(s => s.id === id);
    setCustomTeamSections(prev => {
      const next = prev
        .filter(s => s.id !== id)
        .map((s, idx) => ({ ...s, order: idx + 1 }));
      persistContentSection('team_sections', next);
      return next;
    });

    if (target) {
      const targetLower = target.name.trim().toLowerCase();
      setCoreTeam(prev => {
        let changed = false;
        const next = prev.map(m => {
          if (m.category.trim().toLowerCase() === targetLower) {
            changed = true;
            return { ...m, category: reassignTo };
          }
          return m;
        });
        if (changed) {
          persistCoreTeamSnapshot(next);
        }
        return next;
      });
    }
  };

  const updateRules = (newRules: RuleItem[]) => {
    setRules(newRules);
    persistContentSection('rules', newRules);
  };

  const addRule = (rule: Omit<RuleItem, 'id'>) => {
    const newRule: RuleItem = {
      ...rule,
      id: `r-${Date.now()}`,
    };
    setRules(prev => {
      const next = [...prev, newRule];
      persistContentSection('rules', next);
      return next;
    });
  };

  const updateRule = (id: string, updated: Partial<RuleItem>) => {
    setRules(prev => {
      const next = prev.map(r => (r.id === id ? { ...r, ...updated } : r));
      persistContentSection('rules', next);
      return next;
    });
  };

  const deleteRule = (id: string) => {
    setRules(prev => {
      const next = prev.filter(r => r.id !== id);
      persistContentSection('rules', next);
      return next;
    });
  };

  const resetRulesToDefault = () => {
    setRules(initialRules);
    persistContentSection('rules', initialRules);
  };

  const updateFAQs = (newFaqs: FAQItem[]) => {
    setFaqs(newFaqs);
    persistContentSection('faqs', newFaqs);
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

    // Generate collision-safe Team ID even after deletions
    const numericIds = [...registeredTeams.map((t) => t.id), ...deletedTeamIdsRef.current]
      .map((id) => {
        const m = String(id).match(/\d+/);
        return m ? parseInt(m[0], 10) : 0;
      })
      .filter((n) => !Number.isNaN(n));
    const nextNumber = (numericIds.length > 0 ? Math.max(...numericIds) : 0) + 1;
    const teamId = `IDN-${String(nextNumber).padStart(4, '0')}`;

    const newTeam: RegisteredTeam = {
      ...teamData,
      id: teamId,
      registeredAt: new Date().toISOString(),
      checkedIn: false,
      mealCode: getTeamMealCode({ id: teamId, teamName: teamData.teamName }),
      mealLogs: [],
    };

    setRegisteredTeams(prev => [newTeam, ...prev]);
    setCurrentTeamSession(newTeam);

    // 1. Save to Firestore Cloud Database (accessible worldwide from any laptop, mobile, browser, and URL)
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

    // 4. Optional Supabase mirror if configured
    if (isSupabaseConfigured && supabase) {
      const leader = newTeam.members.find((m) => m.isLeader) || newTeam.members[0];
      supabase
        .from('teams')
        .upsert({
          id: newTeam.id,
          team_name: newTeam.teamName,
          college: newTeam.college,
          primary_track: newTeam.primaryTrack,
          payment_status: newTeam.paymentStatus,
          leader_email: leader?.email || '',
        })
        .then(() => {}, () => {});
    }

    // 5. Broadcast live sync to all tabs
    broadcastLiveSync('SYNC_TEAMS');

    return { success: true, teamId };
  };

  const updateTeam = (id: string, updated: Partial<RegisteredTeam>) => {
    setRegisteredTeams(prev => prev.map(t => (t.id === id ? { ...t, ...updated } : t)));
    if (currentTeamSession?.id === id) {
      setCurrentTeamSession(prev => (prev ? { ...prev, ...updated } : null));
    }
  };

  const deleteTeam = async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const normalizedId = id.trim().toUpperCase();
      const remainingTeams = registeredTeams.filter((t) => t.id.toUpperCase() !== normalizedId);

      // Record deleted ID globally so no polling or stale URL resurrects the deleted team
      const nextDeleted = Array.from(new Set([...deletedTeamIdsRef.current, normalizedId]));
      const nowIso = new Date().toISOString();
      applyDeletedIdsUpdate(nextDeleted, nowIso, true);
      persistContentSection('deleted_teams', nextDeleted);

      setRegisteredTeams(remainingTeams);
      if (currentTeamSession?.id.toUpperCase() === normalizedId) {
        setCurrentTeamSession(null);
      }
      setSubmissionNotifications((prev) => prev.filter((n) => n.teamId.toUpperCase() !== normalizedId));

      // 1. Delete from Firestore (all URLs & devices)
      await deleteTeamFromFirestore(id);

      // 2. Delete from Express central database
      fetch(`/api/teams/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      }).catch((err) => {
        console.warn('Central DB delete team warning:', err);
      });

      // 3. Optional Supabase cleanup
      if (isSupabaseConfigured && supabase) {
        supabase
          .from('teams')
          .delete()
          .eq('id', id)
          .then(() => {}, () => {});
      }

      // 4. Re-sync Google Sheets if connected
      const currentGToken = googleAccessToken || getGoogleAccessToken();
      if (currentGToken) {
        syncAllTeamsToGoogleSheet(currentGToken, remainingTeams).catch(console.warn);
      }

      // 5. Broadcast live sync to all tabs
      broadcastLiveSync('SYNC_TEAMS');

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to delete team' };
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checkedIn: newStatus }),
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

  const removeCheckInEntry = (id: string): { success: boolean; error?: string } => {
    const team = registeredTeams.find((t) => t.id === id);
    if (!team) {
      return { success: false, error: 'Team not found with ID ' + id };
    }

    setRegisteredTeams((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              checkedIn: false,
              checkedInAt: undefined,
            }
          : t
      )
    );

    if (currentTeamSession?.id === id) {
      setCurrentTeamSession((prev) =>
        prev ? { ...prev, checkedIn: false, checkedInAt: undefined } : null
      );
    }

    // 1. Clear in Firestore Cloud Database
    updateTeamCheckInInFirestore(id, false, undefined);

    // 2. Clear in Express Central Database
    fetch(`/api/teams/${encodeURIComponent(id)}/checkin`, {
      method: 'DELETE',
    }).catch((err) => {
      console.warn('Central DB remove checkin entry warning:', err);
    });

    // 3. Broadcast live update
    broadcastLiveSync('SYNC_TEAMS');

    return { success: true };
  };

  const recordTeamMealScan = (
    qrOrTeamQuery: string,
    day: MealDay,
    mealType: MealType,
    scannedBy?: string,
    targetMemberId?: string
  ): MealScanResult => {
    const parsed = parseMealQrInput(qrOrTeamQuery);
    const lookup = parsed.idOrCode.trim().toUpperCase();
    if (!lookup) {
      return {
        success: false,
        message: 'Empty QR code or Team ID. Please scan a valid Team QR Pass.',
      };
    }

    const team = registeredTeams.find((t) => {
      const teamMealCode = getTeamMealCode(t).toUpperCase();
      return (
        t.id.toUpperCase() === lookup ||
        teamMealCode === lookup ||
        (parsed.mealCode && teamMealCode === parsed.mealCode.toUpperCase()) ||
        t.teamName.toUpperCase() === lookup ||
        t.members.some((m) => m.email.toUpperCase() === lookup || m.usn.toUpperCase() === lookup)
      );
    });

    if (!team) {
      return {
        success: false,
        message: `No registered team found for "${qrOrTeamQuery.trim()}". Please check Team ID or Team QR.`,
      };
    }

    const resolvedCode = getTeamMealCode(team);
    const existingLogs = Array.isArray(team.mealLogs) ? team.mealLogs : [];
    const currentProgress = getTeamMealSlotProgress(team, day, mealType);
    const cooldown = evaluateMealCooldown(existingLogs, Date.now(), team, day, mealType);

    // Case 1: All members in this team have ALREADY been scanned for this (day, mealType) -> SERVED
    if (currentProgress.isServed) {
      if (cooldown.blocked) {
        const nextTimeStr = cooldown.nextEligibleAt
          ? new Date(cooldown.nextEligibleAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : '3 hours';
        return {
          success: false,
          team: { ...team, mealCode: resolvedCode },
          slotProgress: currentProgress,
          allMembersServed: true,
          alreadyServed: true,
          blockedByCooldown: true,
          remainingMs: cooldown.remainingMs,
          nextEligibleAt: cooldown.nextEligibleAt,
          lastScan: cooldown.lastScan,
          message: `SERVED (${currentProgress.scannedCount}/${currentProgress.totalMembers}) · 3-Hour Cooldown Active! Team ${team.teamName} already scanned all members for ${mealType} (${day}). Rescan unlocks in ${formatCooldownDuration(cooldown.remainingMs)} (at ${nextTimeStr}).`,
        };
      }
      return {
        success: false,
        team: { ...team, mealCode: resolvedCode },
        slotProgress: currentProgress,
        allMembersServed: true,
        alreadyServed: true,
        message: `Team ${team.teamName} (${team.id}) already completed all ${currentProgress.totalMembers}/${currentProgress.totalMembers} members for ${mealType} (${day}) — Status: SERVED.`,
      };
    }

    // Case 2: Team completed/scanned another meal session less than 3 hours ago
    if (cooldown.blocked) {
      const nextTimeStr = cooldown.nextEligibleAt
        ? new Date(cooldown.nextEligibleAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : '3 hours';
      return {
        success: false,
        team: { ...team, mealCode: resolvedCode },
        slotProgress: currentProgress,
        blockedByCooldown: true,
        remainingMs: cooldown.remainingMs,
        nextEligibleAt: cooldown.nextEligibleAt,
        lastScan: cooldown.lastScan,
        message: `3-Hour Cooldown Active! Team ${team.teamName} (${team.id}) claimed ${cooldown.lastScan?.mealType} (${cooldown.lastScan?.day}). Rescan allowed in ${formatCooldownDuration(cooldown.remainingMs)} (at ${nextTimeStr}).`,
      };
    }

    // Case 3: Pick which member is scanning now (explicit memberId/QR or next unserved member)
    const explicitMemberId = targetMemberId || parsed.memberId;
    let targetMember = explicitMemberId
      ? team.members.find((m) => m.id === explicitMemberId)
      : typeof parsed.memberIndex === 'number' && team.members[parsed.memberIndex]
      ? team.members[parsed.memberIndex]
      : currentProgress.remainingMembers[0];

    if (!targetMember && team.members.length > 0 && explicitMemberId) {
      return {
        success: false,
        team: { ...team, mealCode: resolvedCode },
        slotProgress: currentProgress,
        message: `Member reference not found in team ${team.teamName}.`,
      };
    }

    if (targetMember && currentProgress.scannedMembers.some((m) => m.id === targetMember!.id)) {
      return {
        success: false,
        team: { ...team, mealCode: resolvedCode },
        slotProgress: currentProgress,
        alreadyMemberScanned: true,
        scannedMemberName: targetMember.name,
        scannedMemberUsn: targetMember.usn,
        message: `${targetMember.name} (${targetMember.usn}) is already scanned for ${mealType} (${day}). Scan the remaining ${currentProgress.remainingMembers.length} member(s) of ${team.teamName} to mark SERVED.`,
      };
    }

    const newRecord: MealScanRecord = {
      id: `meal-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      day,
      mealType,
      scannedAt: new Date().toISOString(),
      scannedBy: scannedBy || 'Food Counter Desk',
      memberCount: targetMember ? 1 : team.members.length,
      memberId: targetMember?.id,
      memberName: targetMember?.name,
      memberUsn: targetMember?.usn,
    };

    const nextLogs = [...existingLogs, newRecord];
    const updatedTeam: RegisteredTeam = {
      ...team,
      mealCode: resolvedCode,
      mealLogs: nextLogs,
    };

    const nextProgress = getTeamMealSlotProgress(updatedTeam, day, mealType);

    setRegisteredTeams((prev) => prev.map((t) => (t.id === team.id ? updatedTeam : t)));
    if (currentTeamSession?.id === team.id) {
      setCurrentTeamSession(updatedTeam);
    }

    // Persist to Firestore Cloud Database (cross-device live sync)
    updateTeamMealLogsInFirestore(team.id, resolvedCode, nextLogs);

    // Persist to Express Central Database
    const memberIdx = targetMember
      ? team.members.findIndex((m) => m.id === targetMember!.id)
      : -1;
    fetch(`/api/teams/${encodeURIComponent(team.id)}/meal-scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        day,
        mealType,
        mealCode: resolvedCode,
        scannedBy: scannedBy || 'Food Counter Desk',
        memberId: targetMember?.id,
        memberIndex: memberIdx >= 0 ? memberIdx : undefined,
      }),
    }).catch((err) => {
      console.warn('Central DB meal scan sync warning:', err);
    });

    broadcastLiveSync('SYNC_TEAMS');

    return {
      success: true,
      team: updatedTeam,
      scanRecord: newRecord,
      scannedMemberName: targetMember?.name,
      scannedMemberUsn: targetMember?.usn,
      slotProgress: nextProgress,
      allMembersServed: nextProgress.isServed,
      message: nextProgress.isServed
        ? `ALL ${nextProgress.totalMembers}/${nextProgress.totalMembers} MEMBERS SCANNED (${targetMember?.name || team.teamName}) — ${mealType} (${day}) MARKED AS SERVED! 3-hour cooldown starts now.`
        : `Member ${nextProgress.scannedCount}/${nextProgress.totalMembers} Scanned: ${targetMember?.name} (${targetMember?.usn}). Scan ${nextProgress.remainingMembers.length} remaining member(s) to mark ${mealType} (${day}) as SERVED.`,
    };
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

  const syncAllToCloud = async (): Promise<{ success: boolean; syncedAt: string }> => {
    setIsSyncingAll(true);
    const nowIso = new Date().toISOString();
    try {
      const mergedConfig = { ...eventConfig, updatedAt: nowIso };
      const coreIds = coreTeam.map((m) => m.id);
      coreTeamIndexIdsRef.current = coreIds;

      recordSyncTimestamp('config', nowIso);
      recordSyncTimestamp('rules', nowIso);
      recordSyncTimestamp('schedule', nowIso);
      recordSyncTimestamp('tracks', nowIso);
      recordSyncTimestamp('prizes', nowIso);
      recordSyncTimestamp('faqs', nowIso);
      recordSyncTimestamp('announcements', nowIso);
      recordSyncTimestamp('core_team_index', nowIso);
      recordSyncTimestamp('team_sections', nowIso);
      recordSyncTimestamp('deleted_teams', nowIso);

      await Promise.all([
        saveSiteConfigToFirestore(mergedConfig, nowIso),
        saveSiteContentToFirestore('rules', rules, nowIso),
        saveSiteContentToFirestore('schedule', schedule, nowIso),
        saveSiteContentToFirestore('tracks', tracks, nowIso),
        saveSiteContentToFirestore('prizes', prizes, nowIso),
        saveSiteContentToFirestore('faqs', faqs, nowIso),
        saveSiteContentToFirestore('announcements', announcements, nowIso),
        saveSiteContentToFirestore('core_team_index', coreIds, nowIso),
        saveSiteContentToFirestore('team_sections', customTeamSections, nowIso),
        saveSiteContentToFirestore('deleted_teams', deletedTeamIdsRef.current, nowIso),
        ...coreTeam.map((m) => saveCoreMemberToFirestore(m)),
        ...announcements.map((a) => saveAnnouncementToFirestore(a)),
        ...registeredTeams.map((t) => saveTeamToFirestore(t)),
        ...deletedTeamIdsRef.current.map((delId) => deleteTeamFromFirestore(delId)),
      ]);

      await fetch('/api/sync/push-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          updatedAt: nowIso,
          config: mergedConfig,
          announcements,
          coreTeam,
          teamSections: customTeamSections,
          rules,
          schedule,
          tracks,
          prizes,
          faqs,
          teams: registeredTeams,
          deletedTeamIds: deletedTeamIdsRef.current,
        }),
      }).catch(() => {});

      broadcastLiveSync('SYNC_ALL');
      return { success: true, syncedAt: nowIso };
    } catch (err) {
      console.warn('syncAllToCloud warning:', err);
      return { success: false, syncedAt: nowIso };
    } finally {
      setIsSyncingAll(false);
    }
  };

  const resetAllData = () => {
    localStorage.clear();
    const nowIso = new Date().toISOString();
    const resetConfig = { ...initialEventConfig, updatedAt: nowIso };
    deletedTeamIdsRef.current = [];
    coreTeamIndexIdsRef.current = initialCoreTeam.map((m) => m.id);
    recordSyncTimestamp('config', nowIso);
    recordSyncTimestamp('deleted_teams', nowIso);
    setEventConfig(resetConfig);
    saveSiteConfigToFirestore(resetConfig, nowIso);
    saveSiteContentToFirestore('deleted_teams', [], nowIso);
    fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(resetConfig),
    }).catch(() => {});

    setTracks(initialTracks);
    persistContentSection('tracks', initialTracks);

    setPrizes(initialPrizes);
    persistContentSection('prizes', initialPrizes);

    setSchedule(initialSchedule);
    persistContentSection('schedule', initialSchedule);

    setRules(initialRules);
    persistContentSection('rules', initialRules);

    setFaqs(initialFAQs);
    persistContentSection('faqs', initialFAQs);

    setAnnouncements(initialAnnouncements);
    persistAnnouncementsSnapshot(initialAnnouncements);

    setCoreTeam(initialCoreTeam);
    persistCoreTeamSnapshot(initialCoreTeam);

    setCustomTeamSections([]);
    persistContentSection('team_sections', []);

    setRegisteredTeams(initialRegisteredTeams);
    setCurrentTeamSession(null);
    broadcastLiveSync('SYNC_ALL');
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
        customTeamSections,
        addCustomTeamSection,
        updateCustomTeamSection,
        deleteCustomTeamSection,
        ensureCustomTeamSection,
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
        deleteTeam,
        updatePaymentStatus,
        toggleCheckIn,
        removeCheckInEntry,
        recordTeamMealScan,
        currentTeamSession,
        setCurrentTeamSession,
        selectedTrackForRegistration,
        setSelectedTrackForRegistration,
        activeView,
        setActiveView,
        navigateTo,
        showRegisterModal,
        setShowRegisterModal,
        showCoreTeamPanel,
        setShowCoreTeamPanel,
        exportTeamsToCSV,
        exportTeamsToSQL,
        resetAllData,
        syncAllToCloud,
        isSyncingAll,
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
