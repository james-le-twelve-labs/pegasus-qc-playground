import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App"
import { EmbedResizer } from "./components/EmbedResizer"
import "./app.css"

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <EmbedResizer />
    <App />
  </React.StrictMode>,
)
