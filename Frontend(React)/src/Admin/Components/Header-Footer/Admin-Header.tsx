import React, { useState, useEffect } from "react";
import { AppBar, Toolbar, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, IconButton, useMediaQuery, useTheme, Tooltip, Box, Button, Avatar,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import LogoutIcon from "@mui/icons-material/Logout";
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import ImportContactsIcon from '@mui/icons-material/ImportContacts';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import Groups2OutlinedIcon from '@mui/icons-material/Groups2Outlined';
import { useNavigate, useLocation } from "react-router-dom";
import AuthService from "../../../Services/AuthService";
import WestIcon from '@mui/icons-material/West';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import axios from "axios";
import Swal from "sweetalert2";
import API_URL from "../../../config";
import { HelpCircle } from "lucide-react";
import { closeLoading, showLoading } from "../../../General/Loader";
const drawerWidth = 200;
const collapsedWidth = 75;

interface AdminHeaderProps {
  setSidebarWidth: (width: number) => void;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({ setSidebarWidth }) => {
  const [sidebarWidth, setLocalSidebarWidth] = useState(collapsedWidth);
  const [mode, setMode] = useState<"hover" | "fixed">("hover");
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openLogoutDialog, setOpenLogoutDialog] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();
  const userRole = AuthService.getUser()?.role;

  const menus = [
    { key: "dashboard", label: "Dashboard", icon: <DashboardOutlinedIcon />, path: "/dashboard" },
    { key: "products", label: "Products", icon: <ShoppingCartOutlinedIcon />, path: "/products" },
    { key: "order", label: "Order", icon: <ImportContactsIcon />, path: "/orders" },
    // { key: "category", label: "Categories", icon: <LibraryAddCheckOutlinedIcon />, path: "/categories" },
    // { key: "brands", label: "Brands", icon: <BeenhereOutlinedIcon />, path: "/brands" },
    { key: "users", label: "Users", icon: <Groups2OutlinedIcon />, path: "/users" },
    { key: "settings", label: "Settings", icon: <SettingsOutlinedIcon />, path: "/settings" },
  ];

  const filteredMenus = userRole === "user" ? menus.filter(m => m.key !== "settings") : menus;

  useEffect(() => {
    const active = menus.find(m => location.pathname.startsWith(m.path));
    setActiveMenu(active ? active.key : null);

    if (isMobile) {
      setSidebarWidth(0);
      setLocalSidebarWidth(0);
    } else {
      const width = mode === "fixed" ? drawerWidth : collapsedWidth;
      setSidebarWidth(width);
      setLocalSidebarWidth(width);
    }

  }, [location.pathname, isMobile, mode]);

  useEffect(() => {
    const checkUser = async () => {
      showLoading(3000);
      try {
        const token = AuthService.getToken();
        const user = AuthService.getUser();
        if (!token || !user?.id) return;

        const response: any = await axios.post(`${API_URL}/check-user`, {
          user_id: user.id,
          token,
        });

        if (response.data?.status === true) {
          const updatedUser = response.data.user;
          setUserEmail(updatedUser.email);
          setUserName(`${updatedUser.first_name} ${updatedUser.last_name}`);
        } else {
          AuthService.logout();
          navigate("/login");
          Swal.fire({
            icon: "error",
            title: response.data.message || "Session expired",
            text: "Please log in again.",
            confirmButtonColor: "#fc4e15",
          });
        }
      } catch (error: any) {
      } finally {
        closeLoading();
      }
    };
    checkUser();
    const interval = setInterval(checkUser, 120000);
    return () => clearInterval(interval);
  }, [location.pathname]);


  const toggleSidebarMode = () => {
    const nextMode = mode === "hover" ? "fixed" : "hover";
    setMode(nextMode);
    const width = nextMode === "fixed" ? drawerWidth : collapsedWidth;
    setSidebarWidth(width);
    setLocalSidebarWidth(width);
  };

  const handleToggleMenuIcon = () => {
    setIsMenuOpen(!isMenuOpen);
    if (isMobile) {
      handleMobileDrawerToggle();
    } else {
      toggleSidebarMode();
    }
  };

  const handleMobileDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuClick = (path: string) => {
    navigate(path);
    if (isMobile) setMobileOpen(false);
  };

  const handleLogoutClick = () => {
    setOpenLogoutDialog(true);
  };

  const handleConfirmLogout = () => {
    localStorage.removeItem("authToken");
    setOpenLogoutDialog(false);
    navigate("/login");
  };

  const handleCancelLogout = () => {
    setOpenLogoutDialog(false);
  };

  const isUserPage = location.pathname === "/users";
  const handleClick = () => {
    if (!isUserPage) navigate("/users");
  };

  const drawerContent = (
    <>
      <Box sx={{ display: "flex", flexDirection: "column", height: "100%", background: "#272324", border: "none" }}>
        <Toolbar sx={{ justifyContent: "center", py: 2, px: { xs: 0, sm: sidebarWidth === drawerWidth ? 2 : 0 } }}>
          <IconButton onClick={handleToggleMenuIcon} disableRipple sx={{ color: "#fff" }}>
            {isMenuOpen ? <WestIcon /> : <MenuIcon />}
          </IconButton>
        </Toolbar>

        <List>
          {filteredMenus.map(menu => {
            const isCollapsed = sidebarWidth < drawerWidth && !mobileOpen;
            return (
              <ListItem key={menu.key} disablePadding>
                <Tooltip title={isCollapsed ? menu.label : ""} placement="right" arrow>
                  <ListItemButton
                    onClick={() => handleMenuClick(menu.path)}
                    sx={{
                      py: sidebarWidth >= drawerWidth || mobileOpen ? 1.2 : 1.5,
                      justifyContent: sidebarWidth >= drawerWidth || mobileOpen ? "flex-start" : "center",
                      px: sidebarWidth >= drawerWidth || mobileOpen ? 4 : 0,
                      color: "#fff",
                    }} >
                    <ListItemIcon sx={{
                      backgroundColor: sidebarWidth >= drawerWidth ? "" : activeMenu === menu.key ? "#fc4e15" : "",
                      borderRadius: sidebarWidth >= drawerWidth ? "" : activeMenu === menu.key ? "50%" : "",
                      padding: sidebarWidth >= drawerWidth ? "" : activeMenu === menu.key ? "7px" : "", minWidth: 0,
                      mr: sidebarWidth >= drawerWidth || mobileOpen ? 1 : 0,
                      justifyContent: "center",
                      color: sidebarWidth >= drawerWidth ? activeMenu === menu.key ? "#fc4e15" : "#fff" : activeMenu === menu.key ? "#fff" : "#fff",
                    }} >
                      {menu.icon}
                    </ListItemIcon>
                    {(sidebarWidth >= drawerWidth || mobileOpen) && (
                      <ListItemText style={{ color: activeMenu === menu.key ? "#fc4e15" : "#fff" }} primary={menu.label} />
                    )}
                  </ListItemButton>
                </Tooltip>
              </ListItem>
            );
          })}
        </List>
      </Box>

      <Box sx={{ pt: "auto", pb: sidebarWidth >= drawerWidth ? "0px" : "4px", px: "auto", background: "#272324", border: "none", }} >
        <ListItem disablePadding>
          <ListItemButton onClick={handleLogoutClick} sx={{ background: "transparent", "&:hover": { background: "transparent" } }} >
            <LogoutIcon sx={{ ml: 1, color: "#fff" }} />
            {(sidebarWidth >= drawerWidth || mobileOpen) && (
              <ListItemText primary="Logout" sx={{ ml: 1, color: "#fff" }} />
            )}
          </ListItemButton>
        </ListItem>
      </Box>
    </>
  );

  return (
    <>
      <AppBar position="fixed" sx={{
        marginLeft: !isMobile ? `${sidebarWidth}px` : 0,
        width: !isMobile ? `calc(100% - ${sidebarWidth - 2}px)` : "100%", top: "-2px", transition: "all 0.3s ease", zIndex: 1201,
        minHeight: isMobile ? "50px" : undefined, backgroundColor: "#272324", boxShadow: "none", color: "#343a40", right: "0",
      }} >
        <Toolbar sx={{ minHeight: isMobile ? "50px" : undefined, px: isMobile ? 1 : 2, display: "flex", justifyContent: "space-between", gap: 2, alignItems: "center", }} >
          <Box sx={{ display: "flex", gap: 2 }}>
            {isMobile && (
              <IconButton onClick={handleMobileDrawerToggle} sx={{ color: "#fff" }}>
                <MenuIcon />
              </IconButton>
            )}
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <img src={"/img/logo.png"} alt="Logo" style={{ width: 120, marginTop: "10px", cursor: "pointer", display: isMobile ? "none" : "block" }}
                onClick={() => navigate("/dashboard")} />
            </Box>
          </Box>
          <Tooltip title={!isUserPage ? "Click to go to User module" : undefined} arrow placement="bottom" disableHoverListener={isUserPage} >
            <span>
              <Button onClick={handleClick} disabled={isUserPage}
                sx={{
                  color: "#000", textTransform: "none", width: "auto", justifyContent: "end",
                  fontSize: { xs: "13px", sm: "16px" }, p: 0, ml: "auto", display: "flex", alignItems: "center", gap: { xs: 0.5, sm: 1 }, cursor: isUserPage ? "not-allowed" : "pointer", opacity: 1,
                }} >
                <Avatar sx={{ bgcolor: "#fc4e15", width: 32, height: 32 }} >
                  {userEmail ? userEmail.charAt(0).toUpperCase() : ""}
                </Avatar>
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }} >
                  <Box sx={{ fontWeight: 600, fontSize: { xs: "12px", sm: "14px" }, color: "#fff" }}>
                    {userName || "User"}
                  </Box>
                  <Box sx={{ fontSize: { xs: "10px", sm: "12px" }, color: "#fff" }}>
                    {userEmail || ""}
                  </Box>
                </Box>
              </Button>
            </span>
          </Tooltip>
        </Toolbar>
      </AppBar>

      {!isMobile && (
        <Drawer variant="permanent" PaperProps={{
          sx: { width: sidebarWidth, transition: "width 0.3s", overflowX: "hidden", whiteSpace: "nowrap", borderRight: "none", },
        }} >
          {drawerContent}
        </Drawer>
      )}

      {isMobile && (
        <Drawer variant="temporary"
          open={mobileOpen} onClose={handleMobileDrawerToggle} ModalProps={{ keepMounted: true }} PaperProps={{ sx: { width: drawerWidth } }} >
          {drawerContent}
        </Drawer>
      )}

      {openLogoutDialog && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 w-[90%] sm:w-[400px] text-center p-6 animate-fadeIn">
            <HelpCircle className="text-yellow-500 w-12 h-12 mx-auto mb-2" />

            <h2 className="font-bold text-lg sm:text-xl text-gray-800 mb-2">
              Are you sure you want to logout?
            </h2>

            <p className="text-sm text-gray-500 mb-5">
              You will be redirected to the login page.
            </p>

            <div className="flex justify-center gap-3">
              <button
                onClick={handleCancelLogout}
                className="px-4 py-2 rounded-md text-gray-700 hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmLogout}
                className="px-4 py-2 rounded-md bg-orange-500 hover:bg-orange-600 text-white transition"
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminHeader;
