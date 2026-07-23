/**
 * accountService.js — accounts and authentication
 * ---------------------------------------------------------------
 * StoreDB has TWO account tables with different purposes:
 *
 *   User    staff and admins. POST /login queries this table directly
 *           and issues a httpOnly cookie. PK is UserName, not UserID.
 *   Patrons customers. NOT handled by POST /login.
 *
 * Consequence: staff sign in server-side (secure); customers must be
 * verified client-side against Patrons. See verifyPatronCredentials()
 * for why, and what to write in your report about it.
 * ---------------------------------------------------------------
 */

import {
  request,
  listRows,
  getRow,
  createRow,
  updateRow,
  deleteRow,
  buildWhere,
  ApiError,
} from "./apiClient";
import {
  TABLES,
  validatePatron,
  generateSalt,
  hashPassword,
  compareHash,
} from "./schema";

/* ---------------- Staff auth (server-side, secure) ---------------- */

/**
 * Sign in a staff or admin account.
 * The server sets a httpOnly cookie; nothing is stored client-side.
 * @param {string} username User.UserName
 * @param {string} password
 * @returns {Promise<{id:number, email:string, username:string, isAdmin:boolean}>}
 */
export function loginStaff(username, password) {
  if (!username?.trim() || !password) {
    throw new Error("Username and password are required.");
  }
  return request("/login", {
    method: "POST",
    body: { username: username.trim(), password },
  });
}

/** Clear the auth cookie. */
export function logoutStaff() {
  return request("/logout", { method: "POST" });
}

/**
 * Read the current session from the cookie.
 * @returns {Promise<{id:number, email:string}|null>} null when signed out
 */
export async function getSession() {
  try {
    return await request("/me");
  } catch (error) {
    if (error instanceof ApiError && error.isAuthError) return null;
    throw error;
  }
}

/* ---------------- Customer accounts (Patrons) ---------------- */

/**
 * Look up a customer by email. Email acts as the username.
 * @returns {Promise<import("./schema").Patron|null>}
 */
export async function findPatronByEmail(email) {
  if (!email?.trim()) return null;
  const { list } = await listRows(TABLES.PATRONS, {
    where: buildWhere([["Email", "eq", email.trim().toLowerCase()]]),
    limit: 1,
  });
  return list[0] ?? null;
}

/**
 * Register a customer.
 * Hashes with the backend's own scheme so the account stays compatible
 * if a server-side patron login is added later.
 *
 * @param {{Name:string, Email:string, password:string}} input
 * @returns {Promise<import("./schema").Patron>}
 */
export async function registerPatron(input) {
  validatePatron(input);

  const email = input.Email.trim().toLowerCase();

  // Patrons.Email has no UNIQUE constraint, so check first.
  if (await findPatronByEmail(email)) {
    const error = new Error("This email is already registered.");
    error.fieldErrors = { Email: "This email is already registered." };
    throw error;
  }

  const salt = generateSalt();
  const hashPW = await hashPassword(salt, input.password);

  const created = await createRow(TABLES.PATRONS, {
    Name: input.Name.trim(),
    Email: email,
    Salt: salt,
    HashPW: hashPW,
  });

  const { Salt: _s, HashPW: _h, ...safe } = created ?? {};
  return safe;
}

/**
 * Verify customer credentials.
 *
 * SECURITY NOTE — worth a paragraph in your report:
 * GET /Patrons is public in the supplied backend, so this must fetch the
 * stored salt and hash into the browser to compare them. That is weaker
 * than the staff flow, where the hash never leaves the server. The proper
 * fix is a server-side /login for Patrons, which means editing
 * auth/server.js — a course-supplied file. Identify the limitation rather
 * than presenting this as secure.
 *
 * @returns {Promise<import("./schema").Patron|null>} null when invalid
 */
export async function verifyPatronCredentials(email, password) {
  const patron = await findPatronByEmail(email);
  if (!patron) return null;
  if (!patron.Salt || !patron.HashPW) return null;

  const attempt = await hashPassword(patron.Salt, password);
  if (!compareHash(attempt, patron.HashPW)) return null;

  // Never let credential material escape this function.
  const { Salt: _s, HashPW: _h, ...safe } = patron;
  return safe;
}

export function getPatronById(userId) {
  return getRow(TABLES.PATRONS, userId);
}

