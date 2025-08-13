import React, { useState } from "react";
import { Helmet } from "react-helmet";
import TestHomeHeader from '../../TestHomeHeader';
import { Link, useNavigate } from "react-router-dom";

import Footer from '../../Footer';

import './About.css';

const FluidWorkforce = () => {
    const canonicalUrl = window.location.href; 
    const navigate = useNavigate(); 

    return (
        <>
        <Helmet>
            <link rel="canonical" href={canonicalUrl} />
            <title>Fluid Workforce Solutions | ThinkBeyond </title>
            <meta
                name="description"
                content="Fluid Workforces, One of the Leading Global Job Platform Connecting Employers and Job Seekers Across Canada, the US, and India. Secure Access To Your Account and Explore Endless Career Opportunities."
            />
            <meta
                name="keywords"
                content="ThinkBeyond Website, Job Portal, Login, Sign In, Job Search, Career Opportunities, Canada jobs, US Jobs, India Jobs, Employment, Job Seekers, Employer Login"
            />
            <meta name="author" content="ThinkBeyond" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        <TestHomeHeader />
        <section className="about-us-section">
            <div className="about-us-container">
                <div className="about-us-text">
                    <div className="text-content">
                        <h1>Fluid Workforce SOlutions</h1>
                        <p>
                             We offer temporary staffing solutions by placing associates in your organization, allowing you to maintain flexibility. Our services encompass the complete recruitment process, including candidate sourcing, screening, onboarding, training, payroll, and administrative tasks.
                        </p>
                        <div className="action-buttons">
                            <Link to="/submit-vacancy" className="btn-primary">Submit a vacancy</Link>
                            <Link to="/contact" className="btn-outline">Contact us</Link>
                        </div>
                    </div>
                </div>
                <div className="about-us-image">
                    <img
                        src="https://images.pexels.com/photos/8127703/pexels-photo-8127703.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" // Replace with your actual image URL
                        alt="Fluid Workforce Solutions"
                    />
                </div>
            </div>
        </section>
        <Footer />  
        </>
    );
};

export default FluidWorkforce;