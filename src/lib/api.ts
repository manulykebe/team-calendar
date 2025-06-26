import { API_URL } from "./api/config";

import { Availability } from "./api/types";


export async function login(email: string, password: string, site: string) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, site }),
  });

  if (!response.ok) throw new Error("Login failed");
  return response.json();
}

export async function register(userData: {
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  password: string;
  site: string;
}) {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });

  if (!response.ok) throw new Error("Registration failed");
  return response.json();
}

export async function updateUserAvailabilitySchedule(
  token: string,
  userId: string,
  index: number,
  schedule: Availability,
) {
  const response = await fetch(`${API_URL}/availability/${userId}/${index}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(schedule),
  });

  if (!response.ok) {
    throw new Error("Failed to update availability");
  }
  return response.json();
}

export async function addUserAvailabilitySchedule(
  token: string,
  userId: string,
  index: number,
  schedule: Availability,
) {
  const response = await fetch(`${API_URL}/availability/${userId}/${index}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(schedule),
  });

  if (!response.ok) {
    throw new Error("Failed to update availability");
  }
  return response.json();
}