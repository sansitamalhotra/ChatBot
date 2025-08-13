import ChangePageTitle from "../../utils/ChangePageTitle";
import React, { Component, useRef, useEffect, useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import API from '../../helpers/API';

import moment from "moment";

import HeaderSidebar from "../components/HeadeSidebar";
import Footer from "../components/Footer";
import { ToastContainer, toast } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";



const Subscribers = () => {


    const [subscribers, setSubscribers] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [numSubscribersInDB, setNumSubscribersInDB] = useState(0);
    const [totalSubscribers, setTotalSubscribers] = useState(0);
    const [loading, setLoading] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const [subscribersPerPage, setSubscribersPerPage] = useState(20);

    const notifyErr = (msg) => toast.error(msg, 
        {position: "top-center", autoClose: 20000, closeOnClick: true, pauseOnHover: true, theme: "light",});
    const notifySucc = (msg) => toast.success(msg, 
        {position: "top-center", autoClose: 20000, closeOnClick: true, pauseOnHover: true, theme: "light",});


    useEffect(() => {
        const fetchAllSubscribers = async () => {
            try {
                setLoading(true);
                const response = await API.get(`/api/v1/subscribers/allSubscribers?page=${currentPage}`);
                setSubscribers(response.data.result);
                setTotalSubscribers(response.data.totalSubscribers);
                setNumSubscribersInDB(response.data.numSubscribersInDB);
                console.log("Registered Users List Number: ", response.data.numSubscribersInDB)
                localStorage.setItem("refresh", response.data.result);
                setLoading(false);
            } catch (error) {
                console.log(error);
                setLoading(false);
                notifyErr(error);
            }
        };
    
        fetchAllSubscribers();
        window.scrollTo({ top: 0 });
        if (window.history.pushState) {
            window.history.pushState(null, null, `/Admin/Subscribers/?page=${currentPage}`);
        }
    }, [currentPage, subscribersPerPage]);

    return (
        <>
        <HeaderSidebar />
        <ChangePageTitle customPageTitle="Email Subscriber | Prosoft Synergies " /> 
        <div className="app-wrapper">
                <div class="app-content pt-3 p-md-3 p-lg-4">
                    <div class="container-xl">
                        <div class="row g-3 mb-4 align-items-center justify-content-between">
                            <div class="col-auto">
                                <h1 class="app-page-title mb-0">Email Subscribers List</h1>
                            </div>
                        </div>
                        <div class="tab-content" id="countries-table-tab-content">
                            <div class="tab-pane fade show active" id="countries-all" role="tabpanel" aria-labelledby="countries-all-tab">
                                <div class="app-card app-card-countries-table shadow-sm mb-5">
                                    <div class="app-card-body">
                                        <div class="table-responsive">
                                            <table class="table app-table-hover mb-0 text-left">
                                                <thead>
                                                    <tr>
                                                    <th>No</th>
                                                    <th class="cell">Emails</th>
                                                    <th class="cell">Subscribed On</th>
                                                    
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {subscribers.map((s, index) => {
                                                        return (
                                                            <tr key={s._id}>
                                                                <td class="cell">{index + 1}</td>
                                                                <td class="cell">
                                                                    <span class="truncate">
                                                                        {s.email}
                                                                    </span>
                                                                </td>
                                                                <td class="cell">{moment(s.subscriptionDate).format('ll')}</td>
                                                            </tr>
                                                        )
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                       
                                    </div>
                                </div>
                                <nav class="app-pagination">
                                    <ul class="pagination justify-content-center">
                                        <li class="page-item disabled">
                                            <a class="page-link" href="#" tabindex="-1" aria-disabled="true">Previous</a>
                                        </li>
                                        <li class="page-item active"><a class="page-link" href="#">1</a></li>
                                        <li class="page-item"><a class="page-link" href="#">2</a></li>
                                        <li class="page-item"><a class="page-link" href="#">3</a></li>
                                        <li class="page-item">
                                            <a class="page-link" href="#">Next</a>
                                        </li>
                                    </ul>
                                </nav>
                            </div>
                        </div>
                    </div>
                </div>
                <Footer />
            </div>
        </>
    )
};


export default Subscribers