import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  updateDoc,
  getDocFromServer,
  query,
  orderBy,
  Unsubscribe,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { RegisteredTeam, ProjectSubmission, EventConfig, Announcement, CoreTeamMember, MealScanRecord } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export class FirestorePermissionError extends Error {
  constructor(public info: FirestoreErrorInfo) {
    super(JSON.stringify(info));
    this.name = 'FirestorePermissionError';
  }
}

function buildFirestoreErrorInfo(
  error: unknown,
  operationType: OperationType,
  path: string | null
): FirestoreErrorInfo {
  return {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo = buildFirestoreErrorInfo(error, operationType, path);
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Circuit breaker for Firestore daily free-tier quota errors so polling/retries back off cleanly
let firestoreQuotaExhaustedUntilMs = 0;

export function isFirestoreQuotaExhausted(): boolean {
  return Date.now() < firestoreQuotaExhaustedUntilMs;
}

export function isQuotaError(error: unknown): boolean {
  const msg = (error instanceof Error ? error.message : String(error || '')).toLowerCase();
  return (
    msg.includes('quota exceeded') ||
    msg.includes('resource-exhausted') ||
    msg.includes('resource_exhausted')
  );
}

function logFirestoreWarning(
  error: unknown,
  operationType: OperationType,
  path: string | null
) {
  if (isQuotaError(error)) {
    firestoreQuotaExhaustedUntilMs = Date.now() + 10 * 60 * 1000;
  }
  const errInfo = buildFirestoreErrorInfo(error, operationType, path);
  console.warn('Firestore Sync Warning: ', JSON.stringify(errInfo));
}

function stripUndefined<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj)) as T;
}

// Initialize Firebase App instance
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth
export const auth = getAuth(app);

// Initialize Firestore (using databaseId if provisioned)
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Configure Google OAuth Provider with Google Sheets and Google Drive scopes
export const googleAuthProvider = new GoogleAuthProvider();
googleAuthProvider.addScope('https://www.googleapis.com/auth/spreadsheets');
googleAuthProvider.addScope('https://www.googleapis.com/auth/drive.file');

// In-memory cache for the OAuth access token
let cachedAccessToken: string | null = null;

// Auth listener
export const initGoogleAuth = (
  onSuccess?: (user: User, token: string | null) => void,
  onSignOut?: () => void
) => {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      if (onSuccess) onSuccess(user, cachedAccessToken);
    } else {
      cachedAccessToken = null;
      if (onSignOut) onSignOut();
    }
  });
};

// Sign in with Google to get Google Sheets access
export const signInWithGoogle = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    const result = await signInWithPopup(auth, googleAuthProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const accessToken = credential?.accessToken || null;

    if (accessToken) {
      cachedAccessToken = accessToken;
      sessionStorage.setItem('ideation_google_sheets_token', accessToken);
    }

    return {
      user: result.user,
      accessToken: accessToken || '',
    };
  } catch (error) {
    console.error('Google Sign-In error:', error);
    throw error;
  }
};

export const getGoogleAccessToken = (): string | null => {
  if (cachedAccessToken) return cachedAccessToken;
  return sessionStorage.getItem('ideation_google_sheets_token');
};

export const signOutGoogle = async () => {
  await signOut(auth);
  cachedAccessToken = null;
  sessionStorage.removeItem('ideation_google_sheets_token');
};

// Test Firestore Connection
export async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore offline or pending connection.');
    }
  }
}

// -----------------------------------------------------------------------------
// FIRESTORE CLOUD DATABASE HELPERS FOR CENTRAL REGISTRATIONS
// -----------------------------------------------------------------------------

function sanitizeSubmissionForFirestore(submission: ProjectSubmission): ProjectSubmission {
  const safeSub: ProjectSubmission = { ...submission };
  try {
    if (safeSub.pptFileData && JSON.stringify(safeSub).length > 500000) {
      delete safeSub.pptFileData;
    }
  } catch {
    delete safeSub.pptFileData;
  }
  return safeSub;
}

