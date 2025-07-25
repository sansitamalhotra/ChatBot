import React, { useState, useEffect } from 'react';
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";
import API from "../helpers/API";
import Spinner from "../ui/Spinner/Spinner";

export const ApplicantRoute = () => {
   
    const [ok, setOk] = useState(false);
    const [auth, setAuth] = useAuth();

    useEffect(() => {
        const authCheck = async () => {
            const res = await API.get("/api/v1/auth/applicantRoute");
            if (res.data.ok) {
                setOk(true);
            } 
             else {
                setOk(false);          
            }
        };
        if (auth?.token) authCheck();
    }, [auth?.token]);
    return ok ? <Outlet /> : <Spinner />
};
