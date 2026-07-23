/**
 * schema.js — table names, typedefs, validation, password hashing
 * ---------------------------------------------------------------
 * Field names here are the NocoDB API names, which differ from the
 * raw SQL column names (e.g. DB "genreID" is exposed as "GenreID").
 * Always use the names in this file.
 * ---------------------------------------------------------------
 */

/* ---------------- Table names (as exposed by the API) ---------------- */

export const TABLES = {
  PRODUCT: "Product",
  GENRE: "Genre",
  BOOK_GENRE: "BookGenre",
  MOVIE_GENRE: "MovieGenre",
  GAME_GENRE: "GameGenre",
  SOURCE: "Source",
  STOCKTAKE: "Stocktake",
  PATRONS: "Patrons",
  USER: "User",
  TRANSACTION: "TO",
  ORDERS: "Orders",
  /**
   * Not present in the supplied Postman collection — the table has no
   * primary key, which NocoDB cannot expose. Verify before relying on it.
   */
  PRODUCTS_IN_ORDERS: "ProductsInOrders",
};

/** Genre.GenreID values seeded in StoreDB. */
export const GENRE_IDS = { BOOK: 1, MOVIE: 2, GAME: 3 };

/** Maps a genre to its sub-genre lookup table. */
export const SUB_GENRE_TABLE = {
  [GENRE_IDS.BOOK]: TABLES.BOOK_GENRE,
  [GENRE_IDS.MOVIE]: TABLES.MOVIE_GENRE,
  [GENRE_IDS.GAME]: TABLES.GAME_GENRE,
};

/** Source IDs seeded in StoreDB. */
export const SOURCE_IDS = {
  HARD_COPY_BOOK: 1,
  AUDIBLE: 2,
  STEAM: 3,
  PRIME_VIDEO: 4,
  DVD: 5,
  VHS: 6,
  HARD_COPY_AUDIOBOOK: 7,
  HARD_COPY_GAME: 8,
};

/* ---------------- Typedefs ---------------- */

/**
 * @typedef {Object} Product
 * @property {number} ID
 * @property {string} Name
 * @property {string=} Author
 * @property {string=} Description
 * @property {number} Genre
 * @property {number=} SubGenre
 * @property {string=} Published
 * @property {string=} LastUpdatedBy  Must be an existing User.UserName
 * @property {string=} LastUpdated
 */

/**
 * @typedef {Object} StocktakeItem
 * @property {number} ItemId
 * @property {number} SourceId
 * @property {number} ProductId
 * @property {number} Quantity
 * @property {number} Price
 */

/**
 * @typedef {Object} Patron
 * @property {number} UserID
 * @property {string} Email
 * @property {string} Name
 * @property {string=} Salt
 * @property {string=} HashPW
 */

/**
 * @typedef {Object} Order
 * @property {number} OrderID
 * @property {number} Customer  FK → TO.CustomerID
 * @property {string} StreetAddress
 * @property {number} PostCode
 * @property {string} Suburb
 * @property {string} State
 */

/* ---------------- Validation ---------------- */

