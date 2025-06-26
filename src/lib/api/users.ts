import { User } from "../../types/user";
import { API_URL } from "./config";

export async function getUsers(token: string) {
  if (!token) {
    throw new Error("Authentication token is required");
  }

  const response = await fetch(`${API_URL}/users`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Failed to fetch users" }));
    throw new Error(error.message);
  }
  return response.json();
}

export async function createUser(
  token: string,
  userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    mobile: string;
    role: "admin" | "user";
    status: "active" | "inactive";
    site: string;
  },
) {
  if (!token) {
    throw new Error("Authentication token is required");
  }

  const response = await fetch(`${API_URL}/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Failed to create user" }));
    throw new Error(error.message);
  }
  return response.json();
}

export async function updateUser(
  token: string,
  userId: string,
  userData: Partial<User>,
) {
  if (!token) {
    throw new Error("Authentication token is required");
  }

  const response = await fetch(`${API_URL}/users/${userId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Failed to update user" }));
    throw new Error(error.message);
  }
  return response.json();
}

export async function updateAvailabilityException(
  token: string,
  userId: string,
  data: {
    date: string;
    part: "am" | "pm";
    value: boolean;
  },
) {
  if (!token) {
    throw new Error("Authentication token is required");
  }

  const response = await fetch(`${API_URL}/users/${userId}/exceptions`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Failed to update exception" }));
    throw new Error(error.message);
  }
  return response.json();
}

export async function deleteUser(token: string, userId: string) {
  if (!token) {
    throw new Error("Authentication token is required");
  }

  const response = await fetch(`${API_URL}/users/${userId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Failed to delete user" }));
    throw new Error(error.message);
  }
}
