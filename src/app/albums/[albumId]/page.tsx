"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Stack,
  IconButton,
  Chip,
  Avatar,
  Button,
  TextField,
  CircularProgress,
  Paper,
  Divider,
} from "@mui/material";
import {
  PlayArrow,
  Favorite,
  Share,
  ArrowBack,
  OpenInNew,
  Send,
} from "@mui/icons-material";
import Link from "next/link";

interface Album {
  _id: string;
  title: string;
  artist: string;
  year?: number;
  genre?: string;
  description?: string;
  coverImageUrl?: string;
  spotifyUrl?: string;
  youtubeMusicUrl?: string;
  appleMusicUrl?: string;
  likeCount: number;
  commentCount: number;
  postedBy: {
    _id: string;
    name: string;
    username: string;
    image?: string;
  };
  theme: {
    _id: string;
    title: string;
  };
  postedAt: string;
  isLikedByUser: boolean;
}

interface Comment {
  _id: string;
  content: string;
  postedBy: {
    _id: string;
    name: string;
    username: string;
    image?: string;
  };
  postedAt: string;
}

export default function AlbumDetailPage() {
  const params = useParams();
  const albumId = params.albumId as string;
  
  const [album, setAlbum] = useState<Album | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  useEffect(() => {
    if (albumId) {
      fetchAlbumDetails();
      fetchComments();
    }
  }, [albumId]);

  const fetchAlbumDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/albums/${albumId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch album details");
      }
      const data = await response.json();
      setAlbum(data.album);
    } catch (error) {
      console.error("Error fetching album:", error);
      setError("Failed to load album details");
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/albums/${albumId}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments || []);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  const handleLike = async () => {
    try {
      const response = await fetch(`/api/albums/${albumId}/like`, {
        method: 'POST',
      });
      if (response.ok) {
        fetchAlbumDetails(); // Refresh album to get updated like count
      }
    } catch (error) {
      console.error("Error liking album:", error);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    try {
      setIsSubmittingComment(true);
      const response = await fetch(`/api/albums/${albumId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newComment }),
      });

      if (response.ok) {
        setNewComment("");
        fetchComments(); // Refresh comments
        fetchAlbumDetails(); // Refresh album to get updated comment count
      }
    } catch (error) {
      console.error("Error submitting comment:", error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error || !album) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box textAlign="center" py={8}>
          <Typography variant="h6" color="error" gutterBottom>
            {error || "Album not found"}
          </Typography>
          <Button component={Link} href="/albums" startIcon={<ArrowBack />}>
            Back to Albums
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={4}>
        {/* Back Button */}
        <Button
          component={Link}
          href="/albums"
          startIcon={<ArrowBack />}
          sx={{ alignSelf: "flex-start" }}
        >
          Back to Albums
        </Button>

        {/* Album Header */}
        <Card
          sx={{
            background:
              "linear-gradient(135deg, rgba(244, 67, 54, 0.1), rgba(33, 150, 243, 0.1))",
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={4}
              alignItems="flex-start"
            >
              {/* Album Cover */}
              <Box sx={{ flexShrink: 0 }}>
                {album.coverImageUrl ? (
                  <CardMedia
                    component="img"
                    image={album.coverImageUrl}
                    alt={album.title}
                    sx={{
                      width: { xs: "100%", md: 300 },
                      height: { xs: 300, md: 300 },
                      borderRadius: 2,
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      width: { xs: "100%", md: 300 },
                      height: 300,
                      bgcolor: "grey.800",
                      borderRadius: 2,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Typography variant="h6" color="text.secondary">
                      No Cover Art
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* Album Info */}
              <Stack spacing={3} sx={{ flex: 1, minWidth: 0 }}>
                <Stack spacing={1}>
                  <Typography variant="h3" fontWeight={700}>
                    {album.title}
                  </Typography>
                  <Typography variant="h5" color="text.secondary">
                    {album.artist}
                  </Typography>
                  {album.year && (
                    <Typography variant="h6" color="text.secondary">
                      {album.year}
                    </Typography>
                  )}
                </Stack>

                {/* Theme */}
                <Chip
                  label={album.theme?.title || 'No Theme'}
                  color="secondary"
                  variant="outlined"
                  sx={{ alignSelf: "flex-start" }}
                />

                {/* Description */}
                {album.description && (
                  <Paper sx={{ p: 3, bgcolor: "rgba(255, 255, 255, 0.05)" }}>
                    <Typography variant="body1" lineHeight={1.7}>
                      {album.description}
                    </Typography>
                  </Paper>
                )}

                {/* Actions */}
                <Stack direction="row" spacing={2} alignItems="center">
                  <Button
                    variant={album.isLikedByUser ? "contained" : "outlined"}
                    color={album.isLikedByUser ? "error" : "primary"}
                    startIcon={<Favorite />}
                    onClick={handleLike}
                    sx={{ 
                      minWidth: 120,
                      '&:hover': {
                        bgcolor: album.isLikedByUser 
                          ? 'rgba(244, 67, 54, 0.8)' 
                          : 'rgba(244, 67, 54, 0.1)',
                      }
                    }}
                  >
                    {album.likeCount} {album.isLikedByUser ? 'Liked' : 'Likes'}
                  </Button>

                  {/* Streaming Links */}
                  {album.spotifyUrl && (
                    <IconButton
                      component="a"
                      href={album.spotifyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ 
                        bgcolor: "#1DB954", 
                        color: "white",
                        "&:hover": { bgcolor: "#1ed760" }
                      }}
                    >
                      <OpenInNew />
                    </IconButton>
                  )}
                  {album.youtubeMusicUrl && (
                    <IconButton
                      component="a"
                      href={album.youtubeMusicUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ 
                        bgcolor: "#FF0000", 
                        color: "white",
                        "&:hover": { bgcolor: "#ff1744" }
                      }}
                    >
                      <PlayArrow />
                    </IconButton>
                  )}
                </Stack>

                {/* Posted By */}
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar
                    src={album.postedBy?.image}
                    alt={album.postedBy?.name || 'Unknown User'}
                    sx={{ width: 40, height: 40 }}
                  >
                    {album.postedBy?.name?.[0]?.toUpperCase() || '?'}
                  </Avatar>
                  <Stack>
                    <Typography variant="body2" fontWeight={600}>
                      {album.postedBy?.name || 'Unknown User'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Posted on {formatDate(album.postedAt)}
                    </Typography>
                  </Stack>
                </Stack>
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        {/* Comments Section */}
        <Card id="comments">
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" fontWeight={700} gutterBottom>
              Comments ({album.commentCount})
            </Typography>

            {/* Add Comment */}
            <Stack direction="row" spacing={2} sx={{ mb: 4 }}>
              <TextField
                fullWidth
                multiline
                rows={3}
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                variant="outlined"
              />
              <Button
                variant="contained"
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || isSubmittingComment}
                sx={{ minWidth: 100, alignSelf: "flex-start" }}
                startIcon={isSubmittingComment ? <CircularProgress size={16} /> : <Send />}
              >
                Post
              </Button>
            </Stack>

            <Divider sx={{ mb: 3 }} />

            {/* Comments List */}
            <Stack spacing={3}>
              {comments.map((comment) => (
                <Stack key={comment._id} direction="row" spacing={2}>
                  <Avatar
                    src={comment.postedBy?.image}
                    alt={comment.postedBy?.name || 'Unknown User'}
                    sx={{ width: 40, height: 40 }}
                  >
                    {comment.postedBy?.name?.[0]?.toUpperCase() || '?'}
                  </Avatar>
                  <Stack spacing={1} sx={{ flex: 1 }}>
                    <Stack
                      direction="row"
                      spacing={2}
                      alignItems="baseline"
                    >
                      <Typography variant="body2" fontWeight={600}>
                        {comment.postedBy?.name || 'Unknown User'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(comment.postedAt)}
                      </Typography>
                    </Stack>
                    <Typography variant="body1">
                      {comment.content}
                    </Typography>
                  </Stack>
                </Stack>
              ))}
              {comments.length === 0 && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  textAlign="center"
                  py={4}
                >
                  No comments yet. Be the first to comment!
                </Typography>
              )}
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Container>
  );
}