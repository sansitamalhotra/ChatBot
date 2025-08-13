import ChangePageTitle from "../../utils/ChangePageTitle";
import React, { Component, useRef, useEffect, useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import API from '../../helpers/API';
import AddProvinceForm from "../components/Forms/AddProvinceForm";
import { EditOutlined, DeleteOutlined  } from '@ant-design/icons';
import { Form, Input, Button, Modal } from "antd";

import HeaderSidebar from "../components/HeadeSidebar";
import Footer from "../components/Footer";
import { ToastContainer, toast } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";



const ManageProvinces = () => {

    const navigate = useNavigate();
    const [province, setProvince] = useState("");
    const [provinces, setProvinces] = useState([]);
    const [provinceName, setProvinceName] = useState("");
    const [country, setCountry] = useState("");
    const [countries, setCountries] = useState([]);
    const [countryName, setCountryName] = useState("");
    const [visible, setVisible] = useState(false);
    const [selected, setSelected] = useState(null);
    const [updatedName, setUpdatedName] = useState("");

    const [numProvincesInDB, setNumProvincesInDB] = useState(0);
    const [totalProvinces, setTotalProvinces] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [provincesPerPage, setProvincesPerPage] = useState(5);
    const [loading, setLoading] = useState(false);
    const [selectedProvince, setSelectedProvince] = useState(null);


    const notifyErr = (msg) => toast.error(msg, 
        {position: "top-center", autoClose: 20000, closeOnClick: true, pauseOnHover: true, theme: "light" });
    const notifySucc = (msg) => toast.success(msg, 
        {position: "top-center", autoClose: 20000, closeOnClick: true, pauseOnHover: true, theme: "light" }); 


        const handleSubmit = async (e) => {  
            e.preventDefault();
            try { 

                const config = { headers: { "Content-Type": "application/json" } };
                const data = { provinceName, country };

                const res = await API.post(`/api/v1/province/addProvince`, data, config);

                if (res.data.success) {
                    setProvinceName('');
                    notifySucc(`New Province: ${provinceName} has been Added Successfully!!`);
                    navigate(0);               
                } else {
                    notifyErr(data.message);
                }
            } catch (error) {
              console.log(error);
              notifyErr(error.response.data.message);
            }
        };

        useEffect(() => {
            fetchCountries();
        }, []);
    
        const fetchCountries = async () => {
                try
                {
                    const { data } = await API.get("/api/v1/country/fetchCountries");
                    if (data?.success) {
                        setCountries(data?.country);
                    }
                }
                catch (error)
                {
                    console.log(error);
                    notifyErr("Oppss!!, FAILED, Something went Wrong Retrieving all Countries");
                }
        };

    useEffect(() => {
        fetchProvinces();
        window.scrollTo({ top: 0 });
        if (window.history.pushState) {
            window.history.pushState(null, null, `/Admin/Provinces/Manage-Provinces?page=${currentPage}`);
        }
    }, [currentPage, provincesPerPage]);

    const fetchProvinces = async () => {
            try
            {
                setLoading(true);
                const response = await API.get(`/api/v1/province/fetchProvinces?page=${currentPage}`);
                setProvinces(response.data.result);

                setTotalProvinces(response.data.totalProvinces);
                setNumProvincesInDB(response.data.numProvincesInDB);
                localStorage.setItem("refresh", response.data.result);
                setLoading(false);
                setSelectedProvince(null);
            }
            catch (error)
            {
                console.log(error);
                setLoading(false);
                notifyErr(error.response.data.message);
            }
    };

    const handleUpdate = async (e) => {

        e.preventDefault();
        try
        {
            const { data } = await API.put(`/api/v1/province/updateProvince/${selected._id}`, { provinceName: updatedName });
            if (data.success) {
                notifySucc(`${updatedName} has been Updated Successfully!!`);
                setSelected(null);
                setUpdatedName("");
                setVisible(false);
                fetchProvinces();
            } else {
                notifyErr(data.message);
            }
        }
        catch (error)
        {
            console.log(error);
            notifyErr("Oppss!!, FAILED, Something went Wrong Updating This Province Name");
        }
    };

    // Delete Country By ID
    const handleDelete = async (cId) => {
        try
        {
            const { data } = await API.delete(`/api/v1/province/deleteProvinceById/${cId}`, { provinceName: updatedName });
            if (data.success) {
                notifySucc("Province has been Deleted Successfully!!");
                navigate(0);
                fetchProvinces();
            } else {
                notifyErr(data.message);
            }
        }
        catch (error)
        {
            console.log(error);
            notifyErr("Oppss!!, FAILED, Something went Wrong Deleting This Province Name");
        }
    };

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
        <>
            <HeaderSidebar />
            <ChangePageTitle customPageTitle=" Admin Manage Provinces | Prosoft Synergies " /> 
            <div className="app-wrapper">
                <div className="app-content pt-3 p-md-3 p-lg-4">
                    <div className="container-xl">
                        <div className="row g-3 mb-4 align-items-center justify-content-between">
                            <div className="col-auto">
                                <h1 className="app-page-title mb-0">Manage Provinces</h1>
                                (<strong><span>Page {currentPage} of {" "} {numProvincesInDB} Provinces Found</span></strong>)
                            </div>
                        </div>
                        <nav id="countries-table-tab" className="countries-table-tab app-nav-tabs nav shadow-sm flex-column flex-sm-row mb-4">
                            <Link className="flex-sm-fill text-sm-center nav-link active" id="countries-all-tab" data-bs-toggle="tab" to="#countries-all" role="tab" aria-controls="countries-all" aria-selected="true">
                                Manage Provinces
                            </Link>
                            <Link className="flex-sm-fill text-sm-center nav-link"  id="add-new-country-tab" data-bs-toggle="tab" to="#add-new-country" role="tab" aria-controls="add-new-country" aria-selected="false">
                                Add New Province
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
                                                        
                                                    {/* <th class="cell">Id</th> */}
                                                    <th className="cell">Province / State Name</th>
                                                    <th className="cell">Province Slug</th>
                                                    <th className="cell">Country</th>
                                                    <th className="cell">Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {provinces.length > 0 ? (
                                                        provinces.map((p) => {
                                                            return (
                                                                <tr key={p._id}>
                                                                    <td className="cell">
                                                                        <span className="truncate">
                                                                            {p.provinceName}
                                                                        </span>
                                                                    </td>
                                                                    <td className="cell">{p.slug}</td>
                                                                    <td className="cell">
                                                                        <strong>{p?.country?.countryName}</strong>
                                                                    </td>
                                                                    <td className="cell">
                                                                        <button className="btn-sm app-btn-secondary rounded-0 me-3" onClick={() => {
                                                                                    setVisible(true);
                                                                                    setUpdatedName(p.provinceName);
                                                                                    setSelected(p);
                                                                                }}>
                                                                            <EditOutlined />
                                                                        </button>
                                                                        <Button  
                                                                            onClick={() => handleDelete(p._id)} 
                                                                            className="btn-sm app-btn-secondary rounded-0"
                                                                            type="danger"
                                                                            icon={<DeleteOutlined />}
                                                                            >        
                                                                        </Button>
                                                                    </td>
                                                                </tr>
                                                            )
                                                        })
                                                    ) : (
                                                        <tr>
                                                            <td colSpan={3} style={{ fontWeight: '300' }}>
                                                                No Province Added Yet...
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
                                        {pageNumbers.map((number) => (
                                             <li key={number} className={currentPage === number ? "page-item active disabled" : ""}>
                                                <Link
                                                onClick={() => pagination(number)}
                                                disabled={
                                                    currentPage ===
                                                    Math.ceil(totalProvinces / 5)
                                                }
                                                to="#"
                                                className="page-link"
                                                >
                                                {number}
                                                </Link>
                                             </li>
                                        ))}
                                        <li className="page-item">
                                            <button className="page-link" onClick={nextPage} disabled={ currentPage === Math.ceil(totalProvinces / 5)}>Next</button>
                                        </li>
                                    </ul>
                                </nav>
                            </div>
                            <div className="tab-pane fade" id="add-new-country" role="tabpanel" aria-labelledby="add-new-country-tab">
                                <div className="app-card app-card-countries-table mb-5">
                                    <div className="app-card-body mt-5">
                                        <div className="row mt-5">
                                            <div className="col-md-10 mx-auto mt-5">
                                            <form onSubmit={handleSubmit}>                                               
                                                <div className="col-md-6 ma-auto">
                                                    <div className="md-form mb-4">
                                                        <label for="provinceName" className="mb-3">Province Name</label>
                                                        <input 
                                                            type="text" 
                                                            id="provinceName" 
                                                            className="form-control rounded-0" 
                                                            name="provinceName"
                                                            value={provinceName}
                                                            onChange={(e) => setProvinceName(e.target.value)}
                                                            />                                                    
                                                    </div> 
                                                    <div className="md-form mb-4">
                                                        <label for="countryId" className="mb-3">Select Country</label>
                                                        <div className="form-wrapper">
                                                            <select 
                                                                class="form-control countries rounded-0" 
                                                                name="country" 
                                                                value={country}
                                                                onChange={(e) => setCountry(e.target.value)}
                                                            >
                                                                <option>Select Country</option>
                                                                {countries.map((c) => {
                                                                    return (
                                                                        <option key={c._id} value={c._id}>
                                                                            {c.countryName}
                                                                        </option>
                                                                    );
                                                                })}
                                                            </select>                                            
                                                        </div>
                                                    </div>
                                                    <div className="text-xs-left">
                                                        <button type="submit" className="btn btn-primary rounded-0">Add New Province</button>
                                                    </div>
                                                </div>
                                            </form> 
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
                            <AddProvinceForm value={updatedName} setValue={setUpdatedName} handleSubmit={handleUpdate} />
                        </Modal>
                    </div>
                </div>
                <Footer />
            </div>
        </>
    );

};


export default ManageProvinces;