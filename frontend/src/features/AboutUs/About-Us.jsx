import ChangePageTitle from "../../utils/ChangePageTitle";
import React, { Component, useRef, useEffect, useState } from "react";
import { NavLink, Link } from "react-router-dom";

import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';


const About = () => {

    return (
        <>
        <Header />
        <ChangePageTitle customPageTitle="About Us | ProfostSynergies" />
        {/* <!-- Header End --> */}
        <div className="container-fliud py-5 bg-dark page-header-about-us mb-5">
            <div className="container my-5 pt-5 pb-4">
                <h1 className="display-3 text-white mb-3 animated slideInDown">About Us</h1>
                <nav aria-label="breadcrumb">
                    <ol className="breadcrumb text-uppercase">
                        <li className="breadcrumb-item"><Link to="/">Home</Link></li>
                        <li className="breadcrumb-item text-white active" aria-current="page">About Us</li>
                    </ol>
                </nav>
            </div>
        </div>
        {/* <!-- Header End --> */}

        <div className="container-xxl py-5">
            <div className="container">
                <div className="row g-5 align-items-center">
                    
                   <div className="col-lg-6 wow fadeIn" data-wow-delay="0.5s">
                    <h1 className="mb-4">Empowering Careers, Building Futures: Your Partner in Talent Acquisition and Job Placement.</h1>
                    <p className="mb-4">
                        At ProSoft Recruiting Private Limited, headquartered in India with strategic branch offices in Canada and the USA, we are more than just a recruitment agency – we are your dedicated partners in achieving your professional and organizational goals. Our passionate and experienced team is committed to connecting exceptional talent with outstanding opportunities across diverse industries.
                    </p>
                    <p className="mb-4">
                        Whether you are a job seeker aiming to secure your dream role or an employer seeking to build a high-performing team, we offer tailored HR solutions designed to meet your unique needs. Our deep understanding of the local markets in India, Canada, and the US, combined with our global perspective, allows us to deliver unparalleled results.
                    </p>
                    <p>
                        <i className="fa fa-check text-primary me-3"></i>
                        **For Job Seekers:** We go beyond simply matching resumes to job descriptions. We take the time to understand your skills, aspirations, and career ambitions to connect you with the finest employment opportunities where you can thrive.
                    </p>
                    <p><i className="fa fa-check text-primary me-3"></i>
                        **For Employers:** We excel at discovering exceptional talent that aligns with your company culture and drives your business forward. Our profound connection to local talent pools and strategic sourcing methodologies ensure you have access to the best candidates.
                    </p>
                    <p><i className="fa fa-check text-primary me-3"></i>
                        **Local Expertise, Global Reach:** Our teams in India, Canada, and the USA possess an in-depth understanding of their respective job markets, enabling us to facilitate seamless connections between candidates and employers on a daily basis.
                    </p>
                    <Link className="btn btn-primary py-3 px-5 mt-3" to="/Browse-Jobs">Explore Opportunities</Link>
                </div>
                <div className="col-lg-6 wow fadeIn" data-wow-delay="0.1s">
                    <div className="row g-0 about-bg rounded overflow-hidden">
                        <div className="col-6 text-start">
                            <img className="img-fluid w-100" src="../assets/img/about-us/about-us-1.jpg" alt="Team Collaboration" />
                        </div>
                        <div className="col-6 text-start">
                            <img className="img-fluid" src="../assets/img/about-us/about-us-2.jpg" style={{width:" 85%", marginTop: "15%"}} alt="Successful Placement" />
                        </div>
                        <div className="col-6 text-end">
                            <img className="img-fluid" src="../assets/img/about-us/about-us-3.jpg" style={{width: "85%"}} alt="Industry Expertise" />
                        </div>
                        <div className="col-6 text-end">
                            <img className="img-fluid w-100" src="../assets/img/about-us/about-us-4.jpg" alt="Global Network" />
                        </div>
                    </div>
                    <p className="mb-4 mt-5">
                        **How can ProSoft Recruiting benefit you?** We simplify the complexities of talent acquisition and job searching. Whether you're seeking a finance role, exploring part-time positions, or aiming to build a dynamic team, our extensive network, industry expertise, and commitment to understanding your unique needs empower us to make the right connections happen. We are here to assist you in navigating the job market and securing the talent that will drive your success.
                    </p>
                </div>
                </div>
            </div>
        </div>

        <Footer />
        </>
    );
}; 


export default About;
