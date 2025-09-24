"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Box,
  Container,
  Stack,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Chip,
} from "@mui/material";
import {
  MusicNote,
  Menu as MenuIcon,
  Album,
  Person,
  Login,
  Logout,
  PersonAdd,
  Home,
} from "@mui/icons-material";

export function NavbarMui() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    handleMenuClose();
    router.push("/");
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // Fetch current user's ID when session changes
  useEffect(() => {
    const fetchUserId = async () => {
      if (session?.user?.email) {
        try {
          const response = await fetch('/api/auth/me');
          if (response.ok) {
            const userData = await response.json();
            setCurrentUserId(userData.user?._id);
          }
        } catch (error) {
          console.error('Error fetching user ID:', error);
        }
      } else {
        setCurrentUserId(null);
      }
    };

    fetchUserId();
  }, [session]);

  const navigationItems = [
    { label: "Home", href: "/", icon: <Home /> },
    { label: "Albums", href: "/albums", icon: <Album /> },
  ];

  const drawer = (
    <Box onClick={handleDrawerToggle} sx={{ textAlign: "center" }}>
      <Box sx={{ p: 2 }}>
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          justifyContent="center"
        >
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: "linear-gradient(45deg, #f44336, #2196f3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MusicNote sx={{ color: "white", fontSize: 20 }} />
          </Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 900,
              background: "linear-gradient(45deg, #f44336, #2196f3)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Note Club
          </Typography>
        </Stack>
      </Box>
      <Divider />
      <List>
        {navigationItems.map((item) => (
          <ListItem key={item.label} disablePadding>
            <ListItemButton component={Link} href={item.href}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
        <Divider sx={{ my: 1 }} />
        {session ? (
          <>
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => {
                  if (currentUserId) {
                    router.push(`/profile/${currentUserId}`);
                  }
                }}
                disabled={!currentUserId}
              >
                <ListItemIcon>
                  <Person />
                </ListItemIcon>
                <ListItemText primary="Profile" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton onClick={handleSignOut}>
                <ListItemIcon>
                  <Logout />
                </ListItemIcon>
                <ListItemText primary="Sign Out" />
              </ListItemButton>
            </ListItem>
          </>
        ) : (
          <>
            <ListItem disablePadding>
              <ListItemButton component={Link} href="/auth/signin">
                <ListItemIcon>
                  <Login />
                </ListItemIcon>
                <ListItemText primary="Sign In" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton component={Link} href="/auth/signup">
                <ListItemIcon>
                  <PersonAdd />
                </ListItemIcon>
                <ListItemText primary="Sign Up" />
              </ListItemButton>
            </ListItem>
          </>
        )}
      </List>
    </Box>
  );

  return (
    <>
      <AppBar
        position="fixed"
        sx={{
          backgroundColor: "rgba(15, 15, 15, 0.95)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
        }}
      >
        <Container maxWidth="xl">
          <Toolbar sx={{ justifyContent: "space-between" }}>
            {/* Logo */}
            <Stack direction="row" spacing={2} alignItems="center">
              <Link href="/" style={{ textDecoration: "none" }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      background: "linear-gradient(45deg, #f44336, #2196f3)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "transform 0.3s ease",
                      "&:hover": {
                        transform: "scale(1.1)",
                      },
                    }}
                  >
                    <MusicNote sx={{ color: "white", fontSize: 20 }} />
                  </Box>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 900,
                      background: "linear-gradient(45deg, #f44336, #2196f3)",
                      backgroundClip: "text",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      display: { xs: "none", sm: "block" },
                    }}
                  >
                    Note Club
                  </Typography>
                </Stack>
              </Link>
            </Stack>

            {/* Desktop Navigation */}
            <Stack
              direction="row"
              spacing={1}
              sx={{ display: { xs: "none", md: "flex" } }}
            >
              {navigationItems.map((item) => (
                <Button
                  key={item.label}
                  component={Link}
                  href={item.href}
                  startIcon={item.icon}
                  sx={{
                    color: "white",
                    textTransform: "none",
                    fontWeight: 600,
                    px: 2,
                    "&:hover": {
                      backgroundColor: "rgba(255, 255, 255, 0.1)",
                    },
                  }}
                >
                  {item.label}
                </Button>
              ))}
            </Stack>

            {/* User Actions */}
            <Stack direction="row" spacing={1} alignItems="center">
              {status === "loading" ? (
                <Box />
              ) : session ? (
                <>
                  <Chip
                    label={`♪ ${session.user?.name || "User"}`}
                    avatar={
                      <Avatar
                        src={session.user?.image || ""}
                        alt={session.user?.name || ""}
                        sx={{ width: 24, height: 24 }}
                      >
                        {session.user?.name?.[0]?.toUpperCase()}
                      </Avatar>
                    }
                    onClick={handleProfileMenuOpen}
                    sx={{
                      backgroundColor: "rgba(244, 67, 54, 0.2)",
                      color: "white",
                      cursor: "pointer",
                      display: { xs: "none", sm: "flex" },
                      "&:hover": {
                        backgroundColor: "rgba(244, 67, 54, 0.3)",
                      },
                    }}
                  />
                  <IconButton
                    onClick={handleProfileMenuOpen}
                    sx={{ display: { xs: "flex", sm: "none" } }}
                  >
                    <Avatar
                      src={session.user?.image || ""}
                      alt={session.user?.name || ""}
                      sx={{ width: 32, height: 32 }}
                    >
                      {session.user?.name?.[0]?.toUpperCase()}
                    </Avatar>
                  </IconButton>
                </>
              ) : (
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{ display: { xs: "none", md: "flex" } }}
                >
                  <Button
                    component={Link}
                    href="/auth/signin"
                    variant="outlined"
                    startIcon={<Login />}
                    sx={{
                      color: "white",
                      borderColor: "rgba(255, 255, 255, 0.3)",
                      textTransform: "none",
                      "&:hover": {
                        borderColor: "white",
                        backgroundColor: "rgba(255, 255, 255, 0.1)",
                      },
                    }}
                  >
                    Sign In
                  </Button>
                  <Button
                    component={Link}
                    href="/auth/signup"
                    variant="contained"
                    startIcon={<PersonAdd />}
                    sx={{
                      background: "linear-gradient(45deg, #f44336, #2196f3)",
                      textTransform: "none",
                      "&:hover": {
                        background: "linear-gradient(45deg, #d32f2f, #1976d2)",
                      },
                    }}
                  >
                    Sign Up
                  </Button>
                </Stack>
              )}

              {/* Mobile Menu Button */}
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ display: { md: "none" } }}
              >
                <MenuIcon />
              </IconButton>
            </Stack>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            mt: 1,
            backgroundColor: "rgba(30, 30, 30, 0.95)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          },
        }}
      >
        <MenuItem
          onClick={() => {
            handleMenuClose();
            if (currentUserId) {
              router.push(`/profile/${currentUserId}`);
            }
          }}
          disabled={!currentUserId}
        >
          <Person sx={{ mr: 1 }} />
          Profile
        </MenuItem>
        <MenuItem onClick={handleSignOut}>
          <Logout sx={{ mr: 1 }} />
          Sign Out
        </MenuItem>
      </Menu>

      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: 280,
            backgroundColor: "rgba(15, 15, 15, 0.95)",
            backdropFilter: "blur(20px)",
            borderRight: "1px solid rgba(255, 255, 255, 0.1)",
          },
        }}
      >
        {drawer}
      </Drawer>
    </>
  );
}
