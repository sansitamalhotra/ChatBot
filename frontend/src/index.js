import React from "react";
import { createRoot } from "react-dom/client";
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
        <Router>
          <App />
        </Router>
      </AuthProvider>
    </Provider>
  </React.StrictMode>
);

// const root = ReactDOM.createRoot(document.getElementById("root"));
// root.render(
//   <React.StrictMode>
//     <App />
//   </React.StrictMode>
// );

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
