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
  DialogActions,
  IconButton,
  Chip,
  CircularProgress,
  InputAdornment,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
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
  Apple,
  Add,
} from "@mui/icons-material";

interface UnifiedAlbumResult {
  id: string;
  title: string;
  artist: string;
  year?: number;
  genre?: string;
  thumbnail?: string;
  description?: string;
  duration?: number;
  trackCount?: number;
  
  // Streaming URLs
  youtubeMusicUrl?: string;
  spotifyUrl?: string;
  appleMusicUrl?: string;
  
  // Source information
  primarySource: 'youtube' | 'spotify' | 'apple';
  availableOn: string[];
}

interface Theme {
  _id: string;
  title: string;
  description: string;
  isActive: boolean;
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
  const [searchResults, setSearchResults] = useState<UnifiedAlbumResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Theme data
  const [themes, setThemes] = useState<Theme[]>([]);
  const [activeTheme, setActiveTheme] = useState<Theme | null>(null);

  // Override detection
  const [isOverride, setIsOverride] = useState(false);

  // Theme creation modal state
  const [isCreateThemeOpen, setIsCreateThemeOpen] = useState(false);
  const [isCreatingTheme, setIsCreatingTheme] = useState(false);
  const [themeFormData, setThemeFormData] = useState({
    title: "",
    description: "",
    guidelines: "",
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  useEffect(() => {
    fetchThemes();
  }, []);

  useEffect(() => {
    // Check for override parameter in URL
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const override = searchParams.get("override") === "true";
      setIsOverride(override);
    }
  }, []);

  const fetchThemes = async () => {
    try {
      const response = await fetch("/api/themes");
      if (response.ok) {
        const data = await response.json();
        setThemes(data.themes || []);
        
        // First try to find a currently active theme
        const active = data.themes?.find(
          (theme: Theme) => theme.isCurrentlyActive
        );
        
        if (active) {
          setActiveTheme(active);
          setFormData((prev) => ({ ...prev, themeId: active._id }));
        } else {
          // Fallback to "Random" theme if no active theme
          const randomTheme = data.themes?.find(
            (theme: Theme) => theme.title === "Random"
          );
          if (randomTheme) {
            setFormData((prev) => ({ ...prev, themeId: randomTheme._id }));
          }
        }
      }
    } catch (error) {
      console.error("Error fetching themes:", error);
    }
  };

  const searchAllMusicServices = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `/api/music/search-all?q=${encodeURIComponent(searchQuery)}&limit=10`
      );

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.albums || []);
        console.log(`Found ${data.albums.length} unified results`);
      } else {
        setError("Failed to search music services");
      }
    } catch (error) {
      console.error("Unified search error:", error);
      setError("Failed to search music services");
    } finally {
      setIsSearching(false);
    }
  };

  const selectAlbum = async (album: UnifiedAlbumResult) => {
    try {
      // Enhanced description fetching based on primary source
      let enhancedDescription = album.description || "";
      
      if (album.primarySource === 'youtube' && album.youtubeMusicUrl) {
        try {
          // Extract YouTube album ID from URL for detailed description
          const ytId = album.id.replace('unified_', '');
          const albumDetailsResponse = await fetch(
            `/api/youtube-music/album?id=${encodeURIComponent(ytId)}`
          );
          
          if (albumDetailsResponse.ok) {
            const detailsData = await albumDetailsResponse.json();
            enhancedDescription = detailsData.album?.description || enhancedDescription;
          }
        } catch (ytError) {
          console.log("YouTube description fetch failed:", ytError);
        }
      }

      // Update form data with all available streaming links (preserve existing themeId)
      setFormData((prev) => ({
        ...prev,
        title: album.title,
        artist: album.artist,
        year: album.year?.toString() || "",
        genre: album.genre || prev.genre,
        description: enhancedDescription || prev.description,
        youtubeMusicUrl: album.youtubeMusicUrl || "",
        spotifyUrl: album.spotifyUrl || "",
        appleMusicUrl: album.appleMusicUrl || "",
        coverImageUrl: album.thumbnail || "",
      }));
      
      setIsSearchOpen(false);
      setSearchQuery("");
      setSearchResults([]);
      
      // Create success message based on available platforms
      const availablePlatforms = album.availableOn.join(', ');
      const platformCount = album.availableOn.length;
      
      let successMessage;
      if (platformCount === 1) {
        successMessage = `Selected "${album.title}" from ${availablePlatforms}!`;
      } else if (platformCount === 2) {
        successMessage = `Selected "${album.title}" with links from ${availablePlatforms}!`;
      } else {
        successMessage = `Selected "${album.title}" with links from all platforms (${availablePlatforms})!`;
      }
      
      setSuccess(successMessage);
      
      // Clear success message after 4 seconds
      setTimeout(() => setSuccess(""), 4000);
      
    } catch (error) {
      console.error("Error selecting album:", error);
      // Fallback to basic selection (preserve themeId)
      setFormData((prev) => ({
        ...prev,
        title: album.title,
        artist: album.artist,
        year: album.year?.toString() || "",
        youtubeMusicUrl: album.youtubeMusicUrl || "",
        spotifyUrl: album.spotifyUrl || "",
        appleMusicUrl: album.appleMusicUrl || "",
        coverImageUrl: album.thumbnail || "",
      }));
      setIsSearchOpen(false);
      setSearchQuery("");
      setSearchResults([]);
      setSuccess(`Selected "${album.title}" by ${album.artist}!`);
      setTimeout(() => setSuccess(""), 3000);
    }
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
          isOverride: isOverride,
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

  const handleCreateTheme = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!themeFormData.title || !themeFormData.description) {
      setError("Please fill in title and description");
      return;
    }

    setIsCreatingTheme(true);
    setError("");

    try {
      const response = await fetch("/api/themes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(themeFormData),
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess(`Theme "${themeFormData.title}" created successfully!`);
        setIsCreateThemeOpen(false);
        setThemeFormData({
          title: "",
          description: "",
          guidelines: "",
        });

        // Refresh themes list and select the new theme
        await fetchThemes();
        const newTheme = data.theme;
        if (newTheme) {
          setFormData(prev => ({ ...prev, themeId: newTheme._id }));
        }

        setTimeout(() => setSuccess(""), 3000);
      } else {
        const data = await response.json();
        setError(data.error || "Failed to create theme");
      }
    } catch (error) {
      console.error("Error creating theme:", error);
      setError("Failed to create theme");
    } finally {
      setIsCreatingTheme(false);
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

            {/* Theme Selection */}
            <Card sx={{ p: 3, bgcolor: "rgba(33, 150, 243, 0.1)" }}>
              <Stack spacing={3}>
                <Typography variant="h6" color="primary.main">
                  Select Theme
                </Typography>
                
                <FormControl fullWidth>
                  <InputLabel>Choose Theme</InputLabel>
                  <Select
                    value={formData.themeId}
                    label="Choose Theme"
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        themeId: e.target.value,
                      }))
                    }
                  >
                    {themes.map((theme) => (
                      <MenuItem
                        key={theme._id}
                        value={theme._id}
                      >
                        <Stack>
                          <Typography variant="body1">
                            {theme.title}
                            {theme.isCurrentlyActive && (
                              <Chip 
                                label="Currently Active" 
                                size="small" 
                                color="success" 
                                sx={{ ml: 1 }}
                              />
                            )}
                            {theme.title === "Random" && (
                              <Chip 
                                label="Always Available" 
                                size="small" 
                                color="default" 
                                sx={{ ml: 1 }}
                              />
                            )}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {theme.description}
                          </Typography>
                        </Stack>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Display selected theme info */}
                {formData.themeId && (
                  <Card sx={{ p: 2, bgcolor: "rgba(244, 67, 54, 0.05)" }}>
                    {(() => {
                      const selectedTheme = themes.find(t => t._id === formData.themeId);
                      return selectedTheme ? (
                        <Stack spacing={1}>
                          <Typography variant="subtitle1" fontWeight={600}>
                            Selected: {selectedTheme.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {selectedTheme.description}
                          </Typography>
                        </Stack>
                      ) : null;
                    })()}
                  </Card>
                )}

                {/* Add New Theme Button */}
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Add />}
                  onClick={() => setIsCreateThemeOpen(true)}
                  sx={{ alignSelf: "flex-start" }}
                >
                  Add New Theme
                </Button>
              </Stack>
            </Card>
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

          {/* Override Mode Indicator */}
          {isOverride && (
            <Alert
              severity="warning"
              sx={{
                borderRadius: 2,
                background:
                  "linear-gradient(135deg, rgba(255, 152, 0, 0.1), rgba(255, 193, 7, 0.1))",
                border: "1px solid rgba(255, 152, 0, 0.3)",
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="body1" fontWeight={600}>
                  🎯 Override Mode Active
                </Typography>
                <Typography variant="body2">
                  - You&rsquo;re posting outside of turn order (turn order will remain
                  unchanged)
                </Typography>
              </Stack>
            </Alert>
          )}

          {/* Main Form */}
          <Card>
            <CardContent sx={{ p: 4 }}>
              <form onSubmit={handleSubmit}>
                <Stack spacing={4}>
                  {/* Unified Music Search */}
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Search Music Services
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Search across YouTube Music, Spotify, and Apple Music at once
                    </Typography>
                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<Search />}
                      onClick={() => setIsSearchOpen(true)}
                      sx={{
                        py: 2,
                        borderStyle: "dashed",
                        borderColor: "primary.main",
                        color: "primary.main",
                        "&:hover": {
                          borderColor: "primary.main",
                          bgcolor: "rgba(33, 150, 243, 0.1)",
                        },
                      }}
                    >
                      Search All Music Services
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

      {/* Unified Music Search Dialog */}
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
            <Typography variant="h6">Search Music Services</Typography>
            <IconButton onClick={() => setIsSearchOpen(false)}>
              <Close />
            </IconButton>
          </Stack>
        </DialogTitle>

        <DialogContent>
          <Stack spacing={3}>
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              <Typography variant="body2">
                🎵 Searching across YouTube Music, Spotify, and Apple Music simultaneously for the best matches!
              </Typography>
            </Alert>

            {/* Search Input */}
            <TextField
              fullWidth
              placeholder="Search for albums..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  searchAllMusicServices();
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
                      onClick={searchAllMusicServices}
                      disabled={isSearching || !searchQuery.trim()}
                      startIcon={
                        isSearching ? (
                          <CircularProgress size={16} />
                        ) : (
                          <Search />
                        )
                      }
                    >
                      Search All
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
                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                          {album.year && <Chip label={album.year} size="small" />}
                          {album.genre && <Chip label={album.genre} size="small" color="secondary" />}
                        </Stack>
                        <Stack direction="row" spacing={0.5} flexWrap="wrap">
                          {album.youtubeMusicUrl && (
                            <Chip 
                              icon={<YouTube />} 
                              label="YT Music" 
                              size="small" 
                              sx={{ bgcolor: "#FF0000", color: "white", fontSize: "0.7rem" }}
                            />
                          )}
                          {album.spotifyUrl && (
                            <Chip 
                              label="Spotify" 
                              size="small" 
                              sx={{ bgcolor: "#1DB954", color: "white", fontSize: "0.7rem" }}
                            />
                          )}
                          {album.appleMusicUrl && (
                            <Chip 
                              icon={<Apple />} 
                              label="Apple" 
                              size="small" 
                              sx={{ bgcolor: "#FA57C1", color: "white", fontSize: "0.7rem" }}
                            />
                          )}
                        </Stack>
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
                  Searching all music services...
                </Typography>
              </Box>
            )}
          </Stack>
        </DialogContent>
      </Dialog>

      {/* Theme Creation Modal */}
      <Dialog
        open={isCreateThemeOpen}
        onClose={() => setIsCreateThemeOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Create New Theme</DialogTitle>
        <form onSubmit={handleCreateTheme}>
          <DialogContent>
            <Stack spacing={3} sx={{ pt: 1 }}>
              <TextField
                label="Theme Title"
                value={themeFormData.title}
                onChange={(e) =>
                  setThemeFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                required
                fullWidth
                placeholder="e.g., Albums that tell a story"
              />

              <TextField
                label="Description"
                value={themeFormData.description}
                onChange={(e) =>
                  setThemeFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                required
                fullWidth
                multiline
                rows={3}
                placeholder="Describe what makes albums fit this theme..."
              />


              <TextField
                label="Guidelines (Optional)"
                value={themeFormData.guidelines}
                onChange={(e) =>
                  setThemeFormData((prev) => ({ ...prev, guidelines: e.target.value }))
                }
                fullWidth
                multiline
                rows={2}
                placeholder="Additional guidelines or examples..."
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setIsCreateThemeOpen(false)}
              disabled={isCreatingTheme}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isCreatingTheme}
              startIcon={isCreatingTheme ? <CircularProgress size={16} /> : <Add />}
            >
              {isCreatingTheme ? "Creating..." : "Create Theme"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

    </Box>
  );
}
