import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { resources } from "./resources";

// Khởi tạo i18n: tự nhận ngôn ngữ từ localStorage/trình duyệt, mặc định Tiếng Việt.
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "vi",
    supportedLngs: ["vi", "en"],
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: "posta-lang",
      caches: ["localStorage"],
    },
    interpolation: { escapeValue: false }, // React đã tự chống XSS
  });

export default i18n;
