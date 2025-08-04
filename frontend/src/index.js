import React from "react";
import { createRoot } from "react-dom/client";
import { SocketProvider } from './Context/SocketContext';
// eslint-disable-next-line
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import 'bootstrap/dist/css/bootstrap.min.css';
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { Provider } from "react-redux";
import store from './store';
import { AuthProvider } from "./Context/AuthContext";
const container = document.getElementById("root");
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <AuthProvider>
        <SocketProvider>
           <Router>
            <App />
          </Router>
       </SocketProvider>
      </AuthProvider>
    </Provider>
  </React.StrictMode>
);
reportWebVitals();
