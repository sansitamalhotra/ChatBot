// server/models/chatTemplateModel.js
const mongoose = require('mongoose');
const { Schema } = mongoose;
const escapeHtml = (str) => {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

const ChatTemplateSchema = new Schema({
  title: { type: String, required: true },
  templateType: { type: String, required: true }, // e.g., 'bot_response', 'outside_hours_message'
  category: { type: String, required: false }, // e.g., 'business_hours', 'greeting'
  content: { type: String, required: true }, // text with placeholders
  variables: [
    {
      name: String,
      description: String,
      defaultValue: Schema.Types.Mixed
    }
  ],
  quickReplies: [
    {
      text: String,
      value: String
    }
  ],
  businessHoursOnly: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  priority: { type: Number, default: 0 },
  personalization: { type: Schema.Types.Mixed, default: {} },
  conditions: { type: Schema.Types.Mixed, default: {} }, // optional rule object
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  parentTemplate: { type: Schema.Types.ObjectId, ref: 'ChatTemplate', default: null },
  usage: {
    timesUsed: { type: Number, default: 0 },
    lastUsed: { type: Date, default: null },
    averageRating: { type: Number, default: 0 },
    totalRatings: { type: Number, default: 0 }
  },
  version: { type: Number, default: 1 },
  placeholders: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Helper: extract placeholders from content and store in placeholders
ChatTemplateSchema.pre('save', function(next) {
  try {
    const content = this.content || '';
    const regex = /\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}|\{([a-zA-Z0-9_.]+)\}/g;
    const placeholders = new Set();
    let match;
    while ((match = regex.exec(content)) !== null) {
      const key = match[1] || match[2];
      if (key) placeholders.add(key);
    }
    this.placeholders = Array.from(placeholders);
    this.updatedAt = new Date();
  } catch (err) {
    // ignore
  } finally {
    next();
  }
});

// Instance method: render
ChatTemplateSchema.methods.render = function(variables = {}) {
  const content = this.content || '';
  // merge defaults
  const merged = { ...((this.variables || []).reduce((acc, v) => {
    if (v && v.name) acc[v.name] = v.defaultValue;
    return acc;
  }, {})), ...variables };

  // built-ins
  merged.currentTime = new Date().toLocaleString();
  merged.currentDate = new Date().toLocaleDateString();
  // safe replace: escape inserted values to avoid HTML injection
  const rendered = content.replace(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}|\{([a-zA-Z0-9_.]+)\}/g, (m, p1, p2) => {
    const key = p1 || p2;
    if (!key) return '';
    const parts = key.split('.');
    let val = merged;
    for (const p of parts) {
      if (val && Object.prototype.hasOwnProperty.call(val, p)) val = val[p];
      else { val = ''; break; }
    }
    if (val === null || val === undefined) return '';
    return escapeHtml(String(val));
  });

  return rendered;
};

// Instance method: shouldShow(context)
// Basic implementation: checks conditions fields (simple equality checks).
ChatTemplateSchema.methods.shouldShow = function(context = {}) {
  if (!this.conditions || Object.keys(this.conditions).length === 0) return true;
  // simple rule structure: { field: expectedValue }
  try {
    for (const [k, expected] of Object.entries(this.conditions)) {
      const actual = context[k];
      if (expected !== actual) return false;
    }
    return true;
  } catch (err) {
    return false;
  }
};

// Instance method: incrementUsage
ChatTemplateSchema.methods.incrementUsage = async function() {
  try {
    this.usage = this.usage || { timesUsed: 0, lastUsed: null, averageRating: 0, totalRatings: 0 };
    this.usage.timesUsed = (this.usage.timesUsed || 0) + 1;
    this.usage.lastUsed = new Date();
    await this.save();
  } catch (err) {
    // ignore
  }
};

// Instance method: addRating
ChatTemplateSchema.methods.addRating = async function(rating) {
  try {
    rating = Number(rating) || 0;
    const u = this.usage || { timesUsed: 0, averageRating: 0, totalRatings: 0 };
    const totalRatings = (u.totalRatings || 0) + 1;
    const avg = ((u.averageRating || 0) * (u.totalRatings || 0) + rating) / totalRatings;
    this.usage = {
      ...u,
      averageRating: avg,
      totalRatings,
    };
    await this.save();
  } catch (err) {
    // ignore
  }
};

// Static: findByTypeAndCategory
ChatTemplateSchema.statics.findByTypeAndCategory = function(templateType, category, businessHoursOnly = null) {
  const q = { templateType };
  if (category) q.category = category;
  if (businessHoursOnly !== null) q.businessHoursOnly = businessHoursOnly;
  q.isActive = true;
  return this.find(q).sort({ priority: -1, 'usage.timesUsed': -1, updatedAt: -1 });
};

// Static: getRandomTemplate
ChatTemplateSchema.statics.getRandomTemplate = async function(templateType, category) {
  const q = { templateType, isActive: true };
  if (category) q.category = category;
  const count = await this.countDocuments(q);
  if (!count) return [];
  const skip = Math.floor(Math.random() * count);
  const docs = await this.find(q).skip(skip).limit(1);
  return docs;
};

// Static: createDefaults (basic defaults)
ChatTemplateSchema.statics.createDefaults = async function(createdBy) {
  const defaults = [
    {
      templateType: 'greeting',
      category: 'greeting',
      title: 'Default Greeting',
      content: 'Hello {{firstName}}! Welcome to PSPL Job Portal. How can I assist you today?',
      quickReplies: [{ text: 'Search Jobs', value: 'search_job' }, { text: 'Talk to Agent', value: 'live_agent' }],
      createdBy
    },
    {
      templateType: 'outside_hours_message',
      category: 'business_hours',
      title: 'Outside Hours Notice',
      content: 'Hi {{firstName}}, our live agents are offline right now. Next available: {{nextAvailable}}. Meanwhile I can help with common tasks.',
      quickReplies: [{ text: 'Leave Message', value: 'leave_message' }, { text: 'Search Jobs', value: 'search_job' }],
      createdBy
    }
  ];
  const created = await this.insertMany(defaults);
  return created;
};

module.exports = mongoose.model('ChatTemplate', ChatTemplateSchema);
