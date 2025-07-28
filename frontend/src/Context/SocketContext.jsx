import React, { createContext, useContext, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);
export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const { auth } = useAuth();
    const socketRef = useRef(null);

    useEffect(() => {
        if (!auth?.token) {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
            return;
        }

        const socket = io(process.env.REACT_APP_API_URL || 'http://localhost:8000', {
            auth: { token: auth.token, },
            transports: ['websocket'], // This is in case we have to force websocket
        });
        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('Sockect Connected Successfully: ', socket.id);
        });

        socket.on('disconnect', (reason) => {
            console.log('Socket Disconnected Successfully: ', reason)
        });

        socket.on('connection_error', (err) => {
            console.log('Socket Connection Error: ', err.message);
        });
        
        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, [auth?.token]);

    return (
        <SocketContext.Provider value={socketRef.current}>
        {children}
        </SocketContext.Provider>
  );
};
