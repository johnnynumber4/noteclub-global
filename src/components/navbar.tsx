"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
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
import { Music, LogOut, User, Settings, Disc3, Menu, X, Shield } from "lucide-react";
import { useTurnStatus } from "@/hooks/useTurnStatus";

export function Navbar() {
  const { data: session, status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isMyTurn, turnStatus } = useTurnStatus();

  // Debug: log session info
  useEffect(() => {
    console.log('Navbar session status:', status);
    console.log('Navbar session email:', session?.user?.email);
    console.log('Is admin?:', session?.user?.email === "jyoungiv@gmail.com");
  }, [session, status]);

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
        <div className="hidden md:flex items-center space-x-6">
          <Link
            href="/albums"
            className="text-sm font-semibold text-gray-300 hover:text-red-400 transition-colors duration-200 hover:scale-105"
          >
            Albums
          </Link>
          {status === "authenticated" && (
            <Link
              href="/admin"
              className="text-sm font-semibold text-orange-400 hover:text-orange-300 transition-colors duration-200 hover:scale-105 flex items-center space-x-1 bg-orange-400/10 px-3 py-1 rounded-md"
            >
              <Shield className="h-4 w-4" />
              <span>Admin ({session?.user?.email})</span>
            </Link>
          )}
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
            className="text-sm font-semibold text-gray-300 hover:text-green-400 transition-colors duration-200 hover:scale-105 relative"
          >
            Turns
            {isMyTurn && (
              <span className="absolute -top-1 -right-2 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
            )}
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
                className={`${
                  isMyTurn
                    ? "text-green-400 hover:text-green-300 hover:bg-green-400/10 animate-pulse"
                    : "text-red-400 hover:text-red-300 hover:bg-red-400/10"
                } transition-all duration-200 relative`}
              >
                <Link href="/post-album">
                  <Disc3 className="h-4 w-4 mr-2" />
                  {isMyTurn ? "Your Turn!" : "Post Album"}
                  {isMyTurn && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                  )}
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
                  {session.user?.email === "jyoungiv@gmail.com" && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="cursor-pointer text-orange-600 focus:text-orange-600">
                          <Shield className="mr-2 h-4 w-4" />
                          Admin Panel
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
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
              className={`${
                isMyTurn
                  ? "text-green-400 hover:text-green-300 hover:bg-green-400/10"
                  : "text-red-400 hover:text-red-300 hover:bg-red-400/10"
              } relative`}
            >
              <Link href="/post-album">
                <Disc3 className="h-4 w-4" />
                {isMyTurn && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                )}
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
                className="block text-base font-semibold text-gray-300 hover:text-green-400 transition-colors py-2 relative flex items-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                Turns
                {isMyTurn && (
                  <span className="ml-2 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                  </span>
                )}
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
                  {session.user?.email === "jyoungiv@gmail.com" && (
                    <Link
                      href="/admin"
                      className="flex items-center space-x-2 text-base text-orange-400 hover:text-orange-300 transition-colors py-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Shield className="h-4 w-4" />
                      <span>Admin Panel</span>
                    </Link>
                  )}
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
