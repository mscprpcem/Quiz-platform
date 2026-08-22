/**
 * ═════════════════════════════════════════════════════════════════════════
 * MSC-PRPCEM Quiz Platform — Google Apps Script (Code.gs)
 * Google Sheet Auto-Sync for "Notify Me" Future Quiz Subscribers
 * ═════════════════════════════════════════════════════════════════════════
 * 
 * Instructions to Deploy:
 * 1. Open your Google Sheet where you want subscriber emails stored.
 * 2. In the top menu, click: Extensions -> Apps Script.
 * 3. Replace all contents of "Code.gs" with this script.
 * 4. Click the "Save" (floppy disk) icon.
 * 5. Click "Deploy" -> "New deployment".
 * 6. Under "Select type", choose "Web app".
 * 7. Set:
 *    - Description: "Quiz Platform Notification Subscribers Webhook"
 *    - Execute as: "Me" (your Google account)
 *    - Who has access: "Anyone" (allows backend/frontend to post without login)
 * 8. Click "Deploy", authorize permissions when prompted.
 * 9. Copy the generated "Web App URL" (e.g., https://script.google.com/macros/s/.../exec).
 * 10. Add it to your backend .env file:
 *     GOOGLE_SHEET_NOTIFY_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetName = "Subscribers";
    var sheet = ss.getSheetByName(sheetName);

    // Create sheet if it doesn't exist
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      // Create Header Row with styling
      var headers = ["Timestamp", "Email", "Source / Page", "Topic / Course", "Date (IST)", "IP Address", "Status"];
      sheet.appendRow(headers);
      
      var headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setBackground("#2563eb");
      headerRange.setFontColor("#ffffff");
      headerRange.setFontWeight("bold");
      sheet.setFrozenRows(1);
    }

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
    
    // Format IST Date & Time
    var dateIST = data.dateIST || Utilities.formatDate(new Date(), "Asia/Kolkata", "dd/MM/yyyy, hh:mm:ss a") + " IST";
    var status = data.status || "Subscribed";

    // Prevent duplicate entries in the same sheet
    var lastRow = sheet.getLastRow();
    var isDuplicate = false;
    if (lastRow > 1) {
      var emailValues = sheet.getRange(2, 2, lastRow - 1, 1).getValues();
      for (var i = 0; i < emailValues.length; i++) {
        if (emailValues[i][0] && emailValues[i][0].toString().trim().toLowerCase() === email) {
          isDuplicate = true;
          // Update the existing row with latest timestamp & topic
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

    // Auto-fit column widths
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

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "online",
    service: "MSC Quiz Platform — Google Sheet Webhook Active"
  })).setMimeType(ContentService.MimeType.JSON);
}
