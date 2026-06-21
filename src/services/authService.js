export function getCurrentUser() {
  const user = localStorage.getItem("currentUser");

  if (!user) {
    return null;
  }

  return JSON.parse(user);
}

export function login(username, password) {
  const mockUsers = [
    {
      username: "admin",
      password: "adminPW",
      role: "admin",
      name: "Admin Account",
    },
    {
      username: "employee",
      password: "employeePW",
      role: "employee",
      name: "Employee Account",
    },
    {
      username: "customer",
      password: "customerPW",
      role: "customer",
      name: "John Tan",
    },
  ];

  const foundUser = mockUsers.find(
    (user) => user.username === username && user.password === password
  );

  if (!foundUser) {
    return {
      success: false,
      message: "Invalid username or password.",
    };
  }

  localStorage.setItem("currentUser", JSON.stringify(foundUser));

  return {
    success: true,
    user: foundUser,
  };
}

export function logout() {
  localStorage.removeItem("currentUser");
}