export async function saveTeamToFirestore(team: RegisteredTeam): Promise<void> {
  const path = `teams/${team.id}`;
  try {
    const leader = team.members.find((m) => m.isLeader) || team.members[0];
    const memberEmails = team.members.map((m) => m.email.trim().toLowerCase());
    const safeSubmission = team.submission ? sanitizeSubmissionForFirestore(team.submission) : null;
    const safeScreenshot =
      team.paymentScreenshotUrl && team.paymentScreenshotUrl.length <= 350000
        ? team.paymentScreenshotUrl
        : '';

    const docData = stripUndefined({
      id: team.id,
      teamName: team.teamName,
      college: team.college,
      city: team.city,
      department: team.department,
      course: team.course,
      primaryTrack: team.primaryTrack,
      backupTrack: team.backupTrack || '',
      track: team.track || '',
      problemStatement: team.problemStatement || '',
      ideaTitle: team.ideaTitle || '',
      ideaSummary: team.ideaSummary || '',
      paymentStatus: team.paymentStatus,
      paymentTransactionId: team.paymentTransactionId || '',
      paymentScreenshotUrl: safeScreenshot,
      paymentRemarks: team.paymentRemarks || '',
      registeredAt: team.registeredAt,
      updatedAt: team.updatedAt || team.registeredAt || new Date().toISOString(),
      checkedIn: team.checkedIn,
      checkedInAt: team.checkedInAt || null,
      leaderEmail: (leader?.email || '').toLowerCase(),
      leaderPhone: leader?.phone || '',
      memberEmails: memberEmails.join(','),
      members: JSON.stringify(team.members),
      mealCode: team.mealCode || '',
      mealLogs: Array.isArray(team.mealLogs) ? JSON.stringify(team.mealLogs) : null,
      submission: safeSubmission ? JSON.stringify(safeSubmission) : null,
    });

    const teamRef = doc(db, 'teams', team.id);
    await setDoc(teamRef, docData, { merge: true });
  } catch (err) {
    logFirestoreWarning(err, OperationType.WRITE, path);
  }
}

