import React, { useState, useEffect } from 'react';
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";
import API from "../helpers/API";
import Spinner from "../ui/Spinner/Spinner";

export const SuperAdminRoute = () => {
    const [ok, setOk] = useState(null);
    const [auth, setAuth] = useAuth();

    useEffect(() => {
        const authCheck = async () => {
            const res = await API.get("/api/v1/auth/isSuperAdminRoute");
            if (res.data.ok) {
                setOk(true);
            } else {
                setOk(false);
            }
        };
        if (auth?.token) {
            authCheck();
        }
    }, [auth?.token]);

    if (ok === null) {
        return <Spinner />;
    }

    return ok ? <Outlet /> : <Navigate to="/Login" />;
};
