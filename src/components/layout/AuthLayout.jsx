import { Outlet, Link } from "react-router";

function AuthLayout() {
  return (
    <div className="auth-layout">
      <header className="auth-header">
        <Link to="/customer/home">Entertainment Guild</Link>
      </header>

      <main className="auth-main">
        <Outlet />
      </main>
    </div>
  );
}

export default AuthLayout;