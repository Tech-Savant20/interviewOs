import { API_URL } from "../config.js";
import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Menu from '@mui/material/Menu';
import MenuIcon from '@mui/icons-material/Menu';
import Container from '@mui/material/Container';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from '../AuthContext';
import "./Header.css";

const pages = ['Products', 'Pricing', 'Blog'];
const pagePaths = { Products: '/products', Pricing: '/pricing', Blog: '/blog' };
const settings = ['Profile', 'My Applications', 'Dashboard', 'Help', 'Logout'];

function Header() {
  const [anchorElNav, setAnchorElNav] = React.useState(null);
  const [anchorElUser, setAnchorElUser] = React.useState(null);

  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API_URL}/api/profile`, {
          credentials: "include",
        });
        await res.json();
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };

    fetchProfile();
  }, []);

  const handleOpenNavMenu = (event) => {
    setAnchorElNav(event.currentTarget);
  };
  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const handleNavigatePage = (page) => {
    setAnchorElNav(null);
    navigate(pagePaths[page]);
  };

  const handleMockInterview = () => {
    setAnchorElNav(null);
    if (user?.user.user_id) {
      navigate(`/interview-room/${user.user.user_id}`);
    } else {
      navigate("/login");
    }
  };

  const handleStudentMessages = () => {
    setAnchorElNav(null);
    if (user?.user.user_id) {
      navigate(`/student/messages/${user.user.user_id}`);
    } else {
      navigate("/login");
    }
  };

  const handleCloseUserMenu = (item) => {
    if (item === "Profile") {
      navigate(`/profile/${user?.user?.user_id}`);
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
    if (item === "My Applications") {
      navigate("/my-applications");
    }
    if (item === "Dashboard") {
      if (user?.user?.role === "user") {
        navigate(`/profile/${user?.user?.user_id}`);
      } else if (user?.user?.role === "interviewer") {
        navigate("/interviewer/dashboard");
      }
    }
    if (item === "Help") {
      navigate("/help");
    }

    setAnchorElUser(null);
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
      }}
    >
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ gap: { xs: 0.5, md: 1 }, py: 0.5 }}>
          {/* Logo + tagline (always visible, shrinks on mobile) */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              mr: { xs: 1, md: 2 },
              flexShrink: 0,
            }}
          >
            <Typography
              variant="h6"
              noWrap
              sx={{
                fontFamily: 'monospace',
                fontWeight: 700,
                letterSpacing: { xs: '.05rem', md: '.2rem' },
                color: 'white',
                lineHeight: 1,
                fontSize: { xs: '1rem', sm: '1.25rem' },
              }}
            >
              <i className="fa-solid fa-box"></i> InterviewOS
            </Typography>

            <Typography
              variant="caption"
              sx={{
                color: '#ffcdd2',
                fontSize: '12px',
                display: { xs: 'none', sm: 'block' },
              }}
            >
              Find Jobs & Internship
            </Typography>
          </Box>

          {/* Desktop nav links */}
          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' }, gap: 1 }}>
            {pages.map((page) => (
              <Button
                key={page}
                onClick={() => handleNavigatePage(page)}
                sx={{ my: 2, color: 'white', display: 'block' }}
              >
                {page}
              </Button>
            ))}
          </Box>

          {/* Spacer on mobile so right-side icons stay pushed right */}
          <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }} />

          {/* Action Buttons & Auth State */}
          {loading ? (
            <CircularProgress size={24} color="inherit" />
          ) : user ? (
            <>
              {/* Messages button - visible only when logged in and role is not interviewer */}
              {user?.user?.role !== "interviewer" && (
                <Button
                  onClick={handleStudentMessages}
                  variant="contained"
                  sx={{
                    fontWeight: "bold",
                    borderRadius: "8px",
                    marginRight: { xs: 0.5, md: 2 },
                    textTransform: "none",
                    padding: { xs: "6px 10px", md: "8px 18px" },
                    minWidth: { xs: "auto", md: "64px" },
                    backgroundColor: "#1976d2",
                    "&:hover": {
                      backgroundColor: "#1565c0",
                    },
                  }}
                >
                  <i className="fa-regular fa-message"></i>
                  <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' }, ml: 1 }}>
                    Messages
                  </Box>
                </Button>
              )}

              {/* Start Mock Interview - visible only when logged in */}
              <Button
                onClick={handleMockInterview}
                variant="contained"
                sx={{
                  fontWeight: "bold",
                  borderRadius: "8px",
                  marginRight: { xs: 0.5, md: 2 },
                  textTransform: "none",
                  padding: { xs: "6px 10px", md: "8px 18px" },
                  minWidth: { xs: "auto", md: "64px" },
                  backgroundColor: "Red",
                  whiteSpace: 'nowrap',
                }}
              >
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                  Start Mock Interview
                </Box>
                <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
                  <i className="fa-solid fa-video"></i>
                </Box>
              </Button>

              {/* User Account Menu */}
              <Box sx={{ flexGrow: 0 }}>
                <Tooltip title="Open settings">
                  <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                    <Avatar alt="Remy Sharp" src="/static/images/avatar/2.jpg" />
                  </IconButton>
                </Tooltip>
                <Menu
                  sx={{ mt: '45px' }}
                  id="menu-appbar-user"
                  anchorEl={anchorElUser}
                  anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  keepMounted
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  open={Boolean(anchorElUser)}
                  onClose={() => setAnchorElUser(null)}
                >
                  {settings.map((item) => (
                    <MenuItem key={item} onClick={() => handleCloseUserMenu(item)}>
                      <Typography textAlign="center">{item}</Typography>
                    </MenuItem>
                  ))}
                </Menu>
              </Box>
            </>
          ) : (
            <Box sx={{ display: 'flex', gap: { xs: 0.5, md: 1 } }}>
              <Button
                color="inherit"
                size="small"
                onClick={() => navigate("/signup")}
                sx={{ whiteSpace: 'nowrap' }}
              >
                Signup
              </Button>
              <Button
                color="inherit"
                size="small"
                onClick={() => navigate("/login")}
                sx={{ whiteSpace: 'nowrap' }}
              >
                Login
              </Button>
            </Box>
          )}

          {/* Mobile hamburger for nav links */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, ml: 0.5 }}>
            <IconButton
              size="large"
              aria-label="open navigation menu"
              aria-controls="menu-appbar-nav"
              aria-haspopup="true"
              onClick={handleOpenNavMenu}
              color="inherit"
            >
              <MenuIcon />
            </IconButton>
            <Menu
              id="menu-appbar-nav"
              anchorEl={anchorElNav}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorElNav)}
              onClose={handleCloseNavMenu}
              sx={{ display: { xs: 'block', md: 'none' } }}
            >
              {pages.map((page) => (
                <MenuItem key={page} onClick={() => handleNavigatePage(page)}>
                  <Typography sx={{ textAlign: 'center' }}>{page}</Typography>
                </MenuItem>
              ))}
              {(user?.user?.role !== "interviewer" || !user) && <Divider />}
              {!user && (
                <MenuItem onClick={() => { setAnchorElNav(null); navigate("/signup"); }}>
                  <Typography sx={{ textAlign: 'center' }}>Signup</Typography>
                </MenuItem>
              )}
              {!user && (
                <MenuItem onClick={() => { setAnchorElNav(null); navigate("/login"); }}>
                  <Typography sx={{ textAlign: 'center' }}>Login</Typography>
                </MenuItem>
              )}
            </Menu>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}

export default Header;
