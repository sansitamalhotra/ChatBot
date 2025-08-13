import ChangePageTitle from "../../utils/ChangePageTitle";
import React, { Component, useRef, useEffect, useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import API from '../../helpers/API';

import AddWorkAuthorizationForm from "../components//Forms/AddWorkAuthorizationForm";
import { EditOutlined, DeleteOutlined  } from '@ant-design/icons';
import { Form, Input, Button, Modal } from "antd";

import HeaderSidebar from "../components/HeadeSidebar";
import Footer from "../components/Footer";
import { ToastContainer, toast } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";



const ManageWorkAuthorizations = () => {

    const navigate = useNavigate();
    const [workAuthorization, setWorkAuthorization] = useState("");
    const [workAuthorizations, setWorkAuthorizations] = useState([]);
    const [workAuthorizationName, setWorkAuthorizationName] = useState("");
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

            const { data } = await API.post("/api/v1/workAuthorization/addWorkAuthorization",{ workAuthorizationName });

              if (data.success) {
                notifySucc(`New Work Authorization: ${workAuthorizationName} has been Added Successfully!!`);
                setWorkAuthorizationName("");
                navigate(0);
                fetchWorkAuthorizations();                
              } else {
                notifyErr(data.message);
              }
            } catch (error) {
              console.log(error);
              notifyErr("Opps!!! FAILED.. Something went wrong, New Work Authorization Failed to be added.");
            }
    };

    useEffect(() => {
        fetchWorkAuthorizations();
    }, []);

    const fetchWorkAuthorizations = async () => {
            try
            {
                const { data } = await API.get("/api/v1/workAuthorization/fetchWorkAuthorizations");
                if (data?.success) {
                    setWorkAuthorizations(data?.workAuthorization);
                }
            }
            catch (error)
            {
                console.log(error);
                notifyErr("Oppss!!, FAILED, Something went Wrong Retrieving all Work Authorizations");
            }
    };

    const handleUpdate = async (e) => {

        e.preventDefault();
        try
        {
            const { data } = await API.put(`/api/v1/workAuthorization/updateWorkAuthorization/${selected._id}`, { workAuthorizationName: updatedName });
            if (data.success) {
                notifySucc(`${updatedName} has been Updated Successfully!!`);
                setSelected(null);
                setUpdatedName("");
                setVisible(false);
                fetchWorkAuthorizations();
            } else {
                notifyErr(data.message);
            }
        }
        catch (error)
        {
            console.log(error);
            notifyErr("Oppss!!, FAILED, Something went Wrong Updating This Work Authorization Type");
        }
    };

    // Delete Work Authorization By ID
    const handleDelete = async (waId) => {
        try
        {
            const { data } = await API.delete(`/api/v1/workAuthorization/deleteWorkAuthorizationById/${waId}`, { workAuthorizationName: updatedName });
            if (data.success) {
                notifySucc("Work Authorization has been Deleted Successfully!!");
                navigate(0);
                fetchWorkAuthorizations();
            } else {
                notifyErr(data.message);
            }
        }
        catch (error)
        {
            console.log(error);
            notifyErr("Oppss!!, FAILED, Something went Wrong Deleting This Work Authorization");
        }
    }

    
    return (
        <>
            <HeaderSidebar />
            <ChangePageTitle customPageTitle=" Admin Manage Work Authorizations | Prosoft Synergies " /> 
            <div className="app-wrapper">
                <div class="app-content pt-3 p-md-3 p-lg-4">
                    <div class="container-xl">
                        <div class="row g-3 mb-4 align-items-center justify-content-between">
                            <div class="col-auto">
                                <h1 class="app-page-title mb-0">Manage Work Authorizations</h1>
                            </div>
                        </div>
                        <nav id="countries-table-tab" className="countries-table-tab app-nav-tabs nav shadow-sm flex-column flex-sm-row mb-4">
                            <Link className="flex-sm-fill text-sm-center nav-link active" id="countries-all-tab" data-bs-toggle="tab" to="#countries-all" role="tab" aria-controls="countries-all" aria-selected="true">
                                Manage Work Authorizations
                            </Link>
                            <Link className="flex-sm-fill text-sm-center nav-link"  id="add-new-country-tab" data-bs-toggle="tab" to="#add-new-country" role="tab" aria-controls="add-new-country" aria-selected="false">
                                Add New Work Authorization
                            </Link>
                        </nav>
                        <div class="tab-content" id="countries-table-tab-content">
                            <div class="tab-pane fade show active" id="countries-all" role="tabpanel" aria-labelledby="countries-all-tab">
                                <div class="app-card app-card-countries-table shadow-sm mb-5">
                                    <div class="app-card-body">
                                        <div class="table-responsive">
                                            <table class="table app-table-hover mb-0 text-left">
                                                <thead>
                                                    <tr>
                                                    <th class="cell">Work Authorization Type</th>
                                                    <th class="cell">Slug</th>
                                                    <th class="cell">Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {workAuthorizations.map((wa) => {
                                                        return (
                                                            <tr key={wa._id}>
                                                                <td class="cell">
                                                                    <span class="truncate">
                                                                        {wa.workAuthorizationName}
                                                                    </span>
                                                                </td>
                                                                <td class="cell">{wa.slug}</td>
                                                                <td class="cell">
                                                                    <button class="btn-sm app-btn-secondary rounded-0 me-3" onClick={() => {
                                                                                setVisible(true);
                                                                                setUpdatedName(wa.workAuthorizationName);
                                                                                setSelected(wa);
                                                                            }}>
                                                                        <EditOutlined />
                                                                    </button>
                                                                    <Button  
                                                                        onClick={() => handleDelete(wa._id)} 
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
                            <div class="tab-pane fade" id="add-new-country" role="tabpanel" aria-labelledby="add-new-country-tab">
                                <div class="app-card app-card-countries-table mb-5">
                                    <div class="app-card-body mt-5">
                                        <div class="row mt-5">
                                            <div className="col-md-10 mx-auto mt-5">
                                                <AddWorkAuthorizationForm handleSubmit={handleSubmit}
                                                    value={workAuthorizationName}
                                                    setValue={setWorkAuthorizationName} 
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
                            <AddWorkAuthorizationForm value={updatedName} setValue={setUpdatedName} handleSubmit={handleUpdate} />
                        </Modal>
                    </div>
                </div>
                <Footer />
            </div>
        </>
    );

};


export default ManageWorkAuthorizations;