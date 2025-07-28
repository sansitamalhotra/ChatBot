import ChangePageTitle from "../../utils/ChangePageTitle";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import API from "../../helpers/API";
import { useAuth } from "../../Context/AuthContext";
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import { SwapRightOutlined, SwapLeftOutlined, PlusCircleOutlined  } from '@ant-design/icons';
import moment from "moment";
<<<<<<< HEAD
import DOMPurify from "dompurify";
import { toast } from 'react-toastify';
=======
import { sanitize } from "dompurify";
import { ToastContainer, toast } from 'react-toastify';
>>>>>>> 70012aa81f892e1d2921405cffcad0e7f7616d98
import "react-toastify/dist/ReactToastify.css";
import "./customjob.css";

const { sanitize } = DOMPurify;

const Jobs = () => {
    const [auth, setAuth] = useAuth();
    const params = useParams();
    const [jobs, setJobs] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [totalJobs, setTotalJobs] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [jobsPerPage, setJobsPerPage] = useState(5);
    const [loading, setLoading] = useState(false);   
    const [sectors, setSectors] = useState([]);
    const [checkedSectors, setCheckedSectors] = useState([]);
    const [disableJobSectorButton, setDisableJobSectorButton] = useState(false);
    const [workModes, setWorkModes] = useState([]);
    const [checkedWorkModes, setCheckedWorkModes] = useState([]);
    const [workExperiences, setWorkExperiences] = useState([]);
    const [checkedWorkExperiences, setCheckedWorkExperiences] = useState([]);

    const notifyErr = (msg) => toast.error(msg, 
        {position: "top-center", autoClose: 20000, closeOnClick: true, pauseOnHover: true, theme: "light" });
    const notifySucc = (msg) => toast.success(msg, 
        {position: "top-center", autoClose: 20000, closeOnClick: true, pauseOnHover: true, theme: "light" }); 

const fetchJobData = useCallback(async () => {
        try {
            setLoading(true);
            const [jobResponse, sectorResponse, workModeResponse, workExperienceResponse] = await Promise.all([
                API.get(`/api/v1/job/fetchAllJobs?page=${currentPage}`, { params: { search: searchTerm } }),
                API.get("/api/v1/job/sectors"),
                API.get("/api/v1/job/workModes"),
                API.get("/api/v1/job/workExperiences")
            ]);

            const { result, totalJobs } = jobResponse.data;
            setJobs(result);
            setTotalJobs(totalJobs);
            setSectors(sectorResponse.data.result);
            setWorkModes(workModeResponse.data.result);
            setWorkExperiences(workExperienceResponse.data.result);
        } catch (error) {
            console.error(error);
            notifyErr(error.response?.data?.message || "An error occurred");
        } finally {
            setLoading(false);
        }
    }, [currentPage, searchTerm]);
useEffect(() => {
        fetchJobData();
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, [fetchJobData]);

    
const loadMoreJobSectors = async () => {
    const res = await API.get("/api/v1/job/allSectors");
    const newSectors = res.data.slice(sectors.length, sectors.length + 2);
    setSectors([...sectors, ...newSectors]);
    setDisableJobSectorButton(newSectors.length < 2);
  };

  const handleLoadMoreJobSectors = async () => {
    loadMoreJobSectors();
  };

  const handleSectorCheckboxChange = (slug) => {
    if (checkedSectors.includes(slug)) {
      setCheckedSectors(checkedSectors.filter((s) => s !== slug));
    } else {
      setCheckedSectors([...checkedSectors, slug]);
    }
  };

    const handleCheckboxChange = (setter, value, checkedValues) => {
        setter(checkedValues.includes(value) 
            ? checkedValues.filter((v) => v !== value) 
            : [...checkedValues, value]);
        setCurrentPage(1);
    };

    let filteredJobs = useMemo(() => {
        return jobs.filter(job => {
            const matchesSector = checkedSectors.length === 0 || checkedSectors.includes(job.sector.slug);
            const matchesWorkMode = checkedWorkModes.length === 0 || checkedWorkModes.includes(job.workMode.slug);
            const matchesWorkExperience = checkedWorkExperiences.length === 0 || checkedWorkExperiences.includes(job.workExperience.slug);
            return matchesSector && matchesWorkMode && matchesWorkExperience;
        });
    }, [jobs, checkedSectors, checkedWorkModes, checkedWorkExperiences]);

  const handleworkModesCheckboxChange = (slug) => {
    if (checkedWorkModes.includes(slug)) {
      setCheckedWorkModes(checkedWorkModes.filter((j) => j !== slug));
    } else {
      setCheckedWorkModes([...checkedWorkModes, slug]);
    }
  };

  const handleWorkExperienceCheckboxChange = (slug) => {
    if (checkedWorkExperiences.includes(slug)) {
      setCheckedWorkExperiences(checkedWorkExperiences.filter((j) => j !== slug));
    } else {
      setCheckedWorkExperiences([...checkedWorkExperiences, slug]);
    }
  };

  const generatePageNumbers = () => {
    const maxPaginationNumbers = 5;
    const startPage = Math.max(1, currentPage - Math.floor(maxPaginationNumbers / 2));
    const endPage = Math.min(startPage + maxPaginationNumbers - 1, totalPages);  
    return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
};

const totalPages = Math.ceil(totalJobs / jobsPerPage);
const nextPage = () => {
    if (currentPage < totalPages) {
        setCurrentPage(currentPage + 1);
    }
};  
const prevPage = () => {
    if (currentPage  > 1) {
      setCurrentPage(currentPage -  1);
    }
};

const pagination = (pageNumber) => setCurrentPage(pageNumber);
const pageNumbers = generatePageNumbers();


if (checkedSectors.length) {
  filteredJobs = filteredJobs.filter((job) =>
    checkedSectors.includes(job.sector.slug)
  );
}

if (checkedWorkModes.length) {
    filteredJobs = filteredJobs.filter((job) =>
        checkedWorkModes.includes(job.workMode.slug)
    );
}

if (checkedWorkExperiences.length) {
    filteredJobs = filteredJobs.filter((job) =>
      checkedWorkExperiences.includes(job.workExperience.slug)
    );
}

const handleSearch = (event) => {
    setSearchTerm(event.target.value);
};

const changePage = (page) => {
    if (page >= 1 && page <= totalPages) {
        setCurrentPage(page);
    }
};
    return (
        <>
            <Header />
            <ChangePageTitle customPageTitle="Browse Jobs | ProfostSynergies" />
            <div className="container-fliud py-5 bg-dark page-header-jobs mb-5">
                <div className="container my-5 pt-5 pb-4">
                    <h1 className="display-3 text-white mb-3 animated slideInDown">Browse Jobs</h1>
                    <nav aria-label="breadcrumb">
                        <ol className="breadcrumb text-uppercase">
                            <li className="breadcrumb-item"><Link to="/">Home</Link></li>
                            <li className="breadcrumb-item text-white active" aria-current="page">
                                Jobs
                            </li>
                        </ol>
                    </nav>
                </div>
            </div>
            <div className="job-listing-area">
                <div className="container mt-20">
                    <div className="row">
                        <div className="col-xl-12 col-md-12 col-lg-12">
                            <div className="input-box">
                                <i className="fas fa-search"></i>
                                <input 
                                    type="text" 
                                    placeholder="Search Keywords such as Job title..." 
                                    value={searchTerm}
                                    onChange={handleSearch} 
                                    
                                />
                                {/* <button className="button">Search</button> */}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="job-listing-area pt-120 pb-120">
                <div className="container">
                    <div className="row">
                        <div className="col-xl-3 col-lg-3 col-md-4">
                            <div className="row">
                                <div className="col-12">
                                    <div className="small-section-tittle2 mb-45">
                                        <div className="ion"> 
                                            <svg 
                                            xmlns="http://www.w3.org/2000/svg"
                                            xmlnsXlink="http://www.w3.org/1999/xlink"
                                            width="20px" height="12px">
                                            <path fill-rule="evenodd"  fill="rgb(27, 70, 107)"
                                                d="M7.778,12.000 L12.222,12.000 L12.222,10.000 L7.778,10.000 L7.778,12.000 ZM-0.000,-0.000 L-0.000,2.000 L20.000,2.000 L20.000,-0.000 L-0.000,-0.000 ZM3.333,7.000 L16.667,7.000 L16.667,5.000 L3.333,5.000 L3.333,7.000 Z"/>
                                            </svg>
                                        </div>
                                        <h3>Filter Jobs</h3>
                                    </div>
                                </div>
                            </div>
                            <div className="job-category-listing mb-50">
                                <div className="single-listing">
                                    <div className="select-Categories pt-10 pb-30">
                                        <div className="small-section-tittle2">
                                            <h4>Job Sector</h4>
                                        </div>
                                        {sectors.map(sector => (
                                            <label key={sector.slug} className="container">
                                                <input 
                                                    type="checkbox" 
                                                    value={sector.slug} 
                                                    id={sector.slug}
                                                    // checked={checkedSectors.includes(
                                                    //     sector.slug
                                                    // )}
                                                    // onChange={() =>
                                                    //     handleSectorCheckboxChange(sector.slug)
                                                    // }
                                                    checked={checkedSectors.includes(sector.slug)}
                                                    onChange={() => handleCheckboxChange(setCheckedSectors, sector.slug, checkedSectors)}
                                                />
                                                {sector.sectorName}
                                                <span className="checkmark"></span>
                                            </label>
                                        ))}
                                        <label className="container">
                                            <button
                                                onClick={handleLoadMoreJobSectors}
                                                className="btn btn-primary"
                                                disabled={disableJobSectorButton}
                                                style={{
                                                    display: disableJobSectorButton
                                                    ? "none"
                                                    : "block",
                                                    opacity: 1,
                                                    transition: "opacity 300ms ease-in",
                                                }}
                                                >
                                                {" "}
                                                Load More Sectors{" "}
                                                <PlusCircleOutlined
                                                    style={{ fontSize: "20px" }}
                                            />
                                            </button>
                                        </label>
                                    </div>
                                    <div className="select-Categories pt-10 pb-20">
                                        <div className="small-section-tittle2">
                                            <h4>Job Mode Type</h4>
                                        </div>
                                        {workModes.map(wm => (
                                            <label key={wm.slug} className="container">
                                                <input 
                                                    type="checkbox" 
                                                    value={wm.slug} 
                                                    id={wm.slug}
                                                    checked={checkedWorkModes.includes(
                                                        wm.slug
                                                    )}
                                                    onChange={() =>
                                                    handleworkModesCheckboxChange(wm.slug)
                                                    }
                                                />
                                                {wm.workModeName}
                                                <span className="checkmark"></span>
                                            </label>
                                        ))}
                                    </div>
                                    <div className="select-Categories pt-10 pb-20">
                                        <div className="small-section-tittle2">
                                            <h4>Job Experience</h4>
                                        </div>
                                        {workExperiences.map(we => (
                                            <label key={we.slug} className="container">
                                                <input 
                                                    type="checkbox" 
                                                    value={we.slug} 
                                                    id={we.slug}
                                                    checked={checkedWorkExperiences.includes(
                                                        we.slug
                                                    )}
                                                    onChange={() =>
                                                    handleWorkExperienceCheckboxChange(we.slug)
                                                    }
                                                />
                                                {we.workExperienceName}
                                                <span className="checkmark"></span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-xl-9 col-lg-9 col-md-8">
                            <section className="featured-job-area">
                                <div className="container">
                                    <div className="row">
                                        <div className="col-lg-12">
                                            <div className="count-job mb-50">
                                                <span>
                                                <strong><span>Page {currentPage} of {" "} {totalJobs}  Jobs Found</span></strong>
                                                </span>
                                                <div className="select-job-items">
                                                    {/* <span>Sort by</span>
                                                    <select name="select">
                                                        <option value="">None</option>
                                                        <option value="">20</option>
                                                        <option value="">50</option>
                                                        <option value="">100</option>
                                                    </select> */}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    {filteredJobs?.length > 0 ? (
                                        filteredJobs.map((j) => {
                                        return (
                                            <div className="single-job-items mb-10">
                                                <div className="job-items mb-10 mt-10">
                                                    <div className="company-img">
                                                        <Link to={`/Job-Details/${j.slug}`}>
                                                            <img src="../../assets/img/ProsoftSynergies.jpeg" alt="" />
                                                        </Link>
                                                    </div>
                                            <div className="job-tittle job-tittle2">
                                                <Link to={`/Job-Details/${j.slug}`}>
                                                    <h4>
                                                    <Link to={`/Job-Details/${j.slug}`}>
                                                        {j.title.length > 25 ? `${j.title.substring(0, 25)}...` : j.title}
                                                    </Link>
                                                    </h4>
                                                </Link>
                                                <ul>
                                                    <li><i className="fas fa-map-marker-alt"></i>
                                                         {j?.province?.provinceName}, {" "} {j?.country?.countryName}
                                                    </li>
                                                    <li>
                                                    <i className="fas fa-briefcase"></i> {j?.workMode?.workModeName}  
                                                    </li>
                                                    <li>
                                                        <i className="fas fa-business-time"></i>      
                                                       <span dangerouslySetInnerHTML={{
                                                        __html: j?.sector?.sectorName ? sanitize(j?.sector?.sectorName.substring(0, 20)) + (j?.sector?.sectorName.length > 20 ? "..." : "") : ""
                                                    }}>
                                                        </span>                                   
                                                    </li>
                                                </ul>
                                            </div>
                                        </div>
                                        <div className="items-link items-link2 f-right">
                                            {!auth.user ? (
                                                <>
                                                <Link to="/Login">Login to Apply</Link>
                                                </>
                                            ) : auth.user?.role === 1 || auth.user?.role === 2 ? (
                                                <>
                                                 <Link to="#">Not Allowed</Link>
                                                </>
                                            ) : (
                                                <>
                                                {j.jobApplications?.find((application) => application.user === auth.user.userId && application.job === j._id) ? (
                                                    <>
                                                    <Link to="#">
                                                        <span className="appliedAlready" >
                                                            {/* Applied on  */}
                                                            Applied
                                                        </span>
                                                    </Link>
                                                    </>
                                                ) : (
                                                    <>
                                                    <Link to={`/Account/Apply-Job/${j.slug}`}>
                                                        Apply Now
                                                    </Link>
                                                    </>
                                                )}
                                                </>
                                            )}
                                            
                                            <small>Posted {" "}
                                                {moment
                                                .utc(new Date(j.jobPostDate))
                                                .local()
                                                .startOf("second")
                                                .fromNow(true)
                                                }{" "} ago
                                            </small>
                                        </div>
                                        <div className="listingJD" style={{ padding: "10px"}}
                                            dangerouslySetInnerHTML={{
                                                __html: j.description ? sanitize(j.description.substring(0, 400)) + (j.description.length > 400 ? "..." : "") : ""
                                            }}
                                        ></div>
                                        <hr />
                                        <small>
                                            Apply Before: <strong className="ms-1">{moment(j.deadlineDate).format("ll")}</strong>
                                        </small>
                                    </div>
                                        )
                                    })) : (
                                    <span style={{ fontWeight: '600' }}>
                                        No More Jobs Found
                                    </span>
                                    )}
                                    <nav className="jobspaginate mt-5 mb-5" aria-label="Page navigation">
                                        <ul className="jobspagination">
                                            <li className="page-item me-3">
                                                <button className="page-link" onClick={() => changePage(currentPage - 1)} disabled={currentPage === 1}>
                                                    <span aria-hidden="true">
                                                    <SwapLeftOutlined style={{ marginRight: "2px", fontSize: "30px", position: "relative", top: "-3px" }}/> 
                                                    </span>
                                                </button>
                                                </li>
                                                {pageNumbers.map((number) => (
                                                    <li key={number} className={currentPage === number ? "page-item active disabled" : ""}>
                                                        <Link
                                                        onClick={() => pagination(number)}
                                                        disabled={currentPage === totalPages}
                                                        to="#"
                                                        className="page-link"
                                                        >
                                                        {number}
                                                        </Link>
                                                    </li>
                                                ))}
                                                <li className="page-item ms-2">
                                                <button className="page-link" onClick={() => changePage(currentPage + 1)} disabled={currentPage === totalPages}>
                                                    <span aria-hidden="true">
                                                    <SwapRightOutlined style={{ marginRight: "2px", fontSize: "30px", position: "relative", top: "-3px" }}/> 
                                                    </span>
                                                </button>
                                            </li>
                                        </ul>
                                    </nav>
                                </div>
                            </section>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </>
    );
}; 
<<<<<<< HEAD


export default Jobs;
=======
export default Jobs;
>>>>>>> 70012aa81f892e1d2921405cffcad0e7f7616d98
