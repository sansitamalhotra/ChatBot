import React from "react";
import "react-toastify/dist/ReactToastify.css";

import "./Loader.css";

const Loader = () => {
  return (
    <div>
      <section
        id="general-content-120"
        className=""
        style={{
          background: "#ffffff",
          paddingTop: "50px",
          paddingBottom: "200px"
        }}
      >
        <div className="container-fluid  d-flex align-items-center justify-content-between  flex-column flex-md-row values-wrapper">
          <header className="d-flex flex-column  w-100 align-items-center justify-content-between pb-4">
            <div className="wrap-header  w-100">
              <article className="title w-100"></article>
              <article className="body w-100">
                <p align="justify">
                  <div className="loader">Loading...</div>
                </p>
              </article>
            </div>
          </header>
        </div>
      </section>
    </div>
  );
};

export default Loader;
