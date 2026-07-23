import { useNavigate } from "react-router";
import { getCurrentUser, logout } from "../../services/authService";

function Header({ systemName }) {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <header className="admin-header">
      <div className="admin-title">{systemName}</div>

      <input type="text" placeholder="Search..." className="admin-search" />

      <div className="admin-user-area">
        <span>{currentUser?.name || "Guest"}</span>
        <button onClick={handleLogout}>Logout</button>
      </div>
    </header>
  );
}

export default Header;