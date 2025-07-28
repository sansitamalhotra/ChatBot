import ChangePageTitle from "../../utils/ChangePageTitle";
import React, { Component, useRef, useEffect, useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import API from '../../helpers/API';
import AddQualificationForm from "../components/Forms/AddQualificationForm";
import { EditOutlined, DeleteOutlined  } from '@ant-design/icons';
import { Form, Input, Button, Modal } from "antd";

import HeaderSidebar from "../components/HeadeSidebar";
import Footer from "../components/Footer";
import { ToastContainer, toast } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";



const ManageQualifications = () => {

    const navigate = useNavigate();
    const [qualification, setQualification] = useState("");
    const [qualifications, setQualifications] = useState([]);
    const [qualificationName, setQualificationName] = useState("");
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

            const { data } = await API.post("/api/v1/qualification/addQualification",{ qualificationName });

              if (data.success) {
                notifySucc(`New Qualification: ${qualificationName} has been Added Successfully!!`);
                setQualificationName("");
                navigate(0);
                fetchQualifications();                
              } else {
                notifyErr(data.message);
              }
            } catch (error) {
              console.log(error);
              notifyErr("Opps!!! FAILED.. Something went wrong, New Qualification Failed to be added.");
            }
    };

    useEffect(() => {
        fetchQualifications();
    }, []);

    const fetchQualifications = async () => {
            try
            {
                const { data } = await API.get("/api/v1/qualification/fetchQualifications");
                if (data?.success) {
                    setQualifications(data?.qualifications);
                }
            }
            catch (error)
            {
                console.log(error);
                notifyErr("Oppss!!, FAILED, Something went Wrong Retrieving all Qualifications");
            }
    };

    const handleUpdate = async (e) => {

        e.preventDefault();
        try
        {
            const { data } = await API.put(`/api/v1/qualification/updateQualification/${selected._id}`, { qualificationName: updatedName });
            if (data.success) {
                notifySucc(`${updatedName} has been Updated Successfully!!`);
                setSelected(null);
                setUpdatedName("");
                setVisible(false);
                fetchQualifications();
            } else {
                notifyErr(data.message);
            }
        }
        catch (error)
        {
            console.log(error);
            notifyErr("Oppss!!, FAILED, Something went Wrong Updating This Qualification");
        }
    };

    // Delete Qualification By ID
    const handleDelete = async (qId) => {
        try
        {
            const { data } = await API.delete(`/api/v1/qualification/deleteQualificationById/${qId}`, { qualificationName: updatedName });
            if (data.success) {
                notifySucc("Qualification has been Deleted Successfully!!");
                navigate(0);
                fetchQualifications();
            } else {
                notifyErr(data.message);
            }
        }
        catch (error)
        {
            console.log(error);
            notifyErr("Oppss!!, FAILED, Something went Wrong Deleting This Qualification");
        }
    }

    
    return (
        <>
            <HeaderSidebar />
            <ChangePageTitle customPageTitle=" Admin Manage Qualifications | Prosoft Synergies " /> 
            <div className="app-wrapper">
                <div className="app-content pt-3 p-md-3 p-lg-4">
                    <div className="container-xl">
                        <div className="row g-3 mb-4 align-items-center justify-content-between">
                            <div className="col-auto">
                                <h1 className="app-page-title mb-0">Manage Qualifications</h1>
                            </div>
                        </div>
                        <nav id="countries-table-tab" className="countries-table-tab app-nav-tabs nav shadow-sm flex-column flex-sm-row mb-4">
                            <Link className="flex-sm-fill text-sm-center nav-link active" id="countries-all-tab" data-bs-toggle="tab" to="#countries-all" role="tab" aria-controls="countries-all" aria-selected="true">
                                Manage Qualifications
                            </Link>
                            <Link className="flex-sm-fill text-sm-center nav-link"  id="add-new-country-tab" data-bs-toggle="tab" to="#add-new-country" role="tab" aria-controls="add-new-country" aria-selected="false">
                                Add New Qualification
                            </Link>
                        </nav>
                        <div className="tab-content" id="countries-table-tab-content">
                            <div className="tab-pane fade show active" id="countries-all" role="tabpanel" aria-labelledby="countries-all-tab">
                                <div className="app-card app-card-countries-table shadow-sm mb-5">
                                    <div className="app-card-body">
                                        <div className="table-responsive">
                                            <table className="table app-table-hover mb-0 text-left">
                                                <thead>
                                                    <tr>
                                                        <th className="cell">Qualification</th>
                                                        <th className="cell">Slug</th>
                                                        <th className="cell">Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {qualifications.map((q) => {
                                                        return (
                                                            <tr key={q._id}>
                                                                <td className="cell">
                                                                    <span className="truncate">
                                                                        {q.qualificationName}
                                                                    </span>
                                                                </td>
                                                                <td className="cell">{q.slug}</td>
                                                                <td className="cell">
                                                                    <button className="btn-sm app-btn-secondary rounded-0 me-3" onClick={() => {
                                                                                setVisible(true);
                                                                                setUpdatedName(q.qualificationName);
                                                                                setSelected(q);
                                                                            }}>
                                                                        <EditOutlined />
                                                                    </button>
                                                                    <Button  
                                                                        onClick={() => handleDelete(q._id)} 
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
                                    <ul className="pagination justify-content-center">
                                    <li className="page-item disabled">
                                        <a className="page-link" href="#" tabindex="-1" aria-disabled="true">Previous</a>
                                    </li>
                                    <li className="page-item active"><a className="page-link" href="#">1</a></li>
                                    <li className="page-item"><a className="page-link" href="#">2</a></li>
                                    <li className="page-item"><a className="page-link" href="#">3</a></li>
                                    <li className="page-item">
                                        <a className="page-link" href="#">Next</a>
                                    </li>
                                    </ul>
                                </nav>
                            </div>
                            <div className="tab-pane fade" id="add-new-country" role="tabpanel" aria-labelledby="add-new-country-tab">
                                <div className="app-card app-card-countries-table mb-5">
                                    <div className="app-card-body mt-5">
                                        <div className="row mt-5">
                                            <div className="col-md-10 mx-auto mt-5">
                                                <AddQualificationForm handleSubmit={handleSubmit}
                                                    value={qualificationName}
                                                    setValue={setQualificationName} 
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
                            <AddQualificationForm value={updatedName} setValue={setUpdatedName} handleSubmit={handleUpdate} />
                        </Modal>
                    </div>
                </div>
                <Footer />
            </div>
        </>
    );

};


export default ManageQualifications;