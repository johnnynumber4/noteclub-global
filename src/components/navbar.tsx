"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Music, LogOut, User, Settings, Disc3, Menu, X } from "lucide-react";

export function Navbar() {
  const { data: session, status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav
      className="fixed top-0 z-50 w-full backdrop-blur supports-[backdrop-filter]:bg-black/90"
      style={{
        background: "rgba(15, 15, 15, 0.95)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
      }}
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <Link
            href="/"
            className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
          >
            <div
              className="h-9 w-9 rounded-full flex items-center justify-center shadow-lg"
              style={{
                background: "linear-gradient(45deg, #ff1744, #2196f3)",
              }}
            >
              <Music className="h-5 w-5 text-white" />
            </div>
            <span
              className="text-xl font-black"
              style={{
                background: "linear-gradient(45deg, #ff1744, #2196f3)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              NoteClub
            </span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-8">
          <Link
            href="/albums"
            className="text-sm font-semibold text-gray-300 hover:text-red-400 transition-colors duration-200 hover:scale-105"
          >
            Albums
          </Link>
          <Link
            href="/groups"
            className="text-sm font-semibold text-gray-300 hover:text-blue-400 transition-colors duration-200 hover:scale-105"
          >
            Groups
          </Link>
          <Link
            href="/members"
            className="text-sm font-semibold text-gray-300 hover:text-purple-400 transition-colors duration-200 hover:scale-105"
          >
            Members
          </Link>
          <Link
            href="/turns"
            className="text-sm font-semibold text-gray-300 hover:text-green-400 transition-colors duration-200 hover:scale-105"
          >
            Turns
          </Link>
        </div>

        {/* Desktop Auth Section */}
        <div className="hidden md:flex items-center space-x-4">
          {status === "loading" ? (
            <div className="h-9 w-9 animate-pulse rounded-full bg-gray-700" />
          ) : session ? (
            <>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-all duration-200"
              >
                <Link href="/post-album">
                  <Disc3 className="h-4 w-4 mr-2" />
                  Post Album
                </Link>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-9 w-9 rounded-full hover:shadow-lg transition-all duration-200"
                  >
                    <Avatar className="h-9 w-9 border-2 border-purple-200">
                      <AvatarImage
                        src={session.user?.image || ""}
                        alt={session.user?.name || ""}
                      />
                      <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-semibold">
                        {session.user?.name
                          ? session.user.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                          : "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {session.user?.name}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {session.user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/my-albums" className="cursor-pointer">
                      <Disc3 className="mr-2 h-4 w-4" />
                      My Albums
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer text-red-600 focus:text-red-600"
                    onSelect={(event) => {
                      event.preventDefault();
                      signOut();
                    }}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center space-x-3">
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="text-gray-300 hover:text-red-400 hover:bg-red-400/10"
              >
                <Link href="/auth/signin">Sign In</Link>
              </Button>
              <Button
                asChild
                size="sm"
                style={{
                  background: "linear-gradient(45deg, #ff1744, #2196f3)",
                  color: "white",
                  border: "none",
                  borderRadius: "25px",
                }}
                className="shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Link href="/auth/signup">Join Club</Link>
              </Button>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center space-x-2">
          {session && (
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
            >
              <Link href="/post-album">
                <Disc3 className="h-4 w-4" />
              </Link>
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-gray-300 hover:text-white hover:bg-white/10"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div
          className="md:hidden backdrop-blur-md"
          style={{
            background: "rgba(15, 15, 15, 0.95)",
            borderTop: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <div className="container mx-auto px-4 py-4 space-y-4">
            {/* Navigation Links */}
            <div className="space-y-3">
              <Link
                href="/albums"
                className="block text-base font-semibold text-gray-300 hover:text-red-400 transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Albums
              </Link>
              <Link
                href="/groups"
                className="block text-base font-semibold text-gray-300 hover:text-blue-400 transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Groups
              </Link>
              <Link
                href="/members"
                className="block text-base font-semibold text-gray-300 hover:text-purple-400 transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Members
              </Link>
              <Link
                href="/turns"
                className="block text-base font-medium text-gray-600 hover:text-purple-600 transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Turns
              </Link>
            </div>

            {/* Auth Section */}
            <div
              className="border-t pt-4"
              style={{ borderColor: "rgba(255, 255, 255, 0.1)" }}
            >
              {status === "loading" ? (
                <div className="h-9 w-full animate-pulse rounded bg-gray-700" />
              ) : session ? (
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 py-2">
                    <Avatar className="h-10 w-10 border-2 border-red-400/30">
                      <AvatarImage
                        src={session.user?.image || ""}
                        alt={session.user?.name || ""}
                      />
                      <AvatarFallback
                        className="text-white text-sm font-semibold"
                        style={{
                          background:
                            "linear-gradient(45deg, #ff1744, #2196f3)",
                        }}
                      >
                        {session.user?.name
                          ? session.user.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                          : "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium text-white">
                        {session.user?.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {session.user?.email}
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/profile"
                    className="flex items-center space-x-2 text-base text-gray-300 hover:text-red-400 transition-colors py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <User className="h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                  <Link
                    href="/my-albums"
                    className="flex items-center space-x-2 text-base text-gray-300 hover:text-blue-400 transition-colors py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Disc3 className="h-4 w-4" />
                    <span>My Albums</span>
                  </Link>
                  <Link
                    href="/settings"
                    className="flex items-center space-x-2 text-base text-gray-300 hover:text-purple-400 transition-colors py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                  <button
                    onClick={() => {
                      signOut();
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center space-x-2 text-base text-red-400 hover:text-red-300 transition-colors py-2 w-full text-left"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Log out</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <Button
                    asChild
                    variant="ghost"
                    className="w-full justify-start text-gray-300 hover:text-red-400 hover:bg-red-400/10"
                  >
                    <Link
                      href="/auth/signin"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Sign In
                    </Link>
                  </Button>
                  <Button
                    asChild
                    className="w-full text-white border-0"
                    style={{
                      background: "linear-gradient(45deg, #ff1744, #2196f3)",
                      borderRadius: "25px",
                    }}
                  >
                    <Link
                      href="/auth/signup"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Join Club
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
