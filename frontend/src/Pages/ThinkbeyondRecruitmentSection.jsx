import React, { useState } from 'react'; 
import { Link } from 'react-router-dom';
import './ThinkbeyondRecruitmentSection.css';
import ImageBG from './recruitment.jpg';

const services = [
  {
    title: "How We Operate",
    content: (
      <div className='accordionListItems'>
        <p>
          Our solutions move in the same direction as you do. They adapt to your needs and work to meet your business objectives in the short and long term.
        </p>
        <ul className="scrollable-list">
          <li>Recruitment covering a diverse array of skill sets</li>
          <li>Direct access to the Adecco database and our extensive global network</li>
          <li>Comprehensive compliance management throughout the entire process, from onboarding to offboarding</li>
          <li>Reporting and analytics tailored to your industry and specific needs, along with expert consultation</li>
        </ul>
      </div>
    ),
  },
  {
    title: "Personalized User Portal",
    content: (
      <div className='accordionListItems'>
        <p>
          Access your ProSoft Account and manage everything from one centralized dashboard. Job Seekers can keep track of the Latest Job Openings, while Employers can monitor the recruitment lifecycle of candidates. This integrated platform facilitates improved collaboration and communication, leading to faster and more informed hiring choices.
        </p>        
      </div>
    ),
  },
  {
    title: "Why We're Trusted",
    content: (
      <div className='accordionListItems'>
        <p>
          Our extensive portfolio includes flexible and permanent employment solutions, upskilling and reskilling programs, and IT consulting services. We collaborate with organizations to refine business strategies and deliver solutions that align with their unique objectives.
        </p>        
      </div>
    ),
  },
  {
    title: "Start Hiring With ProSoft",
    content: (
      <div className='accordionListItems'>
        <p>
          Fulfill your business ambitions with our recruitment offerings. Provide us with your job vacancies to outline your staffing needs, or feel free to contact us for any other inquiries.
        </p>        
      </div>
    ),
  },
];

const ThinkbeyondRecruitmentSection = () => {
  const [activeIndex, setActiveIndex] = useState(null);

  const toggleAccordion = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <section className="recruitment-section1">
      <div className="container">
        <h1 className="section-title">How we can help you find IT talent</h1>

        <div className="content-wrapper">
          <div className="image-container">
            <img
              src={ImageBG}
              alt="Professional working on laptop"
              className="recruitment-image"
            />
          </div>

          <div className="services-list">
            {services.map((service, index) => (
              <div key={index} className="service-item" onClick={() => toggleAccordion(index)}>
                <h3 className="service-title">
                  <span className={`arrow-icon ${activeIndex === index ? "rotate" : ""}`}>›</span>
                  {service.title}
                </h3>
                <div className={`accordion-section ${activeIndex === index ? "active" : ""}`}>
                  {service.content}
                </div>
              </div>
            ))}
            <Link to="/Contact-Us" className="cta-button">CONTACT US NOW!</Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ThinkbeyondRecruitmentSection;
