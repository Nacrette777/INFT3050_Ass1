/**
 * catalogService.js — adapter between the database and the customer pages
 * ---------------------------------------------------------------
 * The pages were written against src/data/mockProducts.js, which has a
 * flat shape:
 *
 *   { id, name, category, brand, price, rating, stock, description, imageText }
 *
 * The database splits that across three tables (Product, Stocktake, Genre)
 * and uses different column names. Rather than rewriting every page, this
 * module converts database rows into the shape the pages already expect,
 * so the UI, filters, sorting and pagination all keep working unchanged.
 *
 * Field mapping
 *   id          ← Product.ID           (string, so URLs stay consistent)
 *   name        ← Product.Name
 *   category    ← Genre.Name           ("Books" / "Movies" / "Games")
 *   brand       ← Product.Author       (author, studio or director)
 *   price       ← cheapest in-stock Stocktake.Price
 *   stock       ← that row's Stocktake.Quantity
 *   description ← Product.Description
 *   rating      ← 0  (see note below)
 *
 * On ratings: StoreDB has no rating column and no reviews table. The pages
 * already render "No ratings yet" when rating is 0, so this returns 0 rather
 * than inventing numbers. The rating filter will therefore match everything.
 * Worth noting in your report as a gap between the UI design and the schema.
 * ---------------------------------------------------------------
 */

import { listRows, listAllRows, getRow, buildWhere } from "./apiClient";
import { TABLES, SUB_GENRE_TABLE } from "./schema";

/* ---------------- Internal caches ----------------
 * Genres and sub-genres are tiny, fixed lookup tables. Caching them for
 * the page session avoids refetching on every navigation.
 */

let genreCache = null;
let subGenreCache = {};
let genreIndexCache = null;

async function loadGenres() {
  if (!genreCache) {
    const rows = await listAllRows(TABLES.GENRE, { sort: "GenreID" });
    genreCache = new Map(rows.map((g) => [Number(g.GenreID), g.Name]));
  }
  return genreCache;
}

/**
 * Build a productId → genre name index.
 *
 * Why this is needed: NocoDB exposes Product.Genre as a link field, and it
 * comes back as an empty object ({}), not the numeric foreign key. Reading
 * the genre off the product row is therefore impossible. Instead this asks
 * the server for the products in each genre and inverts the result.
 *
 * Cost: three small queries, cached for the session.
 * If the server rejects the filter, every product falls back to "Other"
 * rather than the page failing.
 */
async function loadGenreIndex() {
  if (genreIndexCache) return genreIndexCache;

  const genres = await loadGenres();
  const index = new Map();

  await Promise.all(
    Array.from(genres.entries()).map(async ([genreId, genreName]) => {
      try {
        const rows = await listAllRows(TABLES.PRODUCT, {
          where: `(Genre,eq,${genreId})`,
          fields: "ID",
        });
        for (const row of rows) {
          index.set(Number(row.ID), { id: genreId, name: genreName });
        }
      } catch {
        // Filtering on a link column is not supported — leave these
        // products uncategorised rather than breaking the page.
      }
    })
  );

  genreIndexCache = index;
  return index;
}

async function loadSubGenres(genreId) {
  const key = Number(genreId);
  if (!subGenreCache[key]) {
    const tableName = SUB_GENRE_TABLE[key];
    if (!tableName) return new Map();
    const rows = await listAllRows(tableName, { sort: "Name" });
    subGenreCache[key] = new Map(rows.map((s) => [Number(s.SubGenreID), s.Name]));
  }
  return subGenreCache[key];
}

/** Clear cached lookups — call after an admin edits genres. */
export function clearCatalogCache() {
  genreCache = null;
  subGenreCache = {};
  genreIndexCache = null;
}

/* ---------------- Shape conversion ---------------- */

/**
 * Convert one database product into the flat shape the pages expect.
 * @param {object} row       Product row
 * @param {object|null} stock Cheapest Stocktake row for this product
 * @param {Map} genres       GenreID → name
 * @param {string|null} subGenreName
 */
