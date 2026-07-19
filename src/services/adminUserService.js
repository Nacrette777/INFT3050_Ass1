const STORAGE_KEY = "entertainmentGuildUsers";

const defaultUsers = [
  {
    id: "ADM001",
    userId: "ADM001",
    username: "admin",
    fullName: "Admin Account",
    name: "Admin Account",
    email: "admin@entertainmentguild.com",
    password: "adminPW",
    role: "admin",
    isAdmin: true,
    status: "Active",
    createdAt: "2026-06-21",
    updatedAt: "2026-06-21",
  },
  {
    id: "EMP001",
    userId: "EMP001",
    username: "employee",
    fullName: "Employee Account",
    name: "Employee Account",
    email: "employee@entertainmentguild.com",
    password: "employeePW",
    role: "employee",
    isAdmin: false,
    status: "Active",
    createdAt: "2026-06-21",
    updatedAt: "2026-06-21",
  },
];

function canUseLocalStorage() {
  return typeof localStorage !== "undefined";
}

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function normalizeText(value) {
  return value.trim().toLowerCase();
}

function normalizeUser(user) {
  const role = user.role || (user.isAdmin ? "admin" : "employee");
  const id = user.id || user.userId;
  const fullName = user.fullName || user.name || "";

  return {
    ...user,
    id,
    userId: id,
    username: user.username || "",
    fullName,
    name: fullName,
    email: user.email || "",
    role,
    isAdmin: role === "admin",
    status: user.status || "Active",
    createdAt: user.createdAt || getToday(),
    updatedAt: user.updatedAt || user.createdAt || getToday(),
  };
}

