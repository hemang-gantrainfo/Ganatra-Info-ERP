import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import AdminHeader from "../Header-Footer/Admin-Header";
import Footer from "../Header-Footer/Footer";

const Layout: React.FC = () => {
  const [sidebarWidth, setSidebarWidth] = useState(50);
  const [padding, setPadding] = useState("80px 30px 60px 30px");

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setPadding("75px 10px 60px 10px");
      } else {
        setPadding("80px 30px 60px 30px");
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div style={{ display: "flex" }}>
      <AdminHeader setSidebarWidth={setSidebarWidth} />

      <main style={{
        flexGrow: 1, padding: padding, marginLeft: sidebarWidth, transition: "margin 0.3s ease", backgroundColor: "#fff", minHeight: "100vh",
        minWidth: "-webkit-fill-available",
      }} >
        <Outlet />
      </main>
      <Footer sidebarWidth={sidebarWidth} />
    </div>
  );
};

export default Layout;
