import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import API from "../../helpers/API";
import { useAuth } from "../../Context/AuthContext";
import { Link, useNavigate, useParams, useLocation } from "react-router-dom";
import $ from "jquery";
import ready from "document-ready";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import TestHomeHeader from '../TestHomeHeader';
import Footer from '../Footer';

import './Resume.css';
import './style.css';
import './About.css';

const ApplicantResumeUpload = () => {
    const canonicalUrl = window.location.href; // Get the current URL
  const [auth, setAuth] = useAuth();
  const [resume, setResume] = useState(null);
  const [uploading, setUploading] = useState(false);
  const params = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState({});
  const [loading, setLoading] = useState(false);

  const notifyErr = (msg) =>
    toast.error(msg, {
      position: "top-center",
      autoClose: 20000,
      closeOnClick: true,
      pauseOnHover: true,
      theme: "light"
    });
  const notifySucc = (msg) =>
    toast.success(msg, {
      position: "top-center",
      autoClose: 20000,
      closeOnClick: true,
      pauseOnHover: true,
      theme: "light"
    });

  ready(() => {
    const $file = $("#resume");
    const $label = $file.next("label");
    const $labelText = $label.find("span");
    const $labelRemove = $("i.remove");
    const labelDefault = $labelText.text();

    // on file change
    $file.on("change", (event) => {
      const fileName = $file.val().split("\\").pop();
      if (fileName) {
        console.log($file);
        $labelText.text(fileName);
        $labelRemove.show();
      } else {
        $labelText.text(labelDefault);
        $labelRemove.hide();
      }
    });

    // Remove file
    $labelRemove.on("click", (event) => {
      $file.val("");
      $labelText.text(labelDefault);
      $labelRemove.hide();
      console.log($file);
    });
  });

  const handleResumeOnChange = (e) => {
    setResume(e.target.files[0]);
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!resume) {
      notifyErr("Please select a resume file.");
      return;
    }
    const formData = new FormData();
    formData.append("resume", resume);
    const config = { headers: { "Content-Type": "multipart/form-data" } };
    try {
      setLoading(true);
      const response = await API.post(
        `/api/v1/resume/upload-resume/${params.userId}`,
        formData,
        config
      );
      notifySucc("Applicant Resume Has Been Uploaded Successfully...");
      navigate(location.state || `/Profile/${auth?.user?.userId}`);
      window.location.reload();
      setResume("");
    } catch (error) {
      console.log(error);
      notifyErr(error.response.data.message);
      navigate(location.state || `/Profile/${auth?.user?.userId}`);
      window.location.reload();
    }
  };

  useEffect(() => {
    fetchLoggedInUserById();
  }, []);

  const fetchLoggedInUserById = async () => {
    try {
      setLoading(true);
      const response = await API.get(
        `/api/v1/applicant/loggedInUser/${params.userId}`
      );
      const { user: userData } = response.data;
      setUser(userData);
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
      notifyErr(error.response.data.message);
    }
  };

    return (
        <>
        <Helmet>
            <link rel="canonical" href={canonicalUrl} />
            <title>Upload Your Resume | ThinkBeyond</title>
            <meta
            name="description"
            content="Upload Your Resume to ThinkBeyond's Job Portal Website. Find Top Job Opportunities in Canada, the US, and India. Join Our Global Network and take the next Step in Your Career with Leading Employers. Apply Now!"
            />
            <meta
            name="keywords"
            content="ThinkBeyond, Job Portal, Consulting Firm, Resume Upload, Job Seekers, Careers, Canada, US, India, Job Opportunities, Global Jobs, Resume Submission, Employment Opportunities, Career Growth"
            />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />

            <meta property="og:title" content="Upload Your Resume | ThinkBeyond" />
            <meta
            property="og:description"
            content="Take the next Step in Your Career by Uploading Your Resume to ThinkBeyond's Job Portal. Explore Opportunities in Canada, the US, and India with Top Employers."
            />
            <meta
            property="og:url"
            content="https://thethinkbeyond.com/Infrastructure, https://www.thethinkbeyond.com/Infrastructure"
            />
            <meta property="og:type" content="website" />
            <meta name="twitter:title" content="Upload Your Resume | ThinkBeyond" />
            <meta
            name="twitter:description"
            content="Upload Your Resume to ThinkBeyond's Job Portal to Access Great Career Opportunities Across Canada, the US, and India."
            />
            <meta
            name="twitter:card"
            content="https://thethinkbeyond.com/assets/images/thinkbeyond-bg.png
                            "
            />
            <meta
            name="linkedIn:title"
            content="Upload Your Resume | ThinkBeyond"
            />
            <meta
            name="linkedIn:description"
            content="Upload Your Resume to ThinkBeyond's Job Portal to Access Great Career Opportunities Across Canada, the US, and India."
            />
            <meta
            name="linkedIn:card"
            content="https://thethinkbeyond.com/assets/images/thinkbeyond-bg.png
                            "
            />
            <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        <TestHomeHeader />
        <section className="about-us-section">
            <div className="about-us-container">
                <div className="about-us-text">
                    <div className="text-content">
                        <h1>Job Seeker Resume Upload</h1>
                        {/* <p>
                            Complete Your Registration and Verify Your Email to start exploring Career Opportunities with Thinkbeyond.
                        </p> */}
                    </div>
                </div>
                <div className="about-us-image">
                    <img
                        src="https://images.pexels.com/photos/5989943/pexels-photo-5989943.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
                        alt="Job Seeker Resume Upload"
                    />
                </div>
            </div>
        </section>
        <section id="content" className="clearfix">
            <div id="general-content-124" className="container ">
            <div className="container-xxl py-5">
                <div className="container">
                <div className="resume-wrapper">
                    <h2>Choose Resume File for Upload</h2>
                    <form onSubmit={handleUpload}>
                    <input
                        type="file"
                        id="resume"
                        name="resume"
                        accept=".pdf,.doc,.docx"
                        onChange={handleResumeOnChange}
                    />
                    <label for="resume">
                        <i className="fa fa-paperclip fa-2x"></i>
                        <span></span>
                    </label>
                    <i className="fas fa-times-circle remove"></i>
                    <br />
                    <br />
                    <button
                        type="submit"
                        className="btn btn-sm btn-outline-info fa-2x mt-3 rounded-0"
                    >
                        <i class="fas fa-file-upload"></i> Upload Resume
                    </button>
                    </form>
                </div>
                </div>
            </div>
            </div>
        </section>
        <Footer />  
        </>
    );
};

export default ApplicantResumeUpload;
