import React, { useState } from 'react';
import { Link, useNavigate  } from 'react-router-dom';

import { EditOutlined } from '@ant-design/icons';


const Loader = () => (
    <div className="container text-center">
      <div className="spinner-border" role="status">
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );
  

const AddTestSalaryForm = ({ handleSubmit, value, setValue }) => {

    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const handleCancel = () => {
        navigate('/Admin/Manage-salaries'); // Replace '/desired-path' with the actual path you want to navigate to
    };

    return (

        <>
            <form onSubmit={handleSubmit} layout="vertical" className="form_data platform-form">
                <div className="row">
                    <div className="col-md-10 mx-auto">
                        <div className='form boxed'>                        
                            <label 
                                 htmlFor='salaryName'
                                tooltip="Salary Type Name is Required"
                            >
                                <EditOutlined style={{ marginRight: "5px", marginTop: "40PX;" }}/>
                                Salary Type Name :
                            </label>                            
                            <input 
                                placeholder="Enter Salary Type Name"
                                type='text'
                                className='form-control rounded-0 mb-4 mt-3'
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


export default AddTestSalaryForm;
