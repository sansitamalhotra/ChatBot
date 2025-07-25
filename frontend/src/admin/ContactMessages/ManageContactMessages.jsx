import ChangePageTitle from "../../utils/ChangePageTitle";
import React, { Component, useRef, useEffect, useState } from "react";
import { NavLink, Link, useParams, useNavigate } from "react-router-dom";
import API from '../../helpers/API';
import { Form, Input, Button, Modal } from "antd";

import HeaderSidebar from "../components/HeadeSidebar";
import Footer from "../components/Footer";
import { ToastContainer, toast } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";
import DOMPurify, { sanitize } from "dompurify";

import { EditOutlined, DeleteOutlined, DownloadOutlined, EyeOutlined  } from '@ant-design/icons';


const ManageContactMessages = () => {

    const params = useParams();

    const [contacts, setContacts] = useState([]);
    const [contact, setContact] = useState({});

    const [numRegContactUsFormMessagesInDB, setNumRegContactUsFormMessagesInDB] = useState(0);
    const [totalContactUsFormMessages, setTotalContactUsFormMessages] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [contactsPerPage, setContactsPerPage] = useState(10);
    const [loading, setLoading] = useState(false);
    const [full_name, setFull_Name] = useState("");
    const [lgShow, setLgShow] = useState(false);
    const [selectedContact, setSelectedContact] = useState(null);


    const navigate = useNavigate();

    const notifyErr = (msg) => toast.error(msg, 
        {position: "top-center", autoClose: 20000, closeOnClick: true, pauseOnHover: true, theme: "light" });
    const notifySucc = (msg) => toast.success(msg, 
        {position: "top-center", autoClose: 20000, closeOnClick: true, pauseOnHover: true, theme: "light" });


    useEffect(() => {
        fetchContactMessages();
        window.scrollTo({ top: 0 });
        if (window.history.pushState) {
            window.history.pushState(null, null, `/Admin/Contact-Messages/Manage-Contact-Us-Messages?page=${currentPage}`);
        }
    }, [currentPage, contactsPerPage]);

    const fetchContactMessages = async () => {
        try
        {
            setLoading(true);
            const response = await API.get(`/api/v1/contact/messages/?page=${currentPage}`);
            setContacts(response.data.result);
            setTotalContactUsFormMessages(response.data.totalContactUsFormMessages);
            setNumRegContactUsFormMessagesInDB(response.data.numRegContactUsFormMessagesInDB);
            localStorage.setItem("refresh", response.data.result);
            setLoading(false);
            selectedContact(null);
            
        }
        catch (error)
        {
            console.log(error);
            setLoading(false);
            // notifyErr("Oppss!!, FAILED, Something went Wrong Retrieving all Sectors");
            notifyErr(error.response.data.message);
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
    
      const totalPages = Math.ceil(totalContactUsFormMessages / contactsPerPage);
    
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
    
      // const pageNumbers = [];
    
      //   for (let i = 1; i <= Math.ceil(totalJobs / jobsPerPage); i++) {
      //     pageNumbers.push(i);
      // }
    
      const pageNumbers = generatePageNumbers();


    return (
        <>
            <HeaderSidebar />
            <ChangePageTitle customPageTitle=" Admin Manage Contact Us Messages | Prosoft Synergies " /> 

            <div className="app-wrapper">
                <div className="app-content pt-3 p-md-3 p-lg-4">
                    <div className="container-xl">
                        <div className="position-relative mb-3">
                            <div className="row g-3 justify-content-between mb-3">
                                <div className="col-auto">
                                    <h1 className="app-page-title mb-0">Manage Contact Form Messages</h1>
                                    (<strong><span>Page {currentPage} of {" "} {numRegContactUsFormMessagesInDB} Messages Found</span></strong>)
                                </div>
                            </div>
                            <div class="row g-3 justify-content-between">
                                <div className="app-card app-card-countries-table shadow-sm mb-5">
                                    <div className="app-card-body">
                                        <div className="table-responsive">
                                            <table className="table app-table-hover mb-0 text-left">
                                                <thead>
                                                    <tr>
                                                        <th className="cell">Full Name</th>
                                                        <th className="cell">Email</th>
                                                        <th className="cell">Subject</th>
                                                        <th className="cell">Phone</th>
                                                        <th className="cell">Message</th>
                                                        <th className="cell">Received On</th>
                                                        <th className="cell">Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {contacts.length > 0 ? (
                                                        contacts.map((c) => {
                                                            return (
                                                                <tr key={c._id}>
                                                                    <td className="cell">
                                                                        <span className="truncate">
                                                                            {c.first_name} {c.last_name}
                                                                        </span>
                                                                    </td>
                                                                    <td className="cell">
                                                                        <span className="truncate">
                                                                            {c.email}
                                                                        </span>
                                                                    </td>
                                                                    <td className="cell">
                                                                        <span className="truncate">
                                                                            {c.subject}
                                                                        </span>
                                                                    </td>
                                                                    <td className="cell">
                                                                        <span className="truncate">
                                                                            {c.phone}
                                                                        </span>
                                                                    </td>
                                                                    <td className="cell">
                                                                        <span className="truncate">
                                                                            {c.message}
                                                                            {c.message.length > 10 ? `${c.message.substring(0, 10)}...` : c.message}
                                                                        </span>
                                                                    </td>
                                                                    <td className="cell">
                                                                        
                                                                    </td>
                                                                    <td className="cell">
                                                                        <Link                                
                                                                            className="btn-sm app-btn-secondary rounded-0 me-3"
                                                                            to={`/Admin/Contact-Messages/View-Message/${c._id}`}
                                                                            >    
                                                                            <EyeOutlined />    
                                                                        </Link>
                                                                        <Link                                
                                                                            className="btn-sm app-btn-secondary rounded-0 me-3"
                                                                            to={`/Admin/Contact-Messages/Delete-Message/${c._id}`}
                                                                            >    
                                                                            <DeleteOutlined />    
                                                                        </Link>
                                                                    </td>
                                                                </tr>
                                                            )
                                                        })
                                                    ) : (
                                                        <tr>
                                                            <td colspan={5} style={{ fontWeight: "400px" }}>
                                                                <h1>No Messages Found In the Database</h1>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                                <nav className="app-pagination">
                                    <ul className="pagination justify-content-center">
                                        <li className="page-item">
                                            <button className="page-link" onClick={prevPage}
                                            disabled={currentPage === 1}>Previous</button>
                                        </li>
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
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ManageContactMessages;