const ChatTemplate = require('../models/chatTemplateModel');

class ChatTemplateCache {
  constructor() {
    this.byId = new Map();
    this.byTypeCategory = new Map(); // key = `${type}::${category}::${businessHoursOnly?1:0}`
    this.ttl = 5 * 60 * 1000; // 5 minutes
    this.meta = new Map(); // store timestamps
  }

  _isFresh(key) {
    const ts = this.meta.get(key);
    if (!ts) return false;
    return (Date.now() - ts) < this.ttl;
  }

  async getById(id) {
    const key = `id::${id}`;
    if (this.byId.has(key) && this._isFresh(key)) return this.byId.get(key);
    const tpl = await ChatTemplate.findById(id);
    if (tpl) {
      this.byId.set(key, tpl);
      this.meta.set(key, Date.now());
    }
    return tpl;
  }

  async findByTypeAndCategory(type, category, businessHoursOnly = null) {
    const bhFlag = businessHoursOnly === null ? 'any' : (businessHoursOnly ? '1' : '0');
    const key = `tcat::${type}::${category || 'any'}::${bhFlag}`;
    if (this.byTypeCategory.has(key) && this._isFresh(key)) return this.byTypeCategory.get(key);
    const q = { templateType: type, isActive: true };
    if (category) q.category = category;
    if (businessHoursOnly !== null) q.businessHoursOnly = businessHoursOnly;
    const arr = await ChatTemplate.find(q).sort({ priority: -1, 'usage.timesUsed': -1, updatedAt: -1 }).lean();
    this.byTypeCategory.set(key, arr);
    this.meta.set(key, Date.now());
    return arr;
  }

  clearCache() {
    this.byId.clear();
    this.byTypeCategory.clear();
    this.meta.clear();
  }
}

module.exports = new ChatTemplateCache();