export async function updateTeamPaymentInFirestore(
  teamId: string,
  status: 'Pending' | 'Verified' | 'Rejected',
  remarks?: string,
  updatedAt?: string
): Promise<void> {
  const path = `teams/${teamId}`;
  try {
    const teamRef = doc(db, 'teams', teamId);
    await setDoc(
      teamRef,
      {
        id: teamId,
        paymentStatus: status,
        paymentRemarks: remarks !== undefined ? remarks : '',
        updatedAt: updatedAt || new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    logFirestoreWarning(err, OperationType.UPDATE, path);
  }
}

export async function updateTeamCheckInInFirestore(
  teamId: string,
  checkedIn: boolean,
  checkedInAt?: string,
  updatedAt?: string
): Promise<void> {
  const path = `teams/${teamId}`;
  try {
    const teamRef = doc(db, 'teams', teamId);
    await setDoc(
      teamRef,
      {
        id: teamId,
        checkedIn,
        checkedInAt: checkedInAt || null,
        updatedAt: updatedAt || new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    logFirestoreWarning(err, OperationType.UPDATE, path);
  }
}

export async function updateTeamSubmissionInFirestore(
  teamId: string,
  submission: ProjectSubmission,
  updatedAt?: string
): Promise<void> {
  const path = `teams/${teamId}`;
  try {
    const teamRef = doc(db, 'teams', teamId);
    const safeSubmission = sanitizeSubmissionForFirestore(submission);
    await setDoc(
      teamRef,
      {
        id: teamId,
        submission: JSON.stringify(safeSubmission),
        ideaTitle: safeSubmission.projectTitle || undefined,
        ideaSummary: safeSubmission.ideaSummary || undefined,
        updatedAt: updatedAt || new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    logFirestoreWarning(err, OperationType.UPDATE, path);
  }
}

export async function updateTeamMealLogsInFirestore(
  teamId: string,
  mealCode: string,
  mealLogs: MealScanRecord[],
  updatedAt?: string
): Promise<void> {
  const path = `teams/${teamId}`;
  try {
    const teamRef = doc(db, 'teams', teamId);
    await setDoc(
      teamRef,
      {
        id: teamId,
        mealCode,
        mealLogs: JSON.stringify(mealLogs),
        updatedAt: updatedAt || new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    logFirestoreWarning(err, OperationType.UPDATE, path);
  }
}

export async function deleteTeamFromFirestore(teamId: string): Promise<void> {
  const path = `teams/${teamId}`;
  try {
    const teamRef = doc(db, 'teams', teamId);
    await deleteDoc(teamRef);
  } catch (err) {
    logFirestoreWarning(err, OperationType.DELETE, path);
  }
}

function mapFirestoreDocToTeam(docId: string, data: Record<string, any>): RegisteredTeam {
  let parsedMembers = [];
  try {
    parsedMembers = typeof data.members === 'string' ? JSON.parse(data.members) : data.members;
  } catch {
    parsedMembers = [];
  }

  let parsedSubmission: ProjectSubmission | undefined = undefined;
  try {
    if (data.submission) {
      parsedSubmission = typeof data.submission === 'string' ? JSON.parse(data.submission) : data.submission;
    }
  } catch {
    parsedSubmission = undefined;
  }

  let parsedMealLogs: MealScanRecord[] | undefined = undefined;
  try {
    if (data.mealLogs) {
      parsedMealLogs = typeof data.mealLogs === 'string' ? JSON.parse(data.mealLogs) : data.mealLogs;
    }
  } catch {
    parsedMealLogs = undefined;
  }

  return {
    id: data.id || docId,
    teamName: data.teamName || '',
    college: data.college || '',
    city: data.city || '',
    department: data.department || '',
    course: data.course || 'B.E / B.Tech',
    primaryTrack: data.primaryTrack || '',
    backupTrack: data.backupTrack || '',
    track: data.track || undefined,
    problemStatement: data.problemStatement || undefined,
    ideaTitle: data.ideaTitle || '',
    ideaSummary: data.ideaSummary || '',
    paymentStatus: data.paymentStatus || 'Pending',
    paymentTransactionId: data.paymentTransactionId || '',
    paymentScreenshotUrl: typeof data.paymentScreenshotUrl === 'string' && data.paymentScreenshotUrl ? data.paymentScreenshotUrl : undefined,
    paymentRemarks: data.paymentRemarks,
    registeredAt: data.registeredAt || new Date().toISOString(),
    updatedAt: typeof data.updatedAt === 'string' && data.updatedAt ? data.updatedAt : data.registeredAt,
    checkedIn: Boolean(data.checkedIn),
    checkedInAt: data.checkedInAt || undefined,
    members: Array.isArray(parsedMembers) ? parsedMembers : [],
    mealCode: typeof data.mealCode === 'string' && data.mealCode ? data.mealCode : undefined,
    mealLogs: Array.isArray(parsedMealLogs) ? parsedMealLogs : undefined,
    submission: parsedSubmission,
  };
}

export async function fetchAllTeamsFromFirestoreWithStatus(): Promise<{
  teams: RegisteredTeam[];
  ok: boolean;
  quotaExceeded: boolean;
}> {
  try {
    const colRef = collection(db, 'teams');
    const snapshot = await getDocs(colRef);
    const teams: RegisteredTeam[] = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data?.id || data?.teamName) {
        teams.push(mapFirestoreDocToTeam(docSnap.id, data));
      }
    });

    return { teams, ok: true, quotaExceeded: false };
  } catch (err) {
    const quota = isQuotaError(err);
    logFirestoreWarning(err, OperationType.LIST, 'teams');
    return { teams: [], ok: false, quotaExceeded: quota };
  }
}

export async function fetchAllTeamsFromFirestore(): Promise<RegisteredTeam[]> {
  const res = await fetchAllTeamsFromFirestoreWithStatus();
  return res.teams;
}

export function subscribeFirestoreTeams(
  callback: (teams: RegisteredTeam[], fromServer: boolean) => void
): Unsubscribe {
  const path = 'teams';
  const colRef = collection(db, 'teams');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const teams: RegisteredTeam[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data?.id || data?.teamName) {
          teams.push(mapFirestoreDocToTeam(docSnap.id, data));
        }
      });
      // Sort newest first
      teams.sort((a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime());
      callback(teams, !snapshot.metadata.fromCache);
    },
    (err) => {
      logFirestoreWarning(err, OperationType.LIST, path);
    }
  );
}

// -----------------------------------------------------------------------------
// FIRESTORE LIVE REAL-TIME SYNC FOR SITE CONFIG & LINKS
// -----------------------------------------------------------------------------

export async function saveSiteConfigToFirestore(config: Partial<EventConfig>, updatedAt?: string): Promise<void> {
  const path = 'site_config/event_config';
  try {
    const configRef = doc(db, 'site_config', 'event_config');
    const cleanConfig = stripUndefined({
      ...config,
      updatedAt: updatedAt || config.updatedAt || new Date().toISOString(),
    });
    await setDoc(configRef, cleanConfig, { merge: true });
  } catch (error) {
    logFirestoreWarning(error, OperationType.WRITE, path);
  }
}

export function subscribeFirestoreSiteConfig(
  callback: (config: Partial<EventConfig>) => void
): Unsubscribe {
  const path = 'site_config/event_config';
  const configRef = doc(db, 'site_config', 'event_config');
  return onSnapshot(
    configRef,
    (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data() as Partial<EventConfig>);
      }
    },
    (err) => {
      logFirestoreWarning(err, OperationType.GET, path);
    }
  );
}

