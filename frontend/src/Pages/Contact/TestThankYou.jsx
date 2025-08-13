import React, { useState } from "react";
import { Helmet } from "react-helmet";
import TestHomeHeader from '../TestHomeHeader';
import { Link, useNavigate } from "react-router-dom";

import API from "../../helpers/API";
import Footer from '../Footer';

import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import './About.css';
import './OurLocations.css';

const TestThankYou = () => {
    const canonicalUrl = window.location.href; 

    const notifyErr = (msg) => {
        toast.error(msg, {
          position: "top-center",
          autoClose: 20000,
          closeOnClick: true,
          pauseOnHover: true,
          theme: "light"
        });
    };
      
    const notifySucc = (msg) => {
        toast.success(msg, {
          position: "top-center",
          autoClose: 20000,
          closeOnClick: true,
          pauseOnHover: true,
          theme: "light"
        });
    }; 
    
    return (
        <>
        <Helmet>
            <link rel="canonical" href={canonicalUrl} />
            <title>Thank You For Contacting Us | ThinkBeyond</title>
            <meta
            name="description"
            content="Thank You For Reaching Out To ThinkBeyond! We're Excited to Connect with You. As a Leading Job Portal with Offices in Canada, the US, and India, We're Here to Support Your Career Journey."
            />
        </Helmet>
        <TestHomeHeader />
        <section className="about-us-section">
            <div className="about-us-container">
                <div className="about-us-text">
                    <h1>Thank You</h1>
                </div>
                <div className="about-us-image">
                    <img
                        src="https://images.pexels.com/photos/887751/pexels-photo-887751.jpeg?auto=compress&cs=tinysrgb&w=800" // Replace with your actual image URL
                        alt="Thank You"
                    />
                </div>
            </div>
        </section>
            <div className="containerLocations">
                <div className="inner-container">
                    <div className="content-wrapper">
                        <div className="full-width-column">
                            <div className="content-container">  
                                <div className="form-container">
                                    <div className="row">
                                        <div className="col-md-8 mx-auto">
                                            <div className="mx-auto pb-5 wow fadeIn" data-wow-delay=".3s">
                                                <h2 className="main-heading mb-3">
                                                    <span className="red-text">Thank you for getting in touch!</span>
                                                </h2>
                                                <p style={{fontSize: "20px"}}>
                                                    One of our team members will get back to you shortly.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                    </div>
                </div>
            </div>
        </div>
        <Footer />  
        </>
    );
};

export default TestThankYou;