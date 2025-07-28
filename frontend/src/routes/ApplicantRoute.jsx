import React, { useState, useEffect } from 'react';
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";
import API from "../helpers/API";
import Spinner from "../ui/Spinner/Spinner";

export const ApplicantRoute = () => {
    const [ok, setOk] = useState(null);
    const [auth, , isInitialized] = useAuth();

    useEffect(() => {
        const authCheck = async () => {
            try {
                console.log("Applicant Route: Checking authorization...");
                
                if (!auth?.token) {
                    console.log("Applicant Route: No token found");
                    setOk(false);
                    return;
                }

                const res = await API.get("/api/v1/auth/applicantRoute");
                console.log("Applicant Route API response:", res.data);
                
                if (res.data.ok) {
                    setOk(true);
                } else {
                    setOk(false);
                }
            } catch (error) {
                console.error("Applicant Route auth check failed:", error.response?.data || error.message);
                setOk(false);
            }
        };

        // Only run auth check after auth context is initialized
        if (isInitialized) {
            authCheck();
        }
    }, [auth?.token, isInitialized]);

    // Show spinner while auth is initializing or checking
    if (!isInitialized || ok === null) {
        return <Spinner />;
    }

    return ok ? <Outlet /> : <Navigate to="/Login" replace />;
};
