import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

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
      console.log('🧹 Cleaning up existing socket');
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
      console.log('⚠️ Connection attempt already in progress');
      return null;
    }

    // FIXED: Use the correctly extracted values
    if (!isAuthenticated || !token || !user) {
      console.log('❌ Cannot create socket: missing auth data', { 
        isAuthenticated, 
        hasToken: !!token, 
        hasUser: !!user 
      });
      return null;
    }

    connectionAttemptRef.current = true;
    console.log('🔌 Creating socket connection for:', user?.email);
    setConnectionStatus('connecting');
    setError(null);
    
    // Clean up existing socket first
    cleanupSocket();
    
    const serverUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
    console.log('🌐 Connecting to server:', serverUrl);
    
    const newSocket = io(serverUrl, {
      auth: { 
        token: token,
        userId: user._id || user.userId,
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
    });

    // Store socket reference
    socketRef.current = newSocket;

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('✅ Socket connected with ID:', newSocket.id);
      connectionAttemptRef.current = false;
      setIsConnected(true);
      setConnectionStatus('connected');
      setError(null);
      reconnectAttemptsRef.current = 0;
      
      // Emit initial connection status for admin users
      if (user && user.role === 1) {
        console.log('📡 Emitting initial admin connection');
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
        
        // Also emit user activity as active
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
      }
    });

    newSocket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      connectionAttemptRef.current = false;
      setIsConnected(false);
      setConnectionStatus('disconnected');
      
      // Don't auto-reconnect for certain reasons
      if (reason === 'io server disconnect' || 
          reason === 'transport close' || 
          reason === 'transport error') {
        console.log('🔄 Will attempt to reconnect after disconnect reason:', reason);
        handleReconnect();
      }
    });

    newSocket.on('connect_error', (error) => {
      console.error('🚫 Connection error:', error);
      connectionAttemptRef.current = false;
      setError(error.message || 'Connection failed');
      setConnectionStatus('error');
      
      if (error.message && (
          error.message.includes('Authentication Failed') || 
          error.message.includes('Unauthorized') ||
          error.message.includes('Invalid token')
        )) {
        console.log('🔑 Authentication failed, logging out');
        cleanupSocket();
        logout();
      } else {
        handleReconnect();
      }
    });

    newSocket.on('reconnect_attempt', (attempt) => {
      console.log(`🔄 Reconnect attempt ${attempt}/${maxReconnectAttempts}`);
      setConnectionStatus(`reconnecting (${attempt}/${maxReconnectAttempts})`);
    });

    newSocket.on('reconnect', (attempt) => {
      console.log(`✅ Reconnected after ${attempt} attempts`);
      connectionAttemptRef.current = false;
      setIsConnected(true);
      setConnectionStatus('connected');
      setError(null);
    });

    newSocket.on('reconnect_failed', () => {
      console.error('🚫 Permanent connection failure');
      connectionAttemptRef.current = false;
      setError('Connection failed permanently');
      setConnectionStatus('failed');
    });

    // Add auth error handler
    newSocket.on('auth_error', (error) => {
      console.error('🔑 Authentication error:', error);
      cleanupSocket();
      logout();
    });

    return newSocket;
  }, [isAuthenticated, token, user, logout, cleanupSocket]);

  const handleReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      console.log('🚫 Max reconnect attempts reached');
      setConnectionStatus('failed');
      return;
    }

    if (connectionAttemptRef.current) {
      console.log('⚠️ Reconnect already in progress');
      return;
    }

    clearTimeout(reconnectTimeoutRef.current);
    
    reconnectAttemptsRef.current += 1;
    const delay = Math.min(
      baseReconnectDelay * Math.pow(2, reconnectAttemptsRef.current), 
      30000
    );
    
    console.log(`🔄 Scheduling reconnect attempt ${reconnectAttemptsRef.current} in ${delay}ms`);
    setConnectionStatus(`reconnecting in ${Math.round(delay/1000)}s`);
    
    reconnectTimeoutRef.current = setTimeout(() => {
      console.log(`🔄 Executing reconnect attempt ${reconnectAttemptsRef.current}`);
      const newSocket = createSocket();
      if (newSocket) {
        setSocket(newSocket);
      }
    }, delay);
  }, [createSocket]);

  const disconnect = useCallback(() => {
    console.log('🔌 Manual disconnect requested');
    
    // Emit offline status before disconnecting
    if (socketRef.current && isConnected && user) {
      socketRef.current.emit('user:activity', {
        userId: user._id || user.userId,
        status: 'offline',
        timestamp: Date.now(),
        reason: 'manual_disconnect'
      });
    }
    
    cleanupSocket();
    reconnectAttemptsRef.current = 0;
  }, [cleanupSocket, isConnected, user]);

  // Initialize socket when auth state changes
  useEffect(() => {
    // FIXED: Wait for auth to be initialized before attempting connection
    if (!isInitialized) {
      console.log('⏳ Waiting for auth initialization...');
      return;
    }

    console.log('🔄 Auth state effect triggered:', { 
      isAuthenticated, 
      hasToken: !!token, 
      hasUser: !!user,
      userRole: user?.role,
      connectionStatus,
      isInitialized
    });
    
    if (isAuthenticated && token && user) {
      // Only create socket if we don't have a connected one
      if (!socketRef.current || !isConnected) {
        console.log('🚀 Creating new socket connection');
        const newSocket = createSocket();
        if (newSocket) {
          setSocket(newSocket);
        }
      } else {
        console.log('ℹ️ Socket already connected, skipping creation');
      }
    } else {
      console.log('🧹 Auth state invalid, cleaning up socket');
      disconnect();
    }
  }, [isAuthenticated, token, user, isInitialized, isConnected, createSocket, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('🧹 SocketProvider unmounting');
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

  // Handle page beforeunload to emit offline status
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (socketRef.current && isConnected && user) {
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
  }, [isConnected, user]);

  const value = {
    socket: socketRef.current,
    isConnected,
    connectionStatus,
    error,
    disconnect,
    reconnect: () => {
      reconnectAttemptsRef.current = 0;
      handleReconnect();
    }
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
