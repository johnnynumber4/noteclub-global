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
                        "&:hover": { bgcolor: "#1ed760" },
                        width: 48,
                        height: 48
                      }}
                      title="Listen on Spotify"
                    >
                      <Box
                        component="svg"
                        viewBox="0 0 24 24"
                        sx={{ width: 24, height: 24, fill: 'currentColor' }}
                      >
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 14.4c-.17.29-.55.39-.84.22-2.29-1.4-5.18-1.72-8.58-.94-.33.07-.66-.13-.73-.46-.07-.33.13-.66.46-.73 3.74-.85 6.96-.49 9.51 1.05.29.17.39.55.22.84v.02zm1.2-2.68c-.21.34-.66.45-1 .24-2.62-1.61-6.61-2.07-9.72-1.13-.39.12-.8-.09-.92-.48s.09-.8.48-.92c3.56-1.08 8.02-.57 11.42 1.3.34.21.45.66.24 1v-.01zm.11-2.8C14.3 9 8.52 8.8 4.95 9.98c-.46.15-.94-.1-1.09-.56s.1-.94.56-1.09C8.69 7.14 15.1 7.38 19.33 9.5c.42.21.58.72.37 1.14-.21.42-.72.58-1.14.37-.01-.01-.02-.01-.03-.02v.03z"/>
                      </Box>
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
                        "&:hover": { bgcolor: "#ff1744" },
                        width: 48,
                        height: 48
                      }}
                      title="Listen on YouTube Music"
                    >
                      <Box
                        component="svg"
                        viewBox="0 0 24 24"
                        sx={{ width: 24, height: 24, fill: 'currentColor' }}
                      >
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.31-.22-.69-.32-1.09-.32H8.45c-.4 0-.78.1-1.09.32S6.8 9.37 6.8 9.8v4.4c0 .43.25.8.56 1.02s.69.32 1.09.32h7.1c.4 0 .78-.1 1.09-.32s.56-.59.56-1.02V9.8c0-.43-.25-.8-.56-1.02zM14 12.5l-2.5 1.73c-.32.22-.7.01-.7-.38V10.15c0-.39.38-.6.7-.38L14 11.5c.32.22.32.78 0 1z"/>
                      </Box>
                    </IconButton>
                  )}
                  {album.appleMusicUrl && (
                    <IconButton
                      component="a"
                      href={album.appleMusicUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{
                        bgcolor: "#FA57C1",
                        color: "white",
                        "&:hover": { bgcolor: "#e91e63" },
                        width: 48,
                        height: 48
                      }}
                      title="Listen on Apple Music"
                    >
                      <Box
                        component="svg"
                        viewBox="0 0 24 24"
                        sx={{ width: 24, height: 24, fill: 'currentColor' }}
                      >
                        <path d="M23.997 6.124c0-.738-.065-1.47-.24-2.19-.317-1.31-1.062-2.31-2.18-3.043C21.003.517 20.373.285 19.7.164c-.517-.093-1.038-.135-1.564-.123-.31-.004-.62.01-.93.035-.5.04-.99.117-1.36.28-.96.42-1.51 1.01-1.51 1.01s-.55-.59-1.51-1.01c-.37-.163-.86-.24-1.36-.28-.31-.025-.62-.04-.93-.035-.526-.012-1.047.03-1.564.123-.673.12-1.303.353-1.877.817-1.118.734-1.863 1.734-2.18 3.043-.175.72-.24 1.452-.24 2.19 0 .02 0 .04.001.06v12.457c0 1.102.898 2 2 2h.01c.665 0 1.275-.388 1.556-.991l6.831-14.68c.78-1.675 2.77-2.51 4.445-1.73.835.39 1.34 1.195 1.34 2.08v9.32c0 2.21-1.79 4-4 4s-4-1.79-4-4V9.124c0-.552.448-1 1-1s1 .448 1 1v3.876c0 1.105.895 2 2 2s2-.895 2-2v-9.32c0-.423-.203-.823-.55-1.07-.695-.495-1.73-.35-2.225.345L9.776 17.633c-.1.177-.29.29-.498.29-.552 0-1-.448-1-1V6.185c0-.517.06-1.022.179-1.515.24-.99.79-1.64 1.314-1.968.394-.246.84-.35 1.29-.35.31 0 .62.04.91.12.54.15.99.44 1.31.85.32-.41.77-.7 1.31-.85.29-.08.6-.12.91-.12.45 0 .896.104 1.29.35.524.328 1.074.978 1.314 1.968.119.493.179.998.179 1.515z"/>
                      </Box>
                    </IconButton>
                  )}
                </Stack>

                {/* Posted By */}
                <Stack
                  direction="row"
                  spacing={2}
                  alignItems="center"
                  onClick={() => {
                    if (album.postedBy?._id) {
                      window.location.href = `/profile/${album.postedBy._id}`;
                    }
                  }}
                  sx={{
                    cursor: album.postedBy?._id ? 'pointer' : 'default',
                    borderRadius: 2,
                    p: 1,
                    transition: 'background-color 0.2s',
                    '&:hover': album.postedBy?._id ? {
                      bgcolor: 'rgba(255, 255, 255, 0.05)',
                      '& .MuiTypography-root': {
                        color: 'primary.main'
                      }
                    } : {},
                    width: 'fit-content'
                  }}
                >
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
                    sx={{
                      width: 40,
                      height: 40,
                      cursor: comment.postedBy?._id ? 'pointer' : 'default',
                      transition: 'transform 0.2s',
                      '&:hover': comment.postedBy?._id ? {
                        transform: 'scale(1.05)'
                      } : {}
                    }}
                    onClick={() => {
                      if (comment.postedBy?._id) {
                        window.location.href = `/profile/${comment.postedBy._id}`;
                      }
                    }}
                  >
                    {comment.postedBy?.name?.[0]?.toUpperCase() || '?'}
                  </Avatar>
                  <Stack spacing={1} sx={{ flex: 1 }}>
                    <Stack
                      direction="row"
                      spacing={2}
                      alignItems="baseline"
                    >
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        onClick={() => {
                          if (comment.postedBy?._id) {
                            window.location.href = `/profile/${comment.postedBy._id}`;
                          }
                        }}
                        sx={{
                          cursor: comment.postedBy?._id ? 'pointer' : 'default',
                          '&:hover': comment.postedBy?._id ? {
                            color: 'primary.main'
                          } : {}
                        }}
                      >
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