// src/hooks/useUserIdleTracker.jsx

import { useEffect, useRef, useCallback } from "react";
import { useSocket } from "../Context/SocketContext";
import { useAuth } from "../Context/AuthContext";

// Idle times in ms
const IDLE_TIMEOUT_MS = 5 * 60 * 1000;      // 5 minutes until idle
const AWAY_TIMEOUT_MS = 15 * 60 * 1000;     // 15 minutes until away (optional)
const AUTO_LOGOUT_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes auto logout after inactivity

// Valid statuses and activity types
const VALID_USER_STATUSES = ['offline', 'online', 'active', 'idle', 'away'];
const VALID_ACTIVITY_TYPES = [
  'login', 'logout', 'idle_start', 'idle_end', 'auto_logout',
  'session_start', 'session_end', 'session_resume', 'session_pause',
  'tab_hidden', 'tab_visible', 'connection_lost', 'reconnected',
  'page_focus', 'page_blur', 'mouse_activity', 'keyboard_activity',
  'manual_override', 'page_unload', 'component_unmount'
];

export function useUserIdleTracker({ onAutoLogout } = {}) {
  const { socket, isConnected } = useSocket();
  const { user, logout } = useAuth();

  const idleTimeoutRef = useRef(null);
  const awayTimeoutRef = useRef(null);
  const autoLogoutTimeoutRef = useRef(null);
  const lastActivityRef = useRef(Date.now());
  const currentStatusRef = useRef('active');
  const instanceIdRef = useRef(`client_${Date.now()}_${Math.random().toString(36).slice(2,11)}`);
  const isInitializedRef = useRef(false);
  const lastEmittedStatusRef = useRef(null);
  const clientIpRef = useRef('unknown');

  // Keep latest user and socket refs
  const userRef = useRef(user);
  const socketRef = useRef(socket);
  const isConnectedRef = useRef(isConnected);

  const timerStateRef = useRef({
    idleSet: false,
    awaySet: false,
    autoLogoutSet: false
  });

  useEffect(() => { userRef.current = user; }, [user]);
  useEffect(() => { socketRef.current = socket; }, [socket]);
  useEffect(() => { isConnectedRef.current = isConnected; }, [isConnected]);

  // Clear all timers
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

  // Auto logout handler
  const performAutoLogout = useCallback(async () => {
    console.log('🚪 [IDLE] Auto-logout triggered due to inactivity');

    try {
      const currentUser = userRef.current;
      const currentSocket = socketRef.current;
      const currentIsConnected = isConnectedRef.current;

      if (currentSocket && currentIsConnected && currentUser) {
        currentSocket.emit('user:activity', {
          userId: currentUser.userId || currentUser._id,
          status: 'offline',
          activityType: 'auto_logout',
          timestamp: Date.now(),
          instanceId: instanceIdRef.current,
          metadata: {
            reason: 'inactivity_timeout',
            lastActivity: lastActivityRef.current,
            totalInactiveTime: Date.now() - lastActivityRef.current,
            ipAddress: clientIpRef.current
          }
        });
      }

      resetTimers();
      currentStatusRef.current = 'offline';
      if (onAutoLogout) {
        await onAutoLogout();
      } else {
        await logout();
      }
    } catch (error) {
      console.error('❌ Error during auto-logout:', error);
    }
  }, [logout, onAutoLogout, resetTimers]);

  // Emit user activity and status to server through socket
  const emitUserActivity = useCallback((status, activityType = null, additionalData = {}) => {
    const currentSocket = socketRef.current;
    const currentIsConnected = isConnectedRef.current;
    const currentUser = userRef.current;

    if (!currentSocket || !currentIsConnected || !currentUser) {
      console.warn('⚠️ Cannot emit user activity: socket not ready or user missing');
      return;
    }

    const validActivityType = activityType && VALID_ACTIVITY_TYPES.includes(activityType) ? activityType : status;

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

    console.log(`📡 [IDLE] Emitting user:activity status=${status} activityType=${validActivityType} ip=${clientIpRef.current}`);
    currentSocket.emit('user:activity', eventData);

    currentStatusRef.current = status;
    lastEmittedStatusRef.current = status;
  }, []);

  // React to user input or relevant DOM events
  const handleActivity = useCallback((activityType = 'mouse_activity') => {
    const now = Date.now();
    lastActivityRef.current = now;
    console.log(`[IDLE] Detected activity: ${activityType} at ${new Date(now).toISOString()}`);

    const ignoredActivities = [
      'api_call', 'fetch_request', 'network_request',
      'background_sync', 'auto_refresh', 'periodic_update'
    ];
    if (ignoredActivities.includes(activityType)) return;

    // Consider as user interaction
    const userInteractionTypes = [
      'mouse_activity', 'keyboard_activity', 'tab_visible',
      'page_focus', 'click', 'scroll', 'touch', 'session_start', 'manual_activation'
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

    // Idle timeout: after 5 minutes no activity -> idle
    idleTimeoutRef.current = setTimeout(() => {
      const currentStatus = currentStatusRef.current;
      const elapsed = Date.now() - activityTime;

      if ((currentStatus === 'active' || currentStatus === 'online') && elapsed >= IDLE_TIMEOUT_MS - 1000) {
        console.log(`[IDLE] Emitting idle status after ${elapsed}ms`);
        emitUserActivity('idle', 'idle_start', {
          lastActivity: activityTime,
          inactivityDuration: elapsed,
          reason: 'timeout',
          ipAddress: clientIpRef.current
        });
      }
    }, IDLE_TIMEOUT_MS);
    timerStateRef.current.idleSet = true;

    // Away timeout: after 15 minutes idle -> away
    awayTimeoutRef.current = setTimeout(() => {
      const currentStatus = currentStatusRef.current;
      const elapsed = Date.now() - activityTime;
      if (currentStatus === 'idle' && elapsed >= AWAY_TIMEOUT_MS - 1000) {
        emitUserActivity('away', 'session_pause', {
          lastActivity: activityTime,
          inactivityDuration: elapsed,
          reason: 'timeout',
          ipAddress: clientIpRef.current
        });
      }
    }, AWAY_TIMEOUT_MS);
    timerStateRef.current.awaySet = true;

    // Auto logout after inactivity
    autoLogoutTimeoutRef.current = setTimeout(() => {
      performAutoLogout();
    }, AUTO_LOGOUT_TIMEOUT_MS);
    timerStateRef.current.autoLogoutSet = true;

  }, [emitUserActivity, resetTimers, performAutoLogout]);

  // Visibility change events (tab hidden/visible)
  const handleVisibilityChange = useCallback(() => {
    if (document.hidden) {
      console.log('[IDLE] Tab hidden');
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
      console.log('[IDLE] Tab visible');
      handleActivity('tab_visible');
    }
  }, [handleActivity, resetTimers, emitUserActivity]);

  // Page focus / blur handling
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

  // Page unload/beforeunload cleanup
  const handleBeforeUnload = useCallback(() => {
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
          navigator.sendBeacon('/api/v1/adminUser/activity', beaconData);
        } catch (error) {
          console.warn('⚠️ Failed to send beacon:', error);
        }
      }
    }
    resetTimers();
    currentStatusRef.current = 'offline';
  }, [resetTimers]);

  // Setup event listeners and timers on mount
  useEffect(() => {
    if (isInitializedRef.current) return;

    const currentUser = userRef.current;
    const currentSocket = socketRef.current;
    const currentIsConnected = isConnectedRef.current;

    if (!currentUser || !currentSocket || !currentIsConnected || currentUser.role !== 1) return;

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

    // Throttle calls to handleActivity every 500ms max
    const throttle = (func, limit) => {
      let inThrottle, lastFunc, lastRan;
      return function () {
        const context = this, args = arguments;
        if (!lastRan) {
          func.apply(context, args);
          lastRan = Date.now();
        } else {
          clearTimeout(lastFunc);
          lastFunc = setTimeout(() => {
            if ((Date.now() - lastRan) >= limit) {
              func.apply(context, args);
              lastRan = Date.now();
            }
          }, limit - (Date.now() - lastRan));
        }
      };
    };

    const throttledHandlers = {};
    activityEvents.forEach(({ event, type }) => {
      throttledHandlers[event] = throttle(() => handleActivity(type), 500);
      document.addEventListener(event, throttledHandlers[event], { passive: true });
    });

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', () => handleFocusChange(true));
    window.addEventListener('blur', () => handleFocusChange(false));
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Capture stable IP for cleanup
    const ipAddress = clientIpRef.current;

    // Initialize idle state check
    const elapsed = Date.now() - lastActivityRef.current;
    if (elapsed > IDLE_TIMEOUT_MS) {
      emitUserActivity('idle', 'initial_idle', {
        reason: 'initial_load',
        lastActivity: lastActivityRef.current,
        ipAddress
      });
    }

    // Emit session start activity on initialization
    handleActivity('session_start');

    return () => {
      isInitializedRef.current = false;

      const currentUser = userRef.current;
      const currentSocket = socketRef.current;
      const currentIsConnected = isConnectedRef.current;

      // Use captured ipAddress in cleanup
      if (currentSocket && currentIsConnected && currentUser) {
        currentSocket.emit('user:activity', {
          userId: currentUser.userId || currentUser._id,
          status: 'offline',
          activityType: 'session_end',
          timestamp: Date.now(),
          metadata: {
            reason: 'component_cleanup',
            ipAddress
          }
        });
      }

      activityEvents.forEach(({ event }) => {
        document.removeEventListener(event, throttledHandlers[event]);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', () => handleFocusChange(true));
      window.removeEventListener('blur', () => handleFocusChange(false));
      window.removeEventListener('beforeunload', handleBeforeUnload);

      resetTimers();
    };
  }, [handleActivity, handleVisibilityChange, handleFocusChange, handleBeforeUnload, emitUserActivity, resetTimers]);

  // React to socket reconnection to re-emit current status
  useEffect(() => {
    if (!isInitializedRef.current) return;
    const currentUser = userRef.current;
    const currentIsConnected = isConnectedRef.current;

    if (currentIsConnected && currentUser && currentUser.role === 1) {
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

  // Allow manual setting of status from components
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

  // Optional getter for external introspection
  const getActivityInfo = useCallback(() => ({
    currentStatus: currentStatusRef.current,
    lastActivity: lastActivityRef.current,
    instanceId: instanceIdRef.current,
    timeSinceLastActivity: Date.now() - lastActivityRef.current,
    isInitialized: isInitializedRef.current,
    lastEmittedStatus: lastEmittedStatusRef.current,
    timersSet: timerStateRef.current,
    clientIp: clientIpRef.current
  }), []);

  // Expose public API of the hook
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
