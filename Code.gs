/**
 * ═════════════════════════════════════════════════════════════════════════
 * MSC-PRPCEM Quiz Platform — Google Apps Script (Code.gs)
 * Google Sheet Auto-Sync for "Notify Me" Future Quiz Subscribers
 * ═════════════════════════════════════════════════════════════════════════
 * 
 * ⚠️ IMPORTANT TO FIX 403 FORBIDDEN:
 * When deploying in Apps Script:
 * 1. Click "Deploy" -> "Manage deployments" (or "New deployment").
 * 2. Edit configuration:
 *    - "Execute as": "Me (<your email>)"
 *    - "Who has access": "Anyone"  <--- (MUST BE "Anyone", NOT "Only myself" or "Within domain")
 * 3. Click "Deploy" and authorize permissions.
 * 4. Use the Web App URL that ends in "/exec".
 */

function handleSubscription(data) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetName = "Subscribers";
    var sheet = ss.getSheetByName(sheetName);

    // Create sheet if it doesn't exist
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      var headers = ["Timestamp", "Email", "Source / Page", "Topic / Course", "Date (IST)", "IP Address", "Status"];
      sheet.appendRow(headers);
      
      var headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setBackground("#2563eb");
      headerRange.setFontColor("#ffffff");
      headerRange.setFontWeight("bold");
      sheet.setFrozenRows(1);
    }

    var email = (data.email || "").toString().trim().toLowerCase();
    if (!email) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: "Email is required"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var source = data.source || "Courses Hub";
    var topic = data.topic || "Future Quizzes & Releases";
    var ip = data.ip_address || "N/A";
    var timestamp = data.timestamp || new Date().toISOString();
    var dateIST = data.dateIST || Utilities.formatDate(new Date(), "Asia/Kolkata", "dd/MM/yyyy, hh:mm:ss a") + " IST";
    var status = data.status || "Subscribed";

    // Deduplicate in sheet
    var lastRow = sheet.getLastRow();
    var isDuplicate = false;
    if (lastRow > 1) {
      var emailValues = sheet.getRange(2, 2, lastRow - 1, 1).getValues();
      for (var i = 0; i < emailValues.length; i++) {
        if (emailValues[i][0] && emailValues[i][0].toString().trim().toLowerCase() === email) {
          isDuplicate = true;
          sheet.getRange(i + 2, 1).setValue(timestamp);
          sheet.getRange(i + 2, 3).setValue(source);
          sheet.getRange(i + 2, 4).setValue(topic);
          sheet.getRange(i + 2, 5).setValue(dateIST);
          break;
        }
      }
    }

    if (!isDuplicate) {
      sheet.appendRow([timestamp, email, source, topic, dateIST, ip, status]);
    }

    for (var col = 1; col <= 7; col++) {
      sheet.autoResizeColumn(col);
    }

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: isDuplicate ? "Subscription updated in Google Sheet" : "Subscriber added to Google Sheet",
      email: email
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

// Handles HTTP POST (from Node.js backend or frontend fetch)
function doPost(e) {
  var data = {};
  if (e && e.postData && e.postData.contents) {
    try {
      data = JSON.parse(e.postData.contents);
    } catch (jsonErr) {
      data = e.parameter || {};
    }
  } else if (e && e.parameter) {
    data = e.parameter;
  }
  return handleSubscription(data);
}

// Handles HTTP GET (fallback query parameters or health check)
function doGet(e) {
  if (e && e.parameter && e.parameter.email) {
    return handleSubscription(e.parameter);
  }
  return ContentService.createTextOutput(JSON.stringify({
    status: "online",
    service: "MSC Quiz Platform — Google Sheet Webhook Active"
  })).setMimeType(ContentService.MimeType.JSON);
}
