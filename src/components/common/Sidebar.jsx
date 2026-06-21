import { NavLink } from "react-router";

function Sidebar({ links }) {
  return (
    <aside className="sidebar">
      {links.map((link) => (
        <NavLink
          key={link.path}
          to={link.path}
          className={({ isActive }) =>
            isActive ? "sidebar-link active" : "sidebar-link"
          }
        >
          {link.label}
        </NavLink>
      ))}
    </aside>
  );
}

export default Sidebar;