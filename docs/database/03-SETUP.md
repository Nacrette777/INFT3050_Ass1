# Deliverable 4 — Installation & Configuration

## 1. Start the backend

```bash
unzip inft3050_2025_v1.zip
cd inft3050_2025_v1
docker compose up -d
```

Wait for three containers to go green in Docker Desktop: `db-1`, `noco-1`, `auth`.

Verify:
```bash
curl http://localhost:3001/api/inft3050/Genre
# → {"list":[{"GenreID":1,"Name":"Books"}, ...]}
```

## 2. ⚠️ Set the Vite port to 3000

`compose.yml` line 46: `CORS_ORIGINS=http://localhost:3000`

Vite defaults to **5173**, which the server rejects. Every request will fail
with a CORS error until you fix this.

`vite.config.js`:
```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { port: 3000, strictPort: true },   // ← required
})
```

> `vite.config.js` is a shared file. Confirm with your team lead before committing.

## 3. Environment variables

Create `.env.local` in the project root:

```
VITE_API_BASE_URL=http://localhost:3001
```

Add to `.gitignore`:
```
.env.local
.env
node_modules
dist
```

### Do NOT put the NocoDB token in .env

Anything prefixed `VITE_` is compiled into the JS bundle and readable in DevTools.
The `auth` container already injects `xc-token` server-side (`compose.yml` line 43),
so the browser never needs it.

If you find `VITE_NOCODB_TOKEN` in the existing `nocoDbService.js`, that is a
security problem worth raising — it leaks the API token and bypasses the auth proxy.

## 4. npm packages

**None required.** The data access layer uses the built-in `fetch` and Web Crypto APIs.

The lab notes suggest axios. It is optional — `fetch` handles cookies and JSON
without a dependency. If your team standardises on axios:

```bash
npm install axios
```

then set `withCredentials: true` on every request, or the auth cookie will not be sent.

## 5. File placement

```
src/services/
├── apiClient.js        core HTTP + error handling
├── schema.js           table names, validation, hashing, money helpers
├── productService.js   Product, Genre, Source, Stocktake
├── orderService.js     TO, Orders, ProductsInOrders, checkout
└── accountService.js   login, Patrons, User
```

## 6. Test the connection

```jsx
import { useEffect, useState } from "react";
import { getProducts, attachPricing } from "./services/productService";

function ConnectionTest() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    getProducts({ limit: 5 })
      .then(({ list }) => attachPricing(list))
      .then(setRows)
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <p style={{ color: "crimson" }}>{error}</p>;

  return (
    <ul>
      {rows.map((p) => (
        <li key={p.ID}>
          {p.Name} — {p.price ? `$${p.price.toFixed(2)}` : "unavailable"}
        </li>
      ))}
    </ul>
  );
}
```

## 7. Sign in

After running `seed-test-data.sql`:

| Type | Username | Password |
|---|---|---|
| Admin | `devadmin` | `Admin123!` |
| Staff | `devstaff` | `Staff123!` |
| Customer | `alice@test.com` | `Test123!` |

```js
import { loginStaff } from "./services/accountService";
import { verifyPatronCredentials } from "./services/accountService";

await loginStaff("devadmin", "Admin123!");            // sets httpOnly cookie
const patron = await verifyPatronCredentials("alice@test.com", "Test123!");
```

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| CORS error | Vite on 5173 | Set port to 3000 (§2) |
| 401 on POST/PATCH | No auth cookie | Call `loginStaff()` first |
| 403 on User writes | Not an admin | Sign in as `devadmin` |
| `Cannot reach the server` | Docker down | `docker compose up -d` |
| Field is `undefined` | Wrong column name | Use the API name — see §"Column names" in 01-SCHEMA-DESIGN.md |
| `crypto.subtle is undefined` | Not a secure context | Use `http://localhost`, not an IP address |
| Cannot update one order line | Table has no PK | Delete all lines for the order and re-insert (see 01-SCHEMA-DESIGN.md §11) |
