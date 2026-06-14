// Where submitted evaluations are sent. Replace YOUR_FORM_ID with a real
// Formspree form id (https://formspree.io) or a Google Apps Script Web App URL.
// Both accept a JSON POST from a static site, so no backend is needed.
// Until this is set, the Submit button warns and falls back to the Excel download.
export const SUBMIT_ENDPOINT = "https://formspree.io/f/YOUR_FORM_ID";
