import React, { useEffect, useState, useRef } from 'react';
import { Link, useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import API from '../../../helpers/API';

import { LogoutLink } from '../../Logout/Logout';
import { LogoutNavbarLink } from '../../Logout/LogoutNavbar';

import AddTestSectorForm from './AddTestSectorForm';

import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { Button, Modal } from "antd";

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

const ManageAdminTestSectors = () => {
  const canonicalUrl = window.location.href; // Get the current URL/ =========================================

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

  const [lgShow, setLgShow] = useState(false);

  const editorRef = useRef(null);

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
// =================
const [numSectorsInDB, setNumSectorsInDB] = useState(0);
const [totalSectors, setTotalSectors] = useState(0);
const [currentPage, setCurrentPage] = useState(1);
const [sectorsPerPage, setSectorsPerPage] = useState(15);
const [loading, setLoading] = useState(false);
const [selectedSector, setSelectedSector] = useState(null);

const [sectors, setSectors] = useState([]);
const [sectorName, setSectorName] = useState("");
const [visible, setVisible] = useState(false);
const [selected, setSelected] = useState(null);
const [updatedName, setUpdatedName] = useState("");

const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await API.post("/api/v1/sector/addSector", { sectorName });

      if (data.success) {
        notifySucc(`New Sector: ${sectorName} has been Added Successfully!!`);
        setSectorName("");
        navigate(0);
        fetchSectors();
      } else {
        notifyErr(data.message);
      }
    } catch (error) {
      console.log(error);
      notifyErr(
        "Opps!!! FAILED.. Something went wrong, New Sector Failed to be added."
      );
    }
  };

  useEffect(() => {
    fetchSectors();
    window.scrollTo({ top: 0 });
    if (window.history.pushState) {
      window.history.pushState(
        null,
        null,
        `/Admin/Manage-Sectors?page=${currentPage}`
      );
    }
  }, [currentPage, sectorsPerPage]);

  const fetchSectors = async () => {
    try {
      setLoading(true);
      const response = await API.get(
        `/api/v1/sector/fetchAllSectors?page=${currentPage}`
      );
      setSectors(response.data.result);
      setTotalSectors(response.data.totalSectors);
      setNumSectorsInDB(response.data.numSectorsInDB);
      localStorage.setItem("refresh", response.data.result);
      setLoading(false);
      setSelectedSector(null);
    } catch (error) {
      console.log(error);
      setLoading(false);
      notifyErr(error.response.data.message);
    }
  };
  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const { data } = await API.put(`/api/v1/sector/updateSector/${selected._id}`, {
        sectorName: updatedName
      });
      if (data.success) {
        notifySucc(`${updatedName} has been Updated Successfully!!`);
        setSelected(null);
        setUpdatedName("");
        setVisible(false);
        fetchSectors();
      } else {
        notifyErr(data.message);
      }
    } catch (error) {
      console.log(error);
      notifyErr(
        "Oppss!!, FAILED, Something went Wrong Updating This Sector Name"
      );
    }
  };
  // Delete Sector By ID
  const handleDelete = async (cId) => {
    try {
      const { data } = await API.delete(`/api/v1/sector/deleteSectorById/${cId}`, {
        sectorName: updatedName
      });
      if (data.success) {
        notifySucc("Sector has been Deleted Successfully!!");
        navigate(0);
        fetchSectors();
      } else {
        notifyErr(data.message);
      }
    } catch (error) {
      console.log(error);
      notifyErr("Oppss!!, FAILED, Something went Wrong Deleting This Sector");
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
  const totalPages = Math.ceil(totalSectors / sectorsPerPage);
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


    return (
      <div className="container-scroller">
        <Helmet>
          <link rel="canonical" href={canonicalUrl} />
          <title>Admin Manage Sectors | ThinkBeyond</title>
          <meta name="description" content="Admin Manage Sectors | ThinkBeyond" />
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
                    <i className="mdi mdi-format-list-bulleted-type"></i>
                  </span> Manage Sectors
                </h3>
                <strong>
                    <span>
                      {/* Page {currentPage} of {numJobsInDB} Jobs Found */}
                      <Link to="/Admin/Add-Sector" className='btn btn-success'>Add New</Link>
                    </span>
                </strong>
              </div>            
              {/* Stats Cards */}      
              {/* Recent Tickets Table */}
              <div className="row">
                <div className="col-12 grid-margin">
                  <div className="card">
                    <div className="card-body">
                      <h4 className="card-title">List Of Job Sectors</h4>
                      <div className="table-responsive">
                        <table className="table">
                          <thead>
                            <tr>
                             <th>Sector Name</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sectors.map((s) => {
                                return (
                                <tr key={s._id} className="tableRow">
                                    <td class="cell">
                                    <span class="truncate">{s.sectorName}</span>
                                    </td>
                                    {/* <td class="cell">{s.slug}</td> */}
                                    <td class="cell actionsBTN">
                                    <button
                                        class="btn btn-sm btn-outline-primary rounded-5 me-3"
                                        onClick={() => {
                                        setVisible(true);
                                        setUpdatedName(s.sectorName);
                                        setSelected(s);
                                        }}
                                    >
                                        <EditOutlined />
                                    </button>
                                    <Button
                                        onClick={() => handleDelete(s._id)}
                                        className="btn btn-sm btn-outline-secondary rounded-5"
                                        type="danger"
                                        icon={<DeleteOutlined />}
                                    ></Button>
                                    </td>
                                </tr>
                                );
                            })}                                             
                          </tbody>
                        </table>
                      </div>
                      <nav className="app-pagination mt-5">
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
                    <Modal
                      onCancel={() => setVisible(false)}
                      footer={null}
                      open={visible}
                    >
                      <AddTestSectorForm
                        value={updatedName}
                        setValue={setUpdatedName}
                        handleSubmit={handleUpdate}
                      />
                    </Modal>
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

export default ManageAdminTestSectors;
