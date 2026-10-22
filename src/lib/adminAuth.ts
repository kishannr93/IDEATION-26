export interface AdminAccount {
  email: string;
  passkey: string;
  name: string;
  role: 'Super Admin' | 'Co-ordinator' | 'Viewer';
}

export const AUTHORIZED_ADMINS: AdminAccount[] = [
  {
    email: 'ktarunkumar1832@gmai.com',
    passkey: '183220',
    name: 'Tarun Kumar K',
    role: 'Super Admin',
  },
  {
    email: 'ktarunkumar1832@gmail.com',
    passkey: '183220',
    name: 'Tarun Kumar K',
    role: 'Super Admin',
  },
  {
    email: 'srmegha2009@gmail.com',
    passkey: '200906',
    name: 'Megha S R',
    role: 'Super Admin',
  },
  {
    email: 'kishannr93@gmail.com',
    passkey: '150140',
    name: 'Kishan N R',
    role: 'Super Admin',
  },
  {
    email: 'bietdvganveshanclub@gmail.com',
    passkey: '111890',
    name: 'Anveshan Club BIET',
    role: 'Super Admin',
  },
  {
    email: 'gouthamga88@gmail.com',
    passkey: '183202',
    name: 'Goutham G A',
    role: 'Super Admin',
  },
];

export function verifyAdminCredentials(
  email: string,
  passkey: string
): { success: boolean; user?: { email: string; name: string; role: string }; error?: string } {
  const inputEmail = email.trim().toLowerCase();
  const inputPass = passkey.trim();

  if (!inputEmail || !inputPass) {
    return { success: false, error: 'Please enter both official email and security passkey.' };
  }

  // Check against known authorized admins
  const matched = AUTHORIZED_ADMINS.find(
    (a) => a.email.toLowerCase() === inputEmail && a.passkey === inputPass
  );

  if (matched) {
    return {
      success: true,
      user: { email: matched.email, name: matched.name, role: matched.role },
    };
  }

  // Check master passkey for event coordinators
  if (
    (inputEmail.includes('admin') ||
      inputEmail.includes('anveshan') ||
      inputEmail.endsWith('@bietdvg.edu') ||
      inputEmail.includes('coordinator')) &&
    inputPass === 'anveshan2026'
  ) {
    return {
      success: true,
      user: { email: inputEmail, name: 'Event Coordinator', role: 'Super Admin' },
    };
  }

  return { success: false, error: 'Invalid official email or security passkey.' };
}

export function isSessionAdmin(): boolean {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem('ideation_admin_auth') === 'true';
}

export function getSessionAdminUser(): { email: string; name: string } | null {
  if (typeof window === 'undefined') return null;
  const user = sessionStorage.getItem('ideation_admin_user');
  return user ? JSON.parse(user) : null;
}

export function setSessionAdmin(user: { email: string; name: string }) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem('ideation_admin_auth', 'true');
  sessionStorage.setItem('ideation_admin_user', JSON.stringify(user));
}

export function clearSessionAdmin() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem('ideation_admin_auth');
  sessionStorage.removeItem('ideation_admin_user');
}
