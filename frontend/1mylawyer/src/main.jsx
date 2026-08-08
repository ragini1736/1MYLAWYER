import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx';
import {BrowserRouter} from "react-router-dom";
import 'react-toastify/dist/ReactToastify.css';
import {ToastContainer} from 'react-toastify';
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.min.js";
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />
    <ToastContainer
      position="top-right"
      autoClose={3500}
      hideProgressBar={false}
      newestOnTop
      closeOnClick
      pauseOnHover
      theme="dark"
    />
  </BrowserRouter>,
)