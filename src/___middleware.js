import { NextResponse } from "next/server";

export function middleware(req) {
  const url = req.nextUrl.clone();

  const token = req.cookies.get("access_token")?.value;
  const role = req.cookies.get("role")?.value;

  // Function to clear cookies
  const logout = () => {
    const res = NextResponse.redirect(new URL("/", req.url));
    res.cookies.delete("access_token");
    res.cookies.delete("role");
    return res;
  };

  // If no token → logout
  if (!token) return logout();

  // Student route protection
  if (url.pathname.startsWith("/exam") && role !== "student") return logout();

  // Admin/Teacher route protection
  if (url.pathname.startsWith("/admin") && role !== "admin" && role !== "teacher") return logout();

  return NextResponse.next();
}
export const config = {
  matcher: ["/admin/:path*", "/exam/:path*"],
};
