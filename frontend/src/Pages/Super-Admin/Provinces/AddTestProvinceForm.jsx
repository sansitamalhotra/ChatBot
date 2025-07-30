import React, { useState } from 'react';
import { Link, useNavigate  } from 'react-router-dom';
import { useFormik } from "formik";
import { Form, Button } from "antd";
import { EditOutlined } from '@ant-design/icons';


const Loader = () => (
    <div className="container text-center">
      <div className="spinner-border" role="status">
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );
  
const AddTestProvinceForm = ({ handleSubmit, value, setValue }) => {

    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const handleCancel = () => {
        navigate('/Admin/Manage-Provinces'); // Replace '/desired-path' with the actual path you want to navigate to
    };

    return (

        <>
            <form onSubmit={handleSubmit} layout="vertical" className="form_data platform-form">
                <div className="row">
                    <div className="col-md-10 mx-auto">
                    <div className='form boxed'>                        
                            <label 
                                htmlFor='provinceName'
                                tooltip="Province Name is Required"
                            >
                                <EditOutlined style={{ marginRight: "5px", marginTop: "50PX;" }}/>
                                 Province Name :
                            </label>                            
                            <input 
                                placeholder="Enter Province Name"
                                type='text'
                                className='form_input form-control rounded-0 mb-4 mt-3'
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                            />
                        </div>
                        <div class="text-xs-left mt-3 col-md-12">
                            <button class="btn btn-primary rounded-0 me-3" disabled={loading}>
                                <i className="fas fa-plus me-2"></i>
                                {loading ? <Loader /> : "Submit"}
                            </button>
                            <button class="btn btn-warning rounded-0" onClick={handleCancel}>
                                <i className="fas fa-times"></i> Cancel
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </>
    );
};


export default AddTestProvinceForm;
