"use client";

import Link from "next/link";
import {
  Box,
  Container,
  Typography,
  Stack,
  IconButton,
  Divider,
  Chip,
} from "@mui/material";
import {
  MusicNote,
  GitHub,
  Twitter,
  Email,
  Album,
  Event,
  Headphones,
  Favorite,
} from "@mui/icons-material";

export function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: "rgba(15, 15, 15, 0.98)",
        borderTop: "1px solid rgba(255, 255, 255, 0.1)",
        mt: 8,
      }}
    >
      <Container maxWidth="lg">
        <Box sx={{ py: 6 }}>
          <Stack spacing={6}>
            {/* Main Footer Content */}
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={4}
              justifyContent="space-between"
            >
              {/* Brand Section */}
              <Stack spacing={3} sx={{ maxWidth: { xs: "100%", md: "400px" } }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      background: "linear-gradient(45deg, #f44336, #2196f3)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <MusicNote sx={{ color: "white", fontSize: 18 }} />
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
                    Note Club Modern
                  </Typography>
                </Stack>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ lineHeight: 1.6 }}
                >
                  A vibrant music community where members take turns sharing
                  incredible albums. Discover hidden gems, connect with fellow
                  music lovers, and expand your musical horizons through our
                  unique rotation system.
                </Typography>

                <Stack direction="row" spacing={1}>
                  <Chip
                    icon={<Headphones />}
                    label="Music Discovery"
                    size="small"
                    variant="outlined"
                    sx={{ borderColor: "rgba(244, 67, 54, 0.3)" }}
                  />
                  <Chip
                    icon={<Favorite />}
                    label="Community"
                    size="small"
                    variant="outlined"
                    sx={{ borderColor: "rgba(33, 150, 243, 0.3)" }}
                  />
                </Stack>
              </Stack>

              {/* Navigation Links */}
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={4}
                sx={{ minWidth: { md: "300px" } }}
              >
                <Stack spacing={2}>
                  <Typography variant="h6" fontWeight={700} color="primary">
                    Explore
                  </Typography>
                  <Stack spacing={1}>
                    <Link href="/" style={{ textDecoration: "none" }}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          "&:hover": { color: "primary.main" },
                          transition: "color 0.3s ease",
                        }}
                      >
                        Home
                      </Typography>
                    </Link>
                    <Link href="/albums" style={{ textDecoration: "none" }}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          "&:hover": { color: "primary.main" },
                          transition: "color 0.3s ease",
                        }}
                      >
                        Browse Albums
                      </Typography>
                    </Link>
                    <Link href="/themes" style={{ textDecoration: "none" }}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          "&:hover": { color: "primary.main" },
                          transition: "color 0.3s ease",
                        }}
                      >
                        Current Themes
                      </Typography>
                    </Link>
                  </Stack>
                </Stack>

                <Stack spacing={2}>
                  <Typography variant="h6" fontWeight={700} color="secondary">
                    Community
                  </Typography>
                  <Stack spacing={1}>
                    <Link
                      href="/auth/signup"
                      style={{ textDecoration: "none" }}
                    >
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          "&:hover": { color: "secondary.main" },
                          transition: "color 0.3s ease",
                        }}
                      >
                        Join the Club
                      </Typography>
                    </Link>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        "&:hover": { color: "secondary.main" },
                        transition: "color 0.3s ease",
                        cursor: "pointer",
                      }}
                    >
                      Guidelines
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        "&:hover": { color: "secondary.main" },
                        transition: "color 0.3s ease",
                        cursor: "pointer",
                      }}
                    >
                      Help & Support
                    </Typography>
                  </Stack>
                </Stack>
              </Stack>
            </Stack>

            <Divider sx={{ borderColor: "rgba(255, 255, 255, 0.1)" }} />

            {/* Bottom Footer */}
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography variant="body2" color="text.secondary">
                © 2025 Note Club Modern. Made with{" "}
                <Favorite sx={{ fontSize: 14, color: "#f44336", mx: 0.5 }} />
                for music lovers everywhere.
              </Typography>

              <Stack direction="row" spacing={1}>
                <IconButton
                  size="small"
                  sx={{
                    color: "text.secondary",
                    "&:hover": {
                      color: "#1DA1F2",
                      backgroundColor: "rgba(29, 161, 242, 0.1)",
                    },
                  }}
                >
                  <Twitter sx={{ fontSize: 20 }} />
                </IconButton>
                <IconButton
                  size="small"
                  sx={{
                    color: "text.secondary",
                    "&:hover": {
                      color: "#ffffff",
                      backgroundColor: "rgba(255, 255, 255, 0.1)",
                    },
                  }}
                >
                  <GitHub sx={{ fontSize: 20 }} />
                </IconButton>
                <IconButton
                  size="small"
                  sx={{
                    color: "text.secondary",
                    "&:hover": {
                      color: "#EA4335",
                      backgroundColor: "rgba(234, 67, 53, 0.1)",
                    },
                  }}
                >
                  <Email sx={{ fontSize: 20 }} />
                </IconButton>
              </Stack>
            </Stack>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}