// -----------------------------------------------------------------------------
// FIRESTORE LIVE REAL-TIME SYNC FOR ANNOUNCEMENTS & NEWS LINKS
// -----------------------------------------------------------------------------

export async function saveAnnouncementToFirestore(announcement: Announcement): Promise<void> {
  const path = `announcements/${announcement.id}`;
  try {
    const docRef = doc(db, 'announcements', announcement.id);
    await setDoc(docRef, stripUndefined(announcement));
  } catch (error) {
    logFirestoreWarning(error, OperationType.WRITE, path);
  }
}

export async function deleteAnnouncementFromFirestore(id: string): Promise<void> {
  const path = `announcements/${id}`;
  try {
    const docRef = doc(db, 'announcements', id);
    await deleteDoc(docRef);
  } catch (error) {
    logFirestoreWarning(error, OperationType.DELETE, path);
  }
}

export function subscribeFirestoreAnnouncements(
  callback: (announcements: Announcement[], fromServer: boolean) => void
): Unsubscribe {
  const path = 'announcements';
  const colRef = collection(db, 'announcements');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: Announcement[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        items.push({
          id: d.id || docSnap.id,
          title: d.title || '',
          content: d.content || '',
          category: d.category || 'Update',
          pinned: Boolean(d.pinned),
          date: d.date || new Date().toISOString(),
          author: d.author || 'Anveshan Core Team',
          link: d.link || undefined,
          linkText: d.linkText || undefined,
        });
      });
      // Sort pinned first, then newest date
      items.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
      callback(items, !snapshot.metadata.fromCache);
    },
    (err) => {
      logFirestoreWarning(err, OperationType.LIST, path);
    }
  );
}

// -----------------------------------------------------------------------------
// FIRESTORE LIVE REAL-TIME SYNC FOR CORE TEAM MEMBERS
// -----------------------------------------------------------------------------

