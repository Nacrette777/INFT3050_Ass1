import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { getCurrentUser } from "../../services/authService";

function OrderHistory() {
  const navigate = useNavigate();
  const [orders, setOrders]   = useState([]);
  const [user, setUser]       = useState(null);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      navigate("/login");
      return;
    }
    setUser(currentUser);

    // 读取该用户的订单（存在 localStorage 的 "tradeOrders" 里）
    const allOrders = JSON.parse(localStorage.getItem("tradeOrders") || "{}");
    setOrders(allOrders[currentUser.username] || []);
  }, [navigate]);

  function saveOrders(username, updatedOrders) {
    const allOrders = JSON.parse(localStorage.getItem("tradeOrders") || "{}");
    allOrders[username] = updatedOrders;
    localStorage.setItem("tradeOrders", JSON.stringify(allOrders));
    setOrders(updatedOrders);
  }

  function handleDelete(index) {
    if (!window.confirm("Delete this order? This cannot be undone.")) return;
    const updated = orders.filter((_, i) => i !== index);
    saveOrders(user.username, updated);
  }

  // 统计数字
  const totalSpent      = orders.filter((o) => o.status === "Completed").reduce((s, o) => s + o.total, 0);
  const completedCount  = orders.filter((o) => o.status === "Completed").length;

  // 状态对应的颜色
  const statusStyle = {
    Completed:  { color: "#2e7d32", background: "#e8f5e9", border: "1px solid #a5d6a7" },
    Pending:    { color: "#e65100", background: "#fff3e0", border: "1px solid #ffcc80" },
    Processing: { color: "#1565c0", background: "#e3f2fd", border: "1px solid #90caf9" },
  };

  if (!user) return null;

  return (
    <section>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
        <h1 style={{ margin: 0 }}>Order History</h1>
        <Link to="/customer/profile">
          <button>← Back to Profile</button>
        </Link>
      </div>

      {/* 统计卡片 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "12px",
          marginBottom: "24px",
        }}
      >
        {[
          { label: "Total Orders",   value: orders.length },
          { label: "Completed",      value: completedCount },
          { label: "Total Spent",    value: `$${totalSpent.toFixed(2)}` },
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
            <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#1a1a2e" }}>
              {stat.value}
            </div>
            <div style={{ fontSize: "0.8rem", color: "#666", marginTop: "4px" }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* 订单表格 */}
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
            {orders.map((order, index) => (
              <tr key={index}>
                <td style={{ fontWeight: "bold" }}>{order.id}</td>
                <td>{order.item}</td>
                <td>
                  {new Date(order.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </td>
                <td style={{ fontWeight: "bold" }}>${order.total.toFixed(2)}</td>
                <td>
                  <span
                    style={{
                      padding: "2px 10px",
                      borderRadius: "12px",
                      fontSize: "0.8rem",
                      fontWeight: "bold",
                      ...(statusStyle[order.status] || statusStyle.Pending),
                    }}
                  >
                    {order.status}
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
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

export default OrderHistory;
