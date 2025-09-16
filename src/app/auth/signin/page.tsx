"use client";

import { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Box,
  Container,
  Typography,
  Button,
  TextField,
  Card,
  CardContent,
  Stack,
  Divider,
  IconButton,
  InputAdornment,
  Alert,
  Paper,
} from "@mui/material";
import {
  Google,
  Chat,
  Email,
  Visibility,
  VisibilityOff,
  MusicNote,
} from "@mui/icons-material";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      console.log("🔐 Sign in result:", result);

      if (result?.error) {
        console.log("❌ Sign in error:", result.error);
        setError("Invalid email or password");
      } else if (result?.ok) {
        console.log("✅ Sign in successful, getting session...");
        const newSession = await getSession();
        console.log("📋 New session:", newSession);
        
        if (newSession) {
          console.log("🎯 Redirecting to dashboard...");
          router.push("/dashboard");
          router.refresh();
        } else {
          console.log("❌ No session after successful login");
          setError("Login succeeded but session not created. Please try again.");
        }
      } else {
        console.log("❌ Unexpected sign in result:", result);
        setError("Unexpected error during sign in");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleProviderSignIn = async (provider: string) => {
    setIsLoading(true);
    try {
      await signIn(provider, { callbackUrl: "/dashboard" });
    } catch (err) {
      setError("Failed to sign in with provider");
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.default",
        background:
          "linear-gradient(135deg, #0f0f0f 0%, #1a0a0a 50%, #0a0a1a 100%)",
        pt: 10,
        pb: 4,
      }}
    >
      <Container maxWidth="sm">
        <Stack spacing={4} alignItems="center">
          {/* Logo */}
          <Stack direction="row" spacing={2} alignItems="center">
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: "linear-gradient(45deg, #f44336, #2196f3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MusicNote sx={{ color: "white", fontSize: 24 }} />
            </Box>
            <Typography
              variant="h4"
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

          {/* Sign In Card */}
          <Card sx={{ width: "100%", maxWidth: 400 }}>
            <CardContent sx={{ p: 4 }}>
              <Stack spacing={3}>
                <Stack spacing={1} textAlign="center">
                  <Typography variant="h4" fontWeight={700}>
                    Welcome Back
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Sign in to continue your musical journey
                  </Typography>
                </Stack>

                {error && (
                  <Alert severity="error" sx={{ borderRadius: 2 }}>
                    {error}
                  </Alert>
                )}

                {/* Social Sign In */}
                <Stack spacing={2}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<Google />}
                    onClick={() => handleProviderSignIn("google")}
                    disabled={isLoading}
                    sx={{
                      py: 1.5,
                      textTransform: "none",
                      borderColor: "rgba(255, 255, 255, 0.3)",
                      "&:hover": {
                        borderColor: "#4285f4",
                        backgroundColor: "rgba(66, 133, 244, 0.1)",
                      },
                    }}
                  >
                    Continue with Google
                  </Button>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<Chat />}
                    onClick={() => handleProviderSignIn("discord")}
                    disabled={isLoading}
                    sx={{
                      py: 1.5,
                      textTransform: "none",
                      borderColor: "rgba(255, 255, 255, 0.3)",
                      "&:hover": {
                        borderColor: "#5865f2",
                        backgroundColor: "rgba(88, 101, 242, 0.1)",
                      },
                    }}
                  >
                    Continue with Discord
                  </Button>
                </Stack>

                <Divider sx={{ my: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    OR
                  </Typography>
                </Divider>

                {/* Email/Password Form */}
                <Box component="form" onSubmit={handleSubmit}>
                  <Stack spacing={3}>
                    <TextField
                      fullWidth
                      label="Email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Email />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 2,
                        },
                      }}
                    />

                    <TextField
                      fullWidth
                      label="Password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowPassword(!showPassword)}
                              edge="end"
                            >
                              {showPassword ? (
                                <VisibilityOff />
                              ) : (
                                <Visibility />
                              )}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 2,
                        },
                      }}
                    />

                    <Button
                      type="submit"
                      variant="contained"
                      fullWidth
                      disabled={isLoading}
                      sx={{
                        py: 1.5,
                        fontSize: "1rem",
                        textTransform: "none",
                        borderRadius: 2,
                      }}
                    >
                      {isLoading ? "Signing in..." : "Sign In"}
                    </Button>
                  </Stack>
                </Box>

                {/* Sign Up Link */}
                <Box textAlign="center">
                  <Typography variant="body2" color="text.secondary">
                    Don't have an account?{" "}
                    <Button
                      component={Link}
                      href="/auth/signup"
                      variant="text"
                      sx={{
                        textTransform: "none",
                        fontWeight: 600,
                        p: 0,
                        minWidth: "auto",
                      }}
                    >
                      Sign up
                    </Button>
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          {/* Back to Home */}
          <Button
            component={Link}
            href="/"
            variant="text"
            sx={{
              textTransform: "none",
              color: "text.secondary",
              "&:hover": {
                color: "primary.main",
              },
            }}
          >
            ← Back to Home
          </Button>
        </Stack>
      </Container>
    </Box>
  );
}
