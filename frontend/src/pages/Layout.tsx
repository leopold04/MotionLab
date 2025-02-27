// main container for our dashboard / video editor /  video library pages
import Sidebar from "../components/Sidebar";
import { Outlet } from "react-router-dom";
import "../styles/Layout.css";

// rename this to root later
function Layout() {
  return (
    <div className="container">
      <Sidebar />
      <Outlet />
    </div>
  );
}

export default Layout;
