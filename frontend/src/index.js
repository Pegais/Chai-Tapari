/**
 * Application Entry Point
 * 
 * Why: Initializes React application and renders root component
 * How: Renders App component into DOM root element
 * Impact: Starts the application and establishes React rendering context
 */

import React from "react"
import ReactDOM from "react-dom/client"
import "./index.css"
import App from "./App"

const root = ReactDOM.createRoot(document.getElementById("root"))
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

