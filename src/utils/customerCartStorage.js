export const CUSTOMER_CART_STORAGE_KEY = "entertainmentGuildCustomerCart";
export const CUSTOMER_CART_UPDATED_EVENT = "customer-cart-updated";

function toSafeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : fallback;
}

function getId(value) {
  return value === undefined || value === null ? "" : String(value);
}

function getStockLimit(stock) {
  const stockNumber = Number(stock);
  return Number.isFinite(stockNumber) && stockNumber > 0
    ? Math.floor(stockNumber)
    : null;
}

function getKnownStock(stock) {
  const stockNumber = Number(stock);
  return Number.isFinite(stockNumber) && stockNumber >= 0
    ? Math.floor(stockNumber)
    : null;
}

function clampQuantity(quantity, stock) {
  const parsedQuantity = Math.floor(toSafeNumber(quantity, 1));
  const stockLimit = getStockLimit(stock);
  const safeQuantity = Math.max(1, parsedQuantity);
  return stockLimit ? Math.min(safeQuantity, stockLimit) : safeQuantity;
}

function createAddResult(cart, addedQuantity = 0, options = {}) {
  return {
    cart,
    addedQuantity,
    reachedStockLimit: Boolean(options.reachedStockLimit),
    outOfStock: Boolean(options.outOfStock),
  };
}

function normalizeCartItem(item) {
  const id = getId(item?.id || item?.productId);

  if (!id) {
    return null;
  }

  const stock = getStockLimit(item?.stock);

  return {
    id,
    name: item?.name || "Unnamed Product",
    price: toSafeNumber(item?.price),
    image: item?.image || "",
    imageText: item?.imageText || "Product Image",
    quantity: clampQuantity(item?.quantity, stock),
    stock,
  };
}

function notifyCartUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(CUSTOMER_CART_UPDATED_EVENT));
  }
}

export function formatCurrency(value) {
  return `$${toSafeNumber(value).toFixed(2)}`;
}

export function readCustomerCart() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const parsedCart = JSON.parse(
      window.localStorage.getItem(CUSTOMER_CART_STORAGE_KEY) || "[]"
    );

    if (!Array.isArray(parsedCart)) {
      return [];
    }

    return parsedCart.map(normalizeCartItem).filter(Boolean);
  } catch {
    return [];
  }
}

export function writeCustomerCart(items) {
  const normalizedItems = Array.isArray(items)
    ? items.map(normalizeCartItem).filter(Boolean)
    : [];

  if (typeof window !== "undefined") {
    window.localStorage.setItem(
      CUSTOMER_CART_STORAGE_KEY,
      JSON.stringify(normalizedItems)
    );
    notifyCartUpdated();
  }

  return normalizedItems;
}

export function getCustomerCartItemCount(items = readCustomerCart()) {
  return items.reduce((total, item) => total + clampQuantity(item.quantity, item.stock), 0);
}

export function getStockStatusText(stock) {
  const knownStock = getKnownStock(stock);

  if (knownStock === null) {
    return "Check availability";
  }

  return knownStock > 0 ? `${knownStock} in stock` : "Out of stock";
}

export function addProductToCustomerCart(product, quantity = 1) {
  const currentCart = readCustomerCart();
  const productId = getId(product?.id || product?.productId);

  if (!productId) {
    return createAddResult(currentCart);
  }

  const knownStock = getKnownStock(product?.stock);

  if (knownStock === 0) {
    return createAddResult(currentCart, 0, { outOfStock: true });
  }

  const stock = getStockLimit(product?.stock);
  const existingItem = currentCart.find((item) => item.id === productId);
  const currentQuantity = existingItem ? clampQuantity(existingItem.quantity, stock) : 0;
  const requestedQuantity = clampQuantity(quantity, stock);
  const availableQuantity = stock ? Math.max(0, stock - currentQuantity) : requestedQuantity;
  const addedQuantity = stock
    ? Math.min(requestedQuantity, availableQuantity)
    : requestedQuantity;

  if (addedQuantity <= 0) {
    return createAddResult(currentCart, 0, { reachedStockLimit: Boolean(stock) });
  }

  let updatedCart;

  if (existingItem) {
    updatedCart = currentCart.map((item) =>
      item.id === productId
        ? {
            ...item,
            quantity: currentQuantity + addedQuantity,
            stock,
          }
        : item
    );
  } else {
    updatedCart = [
      ...currentCart,
      {
        id: productId,
        name: product?.name || "Unnamed Product",
        price: toSafeNumber(product?.price),
        image: product?.image || "",
        imageText: product?.imageText || "Product Image",
        quantity: addedQuantity,
        stock,
      },
    ];
  }

  return createAddResult(writeCustomerCart(updatedCart), addedQuantity, {
    reachedStockLimit: Boolean(stock && addedQuantity < requestedQuantity),
  });
}

export function updateCustomerCartQuantity(productId, quantity) {
  const id = getId(productId);
  const updatedCart = readCustomerCart().map((item) =>
    item.id === id
      ? { ...item, quantity: clampQuantity(quantity, item.stock) }
      : item
  );

  return writeCustomerCart(updatedCart);
}

export function removeCustomerCartItem(productId) {
  const id = getId(productId);
  return writeCustomerCart(readCustomerCart().filter((item) => item.id !== id));
}

export function clearCustomerCart() {
  return writeCustomerCart([]);
}
