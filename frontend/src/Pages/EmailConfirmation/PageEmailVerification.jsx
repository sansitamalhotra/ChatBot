import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import API from "../../helpers/API";
import { useParams, useNavigate } from "react-router-dom";

import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import TestHomeHeader from '../TestHomeHeader';
import Footer from '../Footer';

import './About.css';

const PageEmailVerification = () => {
    const canonicalUrl = window.location.href; 
    const navigate = useNavigate(); 
    const params = useParams();

    const [verificationStatus, setVerificationStatus] = useState({
        isLoading: true,
        isVerified: false,
        errorMessage: null
    });

    const notifyErr = (msg) =>
        toast.error(msg, {
            position: "top-center",
            autoClose: 20000,
            closeOnClick: true,
            pauseOnHover: true,
            theme: "light"
        });

    const notifySucc = (msg) =>
        toast.success(msg, {
            position: "top-center",
            autoClose: 20000,
            closeOnClick: true,
            pauseOnHover: true,
            theme: "light"
        });

    useEffect(() => {
        const verifyEmailUrl = async () => {
            try {
                const config = { headers: { "Content-Type": "application/json" } };
                const response = await API.get(
                    `/api/v1/auth/Email-Account-Verification/${params.id}/${params.token}`,
                    config
                );
                
                if (response.status === 200) {
                    setVerificationStatus({ 
                        isLoading: false, 
                        isVerified: true,
                        errorMessage: null
                    });
                    notifySucc(response.data.message);
                    navigate("/Login");
                } else {
                    setVerificationStatus({ 
                        isLoading: false, 
                        isVerified: false,
                        errorMessage: response.data.message
                    });
                    notifyErr(response.data.message);
                }
            } catch (error) {
                const errorMsg = error.response?.data?.message || "Verification failed";
                setVerificationStatus({ 
                    isLoading: false, 
                    isVerified: false,
                    errorMessage: errorMsg
                });
                notifyErr(errorMsg);
                navigate("/Login");
            }
        };
        
        verifyEmailUrl();
    }, [params, navigate]);

    if (verificationStatus.isLoading) {
        return <div>Loading...</div>;
    }

    return (
        <>
        <Helmet>
            <link rel="canonical" href={canonicalUrl} />
            <title>ProSoft Email Verification | ProsoftSynergies </title>
            <meta
                name="description"
                content="Complete Your Registration and Verify Your Email to start exploring Career Opportunities with ProSoft — Your Gateway to Jobs in Canada, the US, and India."
            />
            <meta
                name="keywords"
                content="ProSoft Website, Job Portal, Login, Sign In, Job Search, Career Opportunities, Canada jobs, US Jobs, India Jobs, Employment, Job Seekers, Employer Login"
            />
            <meta name="author" content="v" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        <TestHomeHeader />
        <section className="about-us-section">
            <div className="about-us-container">
                <div className="about-us-text">
                    <div className="text-content">
                        <h1>ProSoft Email Verification</h1>
                        <p>
                            Complete Your Registration and Verify Your Email to start exploring Career Opportunities with ProSoft.
                        </p>
                    </div>
                </div>
                <div className="about-us-image">
                    <img
                        src="https://images.pexels.com/photos/7372/startup-photos.jpg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
                        alt="ThinkBeyond Email Verification"
                    />
                </div>
            </div>
        </section>
        {!verificationStatus.isVerified && verificationStatus.errorMessage && (
            <section className="email-verification-section">
                <div className="email-verification-container">
                    <div className="email-verification-text">
                        <div className="form-wrapper">
                            <h3>Email Verification Failed</h3>
                            <p>{verificationStatus.errorMessage}</p>
                        </div>
                    </div>
                </div>
            </section>
        )}
        <Footer />  
        </>
    );
};

export default PageEmailVerification;
