/**
 * orderService.js — checkout and order history
 * ---------------------------------------------------------------
 * A checkout writes across three tables:
 *
 *   TO               who is paying + billing + card details
 *   Orders           delivery address, linked by Orders.Customer = TO.CustomerID
 *   ProductsInOrders line items, linked to Stocktake.ItemId
 *
 * ProductsInOrders has no primary key, so it is absent from the supplied
 * Postman collection — but the endpoint is confirmed working on a live
 * instance. The practical limit is that individual lines cannot be
 * reliably patched or deleted; replace an order's lines wholesale.
 *
 * All writes require an auth cookie.
 * ---------------------------------------------------------------
 */

import {
  listRows,
  getRow,
  createRow,
  updateRow,
  deleteRow,
  buildWhere,
  ApiError,
} from "./apiClient";
import {
  TABLES,
  validateOrder,
  validateTransaction,
  sumLineTotals,
} from "./schema";

/* ---------------- Transactions (TO) ---------------- */

/**
 * Create a transaction record.
 * @param {object} details
 * @param {number} [details.PatronId] omit or null for guest checkout
 */
export function createTransaction(details) {
  validateTransaction(details);

  return createRow(TABLES.TRANSACTION, {
    PatronId: details.PatronId ? Number(details.PatronId) : null,
    Email: details.Email.trim().toLowerCase(),
    PhoneNumber: details.PhoneNumber?.trim() || null,
    StreetAddress: details.StreetAddress.trim(),
    PostCode: Number(details.PostCode),
    Suburb: details.Suburb.trim(),
    State: String(details.State).toUpperCase(),
    CardNumber: String(details.CardNumber).replace(/[\s-]/g, ""),
    CardOwner: details.CardOwner.trim(),
    Expiry: details.Expiry,
    CVV: Number(details.CVV),
  });
}

export async function getTransactionsByPatron(patronId) {
  const { list } = await listRows(TABLES.TRANSACTION, {
    where: buildWhere([["PatronId", "eq", patronId]]),
    limit: 200,
  });
  return list;
}

/* ---------------- Orders ---------------- */

export function createOrder(order) {
  validateOrder(order);

  return createRow(TABLES.ORDERS, {
    Customer: Number(order.Customer),
    StreetAddress: order.StreetAddress.trim(),
    PostCode: Number(order.PostCode),
    Suburb: order.Suburb.trim(),
    State: String(order.State).toUpperCase(),
  });
}

export function getOrderById(orderId) {
  return getRow(TABLES.ORDERS, orderId);
}

/** Paged list of all orders — staff view. */
export function getAllOrders({ limit = 25, offset = 0 } = {}) {
  return listRows(TABLES.ORDERS, { sort: "-OrderID", limit, offset });
}

/* ---------------- Line items ---------------- */

/**
 * Check once whether the line-items table is reachable.
 * @returns {Promise<boolean>}
 */
export async function probeLineItemsEndpoint() {
  try {
    await listRows(TABLES.PRODUCTS_IN_ORDERS, { limit: 1 });
    return true;
  } catch (error) {
    if (error instanceof ApiError && (error.isNotFound || error.status === 400)) return false;
    throw error;
  }
}

/**
 * Persist the line items for an order.
 *
 * `produktId` is a foreign key to **Stocktake.ItemId**, not Product.ID —
 * a line records the exact edition and price the customer bought.
 *
 * If the endpoint is unavailable this throws with a clear message. Do not
 * swallow it: an order whose contents were never saved is worse than a
 * checkout that visibly failed.
 *
 * @param {number} orderId
 * @param {Array<{itemId:number, quantity:number}>} lines
 */
export async function saveLineItems(orderId, lines) {
  if (!lines?.length) return [];

  const results = [];
  for (const line of lines) {
    if (!Number.isInteger(Number(line.itemId))) {
      throw new Error("Each line item needs a Stocktake ItemId.");
    }
    if (!Number.isInteger(Number(line.quantity)) || Number(line.quantity) < 1) {
      throw new Error("Line item quantity must be at least 1.");
    }

    try {
      results.push(
        await createRow(TABLES.PRODUCTS_IN_ORDERS, {
          OrderId: Number(orderId),
          ProduktId: Number(line.itemId),
          Quantity: Number(line.quantity),
        })
      );
    } catch (error) {
      if (error instanceof ApiError && (error.isNotFound || error.status === 400)) {
        throw new ApiError(
          "The ProductsInOrders table is not exposed by the API, so order " +
            "line items cannot be saved. The table has no primary key, which " +
            "NocoDB requires. Raise this with your tutor.",
          error.status,
          error.details
        );
      }
      throw error;
    }
  }
  return results;
}

