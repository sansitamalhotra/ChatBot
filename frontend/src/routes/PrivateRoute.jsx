import React, { useState, useEffect } from 'react';
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";
import API from "../helpers/API";
import Spinner from "../ui/Spinner/Spinner";

export const PrivateRoute = ({ requiredRole = 'admin' }) => {
    const [ok, setOk] = useState(null);
    const [auth, , authContext] = useAuth();

    useEffect(() => {
        const authCheck = async () => {
            try {
                if (!auth?.token) {
                    setOk(false);
                    return;
                }

                const endpoint = requiredRole === 'superadmin' 
                    ? "/api/v1/auth/isSuperAdminRoute" 
                    : "/api/v1/auth/adminRoute";
                
                const res = await API.get(endpoint);
                setOk(res.data.ok || false);
            } catch (error) {
                console.error(`ProtectedRoute (${requiredRole}): Auth check failed:`, error);
                setOk(false);
            }
        };

        if (authContext?.isInitialized) {
            authCheck();
        }
    }, [auth?.token, authContext?.isInitialized, requiredRole]);

    if (!authContext?.isInitialized || ok === null) {
        return <Spinner />;
    }

    return ok ? <Outlet /> : <Navigate to="/Login" replace />;
};
