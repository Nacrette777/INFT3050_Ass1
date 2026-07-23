# Deliverable 2 — Seed / Test Data

## Part A — Data already in StoreDB

`scripted_db.sql` ships with **864 INSERT statements**. The database is fully populated
the moment `docker compose up -d` succeeds. You do not need to seed it.

> The `.mdf` files inside `inft3050_2025_v1.zip` are a slightly **newer snapshot** than
> `scripted_db.sql`, so live row counts differ a little (verified: Product 300,
> Stocktake 478, BookGenre 10, MovieGenre 8, GameGenre 14). Treat the running
> database as authoritative and the SQL script as a schema reference.

| Table | Rows | Notes |
|---|---|---|
| Product | 302 | Real book/movie/game titles with descriptions |
| Stocktake | 480 | Multiple formats per product, with prices |
| BookGenre | 9 | Fiction, Historical Fiction, Fantasy/Sci-Fi, Young Adult, Humour, Crime, Mystery, Romance, Thriller |
| MovieGenre / GameGenre | ~7 each | RPG, Puzzle, Strategy, Platform, Action-adventure, Racing… |
| Genre | 3 | 1 Books, 2 Movies, 3 Games |
| Source | 8 | Hard copy book, Audible, Steam, Prime Video, DVD, VHS, Hard copy audiobook, Hard copy game |
| User | 4 | 2 admins, 2 non-admins |
| Patrons | 1 | Jane Citizen |
| TO | 2 | One linked patron, one guest |
| Orders | 2 | |
| ProductsInOrders | 6 | 3 lines each on orders 3 and 4 |
| BookGenre new | 7 | Legacy table — ignore |

### Existing accounts

| UserName | Name | IsAdmin | Email |
|---|---|---|---|
| `adminAccount` | Steve Smith | **1** | — |
| `storeManager` | Bob Manager | **1** | bob@thisemail.com |
| `queenOS` | Silvia | 0 | silvia.queen@nomail.com |
| `svennis` | Sven-Göran Eriksson | 0 | sven.g.eriksson@nomail.com |

| Patron | Email |
|---|---|
| Jane Citizen | jane.l.j.citizen@somemail.com |

> Passwords are stored as `SHA256(Salt + password)` and the plaintexts were not
> supplied. To sign in during development, create your own account with a known
> password using the script in Part B, or register a patron through your UI.

---

## Part B — Additional test data

Run against `StoreDB` in Azure Data Studio, SSMS, or via
`docker exec -i <db-container> /opt/mssql-tools18/bin/sqlcmd -C -S localhost -U sa -P inft3050_ -d StoreDB -i seed-test-data.sql`

See `seed-test-data.sql` in this folder. It adds:

- 2 staff accounts with **known passwords** so you can actually log in
- 3 patrons with known passwords
- 3 products across all three genres
- 5 stocktake rows
- 2 complete orders with line items

### Pre-computed credentials

The hashes below are real `SHA256(salt + password)` values — they will authenticate.

| Type | Username / Email | Password | Role |
|---|---|---|---|
| Staff | `devadmin` | `Admin123!` | admin |
| Staff | `devstaff` | `Staff123!` | employee |
| Patron | `alice@test.com` | `Test123!` | customer |
| Patron | `bob@test.com` | `Test123!` | customer |
| Patron | `carol@test.com` | `Test123!` | customer |

---

## Part C — Generating your own hashes

The backend verifies with
`crypto.createHash("sha256").update(salt + password).digest("hex")`.
To add more accounts, generate a matching pair:

```js
// Node.js
import crypto from "crypto";

const salt = crypto.randomBytes(16).toString("hex");          // 32 hex chars
const hash = crypto.createHash("sha256")
                   .update(salt + "YourPassword", "utf8")
                   .digest("hex");                             // 64 hex chars

console.log({ salt, hash });
```

The browser equivalent used by the data access layer is `hashPassword()` in
`src/services/schema.js`, which produces byte-identical output via Web Crypto.

---

## Part D — Test data as JSON

For unit tests or Storybook fixtures, without touching the database:

```json
{
  "products": [
    { "ID": 9001, "Name": "The Silent Archive", "Author": "M. Rothwell",
      "Genre": 1, "SubGenre": 7, "Published": "2019-04-12",
      "LastUpdatedBy": "storeManager" },
    { "ID": 9002, "Name": "Harbour Lights", "Author": "Ines Duarte",
      "Genre": 2, "SubGenre": 3, "Published": "2021-11-05",
      "LastUpdatedBy": "storeManager" },
    { "ID": 9003, "Name": "Fracture Point", "Author": "Northwind Studios",
      "Genre": 3, "SubGenre": 6, "Published": "2023-06-30",
      "LastUpdatedBy": "devadmin" }
  ],
  "stocktake": [
    { "ItemId": 9101, "ProductId": 9001, "SourceId": 1, "Quantity": 24, "Price": 32.95 },
    { "ItemId": 9102, "ProductId": 9001, "SourceId": 2, "Quantity": 100, "Price": 18.5 },
    { "ItemId": 9103, "ProductId": 9002, "SourceId": 4, "Quantity": 100, "Price": 6.99 },
    { "ItemId": 9104, "ProductId": 9002, "SourceId": 5, "Quantity": 12, "Price": 24.0 },
    { "ItemId": 9105, "ProductId": 9003, "SourceId": 3, "Quantity": 100, "Price": 79.95 }
  ],
  "patrons": [
    { "UserID": 9201, "Name": "Alice Nguyen", "Email": "alice@test.com" },
    { "UserID": 9202, "Name": "Bob Tran",     "Email": "bob@test.com" },
    { "UserID": 9203, "Name": "Carol White",  "Email": "carol@test.com" }
  ],
  "orders": [
    { "OrderID": 9301, "Customer": 9401, "StreetAddress": "12 Wattle St",
      "PostCode": 2000, "Suburb": "Sydney", "State": "NSW" },
    { "OrderID": 9302, "Customer": 9402, "StreetAddress": "88 Rundle Mall",
      "PostCode": 5000, "Suburb": "Adelaide", "State": "SA" }
  ]
}
```
