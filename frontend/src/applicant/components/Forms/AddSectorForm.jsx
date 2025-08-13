import React from "react";
import { Form, Button } from "antd";
import { EditOutlined } from '@ant-design/icons';

const AddSectorForm = ({ handleSubmit, value, setValue }) => {

    return (

        <>
            <form onSubmit={handleSubmit} layout="vertical" className="form_data platform-form">
                <div className="row">
                    <div className="col-md-6 mx-auto">
                        <div className='form boxed'>                        
                            <label 
                                htmlFor='sectorName'
                                tooltip="Sector Name is Required"
                            >
                                <EditOutlined style={{ marginRight: "5px", marginTop: "50PX;" }}/>
                                Sector Name:
                            </label>                            
                            <input 
                                placeholder="Enter Sector Name"
                                type='text'
                                className='form_input form-control rounded-0 mb-4'
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                            />
                        </div>
                        <div class="text-xs-left mt-3">
                            <button class="btn btn-primary rounded-0">Submit</button>
                        </div>
                    </div>
                </div>
            </form>
        </>
    );
};


export default AddSectorForm;