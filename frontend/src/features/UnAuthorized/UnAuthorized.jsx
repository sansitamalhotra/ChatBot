import ChangePageTitle from "../../utils/ChangePageTitle";
import React, { Component, useRef, useEffect, useState } from "react";
import { NavLink, Link } from "react-router-dom";


import "./UnAuthorized.css";

const UnAuthorized = () => {

    return (

        <div id="notfound">
            <div className="notfound">
                <div className="notfound-404">
                    <h1>:(</h1>
                </div>
                <h2>401 - Unauthorized Access</h2>
                <p>Access to this resource is restricted. You do not have the necessary authorization to proceed.</p>
                <Link to="/" onClick={() => { window.location.href = "/" }}>Home Page</Link>
            </div>
        </div>
    );
};

export default UnAuthorized;