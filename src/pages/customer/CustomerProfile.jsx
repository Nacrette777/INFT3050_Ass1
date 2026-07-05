import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { getCurrentUser, logout } from "../../services/authService";

function CustomerProfile() {
  const navigate  = useNavigate();
  const [user, setUser]       = useState(null);
  const [orderCount, setOrderCount] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);

  useEffect(() => {
    // 读取当前登录用户（来自 authService）
    const currentUser = getCurrentUser();
    if (!currentUser) {
      navigate("/login");
      return;
    }
    setUser(currentUser);

    // 读取该用户的订单统计
    const allOrders = JSON.parse(localStorage.getItem("tradeOrders") || "{}");
    const myOrders  = allOrders[currentUser.username] || [];
    setOrderCount(myOrders.length);
    setCompletedCount(myOrders.filter((o) => o.status === "Completed").length);
    setTotalSpent(
      myOrders
        .filter((o) => o.status === "Completed")
        .reduce((sum, o) => sum + o.total, 0)
    );
  }, [navigate]);

  function handleLogout() {
    logout();           // 调用 authService 的 logout()
    navigate("/login");
  }

  if (!user) return null;

  // 取名字首字母做头像
  const initials = user.name
    ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  return (
    <section>
      <h1>My Account</h1>

      <div className="profile-layout">

        {/* 左侧导航 */}
        <aside className="profile-sidebar">
          <Link to="/customer/profile">
            <button style={{ background: "#1a1a2e", color: "white", width: "100%", marginBottom: "8px" }}>
              My Profile
            </button>
          </Link>
          <Link to="/customer/orders">
            <button style={{ width: "100%", marginBottom: "8px" }}>
              Order History
            </button>
          </Link>
          <button
            onClick={handleLogout}
            style={{ width: "100%", marginBottom: "8px", color: "#b00020", borderColor: "#b00020" }}
          >
            Sign Out
          </button>
        </aside>

        {/* 右侧主内容 */}
        <main>

          {/* 头像 + 基本信息 */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "20px",
              padding: "20px",
              background: "white",
              border: "1px solid #ccc",
              marginBottom: "20px",
            }}
          >
            <div
              style={{
                width: "72px",
                height: "72px",
                borderRadius: "50%",
                background: "#1a1a2e",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.4rem",
                fontWeight: "bold",
                flexShrink: 0,
              }}
            >
              {initials}
            </div>
            <div>
              <h2 style={{ margin: "0 0 4px" }}>{user.name}</h2>
              <p style={{ margin: "0", color: "#666", fontSize: "0.9rem" }}>
                {user.email || user.username}
              </p>
              <span
                style={{
                  display: "inline-block",
                  marginTop: "6px",
                  padding: "2px 10px",
                  background: "#e8f5e9",
                  color: "#2e7d32",
                  border: "1px solid #a5d6a7",
                  borderRadius: "12px",
                  fontSize: "0.75rem",
                  fontWeight: "bold",
                }}
              >
                Trade Member
              </span>
            </div>
          </div>

          {/* 统计数字 */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "12px",
              marginBottom: "20px",
            }}
          >
            {[
              { label: "Total Orders",    value: orderCount },
              { label: "Completed",       value: completedCount },
              { label: "Total Spent",     value: `$${totalSpent.toFixed(2)}` },
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

          {/* 个人信息 */}
          <div
            style={{
              background: "white",
              border: "1px solid #ccc",
              padding: "20px",
              marginBottom: "16px",
            }}
          >
            <h2 style={{ marginTop: 0 }}>Personal Information</h2>
            <p><strong>Name:</strong> {user.name}</p>
            <p><strong>Username:</strong> {user.username}</p>
            <p>
              <strong>Email:</strong>{" "}
              {user.email || user.username}
            </p>
            <p><strong>Role:</strong> {user.role}</p>
          </div>

          {/* 快速跳转 */}
          <Link to="/customer/orders">
            <button style={{ background: "#1a1a2e", color: "white", padding: "10px 20px" }}>
              View Order History →
            </button>
          </Link>

        </main>
      </div>
    </section>
  );
}

export default CustomerProfile;