export async function saveCoreMemberToFirestore(member: CoreTeamMember): Promise<void> {
  const path = `core_team/${member.id}`;
  try {
    const docRef = doc(db, 'core_team', member.id);
    await setDoc(docRef, stripUndefined(member));
  } catch (error) {
    logFirestoreWarning(error, OperationType.WRITE, path);
  }
}

export async function deleteCoreMemberFromFirestore(id: string): Promise<void> {
  const path = `core_team/${id}`;
  try {
    const docRef = doc(db, 'core_team', id);
    await deleteDoc(docRef);
  } catch (error) {
    logFirestoreWarning(error, OperationType.DELETE, path);
  }
}

export function subscribeFirestoreCoreTeam(
  callback: (members: CoreTeamMember[], fromServer: boolean) => void
): Unsubscribe {
  const path = 'core_team';
  const colRef = collection(db, 'core_team');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const members: CoreTeamMember[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        members.push({
          id: d.id || docSnap.id,
          name: d.name || '',
          role: d.role || '',
          category: d.category || 'Student Co-ordinator',
          phone: d.phone || undefined,
          email: d.email || undefined,
          showPhonePublicly: Boolean(d.showPhonePublicly),
          order: typeof d.order === 'number' ? d.order : 99,
          photoUrl: d.photoUrl || undefined,
        });
      });
      members.sort((a, b) => a.order - b.order);
      callback(members, !snapshot.metadata.fromCache);
    },
    (err) => {
      logFirestoreWarning(err, OperationType.LIST, path);
    }
  );
}

// -----------------------------------------------------------------------------
// FIRESTORE UNIVERSAL CROSS-DEVICE SYNC FOR ALL CONTENT, LINKS & DELETIONS
// -----------------------------------------------------------------------------

export type SiteContentSection =
  | 'rules'
  | 'schedule'
  | 'tracks'
  | 'prizes'
  | 'faqs'
  | 'announcements'
  | 'core_team_index'
  | 'team_sections'
  | 'deleted_teams'
  | 'submission_notifications';

export interface SiteContentDoc<T = unknown> {
  section: SiteContentSection;
  items: T[];
  updatedAt: string;
}

export async function saveSiteContentToFirestore<T>(
  section: SiteContentSection,
  items: T[],
  updatedAt?: string
): Promise<void> {
  const path = `site_content/${section}`;
  try {
    const docRef = doc(db, 'site_content', section);
    const payload: SiteContentDoc<T> = {
      section,
      items: stripUndefined(items),
      updatedAt: updatedAt || new Date().toISOString(),
    };
    await setDoc(docRef, payload);
  } catch (error) {
    logFirestoreWarning(error, OperationType.WRITE, path);
  }
}

export function subscribeFirestoreSiteContent<T>(
  section: SiteContentSection,
  callback: (payload: SiteContentDoc<T>) => void
): Unsubscribe {
  const path = `site_content/${section}`;
  const docRef = doc(db, 'site_content', section);
  return onSnapshot(
    docRef,
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (Array.isArray(data?.items) && typeof data?.updatedAt === 'string') {
          callback({
            section,
            items: data.items as T[],
            updatedAt: data.updatedAt,
          });
        }
      }
    },
    (err) => {
      logFirestoreWarning(err, OperationType.GET, path);
    }
  );
}

export interface FullFirestoreSnapshot {
  teams: RegisteredTeam[];
  teamsLoadedOk: boolean;
  configLoadedOk: boolean;
  sectionsLoadedOk: boolean;
  coreLoadedOk: boolean;
  announcementsLoadedOk: boolean;
  quotaExceeded: boolean;
  config: Partial<EventConfig> | null;
  coreTeam: CoreTeamMember[];
  announcements: Announcement[];
  sections: Partial<Record<SiteContentSection, SiteContentDoc<any>>>;
}

