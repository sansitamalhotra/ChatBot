// This file maps console log emojis to Font Awesome equivalents for potential UI use

const consoleIcons = {
  // Status and feedback icons
  success: 'fas fa-check-circle',            
  error: 'fas fa-times-circle',              
  warning: 'fas fa-exclamation-triangle',    
  
  // Communication and connection icons
  broadcast: 'fas fa-broadcast-tower',      
  connection: 'fas fa-link',                 
  disconnect: 'fas fa-plug',                 
  
  // Activity and logging icons
  logging: 'fas fa-edit',                    
  clipboard: 'fas fa-clipboard-list',        
  target: 'fas fa-bullseye',    
  statistics: 'fas fa-chart-bar',
  inbox: 'fas fa-inbox',
  debug: 'fas fa-bug',
  emit: 'fas fa-upload',
  guest: 'fas fa-user-secret',
  initChat: 'fas fa-envelope-open-text',
  
  // User status icons
  user: 'fas fa-user',                      
  idle: 'fas fa-moon',                      
  away: 'fas fa-walking',                   
  active: 'fas fa-bolt',                    
  
  // Interface interaction icons
  visible: 'fas fa-eye',                    
  hidden: 'fas fa-eye-slash',               
  keyboard: 'fas fa-keyboard',              
  mouse: 'fas fa-mouse',                    
  
  // Media control icons
  pause: 'fas fa-pause-circle',             
  resume: 'fas fa-play-circle',   
  
  //Other Icons
  cleanup: 'fas fa-broom',                 
  network: 'fas fa-globe',                   
  reconnect: 'fas fa-sync-alt',              
  auth: 'fas fa-key',                        
  waiting: 'fas fa-hourglass-half',         
  launch: 'fas fa-rocket',                  
  info: 'fas fa-info-circle',                
};

// Helper function to get Font Awesome class
const getIconClass = (iconKey) => {
  return consoleIcons[iconKey] || 'fas fa-info-circle';
};

// Helper function to create icon HTML (for frontend use)
const createIconHTML = (iconKey, additionalClasses = '') => {
  const iconClass = getIconClass(iconKey);
  return `<i class="${iconClass} ${additionalClasses}"></i>`;
};

// Console logging with consistent prefixes (keeping emojis for backend logs)
const logWithIcon = {
  success: (message) => console.log(`✅ ${message}`),
  error: (message) => console.error(`❌ ${message}`),
  warning: (message) => console.warn(`⚠️ ${message}`),
  broadcast: (message) => console.log(`📡 ${message}`),
  connection: (message) => console.log(`🔗 ${message}`),
  disconnect: (message) => console.log(`🔌 ${message}`),
  logging: (message) => console.log(`📝 ${message}`),
  clipboard: (message) => console.log(`📋 ${message}`),
  target: (message) => console.log(`🎯 ${message}`),
  statistics: (message) => console.log(`📊 ${message}`), 
  emit: (message) => console.log(`📤 ${message}`), 
  debug: (message) => console.log(`🔍 ${message}`),
  user: (message) => console.log(`👤 ${message}`),
  inbox: (message) => console.log(`📬 ${message}`),
  guest: (message) => console.log(`👤 ${message}`),
  idle: (message) => console.log(`😴 ${message}`),
  away: (message) => console.log(`🚶 ${message}`),
  active: (message) => console.log(`⚡ ${message}`),
  visible: (message) => console.log(`👁️ ${message}`),
  hidden: (message) => console.log(`🌫️ ${message}`),
  keyboard: (message) => console.log(`⌨️ ${message}`),
  mouse: (message) => console.log(`🖱️ ${message}`),
  pause: (message) => console.log(`⏸️ ${message}`),
  resume: (message) => console.log(`▶️ ${message}`),
  initChat: (message) => console.log(`📨 ${message}`),
  
  cleanup: (message) => console.log(`🧹 ${message}`),
  network: (message) => console.log(`🌐 ${message}`),
  reconnect: (message) => console.log(`🔄 ${message}`),
  auth: (message) => console.log(`🔑 ${message}`),
  waiting: (message) => console.log(`⏳ ${message}`),
  launch: (message) => console.log(`🚀 ${message}`),
  info: (message) => console.log(`ℹ️ ${message}`),
};

// For frontend notification systems
const getNotificationIcon = (type) => {
  const iconMap = {
    online: 'fas fa-circle text-green-500',
    offline: 'fas fa-circle text-gray-500', 
    idle: 'fas fa-moon text-yellow-500',
    away: 'fas fa-walking text-orange-500',
    active: 'fas fa-bolt text-blue-500',
    error: 'fas fa-exclamation-triangle text-red-500',
    success: 'fas fa-check-circle text-green-500',
    warning: 'fas fa-exclamation-triangle text-yellow-500'
  };
  
  return iconMap[type] || 'fas fa-info-circle text-blue-500';
};

module.exports = {
  consoleIcons,
  getIconClass,
  createIconHTML,
  logWithIcon,
  getNotificationIcon
};
