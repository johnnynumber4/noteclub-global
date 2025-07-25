"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
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
} from "@mui/material";
import {
  Google,
  Chat,
  Email,
  Person,
  Visibility,
  VisibilityOff,
  MusicNote,
} from "@mui/icons-material";

export default function SignUp() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.name ||
      !formData.email ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      setError("Please fill in all fields");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create account");
      }

      // Auto sign in after successful registration
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        setError(
          "Account created but failed to sign in. Please try signing in manually."
        );
      } else {
        router.push("/");
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleProviderSignIn = async (provider: string) => {
    setIsLoading(true);
    try {
      await signIn(provider, { callbackUrl: "/" });
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

          {/* Sign Up Card */}
          <Card sx={{ width: "100%", maxWidth: 400 }}>
            <CardContent sx={{ p: 4 }}>
              <Stack spacing={3}>
                <Stack spacing={1} textAlign="center">
                  <Typography variant="h4" fontWeight={700}>
                    Join the Club
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Create your account and start discovering music
                  </Typography>
                </Stack>

                {error && (
                  <Alert severity="error" sx={{ borderRadius: 2 }}>
                    {error}
                  </Alert>
                )}

                {/* Social Sign Up */}
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

                {/* Registration Form */}
                <Box component="form" onSubmit={handleSubmit}>
                  <Stack spacing={3}>
                    <TextField
                      fullWidth
                      label="Full Name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      disabled={isLoading}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Person />
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
                      label="Email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
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
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={handleChange}
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

                    <TextField
                      fullWidth
                      label="Confirm Password"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      disabled={isLoading}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() =>
                                setShowConfirmPassword(!showConfirmPassword)
                              }
                              edge="end"
                            >
                              {showConfirmPassword ? (
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
                      {isLoading ? "Creating Account..." : "Create Account"}
                    </Button>
                  </Stack>
                </Box>

                {/* Sign In Link */}
                <Box textAlign="center">
                  <Typography variant="body2" color="text.secondary">
                    Already have an account?{" "}
                    <Button
                      component={Link}
                      href="/auth/signin"
                      variant="text"
                      sx={{
                        textTransform: "none",
                        fontWeight: 600,
                        p: 0,
                        minWidth: "auto",
                      }}
                    >
                      Sign in
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
