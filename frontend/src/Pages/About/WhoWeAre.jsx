import React from "react";
import { Helmet } from "react-helmet";
import TestHomeHeader from '../TestHomeHeader';
import Footer from '../Footer';
import './Responsive.css';
import './About.css';


const WhoWeAre = () => {
    const canonicalUrl = window.location.href; 

    return (
        <>
        <Helmet>
            <link rel="canonical" href={canonicalUrl} />
            <title>We're ProSoft | ProsoftSynergies </title>
            <meta
                name="description"
                content="Who We're? We're One of the Leading Global Job Platform Connecting Employers and Job Seekers Across Canada, the US, and India. Secure Access To Your Account and Explore Endless Career Opportunities."
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
                    <h1>We're ProSoft</h1>
                </div>
                <div className="about-us-image">
                    <img
                        src="https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" 
                        alt="Who We Are"
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
                                            src="https://images.pexels.com/photos/31454218/pexels-photo-31454218/free-photo-of-professional-man-working-on-laptop-in-office.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" 
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
                                    </div>
                                </div>
                            </div>
                            <div className="about-description">
                                <div className="about-description-content">
                                    <div>
                                        <p>
                                            We assist Job-Seeker in securing the finest employment opportunities and discovering exceptional talents. Our consultancy's commitment to operating with integrity, maintaining confidentiality, and adhering to the highest ethical standards in all aspects of the recruitment process is exemplified by our Ethical and Professional Standards.
                                        </p>
                                        <p>
                                            Our extensive portfolio includes flexible and permanent employment solutions, upskilling and reskilling programs, and IT consulting services. We collaborate with organizations to refine business strategies and deliver solutions that align with their unique objectives.
                                        </p>
                                        <p>
                                            Leveraging our scale, cutting-edge technology, and industry expertise, we offer a competitive advantage. Our holistic approach addresses all workforce needs, ensuring sustainable growth and success for our clients.
                                        </p>
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

export default WhoWeAre;
