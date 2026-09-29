import { API_URL } from "../config.js";
import * as React from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Button,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Tooltip,
  Badge,
} from "@mui/material";

import MenuIcon from "@mui/icons-material/Menu";
import NotificationsIcon from "@mui/icons-material/Notifications";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

const pages = ["Jobs", "Companies", "About"];
const settings = ["Home", "Help", "Logout"];

export default function Header({ handleDrawerToggle }) {
  const [anchorElUser, setAnchorElUser] = React.useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleUserMenuClick = (item) => {
    if (item === "Home") {
      navigate("/");
    }
    if (item === "Help") {
      navigate("/help");
    }
    if (item === "Logout") {
      const logout = async () => {
        const response = await fetch(`${API_URL}/api/logout`, {
          method: "GET",
          credentials: "include",
        });
        const data = await response.json();
        console.log("Logout response:", data);
      };
      logout();
      navigate("/login");
    }
  };

  console.log(user?.user?.username)

  const userName = user?.user?.username || "N/A";

  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  return (
    <AppBar position="fixed" sx={{ backgroundColor: "#ef5350" }}>
      <Toolbar sx={{ justifyContent: "space-between" }}>

        {/* 🔴 LEFT SIDE */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>

          {/* 📱 Menu icon (ONLY MOBILE) */}
          <IconButton
            onClick={handleDrawerToggle}
            sx={{ display: { xs: "block", md: "none" }, color: "#fff" }}
          >
            <MenuIcon />
          </IconButton>

          <Box>
            <Typography variant="h6" fontWeight="bold">
              Interviews
            </Typography>
            <Typography variant="caption">
              Welcome {userName}
            </Typography>
          </Box>
        </Box>

        {/* 🔴 CENTER */}
        <Box sx={{ display: { xs: "none", md: "flex" }, gap: 2 }}>
          {pages.map((page) => (
            <Button key={page} sx={{ color: "#fff" }}>
              {page}
            </Button>
          ))}
        </Box>

        {/* 🔴 RIGHT SIDE */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>

          <IconButton color="inherit">
            <Badge badgeContent={3} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>

          <Button
            onClick={() => navigate("/interviewer/addPost")}
            variant="contained"
            sx={{
              backgroundColor: "#fff",
              color: "#b71c1c",
              fontWeight: "bold",
              display: { xs: "none", sm: "block" }, // hide on small mobile
            }}
          >
            Add Post
          </Button>

          <Tooltip title="Open settings">
            <IconButton onClick={handleOpenUserMenu}>
              <Avatar sx={{ bgcolor: "#fff", color: "#b71c1c" }}>
                {userName.charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>
          </Tooltip>

          <Menu
            anchorEl={anchorElUser}
            open={Boolean(anchorElUser)}
            onClose={handleCloseUserMenu}
          >
            {settings.map((setting) => (
              <MenuItem key={setting} onClick={() => handleUserMenuClick(setting)}>
                {setting}
              </MenuItem>
            ))}
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
