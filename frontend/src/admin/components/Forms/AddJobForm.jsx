import React, { useRef, useEffect, useState } from "react";
import { useFormik } from "formik";
import { Form, Button } from "antd";
import { EditOutlined } from '@ant-design/icons';


const AddJobForm = ({ handleSubmit, value, setValue }) => {


    const [filePath, setFilePath] = useState(null);
    const filePathInputRef = useRef(null);
    return (

        <>
        <form onSubmit={handleSubmit} encType="multipart/form-data">                                               
            <div className="col-md-8 ma-auto">
                <div className="md-form mb-4">
                    <label for="title" className="mb-3">Job Title</label>
                    <input 
                        type="text" 
                        id="title" 
                        className="form-control rounded-0" 
                        name="title"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        />                                                    
                </div>   
                <div className="md-form mb-4">
                    <label for="file" className="mb-3">Job File</label> 
                    {filePath ? filePath.name : "Upload File Attachment"}
                    <input 
                        type="file" 
                        id="file"
                        name="filePath"
                        ref={filePathInputRef}
                        className="form-control rounded-0" />   

                    <div>
                        {filePath && (
                        <div>
                            <file
                            src={URL.createObjectURL(filePath)}
                            alt="Uploaded File Attachment"
                            height={"400px"}
                            />
                        </div>
                        )}
                    </div>                                            
                </div> 
                <div className="text-xs-left">
                    <button type="submit" className="btn btn-primary rounded-0">Add New Job</button>
                </div>
            </div>
        </form> 
        </>
    );
};


export default AddJobForm;