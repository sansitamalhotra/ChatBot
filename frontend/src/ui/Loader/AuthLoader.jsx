import React from "react";
import "./Loader.css";

const AuthLoader = ({ message = "Verifying Access Level..." }) => {
  return (
    <div
      className="container-fluid d-flex align-items-center justify-content-center"
      style={{ minHeight: "100vh" }}
    >
      <div className="text-center">
        <div className="loader">Loading...</div>
        <h1 className="mt-3">{message}</h1>
      </div>
    </div>
  );
};

export default AuthLoader;
