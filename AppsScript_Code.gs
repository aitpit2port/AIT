/**
 * AIT Dashboard — Apps Script Web App
 * -------------------------------------------------------------
 * يرجّع بيانات الـ 4 تابات (fact_expenses, fact_budget,
 * fact_equipment_log, fact_mines) كـ JSON واحد منظم.
 *
 * طريقة التركيب:
 * 1. افتح الشيت → Extensions → Apps Script
 * 2. امسح أي كود موجود، ولزق هذا الكود كامل
 * 3. Deploy → New deployment → Type: Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 4. اضغط Deploy، انسخ الرابط (Web app URL) — هيكون شكله:
 *    https://script.google.com/macros/s/XXXXXXXXXXXX/exec
 * 5. حط الرابط ده في AIT_Dashboard_Full.html و egypt_mines_map.html
 *    في المتغير API_URL
 * -------------------------------------------------------------
 */

function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  var result = {
    expenses: readSheet(ss, 'fact_expenses', 3), // header on row 3, data starts row 4
    budget:   readSheet(ss, 'fact_budget', 3),
    equipment_log: readSheet(ss, 'fact_equipment_log', 3),
    mines:    readSheet(ss, 'fact_mines', 1),    // header on row 1, data starts row 2
    generated_at: new Date().toISOString()
  };

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Reads a sheet starting from headerRow (1-indexed) and returns
 * an array of objects keyed by the header values.
 */
function readSheet(ss, sheetName, headerRow) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];

  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow < headerRow + 1) return [];

  var headers = sheet.getRange(headerRow, 1, 1, lastCol).getValues()[0];
  var numDataRows = lastRow - headerRow;
  var data = sheet.getRange(headerRow + 1, 1, numDataRows, lastCol).getValues();

  var out = [];
  for (var i = 0; i < data.length; i++) {
    var row = data[i];
    // skip fully-empty rows
    var isEmpty = row.every(function(v){ return v === '' || v === null; });
    if (isEmpty) continue;

    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      var key = headers[j];
      if (!key) continue; // skip unnamed/extra columns
      var val = row[j];

      // convert Date objects to ISO strings (or YYYY-MM-DD for date-only cells)
      if (val instanceof Date) {
        val = formatDate(val);
      }
      obj[key] = val;
    }
    out.push(obj);
  }
  return out;
}

function formatDate(d) {
  // returns YYYY-MM-DD
  var tz = Session.getScriptTimeZone();
  return Utilities.formatDate(d, tz, 'yyyy-MM-dd');
}
