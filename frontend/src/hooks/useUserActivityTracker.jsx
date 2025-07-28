import { useEffect, useRef } from "react";
import { useSocket } from "../Context/SocketContext";

const IDLE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes idle threshold

export const useUserActivityTracker = () => { 
    const socket = useSocket();
    const idleTimeoutRef = useRef();

    // Let's Emit Status to Server Via Socket
    const emitStatus = (status) => {
        if (!socket || socket.connected === false) return;
        socket.emit('user:activity', { status, timestamp: Date.now() });
    };

    const resetIdleTimer = () => {
        emitStatus('active');
        if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);

        idleTimeoutRef.current = setTimeout(() => {
            emitStatus('idle');
            // This will now trigger frontend auto logout countdown here
        }, IDLE_TIMEOUT_MS);
    };

    useEffect(() => {
        // Start Timer on Component Mount
        resetIdleTimer();

        // Attaching Event Listeners for User Activity To Reset Timer
        const events = ['mousemove', 'keydown', 'mousedown', 'touchstart'];
        events.forEach(evt => window.addEventListener(evt, resetIdleTimer));

        return () => {
            // Clean up Listeners & Timers on Component Mount
            events.forEach(evt => window.removeEventListener(evt, resetIdleTimer));
            if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
        };
    }, [socket]);
    return null;
};
