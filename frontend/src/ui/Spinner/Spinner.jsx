import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";

import "./Spinner.css";

const notifyError = (msg) => toast.error(msg, 
    { position: "top-center", autoClose: 20000, closeOnClick: true, pauseOnHover: true, theme: "light" });
const notifySuccess = (msg) => toast.success(msg, 
    { position: "top-center", autoClose: 20000, closeOnClick: true, pauseOnHover: true, theme: "light" });

const Spinner = ({ redirectPath = "/PSPL-Access-Denied" }) => {
    const [count, setCount] = useState(1);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const interval = setInterval(() => {
            setCount((prevValue) => --prevValue);
        }, 2000);
        
        if (count === 0) {
            clearInterval(interval);
            navigate(redirectPath, {
                state: location.pathname
            });
            notifyError("ACCESS DENIED. You do not have the Authorization to View this Page!");
        }
        
        return () => clearInterval(interval);
    }, [count, navigate, location, redirectPath]);

    return (
        <div>
            <section id="general-content-120" className="" style={{ background: "#ffffff", paddingTop: "50px", paddingBottom: "200px" }}>
                <div className="container-fluid  d-flex align-items-center justify-content-between  flex-column flex-md-row values-wrapper">
                    <header className="d-flex flex-column  w-100 align-items-center justify-content-between pb-4">
                        <div className="wrap-header  w-100">
                            <article className="title w-100">
                            </article>
                            <article className="body w-100">
                                <p align="justify">
                                <div className="loader">Loading...</div>
                                <h1 className="text-center">Redirecting You in {count} second!</h1>
                                </p>
                            </article>
                        </div>
                    </header>
                </div>
            </section>
        </div>
    );
};

export default Spinner;
