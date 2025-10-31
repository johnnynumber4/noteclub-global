"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Box,
  Container,
  Typography,
  Paper,
  Stack,
  TextField,
  Button,
  Chip,
  Avatar,
  CircularProgress,
  Alert,
  InputAdornment,
  IconButton,
} from "@mui/material";
import {
  ArrowBack,
  Save,
  Person,
  LocationOn,
  MusicNote,
  Add,
  Close,
} from "@mui/icons-material";
import Link from "next/link";

interface UserProfile {
  _id: string;
  name: string;
  username: string;
  email: string;
  image?: string;
  bio?: string;
  location?: string;
  favoriteGenres: string[];
  musicPlatforms: {
    spotify?: string;
    youtubeMusic?: string;
    appleMusic?: string;
    tidal?: string;
    deezer?: string;
  };
}

export default function EditProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form state
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [favoriteGenres, setFavoriteGenres] = useState<string[]>([]);
  const [newGenre, setNewGenre] = useState("");
  const [spotify, setSpotify] = useState("");
  const [youtubeMusic, setYoutubeMusic] = useState("");
  const [appleMusic, setAppleMusic] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    } else if (status === "authenticated" && session?.user?.id) {
      fetchProfile();
    }
  }, [status, session]);

  const fetchProfile = async () => {
    if (!session?.user?.id) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/users/${session.user.id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch profile");
      }
      const data = await response.json();
      const user = data.user;

      setProfile(user);
      setName(user.name || "");
      setBio(user.bio || "");
      setLocation(user.location || "");
      setFavoriteGenres(user.favoriteGenres || []);
      setSpotify(user.musicPlatforms?.spotify || "");
      setYoutubeMusic(user.musicPlatforms?.youtubeMusic || "");
      setAppleMusic(user.musicPlatforms?.appleMusic || "");
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleAddGenre = () => {
    if (newGenre.trim() && !favoriteGenres.includes(newGenre.trim())) {
      setFavoriteGenres([...favoriteGenres, newGenre.trim()]);
      setNewGenre("");
    }
  };

  const handleRemoveGenre = (genre: string) => {
    setFavoriteGenres(favoriteGenres.filter((g) => g !== genre));
  };

  const handleSave = async () => {
    if (!profile) return;

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await fetch(`/api/users/${profile._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          bio,
          location,
          favoriteGenres,
          musicPlatforms: {
            spotify: spotify || undefined,
            youtubeMusic: youtubeMusic || undefined,
            appleMusic: appleMusic || undefined,
          },
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update profile");
      }

      setSuccess("Profile updated successfully!");
      setTimeout(() => {
        router.push(`/profile/${profile._id}`);
      }, 1500);
    } catch (err) {
      console.error("Error updating profile:", err);
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading" || loading) {
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

  if (!profile) {
    return null;
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", pt: { xs: 8, md: 10 }, pb: 8 }}>
      <Container maxWidth="md">
        <Stack spacing={4}>
          {/* Header */}
          <Stack spacing={2}>
            <Button
              component={Link}
              href={`/profile/${profile._id}`}
              startIcon={<ArrowBack />}
              sx={{ width: "fit-content" }}
            >
              Back to Profile
            </Button>

            <Stack
              direction="row"
              alignItems="center"
              spacing={2}
            >
              <Person sx={{ fontSize: 48, color: "primary.main" }} />
              <Stack>
                <Typography variant="h3" fontWeight={900}>
                  Edit Profile
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Update your profile information
                </Typography>
              </Stack>
            </Stack>
          </Stack>

          {/* Messages */}
          {success && (
            <Alert severity="success" onClose={() => setSuccess("")}>
              {success}
            </Alert>
          )}
          {error && (
            <Alert severity="error" onClose={() => setError("")}>
              {error}
            </Alert>
          )}

          {/* Form */}
          <Paper sx={{ p: 4 }}>
            <Stack spacing={4}>
              {/* Basic Info */}
              <Stack spacing={3}>
                <Typography variant="h6" fontWeight={700}>
                  Basic Information
                </Typography>

                <Stack direction="row" spacing={3} alignItems="center">
                  <Avatar
                    src={profile.image}
                    alt={profile.name}
                    sx={{ width: 80, height: 80 }}
                  >
                    {profile.name[0]?.toUpperCase()}
                  </Avatar>
                  <Stack spacing={1}>
                    <Typography variant="body2" color="text.secondary">
                      Profile Picture
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Image managed through your account settings
                    </Typography>
                  </Stack>
                </Stack>

                <TextField
                  label="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  fullWidth
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Person />
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  label="Username"
                  value={profile.username}
                  fullWidth
                  disabled
                  helperText="Username cannot be changed"
                />

                <TextField
                  label="Bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="Tell us about yourself and your music taste..."
                  inputProps={{ maxLength: 500 }}
                  helperText={`${bio.length}/500 characters`}
                />

                <TextField
                  label="Location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  fullWidth
                  placeholder="City, Country"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationOn />
                      </InputAdornment>
                    ),
                  }}
                />
              </Stack>

              {/* Favorite Genres */}
              <Stack spacing={3}>
                <Typography variant="h6" fontWeight={700}>
                  Favorite Genres
                </Typography>

                <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                  {favoriteGenres.map((genre, index) => (
                    <Chip
                      key={index}
                      label={genre}
                      onDelete={() => handleRemoveGenre(genre)}
                      color="secondary"
                    />
                  ))}
                </Stack>

                <Stack direction="row" spacing={2}>
                  <TextField
                    label="Add Genre"
                    value={newGenre}
                    onChange={(e) => setNewGenre(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddGenre();
                      }
                    }}
                    fullWidth
                    placeholder="e.g., Rock, Hip-Hop, Jazz"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <MusicNote />
                        </InputAdornment>
                      ),
                    }}
                  />
                  <Button
                    variant="outlined"
                    startIcon={<Add />}
                    onClick={handleAddGenre}
                    disabled={!newGenre.trim()}
                  >
                    Add
                  </Button>
                </Stack>
              </Stack>

              {/* Music Platforms */}
              <Stack spacing={3}>
                <Typography variant="h6" fontWeight={700}>
                  Music Platforms
                </Typography>

                <TextField
                  label="Spotify Profile URL"
                  value={spotify}
                  onChange={(e) => setSpotify(e.target.value)}
                  fullWidth
                  placeholder="https://open.spotify.com/user/..."
                  helperText="Link to your Spotify profile"
                />

                <TextField
                  label="YouTube Music Profile URL"
                  value={youtubeMusic}
                  onChange={(e) => setYoutubeMusic(e.target.value)}
                  fullWidth
                  placeholder="https://music.youtube.com/channel/..."
                  helperText="Link to your YouTube Music profile"
                />

                <TextField
                  label="Apple Music Profile URL"
                  value={appleMusic}
                  onChange={(e) => setAppleMusic(e.target.value)}
                  fullWidth
                  placeholder="https://music.apple.com/profile/..."
                  helperText="Link to your Apple Music profile"
                />
              </Stack>

              {/* Actions */}
              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button
                  component={Link}
                  href={`/profile/${profile._id}`}
                  variant="outlined"
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  startIcon={saving ? <CircularProgress size={20} /> : <Save />}
                  onClick={handleSave}
                  disabled={saving || !name.trim()}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </Stack>
            </Stack>
          </Paper>
        </Stack>
      </Container>
    </Box>
  );
}
