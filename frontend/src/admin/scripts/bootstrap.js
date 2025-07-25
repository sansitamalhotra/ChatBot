import React, { Component, useRef, useEffect, useState } from "react";

function loadError(onError) {
  console.error(`Failed ${onError.target.src} didn't load correctly`);
}

function BootstrapScript() {
  useEffect(() => {
    const LoadExternalScript = () => {
      const externalScript = document.createElement("script");
      externalScript.onerror = loadError;
      externalScript.id = "external";
      externalScript.async = true;
      externalScript.type = "text/javascript";
      externalScript.setAttribute("crossorigin", "anonymous");
      externalScript.src = `../../assets/admin/plugins/bootstrap/js/bootstrap.min.js`;
      document.body.appendChild(externalScript);
    };
    LoadExternalScript();
  }, []);

  return <></>;
}

export default BootstrapScript;
