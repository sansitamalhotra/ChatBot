import React from 'react';
import { Link } from 'react-router-dom';
import './IndustryExpertiseSection.css';

const IndustryExpertiseSection = () => {
  return (
    <section className="industry-expertise">
      <div className="container">
        <h1>Industry-Specific Expertise</h1>
        <p className="subtitle">Your Sector's Staffing Needs, Understood.</p>
        
        <div className="industry-grid">
          <Link to="/Manufacturing-Recruitment">
            <div className="industry-card">
              <div className="card-bg automotive"></div>
              <h3>Manufacturing</h3>
            </div>  
          </Link>        
          <Link to="/Admin-&-Office-Support-Recruitment">
            <div className="industry-card">
              <div className="card-bg banking"></div>
              <h3>Administration & <br />Office Support</h3>
            </div>  
          </Link>   
          <Link to="/Construction-&-Infrastructure-Recruitment">
            <div className="industry-card">
              <div className="card-bg energy"></div>
              <h3>Construction & Infrastructure</h3>
            </div>  
          </Link> 
          <Link to="/Education-Recruitment">
            <div className="industry-card">
              <div className="card-bg gaming"></div>
              <h3>Education</h3>
            </div>   
          </Link>          
          {/* Additional industry cards would go here */}
        </div>
      </div>
    </section>
  );
};

export default IndustryExpertiseSection;