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
