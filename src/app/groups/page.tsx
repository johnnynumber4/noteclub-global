"use client";

import { useState, useEffect } from "react";
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
  Stack,
  Avatar,
  Chip,
  Grid,
  Paper,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  Add,
  Group as GroupIcon,
  People,
  Lock,
  Public,
  ContentCopy,
  AdminPanelSettings,
} from "@mui/icons-material";

interface Group {
  _id: string;
  name: string;
  description?: string;
  isPrivate: boolean;
  inviteCode: string;
  maxMembers: number;
  members: Array<{
    _id: string;
    name: string;
    username: string;
    image?: string;
  }>;
  admins: string[];
  createdBy: string;
  totalAlbumsShared: number;
  totalThemes: number;
  createdAt: string;
  updatedAt: string;
}

export default function GroupsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Dialog states
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [joinGroupOpen, setJoinGroupOpen] = useState(false);

  // Form states
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(true);
  const [maxMembers, setMaxMembers] = useState(20);
  const [inviteCode, setInviteCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    } else if (status === "authenticated") {
      fetchGroups();
    }
  }, [status, router]);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/groups");
      if (response.ok) {
        const data = await response.json();
        setGroups(data.groups || []);
      } else {
        setError("Failed to fetch groups");
      }
    } catch (error) {
      console.error("Error fetching groups:", error);
      setError("Failed to fetch groups");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      setError("Group name is required");
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: groupName,
          description: groupDescription,
          isPrivate,
          maxMembers,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setGroups([data.group, ...groups]);
        setSuccess("Group created successfully!");
        setCreateGroupOpen(false);
        resetForm();
      } else {
        const data = await response.json();
        setError(data.error || "Failed to create group");
      }
    } catch (error) {
      console.error("Error creating group:", error);
      setError("Failed to create group");
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoinGroup = async () => {
    if (!inviteCode.trim()) {
      setError("Invite code is required");
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch("/api/groups/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode: inviteCode.toUpperCase() }),
      });

      if (response.ok) {
        await fetchGroups(); // Refresh groups list
        setSuccess("Joined group successfully!");
        setJoinGroupOpen(false);
        resetForm();
      } else {
        const data = await response.json();
        setError(data.error || "Failed to join group");
      }
    } catch (error) {
      console.error("Error joining group:", error);
      setError("Failed to join group");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setGroupName("");
    setGroupDescription("");
    setIsPrivate(true);
    setMaxMembers(20);
    setInviteCode("");
    setError("");
  };

  const copyInviteCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setSuccess("Invite code copied to clipboard!");
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const isGroupAdmin = (group: Group) => {
    return group.admins.includes(session?.user?.id || "");
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

  return (
    <Box
      sx={{ minHeight: "100vh", bgcolor: "background.default", pt: { xs: 8, md: 10 }, pb: 4 }}
    >
      <Container maxWidth="lg">
        <Stack spacing={4}>
          {/* Header */}
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems="center"
            spacing={2}
          >
            <Stack spacing={1}>
              <Typography variant="h3" fontWeight={900}>
                Your Groups 👥
              </Typography>
              <Typography variant="h6" color="text.secondary">
                Manage your music sharing communities
              </Typography>
            </Stack>

            <Stack direction="row" spacing={2}>
              <Button
                variant="outlined"
                startIcon={<GroupIcon />}
                onClick={() => setJoinGroupOpen(true)}
              >
                Join Group
              </Button>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setCreateGroupOpen(true)}
              >
                Create Group
              </Button>
            </Stack>
          </Stack>

          {/* Success/Error Messages */}
          {success && (
            <Alert
              severity="success"
              sx={{ borderRadius: 2 }}
              onClose={() => setSuccess("")}
            >
              {success}
            </Alert>
          )}
          {error && (
            <Alert
              severity="error"
              sx={{ borderRadius: 2 }}
              onClose={() => setError("")}
            >
              {error}
            </Alert>
          )}

          {/* Groups Grid */}
          {groups.length === 0 ? (
            <Paper
              sx={{
                p: 8,
                textAlign: "center",
                background:
                  "linear-gradient(135deg, rgba(33, 150, 243, 0.05), rgba(244, 67, 54, 0.05))",
              }}
            >
              <GroupIcon
                sx={{ fontSize: 80, color: "text.secondary", mb: 2 }}
              />
              <Typography variant="h5" gutterBottom>
                No Groups Yet
              </Typography>
              <Typography variant="body1" color="text.secondary" gutterBottom>
                Create your first group or join an existing one to start sharing
                music!
              </Typography>
              <Stack
                direction="row"
                spacing={2}
                justifyContent="center"
                sx={{ mt: 3 }}
              >
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setCreateGroupOpen(true)}
                >
                  Create Group
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<GroupIcon />}
                  onClick={() => setJoinGroupOpen(true)}
                >
                  Join Group
                </Button>
              </Stack>
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {groups.map((group) => (
                <Grid size={{ xs: 12, md: 6, lg: 4 }} key={group._id}>
                  <Card
                    sx={{
                      height: "100%",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      "&:hover": {
                        transform: "translateY(-4px)",
                        boxShadow: "0 8px 16px rgba(0,0,0,0.2)",
                      },
                    }}
                    component={Link}
                    href={`/groups/${group._id}`}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Stack spacing={3}>
                        {/* Header */}
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="flex-start"
                        >
                          <Stack spacing={1} flex={1}>
                            <Stack
                              direction="row"
                              alignItems="center"
                              spacing={1}
                            >
                              <Typography variant="h6" fontWeight={700} noWrap>
                                {group.name}
                              </Typography>
                              {group.isPrivate ? (
                                <Lock
                                  sx={{ fontSize: 16, color: "text.secondary" }}
                                />
                              ) : (
                                <Public
                                  sx={{ fontSize: 16, color: "text.secondary" }}
                                />
                              )}
                              {isGroupAdmin(group) && (
                                <AdminPanelSettings
                                  sx={{ fontSize: 16, color: "primary.main" }}
                                />
                              )}
                            </Stack>
                            {group.description && (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{
                                  display: "-webkit-box",
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: "vertical",
                                  overflow: "hidden",
                                }}
                              >
                                {group.description}
                              </Typography>
                            )}
                          </Stack>
                        </Stack>

                        {/* Members */}
                        <Stack spacing={2}>
                          <Stack
                            direction="row"
                            alignItems="center"
                            spacing={1}
                          >
                            <People
                              sx={{ fontSize: 16, color: "text.secondary" }}
                            />
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {group.members.length} / {group.maxMembers}{" "}
                              members
                            </Typography>
                          </Stack>

                          <Stack direction="row" spacing={0.5} flexWrap="wrap">
                            {group.members.slice(0, 6).map((member) => (
                              <Avatar
                                key={member._id}
                                src={member.image}
                                sx={{ width: 24, height: 24, fontSize: 12 }}
                              >
                                {member.name?.[0]}
                              </Avatar>
                            ))}
                            {group.members.length > 6 && (
                              <Avatar
                                sx={{ width: 24, height: 24, fontSize: 10 }}
                              >
                                +{group.members.length - 6}
                              </Avatar>
                            )}
                          </Stack>
                        </Stack>

                        {/* Stats */}
                        <Stack direction="row" spacing={2}>
                          <Chip
                            label={`${group.totalAlbumsShared} albums`}
                            size="small"
                            variant="outlined"
                          />
                          <Chip
                            label={`${group.totalThemes} themes`}
                            size="small"
                            variant="outlined"
                          />
                        </Stack>

                        {/* Invite Code */}
                        {(isGroupAdmin(group) || !group.isPrivate) && (
                          <Stack
                            direction="row"
                            alignItems="center"
                            spacing={1}
                          >
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Code: {group.inviteCode}
                            </Typography>
                            <Tooltip title="Copy invite code">
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  copyInviteCode(group.inviteCode);
                                }}
                              >
                                <ContentCopy sx={{ fontSize: 14 }} />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        )}
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Stack>
      </Container>

      {/* Create Group Dialog */}
      <Dialog
        open={createGroupOpen}
        onClose={() => {
          setCreateGroupOpen(false);
          resetForm();
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Group</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Group Name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              fullWidth
              required
            />
            <TextField
              label="Description (Optional)"
              value={groupDescription}
              onChange={(e) => setGroupDescription(e.target.value)}
              fullWidth
              multiline
              rows={2}
            />
            <TextField
              label="Max Members"
              type="number"
              value={maxMembers}
              onChange={(e) => setMaxMembers(Number(e.target.value))}
              fullWidth
              inputProps={{ min: 2, max: 100 }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                />
              }
              label="Private Group (invite only)"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setCreateGroupOpen(false);
              resetForm();
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateGroup}
            variant="contained"
            disabled={submitting || !groupName.trim()}
          >
            {submitting ? <CircularProgress size={20} /> : "Create Group"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Join Group Dialog */}
      <Dialog
        open={joinGroupOpen}
        onClose={() => {
          setJoinGroupOpen(false);
          resetForm();
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Join Group</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Invite Code"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              fullWidth
              required
              placeholder="Enter 6-8 character code"
              inputProps={{ style: { textTransform: "uppercase" } }}
            />
            <Typography variant="body2" color="text.secondary">
              Enter the invite code shared by a group admin to join their music
              sharing community.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setJoinGroupOpen(false);
              resetForm();
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleJoinGroup}
            variant="contained"
            disabled={submitting || !inviteCode.trim()}
          >
            {submitting ? <CircularProgress size={20} /> : "Join Group"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
