/**
 * XEROXMATE launch-list backend — Google Apps Script Web App.
 *
 * Flow: React/Vite frontend → this Web App → private Google Sheet.
 *
 * Sheet layout (tab defaults to "Contacts"):
 *   Timestamp | Name | Email
 *
 * Setup:
 *   1. Create a Google Sheet with a tab named "Contacts" and header row
 *      Timestamp | Name | Email
 *   2. Extensions → Apps Script, paste this file.
 *   3. Project Settings (gear) → Script Properties → add SPREADSHEET_ID
 *      (the long ID from your sheet URL) and optionally SHEET_NAME.
 *   4. Deploy → New deployment → Web app → Execute as: Me →
 *      Who has access: Anyone → copy the Web App URL into
 *      VITE_GOOGLE_APPS_SCRIPT_URL.
 *
 * Security: the Sheet stays private (only your Google account). The Web App
 * URL is public but can only append rows — it never reads or lists data.
 */

var DEFAULT_SHEET_NAME = 'Contacts';
var NAME_MAX_LENGTH = 100;
var EMAIL_MAX_LENGTH = 254;
var EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getConfig_() {
  var props = PropertiesService.getScriptProperties();
  return {
    spreadsheetId: props.getProperty('SPREADSHEET_ID') || '',
    sheetName: props.getProperty('SHEET_NAME') || DEFAULT_SHEET_NAME,
  };
}

function jsonResponse_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}

function parseBody_(e) {
  if (!e || !e.postData || !e.postData.contents) return {};
  var raw = String(e.postData.contents);
  // Frontend sends JSON with Content-Type: text/plain, so parse as JSON.
  try {
    var parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') return parsed;
    return {};
  } catch (err) {
    // Fall back to form-encoded parameters if some client posts a form.
    if (e.parameter) return e.parameter;
    return {};
  }
}

function getOrCreateSheet_(spreadsheetId, sheetName) {
  var ss = SpreadsheetApp.openById(spreadsheetId);
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  // Ensure the header row exists.
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Timestamp', 'Name', 'Email']);
  } else {
    var header = sheet.getRange(1, 1, 1, 3).getValues()[0];
    if (String(header[0]) !== 'Timestamp' || String(header[1]) !== 'Name' || String(header[2]) !== 'Email') {
      sheet.insertRowBefore(1);
      sheet.getRange(1, 1, 1, 3).setValues([['Timestamp', 'Name', 'Email']]);
    }
  }
  return sheet;
}

function emailExists_(sheet, emailLower) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return false;
  // Read only the Email column (C) to keep memory use minimal.
  var values = sheet.getRange(2, 3, lastRow - 1, 1).getValues();
  for (var i = 0; i < values.length; i++) {
    var existing = String(values[i][0] || '').trim().toLowerCase();
    if (existing !== '' && existing === emailLower) return true;
  }
  return false;
}

function doPost(e) {
  try {
    var config = getConfig_();
    if (!config.spreadsheetId) {
      return jsonResponse_({ success: false, message: 'Unable to save contact' });
    }

    var body = parseBody_(e);

    // Honeypot: silently accept bots without storing anything.
    var honeypot = String(body.website || body.Website || '').trim();
    if (honeypot !== '') {
      return jsonResponse_({ success: true });
    }

    var name = String(body.name || body.Name || '').trim();
    var email = String(body.email || body.Email || '').trim();

    if (!name || !email) {
      return jsonResponse_({ success: false, message: 'Invalid input' });
    }
    if (name.length > NAME_MAX_LENGTH || email.length > EMAIL_MAX_LENGTH) {
      return jsonResponse_({ success: false, message: 'Invalid input' });
    }
    if (!EMAIL_PATTERN.test(email)) {
      return jsonResponse_({ success: false, message: 'Invalid input' });
    }

    var normalizedEmail = email.toLowerCase();
    var sheet = getOrCreateSheet_(config.spreadsheetId, config.sheetName);

    if (emailExists_(sheet, normalizedEmail)) {
      // Do not reveal ownership — still return success.
      return jsonResponse_({ success: true, alreadyRegistered: true });
    }

    // Server-side timestamp; never trust a client-supplied value.
    var timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
    sheet.appendRow([timestamp, name, email]);

    return jsonResponse_({ success: true });
  } catch (err) {
    return jsonResponse_({ success: false, message: 'Unable to save contact' });
  }
}

function doGet() {
  // No read API: the endpoint is write-only so contacts can never be listed.
  return jsonResponse_({ success: false, message: 'Method not allowed' });
}
