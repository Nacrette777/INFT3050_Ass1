const BASE_URL = import.meta.env.VITE_NOCODB_BASE_URL?.replace(
  /\/+$/,
  ""
);
const BASE_ID = import.meta.env.VITE_NOCODB_BASE_ID;
const TOKEN = import.meta.env.VITE_NOCODB_TOKEN;

const TABLES = {
  users: import.meta.env.VITE_NOCODB_USERS_TABLE_ID,
  products: import.meta.env.VITE_NOCODB_PRODUCTS_TABLE_ID,
};

function assertConfigured(tableId) {
  if (!BASE_URL || !BASE_ID || !TOKEN || !tableId) {
    throw new Error("NocoDB is not configured. Add the required values to .env.local.");
  }
}

async function getTableRows(tableId, { fields, limit = 100 } = {}) {
  assertConfigured(tableId);

  const params = new URLSearchParams({ limit: String(limit) });
  if (fields) params.set("fields", fields);

  const response = await fetch(
    `${BASE_URL}/api/v1/db/data/noco/${BASE_ID}/${tableId}?${params}`,
    {
      headers: {
        "Content-Type": "application/json",
        "xc-token": TOKEN,
      },
    }
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("NocoDB authentication failed. Check VITE_NOCODB_TOKEN in .env.local.");
    }

    if (response.status === 403) {
      throw new Error("NocoDB denied access. Check the API token permissions.");
    }

    let message = `NocoDB request failed (${response.status})`;
    try {
      const body = await response.json();
      message = body.msg || body.message || message;
    } catch {
      // Keep the status-based message when the response is not JSON.
    }
    throw new Error(message);
  }

  return response.json();
}

export function getEmployeeProducts() {
  return getTableRows(TABLES.products, {
    fields: "Id,Title,Author,Genre,Price,Published",
  });
}

export function getEmployeeUsers() {
  return getTableRows(TABLES.users, {
    fields: "Id,UserName,Name,Email,isAdmin,Status",
  });
}
