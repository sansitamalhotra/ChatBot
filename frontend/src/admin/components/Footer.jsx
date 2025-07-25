import React, { Component, useRef, useEffect, useState } from "react";
import { NavLink, Link } from "react-router-dom";


const Footer = () => {

    return (

        <>
            <footer class="app-footer">
                <div class="container text-center py-3">
                    <small class="copyright">
                    <Link className="border-bottom" to="/">
                        Prosoft Synergies Admin
                    </Link>
                    , All Right Reserved.
                    </small>
                </div>
            </footer>
        </>
    );

};

export default Footer;