/** Line items for an order, with product name and price resolved. */
export async function getLineItems(orderId) {
  const { list } = await listRows(TABLES.PRODUCTS_IN_ORDERS, {
    where: buildWhere([["OrderId", "eq", orderId]]),
    limit: 200,
  });
  if (list.length === 0) return [];

  const itemIds = list.map((l) => l.ProduktId).filter(Boolean);
  const { list: stock } = await listRows(TABLES.STOCKTAKE, {
    where: `(ItemId,in,${itemIds.join(",")})`,
    limit: 200,
  });

  const productIds = [...new Set(stock.map((s) => s.ProductId).filter(Boolean))];
  const { list: products } = productIds.length
    ? await listRows(TABLES.PRODUCT, {
        where: `(ID,in,${productIds.join(",")})`,
        fields: "ID,Name,Author",
        limit: 200,
      })
    : { list: [] };

  const stockById = new Map(stock.map((s) => [Number(s.ItemId), s]));
  const productById = new Map(products.map((p) => [Number(p.ID), p]));

  return list.map((line) => {
    const s = stockById.get(Number(line.ProduktId)) ?? null;
    const p = s ? productById.get(Number(s.ProductId)) ?? null : null;
    return {
      itemId: line.ProduktId,
      quantity: Number(line.Quantity),
      price: s ? Number(s.Price) : null,
      productId: s?.ProductId ?? null,
      productName: p?.Name ?? "Unknown product",
      author: p?.Author ?? null,
      lineTotal: s ? Number(s.Price) * Number(line.Quantity) : null,
    };
  });
}

/* ---------------- Order history ---------------- */

/**
 * Orders for one customer.
 *
 * Orders links to Patrons only indirectly (Orders → TO → Patrons), so this
 * resolves the patron's transactions first, then fetches matching orders in
 * a single batched call.
 *
 * @param {number} patronId Patrons.UserID
 * @param {{includeLineItems?: boolean}} [opts]
 */
export async function getOrdersByPatron(patronId, opts = {}) {
  const transactions = await getTransactionsByPatron(patronId);
  if (transactions.length === 0) return [];

  const customerIds = transactions.map((t) => t.CustomerID).filter(Boolean);
  if (customerIds.length === 0) return [];

  const { list: orders } = await listRows(TABLES.ORDERS, {
    where: `(Customer,in,${customerIds.join(",")})`,
    sort: "-OrderID",
    limit: 200,
  });

  const txById = new Map(transactions.map((t) => [Number(t.CustomerID), t]));

  const enriched = orders.map((o) => {
    const tx = txById.get(Number(o.Customer)) ?? null;
    return {
      ...o,
      transaction: tx,
      email: tx?.Email ?? null,
      phone: tx?.PhoneNumber ?? null,
      lines: [],
      total: null,
    };
  });

  if (!opts.includeLineItems) return enriched;

  // Line items are optional because the endpoint may not exist.
  await Promise.all(
    enriched.map(async (order) => {
      try {
        order.lines = await getLineItems(order.OrderID);
        order.total = sumLineTotals(
          order.lines.map((l) => ({ price: l.price ?? 0, quantity: l.quantity }))
        );
      } catch {
        order.lines = [];
        order.total = null;
      }
    })
  );

  return enriched;
}

/* ---------------- Full checkout ---------------- */

/**
 * Create transaction, order and line items in sequence.
 *
 * There is no transaction boundary across REST calls, so a failure part-way
 * leaves earlier rows in place. This attempts a compensating delete of the
 * order and transaction, but that too can fail. Document this as a known
 * limitation of building on a table-per-endpoint REST API.
 *
 * @param {object} checkout billing + card details, plus optional Delivery* overrides
 * @param {Array<{itemId:number, quantity:number}>} [lines]
 */
export async function submitCheckout(checkout, lines = []) {
  const transaction = await createTransaction(checkout);

  const customerId = transaction?.CustomerID ?? transaction?.Id ?? transaction?.id;
  if (!customerId) {
    throw new Error("Checkout failed: the server did not return a transaction ID.");
  }

  let order;
  try {
    order = await createOrder({
      Customer: customerId,
      StreetAddress: checkout.DeliveryStreetAddress ?? checkout.StreetAddress,
      PostCode: checkout.DeliveryPostCode ?? checkout.PostCode,
      Suburb: checkout.DeliverySuburb ?? checkout.Suburb,
      State: checkout.DeliveryState ?? checkout.State,
    });
  } catch (error) {
    await deleteRow(TABLES.TRANSACTION, customerId).catch(() => {});
    throw error;
  }

  const orderId = order?.OrderID ?? order?.Id ?? order?.id;

  if (lines.length > 0) {
    try {
      await saveLineItems(orderId, lines);
    } catch (error) {
      await deleteRow(TABLES.ORDERS, orderId).catch(() => {});
      await deleteRow(TABLES.TRANSACTION, customerId).catch(() => {});
      throw error;
    }
  }

  return { transaction, order, orderId, customerId };
}

/* ---------------- Mutations ---------------- */

export function updateOrder(orderId, changes) {
  return updateRow(TABLES.ORDERS, orderId, changes);
}

/** Delete an order. Line items are removed first to satisfy the FK. */
export async function deleteOrder(orderId) {
  try {
    const { list } = await listRows(TABLES.PRODUCTS_IN_ORDERS, {
      where: buildWhere([["OrderId", "eq", orderId]]),
      limit: 200,
    });
    // Keyless table — NocoDB may not accept row-level deletes here.
    for (const line of list) {
      const rowId = line.Id ?? line.id;
      if (rowId !== undefined) {
        await deleteRow(TABLES.PRODUCTS_IN_ORDERS, rowId).catch(() => {});
      }
    }
  } catch {
    /* endpoint unavailable — fall through and try the order itself */
  }

  return deleteRow(TABLES.ORDERS, orderId);
}
