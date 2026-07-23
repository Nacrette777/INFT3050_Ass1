/**
 * check-backend.mjs — verify the database backend before you start coding
 * ---------------------------------------------------------------
 * Touches no React code and no routes. Run it from the project root:
 *
 *     node scripts/check-backend.mjs
 *
 * It confirms Docker is up, the API answers, the expected tables exist,
 * and reports whether the ProductsInOrders endpoint is reachable.
 * ---------------------------------------------------------------
 */

const BASE = process.env.VITE_API_BASE_URL || "http://localhost:3001";

const EXPECTED_TABLES = [
  "Genre",
  "BookGenre",
  "MovieGenre",
  "GameGenre",
  "Product",
  "Source",
  "Stocktake",
  "Patrons",
  "Orders",
  "TO",
];

const green = (s) => `\x1b[32m${s}\x1b[0m`;
const red = (s) => `\x1b[31m${s}\x1b[0m`;
const yellow = (s) => `\x1b[33m${s}\x1b[0m`;
const dim = (s) => `\x1b[2m${s}\x1b[0m`;

let failures = 0;

async function get(path) {
  const res = await fetch(BASE + path, { headers: { Accept: "application/json" } });
  const text = await res.text();
  let body = null;
  try {
    body = JSON.parse(text);
  } catch {
    /* non-JSON response */
  }
  return { status: res.status, ok: res.ok, body };
}

console.log(`\nChecking backend at ${dim(BASE)}\n`);

/* 1. Is the server reachable? */
try {
  await get("/api/inft3050/Genre");
} catch (err) {
  console.log(red("✗ Cannot reach the server."));
  console.log(dim(`  ${err.message}`));
  console.log(dim("  Run: docker compose up -d   (in the inft3050_2025_v1 folder)"));
  console.log(dim("  Then wait for db-1, noco-1 and auth to all go green.\n"));
  process.exit(1);
}
console.log(green("✓ Server is reachable"));

/* 2. Seed data present? */
const genre = await get("/api/inft3050/Genre");
const genres = genre.body?.list ?? [];
if (genres.length === 3) {
  console.log(green("✓ Genre table seeded"), dim(`(${genres.map((g) => g.Name).join(", ")})`));
} else {
  failures += 1;
  console.log(red(`✗ Genre table has ${genres.length} rows, expected 3`));
}

/* 3. Every expected table answers */
console.log("\nTables:");
for (const table of EXPECTED_TABLES) {
  const res = await get(`/api/inft3050/${encodeURIComponent(table)}?limit=1`);
  if (res.ok) {
    const count = await get(`/api/inft3050/${encodeURIComponent(table)}/count`);
    const n = count.body?.count ?? "?";
    console.log(`  ${green("✓")} ${table.padEnd(12)} ${dim(`${n} rows`)}`);
  } else {
    failures += 1;
    console.log(`  ${red("✗")} ${table.padEnd(12)} ${dim(`HTTP ${res.status}`)}`);
  }
}

/* 4. ProductsInOrders — expected to be missing */
const pio = await get("/api/inft3050/ProductsInOrders?limit=1");
console.log("");
if (pio.ok) {
  console.log(green("✓ ProductsInOrders is reachable"), dim("— order line items can be saved"));
} else {
  console.log(yellow("! ProductsInOrders is NOT reachable"), dim(`(HTTP ${pio.status})`));
  console.log(
    dim("  The table has no primary key, which NocoDB requires to expose it.")
  );
  console.log(
    dim("  Orders can be created, but their line items cannot be saved via the API.")
  );
  console.log(dim("  Raise this with your tutor before building checkout."));
}

/* 5. Auth endpoint responds */
const loginProbe = await fetch(`${BASE}/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ username: "__probe__", password: "__probe__" }),
});
console.log("");
if (loginProbe.status === 401) {
  console.log(green("✓ Auth endpoint is working"), dim("(rejected a bad password, as expected)"));
} else {
  failures += 1;
  console.log(red(`✗ Auth endpoint returned ${loginProbe.status}, expected 401`));
}

/* Summary */
console.log("");
if (failures === 0) {
  console.log(green("All checks passed.\n"));
} else {
  console.log(red(`${failures} check(s) failed.\n`));
  process.exit(1);
}
