"use client";

import { createTheme, ThemeProvider } from "@mui/material/styles";
import { CssBaseline } from "@mui/material";
import { red, blue, purple } from "@mui/material/colors";

// YouTube Music inspired theme
const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: red[600],
      light: red[400],
      dark: red[800],
    },
    secondary: {
      main: blue[500],
      light: blue[300],
      dark: blue[700],
    },
    background: {
      default: "#0f0f0f",
      paper: "#1f1f1f",
    },
    text: {
      primary: "#ffffff",
      secondary: "#aaaaaa",
    },
  },
  typography: {
    fontFamily:
      "Roboto, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
    h1: {
      fontWeight: 900,
      fontSize: "3.5rem",
    },
    h2: {
      fontWeight: 800,
      fontSize: "2.5rem",
    },
    h3: {
      fontWeight: 700,
      fontSize: "2rem",
    },
    h4: {
      fontWeight: 600,
      fontSize: "1.5rem",
    },
    h5: {
      fontWeight: 600,
      fontSize: "1.25rem",
    },
    h6: {
      fontWeight: 600,
      fontSize: "1rem",
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: "none",
          fontWeight: 600,
          padding: "12px 24px",
        },
        containedPrimary: {
          background: "linear-gradient(135deg, #d32f2f, #f44336)",
          "&:hover": {
            background: "linear-gradient(135deg, #c62828, #e53935)",
            transform: "translateY(-2px)",
            boxShadow: "0 8px 25px rgba(211, 47, 47, 0.4)",
          },
        },
        outlined: {
          borderColor: "rgba(255, 255, 255, 0.2)",
          color: "#ffffff",
          "&:hover": {
            borderColor: "rgba(255, 255, 255, 0.4)",
            backgroundColor: "rgba(255, 255, 255, 0.08)",
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(255, 255, 255, 0.05)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: 16,
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          "&:hover": {
            backgroundColor: "rgba(255, 255, 255, 0.08)",
            borderColor: "rgba(255, 255, 255, 0.2)",
            transform: "translateY(-4px)",
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)",
          },
        },
      },
    },
  },
});

export default function MuiThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
