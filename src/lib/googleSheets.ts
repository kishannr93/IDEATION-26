import { RegisteredTeam } from '../types';

export interface GoogleSheetSyncResult {
  success: boolean;
  spreadsheetId?: string;
  spreadsheetUrl?: string;
  rowsSynced?: number;
  error?: string;
}

const SHEET_TITLE = 'IDEATION 2026 - Master Registrations';

const HEADERS = [
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

export function teamToSheetRow(t: RegisteredTeam): string[] {
  const leader = t.members.find((m) => m.isLeader) || t.members[0];
  const nonLeaders = t.members.filter((m) => m !== leader);
  const m2 = nonLeaders[0];
  const m3 = nonLeaders[1];
  const m4 = nonLeaders[2];

  return [
    t.id,
    t.teamName,
    t.college,
    t.city,
    t.department,
    t.course,
    t.primaryTrack,
    t.backupTrack || '',
    t.ideaTitle || '',
    t.ideaSummary || '',
    t.paymentStatus,
    t.paymentTransactionId || '',
    t.checkedIn ? 'Yes' : 'No',
    t.registeredAt,
    String(t.members.length),
    leader?.name || '',
    leader?.email || '',
    leader?.phone || '',
    leader?.usn || '',
    leader?.branch || '',
    leader?.year || '',
    m2?.name || '',
    m2?.email || '',
    m2?.phone || '',
    m2?.usn || '',
    m2?.branch || '',
    m2?.year || '',
    m3?.name || '',
    m3?.email || '',
    m3?.phone || '',
    m3?.usn || '',
    m3?.branch || '',
    m3?.year || '',
    m4?.name || '',
    m4?.email || '',
    m4?.phone || '',
    m4?.usn || '',
    m4?.branch || '',
    m4?.year || '',
  ];
}

/**
 * Searches Google Drive for an existing spreadsheet with title or creates one.
 */
export async function getOrCreateSpreadsheet(
  accessToken: string
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  // Check stored ID first
  const storedId = localStorage.getItem('ideation_google_sheet_id');
  if (storedId) {
    try {
      const testRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${storedId}?fields=spreadsheetId,spreadsheetUrl`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      if (testRes.ok) {
        const data = await testRes.json();
        return {
          spreadsheetId: data.spreadsheetId,
          spreadsheetUrl:
            data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${data.spreadsheetId}/edit`,
        };
      }
    } catch {}
  }

  // 1. Search Google Drive for existing sheet
  try {
    const q = encodeURIComponent(
      `name = '${SHEET_TITLE}' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`
    );
    const searchRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,webViewLink)`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (searchRes.ok) {
      const searchData = await searchRes.json();
      if (searchData.files && searchData.files.length > 0) {
        const file = searchData.files[0];
        localStorage.setItem('ideation_google_sheet_id', file.id);
        return {
          spreadsheetId: file.id,
          spreadsheetUrl:
            file.webViewLink || `https://docs.google.com/spreadsheets/d/${file.id}/edit`,
        };
      }
    }
  } catch (err) {
    console.warn('Drive search fallback to creation:', err);
  }

  // 2. Create a new Spreadsheet with styled header
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: SHEET_TITLE,
      },
      sheets: [
        {
          properties: {
            title: 'Registrations',
            gridProperties: {
              frozenRowCount: 1,
            },
          },
        },
      ],
    }),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Failed to create Google Spreadsheet: ${errText}`);
  }

  const createdData = await createRes.json();
  const spreadsheetId = createdData.spreadsheetId;
  const spreadsheetUrl =
    createdData.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  localStorage.setItem('ideation_google_sheet_id', spreadsheetId);

  // Initialize Header Row with formatting
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Registrations!A1:AM1?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [HEADERS],
      }),
    }
  );

  return { spreadsheetId, spreadsheetUrl };
}

/**
 * Appends a single newly registered team to the connected Google Spreadsheet.
 */
export async function appendTeamToGoogleSheet(
  accessToken: string,
  team: RegisteredTeam
): Promise<boolean> {
  try {
    const { spreadsheetId } = await getOrCreateSpreadsheet(accessToken);
    const rowValues = teamToSheetRow(team);

    const appendRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Registrations!A1:append?valueInputOption=USER_ENTERED`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: [rowValues],
        }),
      }
    );

    return appendRes.ok;
  } catch (err) {
    console.warn('Failed to append team to Google Sheet:', err);
    return false;
  }
}

