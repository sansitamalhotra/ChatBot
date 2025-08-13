import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import API from '../../helpers/API';
import {
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { LogoutLink } from '../Logout/Logout';
import { LogoutNavbarLink } from '../Logout/LogoutNavbar';

import moment from "moment";

import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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

const TestDashboardHome = ({ userId }) => {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [messageDropdownOpen, setMessageDropdownOpen] = useState(false);

  const toggleProfileDropdown = () => {
    setProfileDropdownOpen(!profileDropdownOpen);
    if (messageDropdownOpen) setMessageDropdownOpen(false);
  };


  useEffect(() => {
    // Initialize all custom JS functionality
    initOffCanvas();
    misc(); // Call the default export function
    settings(); // Call the default export function
    todolist(); // Call the default export function
    
    // Set up Bootstrap components
    $('[data-toggle="minimize"]').on('click', function() {
      $('body').toggleClass('sidebar-icon-only');
    });

    $('[data-toggle="offcanvas"]').on('click', function() {
      $('.sidebar-offcanvas').toggleClass('active');
    });

    // Handle fullscreen toggle
    $('#fullscreen-button').on('click', function() {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        document.documentElement.requestFullscreen();
      }
    });
  }, []);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);
  // Toggle sidebar (desktop)
  const toggleMinimize = () => {
    $('body').toggleClass('sidebar-icon-only');
  };
  // Toggle sidebar (mobile)
  const toggleMobileSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  // Handle click outside to close dropdowns
  useEffect(() => {
    function handleClickOutside(event) {
      if (!event.target.closest('.dropdown')) {
        setProfileDropdownOpen(false);
        setMessageDropdownOpen(false);
        setNotificationDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    // Initialize all custom JS functionality
    initOffCanvas();
    misc();
    settings();
    todolist();
   // Set up fullscreen toggle
    const fullscreenButton = document.getElementById('fullscreen-button');
    if (fullscreenButton) {
      fullscreenButton.addEventListener('click', () => {
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else {
          document.documentElement.requestFullscreen();
        }
      });
    }
   // Cleanup
    return () => {
      if (fullscreenButton) {
        fullscreenButton.removeEventListener('click', () => {});
      }
    };
  }, [])
  //===============================================================
  const canonicalUrl = window.location.href; // Get the current URL
  const params = useParams();
  const [jobs, setJobs] = useState([]);
  const [job, setJob] = useState({});
  const [numJobsInDB, setNumJobsInDB] = useState(0);
  const [totalJobs, setTotalJobs] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [jobsPerPage, setJobsPerPage] = useState(5);
  const [loading, setLoading] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [sectors, setSectors] = useState([]);

  const navigate = useNavigate();

  const notifyErr = (msg) =>
    toast.error(msg, {
      position: "top-center",
      autoClose: 20000,
      closeOnClick: true,
      pauseOnHover: true,
      theme: "light"
    });
  const notifySucc = (msg) =>
    toast.success(msg, {
      position: "top-center",
      autoClose: 20000,
      closeOnClick: true,
      pauseOnHover: true,
      theme: "light"
    });

  useEffect(() => {
    fetchAlJobs();
    window.scrollTo({ top: 0 });
    if (window.history.pushState) {
      window.history.pushState(
        null,
        null,
        `/Admin/Manage-Jobs?page=${currentPage}`
      );
    }
  }, [currentPage, jobsPerPage]);

  const fetchAlJobs = async () => {
    try {
      setLoading(true);
      const response = await API.get(
        `/api/v1/job/fetchJobsByRecruiter/${userId}/?page=${currentPage}`
      );
      setJobs(response.data.result);
      setTotalJobs(response.data.totalJobs);
      setNumJobsInDB(response.data.numJobsInDB);
      localStorage.setItem("refresh", response.data.result);
      setLoading(false);
      setSelectedJob(null);
    } catch (error) {
      console.log(error);
      setLoading(false);
      notifyErr(error.response.data.message);
    }
  };

  useEffect(() => {
    fetchSectors();
  }, []);

  const fetchSectors = async () => {
    try {
      const { data } = await API.get("/api/v1/sector/fetchSectors");
      if (data?.success) {
        setSectors(data?.sector);
      }
    } catch (error) {
      console.log(error);
      notifyErr("Oppss!!, FAILED, Something went Wrong Retrieving all Sectors");
    }
  };

  const fetchJob = async () => {
    try {
      const { data } = await API.get(`/api/v1/job/viewJob/${params.slug}`);
      setJob(data.job);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (params?.slug) fetchJob();
  }, [params?.slug]);

  const generatePageNumbers = () => {
    const maxPaginationNumbers = 5;
    const startPage = Math.max(
      1,
      currentPage - Math.floor(maxPaginationNumbers / 2)
    );
    const endPage = Math.min(startPage + maxPaginationNumbers - 1, totalPages);

    return Array.from(
      { length: endPage - startPage + 1 },
      (_, i) => startPage + i
    );
  };

  const totalPages = Math.ceil(totalJobs / jobsPerPage);

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };
  const pagination = (pageNumber) => setCurrentPage(pageNumber);
  const pageNumbers = generatePageNumbers();
  useEffect(() => {
    if (params?.slug) fetchJob();
  }, [params?.slug]);

  // &&&&&&&&&&&&&&&&&&&&&&&&&&&&&&
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [numRegUsersInDB, setNumRegUsersInDB] = useState(0);
  const [totalRegUsers, setTotalRegUsers] = useState(0);
  const [usersPerPage, setUsersPerPage] = useState(20);
  const [selectedUser, setSelectedUser] = useState(null);
  const [applicantAppliedJobs, setApplicantAppliedJobs] = useState([]);
  const [totalAppliedApplicant, setTotalAppliedApplicant] = useState(0);
  const [totalAppliedApplicantCount, setTotalAppliedApplicantCount] =
    useState(0);
  const [applicantAppliedNonITJobs, setApplicantAppliedNonITJobs] = useState(
    []
  );
  const [totalNonITAppliedApplicantCount, setTotalNonITAppliedApplicantCount] =
    useState(0);
  const [applied, setApplied] = useState(false);
  const duration = 50_000;
  const startTime = Date.now();

  // **********************************************
  useEffect(() => {
    const fetchJobData = async () => {
      try {
        setLoading(true);
        const jobResponse = await API.get(`/api/v1/job/fetchAllJobs`, {
          params: { search: searchTerm }
        });
        const { result, applied, totalJobs, numJobsInDB } = jobResponse.data;
        setJobs(result);
        setApplied(applied);
        setTotalJobs(totalJobs);
        setNumJobsInDB(numJobsInDB);
        localStorage.setItem("refresh", JSON.stringify(result));

        const sectorResponse = await API.get("/api/v1/job/sectors");
        setSectors(sectorResponse.data.result);
      } catch (error) {
        console.error(error);
        notifyErr(error.response.data.message);
      } finally {
        setLoading(false);
      }
    };

    fetchJobData();
    window.scrollTo({ top: 0 });
  }, [currentPage, searchTerm]);

  useEffect(() => {
    const fetchAllRegUsers = async () => {
      try {
        setLoading(true);
        const response = await API.get(
          `/api/v1/admin/fetchRegisteredUsers?page=${currentPage}`
        );
        setUsers(response.data.result);
        setTotalRegUsers(response.data.totalRegUsers);
        setNumRegUsersInDB(response.data.numRegUsersInDB);
        localStorage.setItem("refresh", response.data.result);
        setLoading(false);
        setSelectedUser(null);
      } catch (error) {
        console.log(error);
        setLoading(false);
        notifyErr(error.response.data.message);
      }
    };

    fetchAllRegUsers();
    window.scrollTo({ top: 0 });
    if (window.history.pushState) {
      window.history.pushState(
        null,
        null,
        `/Admin/Dashboard?page=${currentPage}`
      );
    }
  }, [currentPage, usersPerPage]);

  useEffect(() => {
    fetchAllApplicantAppliedJobs();
  }, []);

  const fetchAllApplicantAppliedJobs = async () => {
    try {
      setLoading(true);
      const response = await API.get(`/api/v1/admin/applicantAppliedJobs`);
      setApplicantAppliedJobs(response.data.result);
      setApplied(response.data.applied);
      setTotalAppliedApplicant(response.data.totalAppliedApplicant);
      localStorage.setItem("refresh", response.data.result);
      setLoading(false);
    } catch (error) {
      console.error(error);
      console.log(error);
      setLoading(false);
      notifyErr(error.response.data.message);
    }
  };

  useEffect(() => {
    const updateAppliedApplicant = () => {
      const elapsedTime = Date.now() - startTime;
      const progress = Math.min(1, elapsedTime / duration);
      const currentCount = Math.floor(progress * totalAppliedApplicant);
      setTotalAppliedApplicantCount(currentCount);

      if (progress < 1) {
        requestAnimationFrame(updateAppliedApplicant);
      }
    };
    requestAnimationFrame(updateAppliedApplicant);

    return () => {
      setTotalAppliedApplicantCount(totalAppliedApplicant);
    };
  }, [totalAppliedApplicant]);

 
    return (
      <div className="container-scroller">
        <Helmet>
          <link rel="canonical" href={canonicalUrl} />
          <title>Admin Dashboard Home | ThinkBeyond</title>
          <meta name="description" content="Admin Dashboard Home | ThinkBeyond" />
        </Helmet>
         <Navbar 
            toggleMinimize={toggleMinimize} 
            toggleMobileSidebar={toggleMobileSidebar} 
          />
        <div className="container-fluid page-body-wrapper">
        {/* Sidebar */}
          <Sidebar isOpen={sidebarOpen} />
        {/* Main Panel */}
        <div className="main-panel">
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
              {/* Stats Cards */}
              <div className="row">
                <div className="col-md-4 stretch-card grid-margin">
                  <div className="card bg-gradient-danger card-img-holder text-white">
                    <div className="card-body">
                      {/* <img src="./assets/images/dashboard/circle.svg" className="card-img-absolute" alt="circle" /> */}
                      <h4 className="font-weight-normal mb-3">Active Job Openings <i className="mdi mdi-briefcase mdi-24px float-end"></i>
                      </h4>
                      <h2 className="mb-5">{numJobsInDB}</h2>
                      {/* <h6 className="card-text">
                        <Link to="#" className='text-white'>Visit Page</Link>
                      </h6> */}
                    </div>
                  </div>
                </div>
                <div className="col-md-4 stretch-card grid-margin">
                  <div className="card bg-gradient-info card-img-holder text-white">
                    <div className="card-body">
                      {/* <img src="assets/images/dashboard/circle.svg" className="card-img-absolute" alt="circle" /> */}
                      <h4 className="font-weight-normal mb-3">Registered Users <i className="mdi mdi-human-male-female mdi-24px float-end"></i>
                      </h4>
                      <h2 className="mb-5">{numRegUsersInDB}</h2>
                      {/* <h6 className="card-text">
                        <Link to="#" className='text-white'>Visit Page</Link>
                      </h6> */}
                    </div>
                  </div>
                </div>
                <div className="col-md-4 stretch-card grid-margin">
                  <div className="card bg-gradient-success card-img-holder text-white">
                    <div className="card-body">
                      {/* <img src="assets/images/dashboard/circle.svg" className="card-img-absolute" alt="circle" /> */}
                      <h4 className="font-weight-normal mb-3">Active Applicants <i className="mdi mdi-file-document mdi-24px float-end"></i>
                      </h4>
                      <h2 className="mb-5">{totalAppliedApplicantCount}</h2>
                      {/* <h6 className="card-text">
                        <Link to="#" className='text-white'>Visit Page</Link>
                      </h6> */}
                    </div>
                  </div>
                </div>
              </div>              
              
              {/* Recent Tickets Table */}
              <div className="row">
                <div className="col-12 grid-margin">
                  <div className="page-header">
                    <h3 className="page-title">
                      <span className="page-title-icon bg-gradient-primary text-white me-2">
                        <i className="mdi mdi-briefcase"></i>
                      </span> Active Job List
                    </h3>
                    <nav aria-label="breadcrumb">
                      <ul className="breadcrumb">
                        <li className="breadcrumb-item active" aria-current="page">
                          <span></span>Overview <i className="mdi mdi-alert-circle-outline icon-sm text-primary align-middle"></i>
                        </li>
                      </ul>
                    </nav>
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
                          {jobs.length > 0 ? (
                            jobs.map((j, index) => {
                              return (
                                <tr key={j._id}>
                                  <td>{index + 1}</td>
                                  <td>
                                    <span className="truncate">{j.title}</span>
                                  </td>
                                  <td>
                                    {j?.jobQualification?.qualificationName}
                                  </td>
                                  <td>
                                    {j?.jobExperience?.workExperienceName}
                                  </td>
                                  <td>
                                    {j?.country?.countryName}
                                  </td>
                                  <td>
                                    {j?.jobModeType?.workModeName}
                                  </td>

                                  <td>
                                    <Link
                                      className="btn-sm app-btn-secondary rounded-0 me-3"
                                      to={`/Admin/Jobs/View-Job/${j.slug}`}
                                      onClick={() => {
                                        window.location.href = `/Admin/Jobs/View-Job/${j.slug}`;
                                      }}
                                    >
                                      <EyeOutlined />
                                    </Link>

                                    <Link
                                      className="btn-sm app-btn-secondary rounded-0 me-3"
                                      to={`/Admin/Jobs/Update-Job/${j.slug}`}
                                      onClick={() => {
                                        window.location.href = `/Admin/Jobs/Update-Job/${j.slug}`;
                                      }}
                                    >
                                      <EditOutlined />
                                    </Link>

                                    <Link
                                      className="btn-sm app-btn-secondary rounded-0 me-3"
                                      to={`/Admin/Jobs/Delete-Job/${j.slug}`}
                                    >
                                      <DeleteOutlined />
                                    </Link>
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan={3} style={{ fontWeight: "300" }}>
                                No Job Found.
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
                          {pageNumbers.map((number) => (
                            <li
                              key={number}
                              className={
                                currentPage === number
                                  ? "page-item active disabled"
                                  : ""
                              }
                            >
                              <Link
                                onClick={() => pagination(number)}
                                disabled={currentPage === totalPages}
                                to="#"
                                className="page-link"
                              >
                                {number}
                              </Link>
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
              {/*=========== Registered Users Table Begins ============*/}
              <div className="row">
                <div className="col-12 grid-margin">
                  <div className="page-header">
                    <h3 className="page-title">
                      <span className="page-title-icon bg-gradient-primary text-white me-2">
                        <i className="mdi mdi-account-multiple-plus"></i>
                      </span> Resgitered Users List
                    </h3>
                    <nav aria-label="breadcrumb">
                      <ul className="breadcrumb">
                        <li className="breadcrumb-item active" aria-current="page">
                          <span></span>Overview <i className="mdi mdi-alert-circle-outline icon-sm text-primary align-middle"></i>
                        </li>
                      </ul>
                    </nav>
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
                              <th>
                                Verification Status
                              </th>
                              <th>Status</th>
                              <th>Registered Date</th>
                            </tr>
                          </thead>
                          <tbody>
                          {users.length > 0 ? (
                            users.map((u, index) => {
                              return (
                                <tr key={u._id}>
                                  <td>
                                    {index + 1}
                                  </td>
                                  <td>
                                    <span>
                                      {u.first_name} {u.last_name}
                                    </span>
                                  </td>
                                  <td>{u.email}</td>
                                  <td>{u.phone}</td>
                                  <td>
                                    {u.role === 1 ? (
                                      <td>Admin</td>
                                    ) : (
                                      <></>
                                    )}
                                    {u.role === 2 ? (
                                      <td>
                                        Employer
                                      </td>
                                    ) : (
                                      <></>
                                    )}
                                    {u.role === 0 ? (
                                      <td>
                                        Applicant
                                      </td>
                                    ) : (
                                      <></>
                                    )}
                                  </td>
                                  <td>
                                    {u?.country?.countryName}
                                  </td>
                                  <td>
                                    {u.verified ? (
                                      <>Verified</>
                                    ) : (
                                      <>Unverified</>
                                    )}
                                  </td>

                                  <td>{u.status}</td>
                                  <td>
                                    {moment(u.registeredDate).format(
                                      "ll"
                                    )}
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td
                                colSpan={3}
                                style={{ fontWeight: "300" }}
                              >
                                No User Found.
                              </td>
                            </tr>
                          )}                         
                          </tbody>
                        </table>
                      </div>
                      <nav className="app-pagination mt-4">
                        <ul class="pagination justify-content-center">
                          <li className="page-item">
                            <button
                              className="page-link"
                              onClick={prevPage}
                              disabled={currentPage === 1}
                            >
                              Previous
                            </button>
                          </li>                             
                          {pageNumbers.map((number) => (
                            <li
                              key={number}
                              className={
                                currentPage === number
                                  ? "page-item active disabled"
                                  : ""
                              }
                            >
                              <Link
                                onClick={() => pagination(number)}
                                disabled={currentPage === totalPages}
                                to="#"
                                className="page-link"
                              >
                                {number}
                              </Link>
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
            {/* Footer */}
            <Footer />
          </div>
      </div>
    </div>
  );    
};

export default TestDashboardHome;
