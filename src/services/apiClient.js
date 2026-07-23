/**
 * apiClient.js — core HTTP layer for the INFT3050 backend
 * ---------------------------------------------------------------
 * All traffic goes through the auth proxy on port 3001, never to
 * NocoDB (8080) directly. The proxy injects the xc-token header
 * server-side, so the API token is never exposed to the browser.
 *
 * Authentication is a httpOnly cookie named "token", issued by
 * POST /login. Every request must send credentials: "include" or
 * writes will fail with 401.
 * ---------------------------------------------------------------
 */

/**
 * Empty by default, which means requests go to the current origin and are
 * forwarded by the Vite dev proxy (see vite.config.js). That keeps every
 * call same-origin, so the backend's missing CORS headers on /api/* stop
 * mattering. Set VITE_API_BASE_URL only if you need to bypass the proxy.
 */
const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/+$/, "");

/** HTTP error carrying the status code so callers can branch on it. */
export class ApiError extends Error {
  constructor(message, status, details = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
  get isAuthError() { return this.status === 401; }
  get isForbidden() { return this.status === 403; }
  get isNotFound() { return this.status === 404; }
  get isNetworkError() { return this.status === 0; }
}

async function toApiError(response) {
  let message = `Request failed (${response.status})`;
  let details = null;
  try {
    const body = await response.json();
    details = body;
    message = body.error || body.msg || body.message || message;
  } catch {
    /* body was not JSON — keep the status-based message */
  }
  if (response.status === 401) message = "You need to sign in to do that.";
  if (response.status === 403) message = "You do not have permission to do that.";
  return new ApiError(message, response.status, details);
}

/**
 * Low-level request helper.
 * @param {string} path e.g. "/api/inft3050/Product"
 * @param {{method?:string, body?:object, params?:object, signal?:AbortSignal}} [options]
 */
export async function request(path, options = {}) {
  const { method = "GET", body, params, signal } = options;

  // The second argument lets BASE_URL be empty (relative, via the proxy).
  // If BASE_URL is absolute it wins and the base is ignored.
  const url = new URL(BASE_URL + path, window.location.origin);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  }

  let response;
  try {
    response = await fetch(url.toString(), {
      method,
      credentials: "include",
      headers: {
        Accept: "application/json",
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal,
    });
  } catch (err) {
    if (err.name === "AbortError") throw err;
    throw new ApiError(
      "Cannot reach the server. Check Docker is running (docker compose up -d) " +
        "and restart the dev server so the Vite proxy loads.",
      0,
      err
    );
  }

  if (!response.ok) throw await toApiError(response);
  if (response.status === 204) return null;

  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    throw new ApiError("Server returned malformed JSON.", response.status);
  }
}

/* ---------------- Generic table operations ---------------- */

const tablePath = (name) => `/api/inft3050/${encodeURIComponent(name)}`;

/**
 * List rows with optional filter / sort / paging.
 * @returns {Promise<{list: object[], pageInfo: object}>}
 */
export async function listRows(tableName, query = {}) {
  const data = await request(tablePath(tableName), { params: query });
  if (Array.isArray(data)) return { list: data, pageInfo: {} };
  return { list: data?.list ?? [], pageInfo: data?.pageInfo ?? {} };
}

/** Fetch every page. Use sparingly — prefer paging in the UI. */
export async function listAllRows(tableName, query = {}, pageSize = 200) {
  const all = [];
  let offset = 0;
  for (;;) {
    const { list, pageInfo } = await listRows(tableName, { ...query, limit: pageSize, offset });
    all.push(...list);
    if (pageInfo?.isLastPage || list.length < pageSize) break;
    offset += pageSize;
    if (offset > 10000) break; // safety stop
  }
  return all;
}

/**
 * Read one row by primary key.
 * NOTE: for the User table the PK is UserName, not UserID.
 */
export function getRow(tableName, rowId) {
  return request(`${tablePath(tableName)}/${encodeURIComponent(rowId)}`);
}

export async function countRows(tableName, where) {
  const data = await request(`${tablePath(tableName)}/count`, {
    params: where ? { where } : undefined,
  });
  return data?.count ?? 0;
}

/** Create a row. Requires an auth cookie. */
export function createRow(tableName, payload) {
  return request(tablePath(tableName), { method: "POST", body: payload });
}

/** Update a row. Requires an auth cookie. */
export function updateRow(tableName, rowId, payload) {
  return request(`${tablePath(tableName)}/${encodeURIComponent(rowId)}`, {
    method: "PATCH",
    body: payload,
  });
}

/** Delete a row. Requires an auth cookie. */
export function deleteRow(tableName, rowId) {
  return request(`${tablePath(tableName)}/${encodeURIComponent(rowId)}`, {
    method: "DELETE",
  });
}

/* ---------------- NocoDB where-clause builder ---------------- */

/**
 * Build a NocoDB filter string.
 * @param {Array<[string,string,string|number]>} conditions
 * @param {"and"|"or"} [join="and"]
 * @example buildWhere([["Genre","eq",1],["Name","like","%dune%"]])
 *          → "(Genre,eq,1)~and(Name,like,%dune%)"
 */
export function buildWhere(conditions, join = "and") {
  if (!Array.isArray(conditions) || conditions.length === 0) return undefined;
  return conditions
    .filter(Boolean)
    .map(([field, op, value]) => `(${field},${op},${value})`)
    .join(`~${join}`);
}
