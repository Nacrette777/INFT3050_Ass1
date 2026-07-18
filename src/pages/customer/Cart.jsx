import { useMemo, useState } from "react";
import { Link } from "react-router";
import { mockProducts } from "../../data/mockProducts";
import {
  clearCustomerCart,
  formatCurrency,
  readCustomerCart,
  removeCustomerCartItem,
  updateCustomerCartQuantity,
} from "../../utils/customerCartStorage";

const SHIPPING_AMOUNT = 15;

function getProductId(product) {
  return String(product?.id || product?.productId || "");
}

function getSafePrice(value) {
  const price = Number(value);
  return Number.isFinite(price) && price >= 0 ? price : 0;
}

function getStockLimit(stock) {
  const stockNumber = Number(stock);
  return Number.isFinite(stockNumber) && stockNumber > 0
    ? Math.floor(stockNumber)
    : null;
}

function clampQuantity(quantity, stockLimit) {
  const parsedQuantity = Math.floor(Number(quantity));
  const safeQuantity =
    Number.isFinite(parsedQuantity) && parsedQuantity > 0 ? parsedQuantity : 1;
  return stockLimit ? Math.min(safeQuantity, stockLimit) : safeQuantity;
}

function Cart() {
  const [cartItems, setCartItems] = useState(() => readCustomerCart());
  const [cartNotice, setCartNotice] = useState("");

  const displayItems = useMemo(
    () =>
      cartItems.map((item) => {
        const product = Array.isArray(mockProducts)
          ? mockProducts.find((mockProduct) => getProductId(mockProduct) === item.id)
          : null;
        const stockLimit = getStockLimit(product?.stock ?? item.stock);
        const price = getSafePrice(item.price ?? product?.price);
        const quantity = clampQuantity(item.quantity, stockLimit);

        return {
          ...item,
          name: item.name || product?.name || "Unnamed Product",
          price,
          image: item.image || product?.image || "",
          imageText: item.imageText || product?.imageText || "Product Image",
          quantity,
          stock: stockLimit,
          subtotal: price * quantity,
        };
      }),
    [cartItems]
  );

  const subtotal = displayItems.reduce((sum, item) => sum + item.subtotal, 0);
  const shipping = displayItems.length > 0 ? SHIPPING_AMOUNT : 0;
  const total = subtotal + shipping;

  function refreshCart(nextCart, message) {
    setCartItems(nextCart);
    setCartNotice(message);
  }

  function handleQuantityChange(productId, quantity) {
    const item = displayItems.find((cartItem) => cartItem.id === productId);
    const nextCart = updateCustomerCartQuantity(
      productId,
      clampQuantity(quantity, item?.stock)
    );
    refreshCart(nextCart, "Cart updated.");
  }

  function handleRemove(productId, name) {
    refreshCart(removeCustomerCartItem(productId), `${name} removed from cart.`);
  }

  function handleClearCart() {
    if (window.confirm("Clear all items from your cart?")) {
      refreshCart(clearCustomerCart(), "Cart cleared.");
    }
  }

  return (
    <section>
      <h1>Your Cart</h1>

      {cartNotice && (
        <p className="customer-success-message" aria-live="polite">
          {cartNotice}
        </p>
      )}

      {displayItems.length === 0 ? (
        <div className="customer-empty-state">
          <h2>Your cart is empty</h2>
          <p>Add products to your cart before checkout.</p>
          <Link className="button-link" to="/customer/products">
            Continue Shopping
          </Link>
        </div>
      ) : (
        <>
          <div className="cart-actions">
            <Link className="secondary-button" to="/customer/products">
              Continue Shopping
            </Link>
            <button
              type="button"
              className="danger-button"
              onClick={handleClearCart}
              disabled={displayItems.length === 0}
            >
              Clear Cart
            </button>
          </div>

          <table className="basic-table cart-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Item</th>
                <th>Price</th>
                <th>Qty</th>
                <th>Subtotal</th>
                <th>Remove</th>
              </tr>
            </thead>

            <tbody>
              {displayItems.map((item) => (
                <tr key={item.id}>
                  <td>
                    <Link to={`/customer/products/${encodeURIComponent(item.id)}`}>
                      {item.image ? (
                        <img className="cart-item-image" src={item.image} alt={item.name} />
                      ) : (
                        <div className="cart-image-placeholder">{item.imageText}</div>
                      )}
                    </Link>
                  </td>
                  <td>
                    <Link to={`/customer/products/${encodeURIComponent(item.id)}`}>
                      {item.name}
                    </Link>
                  </td>
                  <td>{formatCurrency(item.price)}</td>
                  <td>
                    <div className="cart-quantity-control">
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        max={item.stock || undefined}
                        value={item.quantity}
                        onChange={(event) =>
                          handleQuantityChange(item.id, event.target.value)
                        }
                        aria-label={`Quantity for ${item.name}`}
                      />
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                        disabled={item.stock ? item.quantity >= item.stock : false}
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td>{formatCurrency(item.subtotal)}</td>
                  <td>
                    <button
                      type="button"
                      className="danger-button"
                      onClick={() => handleRemove(item.id, item.name)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <aside className="order-summary">
            <h2>Order Summary</h2>
            <p>Subtotal: {formatCurrency(subtotal)}</p>
            <p>Shipping: {formatCurrency(shipping)}</p>
            <p>Total: {formatCurrency(total)}</p>
            <Link to="/customer/checkout">
              <button type="button">Proceed to Checkout</button>
            </Link>
          </aside>
        </>
      )}
    </section>
  );
}

export default Cart;
