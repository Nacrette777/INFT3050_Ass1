# Deliverable 1 — Database Schema Design

**Database**: `StoreDB` · Microsoft SQL Server 2022
**Source of truth**: `scripted_db.sql` (course-supplied DDL), `Database_ER_drawio_V02`, `DatabaseDictionary_V02.xlsx`
**Access layer**: NocoDB REST API behind an auth proxy at `http://localhost:3001`

> The schema is supplied by the course and must not be modified. This document
> records it accurately so the front-end team can build against it.

---

## ⚠️ Column names: database vs API

NocoDB renames columns when it exposes them. **Always use the API column name in
JavaScript** — the DDL name will return `undefined`.

| Table | DDL column | API column |
|---|---|---|
| Genre | `genreID` | `GenreID` |
| Book_genre | `subGenreID` | `SubGenreID` |
| Source | `sourceid` / `Source_name` / `externalLink` | `Sourceid` / `SourceName` / `ExternalLink` |
| Product | `subGenre` | `SubGenre` |
| TO | `customerID` | `CustomerID` |
| Orders | `customer` | `Customer` |
| User | `isAdmin` | `IsAdmin` |
| Patrons | `HashPW` | `HashPW` |

Table names are also remapped: `Book_genre` → `BookGenre`, `Movie_genre` → `MovieGenre`,
`Game_genre` → `GameGenre`, `Book_genre NEW` → `BookGenre new`.

---

## 1. `Product` — catalogue items

Stores products listed on the site. One title may appear once here but have several
`Stocktake` rows (hard copy, audiobook, streaming…).

| Field | Type | Length | Required | Default | Key | Description |
|---|---|---|---|---|---|---|
| ID | int IDENTITY(1,1) | — | Yes | auto | **PK** | |
| Name | nvarchar | 255 | No* | NULL | | Product title |
| Author | nvarchar | 255 | No | NULL | | Author / studio / director |
| Description | nvarchar | MAX | No | NULL | | Long description |
| Genre | int | — | No* | NULL | **FK** → `Genre.genreID` | |
| SubGenre | int | — | No | NULL | **FK** → `Book/Movie/Game_genre.subGenreID` | Which table depends on `Genre` |
| Published | date | — | No | NULL | | First release date |
| LastUpdatedBy | nvarchar | 50 | No | NULL | **FK** → `User.UserName` | ⚠️ must be a real username |
| LastUpdated | datetime | — | No | NULL | | Last edit timestamp |

\* The DDL allows NULL, but the data dictionary marks `Genre` as *not null* and the
business rules require `Name`. Enforce both in the application layer.

**Note on `SubGenre`**: this is a *polymorphic* FK with no database-level constraint.
The application must pick the right lookup table from `Genre` (1→Book, 2→Movie, 3→Game).

---

## 2. `Genre` — top-level category

| Field | Type | Length | Required | Default | Key |
|---|---|---|---|---|---|
| GenreID | int | — | Yes | manual | **PK** |
| Name | nvarchar | 50 | No | NULL | |

Fixed values: `1 = Books`, `2 = Movies`, `3 = Games`.
Not an IDENTITY column — IDs are assigned manually.

---

## 3. `BookGenre` / `MovieGenre` / `GameGenre` — sub-genres

Three structurally identical lookup tables.

| Field | Type | Length | Required | Default | Key |
|---|---|---|---|---|---|
| SubGenreID | int IDENTITY(1,1) | — | Yes | auto | **PK** |
| Name | nvarchar | 50 | No | NULL | |

---

## 4. `BookGenre new` — legacy table, do not use

The data dictionary describes it as a leftover temporary table that was never cleaned up.
It is exposed by the API but has no place in the application. Ignore it.

---

## 5. `Source` — where a product can be obtained

| Field | Type | Length | Required | Default | Key |
|---|---|---|---|---|---|
| Sourceid | int IDENTITY(1,1) | — | Yes | auto | **PK** |
| SourceName | nvarchar | MAX | No | NULL | |
| ExternalLink | nvarchar | MAX | No | NULL | URL, NULL when internal |
| Genre | int | — | No | NULL | **FK** → `Genre.genreID` |