/**
 * Syncs the complete list of registered teams to the Google Spreadsheet, ensuring perfect column alignment.
 */
export async function syncAllTeamsToGoogleSheet(
  accessToken: string,
  teams: RegisteredTeam[]
): Promise<GoogleSheetSyncResult> {
  try {
    const { spreadsheetId, spreadsheetUrl } = await getOrCreateSpreadsheet(accessToken);

    const rows = teams.map(teamToSheetRow);
    const allData = [HEADERS, ...rows];

    // Clear old data first to avoid duplicate or dangling rows
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Registrations!A1:AM${Math.max(
        teams.length + 50,
        100
      )}:clear`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // Write all rows
    const updateRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Registrations!A1?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: allData,
        }),
      }
    );

    if (!updateRes.ok) {
      const errText = await updateRes.text();
      return { success: false, error: errText };
    }

    return {
      success: true,
      spreadsheetId,
      spreadsheetUrl,
      rowsSynced: teams.length,
    };
  } catch (error: any) {
    console.error('Error syncing to Google Sheet:', error);
    return {
      success: false,
      error: error.message || 'Failed to sync with Google Sheets',
    };
  }
}

/**
 * Fetches all team rows directly from the connected Google Spreadsheet.
 */
export async function fetchTeamsFromGoogleSheet(
  accessToken: string
): Promise<{ success: boolean; teams?: RegisteredTeam[]; error?: string; spreadsheetUrl?: string }> {
  try {
    const { spreadsheetId, spreadsheetUrl } = await getOrCreateSpreadsheet(accessToken);

    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Registrations!A2:AM1000`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      return { success: false, error: errText };
    }

    const data = await res.json();
    const rows: string[][] = data.values || [];

    const teams: RegisteredTeam[] = rows
      .filter((row) => row && row[0] && row[1]) // Must have ID and Team Name
      .map((row) => {
        const members: RegisteredTeam['members'] = [];

        // Leader (Member 1)
        if (row[15] || row[16]) {
          members.push({
            id: 'm1',
            name: row[15] || 'Leader',
            email: row[16] || '',
            phone: row[17] || '',
            usn: row[18] || '',
            branch: row[19] || '',
            year: row[20] || '3rd Year',
            isLeader: true,
          });
        }

        // Member 2
        if (row[21] || row[22]) {
          members.push({
            id: 'm2',
            name: row[21] || 'Member 2',
            email: row[22] || '',
            phone: row[23] || '',
            usn: row[24] || '',
            branch: row[25] || '',
            year: row[26] || '3rd Year',
            isLeader: false,
          });
        }

        // Member 3
        if (row[27] || row[28]) {
          members.push({
            id: 'm3',
            name: row[27] || 'Member 3',
            email: row[28] || '',
            phone: row[29] || '',
            usn: row[30] || '',
            branch: row[31] || '',
            year: row[32] || '3rd Year',
            isLeader: false,
          });
        }

        // Member 4
        if (row[33] || row[34]) {
          members.push({
            id: 'm4',
            name: row[33] || 'Member 4',
            email: row[34] || '',
            phone: row[35] || '',
            usn: row[36] || '',
            branch: row[37] || '',
            year: row[38] || '3rd Year',
            isLeader: false,
          });
        }

        return {
          id: row[0],
          teamName: row[1] || 'Unnamed Team',
          college: row[2] || '',
          city: row[3] || '',
          department: row[4] || '',
          course: (row[5] as 'B.E / B.Tech' | 'M.Tech' | 'MCA') || 'B.E / B.Tech',
          primaryTrack: row[6] || 'Open Innovation',
          backupTrack: row[7] || '',
          ideaTitle: row[8] || '',
          ideaSummary: row[9] || '',
          paymentStatus: (row[10] as 'Pending' | 'Verified' | 'Rejected') || 'Pending',
          paymentTransactionId: row[11] || '',
          checkedIn: row[12] === 'Yes',
          registeredAt: row[13] || new Date().toISOString(),
          members,
        };
      });

    return {
      success: true,
      teams,
      spreadsheetUrl,
    };
  } catch (error: any) {
    console.error('Error fetching teams from Google Sheet:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch teams from Google Sheet',
    };
  }
}