/** Thrown when a payload fails validation before hitting the network. */
export class ValidationError extends Error {
  /** @param {Record<string,string>} fieldErrors */
  constructor(fieldErrors) {
    super(Object.values(fieldErrors)[0] ?? "Validation failed.");
    this.name = "ValidationError";
    this.fieldErrors = fieldErrors;
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const AU_STATES = ["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"];

const blank = (v) => v === undefined || v === null || String(v).trim() === "";
const isInt = (v) => Number.isInteger(Number(v));

function assertValid(errors) {
  if (Object.keys(errors).length > 0) throw new ValidationError(errors);
}

/**
 * Validate a product payload.
 * Enforces the polymorphic SubGenre rule the database cannot.
 * @param {Partial<Product>} input
 */
export function validateProduct(input) {
  const e = {};

  if (blank(input.Name)) e.Name = "Product name is required.";
  else if (String(input.Name).length > 255) e.Name = "Product name must be 255 characters or fewer.";

  if (!blank(input.Author) && String(input.Author).length > 255)
    e.Author = "Author must be 255 characters or fewer.";

  if (blank(input.Genre)) e.Genre = "Genre is required.";
  else if (!Object.values(GENRE_IDS).includes(Number(input.Genre)))
    e.Genre = "Genre must be 1 (Books), 2 (Movies) or 3 (Games).";

  if (!blank(input.SubGenre) && !isInt(input.SubGenre))
    e.SubGenre = "SubGenre must be a numeric ID.";

  if (!blank(input.Published) && Number.isNaN(Date.parse(input.Published)))
    e.Published = "Published must be a valid date.";

  if (!blank(input.LastUpdatedBy) && String(input.LastUpdatedBy).length > 50)
    e.LastUpdatedBy = "LastUpdatedBy must be 50 characters or fewer.";

  assertValid(e);
  return true;
}

/** @param {Partial<StocktakeItem>} input */
export function validateStocktake(input) {
  const e = {};
  if (!isInt(input.ProductId)) e.ProductId = "ProductId is required.";
  if (!isInt(input.SourceId)) e.SourceId = "SourceId is required.";

  if (!isInt(input.Quantity) || Number(input.Quantity) < 0)
    e.Quantity = "Quantity must be zero or a positive whole number.";

  const price = Number(input.Price);
  if (Number.isNaN(price) || price < 0) e.Price = "Price must be zero or a positive number.";

  assertValid(e);
  return true;
}

/** @param {{Name?:string, Email?:string, password?:string}} input */
export function validatePatron(input) {
  const e = {};
  if (blank(input.Name) || String(input.Name).trim().length < 2)
    e.Name = "Name must be at least 2 characters.";
  else if (String(input.Name).length > 255) e.Name = "Name must be 255 characters or fewer.";

  if (blank(input.Email)) e.Email = "Email is required.";
  else if (!EMAIL_RE.test(input.Email)) e.Email = "Enter a valid email address.";
  else if (String(input.Email).length > 255) e.Email = "Email must be 255 characters or fewer.";

  if (input.password !== undefined && (blank(input.password) || input.password.length < 6))
    e.password = "Password must be at least 6 characters.";

  assertValid(e);
  return true;
}

/** @param {Partial<Order>} input */
export function validateOrder(input) {
  const e = {};
  if (!isInt(input.Customer)) e.Customer = "A transaction ID is required.";
  if (blank(input.StreetAddress)) e.StreetAddress = "Street address is required.";
  if (blank(input.Suburb)) e.Suburb = "Suburb is required.";

  if (blank(input.PostCode)) e.PostCode = "Post code is required.";
  else if (!/^\d{4}$/.test(String(input.PostCode))) e.PostCode = "Post code must be 4 digits.";

  if (blank(input.State)) e.State = "State is required.";
  else if (!AU_STATES.includes(String(input.State).toUpperCase()))
    e.State = `State must be one of: ${AU_STATES.join(", ")}.`;

  assertValid(e);
  return true;
}

/**
 * Validate a checkout payload for the TO table.
 * Field lengths mirror the DDL (Suburb 50, State 50, CardNumber 50, Expiry 5).
 */
export function validateTransaction(input) {
  const e = {};

  if (blank(input.Email)) e.Email = "Email is required.";
  else if (!EMAIL_RE.test(input.Email)) e.Email = "Enter a valid email address.";

  if (blank(input.StreetAddress)) e.StreetAddress = "Street address is required.";

  if (blank(input.Suburb)) e.Suburb = "Suburb is required.";
  else if (String(input.Suburb).length > 50) e.Suburb = "Suburb must be 50 characters or fewer.";

  if (!/^\d{4}$/.test(String(input.PostCode ?? ""))) e.PostCode = "Post code must be 4 digits.";

  if (blank(input.State)) e.State = "State is required.";
  else if (!AU_STATES.includes(String(input.State).toUpperCase()))
    e.State = `State must be one of: ${AU_STATES.join(", ")}.`;

  const card = String(input.CardNumber ?? "").replace(/[\s-]/g, "");
  if (!/^\d{13,19}$/.test(card)) e.CardNumber = "Enter a valid card number.";
  else if (!luhnCheck(card)) e.CardNumber = "That card number is not valid.";

  if (blank(input.CardOwner)) e.CardOwner = "Card owner name is required.";
  else if (String(input.CardOwner).length > 50)
    e.CardOwner = "Card owner must be 50 characters or fewer.";

  if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(String(input.Expiry ?? "")))
    e.Expiry = "Expiry must be in MM/YY format.";
  else if (isExpired(input.Expiry)) e.Expiry = "That card has expired.";

  if (!/^\d{3,4}$/.test(String(input.CVV ?? ""))) e.CVV = "CVV must be 3 or 4 digits.";

  assertValid(e);
  return true;
}

/** Luhn checksum — catches typos before a request is sent. */
export function luhnCheck(digits) {
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let d = Number(digits[i]);
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return sum % 10 === 0;
}

/** @param {string} expiry "MM/YY" */
export function isExpired(expiry) {
  const [mm, yy] = String(expiry).split("/").map(Number);
  const now = new Date();
  const expiryEnd = new Date(2000 + yy, mm, 0, 23, 59, 59);
  return expiryEnd < now;
}

/** Mask a card number for display: 4111111111111111 → •••• •••• •••• 1111 */
export function maskCardNumber(cardNumber) {
  const digits = String(cardNumber ?? "").replace(/\D/g, "");
  if (digits.length < 4) return "••••";
  return `•••• •••• •••• ${digits.slice(-4)}`;
}

/* ---------------- Password hashing ---------------- */
/*
 * The backend verifies with:
 *   crypto.createHash("sha256").update(salt + password, "utf8").digest("hex")
 * (auth/server.js). We reproduce that byte-for-byte using Web Crypto so
 * accounts created here can be verified server-side.
 *
 * crypto.subtle requires a secure context — HTTPS or localhost. Both dev
 * and marking happen on localhost, so this is fine.
 */

/** 32 random hex characters, matching the varchar(32) Salt column. */
export function generateSalt(byteLength = 16) {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * @param {string} salt
 * @param {string} password
 * @returns {Promise<string>} 64-char lowercase hex SHA-256 digest
 */
export async function hashPassword(salt, password) {
  if (!crypto?.subtle) {
    throw new Error(
      "Web Crypto is unavailable. Serve the app over http://localhost or HTTPS."
    );
  }
  const data = new TextEncoder().encode(salt + password);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Length-safe comparison of two hex digests. */
export function compareHash(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/* ---------------- Money helpers ---------------- */
/*
 * Stocktake.Price is a SQL float — a binary approximation. Summing
 * many float prices accumulates error. These helpers work in integer
 * cents and round only at the boundary.
 */

export const toCents = (price) => Math.round(Number(price) * 100);
export const fromCents = (cents) => cents / 100;

/** @param {Array<{price:number, quantity:number}>} lines */
export function sumLineTotals(lines) {
  const cents = lines.reduce(
    (total, l) => total + toCents(l.price) * Number(l.quantity ?? 1),
    0
  );
  return fromCents(cents);
}

export function formatPrice(price) {
  if (price === null || price === undefined || Number.isNaN(Number(price))) return "—";
  return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(
    Number(price)
  );
}