Seeded values: 1 Hard copy book, 2 Audible, 3 Steam, 4 Prime Video, 5 DVD, 6 VHS,
7 Hard copy audiobook, 8 Hard copy game.

---

## 6. `Stocktake` — inventory and pricing

**Price lives here, not on `Product`.** Any screen showing a price must join these two.

| Field | Type | Length | Required | Default | Key |
|---|---|---|---|---|---|
| ItemId | int IDENTITY(1,1) | — | Yes | auto | **PK** |
| SourceId | int | — | No | NULL | **FK** → `Source.sourceid` |
| ProductId | int | — | No | NULL | **FK** → `Product.ID` |
| Quantity | int | — | No | NULL | Stock on hand; 100 for streaming |
| Price | float | — | No | NULL | ⚠️ `float`, not `decimal` |

> `float` is a binary approximation, so money arithmetic can drift
> (`0.1 + 0.2 !== 0.3`). Round to 2 dp at the point of display and compute
> totals in cents where possible. Mention this limitation in your report — it is
> a schema flaw worth identifying.

---

## 7. `Patrons` — customer accounts

Customers who register so they can view their orders. **Email is the username.**

| Field | Type | Length | Required | Default | Key |
|---|---|---|---|---|---|
| UserID | int IDENTITY(1,1) | — | Yes | auto | **PK** |
| Email | nvarchar | 255 | No* | NULL | Login identifier |
| Name | nvarchar | 255 | No | NULL | |
| Salt | varchar | 32 | No | NULL | 32 random hex digits |
| HashPW | varchar | 64 | No | NULL | `SHA256(Salt + password)` hex |

\* No UNIQUE constraint exists on `Email` — the application must check for duplicates
before inserting.

---

## 8. `User` — staff and administrators

| Field | Type | Length | Required | Default | Key |
|---|---|---|---|---|---|
| UserID | int IDENTITY(1,1) | — | Yes | auto | |
| UserName | nvarchar | 50 | **Yes** | — | **PK** ⚠️ |
| Email | nvarchar | 255 | No | NULL | |
| Name | nvarchar | 255 | No | NULL | |
| IsAdmin | bit | — | No | NULL | 1 = administrator |
| Salt | varchar | 32 | No | NULL | |
| HashPW | varchar | 64 | No | NULL | `SHA256(Salt + password)` hex |

> **The primary key is `UserName`, not `UserID`.** `UserID` is an IDENTITY column but
> is *not* the key. Consequences:
> - REST calls address rows by username: `GET /api/inft3050/User/storeManager`
> - `Product.LastUpdatedBy` is an FK to `UserName`, so it must contain a real username

---

## 9. `TO` — transaction / customer details for an order

| Field | Type | Length | Required | Default | Key |
|---|---|---|---|---|---|
| CustomerID | int IDENTITY(1,1) | — | Yes | auto | **PK** |
| PatronId | int | — | No | NULL | **FK** → `Patrons.UserID`; NULL = guest checkout |
| Email | nvarchar | 255 | **Yes** | — | Only NOT NULL column in the table |
| PhoneNumber | nvarchar | 50 | No | NULL | |
| StreetAddress | nvarchar | 255 | No | NULL | Billing address |
| PostCode | int | — | No | NULL | |
| Suburb | nvarchar | 50 | No | NULL | |
| State | nvarchar | 50 | No | NULL | |
| CardNumber | nvarchar | 50 | No | NULL | ⚠️ stored in plain text |
| CardOwner | nvarchar | 50 | No | NULL | |
| Expiry | varchar | 5 | No | NULL | `MM/YY` |
| CVV | int | — | No | NULL | ⚠️ storing CVV violates PCI-DSS |

> **Security finding for your report**: the schema stores full card numbers and CVVs
> unencrypted. Real payment systems must never retain a CVV after authorisation.
> Do not "fix" the schema — identify it as a limitation and mask the values in the UI.

---

## 10. `Orders` — order header (delivery address)

