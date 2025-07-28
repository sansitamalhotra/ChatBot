// Sidebar.js
import React from "react";
import { Link } from "react-router-dom";
import { LogoutLink } from "../../Logout/Logout";

const Sidebar = ({ isOpen }) => {
  return (
    <nav
      className={`sidebar sidebar-offcanvas ${isOpen ? "active" : ""}`}
      id="sidebar"
    >
      <ul className="nav">
        <li className="nav-item">
          <Link className="nav-link" to="/Super-Admin/Dashboard">
            <span className="menu-title">Super Admin Dashboard</span>
            <i className="mdi mdi-home menu-icon"></i>
          </Link>
        </li>
        <li className="nav-item">
          <Link
            className="nav-link"
            data-bs-toggle="collapse"
            to="#admin-jobs"
            aria-expanded="false"
            aria-controls="admin-jobs"
          >
            <span className="menu-title">Posted Jobs</span>
            <i className="menu-arrow"></i>
            <i className="mdi mdi-briefcase menu-icon"></i>
          </Link>
          <div className="collapse" id="admin-jobs">
            <ul className="nav flex-column sub-menu">
              <li className="nav-item">
                <Link className="nav-link" to="/Admin/Add-Job">
                  Add New Job
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/Admin/Manage-Jobs">
                  Manage Jobs
                </Link>
              </li>
            </ul>
          </div>
        </li>
        <li className="nav-item">
          <Link
            className="nav-link"
            data-bs-toggle="collapse"
            to="#admin-jobs-qualifications"
            aria-expanded="false"
            aria-controls="admin-jobs-qualifications"
          >
            <span className="menu-title">Job Qualifications</span>
            <i className="menu-arrow"></i>
            <i className="mdi mdi-school menu-icon"></i>
          </Link>
          <div className="collapse" id="admin-jobs-qualifications">
            <ul className="nav flex-column sub-menu">
              <li className="nav-item">
                <Link className="nav-link" to="/Admin/Add-Qualification">
                  Add Qualifications
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/Admin/Manage-Qualifications">
                  Manage Qualifications
                </Link>
              </li>
            </ul>
          </div>
        </li>
        <li className="nav-item">
          <Link
            className="nav-link"
            data-bs-toggle="collapse"
            to="#admin-work-experiences"
            aria-expanded="false"
            aria-controls="admin-work-experiences"
          >
            <span className="menu-title">Work Experiences</span>
            <i className="menu-arrow"></i>
            <i className="mdi mdi-checkbox-multiple-marked menu-icon"></i>
          </Link>
          <div className="collapse" id="admin-work-experiences">
            <ul className="nav flex-column sub-menu">
              <li className="nav-item">
                <Link className="nav-link" to="/Admin/Add-Work-Experience">
                  Add Work Experience
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/Admin/Manage-Work-Experiences">
                  Manage Work Experiences
                </Link>
              </li>
            </ul>
          </div>
        </li>
        <li className="nav-item">
          <Link
            className="nav-link"
            data-bs-toggle="collapse"
            to="#admin-jobs"
            aria-expanded="false"
            aria-controls="admin-jobs"
          >
            <span className="menu-title">Business Hours</span>
            <i className="menu-arrow"></i>
            <i className="mdi mdi-briefcase menu-icon"></i>
          </Link>
          <div className="collapse" id="admin-jobs">
            <ul className="nav flex-column sub-menu">
              <li className="nav-item">
                <Link className="nav-link" to="/Admin/Add-Job">
                  Add Business Hours
                </Link>
              </li>
              <li className="nav-item">
                <Link
                  className="nav-link"
                  to="/Super-Admin/Manage-BusinessHours"
                >
                  Manage Business Hours
                </Link>
              </li>
            </ul>
          </div>
        </li>
        <li className="nav-item">
          <Link
            className="nav-link"
            data-bs-toggle="collapse"
            to="#admin-work-modes"
            aria-expanded="false"
            aria-controls="admin-work-modes"
          >
            <span className="menu-title">Work Mode Types</span>
            <i className="menu-arrow"></i>
            <i className="mdi mdi-account-convert menu-icon"></i>
          </Link>
          <div className="collapse" id="admin-work-modes">
            <ul className="nav flex-column sub-menu">
              <li className="nav-item">
                <Link className="nav-link" to="/Admin/Add-Work-Mode">
                  Add Work Mode
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/Admin/Manage-Work-Modes">
                  Manage Work Modes
                </Link>
              </li>
            </ul>
          </div>
        </li>
        <li className="nav-item">
          <Link
            className="nav-link"
            data-bs-toggle="collapse"
            to="#admin-countries"
            aria-expanded="false"
            aria-controls="admin-countries"
          >
            <span className="menu-title">Countries</span>
            <i className="menu-arrow"></i>
            <i className="mdi mdi-map-marker-radius menu-icon"></i>
          </Link>
          <div className="collapse" id="admin-countries">
            <ul className="nav flex-column sub-menu">
              <li className="nav-item">
                <Link className="nav-link" to="/Admin/Add-Country">
                  Add Country
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/Admin/Manage-Countries">
                  Manage Countries
                </Link>
              </li>
            </ul>
          </div>
        </li>
        <li className="nav-item">
          <Link
            className="nav-link"
            data-bs-toggle="collapse"
            to="#admin-provinces"
            aria-expanded="false"
            aria-controls="admin-provinces"
          >
            <span className="menu-title">Provinces / State</span>
            <i className="menu-arrow"></i>
            <i className="mdi mdi-map-marker-circle menu-icon"></i>
          </Link>
          <div className="collapse" id="admin-provinces">
            <ul className="nav flex-column sub-menu">
              <li className="nav-item">
                <Link className="nav-link" to="/Admin/Add-Province">
                  Add Province
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/Admin/Manage-Provinces">
                  Manage Provinces
                </Link>
              </li>
            </ul>
          </div>
        </li>
        <li className="nav-item">
          <Link
            className="nav-link"
            data-bs-toggle="collapse"
            to="#sectors"
            aria-expanded="false"
            aria-controls="sectors"
          >
            <span className="menu-title">Job Sectors</span>
            <i className="menu-arrow"></i>
            <i className="mdi mdi-format-list-bulleted-type menu-icon"></i>
          </Link>
          <div className="collapse" id="sectors">
            <ul className="nav flex-column sub-menu">
              <li className="nav-item">
                <Link className="nav-link" to="/Admin/Add-Sector">
                  {" "}
                  Add Job Sector{" "}
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/Admin/Manage-Sectors">
                  {" "}
                  Manage Job Sectors{" "}
                </Link>
              </li>
            </ul>
          </div>
        </li>
        <li className="nav-item">
          <Link
            className="nav-link"
            data-bs-toggle="collapse"
            to="#salaries"
            aria-expanded="false"
            aria-controls="salaries"
          >
            <span className="menu-title">Manage Salaries</span>
            <i className="menu-arrow"></i>
            <i className="mdi mdi-currency-usd menu-icon"></i>
          </Link>
          <div className="collapse" id="salaries">
            <ul className="nav flex-column sub-menu">
              <li className="nav-item">
                <Link className="nav-link" to="/Admin/Add-Salary">
                  {" "}
                  Add Salary{" "}
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/Admin/Manage-Salaries">
                  {" "}
                  Manage Salaries{" "}
                </Link>
              </li>
            </ul>
          </div>
        </li>
        <li className="nav-item">
          <Link
            className="nav-link"
            data-bs-toggle="collapse"
            to="#workAuthorizations"
            aria-expanded="false"
            aria-controls="workAuthorizations"
          >
            <span className="menu-title">Work Authorizations</span>
            <i className="menu-arrow"></i>
            <i className="mdi mdi-file-check menu-icon"></i>
          </Link>
          <div className="collapse" id="workAuthorizations">
            <ul className="nav flex-column sub-menu">
              <li className="nav-item">
                <Link className="nav-link" to="/Admin/Add-Work-Authorization">
                  {" "}
                  Add Work Authorization{" "}
                </Link>
              </li>
              <li className="nav-item">
                <Link
                  className="nav-link"
                  to="/Admin/Manage-Work-Authorizations"
                >
                  {" "}
                  Manage Work Authorizations{" "}
                </Link>
              </li>
            </ul>
          </div>
        </li>
        <li className="nav-item">
          <Link
            className="nav-link"
            data-bs-toggle="collapse"
            to="#messages"
            aria-expanded="false"
            aria-controls="messages"
          >
            <span className="menu-title">Contact Messages</span>
            <i className="menu-arrow"></i>
            <i className="mdi mdi-message-text-outline menu-icon"></i>
          </Link>
          <div className="collapse" id="messages">
            <ul className="nav flex-column sub-menu">
              <li className="nav-item">
                <Link className="nav-link" to="/Admin/All-Contact-Us-Messages">
                  {" "}
                  All Contact Messages{" "}
                </Link>
              </li>
            </ul>
          </div>
        </li>
        <li className="nav-item">
          <Link className="nav-link" to="/Admin/Email-Subscribers">
            <span className="menu-title">Email Subscribers</span>
            <i className="mdi mdi-at menu-icon"></i>
          </Link>
        </li>
        <li className="nav-item">
          <Link className="nav-link" to="/Admin/Change-Password">
            <span className="menu-title">Change Password</span>
            <i className="mdi mdi-repeat menu-icon"></i>
          </Link>
        </li>
        <li className="nav-item">
          <LogoutLink className="nav-link">
            <span className="menu-title">Logout</span>
            <i className="mdi mdi-logout menu-icon"></i>
          </LogoutLink>
        </li>
      </ul>
    </nav>
  );
};

export default Sidebar;
