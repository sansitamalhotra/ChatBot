import React from 'react';
import { Link } from 'react-router-dom';
import './thinkbeyond-services.css'; // Import the CSS file

const ThinkbeyondServices = () => {
  return (
    <div className="service-section">
      <div className="service-container">
        {/* Heading Section */}
        <div className="heading-container">
          <h1 className="heading-title">Tailored Recruitment Solutions</h1>
          <p className="heading-subtitle">Tailored Professional Assistance That Aligns With Your Unique Demands.</p>
        </div>
        
        {/* Services Cards */}
        <div className="services-grid">
          {/* Information Technology Recruitment*/}
         <Link to="/Information-Technology-Recruitment">
            <ServiceCard 
                icon={<InfoTechIcon />}
                title="INFORMATION TECHNOLOGY RECRUITMENT"
                description="We specialize in Information Technology Recruitment, connecting top IT talent with leading companies. Our team leverages extensive industry expertise to provide tailored staffing solutions, ensuring that each client's unique needs are met."
                accentColor="green"
            />
         </Link>          
          {/* Healthcare & Medical Recruitment*/}
          <Link to="/Healthcare-&-Medical-Recruitment">
            <ServiceCard 
                icon={<HealthCareIcon />}
                title="HEALTHCARE & MEDICAL RECRUITMENT"
                description="ProSoft specializes in healthcare and medical recruitment, leveraging extensive expertise to connect top-tier candidates with roles that align perfectly with client needs. We only meets immediate staffing demands but also builds long-term relationships that enhance organizational growth."
                accentColor="green"
            />
          </Link>          
          {/* Transport & Logistics Recruitment */}
          <Link to="/Transport-&-Logistics-Recruitment">
            <ServiceCard 
                icon={<TransLogisticsIcon />}
                title="TRANSPORT & LOGISTICS RECRUITMENT"
                description="ProSoft Recruiting specializes in providing tailored transport and logistics recruitment solutions to meet the growing demands of this dynamic industry. By combining industry expertise with innovative tools for seamless hiring process."
                accentColor="green"
            />
          </Link>
        </div>
      </div>
    </div>
  );
};

const ServiceCard = ({ icon, title, description, accentColor }) => {
  return (
    <div className={`service-card ${accentColor}-accent`}>
      <div className="card-content">
        <div className="icon-container">
          {icon}
        </div>
        <h3 className="card-title">{title}</h3>
        <p className="card-description">{description}</p>
      </div>
    </div>
  );
};

const InfoTechIcon = () => (
  <div className="icon-green">
   <svg xmlns="http://www.w3.org/2000/svg" width="43" height="43" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="14" x2="23" y2="14"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="14" x2="4" y2="14"></line></svg>
  </div>
);

const HealthCareIcon = () => (
  <div className="icon-yellow">
    <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-stethoscope"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M6 4h-1a2 2 0 0 0 -2 2v3.5h0a5.5 5.5 0 0 0 11 0v-3.5a2 2 0 0 0 -2 -2h-1" /><path d="M8 15a6 6 0 1 0 12 0v-3" /><path d="M11 3v2" /><path d="M6 3v2" /><path d="M20 10m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" /></svg>
  </div>
);

const TransLogisticsIcon = () => (
  <div className="icon-orange">
    <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-truck-loading"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M2 3h1a2 2 0 0 1 2 2v10a2 2 0 0 0 2 2h15" /><path d="M9 6m0 3a3 3 0 0 1 3 -3h4a3 3 0 0 1 3 3v2a3 3 0 0 1 -3 3h-4a3 3 0 0 1 -3 -3z" /><path d="M9 19m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" /><path d="M18 19m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" /></svg>
  </div>
);

export default ThinkbeyondServices;
