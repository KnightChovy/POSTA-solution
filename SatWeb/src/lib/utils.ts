import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const stripHtmlTags = (html: string): string => {
  const text = html.replace(/<[^>]*>/g, "").trim();
  const parser = new DOMParser();
  const decoded = parser.parseFromString(text, "text/html").documentElement
    .textContent;
  return decoded || "";
};

export async function checkSitesFast(satellites) {
  const checks = satellites.map(async (site) => {
    const url = `${site.url}wp-json/wp/v2/media`;
    try {
      const res = await fetch(url, {
        method: "HEAD",
        signal: AbortSignal.timeout(3000),
      }); // timeout 3s
      return { site, ok: res.ok, status: res.status };
    } catch {
      return { site, ok: false, status: "timeout/error" };
    }
  });

  const results = await Promise.allSettled(checks);
  const values = results.map((r) =>
    r.status === "fulfilled" ? r.value : null
  );
  return values;
}
