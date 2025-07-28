import ChangePageTitle from "../../utils/ChangePageTitle";
import React, { Component, useRef, useEffect, useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import API from '../../helpers/API';
import AddWorkModeForm from "../components/Forms/AddWorkModeForm";
import { EditOutlined, DeleteOutlined  } from '@ant-design/icons';
import { Form, Input, Button, Modal } from "antd";

import HeaderSidebar from "../components/HeadeSidebar";
import Footer from "../components/Footer";
import { ToastContainer, toast } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";



const ManageWorkModes = () => {

    const navigate = useNavigate();
    const [workMode, setWorkMode] = useState("");
    const [workModes, setWorkModes] = useState([]);
    const [workModeName, setWorkModeName] = useState("");
    const [visible, setVisible] = useState(false);
    const [selected, setSelected] = useState(null);
    const [updatedName, setUpdatedName] = useState("");


    const notifyErr = (msg) => toast.error(msg, 
        {position: "top-center", autoClose: 20000, closeOnClick: true, pauseOnHover: true, theme: "light" });
    const notifySucc = (msg) => toast.success(msg, 
        {position: "top-center", autoClose: 20000, closeOnClick: true, pauseOnHover: true, theme: "light" }); 


    const handleSubmit = async (e) => {  
    
        e.preventDefault();
            
        try 
        { 

            const { data } = await API.post("/api/v1/workMode/addWorkMode", { workModeName });

            if (data.success) {
            notifySucc(`New Work Mode: ${workModeName} has been Added Successfully!!`);
            setWorkModeName("");
            navigate(0);
            fetchWorkModes();                
            } else {
            notifyErr(data.message);
            }
        } catch (error) {
            console.log(error);
            notifyErr("Opps!!! FAILED.. Something went wrong, New Work Mode Failed to be added.");
        }
    };

    useEffect(() => {
        fetchWorkModes();
    }, []);

    const fetchWorkModes = async () => {
        try
        {
            const { data } = await API.get("/api/v1/workMode/fetchWorkModes");
            if (data?.success) {
                setWorkModes(data?.workModes);
            }
        }
        catch (error)
        {
            console.log(error);
            notifyErr("Oppss!!, FAILED, Something went Wrong Retrieving all Work Modes");
        }
    };

    const handleUpdate = async (e) => {

        e.preventDefault();
        try
        {
            const { data } = await API.put(`/api/v1/workMode/updateWorkMode/${selected._id}`, { workModeName: updatedName });
            if (data.success) {
                notifySucc(`${updatedName} has been Updated Successfully!!`);
                navigate("/Admin/WorkModes/Manage-Work-Modes");
                setSelected(null);
                setUpdatedName("");
                setVisible(false);
                fetchWorkModes();
            } else {
                notifyErr(data.message);
            }
        }
        catch (error)
        {
            console.log(error);
            notifyErr("Oppss!!, FAILED, Something went Wrong Updating This Work Mode");
        }
    };

    // Delete Work Mode By ID
    const handleDelete = async (cId) => {
        try
        {
            const { data } = await API.delete(`/api/v1/workMode/deleteWorkModeById/${cId}`, { workModeName: updatedName });
            if (data.success) {
                notifySucc("Work Mode has been Deleted Successfully!!");
                fetchWorkModes();
            } else {
                notifyErr(data.message);
            }
        }
        catch (error)
        {
            console.log(error);
            notifyErr("Oppss!!, FAILED, Something went Wrong Deleting This Work Mode");
        }
    };

    
    return (
        <>
            <HeaderSidebar />
            <ChangePageTitle customPageTitle=" Admin Manage Work Modes | Prosoft Synergies " /> 
            <div className="app-wrapper">
                <div className="app-content pt-3 p-md-3 p-lg-4">
                    <div className="container-xl">
                        <div className="row g-3 mb-4 align-items-center justify-content-between">
                            <div className="col-auto">
                                <h1 className="app-page-title mb-0">Manage Work Modes</h1>
                            </div>
                        </div>
                        <nav id="countries-table-tab" className="countries-table-tab app-nav-tabs nav shadow-sm flex-column flex-sm-row mb-4">
                            <Link className="flex-sm-fill text-sm-center nav-link active" id="countries-all-tab" data-bs-toggle="tab" to="#countries-all" role="tab" aria-controls="countries-all" aria-selected="true">
                                Manage Work Modes
                            </Link>
                            <Link className="flex-sm-fill text-sm-center nav-link"  id="add-new-country-tab" data-bs-toggle="tab" to="#add-new-country" role="tab" aria-controls="add-new-country" aria-selected="false">
                                Add Work Modes
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
                                                        <th className="cell">Work Mode</th>
                                                        <th className="cell">Slug</th>
                                                        <th className="cell">Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {workModes.map((wm) => {
                                                        return (
                                                            <tr key={wm._id}>
                                                                <td className="cell">
                                                                    <span className="truncate">
                                                                        {wm.workModeName}
                                                                    </span>
                                                                </td>
                                                                <td className="cell">{wm.slug}</td>
                                                                <td className="cell">
                                                                    <button className="btn-sm app-btn-secondary rounded-0 me-3" onClick={() => {
                                                                                setVisible(true);
                                                                                setUpdatedName(wm.workModeName);
                                                                                setSelected(wm);
                                                                            }}>
                                                                        <EditOutlined />
                                                                    </button>
                                                                    <Button  
                                                                        onClick={() => handleDelete(wm._id)} 
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
                                                <AddWorkModeForm handleSubmit={handleSubmit}
                                                    value={workModeName}
                                                    setValue={setWorkModeName} 
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
                            <AddWorkModeForm value={updatedName} setValue={setUpdatedName} handleSubmit={handleUpdate} />
                        </Modal>
                    </div>
                </div>
                <Footer />
            </div>
        </>
    );

};


export default ManageWorkModes;