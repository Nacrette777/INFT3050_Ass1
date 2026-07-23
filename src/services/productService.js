/**
 * productService.js — catalogue data access
 * ---------------------------------------------------------------
 * Covers Product, Genre, sub-genres, Source and Stocktake.
 *
 * Key rule: Product has NO price column. Price and availability live
 * in Stocktake, keyed by ProductId. Anything showing a price must
 * combine the two — use attachPricing() to do it in one request
 * instead of N.
 * ---------------------------------------------------------------
 */

import {
  listRows,
  listAllRows,
  getRow,
  createRow,
  updateRow,
  deleteRow,
  countRows,
  buildWhere,
} from "./apiClient";
import {
  TABLES,
  GENRE_IDS,
  SUB_GENRE_TABLE,
  validateProduct,
  validateStocktake,
} from "./schema";

/* ---------------- Products ---------------- */

/**
 * Paged product list with filtering and search.
 * @param {object} [opts]
 * @param {number} [opts.genreId]
 * @param {number} [opts.subGenreId]
 * @param {string} [opts.search]  matched against Name
 * @param {number} [opts.limit=25]
 * @param {number} [opts.offset=0]
 * @param {string} [opts.sort="Name"]  prefix with "-" for descending
 * @returns {Promise<{list: import("./schema").Product[], pageInfo: object}>}
 */
export function getProducts(opts = {}) {
  const { genreId, subGenreId, search, limit = 25, offset = 0, sort = "Name" } = opts;

  const conditions = [];
  if (genreId) conditions.push(["Genre", "eq", genreId]);
  if (subGenreId) conditions.push(["SubGenre", "eq", subGenreId]);
  if (search?.trim()) conditions.push(["Name", "like", `%${search.trim()}%`]);

  return listRows(TABLES.PRODUCT, {
    where: buildWhere(conditions),
    sort,
    limit,
    offset,
  });
}

/** @returns {Promise<import("./schema").Product>} */
export function getProductById(id) {
  return getRow(TABLES.PRODUCT, id);
}

/** Product with its price, stock and genre names resolved. */
export async function getProductDetail(id) {
  const [product, genres] = await Promise.all([getProductById(id), getGenres()]);
  const stock = await getStockForProduct(id);

  const genre = genres.find((g) => Number(g.GenreID) === Number(product.Genre)) ?? null;

  let subGenre = null;
  if (product.SubGenre && product.Genre) {
    const subGenres = await getSubGenres(product.Genre);
    subGenre = subGenres.find((s) => Number(s.SubGenreID) === Number(product.SubGenre)) ?? null;
  }

  const available = stock.filter((s) => Number(s.Quantity) > 0);

  return {
    ...product,
    genreName: genre?.Name ?? null,
    subGenreName: subGenre?.Name ?? null,
    stock,
    inStock: available.length > 0,
    lowestPrice: available.length
      ? Math.min(...available.map((s) => Number(s.Price)))
      : null,
  };
}

export function getProductCount(genreId) {
  return countRows(
    TABLES.PRODUCT,
    genreId ? buildWhere([["Genre", "eq", genreId]]) : undefined
  );
}

/**
 * Create a product. Requires an auth cookie.
 * @param {Partial<import("./schema").Product>} product
 * @param {string} [editorUsername] Written to LastUpdatedBy — must be an
 *        existing User.UserName, since the column is a foreign key.
 *        Passing an unknown username will make SQL Server reject the insert.
 */
export function createProduct(product, editorUsername) {
  validateProduct(product);

  return createRow(TABLES.PRODUCT, {
    Name: product.Name.trim(),
    Author: product.Author?.trim() || null,
    Description: product.Description?.trim() || null,
    Genre: Number(product.Genre),
    SubGenre: product.SubGenre ? Number(product.SubGenre) : null,
    Published: product.Published || null,
    LastUpdatedBy: editorUsername || null,
    LastUpdated: new Date().toISOString(),
  });
}

/** Update a product. Requires an auth cookie. */
export function updateProduct(id, changes, editorUsername) {
  const payload = { ...changes };
  if (payload.Name !== undefined && String(payload.Name).trim() === "") {
    throw new Error("Product name cannot be empty.");
  }
  if (payload.Genre !== undefined &&
      !Object.values(GENRE_IDS).includes(Number(payload.Genre))) {
    throw new Error("Genre must be 1 (Books), 2 (Movies) or 3 (Games).");
  }

  return updateRow(TABLES.PRODUCT, id, {
    ...payload,
    LastUpdatedBy: editorUsername || null,
    LastUpdated: new Date().toISOString(),
  });
}

