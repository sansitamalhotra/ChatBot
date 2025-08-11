import React from 'react';
import { Helmet } from "react-helmet";
import TestHomeHeader from './TestHomeHeader';
import HeroCarousel from './TestHomeHero';
import RecruitmentExperienceSection from './RecruitmentExperienceSection';
import ThinkbeyondServices from './ThinkbeyondServices';
import TechnologySpecializationsSection from './TechnologySpecializationsSection';
import IndustryExpertiseSection from './IndustryExpertiseSection';
import ThinkbeyondRecruitmentSection from './ThinkbeyondRecruitmentSection';
import Footer from './Footer';


import './Home.css';

const TestHome = () => {
    const canonicalUrl = window.location.href; // Get the current URL

    return (
        <>
        <Helmet>
            <link rel="canonical" href={canonicalUrl} />
            <title>
                Discover Premier Talent through ProsoftSynergies: State-of-the-Art and Inventive Hiring Strategies | ProsoftSynergies
            </title>
            <meta
            name="description"
            content="Discover ProsoftSynergies' cutting-edge recruitment solutions designed to streamline hiring, enhance candidate experience, and build strong teams. From automated HR functions to seamless integration, ProsoftSynergies empowers businesses to attract top talent efficiently. Transform your hiring process today!"
            />
            <meta
            name="keywords"
            content="Discover ProsoftSynergies' cutting-edge recruitment solutions designed to streamline hiring, enhance candidate experience, and build strong teams. From automated HR functions to seamless integration, ProsoftSynergies empowers businesses to attract top talent efficiently. Transform your hiring process today!"
            />

            <meta
            property="og:title"
            content="ProsoftSynergies - Global Job Portal for Careers in Canada, US & India"
            />
            <meta
            property="og:description"
            content="Discover ProsoftSynergies' cutting-edge recruitment solutions designed to streamline hiring, enhance candidate experience, and build strong teams. From automated HR functions to seamless integration, ProSoft empowers businesses to attract top talent efficiently. Transform your hiring process today!"
            />
            <meta
            property="og:image"
            content="https://prosoftsynergies.com/static/media/PSPL-Logo.f41a1d1ab31adabe5d1c.png
    "
            />
            <meta
            property="og:url"
            content="https://prosoftsynergies.com, https://www.prosoftsynergies.com"
            />
            <meta
            name="twitter:title"
            content="ProsoftSynergies - Job Portal For Hybrid, OnSite IT / Tech, Non-IT / Tech Canada, US & India Careers"
            />
            <meta
            name="linkedIn:title"
            content="ProsoftSynergies - Job Portal For Hybrid, OnSite IT / Tech, Non-IT / Tech Canada, US & India Careers"
            />
            <meta
            name="twitter:description"
            content="Explore Exciting Career Opportunities with ProsoftSynergies. Connecting Top Talent with Leading Companies Across Canada, the US, and India. Find Your next Job Today."
            />
            <meta
            name="linkedIn:description"
            content="Explore Exciting Career Opportunities with ProsoftSynergies. Connecting Top Talent with Leading Companies Across Canada, the US, and India. Find Your next Job Today."
            />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />

            <meta
            name="twitter:image"
            content="https://prosoftsynergies.com/static/media/PSPL-Logo.f41a1d1ab31adabe5d1c.png"
            />
            <meta
            name="linkedIn:image"
            content="https://prosoftsynergies.com/static/media/PSPL-Logo.f41a1d1ab31adabe5d1c.png"
            />
            <meta name="robots" content="index, follow" />
        </Helmet>
         <TestHomeHeader />
         <HeroCarousel />
         <RecruitmentExperienceSection />
         <ThinkbeyondServices />
         <TechnologySpecializationsSection />
         <IndustryExpertiseSection />
         <ThinkbeyondRecruitmentSection />
         <Footer />   
        </>
    );
};
export default TestHome;
