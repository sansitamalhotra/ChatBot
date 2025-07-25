import ChangePageTitle from "../../utils/ChangePageTitle";
import React, { Component, useRef, useEffect, useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import API from '../../helpers/API';

import { useAuth } from "../../Context/AuthContext";

import AddSectorForm from "../components/Forms/AddSectorForm";
import { EditOutlined, DeleteOutlined  } from '@ant-design/icons';
import { Form, Input, Button, Modal } from "antd";

import HeaderSidebar from "../components/HeadeSidebar";
import Footer from "../components/Footer";
import { ToastContainer, toast } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";
import { number } from "prop-types";



const ManageSectors = () => {

    const [auth, setAuth] = useAuth();
    const [numSectorsInDB, setNumSectorsInDB] = useState(0);
    const [totalSectors, setTotalSectors] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [sectorsPerPage, setSectorsPerPage] = useState(5);
    const [loading, setLoading] = useState(false);
    const [selectedSector, setSelectedSector] = useState(null);

    const navigate = useNavigate();
    const [sector, setSector] = useState("");
    const [sectors, setSectors] = useState([]);
    const [sectorName, setSectorName] = useState("");
    const [visible, setVisible] = useState(false);
    const [selected, setSelected] = useState(null);
    const [updatedName, setUpdatedName] = useState("");


    const notifyErr = (msg) => toast.error(msg, 
        {position: "top-center", autoClose: 20000, closeOnClick: true, pauseOnHover: true, theme: "light" });
    const notifySucc = (msg) => toast.success(msg, 
        {position: "top-center", autoClose: 20000, closeOnClick: true, pauseOnHover: true, theme: "light" }); 


    const handleSubmit = async (e) => {  
            e.preventDefault();
            try { 

            const { data } = await API.post("/api/v1/sector/addSector",{ sectorName });

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
              notifyErr("Opps!!! FAILED.. Something went wrong, New Sector Failed to be added.");
            }
    };

    useEffect(() => {
        fetchSectors();
        window.scrollTo({ top: 0 });
        if (window.history.pushState) {
            window.history.pushState(null, null, `/Admin/Sectors/Manage-Sectors?page=${currentPage}`);
        }
    }, [currentPage, sectorsPerPage]);

    const fetchSectors = async () => {
            try
            {
                setLoading(true);
                const response = await API.get(`/api/v1/sector/fetchAllSectors?page=${currentPage}`);
                setSectors(response.data.result);
                setTotalSectors(response.data.totalSectors);
                setNumSectorsInDB(response.data.numSectorsInDB);
                localStorage.setItem("refresh", response.data.result);
                setLoading(false);
                setSelectedSector(null);
            }
            catch (error)
            {
                console.log(error);
                setLoading(false);
                // notifyErr("Oppss!!, FAILED, Something went Wrong Retrieving all Sectors");
                notifyErr(error.response.data.message);
            }
    };

    const handleUpdate = async (e) => {

        e.preventDefault();
        try
        {
            const { data } = await API.put(`/api/v1/sector/updateSector/${selected._id}`, { sectorName: updatedName });
            if (data.success) {
                notifySucc(`${updatedName} has been Updated Successfully!!`);
                setSelected(null);
                setUpdatedName("");
                setVisible(false);
                fetchSectors();
            } else {
                notifyErr(data.message);
            }
        }
        catch (error)
        {
            console.log(error);
            notifyErr("Oppss!!, FAILED, Something went Wrong Updating This Sector Name");
        }
    };

    // Delete Sector By ID
    const handleDelete = async (cId) => {
        try
        {
            const { data } = await API.delete(`/api/v1/sector/deleteSectorById/${cId}`, { sectorName: updatedName });
            if (data.success) {
                notifySucc("Sector has been Deleted Successfully!!");
                navigate(0);
                fetchSectors();
            } else {
                notifyErr(data.message);
            }
        }
        catch (error)
        {
            console.log(error);
            notifyErr("Oppss!!, FAILED, Something went Wrong Deleting This Sector");
        }
    }

    const nextPage = () => {
        setCurrentPage(currentPage + 1);
    };
    
    const prevPage = () => {
        setCurrentPage(currentPage - 1);
    };
    
    const pagination = (pageNumber) => setCurrentPage(pageNumber);
    
    const pageNumbers = [];
    
      for (let i = 1; i <= Math.ceil(totalSectors / sectorsPerPage); i++) {
        pageNumbers.push(i);
    }

    
    return (
        <>
            <HeaderSidebar />
            <ChangePageTitle customPageTitle=" Admin Manage Sectors | Prosoft Synergies " /> 
            <div className="app-wrapper">
                <div class="app-content pt-3 p-md-3 p-lg-4">
                    <div class="container-xl">
                        <div class="row g-3 mb-4 align-items-center justify-content-between">
                            <div class="col-auto">
                                <h1 class="app-page-title mb-0">Manage Sectors</h1>
                                (<strong><span>Page {currentPage} of {" "} {numSectorsInDB} Sectors Found</span></strong>)
                            </div>
                        </div>
                        <nav id="countries-table-tab" className="countries-table-tab app-nav-tabs nav shadow-sm flex-column flex-sm-row mb-4">
                            <Link className="flex-sm-fill text-sm-center nav-link active" id="countries-all-tab" data-bs-toggle="tab" to="#countries-all" role="tab" aria-controls="countries-all" aria-selected="true">
                                Manage Sectors
                            </Link>
                            <Link className="flex-sm-fill text-sm-center nav-link"  id="add-new-country-tab" data-bs-toggle="tab" to="#add-new-country" role="tab" aria-controls="add-new-country" aria-selected="false">
                                Add New Sector
                            </Link>
                            {/* <a class="flex-sm-fill text-sm-center nav-link" id="orders-pending-tab" data-bs-toggle="tab" href="#orders-pending" role="tab" aria-controls="orders-pending" aria-selected="false">
                                Pending
                            </a> */}
                            {/* <a class="flex-sm-fill text-sm-center nav-link" id="orders-cancelled-tab" data-bs-toggle="tab" href="#orders-cancelled" role="tab" aria-controls="orders-cancelled" aria-selected="false">
                                Cancelled
                            </a> */}
                        </nav>
                        <div class="tab-content" id="countries-table-tab-content">
                            <div class="tab-pane fade show active" id="countries-all" role="tabpanel" aria-labelledby="countries-all-tab">
                                <div class="app-card app-card-countries-table shadow-sm mb-5">
                                    <div class="app-card-body">
                                        <div class="table-responsive">
                                            <table class="table app-table-hover mb-0 text-left">
                                                <thead>
                                                    <tr>
                                                        
                                                    {/* <th class="cell">Id</th> */}
                                                    <th class="cell">Sector Name</th>
                                                    <th class="cell">Sector Slug</th>
                                                    <th class="cell">Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {sectors.map((s) => {
                                                        return (
                                                            <tr key={s._id}>
                                                                <td class="cell">
                                                                    <span class="truncate">
                                                                        {s.sectorName}
                                                                    </span>
                                                                </td>
                                                                <td class="cell">{s.slug}</td>
                                                                <td class="cell">
                                                                    <button class="btn-sm app-btn-secondary rounded-0 me-3" onClick={() => {
                                                                                setVisible(true);
                                                                                setUpdatedName(s.sectorName);
                                                                                setSelected(s);
                                                                            }}>
                                                                        <EditOutlined />
                                                                    </button>
                                                                    <Button  
                                                                        onClick={() => handleDelete(s._id)} 
                                                                        className="btn-sm app-btn-secondary rounded-0"
                                                                        type="danger"
                                                                        icon={<DeleteOutlined />}
                                                                        >        
                                                                    </Button>
                                                                </td>
                                                            </tr>
                                                        )
                                                    })}
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
                                        {pageNumbers.map((number) => (
                                             <li key={number} className={currentPage === number ? "page-item active disabled" : ""}>
                                                <Link
                                                onClick={() => pagination(number)}
                                                disabled={
                                                    currentPage ===
                                                    Math.ceil(totalSectors / 5)
                                                }
                                                to="#"
                                                className="page-link"
                                                >
                                                {number}
                                                </Link>
                                             </li>
                                        ))}
                                        <li className="page-item">
                                            <button className="page-link" onClick={nextPage} disabled={ currentPage === Math.ceil(totalSectors / 5)}>Next</button>
                                        </li>
                                    </ul>
                                </nav>
                            </div>
                            <div class="tab-pane fade" id="add-new-country" role="tabpanel" aria-labelledby="add-new-country-tab">
                                <div class="app-card app-card-countries-table mb-5">
                                    <div class="app-card-body mt-5">
                                        <div class="row mt-5">
                                            <div className="col-md-10 mx-auto mt-5">
                                                <AddSectorForm handleSubmit={handleSubmit}
                                                    value={sectorName}
                                                    setValue={setSectorName} 
                                                /> 
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <Modal
                            onCancel={() => setVisible(false)}
                            footer={null}
                            open={visible}
                        >
                            <AddSectorForm value={updatedName} setValue={setUpdatedName} handleSubmit={handleUpdate} />
                        </Modal>
                    </div>
                </div>
                <Footer />
            </div>
        </>
    );

};


export default ManageSectors;