/** Delete a product. Requires an auth cookie. */
export function deleteProduct(id) {
  return deleteRow(TABLES.PRODUCT, id);
}

/* ---------------- Genres ---------------- */

export function getGenres() {
  return listAllRows(TABLES.GENRE, { sort: "GenreID" });
}

/**
 * Sub-genres for a top-level genre.
 * The database has no FK for this relationship, so the mapping is
 * enforced here instead.
 * @param {number} genreId 1=Books, 2=Movies, 3=Games
 */
export function getSubGenres(genreId) {
  const tableName = SUB_GENRE_TABLE[Number(genreId)];
  if (!tableName) return Promise.resolve([]);
  return listAllRows(tableName, { sort: "Name" });
}

/* ---------------- Sources ---------------- */

export function getSources() {
  return listAllRows(TABLES.SOURCE, { sort: "SourceName" });
}

/** Sources appropriate to a genre (e.g. Steam only for games). */
export async function getSourcesForGenre(genreId) {
  const { list } = await listRows(TABLES.SOURCE, {
    where: buildWhere([["Genre", "eq", genreId]]),
    limit: 100,
  });
  return list;
}

/* ---------------- Stocktake ---------------- */

export async function getStockForProduct(productId) {
  const { list } = await listRows(TABLES.STOCKTAKE, {
    where: buildWhere([["ProductId", "eq", productId]]),
    limit: 100,
  });
  return list;
}

/**
 * Cheapest in-stock option for a product.
 * @returns {Promise<{price:number, quantity:number, itemId:number, sourceId:number}|null>}
 */
export async function getProductPrice(productId) {
  const stock = await getStockForProduct(productId);
  const available = stock.filter((s) => Number(s.Quantity) > 0);
  if (available.length === 0) return null;

  const cheapest = available.reduce((min, s) =>
    Number(s.Price) < Number(min.Price) ? s : min
  );

  return {
    price: Number(cheapest.Price),
    quantity: Number(cheapest.Quantity),
    itemId: cheapest.ItemId,
    sourceId: cheapest.SourceId,
  };
}

/**
 * Attach price and stock to a list of products in ONE request.
 * Prevents a product grid from firing a request per card.
 * @param {import("./schema").Product[]} products
 */
export async function attachPricing(products) {
  if (!products?.length) return [];

  const ids = products.map((p) => p.ID).filter(Boolean);
  if (ids.length === 0) {
    return products.map((p) => ({ ...p, price: null, quantity: 0, inStock: false }));
  }

  const { list: stock } = await listRows(TABLES.STOCKTAKE, {
    where: `(ProductId,in,${ids.join(",")})`,
    limit: 1000,
  });

  // Keep the cheapest row per product.
  const cheapestByProduct = new Map();
  for (const s of stock) {
    const key = Number(s.ProductId);
    const current = cheapestByProduct.get(key);
    if (!current || Number(s.Price) < Number(current.Price)) {
      cheapestByProduct.set(key, s);
    }
  }

  return products.map((p) => {
    const s = cheapestByProduct.get(Number(p.ID));
    return {
      ...p,
      price: s ? Number(s.Price) : null,
      quantity: s ? Number(s.Quantity) : 0,
      itemId: s ? s.ItemId : null,
      inStock: s ? Number(s.Quantity) > 0 : false,
    };
  });
}

/** Create a stock row. Requires an auth cookie. */
export function createStocktake(stock) {
  validateStocktake(stock);
  return createRow(TABLES.STOCKTAKE, {
    ProductId: Number(stock.ProductId),
    SourceId: Number(stock.SourceId),
    Quantity: Number(stock.Quantity),
    Price: Number(stock.Price),
  });
}

/** Update a stock row. Requires an auth cookie. */
export function updateStocktake(itemId, changes) {
  return updateRow(TABLES.STOCKTAKE, itemId, changes);
}

/**
 * Reduce stock after a purchase. Requires an auth cookie.
 *
 * This is a read-then-write with no transaction, so two simultaneous
 * purchases can both read the same starting quantity and overwrite each
 * other. NocoDB offers no atomic decrement. Note the limitation in your
 * report rather than pretending it is safe.
 */
export async function decrementStock(itemId, amount) {
  const row = await getRow(TABLES.STOCKTAKE, itemId);
  const next = Math.max(0, Number(row.Quantity) - Number(amount));
  return updateRow(TABLES.STOCKTAKE, itemId, { Quantity: next });
}
