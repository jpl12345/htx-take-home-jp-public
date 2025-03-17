"use client";

import Link from "next/link";
import { useContext } from "react";
import { AuthContext } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const { isAuthenticated, user, logout } = useContext(AuthContext);
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.refresh();
    router.push("/");
  };

  return (
    <nav className="flex items-center justify-between p-4 bg-gray-800 text-white">
      <div className="flex items-center">
        {!isAuthenticated && (
          <Link href="/" className="px-3 hover:underline">
            Home
          </Link>
        )}
        {isAuthenticated && user && (
          <span className="px-3">
            Welcome, {user.first_name} {user.last_name}
          </span>
        )}
      </div>

      <div>
        {isAuthenticated ? (
          <>
            {user?.account_type === "superuser" && (
              <Link href="/admin/dashboard" className="px-3 hover:underline">
                Admin Dashboard
              </Link>
            )}
            <Link href="/upload" className="px-3 hover:underline">
              Upload
            </Link>
            <Link href="/files" className="px-3 hover:underline">
              My Files
            </Link>
            <button onClick={handleLogout} className="px-3 hover:underline">
              Logout
            </button>
          </>
        ) : (
          <>
            <Link href="/login" className="px-3 hover:underline">
              Login
            </Link>
            <Link href="/register" className="px-3 hover:underline">
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
