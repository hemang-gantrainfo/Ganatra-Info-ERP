import React from "react";

interface FooterProps {
    sidebarWidth: number;
}

const Footer: React.FC<FooterProps> = ({ sidebarWidth }) => {
    return (
        <footer style={{
            position: "fixed", bottom: 0, left: 0, right: 0, height: 53, backgroundColor: "#272324", color: "#ffffff",
            borderTop: "1px solid #dadbdc", borderBottom: "1px solid transparent", display: "flex", alignItems: "center", zIndex: 1000, fontSize: 14, fontWeight: 500,
            padding: "0 20px"
        }}>
            <div style={{ flex: 1 }}></div>
            <div style={{ flex: 1 }}>© 2025 Ganatra Info. All rights reserved.</div>
            <div>Version 1.1.1</div>
        </footer>
    );
};

export default Footer;
