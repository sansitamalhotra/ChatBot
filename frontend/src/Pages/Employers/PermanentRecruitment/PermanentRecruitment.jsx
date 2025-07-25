import React, { useState } from "react";
import { Helmet } from "react-helmet";
import TestHomeHeader from '../../TestHomeHeader';
import { Link, useNavigate } from "react-router-dom";

import Footer from '../../Footer';

import './About.css';

const PermanentRecruitment = () => {
    const canonicalUrl = window.location.href; 
    const navigate = useNavigate(); 

    return (
        <>
        <Helmet>
            <link rel="canonical" href={canonicalUrl} />
            <title>Permanent Hiring Solutions | ThinkBeyond </title>
            <meta
                name="description"
                content="Permanent Hiring Solutions, One of the Leading Global Job Platform Connecting Employers and Job Seekers Across Canada, the US, and India. Secure Access To Your Account and Explore Endless Career Opportunities."
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
                        <h1>Permanent Hiring Solutions</h1>
                        <p>
                            We manage the complete recruitment process, which includes sourcing candidates, reviewing CVs, conducting interviews and assessments, and providing guidance to organizations on attracting top permanent talent. Whether it's traditional permanent recruitment or large-scale hiring, ThinkBeyond serves as a reliable partner for thousands of businesses on a daily basis.
                        </p>
                        <div className="action-buttons">
                            <Link to="/submit-vacancy" className="btn-primary">Submit a vacancy</Link>
                            <Link to="/contact" className="btn-outline">Contact us</Link>
                        </div>
                    </div>
                </div>
                <div className="about-us-image">
                    <img
                        src="https://images.pexels.com/photos/7643735/pexels-photo-7643735.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" // Replace with your actual image URL
                        alt="Permanent Hiring Solutions"
                    />
                </div>
            </div>
        </section>
        <Footer />  
        </>
    );
};

export default PermanentRecruitment;