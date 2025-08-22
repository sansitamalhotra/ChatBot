// server/services/chatUtils.js
'use strict';

const { logWithIcon } = require('./consoleIcons');

function formatQuickReplies(quickReplies) {
  if (!quickReplies) return [];
  if (Array.isArray(quickReplies)) {
    return quickReplies.map(r => {
      if (typeof r === 'string') return r.trim();
      if (r && typeof r === 'object') return r.text || r.value || String(r);
      return String(r || '').trim();
    }).filter(Boolean);
  }
  if (typeof quickReplies === 'string') {
    const str = quickReplies.trim();
    if (str.startsWith('[') || str.startsWith('{')) {
      try {
        const parsed = JSON.parse(str);
        if (Array.isArray(parsed)) return formatQuickReplies(parsed);
        if (parsed && typeof parsed === 'object') return [parsed.text || parsed.value || String(parsed)].filter(Boolean);
      } catch (err) {
        logWithIcon.warning('formatQuickReplies JSON parse failed:', err.message);
      }
    }
    return str.split(',').map(s => s.trim()).filter(Boolean);
  }
  logWithIcon.warning('formatQuickReplies unknown type:', typeof quickReplies);
  return [];
}

module.exports = { formatQuickReplies };
