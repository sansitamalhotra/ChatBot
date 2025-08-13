import React from "react";
import { Helmet } from "react-helmet";

import TestHomeHeader from '../TestHomeHeader';
import Footer from '../Footer';


import '../Home.css';
import './AboutResponsive.css';
import './About.css';


const TestAboutUs = () => {
    const canonicalUrl = window.location.href; // Get the current URL

    return (
        <>
        <Helmet>
            <link rel="canonical" href={canonicalUrl} />
            <title>About Us | ProsoftSynergies </title>
            <meta
                name="description"
                content="About Us, One of the Leading Global Job Platform Connecting Employers and Job Seekers Across Canada, the US, and India. Secure Access To Your Account and Explore Endless Career Opportunities."
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
                    <h1>About Us</h1>
                </div>
                <div className="about-us-image">
                    <img
                        src="https://images.pexels.com/photos/7688435/pexels-photo-7688435.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" // Replace with your actual image URL
                        alt="Team meeting presentation"
                    />
                </div>
            </div>
        </section>
        <div className="about-content-section">
            <div className="about-content-container">
                <div className="about-content-wrapper">
                    <div className="about-image-column">
                        <div className="about-image-wrapper">
                            <div className="about-image-content">
                                <div>
                                    <div className="whoweareimg">
                                        <img 
                                            fetchpriority="high" 
                                            decoding="async" 
                                            src="https://images.pexels.com/photos/7875898/pexels-photo-7875898.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" 
                                            alt="ProsoftSynergies" 
                                            title="ProsoftSynergies" 
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="about-text-column">
                        <div className="about-text-wrapper">
                            <div className="about-title-wrapper">
                                <div>
                                    <div className="who-we-are-container">
                                        <div className="who-we-are-left-text">We're</div>
                                        <div className="who-we-are-divider"></div>
                                            <div className="who-we-are-right-text">ProSoft</div>
                                            <small><i>Empowering Careers, Building Futures: Your Partner in Talent Acquisition and Job Placement.</i></small>
                                    </div>
                                </div>
                            </div>
                            <div className="about-description">
                                <div className="about-description-content">
                                    <div>
                                        <p>
                                            Welcome to ProSoft Synergies Private Limited, a premier recruitment consultancy with Offices in India with strategic branch offices in Canada and the USA, we are more than just a recruitment agency – we are your dedicated partners in achieving your professional and organizational goals. Our passionate and experienced team is committed to connecting exceptional talent with outstanding opportunities across diverse industries.
                                        </p>
                                        <p>
                                            ProSoft Recruiting is more than just a recruitment agency—it’s a dedicated team of passionate professionals committed to excellence. Our experts bring deep insights into regional job markets, ensuring that both employers and job seekers benefit from personalized guidance and strategic matchmaking.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <section className="job-section resp-job-section mb-5">
            <div className="job-container resp-job-container">
                <div className="job-text resp-job-text">
                    <h1>Searching For A Job?</h1>
                    <p>
                        Whether you are a job seeker aiming to secure your dream role or an employer seeking to build a high-performing team, we offer tailored HR solutions designed to meet your unique needs. Our deep understanding of the local markets in India, Canada, and the US, combined with our global perspective, allows us to deliver unparalleled results.
                    </p>
                    <p>
                        <i className="fa fa-check text-primary me-3"></i>
                        <b>For Job Seekers:</b><br />
                        We go beyond simply matching resumes to job descriptions. We take the time to understand your skills, aspirations, and career ambitions to connect you with the finest employment opportunities where you can thrive.
                    </p>
                </div>
                <div className="job-image resp-job-image">
                    <img
                        src="https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" alt="ProSoft Job-Seekers"
                    />
                </div>
            </div>
        </section>   
        <div data-node="zr5pxsuj03ql" className="sectionServices">
            <div className="containerServices">
                <div className="maxWidthContainer">
                    <div className="columnContainer">
                        <div data-node="ngrbtyle87v2" className="columnServices">
                            <div className="innerColumn">
                                <div data-node="qj8b7n5cd014" className="columnContainer">
                                    <div className="imageContainer">
                                        <div itemscope="" itemtype="https://schema.org/ImageObject" className="imageWrapper">
                                            <div className="imageInnerWrapper">
                                                <img
                                                decoding="async"
                                                src="https://cdn-01.cms-ap-v2i.applyflow.com/adecco-australia/wp-content/uploads/2023/10/ADO_icon_web__60-countries-1.svg"
                                                alt="ADO_icon_web__60 countries 1"
                                                itemprop="image"
                                                height="46"
                                                width="39"
                                                title="ADO_icon_web__60 countries 1"
                                                data-lazy-src="https://cdn-01.cms-ap-v2i.applyflow.com/adecco-australia/wp-content/uploads/2023/10/ADO_icon_web__60-countries-1.svg"
                                                data-ll-status="loaded"
                                                className="imageServices"
                                                />
                                                <noscript className="noScriptServices">
                                                <img
                                                    decoding="async"
                                                    className="fl-photo-img wp-image-14247 size-full"
                                                    src="https://cdn-01.cms-ap-v2i.applyflow.com/adecco-australia/wp-content/uploads/2023/10/ADO_icon_web__60-countries-1.svg"
                                                    alt="ADO_icon_web__60 countries 1"
                                                    itemprop="image"
                                                    height="46"
                                                    width="39"
                                                    title="ADO_icon_web__60 countries 1"
                                                />
                                                </noscript>
                                        </div>
                                    </div>
                                </div>
                            </div>
                                <div data-node="27chvtfxpinj" className="textContainerRed">
                                        <div className="headingContainer">
                                            <h4 className="headingServices">
                                            <span className="headingSpan">A Global Presence</span>
                                            </h4>
                                        </div>
                                </div>
                                <div data-node="oxyc0f5bkj4z" className="textContainerGray">
                                    <div className="paragraphContainer">
                                        <div className="paragraphServices">
                                        <p className="paragraphText">
                                            We excel in connecting individuals with employment opportunities. Our extensive global reach and deep knowledge of international job markets position us as the ideal choice for your job search.
                                        </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Repeat the above structure for other columns as needed */}
                        <div data-node="ngrbtyle87v2" className="columnServices">
                            <div className="innerColumn">
                                <div data-node="qj8b7n5cd014" className="columnContainer">
                                    <div className="imageContainer">
                                        <div itemscope="" itemtype="https://schema.org/ImageObject" className="imageWrapper">
                                            <div className="imageInnerWrapper">
                                                
                                                <img decoding="async" className="imageServices" src="https://cdn-01.cms-ap-v2i.applyflow.com/adecco-australia/wp-content/uploads/2023/10/ADO_icon_web__Custom-outsourcing-solutions-1-1.svg" alt="ADO_icon_web__Custom outsourcing solutions (1) 1" itemprop="image" height="40" width="47" title="ADO_icon_web__Custom outsourcing solutions (1) 1" data-lazy-src="https://cdn-01.cms-ap-v2i.applyflow.com/adecco-australia/wp-content/uploads/2023/10/ADO_icon_web__Custom-outsourcing-solutions-1-1.svg" data-ll-status="loaded" />
                                                <noscript className="noScriptServices">
                                                <img
                                                    decoding="async"
                                                    className="fl-photo-img wp-image-14247 size-full"
                                                    src="https://cdn-01.cms-ap-v2i.applyflow.com/adecco-australia/wp-content/uploads/2023/10/ADO_icon_web__60-countries-1.svg"
                                                    alt="ADO_icon_web__60 countries 1"
                                                    itemprop="image"
                                                    height="46"
                                                    width="39"
                                                    title="ADO_icon_web__60 countries 1"
                                                />
                                                </noscript>
                                        </div>
                                    </div>
                                </div>
                            </div>
                                <div data-node="27chvtfxpinj" className="textContainerRed">
                                        <div className="headingContainer">
                                            <h4 className="headingServices">
                                                <span className="headingSpan">Personal Service</span>
                                            </h4>
                                        </div>
                                </div>
                                <div data-node="oxyc0f5bkj4z" className="textContainerGray">
                                    <div className="paragraphContainer">
                                        <div className="paragraphServices">
                                        <p className="paragraphText">
                                            ProsoftSynergies has a strong track record of successfully matching talented individuals with excellent job opportunities. We are here to assist you in discovering what you seek.
                                        </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div data-node="ngrbtyle87v2" className="columnServices">
                            <div className="innerColumn">
                                <div data-node="qj8b7n5cd014" className="columnContainer">
                                    <div className="imageContainer">
                                        <div itemscope="" itemtype="https://schema.org/ImageObject" className="imageWrapper">
                                            <div className="imageInnerWrapper">
                                                
                                                <img decoding="async" className="imageServices" src="https://cdn-01.cms-ap-v2i.applyflow.com/adecco-australia/wp-content/uploads/2023/10/ADO_icon_web__Innovative-technology-1.svg" alt="ADO_icon_web__Innovative technology 1" itemprop="image" height="45" width="46" title="ADO_icon_web__Innovative technology 1" data-lazy-src="https://cdn-01.cms-ap-v2i.applyflow.com/adecco-australia/wp-content/uploads/2023/10/ADO_icon_web__Innovative-technology-1.svg" data-ll-status="loaded" />
                                                <noscript className="noScriptServices">
                                                <img
                                                    decoding="async"
                                                    className="fl-photo-img wp-image-14247 size-full"
                                                    src="https://cdn-01.cms-ap-v2i.applyflow.com/adecco-australia/wp-content/uploads/2023/10/ADO_icon_web__60-countries-1.svg"
                                                    alt="ADO_icon_web__60 countries 1"
                                                    itemprop="image"
                                                    height="46"
                                                    width="39"
                                                    title="ADO_icon_web__60 countries 1"
                                                />
                                                </noscript>
                                        </div>
                                    </div>
                                </div>
                            </div>
                                <div data-node="27chvtfxpinj" className="textContainerRed">
                                        <div className="headingContainer">
                                            <h4 className="headingServices">
                                            <span className="headingSpan">Local Knowledge</span>
                                            </h4>
                                        </div>
                                </div>
                                <div data-node="oxyc0f5bkj4z" className="textContainerGray">
                                    <div className="paragraphContainer">
                                        <div className="paragraphServices">
                                        <p className="paragraphText">
                                            Our offices are situated in the countries where we conduct business to provide you with assistance. No matter where you are, we are committed to supporting you.
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
        <section className="rev-job-section resp-rev-job-section mb-5">
            <div className="rev-job-container resp-rev-job-container">
                <div className="rev-job-image resp-rev-job-image">
                    <img
                        src="https://images.pexels.com/photos/5989928/pexels-photo-5989928.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" alt="ProSoft Employers"
                    />
                </div>
                <div className="rev-job-text resp-rev-job-text">
                    <h1>Looking For Top Talents?</h1>
                    <p>
                        We simplify the complexities of talent acquisition and job searching. Whether you're seeking a finance role, exploring part-time positions, or aiming to build a dynamic team, our extensive network, industry expertise, and commitment to understanding your unique needs empower us to make the right connections happen. We are here to assist you in navigating the job market and securing the talent that will drive your success.
                    </p>
                    <p>
                        <i className="fa fa-check text-primary me-3"></i>
                        <b>For Employers:</b><br />
                        We excel at discovering exceptional talent that aligns with your company culture and drives your business forward. Our profound connection to local talent pools and strategic sourcing methodologies ensure you have access to the best candidates.
                    </p>
                    <p><i className="fa fa-check text-primary me-3"></i>
                        <b>Local Expertise, Global Reach:</b><br /> Our teams in India, Canada, and the USA possess an in-depth understanding of their respective job markets, enabling us to facilitate seamless connections between candidates and employers on a daily basis.
                    </p>
                </div>
            </div>
        </section>
        <Footer />  
        </>
    )
};
export default TestAboutUs;
