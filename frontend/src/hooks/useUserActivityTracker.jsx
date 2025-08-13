import { useEffect, useRef } from "react";
import { useSocket } from "../Context/SocketContext";

const IDLE_TIMEOUT_MS = 5 * 60 * 1000;       // 5 mins idle threshold
const AUTO_LOGOUT_COUNTDOWN_MS = 2 * 60 * 1000; // 2 mins timeout after idle before auto logout

const ACTIVITY_EVENTS = [
  "click", "mousedown", "mouseup",
  "mouseover", "mouseout", "mousemove",
  "mouseenter", "mouseleave",
  "keydown", "touchstart",
  "scroll"
];

export const useUserActivityTracker = ({ onAutoLogout }) => {
  const socket = useSocket();
  const idleTimeoutRef = useRef(null);
  const autoLogoutTimeoutRef = useRef(null);
  const currentStatusRef = useRef("active");

  const emitStatus = (status) => {
    if (!socket || !socket.connected) return;
    socket.emit("user:activity", { status, timestamp: Date.now() });
    currentStatusRef.current = status;
  };

  // Clear both timers before resetting
  const clearTimers = () => {
    if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
    if (autoLogoutTimeoutRef.current) clearTimeout(autoLogoutTimeoutRef.current);
  };

  // Called when user is idle to start auto logout countdown
  const startAutoLogoutCountdown = () => {
    if (autoLogoutTimeoutRef.current) clearTimeout(autoLogoutTimeoutRef.current);

    autoLogoutTimeoutRef.current = setTimeout(() => {
      if (socket && socket.connected) {
        socket.emit("activity:auto-logout", { timestamp: Date.now() });
      }
      if (typeof onAutoLogout === "function") {
        onAutoLogout();
      }
    }, AUTO_LOGOUT_COUNTDOWN_MS);
  };

  // Reset idle timer on any activity event
  const resetIdleTimer = () => {
    clearTimers();

    if (currentStatusRef.current !== "active") {
      emitStatus("active");
    }

    idleTimeoutRef.current = setTimeout(() => {
      emitStatus("idle");
      startAutoLogoutCountdown();
    }, IDLE_TIMEOUT_MS);
  };

  useEffect(() => {
    resetIdleTimer();

    // Attach all activity event listeners
    ACTIVITY_EVENTS.forEach(evt => window.addEventListener(evt, resetIdleTimer));

    // Handle tab visibility changes (user switches tab or minimizes)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (currentStatusRef.current !== "idle") {
          emitStatus("idle");
          startAutoLogoutCountdown();
        }
      } else {
        resetIdleTimer();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Send explicit offline event on tab/window close
    const handleBeforeUnload = () => {
      if (socket && socket.connected) {
        socket.emit("user:offline", { timestamp: Date.now() });
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      clearTimers();
      ACTIVITY_EVENTS.forEach(evt => window.removeEventListener(evt, resetIdleTimer));
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [socket]);

  return null;
};
