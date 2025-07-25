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


const AddCity = () => {
   

    // const navigate = useNavigate();
    // const [province, setProvince] = useState("");
    // const [provinces, setProvinces] = useState([]);
    // const [provinceName, setProvinceName] = useState("");

    const navigate = useNavigate();
    const [city, setCity] = useState("");
    const [cities, setCities] = useState([]);
    const [cityName, setCityName] = useState("");


    // const [country, setCountry] = useState("");
    // const [countries, setCountries] = useState([]);
    // const [countryName, setCountryName] = useState("");

    const [province, setProvince] = useState("");
    const [provinces, setProvinces] = useState([]);
    const [provinceName, setProvinceName] = useState("");


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

                const config = { headers: { "Content-Type": "application/json" } };
                const data = { cityName, province };

                const res = await API.post(`/api/v1/city/addCity`, data, config);

                if (res.data.success) {
                    setCityName('');
                    notifySucc(`New City: ${cityName} has been Added Successfully!!`);
                    navigate("/Admin/Cities/Manage-Cities");               
                } else {
                    notifyErr(data.message);
                }
            } catch (error) {
              console.log(error);
              notifyErr(error.response.data.message);
            }
        };

    // useEffect(() => {
    //     fetchProvinces();
    // }, []);

    // const fetchProvinces = async () => {
    //         try
    //         {
    //             const { data } = await API.get("/api/v1/province/fetchProvinces");

    //             if (data?.success.length > 0) {
    //                 setProvince(data?.province);
    //             } else {
    //                 notifyErr("No Province Added Yet. Kindly Add New Province ASAP...");
    //             }
    //         }
    //         catch (error)
    //         {
    //             console.log(error);
    //             notifyErr("Oppss!!, FAILED, Something went Wrong Retrieving all Provinces");
    //         }
    // };

    const handleUpdate = async (e) => {

        e.preventDefault();
        try
        {
            const { data } = await API.put(`/api/v1/city/updateCity/${selected._id}`, { cityName: updatedName });
            if (data.success) {
                notifySucc(`${updatedName} has been Updated Successfully!!`);
                navigate("/Admin/Manage-Cities");
                setSelected(null);
                setUpdatedName("");
                setVisible(false);
                //fetchProvinces();
            } else {
                notifyErr(data.message);
            }
        }
        catch (error)
        {
            console.log(error);
            notifyErr("Oppss!!, FAILED, Something went Wrong Updating This City Name");
        }
    };

    const handleDelete = async (pId) => {
        try
        {
            const { data } = await API.delete(`/api/v1/city/deleteCityById/${pId}`, { cityName: updatedName });
            if (data.success) {
                notifySucc("City has been Deleted Successfully!!");
                //fetchProvinces();
            } else {
                notifyErr(data.message);
            }
        }
        catch (error)
        {
            console.log(error);
            notifyErr("Oppss!!, FAILED, Something went Wrong Deleting This City Name");
        }
    }

    useEffect(() => {
        fetchProvinces();
    }, []);

    const fetchProvinces = async () => {
        try
        {
            const { data } = await API.get("/api/v1/province/getallProvince");
            if (data?.success) {
                setProvinces(data?.provinces);
            }
        }
        catch (error)
        {
            console.log(error);
            notifyErr("Oppss!!, FAILED, Something went Wrong Retrieving all Provinces");
        }
    };


    return (
        <>  
            <HeaderSidebar />
            <ChangePageTitle customPageTitle=" Admin Add City | Prosoft Synergies " /> 
            <div className="app-wrapper">
                <div className="app-content pt-3 p-md-3 p-lg-4">
                    <div className="container-xl">
                        <div className="position-relative mb-3">
                            <div className="row g-3 justify-content-between">
                                <div className="col-auto">
                                    <h1 className="app-page-title mb-0">Add New City</h1>
                                </div>
                            </div>
                        </div>
                        <div className="app-card app-card-notification shadow-sm mb-4">
                            <div className="app-card-body p-4">
                                <div className="notification-content">
                                    <form onSubmit={handleSubmit}>                                               
                                        <div className="col-md-6 ma-auto">
                                            <div className="md-form mb-4">
                                                <label for="cityName" className="mb-3">City Name</label>
                                                <input 
                                                    type="text" 
                                                    id="cityName" 
                                                    className="form-control rounded-0" 
                                                    name="cityName"
                                                    value={cityName}
                                                    onChange={(e) => setCityName(e.target.value)}
                                                    />                                                    
                                            </div> 
                                            <div className="md-form mb-4">
                                                <label for="provinceId" className="mb-3">Select Province / State</label>
                                                <div className="form-wrapper">
                                                    <select 
                                                        class="form-control provinces rounded-0" 
                                                        name="province" 
                                                        value={province}
                                                        onChange={(e) => setProvince(e.target.value)}
                                                    >
                                                        <option>Select Province / State</option>
                                                        {provinces.map((p) => {
                                                            return (
                                                                <option key={p._id} value={p._id}>
                                                                    {p.provinceName}
                                                                </option>
                                                            );
                                                        })}
                                                    </select>                                            
                                                </div>
                                            </div>
                                            <div className="text-xs-left">
                                                <button type="submit" className="btn btn-primary rounded-0">Add New City</button>
                                            </div>
                                        </div>
                                    </form>                                    
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
                <Footer />
            </div>
        </>
    );

};


export default AddCity;