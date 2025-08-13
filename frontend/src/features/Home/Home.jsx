import ChangePageTitle from "../../utils/ChangePageTitle";
import React, { Component, useRef, useEffect, useState } from "react";
import { NavLink, Link } from "react-router-dom";

import Carousel from 'react-bootstrap/Carousel';

import { EditOutlined, DeleteOutlined, DownloadOutlined, EyeOutlined, RollbackOutlined, SwapRightOutlined, SwapLeftOutlined  } from '@ant-design/icons';
import API from "../../helpers/API";

import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';

import moment from "moment";

import { ToastContainer, toast } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";

import "bootstrap/dist/css/bootstrap.min.css";


const Home = () => {

    const [jobs, setJobs] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [visible, setVisible] = useState(false);
    const [selected, setSelected] = useState(null);
    const [updatedName, setUpdatedName] = useState("");
    const [numJobsInDB, setNumJobsInDB] = useState(0);
    const [totalJobs, setTotalJobs] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [jobsPerPage, setJobsPerPage] = useState(5);
    const [loading, setLoading] = useState(false);
    const [selectedJob, setSelectedJob] = useState(null);

    const [applied, setApplied] = useState(false);

    const [sectors, setSectors] = useState([]);

    const [workModes, setWorkModes] = useState([]);

    const notifyErr = (msg) => toast.error(msg, 
      {position: "top-center", autoClose: 20000, closeOnClick: true, pauseOnHover: true, theme: "light" });
    const notifySucc = (msg) => toast.success(msg, 
      {position: "top-center", autoClose: 20000, closeOnClick: true, pauseOnHover: true, theme: "light" }); 


  useEffect(() => {
    const fetchJobData = async () => {
        try {
            setLoading(true);
            const jobResponse = await API.get(
                `/api/v1/job/fetchAllJobs?page=${currentPage}`,
                { params: { search: searchTerm } }
            );
            const { result, applied, totalJobs, numJobsInDB } = jobResponse.data;
            setJobs(result);
            setApplied(applied);
            setTotalJobs(totalJobs);
            setNumJobsInDB(numJobsInDB);
            localStorage.setItem("refresh", JSON.stringify(result));

            const sectorResponse = await API.get("/api/v1/job/sectors");
            setSectors(sectorResponse.data.result);
        } catch (error) {
            console.error(error);
            const errorMessage = error.response ? error.response.data.message : error.message;
            notifyErr(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    fetchJobData();
    window.scrollTo({ top: 0 });
}, [currentPage, searchTerm]);


  const nextPage = () => {
    setCurrentPage(currentPage + 1);
  };

  const prevPage = () => {
      setCurrentPage(currentPage - 1);
  };

  const pagination = (pageNumber) => setCurrentPage(pageNumber);

  const pageNumbers = [];

  for (let i = 1; i <= Math.ceil(totalJobs / jobsPerPage); i++) {
      pageNumbers.push(i);
  }

  let limit = "";

  return (
    <>
    
       <Header />
       <ChangePageTitle customPageTitle=" Prosoft | Pioneering Workforce Solutions Provider" />
      {/* Navbar End */}
      {/* Carousel Start */}
      <div className="container-fluid p-0">
        <Carousel controls={true} variant="white" fade={true}>
          <Carousel.Item interval={null} autoPlay={true}>
            <div className="owl-carousel">
              <div className="owl-carousel-item position-relative">
                <img
                  src="../../assets/img/carousel-12.jpg"
                  className="img-fluid"
                  alt="Carousel-Img-1"
                  style={{ width: "100%" }}
                />
                <div
                  className="carousel-caption position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center"
                >
                  <div className="container">
                    <div className="row justify-content-start">
                      <div className="col-10 col-lg-8">
                        <h1 className="text-white display-1 mb-4 animated fadeInRight">
                          Find the ultimate job opening that you genuinely qualify for.
                        </h1>
                        <p className="mb-4 text-white fs-5 animated fadeInDown">
                          We are dedicated to aiding Organizations in finding the
                          perfect matches that align with their requirements.
                        </p>
                        <Link
                          to="/Browse-Jobs"
                          className="btn btn btn-primary rounded-0 py-md-3 px-md-5 me-3 animated slideInLeft"
                        >
                          Browse Jobs
                        </Link>
                        {/* <Link
                          to="/"
                          className="btn btn-info rounded-0 py-md-3 px-md-5 animated slideInRight"
                          style={{ color: "#fff" }}
                        >
                          Find Talents / Search Resumes
                        </Link> */}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Carousel.Item>
          <Carousel.Item interval={null} autoPlay={true}>
          <div className="owl-carousel">
              <div className="owl-carousel-item position-relative">
                <img
                  src="../../assets/img/carousel-4.jpg"
                  className="img-fluid"
                  alt="Carousel-Img-1"
                  style={{ width: "100%" }}
                />
                <div
                  className="carousel-caption position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center"
                >
                  <div className="container">
                    <div className="row justify-content-start">
                      <div className="col-10 col-lg-8">
                        <h1 className="display-3 text-white animated slideInDown mb-4">
                          Prosoft Offers Tailored Services to Employers.
                        </h1>
                        <p className="fs-5 fw-medium text-white mb-4 pb-2">
                          Creating teams for temporary or permanent roles in a broad spectrum of industries is our forte - allow us to tailor a solution that meets your needs.
                        </p>
                        <Link
                          to="/About-Us"
                          className="hbtn btn btn-primary rounded-0 py-md-3 px-md-5 me-3 animated slideInLeft"
                        >
                          Who We're
                        </Link>
                        {/* <Link
                          to="/"
                          className="btn btn-info rounded-0 py-md-3 px-md-5 animated slideInRight"
                          style={{ color: "#fff" }}
                        >
                          Find Talents / Search Resumes
                        </Link> */}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Carousel.Item>
          <Carousel.Item interval={null} autoPlay={true}>
          <div className="owl-carousel">
              <div className="owl-carousel-item position-relative">
                <img
                  src="../../assets/img/carousel-5.jpg"
                  className="img-fluid"
                  alt="Carousel-Img-1"
                  style={{ width: "100%" }}
                />
                <div
                  className="carousel-caption position-absolute top-0 start-0 w-100 h-100 d-flex"
                >
                  <div className="container">
                    <div className="row justify-content-start">
                      <div className="col-10 col-lg-8">
                        <h1 className="display-3 text-white animated slideInDown mb-4">
                          Prosoft is dedicated to helping job seekers secure suitable jobs.
                        </h1>
                        <p className="fs-5 fw-medium text-white mb-4 pb-2">
                          If you are seeking a temporary role for the next few months or contemplating a permanent shift in your career trajectory, we are well-equipped to support you in making that transition successfully.
                        </p>
                        <Link
                          to="/About-Us/Our-Mission"
                          className="hbtn btn btn-primary rounded-0 py-md-3 px-md-5 me-3 animated slideInLeft"
                        >
                          Read More
                        </Link>
                        {/* <Link
                          to="/"
                          className="btn btn-info rounded-0 py-md-3 px-md-5 animated slideInRight"
                          style={{ color: "#fff" }}
                        >
                          Find Talents / Search Resumes
                        </Link> */}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Carousel.Item>
        </Carousel>
      </div>
      {/* Carousel End */}
      <div className="container-xxl py-5">
        <div className="container">
          <div className="row g-5 align-items-center">
            <div className="col-lg-6 wow fadeIn" data-wow-delay="0.1s">
              <div className="row g-0 about-bg rounded overflow-hidden">
                <div className="col-6 text-start">
                  <img
                    className="img-fluid w-100"
                    src="../../assets/img/about-1.jpg"
                    alt=""
                  />
                </div>
                <div className="col-6 text-start">
                  <img
                    className="img-fluid"
                    src="../../assets/img/about-2.jpg"
                    style={{ width: "85%", marginTop: "15%" }}
                    alt=""
                  />
                </div>
                <div className="col-6 text-end">
                  <img
                    className="img-fluid"
                    src="../../assets/img/about-3.jpg"
                    style={{ width: "85%" }}
                    alt=""
                  />
                </div>
                <div className="col-6 text-end">
                  <img
                    className="img-fluid w-100"
                    src="../../assets/img/about-4.jpg"
                    alt=""
                  />
                </div>
              </div>
            </div>
            <div className="col-lg-6 wow fadeIn" data-wow-delay="0.5s">
              <h1 className="mb-4">
                We assist individuals in securing the job prospects and
                uncovering extraordinary skills.
              </h1>
              <p className="mb-4">
                Exceptional employees consistently deliver outstanding
                performance and productivity. However, numerous organizations
                struggle immensely in their pursuit of identifying and retaining
                such top-tier talent.
              </p>
              <p>Support we provide includes:</p>
              <p>
                <i className="fa fa-check text-primary me-3"></i>Guidance and
                consultation for professional paths.
              </p>
              <p>
                <i className="fa fa-check text-primary me-3"></i>The most recent
                updates regarding hiring ministries.
              </p>
              <p>
                <i className="fa fa-check text-primary me-3"></i>Employment
                trends, and sought-after skills that are available.
              </p>
              <Link className="btn btn-primary rounded-0 py-3 px-5 mt-3" to="/">
                Read More
              </Link>
            </div>
          </div>
        </div>
      </div>      
      
      <section className="trending_jobs pt-75 pb-80 gray-bg">
          <div className="container">
              <div className="row align-items-center">
                  <div className="col-md-7">
                      <div className="section_title pb-25">
                          <h3 className="main_title">Featured Jobs</h3>
                          (<strong><span>Page {currentPage} of {" "} {totalJobs} Active Jobs Found</span></strong>)
                      </div>
                  </div>
              </div>
              <div className="tab-content" id="myTabContent">
                  <div className="tab-pane fade show active" id="trending" role="tabpanel" aria-labelledby="trending-tab">
                      <div className="row">
                        {jobs?.length > 0 ? (
                          jobs.map((j) => {
                            return (

                              <div className="col-lg-4 col-sm-6 mb-4">
                                  <div className="single_jobs text-center mt-30">
                                      <div className="jobs_image">
                                          <img src="../../assets/img/ProsoftSynergies.jpeg" alt="Company-Logo" />
                                      </div>
                                      <div className="jobs_content">
                                          <h4 className="jobs_title">
                                            <Link to={`/Job-Details/${j.slug}`}>
                                              {j.title.length > 30 ? `${j.title.substring(0, 30)}...` : j.title}
                                            </Link>
                                          </h4>
                                          <p className="sub_title">
                                            {/* <span style={{ color: "#000"}}>Recruiter</span>: {j?.jobPostedById?.firstname} {j?.jobPostedById?.lastname} */}
                                          </p>
                                      </div>
                                      <div className="jobs_meta d-flex justify-content-between">
                                          <p className="location"><i className="fa fa-map-marker"></i>{j?.country?.countryName}, {" "} <small>{j?.province?.provinceName}</small></p>
                                          <p className="time"><i className="fas fa-briefcase"></i> {j?.workMode?.workModeName}</p>
                                      </div>
                                      <p className="text-mute">
                                          <small className="me-5" style={{ fontSize: "12px", color: "#aaa" }}>
                                          <i className="fa fa-clock"></i> {" "} 
                                              Posted{" "}
                                              {moment
                                              .utc(new Date(j.jobPostDate))
                                              .local()
                                              .startOf("second")
                                              .fromNow(true)
                                              }{" "} ago
                                          </small>
                                          <small style={{ fontSize: "12px", color: "#aaa" }}>
                                          <i className="fas fa-business-time"></i>{" "}  
                                              Apply Before: {" "}                                            
                                              <span>{moment(j.deadlineDate).format("ll")}</span>
                                          </small>
                                      </p>
                                      <div className="jobs_btn">
                                          <Link to="#/" className="main-btn main-btn-2 me-3 rounded-0">
                                            Apply Now
                                          </Link>

                                          <Link to={`/Job-Details/${j.slug}`} className="main-btn main-btn-2 rounded-0">Read More</Link>
                                      </div>
                                  </div>
                              </div>
                            )
                          })
                        ) : 
                        (
                          <span style={{ fontWeight: '600' }}>
                            No More Jobs Found
                          </span>
                        )}
                        <nav className="jobspaginate mt-5" aria-label="Page navigation">
                          <ul className="jobspagination">
                                <li className="page-item me-3">
                                  <button className="page-link" onClick={prevPage}
                                  disabled={currentPage === 1}>
                                      <span aria-hidden="true">
                                          {/* <i className="fas fa-angles-left"></i> */}
                                          <SwapLeftOutlined style={{ marginRight: "2px", fontSize: "30px", position: "relative", top: "-3px" }}/> 
                                      </span>
                                  </button>
                              </li>
                              {pageNumbers.map((number) => (
                                    <li key={number} className={currentPage === number ? "page-item active disabled" : ""}>
                                      <Link
                                      onClick={() => pagination(number)}
                                      disabled={
                                          currentPage ===
                                          Math.ceil(totalJobs / 6)
                                      }
                                      to="#"
                                      className="page-link"
                                      >
                                      {number}
                                      </Link>
                                    </li>
                              ))}
                              <li className="page-item ms-2">
                                  <button className="page-link" onClick={nextPage} disabled={ currentPage === Math.ceil(totalJobs / 6)}>
                                  <span aria-hidden="true">
                                          {/* <i className="fas fa-angles-right"></i> */}
                                          <SwapRightOutlined style={{ marginRight: "2px", fontSize: "30px", position: "relative", top: "-3px" }}/> 
                                      </span>
                                  </button>
                              </li>
                          </ul>
                      </nav>
                      </div>
                  </div>
              </div>
          </div>
      </section>
      <Footer />
    </>
  );
};
export default Home;
