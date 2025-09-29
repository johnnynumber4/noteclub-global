"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  Paper,
  CircularProgress,
} from "@mui/material";
import {
  MusicNote,
  Group,
  PlayArrow,
  Event,
  Headphones,
  ArrowForward,
  Radio,
} from "@mui/icons-material";

export default function Home() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "background.default",
        }}
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (status === "authenticated") {
    return null; // Will redirect to dashboard
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      {/* Hero Section */}
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          background:
            "linear-gradient(135deg, #0f0f0f 0%, #1a0a0a 50%, #0a0a1a 100%)",
          position: "relative",
          overflow: "hidden",
          pt: 8,
        }}
      >
        {/* Animated Background Elements */}
        <Box
          sx={{
            position: "absolute",
            top: "10%",
            right: "10%",
            width: { xs: 150, md: 300 },
            height: { xs: 150, md: 300 },
            background:
              "radial-gradient(circle, rgba(211, 47, 47, 0.3) 0%, transparent 70%)",
            borderRadius: "50%",
            animation: "float 6s ease-in-out infinite",
            "@keyframes float": {
              "0%, 100%": { transform: "translateY(0px)" },
              "50%": { transform: "translateY(-20px)" },
            },
          }}
        />
        <Box
          sx={{
            position: "absolute",
            bottom: "20%",
            left: "5%",
            width: { xs: 100, md: 200 },
            height: { xs: 100, md: 200 },
            background:
              "radial-gradient(circle, rgba(33, 150, 243, 0.3) 0%, transparent 70%)",
            borderRadius: "50%",
            animation: "float 8s ease-in-out infinite reverse",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            top: "30%",
            left: "20%",
            width: { xs: 80, md: 120 },
            height: { xs: 80, md: 120 },
            background:
              "radial-gradient(circle, rgba(156, 39, 176, 0.3) 0%, transparent 70%)",
            borderRadius: "50%",
            animation: "float 4s ease-in-out infinite",
          }}
        />

        {/* Floating Music Notes */}
        <Box
          sx={{
            position: "absolute",
            top: "60%",
            right: "30%",
            animation: "musicFloat 10s ease-in-out infinite",
            "@keyframes musicFloat": {
              "0%, 100%": { transform: "translate(0px, 0px) rotate(0deg)" },
              "33%": { transform: "translate(30px, -30px) rotate(120deg)" },
              "66%": { transform: "translate(-20px, 20px) rotate(240deg)" },
            },
          }}
        >
          <MusicNote
            sx={{
              fontSize: { xs: 30, md: 50 },
              color: "primary.main",
              opacity: 0.6,
            }}
          />
        </Box>
        <Box
          sx={{
            position: "absolute",
            bottom: "40%",
            right: "60%",
            animation: "musicFloat 8s ease-in-out infinite reverse",
          }}
        >
          <Headphones
            sx={{
              fontSize: { xs: 25, md: 40 },
              color: "secondary.main",
              opacity: 0.5,
            }}
          />
        </Box>
        <Box
          sx={{
            position: "absolute",
            top: "20%",
            left: "60%",
            animation: "musicFloat 12s ease-in-out infinite",
          }}
        >
          <Radio
            sx={{
              fontSize: { xs: 35, md: 45 },
              color: "#9c27b0",
              opacity: 0.4,
            }}
          />
        </Box>

        <Container maxWidth="lg">
          <Stack spacing={6} alignItems="center" textAlign="center">
            {/* Badge */}
            <Chip
              icon={<Radio />}
              label="The ultimate music discovery experience"
              sx={{
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                color: "white",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                fontSize: "0.9rem",
                px: 2,
                py: 0.5,
              }}
            />

            {/* Main Title */}
            <Stack spacing={2}>
              <Typography
                variant="h1"
                sx={{
                  fontSize: { xs: "3rem", md: "5rem", lg: "7rem" },
                  fontWeight: 900,
                  lineHeight: 0.9,
                  color: "white",
                }}
              >
                Discover
              </Typography>
              <Typography
                variant="h1"
                sx={{
                  fontSize: { xs: "3rem", md: "5rem", lg: "7rem" },
                  fontWeight: 900,
                  lineHeight: 0.9,
                  background:
                    "linear-gradient(135deg, #f44336, #2196f3, #9c27b0)",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Together
              </Typography>
            </Stack>

            {/* Description */}
            <Typography
              variant="h5"
              sx={{
                maxWidth: "800px",
                color: "text.secondary",
                lineHeight: 1.6,
                fontSize: { xs: "1.1rem", md: "1.4rem" },
              }}
            >
              Join our vibrant music community where members take turns sharing
              incredible albums.{" "}
              <Box
                component="span"
                sx={{ color: "primary.main", fontWeight: 600 }}
              >
                Discover hidden gems
              </Box>
              ,{" "}
              <Box
                component="span"
                sx={{ color: "secondary.main", fontWeight: 600 }}
              >
                connect with fellow music lovers
              </Box>
              , and{" "}
              <Box component="span" sx={{ color: "#9c27b0", fontWeight: 600 }}>
                expand your musical horizons
              </Box>{" "}
              through our unique rotation system.
            </Typography>

            {/* Action Buttons */}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={3}>
              <Button
                component={Link}
                href="/auth/signup"
                variant="contained"
                size="large"
                startIcon={<PlayArrow />}
                endIcon={<ArrowForward />}
                sx={{
                  px: 4,
                  py: 2,
                  fontSize: "1.1rem",
                  minWidth: 200,
                }}
              >
                Start Your Journey
              </Button>
              <Button
                component={Link}
                href="/albums"
                variant="outlined"
                size="large"
                startIcon={<Headphones />}
                sx={{
                  px: 4,
                  py: 2,
                  fontSize: "1.1rem",
                  minWidth: 200,
                }}
              >
                Explore Music
              </Button>
            </Stack>

            {/* Stats */}
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={3}
              sx={{ maxWidth: 800, mt: 4 }}
            >
              <Card sx={{ flex: 1 }}>
                <CardContent sx={{ textAlign: "center", py: 3 }}>
                  <Typography
                    variant="h3"
                    color="primary.main"
                    fontWeight={900}
                  >
                    1.2K+
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Albums Shared
                  </Typography>
                </CardContent>
              </Card>
              <Card sx={{ flex: 1 }}>
                <CardContent sx={{ textAlign: "center", py: 3 }}>
                  <Typography
                    variant="h3"
                    color="secondary.main"
                    fontWeight={900}
                  >
                    150+
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Music Lovers
                  </Typography>
                </CardContent>
              </Card>
              <Card sx={{ flex: 1 }}>
                <CardContent sx={{ textAlign: "center", py: 3 }}>
                  <Typography
                    variant="h3"
                    sx={{ color: "#9c27b0" }}
                    fontWeight={900}
                  >
                    24
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Themes Explored
                  </Typography>
                </CardContent>
              </Card>
            </Stack>
          </Stack>
        </Container>
      </Box>

      {/* Features Section */}
      <Box sx={{ py: 12, bgcolor: "background.paper" }}>
        <Container maxWidth="lg">
          <Stack spacing={8}>
            <Stack spacing={4} textAlign="center">
              <Typography variant="h2" fontWeight={900}>
                How{" "}
                <Box component="span" color="primary.main">
                  NoteClub
                </Box>{" "}
                Works
              </Typography>
              <Typography
                variant="h5"
                color="text.secondary"
                maxWidth={600}
                mx="auto"
              >
                A revolutionary way to discover music with your community
                through{" "}
                <Box component="span" color="secondary.main" fontWeight={600}>
                  structured themes
                </Box>{" "}
                and{" "}
                <Box component="span" color="#9c27b0" fontWeight={600}>
                  fair rotation
                </Box>
                .
              </Typography>
            </Stack>

            <Stack direction={{ xs: "column", lg: "row" }} spacing={4}>
              {/* Theme-Based Feature */}
              <Card sx={{ flex: 1, cursor: "pointer" }}>
                <CardContent sx={{ p: 4 }}>
                  <Stack spacing={3}>
                    <Paper
                      sx={{
                        width: 64,
                        height: 64,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "linear-gradient(135deg, #d32f2f, #f44336)",
                        borderRadius: 2,
                      }}
                    >
                      <Event sx={{ color: "white", fontSize: 32 }} />
                    </Paper>
                    <Typography variant="h4" fontWeight={800}>
                      Theme-Based Discovery
                    </Typography>
                    <Typography
                      variant="body1"
                      color="text.secondary"
                      lineHeight={1.8}
                    >
                      Each rotation features a unique theme. From &quot;90s
                      Grunge&quot; to &quot;Hidden Jazz Gems&quot; - explore
                      curated collections that expand your musical boundaries.
                    </Typography>
                    <Button
                      endIcon={<ArrowForward />}
                      sx={{ alignSelf: "flex-start", color: "primary.main" }}
                    >
                      Explore Themes
                    </Button>
                  </Stack>
                </CardContent>
              </Card>

              {/* Turn-Based Feature */}
              <Card sx={{ flex: 1, cursor: "pointer" }}>
                <CardContent sx={{ p: 4 }}>
                  <Stack spacing={3}>
                    <Paper
                      sx={{
                        width: 64,
                        height: 64,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "linear-gradient(135deg, #1976d2, #2196f3)",
                        borderRadius: 2,
                      }}
                    >
                      <Group sx={{ color: "white", fontSize: 32 }} />
                    </Paper>
                    <Typography variant="h4" fontWeight={800}>
                      Fair Rotation System
                    </Typography>
                    <Typography
                      variant="body1"
                      color="text.secondary"
                      lineHeight={1.8}
                    >
                      Everyone gets their turn! Our alphabetical rotation
                      ensures every member has equal opportunity to share their
                      musical discoveries with the community.
                    </Typography>
                    <Button
                      endIcon={<ArrowForward />}
                      sx={{ alignSelf: "flex-start", color: "secondary.main" }}
                    >
                      Join Rotation
                    </Button>
                  </Stack>
                </CardContent>
              </Card>

              {/* Streaming Feature */}
              <Card sx={{ flex: 1, cursor: "pointer" }}>
                <CardContent sx={{ p: 4 }}>
                  <Stack spacing={3}>
                    <Paper
                      sx={{
                        width: 64,
                        height: 64,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "linear-gradient(135deg, #7b1fa2, #9c27b0)",
                        borderRadius: 2,
                      }}
                    >
                      <Headphones sx={{ color: "white", fontSize: 32 }} />
                    </Paper>
                    <Typography variant="h4" fontWeight={800}>
                      Universal Streaming
                    </Typography>
                    <Typography
                      variant="body1"
                      color="text.secondary"
                      lineHeight={1.8}
                    >
                      Connect to Spotify, YouTube Music, Apple Music, and more.
                      Listen instantly on your preferred platform without
                      missing a beat.
                    </Typography>
                    <Button
                      endIcon={<ArrowForward />}
                      sx={{ alignSelf: "flex-start", color: "#9c27b0" }}
                    >
                      Start Listening
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Stack>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}
