import ChangePageTitle from "../../../utils/ChangePageTitle";
import React, { Component, useRef, useEffect, useState } from "react";
import { NavLink, Link } from "react-router-dom";

import Header from '../../../components/Header/Header';
import Footer from '../../../components/Footer/Footer';


const OurVision = () => {

    return (
        <>
        <Header />
        <ChangePageTitle customPageTitle="We're Committed | ProfostSynergies" />
        {/* <!-- Header End --> */}
        <div className="container-fliud py-5 bg-dark page-header-our-vision mb-5">
            <div className="container my-5 pt-5 pb-4">
                <h1 className="display-3 text-white mb-3 animated slideInDown">Our Vision</h1>
                <nav aria-label="breadcrumb">
                    <ol className="breadcrumb text-uppercase">
                        <li className="breadcrumb-item"><Link to="/About-Us">About Us</Link></li>
                        <li className="breadcrumb-item text-white active" aria-current="page">Our Vision</li>
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
                            We place a greater emphasis on the significance of cultivating enduring partnerships and delivering tailor-made solutions.
                        </h1>
                        <p className="mb-4">
                            Our consultancy's commitment to operating with integrity, maintaining confidentiality, and adhering to the highest ethical standards in all aspects of the recruitment process is exemplified by our Ethical and Professional Standards.
                        </p>
                        <p className="mb-4">
                            These standards underscore the significance of building trust and fostering positive relationships with both clients and candidates, ensuring that we prioritize their needs and interests above all else.
                        </p>
                        <p>
                            <i className="fa fa-check text-primary me-3"></i>
                            Our Vision is to Achieve Excellence: We are fully committed to providing exceptional recruitment services. We prioritize identifying exceptional candidates who possess the necessary skills, experience, and cultural alignment to propel business growth.
                        </p>
                        <p>
                            <i className="fa fa-check text-primary me-3"></i>
                            Establish the consultancy as a strategic ally for enterprises, collaborating closely with clients to comprehend their distinct requirements, objectives, and organizational values. Highlight the significance of fostering enduring connections and delivering tailor-made resolutions.
                        </p>
                        <p>
                            <i className="fa fa-check text-primary me-3"></i>
                            The consultancy prides itself on its innovation and adaptability, always staying one step ahead of emerging trends and technologies in the recruitment industry. We are dedicated to continuous learning, utilizing cutting-edge tools, and embracing new methodologies to deliver the best possible results for our clients.
                        </p>
                    </div>
                    <div className="col-lg-6 wow fadeIn" data-wow-delay="0.1s">
                        <div className="row g-0 about-bg rounded overflow-hidden">
                            <div className="col-6 text-start">
                                <img className="img-fluid w-100" src="../../assets/img/about-us/about-us-1.jpg" />
                            </div>
                            <div className="col-6 text-start">
                                <img className="img-fluid" src="../../assets/img/about-us/about-us-2.jpg" style={{width:" 85%", marginTop: "15%"}} />
                            </div>
                            <div className="col-6 text-end">
                                <img className="img-fluid" src="../../assets/img/about-us/about-us-3.jpg" style={{width: "85%"}} />
                            </div>
                            <div className="col-6 text-end">
                                <img className="img-fluid w-100" src="../../assets/img/about-us/about-us-4.jpg" />
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


export default OurVision;