import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config.js";
import { User } from "../types.js";
import { readSiteData, writeSiteData } from "../utils.js";
import { I18n } from "../i18n/index.js";

export async function registerUser(userData: {
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  password: string;
  site: string;
}, i18n: I18n) {
  const data = await readSiteData(userData.site);

  if (data.users.some((u: User) => u.email === userData.email)) {
    throw new Error(i18n.t('auth.emailAlreadyExists'));
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
}, i18n: I18n) {
  if (!credentials.email) {
    throw new Error(i18n.t('auth.emailRequired'));
  }

  if (!credentials.password) {
    throw new Error(i18n.t('auth.passwordRequired'));
  }

  if (!credentials.site) {
    throw new Error(i18n.t('auth.siteRequired'));
  }

  const data = await readSiteData(credentials.site);

  const user = data.users.find((u: User) => u.email === credentials.email);
  if (!user || !(await bcrypt.compare(credentials.password, user.password))) {
    throw new Error(i18n.t('auth.invalidCredentials'));
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, site: credentials.site },
    JWT_SECRET,
  );

  return { token, mustChangePassword: user.mustChangePassword };
}

export async function changeUserPassword(
  userId: string,
  site: string,
  currentPassword: string,
  newPassword: string,
  i18n: I18n
) {
  const data = await readSiteData(site);

  const userIndex = data.users.findIndex((u: User) => u.id === userId);
  if (userIndex === -1) {
    throw new Error(i18n.t('auth.userNotFound'));
  }

  const user = data.users[userIndex];

  const isValidPassword = await bcrypt.compare(currentPassword, user.password);
  if (!isValidPassword) {
    throw new Error(i18n.t('auth.incorrectPassword'));
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  data.users[userIndex] = {
    ...user,
    password: hashedPassword,
    mustChangePassword: false,
    updatedAt: new Date().toISOString(),
  };

  await writeSiteData(site, data);
}