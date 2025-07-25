import ChangePageTitle from "../../../utils/ChangePageTitle";
import React, { Component, useRef, useEffect, useState } from "react";
import { NavLink, Link } from "react-router-dom";

import Header from '../../../components/Header/Header';
import Footer from '../../../components/Footer/Footer';


const OurMission = () => {

    return (
        <>
        <Header />
        <ChangePageTitle customPageTitle="Who We Are | ProfostSynergies" />
        {/* <!-- Header End --> */}
        <div className="container-fliud py-5 bg-dark page-header-our-mission mb-5">
            <div className="container my-5 pt-5 pb-4">
                <h1 className="display-3 text-white mb-3 animated slideInDown">Our Mission</h1>
                <nav aria-label="breadcrumb">
                    <ol className="breadcrumb text-uppercase">
                        <li className="breadcrumb-item"><Link to="/About-Us">About Us</Link></li>
                        <li className="breadcrumb-item text-white active" aria-current="page">Our Mission</li>
                    </ol>
                </nav>
            </div>
        </div>
        {/* <!-- Header End --> */}

        <div className="container-xxl py-5">
            <div className="container">
                <div className="row g-5 align-items-center">
                    
                    <div className="col-lg-6 wow fadeIn" data-wow-delay="0.5s">
                        <h1 className="mb-4">
                            Our objective is to offer top-notch service in order to revolutionize the IT industry and provide clients with exceptional services that instill trust and respect.
                        </h1>
                        <p className="mb-4">
                            We are a prominent HR solutions specialist which include Canada, US and India. Our team consists of dedicated and passionate individuals who are committed to assisting you in recruiting exceptional talent and discovering remarkable job opportunities.
                        </p>
                        <p className="mb-4">
                        Finding the right job, environment and culture for talent and customers is more important than ever in today's business world. We  have a responsibility to make our customers competitive in their business and our employees work day and night. No one has the     time to review dozens of resumes or wait weeks for an interview. Think Beyond is created by Innovators, Collaborators and Connectors. Our team has an average of 10 years of experience and unmatched experience in quickly finding the best talent.                        
                        </p>
                        <p className="mb-4">
                            The way people work is changing. Between new technologies, new opportunities and the rise of the resilient economy, the demand  for the right skills is at an all-time high. This is where Think Beyond comes into play.
                        </p>
                        <p className="mb-4">
                            Our skilled team maintains strong ties to the local community, enabling them to comprehend the needs of both individuals and the market. They actively engage in facilitating connections between job seekers and employment opportunities, ensuring a productive and thriving workforce.
                        </p>
                    </div>
                    <div className="col-lg-6 wow fadeIn" data-wow-delay="0.1s">
                        <div className="row g-0 about-bg rounded overflow-hidden">
                            <div className="col-6 text-start">
                                <img className="img-fluid w-100" src="../assets/img/about-us/about-us-1.jpg" />
                            </div>
                            <div className="col-6 text-start">
                                <img className="img-fluid" src="../assets/img/about-us/about-us-2.jpg" style={{width:" 85%", marginTop: "15%"}} />
                            </div>
                            <div className="col-6 text-end">
                                <img className="img-fluid" src="../assets/img/about-us/about-us-3.jpg" style={{width: "85%"}} />
                            </div>
                            <div className="col-6 text-end">
                                <img className="img-fluid w-100" src="../assets/img/about-us/about-us-4.jpg" />
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


export default OurMission;