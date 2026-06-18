import crypto from "crypto";
import { cookies } from "next/headers";
import { query } from "./db";

const COOKIE_NAME = "delivery_session";

function getSecret() {
  return process.env.SESSION_SECRET || "delivery-app-dev-secret";
}

export function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto
    .pbkdf2Sync(password, salt, 10000, 64, "sha512")
    .toString("hex");

  return `${salt}:${hash}`;
}

export function verifyPassword(password, storedHash) {
  if (!storedHash || !storedHash.includes(":")) return false;

  const [salt, originalHash] = storedHash.split(":");
  const newHash = hashPassword(password, salt).split(":")[1];

  return crypto.timingSafeEqual(
    Buffer.from(originalHash, "hex"),
    Buffer.from(newHash, "hex")
  );
}

function sign(value) {
  return crypto
    .createHmac("sha256", getSecret())
    .update(value)
    .digest("hex");
}

export function createSessionValue(userId) {
  const value = String(userId);
  const signature = sign(value);
  return `${value}.${signature}`;
}

export function readSessionValue(sessionValue) {
  if (!sessionValue || !sessionValue.includes(".")) return null;

  const [value, signature] = sessionValue.split(".");
  if (sign(value) !== signature) return null;

  const userId = Number(value);
  return Number.isInteger(userId) ? userId : null;
}

export function setLoginCookie(userId) {
  cookies().set(COOKIE_NAME, createSessionValue(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function clearLoginCookie() {
  cookies().set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function getCurrentUser() {
  const session = cookies().get(COOKIE_NAME)?.value;
  const userId = readSessionValue(session);

  if (!userId) return null;

  const result = await query(
    "SELECT id, email, name, created_at FROM users WHERE id = $1",
    [userId]
  );

  return result.rows[0] || null;
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    const error = new Error("로그인이 필요합니다.");
    error.status = 401;
    throw error;
  }

  return user;
}
