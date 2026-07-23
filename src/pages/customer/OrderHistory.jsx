import { Fragment, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { getCurrentUser, logout } from "../../services/authService";

// Read order data defensively because it comes from localStorage.
function readUserOrders(username) {
  try {
    const allOrders = JSON.parse(localStorage.getItem("tradeOrders") || "{}");
    return Array.isArray(allOrders?.[username]) ? allOrders[username] : [];
  } catch {
    return [];
  }
}

function readAllOrders() {
  try {
    return JSON.parse(localStorage.getItem("tradeOrders") || "{}");
  } catch {
    return {};
  }
}

function getOrderTotal(order) {
  const total = Number(order?.total);
  return Number.isFinite(total) ? total : 0;
}

function formatDate(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "Date unavailable";
  return date.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Status text is always paired with a colour class.
function statusClass(status) {
  switch (status) {
    case "Completed":
      return "mg-status mg-status--completed";
    case "Cancelled":
      return "mg-status mg-status--cancelled";
    case "Processing":
      return "mg-status mg-status--processing";
    default:
      return "mg-status mg-status--pending";
  }
}

function OrderHistory() {
  const navigate = useNavigate();
  const [user] = useState(() => getCurrentUser());
  const [orders, setOrders] = useState(() =>
    user ? readUserOrders(user.username) : []
  );
  const [openOrderId, setOpenOrderId] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [navigate, user]);

  function saveOrders(username, updatedOrders) {
    // Preserve other users' orders while updating only the current customer.
    const allOrders = readAllOrders();
    allOrders[username] = updatedOrders;
    localStorage.setItem("tradeOrders", JSON.stringify(allOrders));
    setOrders(updatedOrders);
  }

  function handleDelete(index) {
    if (!user || !window.confirm("Delete this order? This cannot be undone.")) return;
    const updated = orders.filter((_, i) => i !== index);
    saveOrders(user.username, updated);
  }

  function handleLogout() {
    logout();
    navigate("/login");
  }

  function toggleDetails(key) {
    setOpenOrderId((current) => (current === key ? null : key));
  }

  if (!user) return null;

  const completedOrders = orders.filter((order) => order?.status === "Completed");
  const totalSpent = completedOrders.reduce(
    (sum, order) => sum + getOrderTotal(order),
    0
  );

  const displayName = user.name || user.username || "Customer";
  const email = user.email || user.username || "Not provided";
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const stats = [
    { label: "Total Orders", value: orders.length },
    { label: "Completed", value: completedOrders.length },
    { label: "Total Spent", value: `$${totalSpent.toFixed(2)}` },
  ];

  return (
    <section className="mg-account">
      <div className="mg-account-shell">
        <h1 className="mg-page-title">Order History</h1>

        <div className="mg-account-grid">
          {/* ---------- left column ---------- */}
          <aside className="mg-side-card">
            <div className="mg-avatar">{initials || "?"}</div>
            <h2 className="mg-side-name">{displayName}</h2>
            <p className="mg-side-email">{email}</p>
            <span className="mg-badge">Guild Member</span>

            <nav className="mg-side-nav">
              <Link className="mg-side-link" to="/customer/profile">
                Profile
              </Link>
              <Link className="mg-side-link is-active" to="/customer/orders">
                Order History
              </Link>
              <Link className="mg-side-link" to="/customer/products">
                Continue Shopping
              </Link>
              <button
                type="button"
                className="mg-btn mg-btn--danger mg-btn--block"
                onClick={handleLogout}
              >
                Sign Out
              </button>
            </nav>
          </aside>

          {/* ---------- right column ---------- */}
          <main className="mg-account-main">
            <div className="mg-stats">
              {stats.map((stat) => (
                <div className="mg-stat" key={stat.label}>
                  <div className="mg-stat-value">{stat.value}</div>
                  <span className="mg-stat-label">{stat.label}</span>
                </div>
              ))}
            </div>

            <div className="mg-card">
              <div className="mg-card-head">
                <h2 className="mg-card-title">Your Orders</h2>
              </div>

              {orders.length === 0 ? (
                <div className="mg-empty">
                  <p>No orders yet.</p>
                  <Link className="mg-btn mg-btn--gold" to="/customer/products">
                    Start Shopping
                  </Link>
                </div>
              ) : (
                <>
                  {/* Desktop / tablet table */}
                  <div className="mg-table-wrap">
                    <table className="mg-table">
                      <thead>
                        <tr>
                          <th scope="col">Order ID</th>
                          <th scope="col">Order Date</th>
                          <th scope="col">Total</th>
                          <th scope="col">Status</th>
                          <th scope="col">Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((order, index) => {
                          const key = order?.id || `order-${index}`;
                          const orderId = order?.id || `#${index + 1}`;
                          const isOpen = openOrderId === key;

                          return (
                            <Fragment key={key}>
                              <tr>
                                <td className="mg-cell-id">{orderId}</td>
                                <td>{formatDate(order?.date)}</td>
                                <td className="mg-cell-total">
                                  ${getOrderTotal(order).toFixed(2)}
                                </td>
                                <td>
                                  <span className={statusClass(order?.status)}>
                                    {order?.status || "Pending"}
                                  </span>
                                </td>
                                <td>
                                  <div className="mg-cell-actions">
                                    <button
                                      type="button"
                                      className="mg-btn mg-btn--ghost mg-btn--small"
                                      onClick={() => toggleDetails(key)}
                                      aria-expanded={isOpen}
                                    >
                                      {isOpen ? "Hide Details" : "View Details"}
                                    </button>
                                    <button
                                      type="button"
                                      className="mg-btn mg-btn--danger mg-btn--small"
                                      onClick={() => handleDelete(index)}
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </td>
                              </tr>

                              {isOpen && (
                                <tr className="mg-detail-row">
                                  <td colSpan={5}>
                                    <ul className="mg-detail-list">
                                      <li>Item: {order?.item || "Order item"}</li>
                                      <li>Order ID: {orderId}</li>
                                      <li>Placed: {formatDate(order?.date)}</li>
                                      <li>
                                        Total: ${getOrderTotal(order).toFixed(2)}
                                      </li>
                                    </ul>
                                  </td>
                                </tr>
                              )}
                            </Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile: one card per order */}
                  <div className="mg-order-cards">
                    {orders.map((order, index) => {
                      const key = order?.id || `order-${index}`;
                      const orderId = order?.id || `#${index + 1}`;
                      const isOpen = openOrderId === key;

                      return (
                        <article className="mg-order-card" key={`card-${key}`}>
                          <div className="mg-order-card-head">
                            <span className="mg-cell-id">{orderId}</span>
                            <span className={statusClass(order?.status)}>
                              {order?.status || "Pending"}
                            </span>
                          </div>

                          <dl>
                            <div className="mg-order-row">
                              <dt>Order Date</dt>
                              <dd>{formatDate(order?.date)}</dd>
                            </div>
                            <div className="mg-order-row">
                              <dt>Total</dt>
                              <dd>${getOrderTotal(order).toFixed(2)}</dd>
                            </div>
                            {isOpen && (
                              <div className="mg-order-row">
                                <dt>Item</dt>
                                <dd>{order?.item || "Order item"}</dd>
                              </div>
                            )}
                          </dl>

                          <div className="mg-order-card-actions">
                            <button
                              type="button"
                              className="mg-btn mg-btn--ghost mg-btn--small"
                              onClick={() => toggleDetails(key)}
                              aria-expanded={isOpen}
                            >
                              {isOpen ? "Hide Details" : "View Details"}
                            </button>
                            <button
                              type="button"
                              className="mg-btn mg-btn--danger mg-btn--small"
                              onClick={() => handleDelete(index)}
                            >
                              Delete
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </main>
        </div>
      </div>
    </section>
  );
}

export default OrderHistory;
