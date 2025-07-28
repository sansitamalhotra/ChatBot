import ChangePageTitle from "../utils/ChangePageTitle";
import React, { Component, useRef, useEffect, useState } from "react";
import { NavLink, Link, useNavigate, useLocation } from "react-router-dom";

import { useDispatch } from 'react-redux';
import { useAuth } from "../Context/AuthContext";
import API from "../helpers/API";

import { ToastContainer, toast } from "react-toastify";
import styled from "styled-components";

import HeaderSidebar from "./components/HeadeSidebar";
import Footer from "./components/Footer";

import moment from "moment";

const AdminDashboardHome = () => {

    const [auth, setAuth] = useAuth();
    const [users, setUsers] = useState([]);
    const [userCount, setUserCount] = useState(0);

    const [jobs, setJobs] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [numJobsInDB, setNumJobsInDB] = useState(0);
    const [totalJobs, setTotalJobs] = useState(0);

    const [numRegUsersInDB, setNumRegUsersInDB] = useState(0);
    const [totalRegUsers, setTotalRegUsers] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [usersPerPage, setUsersPerPage] = useState(20);

    const [loading, setLoading] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    const [applied, setApplied] = useState(false);

    const [sectors, setSectors] = useState([]);


    const notifyErr = (msg) => toast.error(msg, 
        {position: "top-center", autoClose: 20000, closeOnClick: true, pauseOnHover: true, theme: "light",});
    const notifySucc = (msg) => toast.success(msg, 
        {position: "top-center", autoClose: 20000, closeOnClick: true, pauseOnHover: true, theme: "light",});

        const StyledContainer = styled(ToastContainer)`
        &&&.Toastify__toast-container {
        }
        .Toastify__toast {
          width: 550px !important;
          height: 200px;
          font-family: Trebuchet-ms;
          font-weight: bold;
        }
        .Toastify__toast-body {
          width: 550px !important;
          height: 200px;
          font-family: Trebuchet-ms;
        }
        .Toastify__progress-bar {    
        }
      `;
      
    
  useEffect(() => {
    const fetchAllRegUsers = async () => {
        try {
            setLoading(true);
            const response = await API.get(`/api/v1/admin/fetchRegisteredUsers?page=${currentPage}`);
            setUsers(response.data.result);
            setTotalRegUsers(response.data.totalRegUsers);
            setNumRegUsersInDB(response.data.numRegUsersInDB);
            console.log("Registered Users List Number: ", response.data.numRegUsersInDB)
            localStorage.setItem("refresh", response.data.result);
            setLoading(false);
            setSelectedUser(null);
        } catch (error) {
            console.log(error);
            setLoading(false);
            notifyErr(error);
        }
    };

    fetchAllRegUsers();
    window.scrollTo({ top: 0 });
    if (window.history.pushState) {
        window.history.pushState(null, null, `/Admin/Dashboard/?page=${currentPage}`);
    }
}, [currentPage, usersPerPage]);


const generatePageNumbers = () => {

    const maxPaginationNumbers = 5;
    const startPage = Math.max(1, currentPage - Math.floor(maxPaginationNumbers / 2));
    const endPage = Math.min(startPage + maxPaginationNumbers - 1, totalPages);
  
    return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
};

const totalPages = Math.ceil(totalRegUsers / usersPerPage);


const nextPage = () => {
    if (currentPage < totalPages) {
        setCurrentPage(currentPage + 1);
    }
};
  
const prevPage = () => {
    if (currentPage  > 1) {
        setCurrentPage(currentPage -  1);
    }
};


const pagination = (pageNumber) => setCurrentPage(pageNumber);


const pageNumbers = generatePageNumbers();


    // useEffect(() => {
    //     fetchAllJobs();
    // }, []);
        
    // const fetchAllJobs = async () => {

    //     try
    //     {
    //         const response = await API.get("/api/v1/job/fetchAllJobs");
    //         setJobs(response.data.result);
    //         setTotalJobs(response.data.totalJobs);
    //         setNumJobsInDB(response.data.numJobsInDB);
    //     }
    //     catch (error)
    //     {
    //         console.error(error);
    //         notifyErr("Opps!!, Something Went Wrong, Jobs could not be Retrieved at this Moment. Refresh the Page in A While...");
    //     }

    // };

    useEffect(() => {
        const fetchJobData = async () => {
            try {
                setLoading(true);
                const jobResponse = await API.get(
                    `/api/v1/job/fetchAllJobs`,
                    { params: { search: searchTerm } }
                );
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
    


    return (

        <>
            <ChangePageTitle customPageTitle=" Admin Dashboard Home | Prosoft Synergies " /> 

            <HeaderSidebar />
            
            <div className="app-wrapper">
                <div className="app-content pt-3 p-md-3 p-lg-4">
                    <div className="container-xl">
                        <h1 className="app-page-title">Dashboard</h1>
                        <div className="app-card alert alert-dismissible shadow-sm mb-4 border-left-decoration" role="alert">
                            <div className="inner">
                                <div className="app-card-body p-3 p-lg-4">
                                    <h3 className="mb-3">Welcome {auth?.user.firstname} {auth?.user?.lastname}! <span>Admin User</span></h3>
                                    <div className="row gx-5 gy-3">
                                        <div className="col-12 col-lg-9">
                                            <div>
                                                Here You can effectively manage all the administrative resources by utilizing the functionalities of creating, reading, updating, or deleting.                                            
                                            </div>
                                        </div>
                                        <div className="col-12 col-lg-3">
                                            <Link className="btn app-btn-primary rounded-0" to="/Admin/Jobs/Manage-Jobs">
                                                <svg width="1em" height="1em" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor" className="bi bi-arrow-right me-2">
                                                    <path fill-rule="evenodd" d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8"/>
                                                </svg>
                                                Go To Admin Jobs
                                            </Link>
                                        </div>
                                    </div>
                                    <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                                </div>
                            </div>
                        </div>
                        <div className="row g-4 mb-4">
                            <div className="col-6 col-lg-4">
                                <div className="app-card app-card-stat shadow-sm h-100">
                                    <div className="app-card-body p-3 p-lg-4">
                                        <h4 className="stats-type mb-1">Total Active Jobs</h4>
                                        <div className="stats-figure">{numJobsInDB}</div>
                                    </div>
                                    <Link className="app-card-link-mask" to="/Admin/Jobs/Manage-Jobs"></Link>
                                </div>
                            </div>
                            <div className="col-6 col-lg-4">
                                <div className="app-card app-card-stat shadow-sm h-100">
                                    <div className="app-card-body p-3 p-lg-4">
                                        <h4 className="stats-type mb-1">Registered Users</h4>
                                        <div className="stats-figure">{numRegUsersInDB}</div>
                                    </div>
                                    <Link className="app-card-link-mask" to="/Admin/Users"></Link>
                                </div>
                            </div>
                            <div className="col-6 col-lg-4">
                                <div className="app-card app-card-stat shadow-sm h-100">
                                    <div className="app-card-body p-3 p-lg-4">
                                        <h4 className="stats-type mb-1">Applied Jobs</h4>
                                        <div className="stats-figure">1225</div>
                                    </div>
                                    <Link className="app-card-link-mask" href="/Admin/Applied-Jobs"></Link>
                                </div>
                            </div>
                        </div>
                        <div className="row g-4 mb-4">
                            <div className="col-12 col-lg-12">
                                <div className="app-card app-card-progress-list h-100 shadow-sm">
                                    <div className="app-card-header p-3">
                                    <div className="row justify-content-between align-items-center">
                                            <div className="col-auto">
                                                <h4 className="app-card-title mb-5">Registered Users</h4>
                                            </div>
                                            <div className="col-auto">
                                                <div className="card-header-action">
                                                    <Link to="#">View Registered Users</Link>
                                                </div>
                                            </div>
                                            <div className="tab-content" id="countries-table-tab-content">
                                                <div className="tab-pane fade show active" id="countries-all" role="tabpanel" aria-labelledby="countries-all-tab">
                                                    <div className="app-card app-card-countries-table shadow-sm mb-5">
                                                        <div className="app-card-body">
                                                            <div className="table-responsive">
                                                                <table className="table app-table-hover mb-0 text-left">
                                                                    <thead>
                                                                        <tr>
                                                                            
                                                                        <th class="cell">No:</th>
                                                                        <th className="cell">Full Name</th>
                                                                        <th className="cell">Email</th>
                                                                        <th className="cell">Phone</th>
                                                                        <th className="cell">Role</th>
                                                                        <th className="cell">Country</th>
                                                                        <th className="cell">Blocked Status</th>
                                                                        <th className="cell">Verification Status</th>
                                                                        <th className="cell">Status</th>
                                                                        <th className="cell">Registered Date</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                    {users.length > 0 ? (
                                                                        users.map((u, index) => {
                                                                            return (
                                                                                <tr key={u._id}>
                                                                                    <td className="cell">{index + 1}</td>
                                                                                    <td className="cell">
                                                                                        <span className="truncate">{u.firstname} {u.lastname}</span>
                                                                                    </td>
                                                                                    <td className="cell">{u.email}</td>
                                                                                    <td className="cell">{u.phone}</td>
                                                                                    <td className="cell">
                                                                                        {u.role === 1 ? (
                                                                                        <td className="cell">Admin</td>) : ( <></>)}
                                                                                        {u.role === 2 ? (<td className="cell">Employer</td>) : (<></>)}
                                                                                        {u.role === 0 ? (<td className="cell">Applicant</td>) : (<></>)}
                                                                                    </td>
                                                                                    <td className="cell">{u?.country?.countryName}</td>
                                                                                    <td className="cell">{u.isBlocked === true ? "Blocked" : "Not Blocked"}</td>
                                                                                    {/* <td className="cell">{u.verified}</td> */}
                                                                                    <td className="cell">
                                                                                        {u.isVerified ? (<>Verified</>) : (<>Unverified</>)}
                                                                                    </td>
                                                                                    
                                                                                    <td className="cell">{u.status}</td>
                                                                                    <td className="cell">{moment(u.registeredDate).format('ll')}</td>
                                                                                </tr>
                                                                            )
                                                                        })
                                                                    ) : (
                                                                        <tr>
                                                                            <td colSpan={3} style={{ fontWeight: '300' }}>
                                                                                No User Found.
                                                                            </td>
                                                                        </tr>
                                                                    )}
                                                                    </tbody>
                                                                </table>
                                                            </div>      
                                                        </div>
                                                    </div>
                                                    <nav className="app-pagination">
                                                        <ul class="pagination justify-content-center">
                                                            <li className="page-item">
                                                                <button className="page-link" onClick={prevPage}
                                                                disabled={currentPage === 1}>Previous</button>
                                                            </li>
                                                            {/* {pageNumbers.map((number) => (
                                                                <li key={number} className={currentPage === number ? "page-item active disabled" : ""}>
                                                                    <Link
                                                                    onClick={() => pagination(number)}
                                                                    disabled={
                                                                        currentPage ===
                                                                        Math.ceil(numRegUsersInDB / 20)
                                                                    }
                                                                    to="#"
                                                                    className="page-link"
                                                                    >
                                                                    {number}
                                                                    </Link>
                                                                </li>
                                                            ))} */}

                                                            {pageNumbers.map((number) => (
                                                                <li key={number} className={currentPage === number ? "page-item active disabled" : ""}>
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
                                                                <button className="page-link" onClick={nextPage} disabled={currentPage === totalPages}>Next</button>
                                                            </li>
                                                        </ul>
                                                    </nav>
                                                </div>
                                                <div className="tab-pane fade" id="add-new-country" role="tabpanel" aria-labelledby="add-new-country-tab">
                                                    <div className="app-card app-card-countries-table mb-5">
                                                        <div className="app-card-body mt-5">
                                                            <div className="row mt-5">
                                                                <div className="col-md-9 mx-auto mt-5">
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-12 col-lg-12">
                                <div class="app-card app-card-progress-list h-100 shadow-sm">
                                    <div class="app-card-header p-3">
                                        <div class="row justify-content-between align-items-center">
                                            <div class="col-auto">
                                                <h4 class="app-card-title">Recently Posted Jobs</h4>
                                            </div>
                                            <div class="col-auto">
                                                <div class="card-header-action">
                                                    <a href="#">View All Active Jobs</a>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-12 col-lg-12">
                                <div class="app-card app-card-progress-list h-100 shadow-sm">
                                    <div class="app-card-header p-3">
                                        <div class="row justify-content-between align-items-center">
                                            <div class="col-auto">
                                                <h4 class="app-card-title">Recently Applied Jobs</h4>
                                            </div>
                                            <div class="col-auto">
                                                <div class="card-header-action">
                                                    <a href="#">View All Applied Jobs</a>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <Footer />
                <StyledContainer />
            </div>
        </>
    );
};

export default AdminDashboardHome;