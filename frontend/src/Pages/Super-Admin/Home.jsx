import React, { useEffect, useState, useRef } from 'react';
import { Link, useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import API from '../../helpers/API';
import AdminUsersTable from './components/AdminUsersTable';
import moment from "moment";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import './assets/css/style.css';
import {
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { LogoutLink } from '../Logout/Logout';
import { LogoutNavbarLink } from '../Logout/LogoutNavbar';

import $ from 'jquery';
import 'bootstrap/dist/js/bootstrap.bundle.min';
import './assets/vendors/mdi/css/materialdesignicons.min.css';
import './assets/vendors/ti-icons/css/themify-icons.css';
import './assets/vendors/css/vendor.bundle.base.css';
import './assets/vendors/font-awesome/css/font-awesome.min.css';
import './assets/vendors/bootstrap-datepicker/bootstrap-datepicker.min.css';
import './assets/css/style.css';

// Fixed imports - import default exports
import initOffCanvas from './assets/js/off-canvas';
import misc from './assets/js/misc';
import settings from './assets/js/settings';
import todolist from './assets/js/todolist';

import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
const SuperAdminDashboardHome = ({ userId }) => {
  // State management
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [users, setUsers] = useState([]);
  const [applicantAppliedJobs, setApplicantAppliedJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [numJobsInDB, setNumJobsInDB] = useState(0);
  const [numRegUsersInDB, setNumRegUsersInDB] = useState(0);
  const [totalAppliedApplicant, setTotalAppliedApplicant] = useState(0);
  const [totalAppliedApplicantCount, setTotalAppliedApplicantCount] = useState(0);
  
  // UI states
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [messageDropdownOpen, setMessageDropdownOpen] = useState(false);
  
  const navigate = useNavigate();
  const jobsPerPage = 5;
  const usersPerPage = 20;
  const totalPages = Math.ceil(numJobsInDB / jobsPerPage);

  // Notification helpers
  const notifyErr = (msg) => toast.error(msg, { position: "top-center" });
  const notifySucc = (msg) => toast.success(msg, { position: "top-center" });

  // Toggle UI elements
  const toggleProfileDropdown = () => {
    setProfileDropdownOpen(!profileDropdownOpen);
    if (messageDropdownOpen) setMessageDropdownOpen(false);
  };

  const toggleMobileSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Data fetching
  const fetchAlJobs = async () => {
    try {
      setLoading(true);
      const response = await API.get(
        `/api/v1/job/fetchJobsByRecruiter/${userId}/?page=${currentPage}`
      );
      setJobs(response.data.result);
      setNumJobsInDB(response.data.numJobsInDB);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      notifyErr(error.response?.data?.message || "Failed to load jobs");
    }
  };

  const fetchSectors = async () => {
    try {
      const { data } = await API.get("/api/v1/sector/fetchSectors");
      if (data?.success) setSectors(data?.sector);
    } catch (error) {
      notifyErr("Failed to retrieve sectors");
    }
  };

  const fetchAllRegUsers = async () => {
    try {
      setLoading(true);
      const response = await API.get(
        `/api/v1/superAdmin/fetchRegisteredUsers?page=${currentPage}`
      );
      setUsers(response.data.result);
      setNumRegUsersInDB(response.data.numRegUsersInDB);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      notifyErr(error.response?.data?.message || "Failed to load users");
    }
  };

  const fetchAllApplicantAppliedJobs = async () => {
    try {
      setLoading(true);
      const response = await API.get(`/api/v1/superAdmin/applicantAppliedJobs`);
      setApplicantAppliedJobs(response.data.result);
      setTotalAppliedApplicant(response.data.totalAppliedApplicant);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      notifyErr(error.response?.data?.message || "Failed to load applicant data");
    }
  };

  // Initialize data
  useEffect(() => {
    fetchAlJobs();
    fetchSectors();
    fetchAllRegUsers();
    fetchAllApplicantAppliedJobs();
    window.scrollTo(0, 0);
  }, [currentPage]);

  // Animation for applicant count
  useEffect(() => {
    let animationFrame;
    const startTime = Date.now();
    const duration = 1000;

    const updateCount = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / duration);
      const currentCount = Math.floor(progress * totalAppliedApplicant);
      setTotalAppliedApplicantCount(currentCount);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(updateCount);
      }
    };

    animationFrame = requestAnimationFrame(updateCount);
    return () => cancelAnimationFrame(animationFrame);
  }, [totalAppliedApplicant]);

  // Pagination
  const nextPage = () => currentPage < totalPages && setCurrentPage(currentPage + 1);
  const prevPage = () => currentPage > 1 && setCurrentPage(currentPage - 1);
  const pagination = (pageNumber) => setCurrentPage(pageNumber);
  
  // Generate page numbers for pagination
  const generatePageNumbers = () => {
    const maxNumbers = 5;
    const start = Math.max(1, currentPage - Math.floor(maxNumbers / 2));
    const end = Math.min(start + maxNumbers - 1, totalPages);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };
  const pageNumbers = generatePageNumbers();

  return (
    <div className="container-scroller">
      <Helmet>
        <title>Super Admin Dashboard | ProsoftSynergies</title>
        <meta name="description" content="Super Admin Dashboard" />
      </Helmet>
      
      <Navbar 
        toggleMobileSidebar={toggleMobileSidebar} 
      />
      
      <div className="container-fluid page-body-wrapper">
        <Sidebar isOpen={sidebarOpen} />
        
        <div className="main-panel">
          <div className="content-wrapper">
            {/* Stats Cards */}
            <div className="row">
              <div className="col-md-4 stretch-card grid-margin">
                <div className="card bg-gradient-danger card-img-holder text-white">
                  <div className="card-body">
                    <h4 className="font-weight-normal mb-3">
                      Active Job Openings <i className="mdi mdi-briefcase mdi-24px float-end"></i>
                    </h4>
                    <h2 className="mb-5">{numJobsInDB}</h2>
                  </div>
                </div>
              </div>
              
              <div className="col-md-4 stretch-card grid-margin">
                <div className="card bg-gradient-info card-img-holder text-white">
                  <div className="card-body">
                    <h4 className="font-weight-normal mb-3">
                      Registered Users <i className="mdi mdi-human-male-female mdi-24px float-end"></i>
                    </h4>
                    <h2 className="mb-5">{numRegUsersInDB}</h2>
                  </div>
                </div>
              </div>
              
              <div className="col-md-4 stretch-card grid-margin">
                <div className="card bg-gradient-success card-img-holder text-white">
                  <div className="card-body">
                    <h4 className="font-weight-normal mb-3">
                      Active Applicants <i className="mdi mdi-file-document mdi-24px float-end"></i>
                    </h4>
                    <h2 className="mb-5">{totalAppliedApplicantCount}</h2>
                  </div>
                </div>
              </div>
            </div>

            {/* Admin Status Table */}
            <div className="row mb-5">
              <div className="col-12 grid-margin">
                <div className="page-header">
                  <h3 className="page-title">
                    <span className="page-title-icon bg-gradient-primary text-white me-2">
                      <i className="mdi mdi-account-multiple-plus"></i>
                    </span> Admin Users Status
                  </h3>
                </div>
                <AdminUsersTable />
              </div>
            </div>
            
            {/* Jobs Table */}
            <div className="row">
              <div className="col-12 grid-margin">
                <div className="page-header">
                  <h3 className="page-title">
                    <span className="page-title-icon bg-gradient-primary text-white me-2">
                      <i className="mdi mdi-briefcase"></i>
                    </span> Active Job List
                  </h3>
                </div>
                
                <div className="card">
                  <div className="card-body">
                    <h4 className="card-title">List Of Posted Jobs</h4>
                    <div className="table-responsive">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>No.</th>
                            <th>Job Title</th>
                            <th>Job Qualification</th>
                            <th>Job Experience</th>
                            <th>Job Country</th>
                            <th>Work Mode</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {jobs.length > 0 ? jobs.map((j, index) => (
                            <tr key={j._id}>
                              <td>{index + 1}</td>
                              <td>{j.title}</td>
                              <td>{j?.jobQualification?.qualificationName}</td>
                              <td>{j?.jobExperience?.workExperienceName}</td>
                              <td>{j?.country?.countryName}</td>
                              <td>{j?.jobModeType?.workModeName}</td>
                              <td>
                                <Link
                                  className="btn-sm app-btn-secondary rounded-0 me-3"
                                  to={`/Admin/Jobs/View-Job/${j.slug}`}
                                >
                                  <i className="mdi mdi-eye"></i>
                                </Link>
                                <Link
                                  className="btn-sm app-btn-secondary rounded-0 me-3"
                                  to={`/Admin/Jobs/Update-Job/${j.slug}`}
                                >
                                  <i className="mdi mdi-pencil"></i>
                                </Link>
                                <Link
                                  className="btn-sm app-btn-secondary rounded-0 me-3"
                                  to={`/Admin/Jobs/Delete-Job/${j.slug}`}
                                >
                                  <i className="mdi mdi-delete"></i>
                                </Link>
                              </td>
                            </tr>
                          )) : (
                            <tr>
                              <td colSpan={7} className="text-center">
                                {loading ? "Loading..." : "No jobs found"}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                    
                    <nav className="app-pagination mt-3">
                      <ul className="pagination justify-content-center">
                        <li className="page-item">
                          <button
                            className="page-link"
                            onClick={prevPage}
                            disabled={currentPage === 1}
                          >
                            Previous
                          </button>
                        </li>
                        {pageNumbers.map(number => (
                          <li
                            key={number}
                            className={`page-item ${currentPage === number ? 'active' : ''}`}
                          >
                            <button
                              className="page-link"
                              onClick={() => pagination(number)}
                            >
                              {number}
                            </button>
                          </li>
                        ))}
                        <li className="page-item">
                          <button
                            className="page-link"
                            onClick={nextPage}
                            disabled={currentPage === totalPages}
                          >
                            Next
                          </button>
                        </li>
                      </ul>
                    </nav>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Users Table */}
            <div className="row">
              <div className="col-12 grid-margin">
                <div className="page-header">
                  <h3 className="page-title">
                    <span className="page-title-icon bg-gradient-primary text-white me-2">
                      <i className="mdi mdi-account-multiple-plus"></i>
                    </span> Registered Users List
                  </h3>
                </div>
                
                <div className="card">
                  <div className="card-body">
                    <h4 className="card-title">List Of Registered Users</h4>
                    <div className="table-responsive">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>No.</th>
                            <th>Full Name</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>Role</th>
                            <th>Country</th>
                            <th>Verification</th>
                            <th>Status</th>
                            <th>Registered</th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.length > 0 ? users.map((u, index) => (
                            <tr key={u._id}>
                              <td>{index + 1}</td>
                              <td>{u.first_name} {u.last_name}</td>
                              <td>{u.email}</td>
                              <td>{u.phone}</td>
                              <td>
                                {u.role === 1 ? 'Admin' : 
                                 u.role === 2 ? 'Employer' : 
                                 'Applicant'}
                              </td>
                              <td>{u?.country?.countryName || 'N/A'}</td>
                              <td>{u.verified ? 'Verified' : 'Unverified'}</td>
                              <td>{u.status}</td>
                              <td>
                                {moment(u.registeredDate).format("ll")}
                              </td>
                            </tr>
                          )) : (
                            <tr>
                              <td colSpan={9} className="text-center">
                                {loading ? "Loading..." : "No users found"}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                    
                    <nav className="app-pagination mt-4">
                      <ul className="pagination justify-content-center">
                        <li className="page-item">
                          <button
                            className="page-link"
                            onClick={prevPage}
                            disabled={currentPage === 1}
                          >
                            Previous
                          </button>
                        </li>
                        {pageNumbers.map(number => (
                          <li
                            key={number}
                            className={`page-item ${currentPage === number ? 'active' : ''}`}
                          >
                            <button
                              className="page-link"
                              onClick={() => pagination(number)}
                            >
                              {number}
                            </button>
                          </li>
                        ))}
                        <li className="page-item">
                          <button
                            className="page-link"
                            onClick={nextPage}
                            disabled={currentPage === totalPages}
                          >
                            Next
                          </button>
                        </li>
                      </ul>
                    </nav>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <Footer />
        </div>
      </div>
    </div>
  );    
};

export default SuperAdminDashboardHome;
