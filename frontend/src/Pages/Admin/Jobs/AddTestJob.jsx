import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate  } from 'react-router-dom';
import { Helmet } from "react-helmet";
import API from '../../../helpers/API';

import { LogoutLink } from '../../Logout/Logout';
import { LogoutNavbarLink } from '../../Logout/LogoutNavbar';

import { DemoContainer } from "@mui/x-date-pickers/internals/demo";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import dayjs from "dayjs";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { Editor } from "@tinymce/tinymce-react";


import $ from 'jquery';
import 'bootstrap/dist/js/bootstrap.bundle.min';
import '../assets/vendors/mdi/css/materialdesignicons.min.css';
import '../assets/vendors/ti-icons/css/themify-icons.css';
import '../assets/vendors/css/vendor.bundle.base.css';
import '../assets/vendors/font-awesome/css/font-awesome.min.css';
import '../assets/vendors/bootstrap-datepicker/bootstrap-datepicker.min.css';
import '../assets/css/style.css';

// Fixed imports - import default exports
import initOffCanvas from '../assets/js/off-canvas';
import misc from '../assets/js/misc';
import settings from '../assets/js/settings';
import todolist from '../assets/js/todolist';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import { SidebarOpen } from 'lucide-react';

const Loader = () => (
  <div className="container text-center">
    <div className="spinner-border" role="status">
      <span className="sr-only">Loading...</span>
    </div>
  </div>
);

