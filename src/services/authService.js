/**
 * authService.js — authentication against the real database
 * ---------------------------------------------------------------
 * StoreDB keeps staff and customers in two different tables, so this
 * tries both:
 *
 *   1. User table    → POST /login on the auth server (server-side,
 *                      sets a httpOnly cookie). IsAdmin decides whether
 *                      the role is "admin" or "employee".
 *   2. Patrons table → verified client-side, because the supplied
 *                      auth server has no patron login endpoint.
 *                      Role is always "customer".
 *
 * The returned user object keeps the same `role` field the rest of the
 * app already relies on ("admin" | "employee" | "customer"), so
 * ProtectedRoute, Header and the layouts need no changes.
 *
 * ⚠️ login() is now ASYNC because it makes a network request.
 *    Callers must await it. getCurrentUser() and logout() stay
 *    synchronous so components can keep calling them during render.
 * ---------------------------------------------------------------
 */

import {
  loginStaff,
  logoutStaff,
  verifyPatronCredentials,
} from "./accountService";
import { ApiError } from "./apiClient";

const SESSION_KEY = "currentUser";

/** Read the signed-in user from the browser session. Synchronous. */
export function getCurrentUser() {
  const user = localStorage.getItem(SESSION_KEY);
  if (!user) return null;

  try {
    return JSON.parse(user);
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

/**
 * Sign in against the database.
 *
 * @param {string} identifier username (staff) or email (customer)
 * @param {string} password
 * @returns {Promise<{success: boolean, user?: object, message?: string}>}
 */
export async function login(identifier, password) {
  const trimmed = String(identifier ?? "").trim();

  if (!trimmed || !password) {
    return { success: false, message: "Username and password are required." };
  }

  // ---- 1. Staff / admin: server-side login, sets the auth cookie ----
  try {
    const staff = await loginStaff(trimmed, password);

    const isAdmin = Boolean(staff.isAdmin ?? staff.IsAdmin);
    const authenticatedUser = {
      id: staff.id ?? staff.UserID ?? null,
      username: staff.username ?? staff.UserName ?? trimmed,
      name: staff.name ?? staff.Name ?? trimmed,
      email: staff.email ?? staff.Email ?? "",
      role: isAdmin ? "admin" : "employee",
      isAdmin,
      status: "Active",
    };

    localStorage.setItem(SESSION_KEY, JSON.stringify(authenticatedUser));
    return { success: true, user: authenticatedUser };
  } catch (error) {
    // 401 just means "not a staff account" — fall through to Patrons.
    // Anything else (server down, CORS) should surface immediately.
    if (!(error instanceof ApiError) || !error.isAuthError) {
      if (error instanceof ApiError && error.isNetworkError) {
        return {
          success: false,
          message:
            "Cannot reach the server. Make sure Docker is running " +
            "(docker compose up -d).",
        };
      }
      return {
        success: false,
        message: error.message || "Sign in failed. Please try again.",
      };
    }
  }

  // ---- 2. Customer: verified against the Patrons table ----
  try {
    const patron = await verifyPatronCredentials(trimmed, password);

    if (patron) {
      const authenticatedUser = {
        id: patron.UserID,
        username: patron.Email,
        name: patron.Name,
        email: patron.Email,
        role: "customer",
        isAdmin: false,
        status: "Active",
      };

      localStorage.setItem(SESSION_KEY, JSON.stringify(authenticatedUser));
      return { success: true, user: authenticatedUser };
    }
  } catch (error) {
    return {
      success: false,
      message: error.message || "Sign in failed. Please try again.",
    };
  }

  return { success: false, message: "Invalid username or password." };
}

/**
 * Clear the session.
 * Also asks the server to drop the auth cookie; that call is allowed to
 * fail silently, since the local session is already gone either way.
 */
export function logout() {
  localStorage.removeItem(SESSION_KEY);
  logoutStaff().catch(() => {});
}
