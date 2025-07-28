import ChangePageTitle from "../../../utils/ChangePageTitle";
import React, { Component, useRef, useEffect, useState } from "react";
import { NavLink, Link, useNavigate, useLocation, useParams } from "react-router-dom";
import API from "../../../helpers/API";

import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";

import { useAuth } from "../../../Context/AuthContext";
import Header from '../../../components/Header/Header';
import Footer from '../../../components/Footer/Footer';

import { ToastContainer, toast } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";

import {
    LockOutlined,
    MailOutlined,
    PhoneOutlined,
    UserOutlined,
    EyeOutlined,
    EyeInvisibleOutlined,
    UploadOutlined,
} from "@ant-design/icons";

import "../auth.css";
import "./applyjob.css";


const ApplyJobForm = () => {

    const [auth, setAuth] = useAuth();
    const params = useParams();
    const [job, setJob] = useState();
    const [jobs, setJobs] = useState([]);
    const [resume, setResume] = useState(null);
    const [jobMatrix, setJobMatrix] = useState(null);
    const [salary, setSalary] = useState("");
    const [salaries, setSalaries] = useState([]);
    const [rate, setRate] = useState("");
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const notifyErr = (msg) =>
    toast.error(msg, {
      position: "top-center",
      autoClose: 20000,
      closeOnClick: true,
      pauseOnHover: true,
      theme: "light",
    });
  const notifySucc = (msg) =>
    toast.success(msg, {
      position: "top-center",
      autoClose: 20000,
      closeOnClick: true,
      pauseOnHover: true,
      theme: "light",
    });

    const fetchJob = async () => {
        try 
        {
          const { data } = await API.get(`/api/v1/job/viewJob/${params.slug}`);
          setJob(data.job);
        } catch (error) {
          console.log(error);
        }
      };
    
      // initial Job Details
      useEffect(() => {
        if (params?.slug) fetchJob();
      }, [params?.slug]);


    const fetchSalaries = async () => {
        try {
          const { data } = await API.get("/api/v1/salary/fetchSalaries");
          if (data?.success) {
            setSalaries(data?.salary);
          }
        } catch (error) {
          console.log(error);
          notifyErr(
            "Oppss!!, FAILED, Something went Wrong Retrieving all Salary Types"
          );
        }
    };
    
      useEffect(() => {
        fetchSalaries();
    }, []);

    const handleResumeOnChange = (e) => {
        setResume(e.target.files[0]);
    };
    
      const handleJobMatrixOnChange = (e) => {
        setJobMatrix(e.target.files[0]);
      };
    
      const handleSubmitJobApplicationForm = async (e) => {
        e.preventDefault();
    
        const formData = new FormData();
        formData.append("resume", resume);
        formData.append("jobMatrix", jobMatrix);
        formData.append("salary", salary);
        formData.append("rate", rate);
    
        const config = {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        };
    
        try {
          setLoading(true);
          const response = await API.post(
            `/api/v1/apply/jobapplication/${params?.slug}`,
            formData,
            config
          );
          notifySucc(response.data.message);
          navigate("/Browse-Jobs");
        } catch (error) {
          console.log(error.response.data);
          notifyErr(error.response.data.message);
        } finally {
          setLoading(false);
        }
      };


    return (
        <>
        <Header />
        <ChangePageTitle customPageTitle={job?.title} />
        <div className="container-xxl py-5">
        <div className="container">
          <div className="row">
            <div className="col-md-10 mx-auto">
              <div className="wrapper">
                <div className="inner">
                  <form
                    onSubmit={handleSubmitJobApplicationForm}
                    className="authform"
                  >
                    <h3 className="mb-5"> {job?.title}{" "}
                      <span>{job?.workMode?.workModeNae}</span>
                    </h3>
                    <div className="form-wrapper">
                      <label htmlFor="firstname"> First Name:</label>
                      <input
                        type="text"
                        className="authInputFields form-control"
                        value={auth?.user?.firstname}
                        disabled
                      />
                    </div>
                    <div className="form-wrapper">
                      <label htmlFor="lastname"> Last Name:</label>
                      <input
                        type="text"
                        className="authInputFields form-control"
                        value={auth?.user?.lastname}
                        disabled
                      />
                    </div>
                    <div className="form-wrapper">
                      <label htmlFor="email"> Email:</label>
                      <input
                        type="text"
                        className="authInputFields form-control"
                        value={auth?.user?.email}
                        disabled
                      />
                    </div>
                    <div className="form-wrapper">
                      <label htmlFor="phone"> Phone:</label>
                      <input
                        type="text"
                        className="authInputFields form-control"
                        value={auth?.user?.phone}
                        disabled
                      />
                    </div>
                    <div className="form-wrapper">
                      <div className="row">
                        <div className="col-6 col-sm-6">
                          <label htmlFor="salary">Salary Expectation:</label>
                          <select
                            className="form-control"
                            value={salary}
                            onChange={(e) => setSalary(e.target.value)}
                          >
                            <option>Salary Expectation</option>
                            {salaries.map((s) => {
                              return (
                                <option key={s._id} value={s._id}>
                                  {s.salaryName}
                                </option>
                              );
                            })}
                          </select>
                        </div>
                        <div className="col-6 col-sm-6">
                          <label for="rate">Rate:</label>
                          <input
                            type="text"
                            class="form-control"
                            placeholder="₹"
                            name="rate"
                            value={rate}
                            onChange={(e) => setRate(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="form-wrapper">
                      <UploadOutlined
                        style={{ marginRight: "5px", marginTop: "50PX;" }}
                      />
                      <label htmlFor="resume"> Upload Resume / CV:</label>
                      <input
                        type="file"
                        placeholder="Upload Your Resume"
                        id="resume"
                        name="resume"
                        accept=".pdf,.doc,.docx,.xls,.xlsx"
                        className="form-control rounded-0"
                        required
                        onChange={handleResumeOnChange}
                      />
                      <span>
                        <small>
                          (Accepted File Types: pdf, doc, & docx only)
                        </small>
                      </span>
                    </div>
                    <div className="form-wrapper">
                      {job?.provinceFile && (
                        <>
                          <UploadOutlined
                            style={{ marginRight: "5px", marginTop: "10px" }}
                          />
                          <label htmlFor="jobMatrix">Upload Matrix File:</label>
                          <input
                            required
                            type="file"
                            placeholder="Upload Your Matrix File"
                            id="jobMatrix"
                            name="jobMatrix"
                            accept=".pdf,.doc,.docx,.xls,.xlsx"
                            className="form-control rounded-0"
                            onChange={handleJobMatrixOnChange}
                          />
                          <span>
                            <small>
                              (Accepted File Types: pdf, doc, & docx only)
                            </small>
                          </span>
                        </>
                      )}
                    </div>

                    <div className="form-wrapper">
                      <div className="row">
                        <div className="col-md-6">
                          <button type="submit" className="authbtn mb-4">
                            Submit Application
                          </button>
                        </div>
                        <div className="col-md-6">
                          <button
                            type="submit"
                            onClick={() => navigate(-1)}
                            className="authbtncancel mb-4"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
        </>
    );


};

export default ApplyJobForm;