const AddTestJob = () => {
  const canonicalUrl = window.location.href; // Get the current URL
  const [isProBannerVisible, setIsProBannerVisible] = useState(true);

  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [messageDropdownOpen, setMessageDropdownOpen] = useState(false);

  const toggleProfileDropdown = () => {
    setProfileDropdownOpen(!profileDropdownOpen);
    if (messageDropdownOpen) setMessageDropdownOpen(false);
  };

  const toggleMessageDropdown = () => {
    setMessageDropdownOpen(!messageDropdownOpen);
    if (profileDropdownOpen) setProfileDropdownOpen(false);
  };

  useEffect(() => {
    // Initialize all custom JS functionality
    initOffCanvas();
    misc(); // Call the default export function
    settings(); // Call the default export function
    todolist(); // Call the default export function
    
    // Set up Bootstrap components
    $('[data-toggle="minimize"]').on('click', function() {
      $('body').toggleClass('sidebar-icon-only');
    });

    $('[data-toggle="offcanvas"]').on('click', function() {
      $('.sidebar-offcanvas').toggleClass('active');
    });
    
    // Handle fullscreen toggle
    $('#fullscreen-button').on('click', function() {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        document.documentElement.requestFullscreen();
      }
    });
  }, []);

  const closeBanner = () => {
    setIsProBannerVisible(false);
  };

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);

  // Toggle dropdowns  
  const toggleNotificationDropdown = () => {
    setNotificationDropdownOpen(!notificationDropdownOpen);
    setProfileDropdownOpen(false);
    setMessageDropdownOpen(false);
  };

  // Toggle sidebar (desktop)
  const toggleMinimize = () => {
    $('body').toggleClass('sidebar-icon-only');
  };

  // Toggle sidebar (mobile)
  const toggleMobileSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Handle click outside to close dropdowns
  useEffect(() => {
    function handleClickOutside(event) {
      if (!event.target.closest('.dropdown')) {
        setProfileDropdownOpen(false);
        setMessageDropdownOpen(false);
        setNotificationDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    // Initialize all custom JS functionality
    initOffCanvas();
    misc();
    settings();
    todolist();
    
    // Set up fullscreen toggle
    const fullscreenButton = document.getElementById('fullscreen-button');
    if (fullscreenButton) {
      fullscreenButton.addEventListener('click', () => {
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else {
          document.documentElement.requestFullscreen();
        }
      });
    }
    
    // Cleanup
    return () => {
      if (fullscreenButton) {
        fullscreenButton.removeEventListener('click', () => {});
      }
    };
  }, [])

const handleCancel = () => {
    navigate('/Admin/Test-Manage-Jobs'); // Replace '/desired-path' with the actual path you want to navigate to
};

  // ===========================================================
    const editorRef = useRef(null);
  
    const log = () => {
      if (editorRef.current) {
        console.log(editorRef.current.getContent());
      }
    };

    const navigate = useNavigate();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("")
    //const [filePath, setFilePath] = useState(null);
    //const filePathInputRef = useRef(null);
    const [deadlineDate, setDeadlineDate] = useState("");

    const [countries, setCountries] = useState([]);
    const [provinces, setProvinces] = useState([]);
    const [cities, setCities] = useState([]);
    const [qualifications, setQualifications] = useState([]);
    const [workExperiences, setWorkExperiences] = useState([]);
    const [workModes, setWorkModes] = useState([]);
    const [sectors, setSectors] = useState([]);

    const [country, setCountry] = useState("");
    const [province, setProvince] = useState("");
    const [city, setCity] = useState("");

    const [qualification, setQualification] = useState("");
    const [workExperience, setworkExperience] = useState("");
    const [workMode, setWorkMode] = useState("");
    const [sector, setSector] = useState("");
    const [loading, setLoading] = useState(false);

    const notifyErr = (msg) => toast.error(msg, 
        {position: "top-center", autoClose: 20000, closeOnClick: true, pauseOnHover: true, theme: "light" });
    const notifySucc = (msg) => toast.success(msg, 
        {position: "top-center", autoClose: 20000, closeOnClick: true, pauseOnHover: true, theme: "light" }); 

    
    useEffect(() => {
        // Fetch countries
            API.get('/api/v1/job/fetchCountries').then((res) => {
                setCountries(res.data);
            });
    }, []);

    useEffect(() => {
        // Fetch Cities
            API.get('/api/v1/city/getAllCities').then((res) => {
                setCities(res.data);
            });
    }, []);

    const handleCountryChange = (e) => {

        const countryId = e.target.value;
        setCountry(e.target.value);

        if (countryId) {
        // Fetch provinces by countryId
        API.get(`/api/v1/job/provinces/${countryId}`).then((response) => {
            setProvinces(response.data);
        });
        } else {
            setProvinces([]);
            setCities([]);
        }
    };

    const handleProvinceChange = (e) => {

        const provinceId = e.target.value;
        setProvince(e.target.value);

        if (provinceId) {
          // Fetch cities by provinceId
          API.get(`/api/v1/job/cities/${provinceId}`).then((response) => {
            setCities(response.data);
          });
        } else {
          setCities([]);
        }
    };

    useEffect(() => {
        fetchQualifications();
    }, []);

    const fetchQualifications = async () => {
        try
        {
            const { data } = await API.get("/api/v1/qualification/fetchQualifications");
            if (data?.success) {
                setQualifications(data?.qualifications);
            }
        }
        catch (error)
        {
            console.log(error);
            notifyErr("Oppss!!, FAILED, Something went Wrong Retrieving all Qualifications");
        }
    };

    useEffect(() => {
        fetchWorkExperiences();
    }, []);

    const fetchWorkExperiences = async () => {
        try
        {
            const { data } = await API.get("/api/v1/workExperience/fetchWorkExperiences");
            if (data?.success) {
                setWorkExperiences(data?.workExperiences);
            }
        }
        catch (error)
        {
            console.log(error);
            notifyErr("Oppss!!, FAILED, Something went Wrong Retrieving all Work Experiences");
        }
    };

    useEffect(() => {
        fetchWorkModes();
    }, []);

    const fetchWorkModes = async () => {
        try
        {
            const { data } = await API.get("/api/v1/workMode/fetchWorkModes");
            if (data?.success) {
                setWorkModes(data?.workModes);
            }
        }
        catch (error)
        {
            console.log(error);
            notifyErr("Oppss!!, FAILED, Something went Wrong Retrieving all Work Modes");
        }
    };

    useEffect(() => {
        fetchSectors();
    }, []);

    const fetchSectors = async () => {
        try
        {
            const { data } = await API.get("/api/v1/sector/fetchSectors");
            if (data?.success) {
                setSectors(data?.sector);
            }
        }
        catch (error)
        {
            console.log(error);
            notifyErr("Oppss!!, FAILED, Something went Wrong Retrieving all Sectors");
        }
    };

    const handleAddJobSubmit = async (e) => {
      e.preventDefault();
      setLoading(true); // Set loading state
      
      try {
          const formData = new FormData();
          formData.append('title', title);
          formData.append('description', description);
          formData.append('qualification', qualification);
          formData.append('workExperience', workExperience);
          formData.append('workMode', workMode);
          formData.append('sector', sector);
          formData.append('country', country);
          formData.append('province', province);
          formData.append("deadlineDate", deadlineDate);
          
          const response = await API.post('/api/v1/job/postJob', formData);
          
          // Check if the response indicates success
          if (response.data && response.data.success) {
              notifySucc(response.data.message || "Job created successfully!");
              
              // Add a small delay to ensure the toast notification is shown
              setTimeout(() => {
                  navigate("/Admin/Manage-Jobs");
              }, 500);
          } else {
              throw new Error(response.data?.message || "Job creation failed");
          }
      } catch (error) {
          console.error('Something Went Wrong, Failed to Add New Job', error);
          
          // Handle different types of errors
          if (error.response && error.response.data) {
              notifyErr(error.response.data.message || error.response.data.error || "Failed to add new job");
          } else {
              notifyErr("Oops!!! FAILED.. Something went wrong, New Job Failed to be added.");
          }
      } finally {
          setLoading(false); // Reset loading state
      }
  };


    return (
      <div className="container-scroller">
        <Helmet>
          <link rel="canonical" href={canonicalUrl} />
          <title>Admin Post Job | ProsoftSynergies</title>
          <meta name="description" content="Admin Post Job | ProsoftSynergies" />
        </Helmet>
        <Navbar 
          toggleMinimize={toggleMinimize} 
          toggleMobileSidebar={toggleMobileSidebar} 
        />
        <div className="container-fluid page-body-wrapper">
        {/* Sidebar */}
          <Sidebar isOpen={sidebarOpen} />
        {/* Main Panel */}
          <div className="main-panel">
            <div className="content-wrapper">
              <div className="page-header">
                <h3 className="page-title">
                  <span className="page-title-icon bg-gradient-primary text-white me-2">
                    <i className="mdi mdi-briefcase"></i>
                  </span> Add New Job
                </h3>
              </div>        
              <div className="row">
                <div className="col-9 grid-margin mx-auto">
                  <div className="card">
                    <div className="card-body">
                      <h4 className="card-title">Add New Job Form</h4>
                      <form className="forms-sample" encType="multipartmultipart/form-data" onSubmit={handleAddJobSubmit}>
                        <div className="form-group">
                          <label for="title">Job Title</label>
                            <input type="text" className="form-control" id="tite" placeholder="Job Title" name="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                          />
                        </div>
                        <div className="text-editor  form-group">
                          <label for="description">Description</label>
                          {/* <textarea className="form-control" id="exampleTextarea1" rows="4"></textarea> */}
                          <Editor
                          apiKey="yfz87enhl3qfafg5tw4xjj63zww0krvpqtkxbfn6nhc69f3u"
                          onInit={(evt, editor) => (editorRef.current = editor)}
                          initialValue=""
                          init={{
                            selector: "textarea#full-featured",
                            height: 500,
                            menubar: true,
                            formats: {
                              alignleft: {
                                selector:
                                  "p,h1,h2,h3,h4,h5,h6,td,th,div,ul,ol,li,table,img,audio,video",
                                classes: "left"
                              },
                              aligncenter: {
                                selector:
                                  "p,h1,h2,h3,h4,h5,h6,td,th,div,ul,ol,li,table,img,audio,video",
                                classes: "center"
                              },
                              alignright: {
                                selector:
                                  "p,h1,h2,h3,h4,h5,h6,td,th,div,ul,ol,li,table,img,audio,video",
                                classes: "right"
                              },
                              alignjustify: {
                                selector:
                                  "p,h1,h2,h3,h4,h5,h6,td,th,div,ul,ol,li,table,img,audio,video",
                                classes: "full"
                              },
                              bold: { inline: "span", classes: "bold" },
                              italic: { inline: "span", classes: "italic" },
                              underline: {
                                inline: "span",
                                classes: "underline",
                                exact: true
                              },
                              strikethrough: { inline: "del" },
                              forecolor: {
                                inline: "span",
                                classes: "forecolor",
                                styles: { color: "%value" }
                              },
                              hilitecolor: {
                                inline: "span",
                                classes: "hilitecolor",
                                styles: { backgroundColor: "%value" }
                              },
                              custom_format: {
                                block: "h1",
                                attributes: { title: "Header" },
                                styles: { color: "red" }
                              }
                            },
                            plugins:
                              "searchreplace, autolink, directionality, visualblocks, visualchars, image, link, media, codesample, table, charmap, pagebreak, nonbreaking, anchor, insertdatetime, advlist, lists, wordcount, help, charmap, emoticons, autosave preview importcss tinydrive searchreplace autolink autosave save directionality visualblocks visualchars fullscreen image link media codesample table charmap pagebreak nonbreaking anchor insertdatetime advlist lists wordcount help charmap quickbars emoticons",
                            mobile: {
                              plugins:
                                "preview powerpaste casechange importcss tinydrive searchreplace autolink autosave save directionality visualblocks visualchars fullscreen image link media codesample table charmap pagebreak nonbreaking anchor tableofcontents insertdatetime advlist lists wordcount help charmap quickbars emoticons"
                            },
                            menu: {
                              tc: {
                                title: "Comments",
                                items:
                                  "addcomment showcomments deleteallconversations"
                              }
                            },
                            menubar:
                              "file edit view insert format tools table tc help",
                            toolbar:
                              "undo redo | revisionhistory | aidialog aishortcuts | blocks fontsizeinput | bold italic | align numlist bullist | link image | table math media pageembed | lineheight  outdent indent | strikethrough forecolor backcolor formatpainter removeformat | charmap emoticons checklist | code fullscreen preview | save print | pagebreak anchor codesample footnotes mergetags | addtemplate inserttemplate | addcomment showcomments | ltr rtl casechange | spellcheckdialog a11ycheck",
                            autosave_ask_before_unload: true,
                            autosave_interval: "30s",
                            autosave_prefix: "{path}{query}-{id}-",
                            autosave_restore_when_empty: false,
                            autosave_retention: "2m",
                            image_advtab: true,
                            typography_rules: [
                              "common/punctuation/quote",
                              "en-US/dash/main",
                              "common/nbsp/afterParagraphMark",
                              "common/nbsp/afterSectionMark",
                              "common/nbsp/afterShortWord",
                              "common/nbsp/beforeShortLastNumber",
                              "common/nbsp/beforeShortLastWord",
                              "common/nbsp/dpi",
                              "common/punctuation/apostrophe",
                              "common/space/delBeforePunctuation",
                              "common/space/afterComma",
                              "common/space/afterColon",
                              "common/space/afterExclamationMark",
                              "common/space/afterQuestionMark",
                              "common/space/afterSemicolon",
                              "common/space/beforeBracket",
                              "common/space/bracket",
                              "common/space/delBeforeDot",
                              "common/space/squareBracket",
                              "common/number/mathSigns",
                              "common/number/times",
                              "common/number/fraction",
                              "common/symbols/arrow",
                              "common/symbols/cf",
                              "common/symbols/copy",
                              "common/punctuation/delDoublePunctuation",
                              "common/punctuation/hellip"
                            ],
                            typography_ignore: ["code"],
                            importcss_append: true,
                            image_caption: true,
                            quickbars_selection_toolbar:
                              "bold italic | quicklink h2 h3 blockquote quickimage quicktable",
                            noneditable_class: "mceNonEditable",
                            toolbar_mode: "sliding",
                            spellchecker_ignore_list: [
                              "Ephox",
                              "Moxiecode",
                              "tinymce",
                              "TinyMCE"
                            ],
                            tinycomments_mode: "embedded",
                            content_style: ".mymention{ color: gray; }",
                            contextmenu:
                              "link image editimage table configurepermanentpen",
                            a11y_advanced_options: true,
                            font_formats:
                              "Andale Mono=andale mono,times; Arial=arial,helvetica,sans-serif; Arial Black=arial black,avant garde; Book Antiqua=book antiqua,palatino; Comic Sans MS=comic sans ms,sans-serif; Courier New=courier new,courier; Georgia=georgia,palatino; Helvetica=helvetica; Impact=impact,chicago; Oswald=oswald; Symbol=symbol; Tahoma=tahoma,arial,helvetica,sans-serif; Terminal=terminal,monaco; Times New Roman=times new roman,times; Trebuchet MS=trebuchet ms,geneva; Verdana=verdana,geneva; Webdings=webdings; Titillium Web=titillium; Wingdings=wingdings,zapf dingbats",
                            content_style:
                              "@import url('https://fonts.googleapis.com/css2?family=Titillium+Web:ital,wght@0,200;0,300;0,400;0,600;0,700;0,900;1,200;1,300;1,400;1,600&family=Ubuntu:ital,wght@0,300;0,400;0,500;0,700;1,300;1,400;1,500;1,700&display=swap'); body { font-family: Titillium Web, sans-serif; }",
                            height: 500
                          }}
                          id="description"
                          name="description"
                          onChange={(e) => setDescription(e.target.getContent())}
                        />
                        </div>
                        <div className="form-group">
                          <div className='row'>
                            <div className='col-md-6'>
                              <select className="form-select form-control" 
                                name="jobQualification"
                                value={qualification}
                                onChange={(e) => setQualification(e.target.value)}
                              >
                                <option>Select Qualification For Job</option>
                                {qualifications.map((q) => {
                                    return (
                                        <option key={q._id} value={q._id}>
                                            {q.qualificationName}
                                        </option>
                                    );
                                })}
                              </select>
                            </div>
                            <div className='col-md-6'>
                              <select className="form-select form-control" name="workExperience"
                                value={workExperience}
                                onChange={(e) => setworkExperience(e.target.value)}
                              >
                                <option>Select Required Job Experience</option>
                                {workExperiences.map((we) => {
                                    return (
                                        <option key={we._id} value={we._id}>
                                            {we.workExperienceName}
                                        </option>
                                    );
                                })}
                              </select>
                            </div>
                          </div>
                        </div>
                        <div className="form-group">
                          <div className='row'>
                            <div className='col-md-6'>
                              <select className="form-select form-control" name="sector"
                                value={sector}
                                onChange={(e) => setSector(e.target.value)}
                              >
                                <option>Select Job Sector</option>
                                {sectors.map((s) => {
                                    return (
                                        <option key={s._id} value={s._id}>
                                            {s.sectorName}
                                        </option>
                                    );
                                })}
                              </select>
                            </div>
                            <div className='col-md-6'>
                              <select className="form-select form-control"
                                name="workMode"
                                value={workMode}
                                onChange={(e) => setWorkMode(e.target.value)}
                              >
                                <option>Select Work Mode</option>
                                {workModes.map((wm) => {
                                    return (
                                        <option key={wm._id} value={wm._id}>
                                            {wm.workModeName}
                                        </option>
                                    );
                                })}
                              </select>
                            </div>
                          </div>
                        </div>
                        <div className="form-group">
                          <div className='row'>
                            <div className='col-md-6'>
                              <select className="form-select form-control"
                                name="country"
                                onChange={handleCountryChange}
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
                            <div className='col-md-6'>
                              <select className="form-select form-control"
                                name="province"
                                onChange={handleProvinceChange}
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
                        </div>
                        {/* <div className="form-group">
                            <div className='col-md-12'>
                             {provinceFile
                              ? provinceFile.name
                              : "Upload Job Matix Attachment"}
                            <input
                              id="provinceFile"
                              name="provinceFile"
                              ref={provinceFileInputRef}
                              className="form-control rounded-0 mt-2"
                              type="file"
                              onChange={(e) => setProvinceFile(e.target.files[0])}
                            />
                            <div>
                                {provinceFile && (
                                  <div>
                                    <file
                                      src={URL.createObjectURL(provinceFile)}
                                      alt="Uploaded File Attachment"
                                      height={"400px"}
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                        </div>    */}
                        <div className="form-group">
                            <div className='col-md-12'>
                              <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DemoContainer
                                  components={["DateTimePicker", "DateTimePicker"]}
                                >
                                  <DateTimePicker
                                    label="Deadline Date"
                                    value={deadlineDate}
                                    onChange={(value) => setDeadlineDate(value)}
                                  />
                                </DemoContainer>
                              </LocalizationProvider>
                            </div>
                        </div>                      
                        <div className='row'>
                          <div className='col-md-6'>
                            <button type="submit" className="btn btn-gradient-primary me-2" disabled={loading}>
                            {loading ? <Loader /> : "Add Job"}
                            </button>
                          </div>
                          <div className='col-md-6'>
                            <button className="btn btn-warning" onClick={handleCancel}>Cancel</button>
                          </div>
                        </div>
                    </form>
                    </div>
                  </div>
                </div>
              </div>
            </div>            
            {/* Footer */}
            <Footer />
          </div>
      </div>
    </div>
  );    
};

export default AddTestJob;
