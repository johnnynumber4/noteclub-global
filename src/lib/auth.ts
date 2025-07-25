import NextAuth, { DefaultSession } from "next-auth";
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import DiscordProvider from "next-auth/providers/discord";
import CredentialsProvider from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@next-auth/mongodb-adapter";
import { MongoClient } from "mongodb";
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

const client = new MongoClient(process.env.MONGODB_URI!);
const clientPromise = client.connect();

export const authOptions: NextAuthOptions = {
  // Don't use MongoDB adapter with credentials provider - causes session conflicts
  // adapter: MongoDBAdapter(clientPromise),
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

          // Import User model dynamically to avoid circular dependencies
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
    async jwt({ token, user }) {
      console.log(
        "🎫 JWT callback - user:",
        !!user,
        "token:",
        Object.keys(token)
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
      console.log(
        "📋 Session callback - token:",
        Object.keys(token),
        "session:",
        Object.keys(session)
      );
      if (token) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.image as string;
        console.log("📋 Session - Updated session user:", session.user);
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
};

export default NextAuth(authOptions);
