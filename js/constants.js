// URLs y configuración centralizada

export const CONFIG = {
  instagram: "https://www.instagram.com/h44i2026/",
  instagramHandle: "@h44i2026",
  apiBase: globalThis.APP_CONFIG?.apiBase || "",
};

export const SUBJECTS = {
  scratch: { name: "Scratch", icon: "✏️", priceMin: 10, priceMax: 30, variable: true },
  visual: { name: "Visual", icon: "👁️", priceMin: 20, priceMax: 30, variable: true },
  matematica: { name: "Matemática", icon: "➗", price: 15, variable: false },
  fifu: { name: "Fifu", icon: "📊", price: 15, variable: false },
  quimica: { name: "Química", icon: "🧪", price: 10, variable: false },
  ingles: { name: "Inglés", icon: "🇬🇧", price: 10, variable: false },
};

export const SUBJECT_ARRAY = Object.values(SUBJECTS);
export const SUBJECT_NAMES = Object.keys(SUBJECTS);
