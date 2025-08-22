//frontend/src/Context/SocketContext.jsx
import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { logWithIcon } from '../utils/consoleIcons';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [error, setError] = useState(null);
  
  // FIXED: Destructure correctly from AuthContext
  const [auth, updateAuth, isInitialized, logout] = useAuth();
  
  // Extract values from auth object
  const user = auth?.user;
  const token = auth?.token;
  const isAuthenticated = !!(user && token);
  
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const baseReconnectDelay = 2000;
  const socketRef = useRef(null);
  const connectionAttemptRef = useRef(false);

  const cleanupSocket = useCallback(() => {
    if (socketRef.current) {
      logWithIcon.cleanup('Cleaning up Existing Socket')
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setSocket(null);
    setIsConnected(false);
    setConnectionStatus('disconnected');
    clearTimeout(reconnectTimeoutRef.current);
  }, []);

  const createSocket = useCallback(() => {
    // Prevent multiple connection attempts
    if (connectionAttemptRef.current) {
      logWithIcon.warning('Connection attempt already in progress');
      return null;
    }

    connectionAttemptRef.current = true;
    setConnectionStatus('connecting');
    setError(null);
    
    // Clean up existing socket first
    cleanupSocket();
    
    //const serverUrl = process.env.REACT_APP_API_URL || 'https://server.prosoftsynergies.com';
    const serverUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
    logWithIcon.network('Connecting to server: ' + serverUrl)
    
    let socketConfig;
    
    // Configure socket based on authentication status
    if (isAuthenticated && token && user) {
      logWithIcon.disconnect('Creating authenticated socket connection for: ' + user?.email);
      socketConfig = {
        auth: { 
          token: token,
          userId: user._id || user.userId,
          guest: false, // IMPORTANT: Explicitly set guest to false
          userInfo: {
            firstname: user.firstname,
            lastname: user.lastname,
            email: user.email,
            role: user.role,
            photo: user.photo
          }
        },
        transports: ['websocket', 'polling'],
        upgrade: true,
        reconnection: true,
        reconnectionAttempts: maxReconnectAttempts,
        reconnectionDelay: baseReconnectDelay,
        reconnectionDelayMax: 10000,
        randomizationFactor: 0.5,
        timeout: 20000,
        autoConnect: true,
        forceNew: true
      };
    } else {
      logWithIcon.guest('Creating guest socket connection');
      socketConfig = {
        auth: { 
          guest: true, // IMPORTANT: This tells the server this is a guest connection
          token: null, // IMPORTANT: Explicitly set token to null for guests
          userInfo: {
            isGuest: true,
            role: 'guest'
          }
        },
        transports: ['websocket', 'polling'],
        upgrade: true,
        reconnection: true,
        reconnectionAttempts: maxReconnectAttempts,
        reconnectionDelay: baseReconnectDelay,
        reconnectionDelayMax: 10000,
        randomizationFactor: 0.5,
        timeout: 20000,
        autoConnect: true,
        forceNew: true
      };
    }
    
    const newSocket = io(serverUrl, socketConfig);

    // Store socket reference
    socketRef.current = newSocket;

    // Connection event handlers
    newSocket.on('connect', () => {
      logWithIcon.success('Socket connected with ID:', newSocket.id);
      connectionAttemptRef.current = false;
      setIsConnected(true);
      setConnectionStatus('connected');
      setError(null);
      reconnectAttemptsRef.current = 0;
      
      // Emit initial connection status for authenticated admin users only
      if (isAuthenticated && user && user.role === 1) {
        logWithIcon.broadcast('Emitting initial admin connection')
        newSocket.emit('admin:connected', {
          userId: user._id || user.userId,
          userInfo: {
            firstname: user.firstname,
            lastname: user.lastname,
            email: user.email,
            role: user.role,
            photo: user.photo
          },
          timestamp: Date.now(),
          socketId: newSocket.id
        });
        
        // Also emit user activity as active for authenticated users
        newSocket.emit('user:activity', {
          userId: user._id || user.userId,
          status: 'active',
          timestamp: Date.now(),
          userInfo: {
            firstname: user.firstname,
            lastname: user.lastname,
            email: user.email,
            role: user.role,
            photo: user.photo
          }
        });
      } else if (!isAuthenticated) {
        logWithIcon.guest('Guest socket connected successfully');
      }
    });

    newSocket.on('disconnect', (reason) => {
      logWithIcon.error('Socket disconnected:', reason);
      connectionAttemptRef.current = false;
      setIsConnected(false);
      setConnectionStatus('disconnected');
      
      // Don't auto-reconnect for certain reasons
      if (reason === 'io server disconnect' || 
          reason === 'transport close' || 
          reason === 'transport error') {
        logWithIcon.reconnect('Will attempt to reconnect after disconnect reason: ' + reason)
        handleReconnect();
      }
    });

    newSocket.on('connect_error', (error) => {
      logWithIcon.error('Connection error: ' + error)
      connectionAttemptRef.current = false;
      setError(error.message || 'Connection failed');
      setConnectionStatus('error');
      
      if (error.message && (
          error.message.includes('Authentication Failed') || 
          error.message.includes('Unauthorized') ||
          error.message.includes('Invalid token')
        )) {
        logWithIcon.auth('Authentication failed, logging out')
        cleanupSocket();
        logout();
      } else {
        handleReconnect();
      }
    });

    newSocket.on('reconnect_attempt', (attempt) => {
      logWithIcon.reconnect(`Reconnect attempt ${attempt}/${maxReconnectAttempts}`);
      setConnectionStatus(`reconnecting (${attempt}/${maxReconnectAttempts})`);
    });

    newSocket.on('reconnect', (attempt) => {
      logWithIcon.success(`Reconnected after ${attempt} attempts`);
      connectionAttemptRef.current = false;
      setIsConnected(true);
      setConnectionStatus('connected');
      setError(null);
    });

    newSocket.on('reconnect_failed', () => {
      logWithIcon.error('Permanent connection failure');
      connectionAttemptRef.current = false;
      setError('Connection failed permanently');
      setConnectionStatus('failed');
    });

    // Add auth error handler
    newSocket.on('auth_error', (error) => {
      logWithIcon.auth('Authentication error: ' + error)
      cleanupSocket();
      logout();
    });

    return newSocket;
  }, [isAuthenticated, token, user, logout, cleanupSocket]);

  const handleReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      logWithIcon.error('Max reconnect attempts reached')
      setConnectionStatus('failed');
      return;
    }

    if (connectionAttemptRef.current) {
      logWithIcon.warning('Reconnect already in progress')
      return;
    }

    clearTimeout(reconnectTimeoutRef.current);
    
    reconnectAttemptsRef.current += 1;
    const delay = Math.min(
      baseReconnectDelay * Math.pow(2, reconnectAttemptsRef.current), 
      30000
    );
    
    logWithIcon.reconnect(`Scheduling reconnect attempt ${reconnectAttemptsRef.current} in ${delay}ms`);
    setConnectionStatus(`reconnecting in ${Math.round(delay/1000)}s`);
    
    reconnectTimeoutRef.current = setTimeout(() => {
      logWithIcon.reconnect(`Executing reconnect attempt ${reconnectAttemptsRef.current}`);
      const newSocket = createSocket();
      if (newSocket) {
        setSocket(newSocket);
      }
    }, delay);
  }, [createSocket]);

  const disconnect = useCallback(() => {
    logWithIcon.disconnect('Manual disconnect requested')
    
    // Emit offline status before disconnecting for authenticated users only
    if (socketRef.current && isConnected && isAuthenticated && user) {
      socketRef.current.emit('user:activity', {
        userId: user._id || user.userId,
        status: 'offline',
        timestamp: Date.now(),
        reason: 'manual_disconnect'
      });
    }
    
    cleanupSocket();
    reconnectAttemptsRef.current = 0;
  }, [cleanupSocket, isConnected, isAuthenticated, user]);

  // Initialize socket when auth state changes or for guest connections
  useEffect(() => {
    // FIXED: Wait for auth to be initialized before attempting connection
    if (!isInitialized) {
      logWithIcon.waiting('Waiting for auth initialization...')
      return;
    }

    logWithIcon.reconnect('Auth state effect triggered:', { 
      isAuthenticated, 
      hasToken: !!token, 
      hasUser: !!user,
      userRole: user?.role,
      connectionStatus,
      isInitialized
    });
    
    // Create socket for authenticated users
    if (isAuthenticated && token && user) {
      // Only create socket if we don't have a connected one
      if (!socketRef.current || !isConnected) {
        logWithIcon.launch('Creating new authenticated socket connection');
        const newSocket = createSocket();
        if (newSocket) {
          setSocket(newSocket);
        }
      } else {
        logWithIcon.info('Socket already connected, skipping creation')
      }
    } 
    // Create socket for guest users (when auth is initialized but user is not authenticated)
    else if (!isAuthenticated && isInitialized) {
      // Only create guest socket if we don't have a connected one
      if (!socketRef.current || !isConnected) {
        logWithIcon.launch('Creating new guest socket connection');
        const newSocket = createSocket();
        if (newSocket) {
          setSocket(newSocket);
        }
      } else {
        logWithIcon.info('Guest socket already connected, skipping creation')
      }
    } 
    // Cleanup when auth is invalid
    else {
      logWithIcon.cleanup('Auth state invalid, cleaning up socket')
      disconnect();
    }
  }, [isAuthenticated, token, user, isInitialized, isConnected, createSocket, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      logWithIcon.cleanup('SocketProvider unmounting');
      if (socketRef.current && user) {
        // Emit offline status before cleanup
        socketRef.current.emit('user:activity', {
          userId: user._id || user.userId,
          status: 'offline',
          timestamp: Date.now(),
          reason: 'component_unmount'
        });
      }
      cleanupSocket();
    };
  }, [cleanupSocket, user]);

  // Handle page beforeunload to emit offline status for authenticated users
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (socketRef.current && isConnected && isAuthenticated && user) {
        socketRef.current.emit('user:activity', {
          userId: user._id || user.userId,
          status: 'offline',
          timestamp: Date.now(),
          reason: 'page_unload'
        });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isConnected, isAuthenticated, user]);

  const value = {
    socket: socketRef.current,
    isConnected,
    connectionStatus,
    error,
    disconnect,
    reconnect: () => {
      reconnectAttemptsRef.current = 0;
      handleReconnect();
    },
    // Helper method to ensure socket is available for guests
    ensureSocketConnection: () => {
      if (!socketRef.current || !isConnected) {
        logWithIcon.info('Ensuring socket connection for guest/user');
        const newSocket = createSocket();
        if (newSocket) {
          setSocket(newSocket);
        }
        return newSocket;
      }
      return socketRef.current;
    }
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
