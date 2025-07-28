import React, { useState } from "react";
import { Helmet } from "react-helmet";
import TestHomeHeader from '../../TestHomeHeader';
import { Link, useNavigate } from "react-router-dom";

import Footer from '../../Footer';

import './About.css';

const ITRecruitment = () => {
    const canonicalUrl = window.location.href; 
    const navigate = useNavigate(); 

    return (
        <>
        <Helmet>
            <link rel="canonical" href={canonicalUrl} />
            <title>Information Technology Recruitment | ProsoftSynergies </title>
            <meta
                name="description"
                content="ProsoftSynergies Information Technology Recruitment, One of the Leading Global Job Platform Connecting Employers and Job Seekers Across Canada, the US, and India. Secure Access To Your Account and Explore Endless Career Opportunities."
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
                        <h1>Information Technology Recruitment</h1>
                        <p>
                            Whether you need to fill temporary or permanent positions, we can assist you in building your team across a diverse array of industries.
                        </p>
                        <div className="action-buttons">
                            <Link to="/Test-Add-Job" className="btn-primary">Submit A Vacancy</Link>
                            <Link to="/Contact-Us" className="btn-outline">Contact Us</Link>
                        </div>
                    </div>
                </div>
                <div className="about-us-image">
                    <img
                        src="https://images.pexels.com/photos/7691767/pexels-photo-7691767.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" // Replace with your actual image URL
                        alt="Information Technology Recruitment"
                    />
                </div>
            </div>
        </section>
        <Footer />  
        </>
    );
};

export default ITRecruitment;