function saveUsers(users) {
  if (!canUseLocalStorage()) {
    return;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

function readUsers() {
  if (!canUseLocalStorage()) {
    return defaultUsers;
  }

  const storedUsers = localStorage.getItem(STORAGE_KEY);

  if (!storedUsers) {
    saveUsers(defaultUsers);
    return defaultUsers;
  }

  try {
    const parsedUsers = JSON.parse(storedUsers);

    if (!Array.isArray(parsedUsers)) {
      saveUsers(defaultUsers);
      return defaultUsers;
    }

    return parsedUsers.map(normalizeUser);
  } catch {
    saveUsers(defaultUsers);
    return defaultUsers;
  }
}

function getNextId(role, users) {
  const prefix = role === "admin" ? "ADM" : "EMP";
  const highestNumber = users.reduce((highest, user) => {
    if (!user.id?.startsWith(prefix)) {
      return highest;
    }

    const numericPart = Number(user.id.replace(prefix, ""));

    return Number.isNaN(numericPart) ? highest : Math.max(highest, numericPart);
  }, 0);

  return `${prefix}${String(highestNumber + 1).padStart(3, "0")}`;
}

function countActiveAdmins(users) {
  return users.filter(
    (user) => user.role === "admin" && user.status === "Active"
  ).length;
}

function getUserActivityTime(user) {
  return user.updatedAt || user.createdAt || "No date available";
}

function getSortableActivityTime(user) {
  const timestamp = Date.parse(getUserActivityTime(user));

  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function addUser(data, role) {
  const users = readUsers();

  if (isUsernameTaken(data.username)) {
    return {
      success: false,
      message: "Username is already in use.",
    };
  }

  if (isEmailTaken(data.email)) {
    return {
      success: false,
      message: "Email is already in use.",
    };
  }

  const id = getNextId(role, users);
  const today = getToday();
  const fullName = data.fullName.trim();
  const newUser = {
    id,
    userId: id,
    username: data.username.trim(),
    fullName,
    name: fullName,
    email: data.email.trim(),
    password: data.password,
    role,
    isAdmin: role === "admin",
    status: data.status || "Active",
    createdAt: today,
    updatedAt: today,
  };

  saveUsers([...users, newUser]);

  return {
    success: true,
    user: newUser,
  };
}

export function getAllUsers() {
  return readUsers();
}

export function getEmployees() {
  return readUsers().filter((user) => user.role === "employee");
}

export function getAdmins() {
  return readUsers().filter((user) => user.role === "admin");
}

export function countEmployees() {
  return getEmployees().length;
}

export function countAdmins() {
  return getAdmins().length;
}

export function getDashboardStats() {
  const employees = getEmployees();
  const admins = getAdmins();
  const activeEmployees = employees.filter(
    (employee) => employee.status === "Active"
  ).length;
  const activeAdmins = admins.filter((admin) => admin.status === "Active").length;

  return {
    totalEmployees: employees.length,
    activeEmployees,
    inactiveEmployees: employees.length - activeEmployees,
    totalAdmins: admins.length,
    activeAdmins,
    inactiveAdmins: admins.length - activeAdmins,
    totalManagedUsers: employees.length + admins.length,
  };
}

export function getRecentManagedUsers(limit = 5) {
  return readUsers()
    .filter((user) => user.role === "employee" || user.role === "admin")
    .sort((firstUser, secondUser) => {
      return (
        getSortableActivityTime(secondUser) - getSortableActivityTime(firstUser)
      );
    })
    .slice(0, limit)
    .map((user) => ({
      ...user,
      activityDate: getUserActivityTime(user),
    }));
}

export function addEmployee(data) {
  return addUser(data, "employee");
}

export function addAdmin(data) {
  return addUser(data, "admin");
}

export function updateUser(id, data) {
  const users = readUsers();
  const targetUser = users.find((user) => user.id === id);

  if (!targetUser) {
    return {
      success: false,
      message: "User was not found.",
    };
  }

  if (data.username && isUsernameTaken(data.username, id)) {
    return {
      success: false,
      message: "Username is already in use.",
    };
  }

  if (data.email && isEmailTaken(data.email, id)) {
    return {
      success: false,
      message: "Email is already in use.",
    };
  }

  const updatedUsers = users.map((user) => {
    if (user.id !== id) {
      return user;
    }

    const fullName = data.fullName?.trim() || user.fullName;

    return {
      ...user,
      ...data,
      username: data.username?.trim() || user.username,
      fullName,
      name: fullName,
      email: data.email?.trim() || user.email,
      updatedAt: getToday(),
    };
  });

  saveUsers(updatedUsers);

  return {
    success: true,
    user: updatedUsers.find((user) => user.id === id),
  };
}

export function deleteUser(id) {
  const users = readUsers();
  const targetUser = users.find((user) => user.id === id);

  if (!targetUser) {
    return {
      success: false,
      message: "User was not found.",
    };
  }

  if (
    targetUser.role === "admin" &&
    targetUser.status === "Active" &&
    countActiveAdmins(users) <= 1
  ) {
    return {
      success: false,
      message: "At least one active admin account is required.",
    };
  }

  saveUsers(users.filter((user) => user.id !== id));

  return {
    success: true,
  };
}

export function toggleUserStatus(id) {
  const users = readUsers();
  const targetUser = users.find((user) => user.id === id);

  if (!targetUser) {
    return {
      success: false,
      message: "User was not found.",
    };
  }

  if (
    targetUser.role === "admin" &&
    targetUser.status === "Active" &&
    countActiveAdmins(users) <= 1
  ) {
    return {
      success: false,
      message: "At least one active admin account is required.",
    };
  }

  const updatedUsers = users.map((user) =>
    user.id === id
      ? {
          ...user,
          status: user.status === "Active" ? "Inactive" : "Active",
          updatedAt: getToday(),
        }
      : user
  );

  saveUsers(updatedUsers);

  return {
    success: true,
    user: updatedUsers.find((user) => user.id === id),
  };
}

export function isUsernameTaken(username, excludeId) {
  const normalizedUsername = normalizeText(username);

  return readUsers().some(
    (user) =>
      user.id !== excludeId && normalizeText(user.username) === normalizedUsername
  );
}

export function isEmailTaken(email, excludeId) {
  const normalizedEmail = normalizeText(email);

  return readUsers().some(
    (user) => user.id !== excludeId && normalizeText(user.email) === normalizedEmail
  );
}
