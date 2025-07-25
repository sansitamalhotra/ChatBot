
import React, { useEffect, useState, useRef } from 'react';
import { Link, useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import API from '../../../helpers/API';

import { LogoutLink } from '../../Logout/Logout';
import { LogoutNavbarLink } from '../../Logout/LogoutNavbar';

import AddTestProvinceForm from './AddTestProvinceForm';
import DeleteProvinceModal from './DeleteProvinceModal'; // Import the new component

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
import { SidebarOpen } from 'lucide-react';

const ManageAdminTestProvinces = () => {
  const canonicalUrl = window.location.href;

  // ... all your existing state variables ...
  const [isProBannerVisible, setIsProBannerVisible] = useState(true);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [messageDropdownOpen, setMessageDropdownOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);
  const [lgShow, setLgShow] = useState(false);
  const editorRef = useRef(null);
  const navigate = useNavigate();

  // Province related states
  const [provinces, setProvinces] = useState([]);
  const [provinceName, setProvinceName] = useState("");
  const [country, setCountry] = useState("");
  const [countries, setCountries] = useState([]);
  const [visible, setVisible] = useState(false);
  const [selected, setSelected] = useState(null);
  const [updatedName, setUpdatedName] = useState("");
  const [numProvincesInDB, setNumProvincesInDB] = useState(0);
  const [totalProvinces, setTotalProvinces] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [provincesPerPage, setProvincesPerPage] = useState(5);
  const [loading, setLoading] = useState(false);
  const [selectedProvince, setSelectedProvince] = useState(null);

  // Delete modal states
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [provinceToDelete, setProvinceToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ... all your existing functions (toggles, effects, etc.) ...

  const toggleProfileDropdown = () => {
    setProfileDropdownOpen(!profileDropdownOpen);
    if (messageDropdownOpen) setMessageDropdownOpen(false);
  };

  const toggleMessageDropdown = () => {
    setMessageDropdownOpen(!messageDropdownOpen);
    if (profileDropdownOpen) setProfileDropdownOpen(false);
  };

  const toggleNotificationDropdown = () => {
    setNotificationDropdownOpen(!notificationDropdownOpen);
    setProfileDropdownOpen(false);
    setMessageDropdownOpen(false);
  };

  const toggleMinimize = () => {
    $('body').toggleClass('sidebar-icon-only');
  };

  const toggleMobileSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeBanner = () => {
    setIsProBannerVisible(false);
  };

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

  // ... all your existing useEffect hooks ...

  useEffect(() => {
    initOffCanvas();
    misc();
    settings();
    todolist();
    
    $('[data-toggle="minimize"]').on('click', function() {
      $('body').toggleClass('sidebar-icon-only');
    });

    $('[data-toggle="offcanvas"]').on('click', function() {
      $('.sidebar-offcanvas').toggleClass('active');
    });

    $('#fullscreen-button').on('click', function() {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        document.documentElement.requestFullscreen();
      }
    });
  }, []);

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
    fetchCountries();
  }, []);

  useEffect(() => {
    fetchProvinces();
    window.scrollTo({ top: 0 });
    if (window.history.pushState) {
      window.history.pushState(
        null,
        null,
        `/Admin/Manage-Provinces?page=${currentPage}`
      );
    }
  }, [currentPage, provincesPerPage]);

  // ... all your existing API functions ...

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const config = { headers: { "Content-Type": "application/json" } };
      const data = { provinceName, country };

      const res = await API.post(`/api/v1/province/addProvince`, data, config);

      if (res.data.success) {
        setProvinceName("");
        notifySucc(
          `New Province: ${provinceName} has been Added Successfully!!`
        );
        navigate(0);
      } else {
        notifyErr(data.message);
      }
    } catch (error) {
      console.log(error);
      notifyErr(error.response.data.message);
    }
  };

  const fetchCountries = async () => {
    try {
      const { data } = await API.get("/api/v1/country/fetchCountries");
      if (data?.success) {
        setCountries(data?.country);
      }
    } catch (error) {
      console.log(error);
      notifyErr(
        "Oppss!!, FAILED, Something went Wrong Retrieving all Countries"
      );
    }
  };

  const fetchProvinces = async () => {
    try {
      setLoading(true);
      const response = await API.get(
        `/api/v1/province/fetchProvinces?page=${currentPage}`
      );
      setProvinces(response.data.result);
      setTotalProvinces(response.data.totalProvinces);
      setNumProvincesInDB(response.data.numProvincesInDB);
      localStorage.setItem("refresh", response.data.result);
      setLoading(false);
      setSelectedProvince(null);
    } catch (error) {
      console.log(error);
      setLoading(false);
      notifyErr(error.response.data.message);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const { data } = await API.put(
        `/api/v1/province/updateProvince/${selected._id}`,
        { provinceName: updatedName }
      );
      if (data.success) {
        notifySucc(`${updatedName} has been Updated Successfully!!`);
        setSelected(null);
        setUpdatedName("");
        setVisible(false);
        fetchProvinces();
      } else {
        notifyErr(data.message);
      }
    } catch (error) {
      console.log(error);
      notifyErr(
        "Oppss!!, FAILED, Something went Wrong Updating This Province Name"
      );
    }
  };

  // Updated delete functions
  const showDeleteModal = (province) => {
    setProvinceToDelete(province);
    setDeleteModalVisible(true);
  };

 const handleDeleteConfirm = async () => {
    if (!provinceToDelete) return;
    
    try {
        setDeleteLoading(true);
        
        // Debug log
        console.log('Attempting to delete province:', provinceToDelete._id);
        
        const { data } = await API.delete(`/api/v1/province/deleteProvinceById/${provinceToDelete._id}`);
        
        if (data.success) {
            notifySucc(data.message);
            setDeleteModalVisible(false);
            setProvinceToDelete(null);
            fetchProvinces();
        } else {
            notifyErr(data.message);
        }
    } catch (error) {
        console.log('Delete error:', error);
        
        // More detailed error handling
        if (error.response) {
            // Server responded with error status
            console.log('Error status:', error.response.status);
            console.log('Error data:', error.response.data);
            notifyErr(error.response.data.message || `Server error: ${error.response.status}`);
        } else if (error.request) {
            // Request was made but no response
            console.log('No response received:', error.request);
            notifyErr("No response from server. Please check your connection.");
        } else {
            // Something else happened
            console.log('Error message:', error.message);
            notifyErr(error.message || "An unexpected error occurred");
        }
    } finally {
        setDeleteLoading(false);
    }
};

  const handleDeleteCancel = () => {
    setDeleteModalVisible(false);
    setProvinceToDelete(null);
  };

  // ... pagination functions ...
  const nextPage = () => {
    setCurrentPage(currentPage + 1);
  };

  const prevPage = () => {
    setCurrentPage(currentPage - 1);
  };

  const pagination = (pageNumber) => setCurrentPage(pageNumber);

  const pageNumbers = [];
  for (let i = 1; i <= Math.ceil(totalProvinces / provincesPerPage); i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="container-scroller">
      <Helmet>
        <link rel="canonical" href={canonicalUrl} />
        <title>Admin Manage Provinces | ThinkBeyond</title>
        <meta name="description" content="Admin Manage Provinces | ThinkBeyond" />
      </Helmet>
      
      <Navbar 
        toggleMinimize={toggleMinimize} 
        toggleMobileSidebar={toggleMobileSidebar} 
      />
      
      <div className="container-fluid page-body-wrapper">
        <Sidebar isOpen={sidebarOpen} />
        
        <div className="main-panel">
          <div className="content-wrapper">
            <div className="page-header">
              <h3 className="page-title">
                <span className="page-title-icon bg-gradient-primary text-white me-2">
                  <i className="mdi mdi-map-marker-circle"></i>
                </span> Manage Provinces
              </h3>
              <strong>
                <span>                      
                  <Link to="/Admin/Add-Province" className='btn btn-success'>Add New</Link>
                </span>
              </strong>
            </div>
            
            <div className="row">
              <div className="col-12 grid-margin">
                <div className="card">
                  <div className="card-body">
                    <h4 className="card-title">List Of Provinces / State</h4>
                    <div className="table-responsive">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Province / State Name</th>
                            <th>Province Slug</th>
                            <th>Country</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {provinces.length > 0 ? (
                            provinces.map((p) => {
                              return (
                                <tr key={p._id}>
                                  <td>
                                    <span className="truncate">
                                      {p.provinceName}
                                    </span>
                                  </td>
                                  <td>{p.slug}</td>
                                  <td>
                                    <strong>{p?.country?.countryName}</strong>
                                  </td>
                                  <td>
                                    <button
                                      className="btn btn-sm btn-outline-primary rounded-5 me-3"
                                      onClick={() => {
                                        setVisible(true);
                                        setUpdatedName(p.provinceName);
                                        setSelected(p);
                                      }}
                                    >
                                      <EditOutlined />
                                    </button>
                                    <Button
                                      onClick={() => showDeleteModal(p)}
                                      className="btn btn-sm btn-outline-danger rounded-5"
                                      type="danger"
                                      icon={<DeleteOutlined />}
                                      title={`Delete ${p.provinceName}`}
                                    />
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan={4} style={{ fontWeight: "300" }}>
                                No Province Added Yet...
                              </td>
                            </tr>
                          )}                                                
                        </tbody>
                      </table>
                    </div>
                    
                    {/* Pagination */}
                    <nav className="app-pagination">
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
                              disabled={
                                currentPage === Math.ceil(totalProvinces / 5)
                              }
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
                            disabled={currentPage === Math.ceil(totalProvinces / 5)}
                          >
                            Next
                          </button>
                        </li>
                      </ul>
                    </nav>
                  </div>
                  
                  {/* Edit Modal */}
                  <Modal
                    onCancel={() => setVisible(false)}
                    footer={null}
                    open={visible}
                  >
                    <AddTestProvinceForm
                      value={updatedName}
                      setValue={setUpdatedName}
                      handleSubmit={handleUpdate}
                    />
                  </Modal>
                  
                  {/* Delete Modal Component */}
                  <DeleteProvinceModal
                    visible={deleteModalVisible}
                    onConfirm={handleDeleteConfirm}
                    onCancel={handleDeleteCancel}
                    province={provinceToDelete}
                    loading={deleteLoading}
                  />
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

export default ManageAdminTestProvinces;
