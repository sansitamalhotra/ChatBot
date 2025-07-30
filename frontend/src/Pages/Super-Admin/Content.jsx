import React from 'react';
import { Link } from 'react-router-dom';
import DashboardCards from './DashboardCards';
import RecentTickets from './RecentTickets';

function Content() {
  return (
    <div className="content-wrapper">
      <div className="page-header">
        <h3 className="page-title">
          <span className="page-title-icon bg-gradient-primary text-white me-2">
            <i className="mdi mdi-home"></i>
          </span> Dashboard
        </h3>
        <nav aria-label="breadcrumb">
          <ul className="breadcrumb">
            <li className="breadcrumb-item active" aria-current="page">
              <span></span>Overview <i className="mdi mdi-alert-circle-outline icon-sm text-primary align-middle"></i>
            </li>
          </ul>
        </nav>
      </div>
      
      <DashboardCards />
      <RecentTickets />
    </div>
  );
}

export default Content;