import * as XLSX from 'xlsx';
import type { Lead } from '../types';

const SHEET_ID_KEY = 'xeroxmate_spreadsheet_id';

export const getSavedSpreadsheetId = (): string | null => {
  return localStorage.getItem(SHEET_ID_KEY);
};

export const saveSpreadsheetId = (id: string) => {
  localStorage.setItem(SHEET_ID_KEY, id);
};

/**
 * Creates a brand new Google Spreadsheet for XEROXMATE Leads.
 */
export async function createGoogleSheet(accessToken: string): Promise<string> {
  const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: `XEROXMATE Early Access Leads (${new Date().toLocaleDateString()})`,
      },
      sheets: [
        {
          properties: {
            title: 'Leads',
            gridProperties: {
              frozenRowCount: 1,
            },
          },
          data: [
            {
              startRow: 0,
              startColumn: 0,
              rowData: [
                {
                  values: [
                    { userEnteredValue: { stringValue: 'Submission Date & Time' } },
                    { userEnteredValue: { stringValue: 'Full Name' } },
                    { userEnteredValue: { stringValue: 'Email Address' } },
                    { userEnteredValue: { stringValue: 'Interest Category' } },
                    { userEnteredValue: { stringValue: 'Source' } },
                  ],
                },
              ],
            },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Failed to create sheet: ${res.statusText}`);
  }

  const data = await res.json();
  const spreadsheetId = data.spreadsheetId as string;
  saveSpreadsheetId(spreadsheetId);
  return spreadsheetId;
}

/**
 * Appends a lead to the Google Spreadsheet.
 */
export async function appendLeadToGoogleSheet(
  accessToken: string,
  spreadsheetId: string,
  lead: Lead
): Promise<void> {
  const range = 'Leads!A1:E1';
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
    range
  )}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

  const values = [
    [
      new Date(lead.timestamp).toLocaleString('en-US', { timeZoneName: 'short' }),
      lead.name,
      lead.email,
      lead.role || 'Early Access Enthusiast',
      'XEROXMATE Launch Conduct Card',
    ],
  ];

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values }),
  });

  if (!res.ok) {
    // If sheet title or structure changed, try appending to default range
    const fallbackRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1:append?valueInputOption=USER_ENTERED`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ values }),
      }
    );

    if (!fallbackRes.ok) {
      const errorData = await fallbackRes.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Failed to append lead to Google Sheet (${res.status})`);
    }
  }
}

/**
 * Exports leads list to an Excel (.xlsx) file and triggers download in browser.
 */
export function exportLeadsToExcel(leads: Lead[], filename = 'XEROXMATE_Early_Access_Leads.xlsx') {
  if (!leads || leads.length === 0) {
    alert('No contacts to export yet. Add a contact first!');
    return;
  }

  const rows = leads.map((lead, index) => ({
    'No.': index + 1,
    'Submission Date': new Date(lead.timestamp).toLocaleString(),
    'Full Name': lead.name,
    'Email Address': lead.email,
    'Category / Interest': lead.role || 'Early Access',
    'Google Sheets Synced': lead.syncedToSheets ? 'YES' : 'PENDING',
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Set column widths for polished Excel display
  worksheet['!cols'] = [
    { wch: 6 },
    { wch: 22 },
    { wch: 25 },
    { wch: 30 },
    { wch: 24 },
    { wch: 20 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'XEROXMATE Leads');
  XLSX.writeFile(workbook, filename);
}

/**
 * Exports leads list to standard CSV file.
 */
export function exportLeadsToCSV(leads: Lead[], filename = 'XEROXMATE_Leads.csv') {
  if (!leads || leads.length === 0) return;

  const headers = ['No', 'Date', 'Full Name', 'Email', 'Role', 'Synced'];
  const csvRows = [
    headers.join(','),
    ...leads.map((l, i) =>
      [
        i + 1,
        `"${new Date(l.timestamp).toLocaleString()}"`,
        `"${l.name.replace(/"/g, '""')}"`,
        `"${l.email.replace(/"/g, '""')}"`,
        `"${(l.role || 'Early Access').replace(/"/g, '""')}"`,
        `"${l.syncedToSheets ? 'Synced' : 'Pending'}"`,
      ].join(',')
    ),
  ];

  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
