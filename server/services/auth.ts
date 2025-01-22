import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config.js";
import { User } from "../types.js";
import { readSiteData, writeSiteData } from "../utils.js";

export async function registerUser(userData: {
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  password: string;
  site: string;
}) {
  const data = await readSiteData(userData.site);

  if (data.users.some((u: User) => u.email === userData.email)) {
    throw new Error("Email already exists");
  }

  const hashedPassword = await bcrypt.hash(userData.password, 10);
  const newUser: User = {
    id: crypto.randomUUID(),
    ...userData,
    password: hashedPassword,
    role: data.users.length === 0 ? "admin" : "user",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  data.users.push(newUser);
  await writeSiteData(userData.site, data);

  const token = jwt.sign(
    { id: newUser.id, email: newUser.email, site: userData.site },
    JWT_SECRET,
  );

  return { token };
}

export async function loginUser(credentials: {
  email: string;
  password: string;
  site: string;
}) {
  const data = await readSiteData(credentials.site);

  const user = data.users.find((u: User) => u.email === credentials.email);
  if (!user || !(await bcrypt.compare(credentials.password, user.password))) {
    throw new Error("Invalid credentials");
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, site: credentials.site },
    JWT_SECRET,
  );

  return { token };
}
