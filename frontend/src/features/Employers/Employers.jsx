import ChangePageTitle from "../../utils/ChangePageTitle";
import React, { Component, useRef, useEffect, useState } from "react";
import { NavLink, Link } from "react-router-dom";

import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';

const Employers = () => {

    return (
        <>
            <Header />
            <ChangePageTitle customPageTitle="Great Partner, Great Solution | ProfostSynergies" />
            {/* <!-- Header End --> */}
            <div className="container-fliud py-5 bg-dark page-header-employers mb-5">
                <div className="container my-5 pt-5 pb-4">
                    <h1 className="display-3 text-white mb-3 animated slideInDown">How We Operate</h1>
                    <nav aria-label="breadcrumb">
                        <ol className="breadcrumb text-uppercase">
                            <li className="breadcrumb-item"><Link to="/">Home</Link></li>
                            <li className="breadcrumb-item text-white active" aria-current="page">For Employers</li>
                        </ol>
                    </nav>
                </div>
            </div>
            {/* <!-- Header End --> */}
            <div className="container-xxl py-5">
                <div className="container">
                    <div className="row g-5 align-items-center">
                        <div className="col-lg-5 wow fadeIn" data-wow-delay="0.1s">
                            <div className="row g-0 about-bg rounded overflow-hidden">
                                <div className="col-6 text-start">
                                    <img className="img-fluid w-100" src="../assets/img/employers/employer-1.jpg" />
                                </div>
                                <div className="col-6 text-start">
                                    <img className="img-fluid" src="../assets/img/employers/employer-2.jpg" style={{width:" 85%", marginTop: "15%"}} />
                                </div>
                                <div className="col-6 text-end">
                                    <img className="img-fluid" src="../assets/img/employers/employer-3.jpg" style={{width: "85%"}} />
                                </div>
                                <div className="col-6 text-end">
                                    <img className="img-fluid w-100" src="../assets/img/employers/employer-4.jpg" />
                                </div>
                            </div>
                            <p className="mt-5">
                                Our ability to adapt to the ever-changing world of work sets us apart. With our innovative, dynamic, and efficient solutions, we stay ahead of the curve, transforming disruption into a clear direction and leveraging evolution to our advantage.
                            </p>
                            <p className="">
                                However, our brands do not operate independently, and our clients gain advantages from the comprehensive range of our knowledge, understanding, and inventive strategy towards talent management.
                            </p>
                            <p className="">
                                Our platform features a vast and diverse selection of job openings. Whether you're seeking entry-level positions, mid-career opportunities, or executive roles, we have a wide range of options to suit your experience and ambitions. Stay informed about the latest job opportunities that match your preferences with our personalized job alert feature. Receive email notifications based on your chosen criteria, ensuring you never miss out on relevant openings.
                            </p>
                        </div>
                        <div className="col-lg-7 wow fadeIn" data-wow-delay="0.5s">
                            <h1 className="mb-4">
                                Great Partner, Great Solution.                                
                            </h1>
                            <p className="">
                                Our comprehensive service encompasses the entire recruitment process, including candidate sourcing, CV screening, conducting interviews and assessments, and providing guidance to hiring managers, all aimed at assisting organizations in securing top-tier talent.
                            </p>
                            <p className="">
                                We strive to discover methods that promote optimal practices and develop innovative solutions to the challenges associated with adapting to a fast-paced, dynamic environment. With our extensive industry experience and vibrant presence, we are the preferred partner for our clients in providing skilled and qualified individuals to meet the evolving demands of businesses today which include;
                            </p>
                            <p>
                            <i className="fa fa-check text-primary me-3"></i>
                                Permanent Recruitment Solutions
                            </p>
                            <p>
                            <i className="fa fa-check text-primary me-3"></i>
                                Individual Evaluation.
                            </p>
                            <p>
                            <i className="fa fa-check text-primary me-3"></i>
                                Candidate Shortlisting
                            </p>
                            <p className="mt-5">
                                We offer an extensive range of HR solutions in the industry, encompassing essential, dynamic, and effective solutions in Canada, the United States, and India. We've designed our website to provide a seamless and intuitive user experience. Our user-friendly interface allows you to easily search for jobs, filter by location or industry, and access detailed job descriptions, making it effortless to find positions that match your interests and qualifications. 
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </>
    );
}; 


export default Employers;