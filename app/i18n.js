(function () {
  const SUPPORTED = ["en", "es", "ca"];
  const LANG_STORAGE_KEY = "editor-estilos:lang";

  function safeParent() {
    try {
      return window.parent || null;
    } catch {
      return null;
    }
  }

  function isInExe() {
    const p = safeParent();
    return Boolean(
      p
      && p !== window
      && typeof p.eXeLearning === "object"
      && typeof p._ === "function"
    );
  }

  function normalizeLang(lang) {
    const clean = String(lang || "").trim().toLowerCase().split("-")[0];
    return SUPPORTED.includes(clean) ? clean : "";
  }

  function getUrlLang() {
    try {
      const params = new URLSearchParams(window.location.search || "");
      return normalizeLang(params.get("lang") || "");
    } catch {
      return "";
    }
  }

  function getStoredLang() {
    try {
      return normalizeLang(window.localStorage.getItem(LANG_STORAGE_KEY) || "");
    } catch {
      return "";
    }
  }

  function getExeLang() {
    try {
      const p = safeParent();
      return normalizeLang(p?.eXeLearning?.app?.locale?.lang || "");
    } catch {
      return "";
    }
  }

  function getBrowserLang() {
    try {
      return normalizeLang((navigator.language || "").split("-")[0]);
    } catch {
      return "";
    }
  }

  function getCatalog(lang) {
    const all = window.$i18n || {};
    return all[lang] || {};
  }

  function applyParams(text, params) {
    let out = String(text || "");
    for (const [k, v] of Object.entries(params || {})) {
      out = out.replaceAll(`{${k}}`, String(v));
    }
    return out;
  }

  const state = {
    lang: "en",
    inExe: false
  };

  function t(key, fallback = "", params = {}) {
    const k = String(key || "").trim();
    if (!k) return applyParams(fallback, params);

    if (state.inExe) {
      try {
        const p = safeParent();
        const exeText = p._(k);
        if (typeof exeText === "string" && exeText && exeText !== k) {
          return applyParams(exeText, params);
        }
      } catch {
        // ignore and continue with local catalogs
      }
    }

    const local = getCatalog(state.lang);
    if (typeof local[k] === "string") return applyParams(local[k], params);

    const en = getCatalog("en");
    if (typeof en[k] === "string") return applyParams(en[k], params);

    return applyParams(fallback || k, params);
  }

  function applyTranslations(root = document) {
    root.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (!key) return;
      const suffix = el.getAttribute("data-i18n-suffix") || "";
      el.textContent = `${t(key, el.textContent || "")}${suffix}`;
    });

    root.querySelectorAll("[data-i18n-title]").forEach((el) => {
      const key = el.getAttribute("data-i18n-title");
      if (!key) return;
      el.setAttribute("title", t(key, el.getAttribute("title") || ""));
    });

    root.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const key = el.getAttribute("data-i18n-placeholder");
      if (!key) return;
      el.setAttribute("placeholder", t(key, el.getAttribute("placeholder") || ""));
    });

    root.querySelectorAll("[data-i18n-aria-label]").forEach((el) => {
      const key = el.getAttribute("data-i18n-aria-label");
      if (!key) return;
      el.setAttribute("aria-label", t(key, el.getAttribute("aria-label") || ""));
    });

    if (document.title) document.title = t("app.title", document.title);
  }

  function syncLanguageSelect() {
    const select = document.getElementById("appLanguageSelect");
    if (!(select instanceof HTMLSelectElement)) return;
    select.value = state.lang;
  }

  function setLang(nextLang, { persist = true, translate = true } = {}) {
    const lang = normalizeLang(nextLang) || "en";
    state.lang = lang;
    document.documentElement.lang = lang;
    if (persist && !state.inExe) {
      try {
        window.localStorage.setItem(LANG_STORAGE_KEY, lang);
      } catch {
        // ignore
      }
    }
    syncLanguageSelect();
    if (translate) applyTranslations(document);
    window.dispatchEvent(new CustomEvent("editor-i18n:changed", { detail: { lang } }));
  }

  function initLanguageSelector() {
    const select = document.getElementById("appLanguageSelect");
    if (!(select instanceof HTMLSelectElement)) return;
    select.hidden = state.inExe;
    const wrap = document.getElementById("appLanguageWrap");
    if (wrap) wrap.hidden = state.inExe;
    select.addEventListener("change", () => setLang(select.value));
    syncLanguageSelect();
  }

  function init() {
    state.inExe = isInExe();
    const lang = state.inExe
      ? (getExeLang() || getUrlLang() || getStoredLang() || getBrowserLang() || "en")
      : (getUrlLang() || getStoredLang() || getBrowserLang() || "en");
    setLang(lang, { persist: false, translate: false });
    initLanguageSelector();
    applyTranslations(document);
  }

  window.EditorI18n = {
    init,
    t,
    setLang,
    getLang: () => state.lang,
    isInExe: () => state.inExe,
    translateDocument: applyTranslations
  };
})();
