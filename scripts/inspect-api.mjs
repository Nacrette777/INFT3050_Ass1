/**
 * inspect-api.mjs — print the ACTUAL field names the API returns
 * ---------------------------------------------------------------
 * NocoDB renames columns and may turn foreign keys into nested objects.
 * Rather than guessing, this dumps one real row from each table plus a
 * few targeted checks, so the data layer can be matched to reality.
 *
 * Run from the project root:
 *     node scripts/inspect-api.mjs
 * ---------------------------------------------------------------
 */

const BASE = process.env.VITE_API_BASE_URL || "http://localhost:3001";

const dim = (s) => `\x1b[2m${s}\x1b[0m`;
const bold = (s) => `\x1b[1m${s}\x1b[0m`;
const red = (s) => `\x1b[31m${s}\x1b[0m`;
const green = (s) => `\x1b[32m${s}\x1b[0m`;

async function get(path) {
  const res = await fetch(BASE + path, { headers: { Accept: "application/json" } });
  const text = await res.text();
  let body = null;
  try {
    body = JSON.parse(text);
  } catch {
    body = text.slice(0, 200);
  }
  return { status: res.status, ok: res.ok, body };
}

function describe(value) {
  if (value === null) return "null";
  if (Array.isArray(value)) return `array[${value.length}]`;
  if (typeof value === "object") return `OBJECT → ${JSON.stringify(value).slice(0, 60)}`;
  return `${typeof value} = ${JSON.stringify(value)}`;
}

console.log(`\n${bold("API field inspection")} ${dim(BASE)}\n`);

/* ---- 1. One row from each key table, with every field listed ---- */
for (const table of ["Genre", "Product", "Stocktake", "BookGenre"]) {
  const res = await get(`/api/inft3050/${table}?limit=1`);
  console.log(bold(`── ${table} ` + "─".repeat(Math.max(0, 40 - table.length))));

  if (!res.ok) {
    console.log(red(`   HTTP ${res.status}`), dim(JSON.stringify(res.body).slice(0, 200)));
    console.log("");
    continue;
  }

  const row = res.body?.list?.[0];
  if (!row) {
    console.log(red("   no rows returned"), dim(JSON.stringify(res.body).slice(0, 200)));
    console.log("");
    continue;
  }

  for (const [key, value] of Object.entries(row)) {
    console.log(`   ${key.padEnd(18)} ${describe(value)}`);
  }
  console.log("");
}

/* ---- 2. Does sorting work? This is a common 400 source ---- */
console.log(bold("── sort / query checks " + "─".repeat(20)));
for (const [label, path] of [
  ["Product sort=Name", "/api/inft3050/Product?limit=1&sort=Name"],
  ["Genre  sort=GenreID", "/api/inft3050/Genre?limit=1&sort=GenreID"],
  ["Product limit=200", "/api/inft3050/Product?limit=200"],
  ["Stocktake limit=500", "/api/inft3050/Stocktake?limit=500"],
]) {
  const res = await get(path);
  const n = res.body?.list?.length ?? 0;
  if (res.ok) {
    console.log(`   ${green("✓")} ${label.padEnd(22)} ${dim(`${n} rows`)}`);
  } else {
    console.log(
      `   ${red("✗")} ${label.padEnd(22)} ${red(`HTTP ${res.status}`)} ` +
        dim(JSON.stringify(res.body).slice(0, 120))
    );
  }
}

/* ---- 3. pageInfo shape, used for paging ---- */
console.log("");
console.log(bold("── pageInfo " + "─".repeat(31)));
const paged = await get("/api/inft3050/Product?limit=200&offset=0");
console.log("   " + JSON.stringify(paged.body?.pageInfo ?? "(missing)"));

/* ---- 4. Are the seeded test accounts present? ---- */
console.log("");
console.log(bold("── test accounts " + "─".repeat(26)));

const patrons = await get("/api/inft3050/Patrons?limit=50");
const emails = (patrons.body?.list ?? []).map((p) => p.Email);
console.log("   Patrons emails: " + (emails.length ? emails.join(", ") : dim("(none)")));

const loginRes = await fetch(`${BASE}/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ username: "devadmin", password: "Admin123!" }),
});
if (loginRes.status === 200) {
  console.log(`   ${green("✓")} devadmin can sign in — seed script has been run`);
} else {
  console.log(
    `   ${red("✗")} devadmin cannot sign in (HTTP ${loginRes.status}) — ` +
      "seed script has NOT been run yet"
  );
}

console.log("");
