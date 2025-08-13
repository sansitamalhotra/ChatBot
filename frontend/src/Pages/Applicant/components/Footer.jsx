// Footer.js
import React from 'react';
import { Link } from "react-router-dom";

const Footer = () => {
  const currentDay = new Date();
  const currentYear = currentDay.getFullYear();
  return (
    <footer className="footer">
      <div className="d-sm-flex justify-content-center justify-content-sm-between" style={{ color: "#090909ff" }}>
        <span className="text-muted text-center text-sm-left d-block d-sm-inline-block">
          Copyright © {currentYear} <Link to="/" target="_blank" rel="noreferrer"  style={{ textDecoration: 'none', color: "#021924ff" }}>ProsoftSynergies</Link>. All Rights Reserved.
        </span>
      </div>
    </footer>
  );
};

export default Footer;
