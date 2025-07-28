import React from 'react';
import './technology-specializations.css'; // Import the custom CSS file

const TechnologySpecializationsSection = () => {
  const techCategories = [
    { 
      icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="#ffffff">
              <path d="M21,2H3A2,2 0 0,0 1,4V20A2,2 0 0,0 3,22H21A2,2 0 0,0 23,20V4A2,2 0 0,0 21,2M21,7H3V4H21V7M3,9H7V12H3V9M3,16V14H7V17H3V16M9,17V14H13V17H9M13,12H9V9H13V12M15,17V14H19V17H15M15,12V9H19V12H15Z" />
            </svg>,
      text: "Salesforce"
    },
    { 
      icon: <span style={{ fontWeight: 'bold' }}><i className='fas fa-cloud'></i></span>,
      text: "AWS Cloud Computing"
    },
    { 
      icon: <span style={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '1.25rem' }}>JS</span>,
      text: "Java Developers"
    },
    { 
      icon: <span style={{ fontWeight: 'bold' }}><i className='fas fa-code'></i></span>,
      text: "Software Development"
    },
    { 
      icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="#ffffff">
              <path d="M12,3C7.58,3 4,4.79 4,7C4,9.21 7.58,11 12,11C16.42,11 20,9.21 20,7C20,4.79 16.42,3 12,3M4,9V12C4,14.21 7.58,16 12,16C16.42,16 20,14.21 20,12V9C20,11.21 16.42,13 12,13C7.58,13 4,11.21 4,9M4,14V17C4,19.21 7.58,21 12,21C16.42,21 20,19.21 20,17V14C20,16.21 16.42,18 12,18C7.58,18 4,16.21 4,14Z" />
            </svg>,
      text: "DevOps"
    },
    { 
      icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="#ffffff">
              <path d="M2,3H22C23.05,3 24,3.95 24,5V19C24,20.05 23.05,21 22,21H2C0.95,21 0,20.05 0,19V5C0,3.95 0.95,3 2,3M2,5V19H22V5H2M4,17V15H6V17H4M4,13V11H6V13H4M4,9V7H6V9H4M10,7H18V9H10V7M10,11H15V13H10V11M10,15H12V17H10V15Z" />
            </svg>,
      text: "Big Data"
    },
    { 
      icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="#ffffff">
              <path d="M21.71,20.29L20.29,21.71C20.11,21.89 19.85,22 19.58,22H4.43C4.15,22 3.89,21.89 3.71,21.71L2.29,20.29C2.11,20.11 2,19.85 2,19.58V4.43C2,4.15 2.11,3.89 2.29,3.71L3.71,2.29C3.89,2.11 4.15,2 4.43,2H19.58C19.85,2 20.11,2.11 20.29,2.29L21.71,3.71C21.89,3.89 22,4.15 22,4.43V19.58C22,19.85 21.89,20.11 21.71,20.29M5,11H7V13H5V11M5,15H7V17H5V15M5,7H7V9H5V7M9,7H19V9H9V7M9,11H13V13H9V11M9,15H13V17H9V15Z" />
            </svg>,
      text: "Project Managers"
    },
    { 
      icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="#ffffff">
              <path d="M12,2A9,9 0 0,0 3,11C3,13.09 3.54,15.05 4.5,16.78C4.5,16.78 4.5,16.78 4.5,16.78L4.73,17.13L5,17.5C7.21,20.57 11.23,22 12,22C12.77,22 16.79,20.57 19,17.5L19.27,17.13L19.5,16.78C19.5,16.78 19.5,16.78 19.5,16.78C20.46,15.05 21,13.09 21,11A9,9 0 0,0 12,2M12,4A7,7 0 0,1 19,11C19,12.47 18.5,13.79 17.7,14.83C17.33,14.44 16.78,14 16,14C15.22,14 14.66,14.44 14.3,14.83C13.5,13.79 13,12.47 13,11C13,8.24 15.24,6 18,6V4H12Z" />
            </svg>,
      text: "Cybersecurity"
    }
  ];

  return (
    <section className="tech-specializations-section">
      <div className="tech-specializations-container">
        <div className="tech-specializations-layout">
          <div className="tech-specializations-header">
            <h2 className="tech-specializations-heading">Technology Specializations</h2>
            <p className="tech-specializations-subtitle">Staffing Experts in Vital Information Technology Domains.</p>
          </div>
          
          <div className="tech-categories-wrapper">
            <div className="tech-categories-grid">
              {techCategories.map((category, index) => (
                <div 
                  key={index} 
                  className="tech-category-card"
                  tabIndex="0"
                >
                  <div className="tech-category-icon">
                    {category.icon}
                  </div>
                  <span className="tech-category-text">{category.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TechnologySpecializationsSection;