export function getPatrons({ limit = 25, offset = 0 } = {}) {
  return listRows(TABLES.PATRONS, { sort: "Name", limit, offset });
}

/**
 * Update a customer profile. Requires an auth cookie.
 * Salt and HashPW are stripped — use changePatronPassword() instead.
 */
export async function updatePatron(userId, changes) {
  const { Salt: _s, HashPW: _h, ...safe } = changes;

  if (safe.Email) {
    safe.Email = safe.Email.trim().toLowerCase();
    const existing = await findPatronByEmail(safe.Email);
    if (existing && Number(existing.UserID) !== Number(userId)) {
      const error = new Error("This email is already in use.");
      error.fieldErrors = { Email: "This email is already in use." };
      throw error;
    }
  }
  if (safe.Name) safe.Name = safe.Name.trim();

  return updateRow(TABLES.PATRONS, userId, safe);
}

/** Change a customer's password. Requires an auth cookie. */
export async function changePatronPassword(userId, newPassword) {
  if (!newPassword || newPassword.length < 6) {
    throw new Error("Password must be at least 6 characters.");
  }
  const salt = generateSalt();
  const hashPW = await hashPassword(salt, newPassword);
  return updateRow(TABLES.PATRONS, userId, { Salt: salt, HashPW: hashPW });
}

export function deletePatron(userId) {
  return deleteRow(TABLES.PATRONS, userId);
}

/* ---------------- Staff accounts (User table) ---------------- */
/*
 * GET requires a login cookie; POST/PATCH/DELETE require IsAdmin.
 * Row IDs are UserName, because that is the primary key.
 */

/** List staff accounts. Requires a login cookie. */
export function getStaffUsers({ limit = 25, offset = 0 } = {}) {
  return listRows(TABLES.USER, {
    fields: "UserID,UserName,Name,Email,IsAdmin",
    sort: "UserName",
    limit,
    offset,
  });
}

/**
 * Read one staff account.
 * @param {string} userName the PRIMARY KEY — not UserID
 */
export function getStaffUserByUsername(userName) {
  return getRow(TABLES.USER, userName);
}

/**
 * Create a staff account. Requires an ADMIN cookie.
 * @param {{UserName:string, Name:string, Email:string, password:string, IsAdmin?:boolean}} input
 */
export async function createStaffUser(input) {
  validatePatron({ Name: input.Name, Email: input.Email, password: input.password });

  const userName = String(input.UserName ?? "").trim();
  if (userName.length < 3) throw new Error("Username must be at least 3 characters.");
  if (userName.length > 50) throw new Error("Username must be 50 characters or fewer.");

  // UserName is the PK, so a duplicate would be a hard database error.
  try {
    const existing = await getStaffUserByUsername(userName);
    if (existing) {
      const error = new Error("That username is already taken.");
      error.fieldErrors = { UserName: "That username is already taken." };
      throw error;
    }
  } catch (error) {
    if (!(error instanceof ApiError && error.isNotFound)) {
      if (error.fieldErrors) throw error;
    }
  }

  const salt = generateSalt();
  const hashPW = await hashPassword(salt, input.password);

  return createRow(TABLES.USER, {
    UserName: userName,
    Name: input.Name.trim(),
    Email: input.Email.trim().toLowerCase(),
    IsAdmin: Boolean(input.IsAdmin),
    Salt: salt,
    HashPW: hashPW,
  });
}

/**
 * Update a staff account. Requires an ADMIN cookie.
 * UserName cannot be changed — it is the primary key and is referenced
 * by Product.LastUpdatedBy.
 */
export function updateStaffUser(userName, changes) {
  const { Salt: _s, HashPW: _h, UserName: _u, ...safe } = changes;
  return updateRow(TABLES.USER, userName, safe);
}

/** Change a staff password. Requires an ADMIN cookie. */
export async function changeStaffPassword(userName, newPassword) {
  if (!newPassword || newPassword.length < 6) {
    throw new Error("Password must be at least 6 characters.");
  }
  const salt = generateSalt();
  const hashPW = await hashPassword(salt, newPassword);
  return updateRow(TABLES.USER, userName, { Salt: salt, HashPW: hashPW });
}

/**
 * Delete a staff account. Requires an ADMIN cookie.
 * Will fail if the user is referenced by Product.LastUpdatedBy.
 */
export function deleteStaffUser(userName) {
  return deleteRow(TABLES.USER, userName);
}
