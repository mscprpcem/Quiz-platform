const axios = require('axios');

/**
 * Service to sync subscriber notifications directly to Google Sheet via Google Apps Script Web App
 */
async function syncSubscriberToGoogleSheet(subscriberData) {
  const sheetWebhookUrl = process.env.GOOGLE_SHEET_NOTIFY_URL || 
                          process.env.GOOGLE_SCRIPT_URL || 
                          process.env.NOTIFY_SHEET_URL ||
                          process.env.VITE_GOOGLE_SHEET_NOTIFY_URL;

  if (!sheetWebhookUrl) {
    console.log('[GoogleSheetService] Notice: GOOGLE_SHEET_NOTIFY_URL is not set. Subscriber stored in DB.');
    return { 
      success: true, 
      synced: false, 
      message: 'Stored in local database. Set GOOGLE_SHEET_NOTIFY_URL to sync to Google Sheet automatically.' 
    };
  }

  try {
    const now = new Date();
    // Convert to IST
    const dateIST = new Date(now.getTime() + (5.5 * 60 * 60 * 1000)).toISOString().replace('T', ' ').substring(0, 19) + ' IST';

    const payload = {
      action: 'subscribe_notify',
      email: (subscriberData.email || '').trim().toLowerCase(),
      source: subscriberData.source || 'Courses Page',
      topic: subscriberData.topic || 'Future Quizzes & Course Releases',
      ip_address: subscriberData.ip_address || 'N/A',
      timestamp: now.toISOString(),
      dateIST: dateIST,
      status: 'active'
    };

    const response = await axios.post(sheetWebhookUrl, payload, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000,
      maxRedirects: 5 // Google Apps Script redirects on doPost
    });

    console.log('[GoogleSheetService] Successfully synced email to Google Sheet:', subscriberData.email);
    return { success: true, synced: true, data: response.data };
  } catch (err) {
    console.error('[GoogleSheetService] Error forwarding subscriber to Google Sheet:', err.message);
    return { success: false, synced: false, error: err.message };
  }
}

module.exports = {
  syncSubscriberToGoogleSheet
};
