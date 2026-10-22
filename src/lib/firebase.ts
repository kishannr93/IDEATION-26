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
  getDocs,
  onSnapshot,
  updateDoc,
  getDocFromServer,
  query,
  orderBy,
  Unsubscribe,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { RegisteredTeam } from '../types';

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

export async function saveTeamToFirestore(team: RegisteredTeam): Promise<void> {
  try {
    const leader = team.members.find((m) => m.isLeader) || team.members[0];
    const memberEmails = team.members.map((m) => m.email.trim().toLowerCase());

    const docData = {
      id: team.id,
      teamName: team.teamName,
      college: team.college,
      city: team.city,
      department: team.department,
      course: team.course,
      primaryTrack: team.primaryTrack,
      backupTrack: team.backupTrack || '',
      ideaTitle: team.ideaTitle || '',
      ideaSummary: team.ideaSummary || '',
      paymentStatus: team.paymentStatus,
      paymentTransactionId: team.paymentTransactionId || '',
      paymentRemarks: team.paymentRemarks || '',
      registeredAt: team.registeredAt,
      checkedIn: team.checkedIn,
      checkedInAt: team.checkedInAt || null,
      leaderEmail: (leader?.email || '').toLowerCase(),
      leaderPhone: leader?.phone || '',
      memberEmails: memberEmails.join(','),
      members: JSON.stringify(team.members),
    };

    const teamRef = doc(db, 'teams', team.id);
    await setDoc(teamRef, docData, { merge: true });
  } catch (err) {
    console.warn('Firestore save warning:', err);
  }
}

export async function updateTeamPaymentInFirestore(
  teamId: string,
  status: 'Pending' | 'Verified' | 'Rejected',
  remarks?: string
): Promise<void> {
  try {
    const teamRef = doc(db, 'teams', teamId);
    await updateDoc(teamRef, {
      paymentStatus: status,
      paymentRemarks: remarks !== undefined ? remarks : '',
    });
  } catch (err) {
    console.warn('Firestore payment update warning:', err);
  }
}

export async function updateTeamCheckInInFirestore(
  teamId: string,
  checkedIn: boolean,
  checkedInAt?: string
): Promise<void> {
  try {
    const teamRef = doc(db, 'teams', teamId);
    await updateDoc(teamRef, {
      checkedIn,
      checkedInAt: checkedInAt || null,
    });
  } catch (err) {
    console.warn('Firestore checkin update warning:', err);
  }
}

export async function fetchAllTeamsFromFirestore(): Promise<RegisteredTeam[]> {
  try {
    const colRef = collection(db, 'teams');
    const snapshot = await getDocs(colRef);
    const teams: RegisteredTeam[] = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      let parsedMembers = [];
      try {
        parsedMembers = typeof data.members === 'string' ? JSON.parse(data.members) : data.members;
      } catch {
        parsedMembers = [];
      }

      teams.push({
        id: data.id || docSnap.id,
        teamName: data.teamName,
        college: data.college,
        city: data.city,
        department: data.department,
        course: data.course,
        primaryTrack: data.primaryTrack,
        backupTrack: data.backupTrack,
        ideaTitle: data.ideaTitle,
        ideaSummary: data.ideaSummary,
        paymentStatus: data.paymentStatus || 'Pending',
        paymentTransactionId: data.paymentTransactionId,
        paymentRemarks: data.paymentRemarks,
        registeredAt: data.registeredAt,
        checkedIn: Boolean(data.checkedIn),
        checkedInAt: data.checkedInAt,
        members: Array.isArray(parsedMembers) ? parsedMembers : [],
      });
    });

    return teams;
  } catch (err) {
    console.warn('Firestore fetch teams warning:', err);
    return [];
  }
}

export function subscribeFirestoreTeams(
  callback: (teams: RegisteredTeam[]) => void
): Unsubscribe {
  const colRef = collection(db, 'teams');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const teams: RegisteredTeam[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        let parsedMembers = [];
        try {
          parsedMembers = typeof data.members === 'string' ? JSON.parse(data.members) : data.members;
        } catch {
          parsedMembers = [];
        }

        teams.push({
          id: data.id || docSnap.id,
          teamName: data.teamName,
          college: data.college,
          city: data.city,
          department: data.department,
          course: data.course,
          primaryTrack: data.primaryTrack,
          backupTrack: data.backupTrack,
          ideaTitle: data.ideaTitle,
          ideaSummary: data.ideaSummary,
          paymentStatus: data.paymentStatus || 'Pending',
          paymentTransactionId: data.paymentTransactionId,
          paymentRemarks: data.paymentRemarks,
          registeredAt: data.registeredAt,
          checkedIn: Boolean(data.checkedIn),
          checkedInAt: data.checkedInAt,
          members: Array.isArray(parsedMembers) ? parsedMembers : [],
        });
      });
      // Sort newest first
      teams.sort((a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime());
      callback(teams);
    },
    (err) => {
      console.warn('Firestore snapshot error:', err);
    }
  );
}