export async function fetchAllFromFirestore(forceRetry = false): Promise<FullFirestoreSnapshot> {
  const result: FullFirestoreSnapshot = {
    teams: [],
    teamsLoadedOk: false,
    configLoadedOk: false,
    sectionsLoadedOk: false,
    coreLoadedOk: false,
    announcementsLoadedOk: false,
    quotaExceeded: isFirestoreQuotaExhausted(),
    config: null,
    coreTeam: [],
    announcements: [],
    sections: {},
  };

  if (!forceRetry && isFirestoreQuotaExhausted()) {
    return result;
  }

  try {
    const [teamsRes, configSnap, contentSnap, coreSnap, annSnap] = await Promise.all([
      fetchAllTeamsFromFirestoreWithStatus(),
      getDocs(collection(db, 'site_config')).catch((err) => {
        if (isQuotaError(err)) result.quotaExceeded = true;
        logFirestoreWarning(err, OperationType.LIST, 'site_config');
        return null;
      }),
      getDocs(collection(db, 'site_content')).catch((err) => {
        if (isQuotaError(err)) result.quotaExceeded = true;
        logFirestoreWarning(err, OperationType.LIST, 'site_content');
        return null;
      }),
      getDocs(collection(db, 'core_team')).catch((err) => {
        if (isQuotaError(err)) result.quotaExceeded = true;
        logFirestoreWarning(err, OperationType.LIST, 'core_team');
        return null;
      }),
      getDocs(collection(db, 'announcements')).catch((err) => {
        if (isQuotaError(err)) result.quotaExceeded = true;
        logFirestoreWarning(err, OperationType.LIST, 'announcements');
        return null;
      }),
    ]);

    if (teamsRes.quotaExceeded) {
      result.quotaExceeded = true;
    }
    result.teamsLoadedOk = teamsRes.ok;
    result.teams = teamsRes.teams.sort(
      (a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime()
    );

    if (configSnap) {
      result.configLoadedOk = true;
      configSnap.forEach((docSnap) => {
        if (docSnap.id === 'event_config') {
          result.config = docSnap.data() as Partial<EventConfig>;
        }
      });
    }

    if (contentSnap) {
      result.sectionsLoadedOk = true;
      contentSnap.forEach((docSnap) => {
        const data = docSnap.data();
        const section = docSnap.id as SiteContentSection;
        if (Array.isArray(data?.items) && typeof data?.updatedAt === 'string') {
          result.sections[section] = {
            section,
            items: data.items,
            updatedAt: data.updatedAt,
          };
        }
      });
    }

    if (coreSnap) {
      result.coreLoadedOk = true;
      const members: CoreTeamMember[] = [];
      coreSnap.forEach((docSnap) => {
        const d = docSnap.data();
        members.push({
          id: d.id || docSnap.id,
          name: d.name || '',
          role: d.role || '',
          category: d.category || 'Student Co-ordinator',
          phone: d.phone || undefined,
          email: d.email || undefined,
          showPhonePublicly: Boolean(d.showPhonePublicly),
          order: typeof d.order === 'number' ? d.order : 99,
          photoUrl: d.photoUrl || undefined,
        });
      });
      members.sort((a, b) => a.order - b.order);
      result.coreTeam = members;
    }

    if (annSnap) {
      result.announcementsLoadedOk = true;
      const items: Announcement[] = [];
      annSnap.forEach((docSnap) => {
        const d = docSnap.data();
        items.push({
          id: d.id || docSnap.id,
          title: d.title || '',
          content: d.content || '',
          category: d.category || 'Update',
          pinned: Boolean(d.pinned),
          date: d.date || new Date().toISOString(),
          author: d.author || 'Anveshan Core Team',
          link: d.link || undefined,
          linkText: d.linkText || undefined,
        });
      });
      items.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
      result.announcements = items;
    }
  } catch (err) {
    if (isQuotaError(err)) result.quotaExceeded = true;
    logFirestoreWarning(err, OperationType.GET, 'full_sync');
  }

  return result;
}