function toPageProduct(row, stock, genreInfo, subGenreName = null) {
  return {
    id: String(row.ID),
    name: row.Name || "Unnamed Product",
    // row.Genre is a NocoDB link field and arrives as {}, so the genre
    // comes from the index built by loadGenreIndex() instead.
    category: genreInfo?.name || "Other",
    brand: row.Author || "Unknown",
    price: stock ? Number(stock.Price) : 0,
    stock: stock ? Number(stock.Quantity) : 0,
    rating: 0, // StoreDB has no rating data
    description: row.Description || "",
    imageText: row.Name || "Product Image",

    // Extra fields the detail page can use. Harmless to the list page.
    subGenre: subGenreName,
    published: row.Published || null,
    genreId: genreInfo?.id ?? null,
    subGenreId: row.SubGenre ?? null,
    stocktakeItemId: stock ? stock.ItemId : null,
  };
}

/* ---------------- Public API ---------------- */

/**
 * Every product, with price and stock attached, in page-ready shape.
 *
 * Cost: three requests total (products, stock, genres) regardless of how
 * many products there are — not one request per card.
 *
 * @returns {Promise<object[]>}
 */
export async function getCatalogProducts() {
  const [products, genreIndex] = await Promise.all([
    listAllRows(TABLES.PRODUCT, { sort: "Name" }),
    loadGenreIndex(),
  ]);

  if (products.length === 0) return [];

  const stockRows = await listAllRows(TABLES.STOCKTAKE, {}, 500);

  // Keep the cheapest in-stock row per product; fall back to cheapest overall
  // so out-of-stock items still show a price rather than $0.
  const cheapest = new Map();
  for (const s of stockRows) {
    const key = Number(s.ProductId);
    const current = cheapest.get(key);
    if (!current) {
      cheapest.set(key, s);
      continue;
    }
    const currentInStock = Number(current.Quantity) > 0;
    const candidateInStock = Number(s.Quantity) > 0;

    if (candidateInStock && !currentInStock) cheapest.set(key, s);
    else if (candidateInStock === currentInStock &&
             Number(s.Price) < Number(current.Price)) {
      cheapest.set(key, s);
    }
  }

  return products.map((row) =>
    toPageProduct(
      row,
      cheapest.get(Number(row.ID)) ?? null,
      genreIndex.get(Number(row.ID)) ?? null
    )
  );
}

/**
 * One product by ID, with price, stock and genre names resolved.
 * @param {string|number} productId
 * @returns {Promise<object|null>} null when not found
 */
export async function getCatalogProductById(productId) {
  const id = Number(productId);
  if (!Number.isInteger(id)) return null;

  let row;
  try {
    row = await getRow(TABLES.PRODUCT, id);
  } catch {
    return null;
  }
  if (!row) return null;

  const [genreIndex, stockResult] = await Promise.all([
    loadGenreIndex(),
    listRows(TABLES.STOCKTAKE, {
      where: buildWhere([["ProductId", "eq", id]]),
      limit: 100,
    }),
  ]);

  const genreInfo = genreIndex.get(id) ?? null;

  const stockRows = stockResult.list;
  const inStock = stockRows.filter((s) => Number(s.Quantity) > 0);
  const pool = inStock.length > 0 ? inStock : stockRows;
  const cheapest = pool.length
    ? pool.reduce((min, s) => (Number(s.Price) < Number(min.Price) ? s : min))
    : null;

  let subGenreName = null;
  if (row.SubGenre && genreInfo?.id) {
    const subGenres = await loadSubGenres(genreInfo.id);
    subGenreName = subGenres.get(Number(row.SubGenre)) ?? null;
  }

  const product = toPageProduct(row, cheapest, genreInfo, subGenreName);

  // All purchase options, so the detail page can show every format.
  product.formats = stockRows.map((s) => ({
    itemId: s.ItemId,
    sourceId: s.SourceId,
    price: Number(s.Price),
    quantity: Number(s.Quantity),
  }));

  return product;
}

/** Genre names for filter dropdowns. */
export async function getCatalogCategories() {
  const genres = await loadGenres();
  return Array.from(genres.values());
}
