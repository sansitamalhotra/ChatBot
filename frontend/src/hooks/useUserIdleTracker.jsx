import { useEffect, useRef, useCallback } from "react";
import { useSocket } from "../Context/SocketContext";
import { useAuth } from "../Context/AuthContext";

// Timeouts in milliseconds (adjusted for development)
const IDLE_TIMEOUT_MS = 5 * 60 * 1000;     // 5 minutes
const AWAY_TIMEOUT_MS = 15 * 60 * 1000;    // 15 minutes  
const AUTO_LOGOUT_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

const VALID_USER_STATUSES = ['offline', 'online', 'active', 'idle', 'away'];
const VALID_ACTIVITY_TYPES = [
  'login', 'logout', 'idle_start', 'idle_end', 'auto_logout', 
  'session_start', 'session_end', 'session_resume', 'session_pause',
  'tab_hidden', 'tab_visible', 'connection_lost', 'reconnected',
  'page_focus', 'page_blur', 'mouse_activity', 'keyboard_activity'
];

// Function to get client IP
// const getClientIp = async () => {
//   try {
//     const response = await fetch('https://api.ipify.org?format=json');
//     const data = await response.json();
//     return data.ip || 'unknown';
//   } catch (error) {
//     console.error('Error fetching IP:', error);
//     return 'unknown';
//   }
// };

