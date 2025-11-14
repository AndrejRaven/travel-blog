import { jwtVerify } from "jose";
import { cookies } from "next/headers";

// Wymuszenie zmiennej środowiskowej - brak fallbacku
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error(
    "JWT_SECRET environment variable is required. Please set it in your environment variables."
  );
}

export interface AdminUser {
  username: string;
  role: string;
  exp: number;
}

export async function verifyAdminToken(): Promise<AdminUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin-token")?.value;

    if (!token) {
      return null;
    }

    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    // Sprawdź czy token nie wygasł
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return {
      username: payload.username as string,
      role: payload.role as string,
      exp: payload.exp as number,
    };
  } catch (error) {
    console.error("Token verification error:", error);
    return null;
  }
}

export async function requireAdmin(): Promise<AdminUser> {
  const user = await verifyAdminToken();
  
  if (!user) {
    throw new Error("Unauthorized");
  }

  return user;
}
