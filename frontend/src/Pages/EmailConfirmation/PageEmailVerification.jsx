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
            autoClose: 5000,
            closeOnClick: true,
            pauseOnHover: true,
            theme: "light"
        });

    const notifySucc = (msg) =>
        toast.success(msg, {
            position: "top-center",
            autoClose: 5000,
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
                    
                    notifySucc(response.data.message || "Email verified successfully!");
                    
                    // Delay navigation to allow toast to be visible
                    setTimeout(() => {
                        navigate("/Login");
                    }, 2000);
                } else {
                    setVerificationStatus({ 
                        isLoading: false, 
                        isVerified: false,
                        errorMessage: response.data.message || "Verification failed"
                    });
                    notifyErr(response.data.message || "Verification failed");
                }
            } catch (error) {
                console.error("Email verification error:", error);
                const errorMsg = error.response?.data?.message || "Verification failed. Please try again.";
                
                setVerificationStatus({ 
                    isLoading: false, 
                    isVerified: false,
                    errorMessage: errorMsg
                });
                
                notifyErr(errorMsg);
                
                // Delay navigation on error as well to show the toast
                setTimeout(() => {
                    navigate("/Login");
                }, 3000);
            }
        };
        
        // Only verify if we have both id and token
        if (params.id && params.token) {
            verifyEmailUrl();
        } else {
            setVerificationStatus({
                isLoading: false,
                isVerified: false,
                errorMessage: "Invalid verification link"
            });
            notifyErr("Invalid verification link");
        }
    }, [params.id, params.token, navigate]);

    return (
        <>
            <Helmet>
                <link rel="canonical" href={canonicalUrl} />
                <title>ProsoftSynergies Email Verification | ProsoftSynergies </title>
                <meta
                    name="description"
                    content="Complete Your Registration and Verify Your Email to start exploring Career Opportunities with ProsoftSynergies — Your Gateway to Jobs in Canada, the US, and India."
                />
                <meta
                    name="keywords"
                    content="ProsoftSynergies Website, Job Portal, Login, Sign In, Job Search, Career Opportunities, Canada jobs, US Jobs, India Jobs, Employment, Job Seekers, Employer Login"
                />
                <meta name="author" content="ProsoftSynergies" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <meta name="robots" content="noindex, nofollow" />
            </Helmet>
            
            <TestHomeHeader />
            
            <section className="about-us-section">
                <div className="about-us-container">
                    <div className="about-us-text">
                        <div className="text-content">
                            <h1>ProsoftSynergies Email Verification</h1>
                            <p>
                                Complete Your Registration and Verify Your Email to start exploring Career Opportunities with ProsoftSynergies.
                            </p>
                        </div>
                    </div>
                    <div className="about-us-image">
                        <img
                            src="https://images.pexels.com/photos/7372/startup-photos.jpg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
                            alt="ProSoft Email Verification"
                        />
                    </div>
                </div>
            </section>

            {verificationStatus.isLoading ? (
                <section className="email-verification-section">
                    <div className="email-verification-container">
                        <div className="email-verification-text">
                            <div className="form-wrapper">
                                <h3>Verifying Your Email...</h3>
                                <p>Please wait while we verify your email address.</p>
                                <div className="spinner-border text-primary" role="status">
                                    <span className="sr-only">Loading...</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            ) : verificationStatus.isVerified ? (
                <section className="email-verification-section">
                    <div className="email-verification-container">
                        <div className="email-verification-text">
                            <div className="form-wrapper">
                                <h3>Email Verified Successfully!</h3>
                                <p>Your email has been verified. You will be redirected to the login page shortly.</p>
                                <div className="alert alert-success" role="alert">
                                    Verification successful! Redirecting to login...
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            ) : (
                <section className="email-verification-section">
                    <div className="email-verification-container">
                        <div className="email-verification-text">
                            <div className="form-wrapper">
                                <h3>Email Verification Failed</h3>
                                <p>{verificationStatus.errorMessage}</p>
                                <div className="alert alert-danger" role="alert">
                                    {verificationStatus.errorMessage}
                                </div>
                                <p className="mt-3">
                                    <small className="text-muted">
                                        You will be redirected to the login page shortly, or you can{" "}
                                        <button 
                                            className="btn btn-link p-0" 
                                            onClick={() => navigate("/Login")}
                                            style={{ textDecoration: 'underline' }}
                                        >
                                            click here to go to login
                                        </button>
                                    </small>
                                </p>
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
