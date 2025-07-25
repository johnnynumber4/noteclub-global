"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Box,
  Container,
  Typography,
  Button,
  TextField,
  Card,
  CardContent,
  CardMedia,
  Stack,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Chip,
  CircularProgress,
  InputAdornment,
  Divider,
  Paper,
} from "@mui/material";
import {
  Search,
  MusicNote,
  YouTube,
  Close,
  PlayArrow,
  Album as AlbumIcon,
  Person,
  Event,
  Description,
  Link as LinkIcon,
} from "@mui/icons-material";

interface YouTubeAlbum {
  id: string;
  title: string;
  artist: string;
  year?: number;
  thumbnail?: string;
  youtubeUrl: string;
  type: string;
}

interface Theme {
  _id: string;
  title: string;
  description: string;
  isCurrentlyActive: boolean;
}

export default function PostAlbumPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    artist: "",
    year: "",
    genre: "",
    description: "",
    themeId: "",
    spotifyUrl: "",
    youtubeMusicUrl: "",
    appleMusicUrl: "",
    coverImageUrl: "",
  });

  // UI state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<YouTubeAlbum[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Theme data
  const [themes, setThemes] = useState<Theme[]>([]);
  const [activeTheme, setActiveTheme] = useState<Theme | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  useEffect(() => {
    fetchThemes();
  }, []);

  const fetchThemes = async () => {
    try {
      const response = await fetch("/api/themes");
      if (response.ok) {
        const data = await response.json();
        setThemes(data.themes || []);
        const active = data.themes?.find(
          (theme: Theme) => theme.isCurrentlyActive
        );
        if (active) {
          setActiveTheme(active);
          setFormData((prev) => ({ ...prev, themeId: active._id }));
        }
      }
    } catch (error) {
      console.error("Error fetching themes:", error);
    }
  };

  const searchYouTubeMusic = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `/api/youtube-music/search?q=${encodeURIComponent(searchQuery)}`
      );

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.albums || []);
      } else {
        setError("Failed to search YouTube Music");
      }
    } catch (error) {
      console.error("Search error:", error);
      setError("Failed to search YouTube Music");
    } finally {
      setIsSearching(false);
    }
  };

  const selectAlbum = (album: YouTubeAlbum) => {
    setFormData((prev) => ({
      ...prev,
      title: album.title,
      artist: album.artist,
      year: album.year?.toString() || "",
      youtubeMusicUrl: album.youtubeUrl,
      coverImageUrl: album.thumbnail || "",
    }));
    setIsSearchOpen(false);
    setSearchQuery("");
    setSearchResults([]);
    setSuccess(
      `Selected "${album.title}" by ${album.artist} from YouTube Music!`
    );
    // Clear success message after 3 seconds
    setTimeout(() => setSuccess(""), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.artist || !formData.themeId) {
      setError("Please fill in the required fields (Title, Artist, Theme)");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/albums", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: formData.title,
          artist: formData.artist,
          year: formData.year ? parseInt(formData.year) : undefined,
          genre: formData.genre,
          description: formData.description,
          themeId: formData.themeId,
          spotifyUrl: formData.spotifyUrl,
          youtubeMusicUrl: formData.youtubeMusicUrl,
          appleMusicUrl: formData.appleMusicUrl,
          coverImageUrl: formData.coverImageUrl,
        }),
      });

      if (response.ok) {
        setSuccess("Album posted successfully!");
        setTimeout(() => {
          router.push("/albums");
        }, 2000);
      } else {
        const data = await response.json();
        setError(data.error || "Failed to post album");
      }
    } catch (error) {
      console.error("Submit error:", error);
      setError("Failed to post album");
    } finally {
      setIsSubmitting(false);
    }
  };

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

  if (!session) {
    return null;
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", pt: 10 }}>
      <Container maxWidth="md">
        <Stack spacing={6}>
          {/* Header */}
          <Stack spacing={2} textAlign="center">
            <Typography variant="h2" fontWeight={900}>
              Post an{" "}
              <Box component="span" color="primary.main">
                Album
              </Box>
            </Typography>

            {activeTheme && (
              <Card sx={{ p: 3, bgcolor: "rgba(244, 67, 54, 0.1)" }}>
                <Stack spacing={1}>
                  <Typography variant="h6" color="primary.main">
                    Current Theme: {activeTheme.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {activeTheme.description}
                  </Typography>
                </Stack>
              </Card>
            )}
          </Stack>

          {/* Success/Error Messages */}
          {success && (
            <Alert severity="success" sx={{ borderRadius: 2 }}>
              {success}
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          {/* Main Form */}
          <Card>
            <CardContent sx={{ p: 4 }}>
              <form onSubmit={handleSubmit}>
                <Stack spacing={4}>
                  {/* YouTube Music Search */}
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Search YouTube Music
                    </Typography>
                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<YouTube />}
                      onClick={() => setIsSearchOpen(true)}
                      sx={{
                        py: 2,
                        borderStyle: "dashed",
                        borderColor: "#FF0000",
                        color: "#FF0000",
                        "&:hover": {
                          borderColor: "#FF0000",
                          bgcolor: "rgba(255, 0, 0, 0.1)",
                        },
                      }}
                    >
                      Search for Album on YouTube Music
                    </Button>
                  </Box>

                  <Divider />

                  {/* Album Preview */}
                  {(formData.title || formData.coverImageUrl) && (
                    <>
                      <Typography variant="h6">Album Preview</Typography>
                      <Card sx={{ p: 3, bgcolor: "rgba(33, 150, 243, 0.1)" }}>
                        <Stack direction="row" spacing={3} alignItems="center">
                          {formData.coverImageUrl ? (
                            <CardMedia
                              component="img"
                              sx={{ width: 100, height: 100, borderRadius: 2 }}
                              image={formData.coverImageUrl}
                              alt={formData.title}
                            />
                          ) : (
                            <Box
                              sx={{
                                width: 100,
                                height: 100,
                                bgcolor: "grey.300",
                                borderRadius: 2,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <MusicNote sx={{ fontSize: 40 }} />
                            </Box>
                          )}

                          <Stack spacing={1} flex={1}>
                            <Typography variant="h6" fontWeight={700}>
                              {formData.title || "Album Title"}
                            </Typography>
                            <Typography variant="body1" color="text.secondary">
                              {formData.artist || "Artist Name"}
                            </Typography>
                            {formData.year && (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {formData.year}
                              </Typography>
                            )}
                            {formData.genre && (
                              <Chip
                                label={formData.genre}
                                size="small"
                                color="primary"
                              />
                            )}
                          </Stack>

                          {formData.youtubeMusicUrl && (
                            <IconButton
                              component="a"
                              href={formData.youtubeMusicUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              sx={{ color: "#FF0000" }}
                            >
                              <YouTube />
                            </IconButton>
                          )}
                        </Stack>
                      </Card>
                      <Divider />
                    </>
                  )}

                  {/* Manual Entry Fields */}
                  <Typography variant="h6">Album Details</Typography>

                  <Stack spacing={3}>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={3}>
                      <TextField
                        fullWidth
                        label="Album Title *"
                        value={formData.title}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            title: e.target.value,
                          }))
                        }
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <AlbumIcon />
                            </InputAdornment>
                          ),
                        }}
                      />

                      <TextField
                        fullWidth
                        label="Artist *"
                        value={formData.artist}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            artist: e.target.value,
                          }))
                        }
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Person />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Stack>

                    <Stack direction={{ xs: "column", sm: "row" }} spacing={3}>
                      <TextField
                        fullWidth
                        label="Year"
                        type="number"
                        value={formData.year}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            year: e.target.value,
                          }))
                        }
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Event />
                            </InputAdornment>
                          ),
                        }}
                      />

                      <TextField
                        fullWidth
                        label="Genre"
                        value={formData.genre}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            genre: e.target.value,
                          }))
                        }
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <MusicNote />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Stack>
                  </Stack>

                  <TextField
                    fullWidth
                    label="Description"
                    multiline
                    rows={3}
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Description />
                        </InputAdornment>
                      ),
                    }}
                  />

                  {/* Streaming Links */}
                  <Typography variant="h6">Streaming Links</Typography>

                  <Stack spacing={3}>
                    <TextField
                      fullWidth
                      label="YouTube Music URL"
                      value={formData.youtubeMusicUrl}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          youtubeMusicUrl: e.target.value,
                        }))
                      }
                      placeholder="https://music.youtube.com/..."
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <YouTube sx={{ color: "#FF0000" }} />
                          </InputAdornment>
                        ),
                      }}
                    />

                    <Stack direction={{ xs: "column", sm: "row" }} spacing={3}>
                      <TextField
                        fullWidth
                        label="Spotify URL"
                        value={formData.spotifyUrl}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            spotifyUrl: e.target.value,
                          }))
                        }
                        placeholder="https://open.spotify.com/..."
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <LinkIcon sx={{ color: "#1DB954" }} />
                            </InputAdornment>
                          ),
                        }}
                      />

                      <TextField
                        fullWidth
                        label="Apple Music URL"
                        value={formData.appleMusicUrl}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            appleMusicUrl: e.target.value,
                          }))
                        }
                        placeholder="https://music.apple.com/..."
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <LinkIcon sx={{ color: "#FA57C1" }} />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Stack>
                  </Stack>

                  {/* Cover Image */}
                  <TextField
                    fullWidth
                    label="Cover Image URL"
                    value={formData.coverImageUrl}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        coverImageUrl: e.target.value,
                      }))
                    }
                    placeholder="https://..."
                  />

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={isSubmitting}
                    startIcon={
                      isSubmitting ? (
                        <CircularProgress size={20} />
                      ) : (
                        <AlbumIcon />
                      )
                    }
                    sx={{ py: 2 }}
                  >
                    {isSubmitting ? "Posting Album..." : "Post Album"}
                  </Button>
                </Stack>
              </form>
            </CardContent>
          </Card>
        </Stack>
      </Container>

      {/* YouTube Music Search Dialog */}
      <Dialog
        open={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h6">Search YouTube Music</Typography>
            <IconButton onClick={() => setIsSearchOpen(false)}>
              <Close />
            </IconButton>
          </Stack>
        </DialogTitle>

        <DialogContent>
          <Stack spacing={3}>
            {/* Search Input */}
            <TextField
              fullWidth
              placeholder="Search for albums..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  searchYouTubeMusic();
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <Button
                      variant="contained"
                      onClick={searchYouTubeMusic}
                      disabled={isSearching || !searchQuery.trim()}
                      startIcon={
                        isSearching ? (
                          <CircularProgress size={16} />
                        ) : (
                          <Search />
                        )
                      }
                    >
                      Search
                    </Button>
                  </InputAdornment>
                ),
              }}
            />

            {/* Search Results */}
            {searchResults.length > 0 && (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, 1fr)",
                  },
                  gap: 2,
                }}
              >
                {searchResults.map((album) => (
                  <Card
                    key={album.id}
                    sx={{
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      "&:hover": {
                        transform: "translateY(-2px)",
                        boxShadow: "0 8px 16px rgba(0,0,0,0.2)",
                      },
                    }}
                    onClick={() => selectAlbum(album)}
                  >
                    <Stack direction="row" spacing={2} p={2}>
                      {album.thumbnail ? (
                        <CardMedia
                          component="img"
                          sx={{ width: 80, height: 80, borderRadius: 1 }}
                          image={album.thumbnail}
                          alt={album.title}
                        />
                      ) : (
                        <Box
                          sx={{
                            width: 80,
                            height: 80,
                            bgcolor: "grey.300",
                            borderRadius: 1,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <MusicNote />
                        </Box>
                      )}

                      <Stack spacing={1} flex={1}>
                        <Typography variant="subtitle1" fontWeight={600} noWrap>
                          {album.title}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          noWrap
                        >
                          {album.artist}
                        </Typography>
                        {album.year && <Chip label={album.year} size="small" />}
                      </Stack>

                      <IconButton color="primary">
                        <PlayArrow />
                      </IconButton>
                    </Stack>
                  </Card>
                ))}
              </Box>
            )}

            {isSearching && (
              <Box textAlign="center" py={4}>
                <CircularProgress />
                <Typography variant="body2" color="text.secondary" mt={2}>
                  Searching YouTube Music...
                </Typography>
              </Box>
            )}
          </Stack>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
