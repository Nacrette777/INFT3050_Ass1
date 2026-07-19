import { getAllUsers } from "./adminUserService";

export function getCurrentUser() {
  const user = localStorage.getItem("currentUser");

  if (!user) {
    return null;
  }

  try {
    return JSON.parse(user);
  } catch {
    localStorage.removeItem("currentUser");
    return null;
  }
}

export function login(username, password) {
  const customerUsers = [
    {
      username: "customer",
      password: "customerPW",
      role: "customer",
      name: "John Tan",
    },
  ];

  const foundUser = [...getAllUsers(), ...customerUsers].find(
    (user) => user.username === username && user.password === password
  );

  if (!foundUser) {
    return {
      success: false,
      message: "Invalid username or password.",
    };
  }

  if (foundUser.status === "Inactive") {
    return {
      success: false,
      message: "This account is inactive.",
    };
  }

  const authenticatedUser = {
    id: foundUser.id,
    username: foundUser.username,
    role: foundUser.role,
    isAdmin: foundUser.isAdmin,
    name: foundUser.fullName || foundUser.name,
    email: foundUser.email,
    status: foundUser.status || "Active",
  };

  localStorage.setItem("currentUser", JSON.stringify(authenticatedUser));

  return {
    success: true,
    user: authenticatedUser,
  };
}

export function logout() {
  localStorage.removeItem("currentUser");
}
