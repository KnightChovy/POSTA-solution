import axios from "axios";

// In Vite, environment variables must be prefixed with VITE_ to be accessible in the browser
axios.defaults.baseURL = `${import.meta.env.VITE_API_BASE_URL}`;
export async function loginService(username: string, password: string) {
  const res = await axios.post("/api/auth/login", {
    username,
    password,
  });
  if (res.status !== 200) throw new Error("Login failed");
  return res.data;
}

export async function registerService(
  name: string,
  email: string,
  password: string
) {
  const res = await axios.post("/api/auth/register", {
    name,
    email,
    password,
  });
  if (res.status !== 200) throw new Error("Register failed");
  return res.data;
}

export async function verifyEmailService(token: string) {
  const res = await axios.get("/api/auth/verify-email", {
    params: { token },
  });
  return res.data;
}

export async function resendVerificationService(email: string) {
  const res = await axios.post("/api/auth/resend-verification", { email });
  return res.data;
}

export async function logoutService(refreshToken: string) {
  const res = await axios.post("/api/auth/logout", { refreshToken });
  return res.data;
}

export async function googleLoginService(credential: string) {
  const res = await axios.post("/api/auth/google", { credential });
  return res.data;
}

export async function changePasswordService(
  oldPassword: string,
  newPassword: string
) {
  const res = await axios.post("/api/auth/change-password", {
    oldPassword,
    newPassword,
  });
  return res.data;
}

export async function forgotPasswordService(email: string) {
  const res = await axios.post("/api/auth/forgot-password", { email });
  return res.data;
}

export async function resetPasswordService(token: string, newPassword: string) {
  const res = await axios.post("/api/auth/reset-password", { token, newPassword });
  return res.data;
}

export async function getSessionsService() {
  const res = await axios.get("/api/auth/sessions");
  return res.data;
}

export async function revokeSessionService(id: string) {
  const res = await axios.delete(`/api/auth/sessions/${id}`);
  return res.data;
}
