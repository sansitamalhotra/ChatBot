// Footer.js
import React from 'react';
import { Link } from "react-router-dom";

const Footer = () => {
  const currentDay = new Date();
  const currentYear = currentDay.getFullYear();
  return (
    <footer className="footer">
      <div className="d-sm-flex justify-content-center justify-content-sm-between">
        <span className="text-muted text-center text-sm-left d-block d-sm-inline-block">
          Copyright © {currentYear} <Link to="/" target="_blank" rel="noreferrer">ProfileSetting</Link>. All rights reserved.
        </span>
      </div>
    </footer>
  );
};

export default Footer;