| Field | Type | Length | Required | Default | Key |
|---|---|---|---|---|---|
| OrderID | int IDENTITY(1,1) | — | Yes | auto | **PK** |
| Customer | int | — | No | NULL | **FK** → `TO.customerID` |
| StreetAddress | nvarchar | 255 | No | NULL | Delivery address |
| PostCode | int | — | No | NULL | |
| Suburb | nvarchar | 255 | No | NULL | |
| State | nvarchar | 50 | No | NULL | |

Billing address lives on `TO`; delivery address lives here. They can differ.

---

## 11. `ProductsInOrders` — order line items

| Field | Type | Length | Required | Default | Key |
|---|---|---|---|---|---|
| OrderId | int | — | No | NULL | **FK** → `Orders.OrderID` |
| ProduktId | int | — | No | NULL | **FK** → `Stocktake.ItemId` ⚠️ |
| Quantity | int | — | No | NULL | |

Two things to note:

1. **It links to `Stocktake.ItemId`, not `Product.ID`.** A line item is a specific
   *edition at a specific price*, not an abstract product. This is correct design —
   it captures which format the customer actually bought.
2. **The table has no primary key.** It does not appear in the supplied Postman
   collection, which initially suggested NocoDB might not expose it.

   **Verified against a live instance: the endpoint works.**
   `GET http://localhost:3001/api/inft3050/ProductsInOrders` returns rows, so order
   line items can be read and written normally. NocoDB assigns its own internal row
   identifier for keyless tables.

   One consequence remains: because there is no natural primary key, updating or
   deleting an individual line by business key is unreliable. Prefer deleting all
   lines for an order and re-inserting them, rather than patching a single row.

---

## 12. Entity relationships

```
Genre ──1:N──> Product ──N:1──> User (LastUpdatedBy → UserName)
  │              │
  │              └──1:N──> Stocktake ──N:1──> Source
  │                            │                 │
  └────────────────────────────│──────1:N────────┘
                               │
                               └──1:N──> ProductsInOrders ──N:1──> Orders
                                                                     │
Patrons ──1:N──> TO ──1:N──> Orders ─────────────────────────────────┘

BookGenre / MovieGenre / GameGenre  ← Product.SubGenre (polymorphic, no FK constraint)
BookGenre new                        ← legacy, unused
```

**Cardinality summary**

| Relationship | Type | Enforced |
|---|---|---|
| Genre → Product | 1:N | FK |
| Product → Stocktake | 1:N | FK |
| Source → Stocktake | 1:N | FK |
| Genre → Source | 1:N | FK |
| User → Product (LastUpdatedBy) | 1:N | FK |
| Patrons → TO | 1:N | FK (nullable = guest checkout) |
| TO → Orders | 1:N | FK |
| Orders → ProductsInOrders | 1:N | FK |
| Stocktake → ProductsInOrders | 1:N | FK |
| Product → SubGenre tables | N:1 | **Application only** |

---

## 13. Normalisation assessment

The schema is in **Third Normal Form**, with two observations worth writing up:

- **Address duplication** between `TO` (billing) and `Orders` (delivery) is
  intentional denormalisation. It snapshots the address at purchase time, so later
  edits to a customer's profile do not rewrite historical orders. This is correct.
- **`Product.SubGenre`** is a polymorphic reference with no FK constraint. The
  database cannot stop a movie being given a book sub-genre. Validation must happen
  in the application. This is a genuine weakness — a single `SubGenre` table with a
  `GenreID` column would have been enforceable.

---

## 14. API access control

Defined in `auth/server.js` (course-supplied), not in the database:

| Table | GET | POST / PATCH / DELETE |
|---|---|---|
| `User` | authenticated | **admin only** |
| everything else | **public** | authenticated |

Authentication is a **httpOnly cookie** named `token`, issued by `POST /login`.
Every browser request therefore needs `credentials: "include"`.

`POST /login` queries the `User` table only — **`Patrons` cannot log in through it.**
See `docs/03-SETUP.md` for how the data layer handles that gap.
