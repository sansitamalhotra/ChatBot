import React, { useEffect, useState, useRef } from 'react';
import { Link, useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import API from '../../../helpers/API';

import { LogoutLink } from '../../Logout/Logout';
import { LogoutNavbarLink } from '../../Logout/LogoutNavbar';

import {
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
} from "@ant-design/icons";

import Modal from "react-bootstrap/Modal";

import { DemoContainer } from "@mui/x-date-pickers/internals/demo";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";

import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


import $ from 'jquery';
import 'bootstrap/dist/js/bootstrap.bundle.min';
import '../assets/vendors/mdi/css/materialdesignicons.min.css';
import '../assets/vendors/ti-icons/css/themify-icons.css';
import '../assets/vendors/css/vendor.bundle.base.css';
import '../assets/vendors/font-awesome/css/font-awesome.min.css';
import '../assets/vendors/bootstrap-datepicker/bootstrap-datepicker.min.css';
import '../assets/css/style.css';

// Fixed imports - import default exports
import initOffCanvas from '../assets/js/off-canvas';
import misc from '../assets/js/misc';
import settings from '../assets/js/settings';
import todolist from '../assets/js/todolist';

import LogoSvg from '../assets/images/Test-Logo.png';
import LogoSvgMini from '../assets/images/Test-Logo-Mini.png';


import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import { SidebarOpen } from 'lucide-react';


const ManageTestJobs = ({ userId }) => {
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
  const [title, setTitle] = useState("");
  const [filePath, setFilePath] = useState(null);
  const filePathInputRef = useRef(null);

  const [isProBannerVisible, setIsProBannerVisible] = useState(true);

  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [messageDropdownOpen, setMessageDropdownOpen] = useState(false);

  const toggleProfileDropdown = () => {
    setProfileDropdownOpen(!profileDropdownOpen);
    if (messageDropdownOpen) setMessageDropdownOpen(false);
  };

  const toggleMessageDropdown = () => {
    setMessageDropdownOpen(!messageDropdownOpen);
    if (profileDropdownOpen) setProfileDropdownOpen(false);
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

  const closeBanner = () => {
    setIsProBannerVisible(false);
  };

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);

  // Toggle dropdowns
  

  const toggleNotificationDropdown = () => {
    setNotificationDropdownOpen(!notificationDropdownOpen);
    setProfileDropdownOpen(false);
    setMessageDropdownOpen(false);
  };

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
  }, []);


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
    
    // FIXED: Changed API endpoint to frontend route
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

  const aadminJobMatrixDownload = async (slug) => {
    try {
      const res = await API.get(`/api/v1/job/downloadFile/${slug}`, {
        responseType: "blob" // Make sure the backend is sending the file as a blob
      });

      if (res.status !== 200) {
        throw new Error("Failed to download file");
      }

      const blob = new Blob([res.data], { type: res.headers["content-type"] });
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = slug; // Ensure job.provinceFile is available or set default
      link.click();

      // Notify success
      notifySucc("Matrix File Downloaded Successfully!!!");
    } catch (error) {
      console.error("Download Error:", error);
      notifyErr("Matrix File Download Failed!!!", error.message);
    }
  };

  const handleAddJobSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("filePath", filePathInputRef.current.files[0]);

      const response = await API.post("/api/v1/job/addJob", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Max-Age": 86400
        }
      });
      notifySucc(response.data);
      navigate("/Test-Admin/Dashboard");
    } catch (error) {
      console.error("Something Went Wrong, Failed to Add New Job", error);
      notifyErr(
        "Opps!!! FAILED.. Something went wrong, New Job Failed to be added."
      );
    }
  };

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

  // Delete Job
  const handleDeleteJobSubmit = async () => {
    try {
      let answer = window.prompt("Are You Sure You Want to DELETE This Job?");

      if (!answer) return;
      await API.delete(`/api/v1/job/deleteJob/${params.id}`);
      notifySucc("Job Has Been Deleted Successfully...");
      navigate("/Test-Admin/Dashboard");
    } catch (error) {
      console.log(error);
      notifyErr("Opps!!! FAILED.. Something went wrong, Job DELETE Failed.");
    }
  };


    return (
      <div className="container-scroller">
        <Helmet>
          <link rel="canonical" href={canonicalUrl} />
          <title>Admin Manage Jobs| ThinkBeyond</title>
          <meta name="description" content="Admin Manage Jobs| ThinkBeyond" />
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
                    <i className="mdi mdi-briefcase"></i>
                  </span> Manage Jobs
                </h3>
                <strong>
                    <span>
                      Page {currentPage} of {numJobsInDB} Jobs Found
                    </span>
                </strong>
              </div>            
              {/* Stats Cards */}      
              {/* Recent Tickets Table */}
              <div className="row">
                <div className="col-12 grid-margin">
                  <div className="card">
                    <div className="card-body">
                      <h4 className="card-title">List Of Posted Jobs</h4>
                      <div className="table-responsive">
                        <table className="table">
                          <thead>
                            <tr>
                            <th>No.</th>
                            <th>Title</th>
                            <th>Qualification</th>
                            <th>Experience</th>
                            <th>Country</th>
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
                                    {j?.qualification?.qualificationName}
                                  </td>
                                  <td>
                                    {j?.workExperience?.workExperienceName}
                                  </td>
                                  <td>
                                    {j?.country?.countryName}
                                  </td>
                                  <td>
                                    {j?.workMode?.workModeName}
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
            </div>            
            {/* Footer */}
            <Footer />
          </div>
      </div>
    </div>
  );    
};

export default ManageTestJobs;
