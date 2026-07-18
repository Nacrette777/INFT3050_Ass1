import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { getCurrentUser } from "../../services/authService";

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

function OrderHistory() {
  const navigate = useNavigate();
  // Initialize user and orders before rendering to satisfy the hook lint rules.
  const [user] = useState(() => getCurrentUser());
  const [orders, setOrders] = useState(() =>
    user ? readUserOrders(user.username) : []
  );

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

  const totalSpent = orders
    .filter((order) => order?.status === "Completed")
    .reduce((sum, order) => sum + getOrderTotal(order), 0);
  const completedCount = orders.filter((order) => order?.status === "Completed").length;

  // Status badge colors are kept local because they are only used in this table.
  const statusStyle = {
    Completed: {
      color: "#2e7d32",
      background: "#e8f5e9",
      border: "1px solid #a5d6a7",
    },
    Pending: {
      color: "#e65100",
      background: "#fff3e0",
      border: "1px solid #ffcc80",
    },
    Processing: {
      color: "#1565c0",
      background: "#e3f2fd",
      border: "1px solid #90caf9",
    },
  };

  if (!user) return null;

  return (
    <section>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "20px",
        }}
      >
        <h1 style={{ margin: 0 }}>Order History</h1>
        <Link to="/customer/profile">
          <button>Back to Profile</button>
        </Link>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "12px",
          marginBottom: "24px",
        }}
      >
        {[
          { label: "Total Orders", value: orders.length },
          { label: "Completed", value: completedCount },
          { label: "Total Spent", value: `$${totalSpent.toFixed(2)}` },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              background: "white",
              border: "1px solid #ccc",
              padding: "16px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "1.5rem",
                fontWeight: "bold",
                color: "#1a1a2e",
              }}
            >
              {stat.value}
            </div>
            <div style={{ fontSize: "0.8rem", color: "#666", marginTop: "4px" }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {orders.length === 0 ? (
        <div
          style={{
            background: "white",
            border: "1px solid #ccc",
            padding: "40px",
            textAlign: "center",
            color: "#888",
          }}
        >
          <p style={{ fontSize: "1.1rem" }}>No orders yet.</p>
          <Link to="/customer/products">
            <button style={{ marginTop: "12px" }}>Start Shopping</button>
          </Link>
        </div>
      ) : (
        <table className="basic-table">
          <thead>
            <tr>
              <th>Order #</th>
              <th>Item</th>
              <th>Date</th>
              <th>Total</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order, index) => {
              // Normalize each row so incomplete order records still render.
              const total = getOrderTotal(order);
              const date = order?.date ? new Date(order.date) : null;
              const isValidDate = date && !Number.isNaN(date.getTime());

              return (
                <tr key={order?.id || index}>
                  <td style={{ fontWeight: "bold" }}>{order?.id || `#${index + 1}`}</td>
                  <td>{order?.item || "Order item"}</td>
                  <td>
                    {isValidDate
                      ? date.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "Date unavailable"}
                  </td>
                  <td style={{ fontWeight: "bold" }}>${total.toFixed(2)}</td>
                  <td>
                    <span
                      style={{
                        padding: "2px 10px",
                        borderRadius: "12px",
                        fontSize: "0.8rem",
                        fontWeight: "bold",
                        ...(statusStyle[order?.status] || statusStyle.Pending),
                      }}
                    >
                      {order?.status || "Pending"}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => handleDelete(index)}
                      style={{
                        color: "#b00020",
                        borderColor: "#b00020",
                        background: "none",
                        padding: "4px 10px",
                        fontSize: "0.8rem",
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </section>
  );
}

export default OrderHistory;