export function useUserIdleTracker() {
  const { socket, isConnected } = useSocket();
  const { user, logout } = useAuth();
  
  const idleTimeoutRef = useRef(null);
  const awayTimeoutRef = useRef(null);
  const autoLogoutTimeoutRef = useRef(null);
  const lastActivityRef = useRef(Date.now());
  const currentStatusRef = useRef('active');
  const instanceIdRef = useRef(`client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const isInitializedRef = useRef(false);
  const lastEmittedStatusRef = useRef(null);
  const clientIpRef = useRef('unknown');
  
  const userRef = useRef(user);
  const socketRef = useRef(socket);
  const isConnectedRef = useRef(isConnected);
  
  const timerStateRef = useRef({
    idleSet: false,
    awaySet: false,
    autoLogoutSet: false
  });
  
  useEffect(() => { 
    userRef.current = user; 
  }, [user]);
  
  useEffect(() => { 
    socketRef.current = socket; 
  }, [socket]);
  
  useEffect(() => { 
    isConnectedRef.current = isConnected; 
  }, [isConnected]);

  // Initialize IP address
  // useEffect(() => {
  //   const initIp = async () => {
  //     const ip = await getClientIp();
  //     clientIpRef.current = ip;
  //     console.log(`[IDLE-DEBUG] Client IP initialized: ${ip}`);
  //   };
  //   initIp();
  // }, []);

  const resetTimers = useCallback(() => {
    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current);
      idleTimeoutRef.current = null;
      timerStateRef.current.idleSet = false;
    }
    
    if (awayTimeoutRef.current) {
      clearTimeout(awayTimeoutRef.current);
      awayTimeoutRef.current = null;
      timerStateRef.current.awaySet = false;
    }
    
    if (autoLogoutTimeoutRef.current) {
      clearTimeout(autoLogoutTimeoutRef.current);
      autoLogoutTimeoutRef.current = null;
      timerStateRef.current.autoLogoutSet = false;
    }
  }, []);

  const performAutoLogout = useCallback(async () => {
    console.log('🚪 [IDLE-DEBUG] Performing auto-logout due to inactivity');
    
    try {
      const currentUser = userRef.current;
      const currentSocket = socketRef.current;
      const currentIsConnected = isConnectedRef.current;
      
      if (currentSocket && currentIsConnected && currentUser) {
        emitUserActivity('offline', 'auto_logout', {
          reason: 'inactivity_timeout',
          lastActivity: lastActivityRef.current,
          totalInactiveTime: Date.now() - lastActivityRef.current,
          ipAddress: clientIpRef.current
        });
      }
      
      resetTimers();
      currentStatusRef.current = 'offline';
      await logout();
    } catch (error) {
      console.error('❌ [IDLE-DEBUG] Error during auto-logout:', error);
    }
  }, [logout, resetTimers]);

  const handleBeforeUnload = useCallback((event) => {
    const currentUser = userRef.current;
    const currentSocket = socketRef.current;
    const currentIsConnected = isConnectedRef.current;
    
    if (currentSocket && currentIsConnected && currentUser) {
      const eventData = {
        userId: currentUser.userId || currentUser._id,
        status: 'offline',
        activityType: 'page_unload',
        timestamp: Date.now(),
        instanceId: instanceIdRef.current,
        userInfo: {
          firstname: currentUser.firstname,
          lastname: currentUser.lastname,
          email: currentUser.email,
          role: currentUser.role,
          photo: currentUser.photo
        },
        metadata: {
          reason: 'page_unload',
          ipAddress: clientIpRef.current
        }
      };
      
      currentSocket.emit('user:activity', eventData);
      
      if (navigator.sendBeacon && typeof window !== 'undefined') {
        try {
          const beaconData = JSON.stringify({
            type: 'user_logout',
            data: eventData
          });
          
          // Use the new endpoint
          navigator.sendBeacon('/api/v1/adminUser/activity', beaconData);
        } catch (error) {
          console.warn('⚠️ [IDLE-DEBUG] Failed to send beacon:', error);
        }
      }
    }
    
    resetTimers();
    currentStatusRef.current = 'offline';
  }, [resetTimers]);

  const emitUserActivity = useCallback((status, activityType = null, additionalData = {}) => {
    const currentSocket = socketRef.current;
    const currentIsConnected = isConnectedRef.current;
    const currentUser = userRef.current;
    
    if (!currentSocket || !currentIsConnected || !currentUser) {
      console.log('⚠️ [IDLE-DEBUG] Cannot emit activity - socket not ready');
      return;
    }

    const validActivityType = VALID_ACTIVITY_TYPES.includes(activityType) 
      ? activityType 
      : status;

    const eventData = {
      userId: currentUser.userId || currentUser._id,
      status: VALID_USER_STATUSES.includes(status) ? status : 'active',
      activityType: validActivityType,
      timestamp: Date.now(),
      instanceId: instanceIdRef.current,
      userInfo: {
        firstname: currentUser.firstname,
        lastname: currentUser.lastname,
        email: currentUser.email,
        role: currentUser.role,
        photo: currentUser.photo
      },
      metadata: {
        ...additionalData,
        ipAddress: clientIpRef.current
      }
    };

    console.log(`📡 [IDLE-DEBUG] Emitting user:activity: ${status} (${validActivityType}) from IP: ${clientIpRef.current}`);
    currentSocket.emit('user:activity', eventData);
    
    currentStatusRef.current = status;
    lastEmittedStatusRef.current = status;
  }, []);

  const handleActivity = useCallback((activityType = 'mouse_activity') => {
    const now = Date.now();
    lastActivityRef.current = now;
    console.log(`[IDLE-DEBUG] Activity detected: ${activityType} at ${new Date(now).toISOString()}`);
    
    const ignoredActivityTypes = [
      'api_call', 'fetch_request', 'network_request', 
      'background_sync', 'auto_refresh', 'periodic_update'
    ];
    
    if (ignoredActivityTypes.includes(activityType)) {
      return;
    }
    
    const userInteractionTypes = [
      'mouse_activity', 'keyboard_activity', 'tab_visible', 'page_focus',
      'click', 'scroll', 'touch', 'session_start', 'manual_activation'
    ];
    
    if (userInteractionTypes.includes(activityType)) {
      emitUserActivity('active', activityType, { 
        activityTrigger: activityType,
        timestamp: now,
        ipAddress: clientIpRef.current
      });
    }

    resetTimers();

    const activityTime = lastActivityRef.current;

    idleTimeoutRef.current = setTimeout(() => {
      const currentStatus = currentStatusRef.current;
      const timeSinceActivity = Date.now() - activityTime;
      
      if ((currentStatus === 'active' || currentStatus === 'online') && 
          timeSinceActivity >= IDLE_TIMEOUT_MS - 1000) {
        console.log(`[IDLE-DEBUG] Emitting idle status after ${timeSinceActivity}ms`);
        emitUserActivity('idle', 'idle_start', {
          lastActivity: activityTime,
          inactivityDuration: timeSinceActivity,
          reason: 'timeout',
          ipAddress: clientIpRef.current
        });
      }
    }, IDLE_TIMEOUT_MS);
    timerStateRef.current.idleSet = true;

    awayTimeoutRef.current = setTimeout(() => {
      const currentStatus = currentStatusRef.current;
      const timeSinceActivity = Date.now() - activityTime;
      
      if (currentStatus === 'idle' && timeSinceActivity >= AWAY_TIMEOUT_MS - 1000) {
        emitUserActivity('away', 'session_pause', {
          lastActivity: activityTime,
          inactivityDuration: timeSinceActivity,
          reason: 'timeout',
          ipAddress: clientIpRef.current
        });
      }
    }, AWAY_TIMEOUT_MS);
    timerStateRef.current.awaySet = true;

    autoLogoutTimeoutRef.current = setTimeout(() => {
      performAutoLogout();
    }, AUTO_LOGOUT_TIMEOUT_MS);
    timerStateRef.current.autoLogoutSet = true;

  }, [emitUserActivity, resetTimers, performAutoLogout]);

  // Debug logging
  useEffect(() => {
    const debugInterval = setInterval(() => {
      const now = Date.now();
      const timeSinceActivity = now - lastActivityRef.current;
      const minutes = Math.floor(timeSinceActivity / 60000);
      const seconds = Math.floor((timeSinceActivity % 60000) / 1000);
      
      console.log(`🕐 [IDLE-DEBUG] Status: ${currentStatusRef.current}, Activity: ${minutes}m ${seconds}s ago, IP: ${clientIpRef.current}`);
    }, 15000);

    return () => clearInterval(debugInterval);
  }, []);

  const handleVisibilityChange = useCallback(() => {
    if (document.hidden) {
      console.log('[IDLE-DEBUG] Tab hidden');
      resetTimers();
      
      if (currentStatusRef.current === 'active') {
        emitUserActivity('idle', 'tab_hidden', {
          reason: 'tab_hidden',
          lastActivity: lastActivityRef.current,
          hiddenAt: Date.now(),
          ipAddress: clientIpRef.current
        });
      }
      
      const hiddenTime = Date.now();
      idleTimeoutRef.current = setTimeout(() => {
        emitUserActivity('away', 'session_pause', {
          reason: 'tab_hidden_timeout',
          lastActivity: lastActivityRef.current,
          hiddenAt: hiddenTime,
          ipAddress: clientIpRef.current
        });
      }, AWAY_TIMEOUT_MS);
      timerStateRef.current.idleSet = true;
    } else {
      console.log('[IDLE-DEBUG] Tab visible');
      handleActivity('tab_visible');
    }
  }, [handleActivity, resetTimers, emitUserActivity]);

  const handleFocusChange = useCallback((focused) => {
    const activityType = focused ? 'page_focus' : 'page_blur';
    
    if (focused) {
      handleActivity(activityType);
    } else {
      resetTimers();
      if (currentStatusRef.current === 'active') {
        emitUserActivity('idle', 'page_blur', {
          reason: 'page_blur',
          lastActivity: lastActivityRef.current,
          blurredAt: Date.now(),
          ipAddress: clientIpRef.current
        });
      }
    }
  }, [handleActivity, resetTimers, emitUserActivity]);

  // Main initialization effect
  useEffect(() => {
    const currentUser = userRef.current;
    const currentSocket = socketRef.current;
    const currentIsConnected = isConnectedRef.current;
    
    if (!currentUser || !currentSocket || !currentIsConnected || currentUser.role !== 1) {
      return;
    }

    if (isInitializedRef.current) {
      return;
    }

    console.log('🎯 [IDLE-DEBUG] Initializing activity tracker');
    isInitializedRef.current = true;

    const activityEvents = [
      { event: 'mousedown', type: 'mouse_activity' },
      { event: 'mousemove', type: 'mouse_activity' }, 
      { event: 'keypress', type: 'keyboard_activity' },
      { event: 'scroll', type: 'mouse_activity' },
      { event: 'touchstart', type: 'mouse_activity' },
      { event: 'click', type: 'mouse_activity' },
      { event: 'mouseup', type: 'mouse_activity' },
      { event: 'keydown', type: 'keyboard_activity' },
      { event: 'keyup', type: 'keyboard_activity' },
      { event: 'touchmove', type: 'mouse_activity' },
      { event: 'touchend', type: 'mouse_activity' }
    ];
    
    const throttledHandlers = {};
    activityEvents.forEach(({ event, type }) => {
      throttledHandlers[event] = throttle(() => handleActivity(type), 500);
    });
    
    activityEvents.forEach(({ event }) => {
      document.addEventListener(event, throttledHandlers[event], { passive: true });
    });

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    const handleFocus = () => handleFocusChange(true);
    const handleBlur = () => handleFocusChange(false);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Check initial idle state
    const timeSinceLastActivity = Date.now() - lastActivityRef.current;
    if (timeSinceLastActivity > IDLE_TIMEOUT_MS) {
      emitUserActivity('idle', 'initial_idle', {
        reason: 'initial_load',
        lastActivity: lastActivityRef.current,
        ipAddress: clientIpRef.current
      });
    }
    
    handleActivity('session_start');

    return () => {
      isInitializedRef.current = false;
      
      if (currentSocket && currentIsConnected && currentUser) {
        emitUserActivity('offline', 'session_end', {
          reason: 'component_cleanup',
          ipAddress: clientIpRef.current
        });
      }
      
      activityEvents.forEach(({ event }) => {
        document.removeEventListener(event, throttledHandlers[event]);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      resetTimers();
    };
  }, [user, socket, isConnected, handleActivity, handleVisibilityChange, handleBeforeUnload, resetTimers, emitUserActivity, handleFocusChange]);

  // Reconnection handling
  useEffect(() => {
    const currentUser = userRef.current;
    const currentIsConnected = isConnectedRef.current;
    
    if (currentIsConnected && currentUser && currentUser.role === 1 && isInitializedRef.current) {
      emitUserActivity(currentStatusRef.current, 'reconnected', {
        reconnectedAt: Date.now(),
        previousStatus: currentStatusRef.current,
        ipAddress: clientIpRef.current
      });
      
      if (currentStatusRef.current === 'active') {
        handleActivity('reconnected');
      }
    }
  }, [isConnected, emitUserActivity, handleActivity]);

  const setStatus = useCallback((status, reason = 'manual') => {
    emitUserActivity(status, 'manual_override', {
      reason,
      previousStatus: currentStatusRef.current,
      timestamp: Date.now(),
      ipAddress: clientIpRef.current
    });
    
    if (status === 'active') {
      handleActivity('manual_activation');
    } else {
      resetTimers();
    }
  }, [emitUserActivity, handleActivity, resetTimers]);

  const getActivityInfo = useCallback(() => {
    return {
      currentStatus: currentStatusRef.current,
      lastActivity: lastActivityRef.current,
      instanceId: instanceIdRef.current,
      timeSinceLastActivity: Date.now() - lastActivityRef.current,
      isInitialized: isInitializedRef.current,
      lastEmittedStatus: lastEmittedStatusRef.current,
      timersSet: timerStateRef.current,
      clientIp: clientIpRef.current
    };
  }, []);

  return {
    currentStatus: currentStatusRef.current,
    lastActivity: lastActivityRef.current,
    instanceId: instanceIdRef.current,
    emitUserActivity,
    performAutoLogout,
    setStatus,
    getActivityInfo,
    resetTimers
  };
}

// Throttle function
function throttle(func, limit) {
  let inThrottle;
  let lastFunc;
  let lastRan;
  
  return function() {
    const context = this;
    const args = arguments;
    
    if (!lastRan) {
      func.apply(context, args);
      lastRan = Date.now();
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(function() {
        if ((Date.now() - lastRan) >= limit) {
          func.apply(context, args);
          lastRan = Date.now();
        }
      }, limit - (Date.now() - lastRan));
    }
  }
}
