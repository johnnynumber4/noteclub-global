import NextAuth, { DefaultSession } from "next-auth";
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import DiscordProvider from "next-auth/providers/discord";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import dbConnect from "./mongodb";

// Extend the built-in session types
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role?: string;
    } & DefaultSession["user"];
  }
}

export const authOptions: NextAuthOptions = {
  // No adapter - we'll handle user storage manually for both OAuth and credentials
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log("🔐 Authorize called with:", {
          email: credentials?.email,
          hasPassword: !!credentials?.password,
        });

        if (!credentials?.email || !credentials?.password) {
          console.log("❌ Missing credentials");
          return null;
        }

        try {
          await dbConnect();
          const { User } = await import("@/models/User");

          const user = await User.findOne({
            email: credentials.email,
          }).select("+password");

          console.log("👤 User found:", !!user, user?.email);

          if (!user) {
            console.log("❌ User not found");
            return null;
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          console.log("🔑 Password valid:", isPasswordValid);

          if (!isPasswordValid) {
            console.log("❌ Invalid password");
            return null;
          }

          // Skip updating lastActive for now to avoid save issues
          // user.lastActive = new Date();
          // await user.save();

          const returnUser = {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            image: user.image,
          };

          console.log("✅ Returning user:", returnUser);
          return returnUser;
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account }) {
      console.log("🔐 SignIn callback:", {
        user: !!user,
        account: account?.provider,
      });

      if (account?.provider === "google" || account?.provider === "discord") {
        await dbConnect();
        const { User } = await import("@/models/User");

        try {
          // Check if user exists in our User model
          let existingUser = await User.findOne({ email: user.email });

          if (!existingUser) {
            console.log("👤 Creating new OAuth user in User model");

            // Generate unique username
            const baseUsername =
              user.email
                ?.split("@")[0]
                .toLowerCase()
                .replace(/[^a-z0-9]/g, "") || "user";
            let username = baseUsername;
            let counter = 1;

            while (await User.findOne({ username })) {
              username = `${baseUsername}${counter}`;
              counter++;
            }

            // Get next turn order
            const lastUser = await User.findOne().sort({ turnOrder: -1 });
            const turnOrder = lastUser ? lastUser.turnOrder + 1 : 1;

            // Create user in our User model
            existingUser = new User({
              name: user.name,
              email: user.email,
              image: user.image,
              username,
              turnOrder,
              favoriteGenres: [],
              musicPlatforms: {},
              isActive: true,
              albumsPosted: 0,
              commentsPosted: 0,
              likesGiven: 0,
              likesReceived: 0,
              totalAlbumsPosted: 0,
              notificationSettings: {
                newThemes: true,
                turnReminders: true,
                comments: true,
                likes: true,
                emails: true,
              },
              role: "member",
              isVerified: true, // OAuth users are considered verified
              isBanned: false,
              joinedAt: new Date(),
              lastActive: new Date(),
            });

            await existingUser.save();
            console.log("✅ OAuth user created in User model");
          } else {
            // Update last active
            existingUser.lastActive = new Date();
            await existingUser.save();
            console.log("✅ OAuth user updated in User model");
          }
        } catch (error) {
          console.error("❌ Error handling OAuth user:", error);
          // Don't block sign in if User model sync fails
        }
      }

      return true;
    },
    async jwt({ token, user, account }) {
      console.log(
        "🎫 JWT callback - user:",
        !!user,
        "account:",
        account?.provider
      );

      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.image = user.image;
        console.log("🎫 JWT - Added user to token:", {
          id: user.id,
          email: user.email,
          name: user.name,
        });
      }
      return token;
    },
    async session({ session, token }) {
      console.log("📋 Session callback - token:", Object.keys(token));

      // For JWT sessions, use the token
      if (token) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.image as string;
      }

      console.log("📋 Session - Final session user:", session.user);
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
  debug: process.env.NODE_ENV === "development",
};

export default NextAuth(authOptions);
