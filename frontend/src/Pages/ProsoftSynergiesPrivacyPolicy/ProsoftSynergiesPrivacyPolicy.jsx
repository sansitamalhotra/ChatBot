import React from "react";
import { Helmet } from "react-helmet";
import TestHomeHeader from '../TestHomeHeader';

import Footer from '../Footer';

import './PrivacyPolicy.css';

const ProsoftSynergiesPrivacyPolicy = () => {
    const canonicalUrl = window.location.href; 

    return (
        <>
        <Helmet>
            <link rel="canonical" href={canonicalUrl} />
            <title>Privacy Policy | ProsoftSynergies </title>
            <meta
                name="description"
                content="ProsoftSynergies Privacy Policy, One of the Leading Global Job Platform Connecting Employers and Job Seekers Across Canada, the US, and India. Secure Access To Your Account and Explore Endless Career Opportunities."
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
                        <h1>ProsoftSynergies Privacy Policy</h1>
                        <p>
                            Your data is handled in accordance with applicable laws and regulations, ensuring confidentiality and integrity. 
                        </p>
                        {/* <div className="action-buttons">
                            <Link to="/submit-vacancy" className="btn-primary">Submit a vacancy</Link>
                            <Link to="/contact" className="btn-outline">Contact us</Link>
                        </div> */}
                    </div>
                </div>
                <div className="about-us-image">
                    <img
                        src="https://images.pexels.com/photos/4152513/pexels-photo-4152513.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" // Replace with your actual image URL
                        alt="ProsoftSynergies Privacy Policy"
                    />
                </div>
            </div>
        </section>
        <section id="content" className="clearfix mb-5">
            <div id="general-content-124" className="container ">
                <div className="d-flex flex-wrap">
                    <div class="col-12 col-lg-11 col-md-7">
                    <article class="clearfix">
                        <h1 className="text-mute mt-5">
                            <br />
                            <b>
                                This Privacy Policy describes how The Think Beyond ("we," "us," or "our") collects, uses, and shares personal information of users of our website, prosoftsynergies.com (the "Site"). 
                            </b>
                        </h1>
                        <br />
                        <p></p>
                        <h1><b>Information We Collect</b></h1>
                        <p>We may collect the following types of information:</p>
                        <div className="d-flex flex-column">
                            <li className="d-flex align-items-center py-2">
                                <span class="bullet bullet-dot me-5"></span>
                                Personal Information: This includes information that can be used to identify you, such as your name, email address, postal address, phone number, and any other information you voluntarily submit through forms on our Site (e.g., contact forms, newsletter sign-ups, registration forms).
                            </li>
                            <li className="d-flex align-items-center py-2">
                                <span class="bullet bullet-dot me-5"></span>
                                Log Data: Our servers automatically record information ("Log Data") created by your use of the Site. Log Data may include information such as your IP address, browser type, referring URL, pages visited, and search terms.
                            </li>
                            <li className="d-flex align-items-center py-2">
                                <span class="bullet bullet-dot me-5"></span>
                                Cookies and Similar Technologies: We may use cookies, web beacons, and other similar technologies to collect information about your browsing activity on our Site. This helps us to improve your experience and understand how our Site is being used. You can control cookies through your browser settings.
                            </li>
                        </div>
                        <br />
                        <p></p>
                        <h1><b>How We Use Your Information</b></h1>
                        <p>We may use your information for the following purposes:</p>
                        <div className="d-flex flex-column">
                            <li className="d-flex align-items-center py-2">
                                <span class="bullet bullet-dot me-5"></span>
                                To Provide and Improve the Site: To operate, maintain, and improve our Site and its features.
                            </li>
                            <li className="d-flex align-items-center py-2">
                                <span class="bullet bullet-dot me-5"></span>
                                To Communicate with You: To respond to your inquiries, provide customer support, and send you updates and information about our services. This may include email marketing communications where permitted by applicable law.
                            </li>
                            <li className="d-flex align-items-center py-2">
                                <span class="bullet bullet-dot me-5"></span>
                                To Personalize Your Experience: To personalize your experience on our Site by providing content and features that are relevant to your interests.
                            </li>
                            <li className="d-flex align-items-center py-2">
                                <span class="bullet bullet-dot me-5"></span>
                                To Analyze Site Usage: To monitor and analyze trends, usage, and activities in connection with our Site.
                            </li>
                            <li className="d-flex align-items-center py-2">
                                <span class="bullet bullet-dot me-5"></span>
                                To Prevent Fraud and Abuse: To protect, investigate, and deter against fraudulent, unauthorized, or illegal activity.
                            </li>
                            <li className="d-flex align-items-center py-2">
                                <span class="bullet bullet-dot me-5"></span>
                                For Legal Compliance: To comply with applicable laws, regulations, or legal processes.
                            </li>
                        </div>
                        <br />
                        <p></p>
                        <h1><b>How We Share Your Information</b></h1>
                        <p>We may share your information with the following parties:</p>
                        <div className="d-flex flex-column">
                            <li className="d-flex align-items-center py-2">
                                <span class="bullet bullet-dot me-5"></span>
                                Service Providers: We may share information with third-party service providers who perform services on our behalf, such as website hosting, data analysis, email marketing, and customer support. These service providers are contractually obligated to protect your information and only use it for the purposes for which we disclose it to them.
                            </li>
                            <li className="d-flex align-items-center py-2">
                                <span class="bullet bullet-dot me-5"></span>
                                Business Partners: We may share information with our business partners to offer you certain products, services, or promotions.
                            </li>
                            <li className="d-flex align-items-center py-2">
                                <span class="bullet bullet-dot me-5"></span>
                                Legal Authorities: We may disclose information to legal authorities if required by law or legal process.
                            </li>
                            <li className="d-flex align-items-center py-2">
                                <span class="bullet bullet-dot me-5"></span>
                                Business Transfers: In the event of a merger, acquisition, or sale of all or a portion of our assets, your information may be transferred to the acquiring company.
                            </li>
                        </div>
                        <br />
                        <p></p>
                        <h1><b>Your Choices</b></h1>
                        <div className="d-flex flex-column">
                            <li className="d-flex align-items-center py-2">
                                <span class="bullet bullet-dot me-5"></span>
                                Cookies: You can control cookies through your browser settings. You can choose to block all cookies or only certain cookies.
                            </li>
                            <li className="d-flex align-items-center py-2">
                                <span class="bullet bullet-dot me-5"></span>
                                Email Marketing: You can opt-out of receiving email marketing communications from us by clicking the "unsubscribe" link in the email.
                            </li>
                            <li className="d-flex align-items-center py-2">
                                <span class="bullet bullet-dot me-5"></span>
                                Access and Correction: You may have the right to access and correct your personal information. Please contact us using the contact information below to request access to or correction of your information.
                            </li>
                        </div>
                        <br />
                        <p></p>
                        <h1><b>Data Security</b></h1>
                        <div className="d-flex flex-column">
                            <li className="d-flex align-items-center py-2">
                                <span class="bullet bullet-dot me-5"></span>
                                We take reasonable measures to protect your information from unauthorized access, use, or disclosure. However, no method of transmission over the internet, or method of electronic storage, is 100% secure. Therefore, we cannot guarantee the absolute security of your information.
                            </li>
                        </div>
                        <br />
                        <p></p>
                        <h1><b>Children's Privacy</b></h1>
                        <div className="d-flex flex-column">
                            <li className="d-flex align-items-center py-2">
                                <span class="bullet bullet-dot me-5"></span>
                                Our Site is not directed to children under the age of 16. We do not knowingly collect personal information from children under the age of 13. If you are a parent or guardian and believe that your child has provided us with personal information, please contact us using the contact information below.
                            </li>
                        </div>
                        <br />
                        <p></p>
                        <h1><b>Changes to This Privacy Policy</b></h1>
                        <div className="d-flex flex-column">
                            <li className="d-flex align-items-center py-2">
                                <span class="bullet bullet-dot me-5"></span>
                                We may update this Privacy Policy from time to time. We will post any changes on this page and, if the changes are significant, we will provide a more prominent notice. Your continued use of the Site after the posting of changes constitutes your acceptance of the revised Privacy Policy.
                            </li>
                        </div>
                    </article>
                    </div>
                    {/* <div class="col-12 col-lg-4 col-md-5 ">
                    </div> */}
                </div>
            </div>
        </section>
        <Footer />  
        </>
    );
};

export default ProsoftSynergiesPrivacyPolicy;
