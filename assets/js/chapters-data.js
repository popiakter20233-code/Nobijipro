// ──────────────────────────────────────────────────────────────
// Nobiji Pro — chapter manifest
// Used by all reader pages to know which chapters exist,
// their titles in both languages, and current draft status.
// ──────────────────────────────────────────────────────────────

window.NOBIJI_CHAPTERS = [
  {
    num: "01",
    slug: "01_waking_up",
    titleEn: "Waking Up",
    titleBn: "জাগরণ",
    status: "draft",
    hidRange: "HID-0056 — HID-0058 (+ cross-refs HID-0046, HID-0003)",
    languages: ["en", "bn"]
  },
  {
    num: "02",
    slug: "02_miswak_and_cleanliness",
    titleEn: "Miswak and Cleanliness",
    titleBn: "মিসওয়াক ও পরিচ্ছন্নতা",
    status: "draft",
    hidRange: "HID-0001 — HID-0004, HID-0059 — HID-0061",
    languages: ["en", "bn"]
  },
  {
    num: "03",
    slug: "03_wudu_and_salah",
    titleEn: "Wudu and Preparation for Salah",
    titleBn: "অজু ও সালাতের প্রস্তুতি",
    status: "draft",
    hidRange: "HID-0008 — HID-0010, HID-0040 — HID-0042, HID-0049 — HID-0051, HID-0054 — HID-0055",
    languages: ["en", "bn"]
  },
  {
    num: "04",
    slug: "04_tahajjud_and_fajr",
    titleEn: "Tahajjud and Fajr",
    titleBn: "তাহাজ্জুদ ও ফজর",
    status: "draft",
    hidRange: "HID-0022 — HID-0027",
    languages: ["en", "bn"]
  },
  {
    num: "05",
    slug: "05_food_and_drink",
    titleEn: "Food and Drink",
    titleBn: "পানাহার",
    status: "draft",
    hidRange: "HID-0011 — HID-0014",
    languages: ["en", "bn"]
  },
  {
    num: "06",
    slug: "06_clothing_and_appearance",
    titleEn: "Clothing and Appearance",
    titleBn: "পোশাক ও বেশভূষা",
    status: "draft",
    hidRange: "HID-0019 — HID-0021, HID-0052 — HID-0053",
    languages: ["en", "bn"]
  },
  {
    num: "07",
    slug: "07_speech_and_manners",
    titleEn: "Speech and Manners",
    titleBn: "আদব ও কথা বলা",
    status: "draft",
    hidRange: "HID-0015 — HID-0018, HID-0043 — HID-0045",
    languages: ["en", "bn"]
  },
  {
    num: "08",
    slug: "08_family_life",
    titleEn: "Family Life",
    titleBn: "পারিবারিক জীবন",
    status: "draft",
    hidRange: "HID-0028 — HID-0033",
    languages: ["en", "bn"]
  },
  {
    num: "09",
    slug: "09_social_behavior",
    titleEn: "Social Behavior",
    titleBn: "সামাজিক আচরণ",
    status: "draft",
    hidRange: "HID-0034 — HID-0039",
    languages: ["en", "bn"]
  },
  {
    num: "10",
    slug: "10_evening_and_sleep",
    titleEn: "Evening and Sleep",
    titleBn: "সন্ধ্যা ও ঘুম",
    status: "draft",
    hidRange: "HID-0005 — HID-0007, HID-0046 — HID-0048",
    languages: ["en", "bn"]
  },
  {
    num: "11",
    slug: "11_final_days",
    titleEn: "The Final Days",
    titleBn: "শেষ দিনগুলো",
    status: "empty",
    hidRange: null,
    languages: []
  }
];

window.NOBIJI_LANG_LABELS = {
  en: { name: "English", short: "EN", dir: "ltr" },
  bn: { name: "বাংলা", short: "BN", dir: "ltr" }
};
