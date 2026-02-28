const CORE_REQUIRED = ["config.xml", "style.css", "style.js", "screenshot.png"];
const TEXT_EXTENSIONS = [".css", ".js", ".xml", ".txt", ".html", ".json", ".md"];
const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"];
const DEFAULT_STYLE_JS = `/* style.js autogenerado por el editor para cumplir requisitos mínimos de eXe */\n`;
const LEGACY_COMPAT_MARKERS = ["legacy-v2-v3-compat-v2", "legacy-v2-v3-compat-v3"];
const LEGACY_COMPAT_MARKER = "legacy-v2-v3-compat-v3";
const LEGACY_COMPAT_STYLE_JS = `
/* ${LEGACY_COMPAT_MARKER}: recoloca cabecera, navegación y controles para estilos convertidos desde eXe 2.x */
(function () {
  const toggleBgImageInfoCache = Object.create(null);

  function ensureCompatHelperStyles() {
    if (document.getElementById("legacy-compat-helper-style")) return;
    const style = document.createElement("style");
    style.id = "legacy-compat-helper-style";
    style.textContent = [
      ".legacy-compat-controls{display:flex;align-items:center;flex-wrap:wrap;gap:.5rem .7rem;margin:0 0 .9rem;}",
      ".legacy-compat-controls #exe-client-search{margin:0;}",
      ".legacy-compat-controls .page-counter{margin:0;}",
      ".legacy-compat-controls .nav-buttons{margin-left:auto;display:inline-flex;align-items:center;gap:.5rem;}",
      ".legacy-compat-controls .nav-buttons a{display:inline-flex;align-items:center;justify-content:center;min-width:7rem;min-height:2.1rem;padding:.35rem .8rem;}",
      ".legacy-compat-controls .nav-buttons a span{position:static!important;width:auto!important;height:auto!important;margin:0!important;overflow:visible!important;clip:auto!important;}",
      ".legacy-toggle-fallback{min-width:1.65em;min-height:1.65em;display:inline-flex;align-items:center;justify-content:center;border:1px solid currentColor;border-radius:999px;background:none;padding:0;line-height:1;}",
      ".legacy-toggle-fallback::before{content:'-';font-weight:700;}",
      ".box.minimized .legacy-toggle-fallback::before{content:'+';}",
      ".legacy-toggle-fallback>span{position:absolute;overflow:hidden;clip:rect(0,0,0,0);height:0;width:0;}"
    ].join("");
    document.head.appendChild(style);
  }

  function extractBackgroundImageUrl(backgroundImage) {
    const raw = String(backgroundImage || "").trim();
    if (!raw || raw === "none") return "";
    const start = raw.indexOf("url(");
    if (start < 0) return "";
    const end = raw.indexOf(")", start + 4);
    if (end < 0) return "";
    return raw.slice(start + 4, end).trim().replace(/^["']|["']$/g, "");
  }

  function hasDefaultTopLeftPosition(backgroundPosition) {
    const pos = String(backgroundPosition || "").trim().toLowerCase().replace(/\\s+/g, " ");
    return pos === "0% 0%" || pos === "0px 0px" || pos === "left top";
  }

  function getImageInfo(url, done) {
    if (!url) {
      done(null);
      return;
    }
    if (Object.prototype.hasOwnProperty.call(toggleBgImageInfoCache, url)) {
      done(toggleBgImageInfoCache[url]);
      return;
    }
    const img = new Image();
    img.onload = function () {
      const info = { ok: true, width: img.naturalWidth || 0, height: img.naturalHeight || 0 };
      toggleBgImageInfoCache[url] = info;
      done(info);
    };
    img.onerror = function () {
      const info = { ok: false, width: 0, height: 0 };
      toggleBgImageInfoCache[url] = info;
      done(info);
    };
    img.src = url;
  }

  function applyToggleFallbackIcons() {
    ensureCompatHelperStyles();
    const toggles = document.querySelectorAll(".box-toggle");
    toggles.forEach((toggle) => {
      const computed = window.getComputedStyle(toggle);
      const bgImage = String(computed.backgroundImage || "").trim();
      if (!bgImage || bgImage === "none") {
        toggle.classList.add("legacy-toggle-fallback");
        return;
      }

      const bgUrl = extractBackgroundImageUrl(bgImage);
      if (!bgUrl) {
        toggle.classList.remove("legacy-toggle-fallback");
        return;
      }

      getImageInfo(bgUrl, function (info) {
        if (!info || !info.ok) {
          toggle.classList.add("legacy-toggle-fallback");
          return;
        }

        const bgSize = String(computed.backgroundSize || "").trim().toLowerCase();
        const hasExplicitBgSize = bgSize && bgSize !== "auto" && bgSize !== "auto auto";
        if (hasExplicitBgSize) {
          toggle.classList.remove("legacy-toggle-fallback");
          return;
        }

        const width = Math.max(toggle.clientWidth, Math.round(parseFloat(computed.width) || 0), 16);
        const height = Math.max(toggle.clientHeight, Math.round(parseFloat(computed.height) || 0), 16);
        const looksLikeSprite = info.width >= width * 3 || info.height >= height * 3;
        const defaultPosition = hasDefaultTopLeftPosition(computed.backgroundPosition);
        if (looksLikeSprite && defaultPosition) {
          toggle.classList.add("legacy-toggle-fallback");
        } else {
          toggle.classList.remove("legacy-toggle-fallback");
        }
      });
    });
  }

  function firstMatch(root, selectors) {
    for (const selector of selectors) {
      const node = root.querySelector(selector);
      if (node) return node;
    }
    return null;
  }

  function ensureLegacyMainWrapper(main) {
    if (!main) return null;
    const existingWrapper = main.querySelector(":scope > #main-wrapper");
    if (existingWrapper) {
      let existingMain = existingWrapper.querySelector(":scope > #main");
      if (!existingMain) {
        existingMain = document.createElement("div");
        existingMain.id = "main";
        while (existingWrapper.firstChild) {
          existingMain.appendChild(existingWrapper.firstChild);
        }
        existingWrapper.appendChild(existingMain);
      }
      return { wrapper: existingWrapper, inner: existingMain };
    }
    const wrapper = document.createElement("div");
    wrapper.id = "main-wrapper";
    const inner = document.createElement("div");
    inner.id = "main";
    wrapper.appendChild(inner);
    main.appendChild(wrapper);
    return { wrapper, inner };
  }

  function ensureControlsRow(container) {
    let controls = container.querySelector(":scope > .legacy-compat-controls");
    if (controls) return controls;
    controls = document.createElement("div");
    controls.className = "legacy-compat-controls";
    container.insertBefore(controls, container.firstChild);
    return controls;
  }

  function moveInto(parent, node) {
    if (!parent || !node) return;
    if (node.parentElement === parent) return;
    parent.appendChild(node);
  }

  function syncMainWrapperMinHeight(host, wrapper) {
    if (!host || !wrapper) return;
    const nav = firstMatch(host, [":scope > #siteNav", "#siteNav"]);
    if (!nav) return;
    const navHeight = Math.max(
      nav.getBoundingClientRect ? Math.round(nav.getBoundingClientRect().height) : 0,
      nav.offsetHeight || 0,
      nav.scrollHeight || 0
    );
    if (navHeight > 0) {
      wrapper.style.minHeight = (navHeight + 25) + "px";
    }
  }

  function rectBottom(node) {
    if (!node || !node.getBoundingClientRect) return 0;
    const rect = node.getBoundingClientRect();
    return Number.isFinite(rect.bottom) ? rect.bottom : 0;
  }

  function getHeaderVisualBottom(header) {
    if (!header) return 0;
    let bottom = rectBottom(header);
    const title = header.querySelector(".package-title");
    const subtitle = header.querySelector(".package-subtitle");
    bottom = Math.max(bottom, rectBottom(title), rectBottom(subtitle));
    return bottom;
  }

  function ensureHeaderNavSpacing(host) {
    if (!host) return;
    const header = firstMatch(host, [":scope > .package-header", ".package-header"]);
    const nav = firstMatch(host, [":scope > #siteNav", "#siteNav"]);
    if (!header || !nav) return;
    const navComputed = window.getComputedStyle(nav);
    if (navComputed.display === "none") return;

    let baseMarginTop = Number.parseFloat(nav.dataset.legacyBaseMarginTop || "");
    if (!Number.isFinite(baseMarginTop)) {
      baseMarginTop = Number.parseFloat(navComputed.marginTop || "0") || 0;
      nav.dataset.legacyBaseMarginTop = String(baseMarginTop);
    }
    nav.style.marginTop = baseMarginTop + "px";

    const headerBottom = getHeaderVisualBottom(header);
    const navRect = nav.getBoundingClientRect();
    if (!navRect) return;
    const currentGap = navRect.top - headerBottom;
    const minGap = 14;
    if (Number.isFinite(currentGap) && currentGap < minGap) {
      const extra = minGap - currentGap;
      nav.style.marginTop = Math.max(0, baseMarginTop + extra) + "px";
    }
  }

  function relocateLegacyLayout() {
    const mains = document.querySelectorAll(".exe-content main.page");
    mains.forEach((main) => {
      const host = main.closest(".exe-content");
      if (!host) return;
      const layout = ensureLegacyMainWrapper(main);
      if (!layout) return;
      const { wrapper, inner } = layout;

      const nav = firstMatch(host, [":scope > #siteNav", "#siteNav"]);
      const packageHeader = firstMatch(main, [":scope > .package-header", ".package-header"])
        || firstMatch(host, [":scope > .package-header"]);
      if (packageHeader) {
        host.insertBefore(packageHeader, nav || main);
      }

      const controls = ensureControlsRow(inner);
      const search = firstMatch(main, [":scope > #exe-client-search", "#exe-client-search"]);
      const pageCounter = firstMatch(main, [":scope > .page-counter", ".page-counter"]);
      const navButtons = firstMatch(host, [":scope > .nav-buttons", ".nav-buttons"]);
      moveInto(controls, search);
      moveInto(controls, pageCounter);
      moveInto(controls, navButtons);
      if (!controls.children.length) controls.remove();

      const pageHeader = firstMatch(main, [":scope > .page-header", ".page-header"]);
      if (pageHeader) {
        const firstChild = inner.firstElementChild;
        const target = (firstChild && firstChild.classList.contains("legacy-compat-controls"))
          ? firstChild.nextSibling
          : inner.firstChild;
        inner.insertBefore(pageHeader, target);
      }

      const mainContent = firstMatch(main, [":scope > [id^='page-content-']", ":scope > .page-content", "[id^='page-content-']", ".page-content"]);
      if (mainContent && mainContent.parentElement !== inner) {
        inner.appendChild(mainContent);
      }

      const looseContent = main.querySelectorAll(":scope > .page-content, :scope > [id^='page-content-']");
      looseContent.forEach((block) => {
        if (block.parentElement !== inner) inner.appendChild(block);
      });

      if (wrapper.parentElement !== main) {
        main.appendChild(wrapper);
      }
      syncMainWrapperMinHeight(host, wrapper);
      ensureHeaderNavSpacing(host);

      const oldHeader = firstMatch(main, [":scope > header.main-header", ":scope > header.page-header", ":scope > .main-header"]);
      if (oldHeader && !oldHeader.querySelector(".package-header, .page-header, .page-counter, #exe-client-search")) {
        const text = (oldHeader.textContent || "").trim();
        if (!text) oldHeader.remove();
      }
    });
    applyToggleFallbackIcons();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", relocateLegacyLayout, { once: true });
  } else {
    relocateLegacyLayout();
  }
  window.addEventListener("load", relocateLegacyLayout, { once: true });
  setTimeout(relocateLegacyLayout, 250);
  setTimeout(relocateLegacyLayout, 900);
  document.addEventListener("click", function (ev) {
    const target = ev && ev.target;
    if (!(target instanceof Element)) return;
    if (!target.closest(".box-toggle")) return;
    setTimeout(applyToggleFallbackIcons, 0);
  });
})();
`.trim();
const MIN_SCREENSHOT_PNG_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO7+3xkAAAAASUVORK5CYII=";
const QUICK_PROTECTED_PATTERNS = [
  { re: /\.box-toggle\b/i, label: ".box-toggle" },
  { re: /#siteNavToggler\b/i, label: "#siteNavToggler" },
  { re: /#searchBarTogger\b/i, label: "#searchBarTogger" },
  { re: /\.nav-buttons\b/i, label: ".nav-buttons" }
];
const TRIAL_NOTICE_KEY = "editor-estilos:trial-notice-dismissed";
const PREVIEW_TOGGLES_KEY = "editor-estilos:preview-toggles";
const PREVIEW_FRAME_URL = "about:blank";
const DEFAULT_BOOT_ELPX_URL = "assets/ejemplo.elpx";
const CLICK_OVERRIDES_START = "/* click-overrides:start */";
const CLICK_OVERRIDES_END = "/* click-overrides:end */";
const UNDO_STACK_LIMIT = 30;
const ELPX_SW_URL = "elpx-sw.js";
const APP_BASE_PATH = (() => {
  try {
    const path = new URL(".", window.location.href).pathname || "/";
    return path.endsWith("/") ? path : `${path}/`;
  } catch {
    return "/";
  }
})();
const ELPX_URL_PREFIX = `${APP_BASE_PATH}__elpx/`;
const ELPX_CACHE_PREFIX = "editor-estilos:elpx:";

function i18nText(key, fallback, params = {}) {
  const i18n = window.EditorI18n;
  if (i18n && typeof i18n.t === "function") return i18n.t(key, fallback, params);
  return fallback;
}

function alertT(key, fallback, params = {}) {
  window.alert(i18nText(key, fallback, params));
}

function confirmT(key, fallback, params = {}) {
  return window.confirm(i18nText(key, fallback, params));
}

function setStatusT(key, fallback, params = {}) {
  setStatus(i18nText(key, fallback, params));
}

const FILE_TYPE_OPTIONS = [
  { value: "images", key: "files.type.images", label: "Imágenes" },
  { value: "css", key: "files.type.css", label: "CSS" },
  { value: "js", key: "files.type.js", label: "JavaScript" },
  { value: "xml", key: "files.type.xml", label: "XML" },
  { value: "fonts", key: "files.type.fonts", label: "Fuentes" },
  { value: "text", key: "files.type.text", label: "Texto" },
  { value: "json", key: "files.type.json", label: "JSON" },
  { value: "html", key: "files.type.html", label: "HTML" },
  { value: "markdown", key: "files.type.markdown", label: "Markdown" },
  { value: "other", key: "files.type.other", label: "Otros" }
];

const QUICK_DEFAULTS = {
  linkColor: "#d76b4a",
  titleColor: "#078e8e",
  textColor: "#333333",
  contentBgColor: "#ffffff",
  pageBgColor: "#ffffff",
  contentOuterBgColor: "#eef1f4",
  contentWidthMode: "default",
  contentWidth: 1280,
  contentWidthPercent: 100,
  contentCentered: true,
  fontBody: "Georgia, 'Times New Roman', serif",
  fontTitles: "Georgia, 'Times New Roman', serif",
  fontMenu: "Georgia, 'Times New Roman', serif",
  baseFontSize: 18,
  lineHeight: 1.45,
  pageTitleSize: 1.7,
  pageTitleWeight: "700",
  pageTitleUppercase: false,
  pageTitleLetterSpacing: 0,
  pageTitleMarginBottom: 0.6,
  packageTitleSize: 1.25,
  packageTitleColor: "#333333",
  packageTitleWeight: "400",
  boxTitleSize: 1.5,
  boxTitleGap: 10,
  menuBgColor: "#f6f6f6",
  menuTextColor: "#000000",
  menuActiveBgColor: "#ffffff",
  menuActiveTextColor: "#d76b4a",
  boxBgColor: "#ffffff",
  boxBorderColor: "#dddddd",
  boxTitleColor: "#054d4d",
  boxTextAlign: "inherit",
  boxFontSize: "inherit",
  buttonBgColor: "#005f73",
  buttonTextColor: "#ffffff",
  bgImageEnabled: false,
  bgImagePath: "",
  bgImageRepeat: "no-repeat",
  bgImageSoftness: 35,
  headerImageEnabled: false,
  headerHideTitle: false,
  headerImagePath: "",
  headerImageHeight: 120,
  headerImageFit: "contain",
  headerImagePosition: "center center",
  headerImageRepeat: "no-repeat",
  footerImageEnabled: false,
  footerImagePath: "",
  footerImageHeight: 90,
  footerImageFit: "contain",
  footerImagePosition: "center center",
  footerImageRepeat: "no-repeat",
  navIconPrevPath: "",
  navIconNextPath: "",
  navIconMenuPath: "",
  logoEnabled: false,
  logoPath: "",
  logoSize: 130,
  logoPosition: "top-right",
  logoMarginX: 20,
  logoMarginY: 14
};
const BOX_FONT_SIZE_OPTIONS = ["inherit", "14px", "16px", "18px", "20px", "22px", "24px"];
const CONTENT_WIDTH_MODE_OPTIONS = ["default", "px", "percent", "mixed"];

const PREVIEW_DEFAULTS = {
  showSearch: true,
  showPageCounter: true,
  showNavButtons: true,
  navCollapsed: false,
  showPackageTitle: true,
  showPageTitle: true,
  collapseIdevices: false
};
const HIGHLIGHT_BY_FILE_GROUP = {
  css: "css",
  js: "javascript",
  xml: "xml",
  json: "json",
  html: "xml",
  markdown: "markdown"
};
const CONTROL_HELP_IDS = [
  "addBgImageBtn",
  "removeBgImageBtn",
  "bgImageSelect",
  "addFontBtn",
  "addLogoBtn",
  "removeLogoBtn",
  "showAllStyleImages",
  "headerImageSelect",
  "addHeaderImageBtn",
  "removeHeaderImageBtn",
  "footerImageSelect",
  "addFooterImageBtn",
  "removeFooterImageBtn",
  "navPrevIconSelect",
  "navNextIconSelect",
  "navMenuIconSelect",
  "addNavPrevIconBtn",
  "addNavNextIconBtn",
  "addNavMenuIconBtn",
  "addIdeviceIconsBtn",
  "elpxPickBtn",
  "exportElpxBtn",
  "previewInspectBtn",
  "undoBtn",
  "redoBtn",
  "openDetachedEditorBtn"
];

const DELIVERY_MODE_BODY_SELECTORS = ["body.exe-web-site", "body.exe-ims", "body.exe-scorm"];
const DELIVERY_MODE_SCOPE_SELECTORS = [".exe-web-site", ".exe-ims", ".exe-scorm"];

function joinSelectorList(selectors = []) {
  return selectors.filter(Boolean).join(",\n");
}

function modeBodySelectors(suffix = "") {
  return joinSelectorList(DELIVERY_MODE_BODY_SELECTORS.map((selector) => `${selector}${suffix}`));
}

function modeScopedSelectors(targetSelectors = []) {
  const targets = Array.isArray(targetSelectors) ? targetSelectors : [targetSelectors];
  const scoped = [];
  for (const target of targets) {
    for (const scope of DELIVERY_MODE_SCOPE_SELECTORS) {
      scoped.push(`${scope} ${target}`);
    }
  }
  return joinSelectorList(scoped);
}

function applyTooltipToControl(target, text) {
  if (!(target instanceof HTMLElement)) return;
  let resolved = String(text || "").trim();
  if (!resolved) {
    resolved = (
      target.getAttribute("aria-label")
      || target.getAttribute("title")
      || ""
    ).trim();
  }
  if (!resolved && target.id) {
    const linked = document.querySelector(`label[for="${target.id}"]`);
    if (linked instanceof HTMLElement) resolved = linked.textContent?.trim() || "";
  }
  if (!resolved) {
    const wrapLabel = target.closest("label");
    if (wrapLabel instanceof HTMLElement) resolved = wrapLabel.textContent?.trim() || "";
  }
  if (!resolved) {
    const toggleLabel = target.closest(".toggle-item")?.querySelector(".toggle-label");
    if (toggleLabel instanceof HTMLElement) resolved = toggleLabel.textContent?.trim() || "";
  }
  if (!resolved) resolved = target.textContent?.trim() || "";
  if (!resolved) return;
  target.title = resolved;
  if (target.id) {
    const linked = document.querySelector(`label[for="${target.id}"]`);
    if (linked instanceof HTMLElement) linked.title = resolved;
  }
  const wrapLabel = target.closest("label");
  if (wrapLabel instanceof HTMLElement) wrapLabel.title = resolved;
  const toggleItem = target.closest(".toggle-item");
  if (toggleItem instanceof HTMLElement) toggleItem.title = resolved;
}

function applyControlTooltips() {
  for (const input of els.quickInputs) {
    applyTooltipToControl(input);
  }
  for (const input of els.previewInputs) {
    applyTooltipToControl(input);
  }
  for (const id of CONTROL_HELP_IDS) {
    const target = document.getElementById(id);
    applyTooltipToControl(target);
  }
}

const els = {
  appShell: document.getElementById("appShell"),
  editorPanel: document.getElementById("editorPanel"),
  previewPanel: document.getElementById("previewPanel"),
  busyOverlay: document.getElementById("busyOverlay"),
  busyOverlayText: document.getElementById("busyOverlayText"),
  trialNotice: document.getElementById("trialNotice"),
  dismissTrialNotice: document.getElementById("dismissTrialNotice"),
  tabs: Array.from(document.querySelectorAll(".tab")),
  panels: Array.from(document.querySelectorAll(".tab-panel")),
  officialStyleSelect: document.getElementById("officialStyleSelect"),
  officialPreview: document.getElementById("officialPreview"),
  zipPickBtn: document.getElementById("zipPickBtn"),
  zipInput: document.getElementById("zipInput"),
  zipInputName: document.getElementById("zipInputName"),
  elpxPickBtn: document.getElementById("elpxPickBtn"),
  elpxInput: document.getElementById("elpxInput"),
  elpxInputName: document.getElementById("elpxInputName"),
  exportBtn: document.getElementById("exportBtn"),
  exportElpxBtn: document.getElementById("exportElpxBtn"),
  undoBtn: document.getElementById("undoBtn"),
  redoBtn: document.getElementById("redoBtn"),
  status: document.getElementById("status"),
  fileList: document.getElementById("fileList"),
  fileTypeFilter: document.getElementById("fileTypeFilter"),
  fileNameFilter: document.getElementById("fileNameFilter"),
  editorPath: document.getElementById("editorPath"),
  editorSurface: document.getElementById("editorSurface"),
  imageActions: document.getElementById("imageActions"),
  addFontBtn: document.getElementById("addFontBtn"),
  addFontInput: document.getElementById("addFontInput"),
  replaceImageBtn: document.getElementById("replaceImageBtn"),
  replaceImageInput: document.getElementById("replaceImageInput"),
  openDetachedEditorBtn: document.getElementById("openDetachedEditorBtn"),
  textEditor: document.getElementById("textEditor"),
  textHighlight: document.getElementById("textHighlight"),
  binaryPreview: document.getElementById("binaryPreview"),
  previewFrame: document.getElementById("previewFrame"),
  previewInspectBtn: document.getElementById("previewInspectBtn"),
  clickEditModal: document.getElementById("clickEditModal"),
  clickEditCard: document.querySelector("#clickEditModal .modal-card"),
  clickEditTitle: document.getElementById("clickEditTitle"),
  clickEditSelector: document.getElementById("clickEditSelector"),
  clickPropColor: document.getElementById("clickPropColor"),
  clickPropBg: document.getElementById("clickPropBg"),
  clickTextColorWrap: document.getElementById("clickTextColorWrap"),
  clickPropColorAlpha: document.getElementById("clickPropColorAlpha"),
  clickPropBgAlpha: document.getElementById("clickPropBgAlpha"),
  clickTextAlphaWrap: document.getElementById("clickTextAlphaWrap"),
  clickPropFontSize: document.getElementById("clickPropFontSize"),
  clickPropFontWeight: document.getElementById("clickPropFontWeight"),
  clickTextSizeWrap: document.getElementById("clickTextSizeWrap"),
  clickTextWeightWrap: document.getElementById("clickTextWeightWrap"),
  clickPropWidth: document.getElementById("clickPropWidth"),
  clickPropMaxWidth: document.getElementById("clickPropMaxWidth"),
  clickPropMarginBottom: document.getElementById("clickPropMarginBottom"),
  clickPropPadding: document.getElementById("clickPropPadding"),
  clickApplyInteractiveWrap: document.getElementById("clickApplyInteractiveWrap"),
  clickApplyInteractiveStates: document.getElementById("clickApplyInteractiveStates"),
  clickEditApplyBtn: document.getElementById("clickEditApplyBtn"),
  clickEditCancelBtn: document.getElementById("clickEditCancelBtn"),
  exportRenameModal: document.getElementById("exportRenameModal"),
  exportRenameNameInput: document.getElementById("exportRenameNameInput"),
  exportRenameTitleInput: document.getElementById("exportRenameTitleInput"),
  exportRenameHelp: document.getElementById("exportRenameHelp"),
  exportRenameConfirmBtn: document.getElementById("exportRenameConfirmBtn"),
  exportRenameCancelBtn: document.getElementById("exportRenameCancelBtn"),
  metaName: document.getElementById("metaName"),
  metaTitle: document.getElementById("metaTitle"),
  metaVersion: document.getElementById("metaVersion"),
  metaCompatibility: document.getElementById("metaCompatibility"),
  metaAuthor: document.getElementById("metaAuthor"),
  metaLicense: document.getElementById("metaLicense"),
  metaLicenseUrl: document.getElementById("metaLicenseUrl"),
  metaDescription: document.getElementById("metaDescription"),
  metaDownloadable: document.getElementById("metaDownloadable"),
  addLogoBtn: document.getElementById("addLogoBtn"),
  removeLogoBtn: document.getElementById("removeLogoBtn"),
  addLogoInput: document.getElementById("addLogoInput"),
  addBgImageBtn: document.getElementById("addBgImageBtn"),
  removeBgImageBtn: document.getElementById("removeBgImageBtn"),
  addBgImageInput: document.getElementById("addBgImageInput"),
  bgImageSelect: document.getElementById("bgImageSelect"),
  bgImageInfo: document.getElementById("bgImageInfo"),
  addHeaderImageBtn: document.getElementById("addHeaderImageBtn"),
  removeHeaderImageBtn: document.getElementById("removeHeaderImageBtn"),
  addHeaderImageInput: document.getElementById("addHeaderImageInput"),
  headerImageSelect: document.getElementById("headerImageSelect"),
  showAllStyleImages: document.getElementById("showAllStyleImages"),
  headerImageInfo: document.getElementById("headerImageInfo"),
  addFooterImageBtn: document.getElementById("addFooterImageBtn"),
  removeFooterImageBtn: document.getElementById("removeFooterImageBtn"),
  addFooterImageInput: document.getElementById("addFooterImageInput"),
  footerImageSelect: document.getElementById("footerImageSelect"),
  footerImageInfo: document.getElementById("footerImageInfo"),
  navPrevIconSelect: document.getElementById("navPrevIconSelect"),
  navNextIconSelect: document.getElementById("navNextIconSelect"),
  navMenuIconSelect: document.getElementById("navMenuIconSelect"),
  addNavPrevIconBtn: document.getElementById("addNavPrevIconBtn"),
  addNavNextIconBtn: document.getElementById("addNavNextIconBtn"),
  addNavMenuIconBtn: document.getElementById("addNavMenuIconBtn"),
  addNavPrevIconInput: document.getElementById("addNavPrevIconInput"),
  addNavNextIconInput: document.getElementById("addNavNextIconInput"),
  addNavMenuIconInput: document.getElementById("addNavMenuIconInput"),
  navIconsInfo: document.getElementById("navIconsInfo"),
  addIdeviceIconsBtn: document.getElementById("addIdeviceIconsBtn"),
  addIdeviceIconsInput: document.getElementById("addIdeviceIconsInput"),
  logoInfo: document.getElementById("logoInfo"),
  quickInputs: Array.from(document.querySelectorAll("[data-quick]")),
  previewInputs: Array.from(document.querySelectorAll("[data-preview]"))
};

const state = {
  files: new Map(),
  templateFiles: new Set(),
  baseFiles: new Set(),
  officialStyles: [],
  selectedOfficialStyleId: "",
  officialSourceId: "",
  activePath: "style.css",
  blobUrls: new Map(),
  quick: { ...QUICK_DEFAULTS },
  preview: { ...PREVIEW_DEFAULTS },
  previewLayoutMode: "modern",
  previewFromLegacyZip: false,
  previewPendingRender: false,
  previewLastElpxCss: "",
  elpxMode: false,
  elpxSessionId: "",
  elpxCacheName: "",
  elpxOriginalName: "",
  elpxFiles: new Map(),
  elpxThemePrefix: "theme/",
  elpxThemeFiles: new Set(),
  elpxThemeSyncTimer: 0,
  clickEditMode: false,
  clickEditTargetSelector: "",
  clickEditFrameDoc: null,
  clickEditDragActive: false,
  clickEditDragOffsetX: 0,
  clickEditDragOffsetY: 0,
  clickEditIgnoreUntil: 0,
  clickEditHasText: true,
  clickEditBgInitiallyTransparent: false,
  clickEditProfile: null,
  clickEditTouchedFields: {},
  undoStack: [],
  redoStack: [],
  isRestoringUndo: false,
  isDirty: false
};
let highlightRenderRaf = 0;
const detachedEditor = {
  win: null,
  path: ""
};

function markDirty() {
  state.isDirty = true;
}

function clearDirty() {
  state.isDirty = false;
}

function updateHistoryButtonsState() {
  if (!els.undoBtn) return;
  els.undoBtn.disabled = state.undoStack.length < 1;
  if (els.redoBtn) els.redoBtn.disabled = state.redoStack.length < 1;
}

function clearUndoHistory() {
  state.undoStack = [];
  state.redoStack = [];
  updateHistoryButtonsState();
}

function snapshotFilesMap() {
  return new Map(Array.from(state.files.entries(), ([path, bytes]) => [path, cloneBytes(bytes)]));
}

function pushUndoSnapshot() {
  if (state.isRestoringUndo) return;
  state.undoStack.push({
    files: snapshotFilesMap(),
    templateFiles: Array.from(state.templateFiles),
    baseFiles: Array.from(state.baseFiles),
    selectedOfficialStyleId: state.selectedOfficialStyleId,
    officialSourceId: state.officialSourceId,
    activePath: state.activePath
  });
  if (state.undoStack.length > UNDO_STACK_LIMIT) state.undoStack.shift();
  state.redoStack = [];
  updateHistoryButtonsState();
}

function captureEditorSnapshot() {
  return {
    files: snapshotFilesMap(),
    templateFiles: Array.from(state.templateFiles),
    baseFiles: Array.from(state.baseFiles),
    selectedOfficialStyleId: state.selectedOfficialStyleId,
    officialSourceId: state.officialSourceId,
    activePath: state.activePath
  };
}

async function restoreEditorSnapshot(snapshot) {
  if (!snapshot) return;
  invalidateAllBlobs();
  state.files = new Map(Array.from(snapshot.files.entries(), ([path, bytes]) => [path, cloneBytes(bytes)]));
  state.templateFiles = new Set(snapshot.templateFiles || []);
  state.baseFiles = new Set(snapshot.baseFiles || []);
  state.selectedOfficialStyleId = snapshot.selectedOfficialStyleId || state.selectedOfficialStyleId;
  state.officialSourceId = snapshot.officialSourceId || "";
  state.activePath = state.files.has(snapshot.activePath)
    ? snapshot.activePath
    : (state.files.has("style.css") ? "style.css" : listFilesSorted()[0] || "");

  renderOfficialStylesSelect();
  refreshFileTypeFilterOptions();
  renderFileList();
  syncEditorWithActiveFile();
  refreshQuickControls();
  refreshMetaFields();

  if (state.elpxMode) {
    await syncThemeFilesToElpxCache({ replaceTheme: true });
    reloadElpxPreviewPage();
    setElpxModeUi();
  }
  renderPreview();
  markDirty();
}

async function undoLastChange() {
  if (!state.undoStack.length) {
    setStatusT("status.nothingToUndo", "No hay cambios para deshacer.");
    return;
  }
  const previous = state.undoStack.pop();
  state.redoStack.push(captureEditorSnapshot());
  if (state.redoStack.length > UNDO_STACK_LIMIT) state.redoStack.shift();
  updateHistoryButtonsState();
  state.isRestoringUndo = true;
  try {
    await restoreEditorSnapshot(previous);
    setStatusT("status.undoApplied", "Último cambio deshecho.");
  } finally {
    state.isRestoringUndo = false;
  }
}

async function redoLastChange() {
  if (!state.redoStack.length) {
    setStatusT("status.nothingToRedo", "No hay cambios para rehacer.");
    return;
  }
  const next = state.redoStack.pop();
  state.undoStack.push(captureEditorSnapshot());
  if (state.undoStack.length > UNDO_STACK_LIMIT) state.undoStack.shift();
  updateHistoryButtonsState();
  state.isRestoringUndo = true;
  try {
    await restoreEditorSnapshot(next);
    setStatusT("status.redoApplied", "Cambio rehecho.");
  } finally {
    state.isRestoringUndo = false;
  }
}

function confirmDiscardUnsavedChanges(contextLabel = "cargar otro estilo") {
  if (!state.isDirty) return true;
  return confirmT(
    "confirm.discardUnsaved",
    `Hay cambios sin exportar. Antes de ${contextLabel}, exporta un ZIP para no perderlos.\n\n¿Continuar y descartar cambios?`,
    { contextLabel }
  );
}

function focusMetadataForRename({ preferTitle = false } = {}) {
  const projectTab = els.tabs.find((t) => t.dataset.tab === "io");
  if (projectTab) {
    for (const t of els.tabs) t.classList.toggle("active", t === projectTab);
    for (const p of els.panels) p.classList.toggle("active", p.dataset.panel === "io");
  }
  const metaDetails = document.getElementById("metaDetails");
  if (metaDetails) metaDetails.scrollIntoView({ behavior: "smooth", block: "start" });
  const target = preferTitle ? els.metaTitle : els.metaName;
  if (target) {
    target.focus();
    target.select();
  }
}

function officialMetadataConflict() {
  const currentNameRaw = String(els.metaName?.value || "").trim();
  const currentTitleRaw = String(els.metaTitle?.value || "").trim();
  const currentName = currentNameRaw.toLowerCase();
  const currentTitle = currentTitleRaw.toLowerCase();

  let officialId = state.officialSourceId;
  if (!officialId && (currentName || currentTitle)) {
    // Infer official source from current metadata when opening an ELPX directly.
    const byName = state.officialStyles.find((style) => String(style.id || "").trim().toLowerCase() === currentName);
    if (byName) officialId = byName.id;
    else {
      const byTitle = state.officialStyles.find((style) => {
        const title = String(style?.meta?.title || "").trim().toLowerCase();
        return Boolean(title && title === currentTitle);
      });
      if (byTitle) officialId = byTitle.id;
    }
  }
  if (!officialId) return false;

  const official = getOfficialStyleById(officialId);
  const officialName = String(officialId || "").trim().toLowerCase();
  const officialTitle = String(official?.meta?.title || "").trim().toLowerCase();
  const nameEqual = Boolean(currentName && officialName && currentName === officialName);
  const titleEqual = Boolean(currentTitle && officialTitle && currentTitle === officialTitle);
  return { nameEqual, titleEqual, hasConflict: nameEqual || titleEqual, officialId };
}

function blockExportForOfficialMetadataConflict(targetLabel = "exportar") {
  const officialConflict = officialMetadataConflict();
  if (!officialConflict.hasConflict) return false;
  const fields = [];
  if (officialConflict.nameEqual) fields.push("Nombre");
  if (officialConflict.titleEqual) fields.push("Título");
  const fieldsText = fields.join(" y ");
  setStatusT(
    "status.officialConflict.blocked",
    `Debes cambiar ${fieldsText} del estilo en Metadatos antes de ${targetLabel} para no sobrescribir la plantilla oficial.`,
    { fieldsText, targetLabel }
  );
  alertT(
    "alert.officialConflict.blocked",
    `${String(targetLabel).charAt(0).toUpperCase()}${String(targetLabel).slice(1)} bloqueado.\n\n${fieldsText} coincide con la plantilla oficial.\nCámbialo en Estilo > Información y exportación y vuelve a intentarlo.`,
    { targetLabel: `${String(targetLabel).charAt(0).toUpperCase()}${String(targetLabel).slice(1)}`, fieldsText }
  );
  focusMetadataForRename({ preferTitle: !officialConflict.nameEqual && officialConflict.titleEqual });
  return true;
}

function askRenameForElpxExport(officialName, officialTitle) {
  if (!els.exportRenameModal || !els.exportRenameNameInput || !els.exportRenameTitleInput || !els.exportRenameHelp || !els.exportRenameConfirmBtn || !els.exportRenameCancelBtn) {
    return Promise.resolve(null);
  }

  const officialNameNorm = String(officialName || "").trim().toLowerCase();
  const officialTitleNorm = String(officialTitle || "").trim().toLowerCase();
  const nameInput = els.exportRenameNameInput;
  const titleInput = els.exportRenameTitleInput;
  const help = els.exportRenameHelp;
  const confirmBtn = els.exportRenameConfirmBtn;
  const cancelBtn = els.exportRenameCancelBtn;
  const modal = els.exportRenameModal;
  const removalWarning = i18nText(
    "elpx.rename.removalWarning",
    "Si mantienes Nombre/Título oficiales, en eXeLearning debes eliminar antes el estilo anterior para poder importarlo."
  );

  nameInput.value = String(els.metaName?.value || "").trim();
  titleInput.value = String(els.metaTitle?.value || "").trim();

  const updateUi = () => {
    const nextName = String(nameInput.value || "").trim();
    const nextTitle = String(titleInput.value || "").trim();
    const nameChanged = nextName.toLowerCase() !== officialNameNorm;
    const titleChanged = nextTitle.toLowerCase() !== officialTitleNorm;
    const canSave = Boolean(nextName && nextTitle);
    confirmBtn.disabled = !canSave;
    help.classList.remove("error", "warn");

    if (!nextName || !nextTitle) {
      help.textContent = i18nText("elpx.rename.completeFields", "Completa Nombre y Título para continuar.");
      help.classList.add("error");
      return;
    }
    if (!nameChanged && !titleChanged) {
      help.textContent = removalWarning;
      help.classList.add("warn");
      return;
    }
    if (!nameChanged || !titleChanged) {
      help.textContent = i18nText("elpx.rename.recommendedChangeBoth", `Recomendado: cambiar ambos campos. ${removalWarning}`, { removalWarning });
      help.classList.add("warn");
      return;
    }
    help.textContent = i18nText("elpx.rename.ready", "Listo. Puedes guardar el ELPX como estilo nuevo.");
  };

  return new Promise((resolve) => {
    const cleanup = () => {
      modal.hidden = true;
      nameInput.removeEventListener("input", onInput);
      titleInput.removeEventListener("input", onInput);
      confirmBtn.removeEventListener("click", onConfirm);
      cancelBtn.removeEventListener("click", onCancel);
      modal.removeEventListener("click", onBackdropClick);
    };
    const onInput = () => updateUi();
    const onConfirm = () => {
      const nextName = String(nameInput.value || "").trim();
      const nextTitle = String(titleInput.value || "").trim();
      if (!nextName || !nextTitle) return;
      cleanup();
      resolve({
        name: nextName,
        title: nextTitle,
        keptOfficialMetadata:
          nextName.toLowerCase() === officialNameNorm || nextTitle.toLowerCase() === officialTitleNorm
      });
    };
    const onCancel = () => {
      cleanup();
      resolve(null);
    };
    const onBackdropClick = (ev) => {
      if (ev.target !== modal) return;
      onCancel();
    };

    nameInput.addEventListener("input", onInput);
    titleInput.addEventListener("input", onInput);
    confirmBtn.addEventListener("click", onConfirm);
    cancelBtn.addEventListener("click", onCancel);
    modal.addEventListener("click", onBackdropClick);

    modal.hidden = false;
    updateUi();
    nameInput.focus();
    nameInput.select();
  });
}

async function ensureElpxRenameForOfficialStyle() {
  const conflict = officialMetadataConflict();
  if (!conflict.hasConflict) return { ok: true, keptOfficialMetadata: false };

  const official = getOfficialStyleById(conflict.officialId || state.officialSourceId);
  const officialName = String(conflict.officialId || state.officialSourceId || "").trim();
  const officialTitle = String(official?.meta?.title || "").trim();
  const result = await askRenameForElpxExport(officialName, officialTitle);
  if (!result) {
    setStatusT("status.elpxSaveCancelled", "Guardado de ELPX cancelado. Puedes ajustar más metadatos y volver a intentarlo.");
    return { ok: false, keptOfficialMetadata: false };
  }

  if (els.metaName) els.metaName.value = result.name;
  if (els.metaTitle) els.metaTitle.value = result.title;
  saveMetaFields({ showStatus: false });
  return { ok: true, keptOfficialMetadata: Boolean(result.keptOfficialMetadata) };
}

function setStatus(text) {
  els.status.textContent = text;
}

function setBusyOverlay(active, text = "Cargando…") {
  if (!els.busyOverlay) return;
  if (els.busyOverlayText) els.busyOverlayText.textContent = text;
  els.busyOverlay.hidden = !active;
}

function setupTrialNotice() {
  if (!els.trialNotice || !els.dismissTrialNotice) return;
  const today = new Date().toISOString().slice(0, 10);
  let dismissedToday = false;
  try {
    dismissedToday = window.localStorage.getItem(TRIAL_NOTICE_KEY) === today;
  } catch {
    dismissedToday = false;
  }
  if (dismissedToday) {
    els.trialNotice.classList.add("hidden");
    return;
  }
  els.dismissTrialNotice.addEventListener("click", () => {
    els.trialNotice.classList.add("hidden");
    try {
      window.localStorage.setItem(TRIAL_NOTICE_KEY, today);
    } catch {
      // ignore storage errors
    }
  });
}

function decode(bytes) {
  return new TextDecoder("utf-8").decode(bytes);
}

function encode(text) {
  return new TextEncoder().encode(text);
}

function base64ToBytes(base64) {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function ensureCoreFilesPresent({ markAsDirty: shouldMarkDirty = false } = {}) {
  const added = [];
  if (!state.files.has("style.js")) {
    state.files.set("style.js", encode(DEFAULT_STYLE_JS));
    invalidateBlob("style.js");
    added.push("style.js");
  }
  if (!state.files.has("screenshot.png")) {
    state.files.set("screenshot.png", base64ToBytes(MIN_SCREENSHOT_PNG_BASE64));
    invalidateBlob("screenshot.png");
    added.push("screenshot.png");
  }
  if (added.length && shouldMarkDirty) markDirty();
  return added;
}

function compatibilityNumberFromConfigXml(xmlText) {
  const m = String(xmlText || "").match(/<compatibility>\s*([^<]+)\s*<\/compatibility>/i);
  if (!m || !m[1]) return null;
  const n = Number.parseFloat(m[1].trim().replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function cloneBytes(bytes) {
  return new Uint8Array(bytes);
}

function setElpxModeUi() {
  if (els.exportElpxBtn) els.exportElpxBtn.hidden = !state.elpxMode;
}

function elpxSessionId() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

function elpxCacheNameFromSession(sessionId) {
  return `${ELPX_CACHE_PREFIX}${sessionId}`;
}

function inferMimeType(filePath) {
  const lower = String(filePath || "").toLowerCase();
  if (lower.endsWith(".html") || lower.endsWith(".htm")) return "text/html; charset=utf-8";
  if (lower.endsWith(".css")) return "text/css; charset=utf-8";
  if (lower.endsWith(".js")) return "text/javascript; charset=utf-8";
  if (lower.endsWith(".xml")) return "application/xml; charset=utf-8";
  if (lower.endsWith(".json")) return "application/json; charset=utf-8";
  if (lower.endsWith(".svg")) return "image/svg+xml";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".ico")) return "image/x-icon";
  if (lower.endsWith(".woff")) return "font/woff";
  if (lower.endsWith(".woff2")) return "font/woff2";
  if (lower.endsWith(".ttf")) return "font/ttf";
  if (lower.endsWith(".otf")) return "font/otf";
  return "application/octet-stream";
}

function elpxUrlPath(sessionId, filePath) {
  const cleanSession = encodeURIComponent(String(sessionId || "").trim());
  const clean = normalizePath(filePath || "");
  const encodedPath = clean
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  return `${ELPX_URL_PREFIX}${cleanSession}/${encodedPath}`;
}

function currentElpxPagePath() {
  if (!state.elpxMode || !state.elpxSessionId || !els.previewFrame?.src) return "";
  try {
    const url = new URL(els.previewFrame.src);
    const prefix = `${ELPX_URL_PREFIX}${encodeURIComponent(state.elpxSessionId)}/`;
    if (!url.pathname.startsWith(prefix)) return "";
    const relative = decodeURIComponent(url.pathname.slice(prefix.length));
    return normalizePath(relative || "index.html");
  } catch {
    return "";
  }
}

function rewriteElpxThemeUrls(cssText) {
  if (!state.elpxMode || !state.elpxSessionId) return String(cssText || "");
  const themeBasePath = normalizePath(state.elpxThemePrefix || "theme/");
  const resolveRelativeToTheme = (token) => {
    const cleanToken = String(token || "").trim();
    if (!cleanToken) return "";
    if (cleanToken.startsWith("/")) return normalizePath(cleanToken.slice(1));
    try {
      const base = new URL(`https://editor.local/${themeBasePath}`);
      const resolved = new URL(cleanToken, base);
      return normalizePath(resolved.pathname.replace(/^\/+/, ""));
    } catch {
      return normalizePath(`${themeBasePath}${cleanToken}`);
    }
  };
  return String(cssText || "").replace(/url\(([^)]+)\)/gi, (full, raw) => {
    const token = String(raw || "").trim().replace(/^['"]|['"]$/g, "");
    if (
      !token
      || token.startsWith("data:")
      || token.startsWith("http:")
      || token.startsWith("https:")
      || token.startsWith("blob:")
      || token.startsWith("#")
    ) {
      return full;
    }
    if (token.startsWith(ELPX_URL_PREFIX)) return `url("${token}")`;
    const resolvedRelative = resolveRelativeToTheme(token);
    if (!resolvedRelative) return full;
    return `url("${elpxUrlPath(state.elpxSessionId, resolvedRelative)}")`;
  });
}

function applyLiveElpxCssToFrame() {
  if (!state.elpxMode || !els.previewFrame?.contentDocument || !state.files.has("style.css")) return;
  let doc;
  try {
    doc = els.previewFrame.contentDocument;
  } catch {
    return;
  }
  if (!doc?.head) return;
  const cssText = rewriteElpxThemeUrls(readCss());
  if (cssText === state.previewLastElpxCss) return;
  let styleNode = doc.getElementById("editor-elpx-live-css");
  if (!styleNode || String(styleNode.tagName || "").toLowerCase() !== "style") {
    styleNode = doc.createElement("style");
    styleNode.id = "editor-elpx-live-css";
    doc.head.appendChild(styleNode);
  }
  styleNode.textContent = cssText;
  state.previewLastElpxCss = cssText;
}

async function clearElpxCaches({ keepCacheName = "" } = {}) {
  if (!("caches" in window)) return;
  const keys = await window.caches.keys();
  await Promise.all(
    keys
      .filter((key) => key.startsWith(ELPX_CACHE_PREFIX) && (!keepCacheName || key !== keepCacheName))
      .map((key) => window.caches.delete(key))
  );
}

async function registerElpxServiceWorkerIfNeeded() {
  if (!("serviceWorker" in navigator)) throw new Error(i18nText("error.serviceWorkerUnavailable", "Service Worker no disponible en este navegador."));
  if (!window.isSecureContext) throw new Error(i18nText("error.elpxRequiresSecureContext", "ELPX requiere HTTPS o localhost para usar Service Worker."));
  await navigator.serviceWorker.register(ELPX_SW_URL);
  await navigator.serviceWorker.ready;
}

async function writeElpxFileToCache(cache, sessionId, path, bytes) {
  const url = elpxUrlPath(sessionId, path);
  const response = new Response(cloneBytes(bytes), {
    headers: {
      "Content-Type": inferMimeType(path),
      "Cache-Control": "no-store"
    }
  });
  await cache.put(url, response);
}

async function syncThemeFilesToElpxCache({ replaceTheme = false } = {}) {
  if (!state.elpxMode || !state.elpxCacheName || !state.elpxSessionId || !("caches" in window)) return;
  const cache = await window.caches.open(state.elpxCacheName);
  if (replaceTheme) {
    const expected = new Set(
      Array.from(state.files.keys()).map((relPath) => normalizePath(`${state.elpxThemePrefix}${relPath}`))
    );
    const currentThemePaths = Array.from(state.elpxFiles.keys()).filter((path) => path.startsWith(state.elpxThemePrefix));
    for (const fullPath of currentThemePaths) {
      if (expected.has(fullPath)) continue;
      state.elpxFiles.delete(fullPath);
      await cache.delete(elpxUrlPath(state.elpxSessionId, fullPath), { ignoreSearch: true });
    }
  }
  for (const [relPath, bytes] of state.files.entries()) {
    const fullPath = normalizePath(`${state.elpxThemePrefix}${relPath}`);
    state.elpxFiles.set(fullPath, cloneBytes(bytes));
    await writeElpxFileToCache(cache, state.elpxSessionId, fullPath, bytes);
  }
}

function scheduleElpxThemeSync() {
  if (!state.elpxMode) return;
  if (state.elpxThemeSyncTimer) clearTimeout(state.elpxThemeSyncTimer);
  state.elpxThemeSyncTimer = window.setTimeout(() => {
    state.elpxThemeSyncTimer = 0;
    syncThemeFilesToElpxCache().catch(() => {
      // sync errors are surfaced on export/load operations
    });
  }, 220);
}

function reloadElpxPreviewPage() {
  if (!state.elpxMode || !state.elpxSessionId || !els.previewFrame) return;
  const pagePath = currentElpxPagePath() || "index.html";
  state.previewLastElpxCss = "";
  els.previewFrame.setAttribute("src", `${elpxUrlPath(state.elpxSessionId, pagePath)}?rev=${Date.now()}`);
}

function detectElpxThemePrefix(paths) {
  const cleanPaths = Array.from(paths || []).map((p) => normalizePath(p)).filter(Boolean);
  const preferred = cleanPaths.find((p) => /(^|\/)theme\/style\.css$/i.test(p));
  if (preferred) return preferred.slice(0, -("style.css".length));

  const cssCandidates = cleanPaths.filter((p) => p.toLowerCase().endsWith("style.css"));
  for (const candidate of cssCandidates) {
    const prefix = candidate.slice(0, -("style.css".length));
    if (cleanPaths.includes(`${prefix}config.xml`)) return prefix;
  }
  if (cssCandidates.length) return cssCandidates[0].slice(0, -("style.css".length));
  return "theme/";
}

async function deactivateElpxMode({ resetFrame = true } = {}) {
  if (state.elpxThemeSyncTimer) {
    clearTimeout(state.elpxThemeSyncTimer);
    state.elpxThemeSyncTimer = 0;
  }
  state.elpxMode = false;
  state.previewLastElpxCss = "";
  state.elpxSessionId = "";
  state.elpxOriginalName = "";
  state.elpxThemePrefix = "theme/";
  state.elpxThemeFiles.clear();
  state.elpxFiles.clear();
  if (state.elpxCacheName) {
    await clearElpxCaches({ keepCacheName: "" });
  }
  state.elpxCacheName = "";
  if (resetFrame && els.previewFrame) {
    els.previewFrame.setAttribute("src", "about:blank");
  }
  if (els.elpxInput) els.elpxInput.value = "";
  if (els.elpxInputName) els.elpxInputName.textContent = i18nText("file.none", "Ningún archivo seleccionado");
  setElpxModeUi();
}

function convertLegacyCssToV3(cssText) {
  let css = String(cssText || "");
  if (!css.trim()) return css;

  // Revert aggressive mappings from previous converter versions (only legacy-generated files).
  if (/legacy-source-file:/i.test(css)) {
    css = css
      .replace(/\.exe-content\s+\.package-header\b/g, "#header")
      .replace(/\.exe-content\s+\.package-title\b/g, "#headerContent")
      .replace(/\.exe-content\s+\.page-header\b/g, "#nodeDecoration")
      .replace(/\.exe-content\s+\.page-title\b/g, "#nodeTitle")
      .replace(/\.exe-content\s+main\.page\b/g, "#main-wrapper")
      .replace(/\.exe-content\s+\.page-content\b/g, "#main");
  }

  // Header/title mappings need explicit legacy handling before generic replacements.
  // In legacy 2.x, #headerContent wrapped the h1; in v3 the h1 itself is .package-title.
  css = css
    .replace(/header#header\s+#headerContent\s+h1\b/gi, ".exe-content .package-header .package-title")
    .replace(/#headerContent\s+h1\b/gi, ".exe-content .package-header .package-title")
    .replace(/#header\s+h1\b/gi, ".exe-content .package-header .package-title")
    .replace(/#headerContent(?![\w-])/gi, ".exe-content .package-header");

  // Conservative selector translation: keep content/iDevice styles, avoid legacy layout chrome.
  const selectorMap = [
    [/#header(?![\w-])/g, ".exe-content .package-header"],
    [/#emptyHeader(?![\w-])/g, ".exe-content .package-header"],
    [/#nodeDecoration(?![\w-])/g, ".exe-content .page-header"],
    [/#nodeTitle(?![\w-])/g, ".exe-content .page-title"],
    [/\.nodeTitle\b/g, ".page-title"],
    [/\.iDevice_wrapper\b/g, ".box"],
    [/\.iDevice_header\b/g, ".box-head"],
    [/\.iDeviceTitle\b/g, ".box-title"],
    [/\.iDevice_content_wrapper\b/g, ".box-content"],
    [/\.iDevice_content\b/g, ".box-content"],
    [/\.iDevice_inner\b/g, ".box-content"],
    [/\.toggle-idevice\b/g, ".box-toggle"],
    [/\.box-toggle\s+a\b/g, ".box-toggle"],
    [/\.toggle-em1\b/g, ".box.minimized .box-toggle"],
    [/\.show-idevice\b/g, ".box.minimized .box-toggle"]
  ];
  for (const [pattern, replacement] of selectorMap) {
    css = css.replace(pattern, replacement);
  }
  css = css
    .replace(/\.exe-content\s+\.package-header\s+\.exe-content\s+\.package-header/g, ".exe-content .package-header")
    .replace(/\.exe-content\s+\.package-header\s+\.exe-content\s+\.package-title/g, ".exe-content .package-header .package-title");
  css = css.replace(/\bno-nav\b/g, "siteNav-off");

  return css;
}

function upgradeLegacyConfigXmlToV3(xmlText) {
  let xml = String(xmlText || "");
  if (!xml.trim()) return { xml, changed: false, notes: [] };
  const notes = [];
  const before = xml;

  const compat = compatibilityNumberFromConfigXml(xml);
  if (compat === null || compat < 3) {
    xml = writeConfigField(xml, "compatibility", "3.0");
    notes.push("compatibility actualizada a 3.0");
  }

  const dropLegacyField = (tag) => {
    const re = new RegExp(`\\s*<${tag}>[\\s\\S]*?<\\/${tag}>`, "i");
    if (re.test(xml)) {
      xml = xml.replace(re, "");
      notes.push(`${tag} eliminado (bloque legacy)`);
    }
  };
  dropLegacyField("edition-extra-head");
  dropLegacyField("extra-body");

  return { xml, changed: xml !== before, notes };
}

function upsertLegacyCompatStyleJs(styleJsText) {
  let js = String(styleJsText || "");
  const legacyCompatBlockRe = /\/\*\s*legacy-v2-v3-compat-v\d+:[\s\S]*?\*\/\s*\(function\s*\(\)\s*\{[\s\S]*?\}\)\(\);\s*/gi;
  js = js.replace(legacyCompatBlockRe, "").trimEnd();

  for (const marker of LEGACY_COMPAT_MARKERS) {
    if (js.includes(marker)) {
      js = js.replaceAll(marker, LEGACY_COMPAT_MARKER);
    }
  }

  return js ? `${js}\n\n${LEGACY_COMPAT_STYLE_JS}\n` : `${LEGACY_COMPAT_STYLE_JS}\n`;
}

function moveThemeFile(oldPath, newPath) {
  const from = normalizePath(oldPath);
  const to = normalizePath(newPath);
  if (!state.files.has(from) || from === to) return false;
  if (state.files.has(to)) return false;
  state.files.set(to, cloneBytes(state.files.get(from)));
  state.files.delete(from);
  invalidateBlob(from);
  invalidateBlob(to);
  return true;
}

function convertLegacyThemePackageIfNeeded() {
  const notes = [];
  const rootPaths = Array.from(state.files.keys()).filter((p) => !normalizePath(p).includes("/"));
  const configXml = state.files.has("config.xml") ? decode(state.files.get("config.xml")) : "";
  const compatibility = compatibilityNumberFromConfigXml(configXml);
  const hasLegacyCssFiles = state.files.has("content.css") || state.files.has("nav.css");
  const hasModernStyleCss = state.files.has("style.css");
  const currentStyleCss = hasModernStyleCss ? decode(state.files.get("style.css")) : "";
  const hasLegacyMarkerInStyleCss = /legacy-source-file:(?:content|nav)\.css/i.test(currentStyleCss);
  const looksLegacy = hasLegacyCssFiles || (compatibility !== null && compatibility < 3) || hasLegacyMarkerInStyleCss;
  if (!looksLegacy) return { converted: false, notes: [], detectedLegacy: false };

  let cssCandidates = ["content.css", "nav.css"].filter((p) => state.files.has(p));
  if (!cssCandidates.length && hasLegacyMarkerInStyleCss) {
    cssCandidates = ["legacy/content.css", "legacy/nav.css"].filter((p) => state.files.has(p));
  }
  if (!cssCandidates.length && !hasModernStyleCss) {
    cssCandidates = rootPaths
      .filter((p) => p.toLowerCase().endsWith(".css") && p.toLowerCase() !== "style.css")
      .sort((a, b) => a.localeCompare(b));
  }
  if (!hasModernStyleCss && cssCandidates.length) {
    const mergedLegacyCss = cssCandidates
      .map((path) => `/* legacy-source-file:${path} */\n${decode(state.files.get(path))}`)
      .join("\n\n");
    const convertedCss = convertLegacyCssToV3(mergedLegacyCss);
    const generated = [
      "/* style.css convertido automáticamente desde formato legado (eXe 2.x) a estructura v3 */",
      "/* Archivos originales CSS movidos a la carpeta legacy/ para referencia. */",
      "",
      convertedCss,
      ""
    ].join("\n");
    state.files.set("style.css", encode(generated));
    invalidateBlob("style.css");
    notes.push(`style.css convertido a v3 desde: ${cssCandidates.join(", ")}`);

    for (const cssPath of cssCandidates) {
      moveThemeFile(cssPath, `legacy/${cssPath}`);
    }
  }

  if (hasModernStyleCss) {
    const originalCss = decode(state.files.get("style.css"));
    const convertedCss = convertLegacyCssToV3(originalCss);
    if (convertedCss !== originalCss) {
      state.files.set("style.css", encode(convertedCss));
      invalidateBlob("style.css");
      notes.push("style.css existente adaptado a selectores v3");
    }
  }

  if (!state.files.has("style.js")) {
    let adoptedLegacyJs = "";
    if (moveThemeFile("default.js", "style.js")) {
      adoptedLegacyJs = "default.js";
    } else if (moveThemeFile("legacy/default.js", "style.js")) {
      adoptedLegacyJs = "legacy/default.js";
    }
    if (adoptedLegacyJs) {
      notes.push(`style.js adoptado automáticamente desde: ${adoptedLegacyJs}`);
    }
  }

  const legacyRootJs = rootPaths.filter((p) => p.toLowerCase().endsWith(".js") && p.toLowerCase() !== "style.js");
  let movedJs = 0;
  for (const jsPath of legacyRootJs) {
    if (moveThemeFile(jsPath, `legacy/${jsPath}`)) movedJs += 1;
  }
  if (movedJs) {
    notes.push(`JS legado movido a legacy/: ${movedJs}`);
  }

  if (!state.files.has("screenshot.png") && state.files.has("preview.png")) {
    state.files.set("screenshot.png", cloneBytes(state.files.get("preview.png")));
    invalidateBlob("screenshot.png");
    notes.push("preview.png reutilizado como screenshot.png");
  }

  const iconMatches = rootPaths
    .map((p) => {
      const m = p.match(/^icon_([a-z0-9_-]+)\.(png|jpe?g|gif|svg|webp)$/i);
      return m ? { source: p, name: m[1], ext: m[2].toLowerCase() } : null;
    })
    .filter(Boolean);
  let copiedIcons = 0;
  for (const icon of iconMatches) {
    const target = `icons/${icon.name}.${icon.ext}`;
    if (state.files.has(target)) continue;
    state.files.set(target, cloneBytes(state.files.get(icon.source)));
    invalidateBlob(target);
    copiedIcons += 1;
  }
  if (copiedIcons) notes.push(`iconos legacy copiados a icons/: ${copiedIcons}`);

  if (state.files.has("config.xml")) {
    const upgraded = upgradeLegacyConfigXmlToV3(decode(state.files.get("config.xml")));
    if (upgraded.changed) {
      state.files.set("config.xml", encode(upgraded.xml));
      invalidateBlob("config.xml");
      notes.push(...upgraded.notes);
    }
  }

  const currentStyleJs = state.files.has("style.js") ? decode(state.files.get("style.js")) : "";
  const upgradedStyleJs = upsertLegacyCompatStyleJs(currentStyleJs);
  if (upgradedStyleJs !== currentStyleJs) {
    state.files.set("style.js", encode(upgradedStyleJs));
    invalidateBlob("style.js");
    notes.push("compatibilidad legacy actualizada en style.js (cabecera/navegación/controles)");
  }

  return { converted: notes.length > 0, notes, detectedLegacy: true };
}

function isTextFile(path) {
  const lower = path.toLowerCase();
  return TEXT_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

function isImageFile(path) {
  const lower = path.toLowerCase();
  return IMAGE_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

function isFontFile(path) {
  const lower = path.toLowerCase();
  return lower.endsWith(".woff") || lower.endsWith(".woff2") || lower.endsWith(".ttf") || lower.endsWith(".otf");
}

function normalizePath(path) {
  return path.replace(/^\/+/, "").replace(/\\/g, "/").replace(/^\.\//, "");
}

function normalizeHex(value, fallback = "#333333") {
  const v = String(value || "").trim().toLowerCase();
  if (/^#[0-9a-f]{6}$/.test(v)) return v;
  if (/^#[0-9a-f]{3}$/.test(v)) return `#${v[1]}${v[1]}${v[2]}${v[2]}${v[3]}${v[3]}`;
  return fallback;
}

function logoCssPosition(position, mx, my) {
  const marginX = Math.max(0, Number(mx) || 0);
  const marginY = Math.max(0, Number(my) || 0);
  switch (position) {
    case "top-left":
      return `left: ${marginX}px; top: ${marginY}px; transform: none;`;
    case "top-center":
      return `left: 50%; top: ${marginY}px; transform: translateX(-50%);`;
    case "bottom-left":
      return `left: ${marginX}px; bottom: ${marginY}px; transform: none;`;
    case "bottom-center":
      return `left: 50%; bottom: ${marginY}px; transform: translateX(-50%);`;
    case "bottom-right":
      return `right: ${marginX}px; bottom: ${marginY}px; transform: none;`;
    case "top-right":
    default:
      return `right: ${marginX}px; top: ${marginY}px; transform: none;`;
  }
}

function findCustomLogoPath() {
  const preferred = Array.from(state.files.keys()).find((p) => /^img\/custom-logo\.(png|jpe?g|gif|webp|svg)$/i.test(p));
  if (preferred) return preferred;
  return Array.from(state.files.keys()).find((p) => /^img\/.*\.(png|jpe?g|gif|webp|svg)$/i.test(p)) || "";
}

function updateLogoInfo() {
  if (!els.logoInfo) return;
  if (!state.quick.logoPath || !state.files.has(state.quick.logoPath)) {
    els.logoInfo.textContent = i18nText("status.noLogoLoaded", "Sin logo cargado.");
    return;
  }
  els.logoInfo.textContent = i18nText("info.logoCurrent", "Logo actual: {path}", { path: state.quick.logoPath });
}

function updateBgImageInfo() {
  if (!els.bgImageInfo) return;
  if (!state.quick.bgImagePath || !state.files.has(state.quick.bgImagePath) || !state.quick.bgImageEnabled) {
    els.bgImageInfo.textContent = i18nText("status.noBgImageLoaded", "Sin imagen de fondo.");
    return;
  }
  els.bgImageInfo.textContent = i18nText("info.bgCurrent", "Fondo actual: {path}", { path: state.quick.bgImagePath });
}

function updateHeaderImageInfo() {
  if (!els.headerImageInfo) return;
  if (!state.quick.headerImagePath || !state.files.has(state.quick.headerImagePath)) {
    els.headerImageInfo.textContent = i18nText("status.noHeaderImageLoaded", "Sin imagen de cabecera.");
    return;
  }
  const stateText = state.quick.headerImageEnabled
    ? i18nText("status.state.active", "activa")
    : i18nText("status.state.loadedDisabled", "cargada (desactivada)");
  els.headerImageInfo.textContent = i18nText("info.headerCurrent", "Cabecera {state}: {path}", { state: stateText, path: state.quick.headerImagePath });
}

function updateFooterImageInfo() {
  if (!els.footerImageInfo) return;
  if (!state.quick.footerImagePath || !state.files.has(state.quick.footerImagePath)) {
    els.footerImageInfo.textContent = i18nText("status.noFooterImageLoaded", "Sin imagen de pie.");
    return;
  }
  const stateText = state.quick.footerImageEnabled
    ? i18nText("status.state.active", "activa")
    : i18nText("status.state.loadedDisabled", "cargada (desactivada)");
  els.footerImageInfo.textContent = i18nText("info.footerCurrent", "Pie {state}: {path}", { state: stateText, path: state.quick.footerImagePath });
}

function listStyleImagePaths({ includeAll = false } = {}) {
  return Array.from(state.files.keys())
    .filter((path) => isImageFile(path))
    .filter((path) => {
      const clean = normalizePath(path);
      const lower = clean.toLowerCase();
      if (lower === "screenshot.png") return false;
      if (includeAll) return true;
      if (lower.startsWith("icons/")) return false;
      if (/^icon_[^/]+\.(png|jpe?g|gif|webp|svg)$/i.test(clean)) return false;
      return true;
    })
    .sort((a, b) => a.localeCompare(b));
}

function refreshStyleImageSelect(selectEl, currentPath, kindLabel, { includeAll = false } = {}) {
  if (!selectEl) return;
  const images = listStyleImagePaths({ includeAll });
  const current = normalizePath(currentPath || "");
  const hasCurrent = current && state.files.has(current) && isImageFile(current);
  const options = hasCurrent && !images.includes(current) ? [current, ...images] : images;
  selectEl.innerHTML = "";

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = options.length
    ? i18nText("quick.common.selectStyleImage", "Seleccionar imagen del estilo...")
    : i18nText("quick.common.noStyleImages", "No hay imágenes del estilo");
  selectEl.appendChild(placeholder);

  for (const path of options) {
    const option = document.createElement("option");
    option.value = path;
    option.textContent = path;
    selectEl.appendChild(option);
  }

  selectEl.value = options.includes(current) ? current : "";
  selectEl.disabled = options.length === 0;
  selectEl.title = options.length
    ? i18nText("quick.common.selectStyleImageFor", "Selecciona una imagen del estilo para {kind}", { kind: kindLabel })
    : "";
}

function refreshHeaderFooterImageSelects() {
  const includeAll = Boolean(els.showAllStyleImages?.checked);
  refreshStyleImageSelect(els.bgImageSelect, state.quick.bgImagePath, i18nText("kind.background", "fondo"), { includeAll });
  refreshStyleImageSelect(els.headerImageSelect, state.quick.headerImagePath, i18nText("kind.header", "cabecera"), { includeAll });
  refreshStyleImageSelect(els.footerImageSelect, state.quick.footerImagePath, i18nText("kind.footer", "pie"), { includeAll });
}

function refreshNavIconSelects() {
  refreshStyleImageSelect(els.navPrevIconSelect, state.quick.navIconPrevPath, i18nText("kind.navPrev", "anterior"), { includeAll: true });
  refreshStyleImageSelect(els.navNextIconSelect, state.quick.navIconNextPath, i18nText("kind.navNext", "siguiente"), { includeAll: true });
  refreshStyleImageSelect(els.navMenuIconSelect, state.quick.navIconMenuPath, i18nText("kind.navMenu", "menú"), { includeAll: true });
}

function updateNavIconsInfo() {
  if (!els.navIconsInfo) return;
  const parts = [];
  if (state.quick.navIconPrevPath && state.files.has(state.quick.navIconPrevPath)) parts.push(i18nText("info.navPrev", "Anterior: {path}", { path: state.quick.navIconPrevPath }));
  if (state.quick.navIconNextPath && state.files.has(state.quick.navIconNextPath)) parts.push(i18nText("info.navNext", "Siguiente: {path}", { path: state.quick.navIconNextPath }));
  if (state.quick.navIconMenuPath && state.files.has(state.quick.navIconMenuPath)) parts.push(i18nText("info.navMenu", "Menú: {path}", { path: state.quick.navIconMenuPath }));
  els.navIconsInfo.textContent = parts.length
    ? i18nText("status.navIconsActive", "Iconos activos. {details}", { details: parts.join(" | ") })
    : i18nText("status.noNavIconsChanges", "Sin cambios en iconos de navegación.");
}

function isEditorManagedHeaderImage(path) {
  return /^img\/custom-header\.(png|jpe?g|gif|webp|svg)$/i.test(normalizePath(path || ""));
}

function isEditorManagedFooterImage(path) {
  return /^img\/custom-footer\.(png|jpe?g|gif|webp|svg)$/i.test(normalizePath(path || ""));
}

function applyEditorTheme() {
  // Intentionally left blank:
  // Editor UI must remain neutral; theme changes should affect preview only.
}

function escapeHtml(text) {
  return String(text || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function getOfficialStyleById(id) {
  return state.officialStyles.find((style) => style.id === id) || null;
}

function renderOfficialStylesSelect() {
  if (!els.officialStyleSelect) return;
  els.officialStyleSelect.innerHTML = "";
  for (const style of state.officialStyles) {
    const option = document.createElement("option");
    const title = style.meta?.title || style.id;
    option.value = style.id;
    option.textContent = `${title} (${style.id})`;
    els.officialStyleSelect.appendChild(option);
  }
  if (state.selectedOfficialStyleId) {
    els.officialStyleSelect.value = state.selectedOfficialStyleId;
  }
}

function renderOfficialStylePreview(id = state.selectedOfficialStyleId) {
  if (!els.officialPreview) return;
  const style = getOfficialStyleById(id);
  if (!style) {
    els.officialPreview.className = "official-preview empty hidden";
    els.officialPreview.textContent = "";
    return;
  }

  const meta = style.meta || {};
  const title = meta.title || style.id;
  const author = meta.author || i18nText("meta.noAuthor", "Sin autor");
  const version = meta.version || i18nText("meta.noVersionShort", "s/v");
  const compatibility = meta.compatibility || i18nText("meta.noDataShort", "s/d");
  const desc = meta.description || i18nText("meta.noDescription", "Sin descripción.");
  const screenshot = `${style.dir}/screenshot.png`;
  const altText = i18nText("preview.stylePreviewAlt", "Vista previa {title}", { title });
  const idLabel = i18nText("preview.meta.id", "ID");
  const versionLabel = i18nText("meta.version", "Versión");
  const compatLabel = i18nText("preview.meta.compat", "Compat");
  const authorLabel = i18nText("meta.author", "Autor");

  els.officialPreview.className = "official-preview";
  els.officialPreview.innerHTML = `
    <figure>
      <img src="${escapeHtml(screenshot)}" alt="${escapeHtml(altText)}" loading="lazy" />
      <figcaption>
        <span class="title">${escapeHtml(title)}</span>
        <span class="meta">${escapeHtml(idLabel)}: ${escapeHtml(style.id)} | ${escapeHtml(versionLabel)}: ${escapeHtml(version)} | ${escapeHtml(compatLabel)}: ${escapeHtml(compatibility)}</span>
        <span class="meta">${escapeHtml(authorLabel)}: ${escapeHtml(author)}</span>
        <span class="desc">${escapeHtml(desc)}</span>
      </figcaption>
    </figure>
  `;
}

function hideOfficialStylePreview() {
  if (!els.officialPreview) return;
  els.officialPreview.className = "official-preview empty hidden";
  els.officialPreview.textContent = "";
}

function getBlobUrl(path) {
  const clean = normalizePath(path);
  if (!state.files.has(clean)) return "";
  if (state.blobUrls.has(clean)) return state.blobUrls.get(clean);
  const lower = clean.toLowerCase();
  let mime = "application/octet-stream";
  if (lower.endsWith(".svg")) mime = "image/svg+xml";
  else if (lower.endsWith(".png")) mime = "image/png";
  else if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) mime = "image/jpeg";
  else if (lower.endsWith(".gif")) mime = "image/gif";
  else if (lower.endsWith(".webp")) mime = "image/webp";
  else if (lower.endsWith(".css")) mime = "text/css";
  else if (lower.endsWith(".js")) mime = "text/javascript";
  else if (lower.endsWith(".xml")) mime = "application/xml";
  const url = URL.createObjectURL(new Blob([state.files.get(clean)], { type: mime }));
  state.blobUrls.set(clean, url);
  return url;
}

function invalidateBlob(path) {
  const clean = normalizePath(path);
  const url = state.blobUrls.get(clean);
  if (!url) return;
  URL.revokeObjectURL(url);
  state.blobUrls.delete(clean);
}

function invalidateAllBlobs() {
  for (const url of state.blobUrls.values()) URL.revokeObjectURL(url);
  state.blobUrls.clear();
}

function listFilesSorted() {
  const priority = (path) => {
    const p = path.toLowerCase();
    if (p.startsWith("icons/")) return 1;
    if (p.startsWith("img/")) return 2;
    if (p.startsWith("fonts/")) return 3;
    if (p === "config.xml") return 10;
    if (p === "style.css") return 11;
    if (p === "style.js") return 12;
    if (p === "screenshot.png") return 13;
    return 50;
  };

  return Array.from(state.files.keys()).sort((a, b) => {
    const pa = priority(a);
    const pb = priority(b);
    if (pa !== pb) return pa - pb;
    return a.localeCompare(b);
  });
}

function fileGroup(path) {
  const lower = path.toLowerCase();
  if (IMAGE_EXTENSIONS.some((ext) => lower.endsWith(ext))) return "images";
  if (lower.endsWith(".css")) return "css";
  if (lower.endsWith(".js")) return "js";
  if (lower.endsWith(".xml")) return "xml";
  if (lower.endsWith(".json")) return "json";
  if (lower.endsWith(".html") || lower.endsWith(".htm")) return "html";
  if (lower.endsWith(".md")) return "markdown";
  if (lower.endsWith(".woff") || lower.endsWith(".woff2") || lower.endsWith(".ttf") || lower.endsWith(".otf")) return "fonts";
  if (lower.endsWith(".txt")) return "text";
  return "other";
}

function highlightLanguageFromPath(path) {
  return HIGHLIGHT_BY_FILE_GROUP[fileGroup(path)] || "";
}

function syncHighlightedScroll() {
  if (!els.textHighlight || !els.textEditor) return;
  const x = els.textEditor.scrollLeft || 0;
  const y = els.textEditor.scrollTop || 0;
  els.textHighlight.scrollLeft = x;
  els.textHighlight.scrollTop = y;
}

function renderHighlightedEditor(path = state.activePath) {
  if (!els.editorSurface || !els.textHighlight || !els.textEditor) return;
  const language = highlightLanguageFromPath(path);
  const hljs = window.hljs;
  const canHighlight = Boolean(
    language
    && hljs
    && typeof hljs.highlight === "function"
    && !els.textEditor.disabled
    && els.textEditor.style.display !== "none"
  );

  els.editorSurface.classList.toggle("syntax-active", canHighlight);
  if (!canHighlight) {
    els.textHighlight.classList.remove("hljs");
    els.textHighlight.innerHTML = "";
    els.textHighlight.scrollLeft = 0;
    els.textHighlight.scrollTop = 0;
    return;
  }

  const inputText = els.textEditor.value || "";
  let highlighted = "";
  try {
    highlighted = hljs.highlight(inputText, { language, ignoreIllegals: true }).value;
  } catch {
    highlighted = escapeHtml(inputText);
  }
  if (inputText.endsWith("\n")) highlighted += "\n";
  els.textHighlight.classList.add("hljs");
  els.textHighlight.innerHTML = highlighted;
  syncHighlightedScroll();
}

function scheduleEditorHighlight(path = state.activePath) {
  if (highlightRenderRaf) cancelAnimationFrame(highlightRenderRaf);
  highlightRenderRaf = requestAnimationFrame(() => {
    highlightRenderRaf = 0;
    renderHighlightedEditor(path);
  });
}

function isDetachedEditorAvailable() {
  return Boolean(state.activePath && state.files.has(state.activePath) && isTextFile(state.activePath));
}

function setDetachedEditorButtonState() {
  if (!els.openDetachedEditorBtn) return;
  const enabled = isDetachedEditorAvailable();
  els.openDetachedEditorBtn.disabled = !enabled;
  els.openDetachedEditorBtn.title = enabled
    ? i18nText("files.openDetachedEditor", "Abrir editor en ventana independiente")
    : i18nText("files.detachedOnlyText", "Solo disponible para archivos de texto.");
}

function detachedEditorHtml() {
  return `<!doctype html>
<html lang="${escapeHtml(window.EditorI18n?.getLang?.() || "en")}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${i18nText("files.editorTitle", "Editor de archivo")}</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/styles/github.min.css" />
  <style>
    :root { color-scheme: light; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: "DejaVu Sans", Arial, sans-serif; background: #f6f8fb; color: #1f2937; }
    .bar { position: sticky; top: 0; background: #ffffff; border-bottom: 1px solid #d6dee8; padding: 8px 10px; font-size: 13px; }
    #detachedPath { font-weight: 700; word-break: break-all; }
    .editor-surface {
      position: relative;
      width: calc(100% - 16px);
      min-height: calc(100vh - 62px);
      margin: 8px;
      border-radius: 8px;
      overflow: hidden;
    }
    #detachedEditor {
      display: block;
      width: 100%;
      min-height: calc(100vh - 62px);
      margin: 0;
      border: 1px solid #bfcada;
      border-radius: 8px;
      padding: 10px;
      resize: vertical;
      font: 14px/1.5 "DejaVu Sans Mono", monospace;
      background: #fff;
      color: #111827;
      position: relative;
      z-index: 2;
      overflow-wrap: normal;
      white-space: pre;
    }
    #detachedHighlight {
      display: none;
      margin: 0;
      position: absolute;
      inset: 0;
      overflow: auto;
      border: 1px solid #bfcada;
      border-radius: 8px;
      padding: 10px;
      font: 14px/1.5 "DejaVu Sans Mono", monospace;
      background: #f8fafc;
      white-space: pre;
      pointer-events: none;
      scrollbar-width: none;
    }
    #detachedHighlight::-webkit-scrollbar { width: 0; height: 0; }
    #detachedHighlight.hljs { background: #f8fafc; }
    .editor-surface.syntax-active #detachedHighlight { display: block; }
    .editor-surface.syntax-active #detachedEditor {
      background: transparent;
      color: transparent;
      border-color: transparent;
      caret-color: #111827;
    }
    .editor-surface.syntax-active #detachedEditor::selection {
      background: rgb(15 23 42 / 0.16);
      color: transparent;
    }
  </style>
</head>
<body>
  <div class="bar">Editando: <span id="detachedPath">-</span></div>
  <div id="detachedSurface" class="editor-surface">
    <pre id="detachedHighlight" aria-hidden="true"></pre>
    <textarea id="detachedEditor" spellcheck="false" wrap="off"></textarea>
  </div>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/highlight.min.js"></script>
</body>
</html>`;
}

function getDetachedEditorElements() {
  const win = detachedEditor.win;
  if (!win || win.closed) return null;
  const doc = win.document;
  if (!doc) return null;
  const textarea = doc.getElementById("detachedEditor");
  const pathLabel = doc.getElementById("detachedPath");
  const surface = doc.getElementById("detachedSurface");
  const highlight = doc.getElementById("detachedHighlight");
  if (!(textarea instanceof win.HTMLTextAreaElement) || !pathLabel || !surface || !highlight) return null;
  return { win, doc, textarea, pathLabel, surface, highlight };
}

function syncDetachedHighlightScroll() {
  const refs = getDetachedEditorElements();
  if (!refs) return;
  refs.highlight.scrollLeft = refs.textarea.scrollLeft || 0;
  refs.highlight.scrollTop = refs.textarea.scrollTop || 0;
}

function renderDetachedHighlight() {
  const refs = getDetachedEditorElements();
  if (!refs) return;
  const language = highlightLanguageFromPath(detachedEditor.path || state.activePath);
  const hljs = refs.win.hljs;
  const canHighlight = Boolean(
    language
    && hljs
    && typeof hljs.highlight === "function"
    && !refs.textarea.disabled
    && refs.textarea.style.display !== "none"
  );
  refs.surface.classList.toggle("syntax-active", canHighlight);
  if (!canHighlight) {
    refs.highlight.classList.remove("hljs");
    refs.highlight.innerHTML = "";
    refs.highlight.scrollLeft = 0;
    refs.highlight.scrollTop = 0;
    return;
  }
  const inputText = refs.textarea.value || "";
  let highlighted = "";
  try {
    highlighted = hljs.highlight(inputText, { language, ignoreIllegals: true }).value;
  } catch {
    highlighted = escapeHtml(inputText);
  }
  if (inputText.endsWith("\n")) highlighted += "\n";
  refs.highlight.classList.add("hljs");
  refs.highlight.innerHTML = highlighted;
  syncDetachedHighlightScroll();
}

function closeDetachedEditorIfOpen() {
  if (!detachedEditor.win || detachedEditor.win.closed) {
    detachedEditor.win = null;
    detachedEditor.path = "";
    return;
  }
  detachedEditor.win.close();
  detachedEditor.win = null;
  detachedEditor.path = "";
}

function syncDetachedEditorFromMain() {
  const refs = getDetachedEditorElements();
  if (!refs) return;
  const canEdit = isDetachedEditorAvailable();
  const path = canEdit ? state.activePath : "";
  detachedEditor.path = path;
  refs.pathLabel.textContent = path || i18nText("files.notEditableText", "(archivo no editable en texto)");
  refs.textarea.disabled = !canEdit;
  const nextValue = canEdit ? (els.textEditor.value || "") : "";
  if (refs.textarea.value !== nextValue) refs.textarea.value = nextValue;
  refs.win.document.title = path
    ? i18nText("files.detachedTitle", "Editor: {path}", { path })
    : i18nText("files.editorTitle", "Editor de archivo");
  renderDetachedHighlight();
}

function setupDetachedEditorWindow(win) {
  detachedEditor.win = win;
  win.document.open();
  win.document.write(detachedEditorHtml());
  win.document.close();
  win.addEventListener("beforeunload", () => {
    detachedEditor.win = null;
    detachedEditor.path = "";
  });
  const refs = getDetachedEditorElements();
  if (!refs) return;
  refs.textarea.addEventListener("input", () => {
    const path = detachedEditor.path;
    if (!path || path !== state.activePath || !isTextFile(path)) return;
    els.textEditor.value = refs.textarea.value;
    onEditorInput();
    renderDetachedHighlight();
  });
  refs.textarea.addEventListener("scroll", syncDetachedHighlightScroll);
  if (win.hljs) renderDetachedHighlight();
  else win.addEventListener("load", renderDetachedHighlight, { once: true });
  win.setTimeout(renderDetachedHighlight, 300);
  syncDetachedEditorFromMain();
}

function openDetachedEditor() {
  if (!isDetachedEditorAvailable()) return;
  if (detachedEditor.win && !detachedEditor.win.closed) {
    syncDetachedEditorFromMain();
    detachedEditor.win.focus();
    return;
  }
  const popup = window.open("", "editor-estilos-detached", "popup=yes,width=860,height=620");
  if (!popup) {
    setStatusT("status.detachedWindowBlocked", "No se pudo abrir la ventana independiente (bloqueada por el navegador).");
    return;
  }
  setupDetachedEditorWindow(popup);
  popup.focus();
}

function availableFileGroups() {
  const counts = new Map();
  for (const path of state.files.keys()) {
    const group = fileGroup(path);
    counts.set(group, (counts.get(group) || 0) + 1);
  }
  return counts;
}

function refreshFileTypeFilterOptions({ forceAll = false } = {}) {
  if (!els.fileTypeFilter) return;
  const previous = els.fileTypeFilter.value || "all";
  const groupCounts = availableFileGroups();
  const total = state.files.size;

  els.fileTypeFilter.innerHTML = "";
  const allOption = document.createElement("option");
  allOption.value = "all";
  allOption.textContent = `${i18nText("files.type.all", "Todos")} (${total})`;
  els.fileTypeFilter.appendChild(allOption);

  for (const opt of FILE_TYPE_OPTIONS) {
    const count = groupCounts.get(opt.value) || 0;
    if (!count) continue;
    const option = document.createElement("option");
    option.value = opt.value;
    option.textContent = `${i18nText(opt.key, opt.label)} (${count})`;
    els.fileTypeFilter.appendChild(option);
  }

  els.fileTypeFilter.value = forceAll ? "all" : (previous === "all" || groupCounts.has(previous) ? previous : "all");
  refreshHeaderFooterImageSelects();
}

function readCss() {
  return state.files.has("style.css") ? decode(state.files.get("style.css")) : "";
}

function writeCss(cssText, { recordUndo = true } = {}) {
  const currentCss = readCss();
  if (recordUndo && String(cssText || "") !== currentCss) pushUndoSnapshot();
  state.files.set("style.css", encode(cssText));
  invalidateBlob("style.css");
  if (state.activePath === "style.css") syncEditorWithActiveFile();
  renderPreview();
}

function escapeRegExp(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isDomDocument(value) {
  return Boolean(value && typeof value === "object" && value.nodeType === 9 && value.documentElement);
}

function isDomElement(value) {
  return Boolean(value && typeof value === "object" && value.nodeType === 1 && typeof value.tagName === "string");
}

function targetElementFromEventTarget(target) {
  if (isDomElement(target)) return target;
  if (target && typeof target === "object" && target.nodeType === 3 && target.parentElement) return target.parentElement;
  return null;
}

function isTransientStateClass(name) {
  const n = String(name || "").trim().toLowerCase();
  if (!n) return true;
  return (
    n === "sfhover"
    || n === "sffocus"
    || n === "hover"
    || n === "focus"
    || n === "active"
    || n === "visited"
    || n === "current"
    || n === "selected"
    || n === "pressed"
  );
}

function cssEscape(value) {
  if (window.CSS && typeof window.CSS.escape === "function") return window.CSS.escape(String(value));
  return String(value || "").replace(/[^a-zA-Z0-9_-]/g, "\\$&");
}

function rgbToHex(input, fallback = "#000000") {
  const raw = String(input || "").trim();
  if (!raw) return fallback;
  if (/^#[0-9a-f]{6}$/i.test(raw)) return raw.toLowerCase();
  if (/^#[0-9a-f]{3}$/i.test(raw)) {
    const short = raw.slice(1).toLowerCase();
    return `#${short[0]}${short[0]}${short[1]}${short[1]}${short[2]}${short[2]}`;
  }
  const m = raw.match(/rgba?\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (!m) return fallback;
  const toHex = (n) => {
    const v = Math.max(0, Math.min(255, Number.parseInt(n, 10) || 0));
    return v.toString(16).padStart(2, "0");
  };
  return `#${toHex(m[1])}${toHex(m[2])}${toHex(m[3])}`;
}

function alphaPercentFromColor(input, fallback = 0) {
  const raw = String(input || "").trim().toLowerCase();
  if (!raw) return fallback;
  if (raw === "transparent") return 100;
  const rgba = raw.match(/rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([0-9.]+)\s*\)/i);
  if (rgba && rgba[4]) {
    const alpha = Math.max(0, Math.min(1, Number.parseFloat(rgba[4]) || 0));
    return Math.round((1 - alpha) * 100);
  }
  const rgb = raw.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i);
  if (rgb) return 0;
  return fallback;
}

function normalizePercentNumber(input, fallback = 0) {
  const n = Number.parseFloat(String(input || "").trim());
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function hexToRgb(hex) {
  const value = normalizeHex(hex, "#000000");
  const clean = value.slice(1);
  const expanded = clean.length === 3
    ? `${clean[0]}${clean[0]}${clean[1]}${clean[1]}${clean[2]}${clean[2]}`
    : clean;
  return {
    r: Number.parseInt(expanded.slice(0, 2), 16) || 0,
    g: Number.parseInt(expanded.slice(2, 4), 16) || 0,
    b: Number.parseInt(expanded.slice(4, 6), 16) || 0
  };
}

function cssColorWithTransparency(hex, transparencyPercent) {
  const { r, g, b } = hexToRgb(hex);
  const alpha = Math.max(0, Math.min(1, 1 - (normalizePercentNumber(transparencyPercent, 0) / 100)));
  if (alpha >= 0.999) return `rgb(${r}, ${g}, ${b})`;
  return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(2)})`;
}

function quickFromPreviewSnapshot(baseValues) {
  const next = { ...(baseValues || {}) };
  const doc = els.previewFrame?.contentDocument || null;
  const win = doc?.defaultView || null;
  if (!doc || !win) return next;

  const parsePx = (value, fallback = null) => {
    const m = String(value || "").match(/([0-9.]+)\s*px/i);
    if (!m) return fallback;
    const n = Number.parseFloat(m[1]);
    return Number.isFinite(n) ? n : fallback;
  };
  const parseLineHeightRatio = (lineHeightValue, fontSizePx, fallback) => {
    const raw = String(lineHeightValue || "").trim().toLowerCase();
    if (!raw || raw === "normal") return fallback;
    const px = parsePx(raw, null);
    if (Number.isFinite(px) && Number.isFinite(fontSizePx) && fontSizePx > 0) {
      return Math.max(1, Math.min(2.2, Number((px / fontSizePx).toFixed(2))));
    }
    const n = Number.parseFloat(raw);
    if (Number.isFinite(n)) return Math.max(1, Math.min(2.2, Number(n.toFixed(2))));
    return fallback;
  };
  const parseRemFromPx = (value, fallback) => {
    const px = parsePx(value, null);
    if (!Number.isFinite(px)) return fallback;
    return Math.max(1, Math.min(2.4, Number((px / 16).toFixed(2))));
  };
  const parseOptionPx = (value, fallback) => {
    const px = parsePx(value, null);
    if (!Number.isFinite(px)) return fallback;
    const rounded = Math.round(px);
    const candidate = `${rounded}px`;
    if (BOX_FONT_SIZE_OPTIONS.includes(candidate)) return candidate;
    if (rounded <= 15) return "14px";
    if (rounded <= 17) return "16px";
    if (rounded <= 19) return "18px";
    if (rounded <= 21) return "20px";
    if (rounded <= 23) return "22px";
    return "24px";
  };
  const first = (...selectors) => {
    for (const selector of selectors) {
      const node = doc.querySelector(selector);
      if (node) return node;
    }
    return null;
  };

  const content = first(".exe-content", "#node-content-container.exe-content");
  if (content) {
    const computed = win.getComputedStyle(content);
    if (computed.fontFamily) next.fontBody = computed.fontFamily;
    const fontSizePx = parsePx(computed.fontSize, null);
    if (Number.isFinite(fontSizePx)) next.baseFontSize = Math.round(fontSizePx);
    next.lineHeight = parseLineHeightRatio(computed.lineHeight, fontSizePx, next.lineHeight);
    if (computed.color) next.textColor = rgbToHex(computed.color, next.textColor);
    if (computed.backgroundColor && String(computed.backgroundColor).toLowerCase() !== "transparent") {
      next.contentBgColor = rgbToHex(computed.backgroundColor, next.contentBgColor);
    }
  }

  const pageTitle = first(".page-title");
  if (pageTitle) {
    const computed = win.getComputedStyle(pageTitle);
    if (computed.fontFamily) next.fontTitles = computed.fontFamily;
  } else {
    const boxTitle = first(".box-title", ".iDeviceTitle");
    if (boxTitle) {
      const computed = win.getComputedStyle(boxTitle);
      if (computed.fontFamily) next.fontTitles = computed.fontFamily;
    }
  }

  const boxTitle = first(".box-title", ".iDeviceTitle");
  if (boxTitle) {
    const computed = win.getComputedStyle(boxTitle);
    if (computed.color) next.boxTitleColor = rgbToHex(computed.color, next.boxTitleColor);
    next.boxTitleSize = parseRemFromPx(computed.fontSize, next.boxTitleSize);
  }

  const boxHead = first(".box-head");
  if (boxHead) {
    const computed = win.getComputedStyle(boxHead);
    const gap = parsePx(computed.gap, null);
    if (Number.isFinite(gap)) next.boxTitleGap = Math.max(0, Math.min(28, Math.round(gap)));
  }

  const boxContent = first(".box .box-content", ".box-content", ".iDevice_content", ".iDevice_inner");
  if (boxContent) {
    const computed = win.getComputedStyle(boxContent);
    if (computed.backgroundColor && String(computed.backgroundColor).toLowerCase() !== "transparent") {
      next.boxBgColor = rgbToHex(computed.backgroundColor, next.boxBgColor);
    }
    const align = String(computed.textAlign || "").toLowerCase();
    if (["left", "center", "right", "justify", "inherit"].includes(align)) next.boxTextAlign = align;
    next.boxFontSize = parseOptionPx(computed.fontSize, next.boxFontSize);
  }

  const box = first(".box");
  if (box) {
    const computed = win.getComputedStyle(box);
    if (computed.borderColor && String(computed.borderStyle || "").toLowerCase() !== "none") {
      next.boxBorderColor = rgbToHex(computed.borderColor, next.boxBorderColor);
    }
  }

  return next;
}

function sanitizeCssValue(input) {
  const raw = String(input || "").trim();
  if (!raw) return "";
  if (/[{};]/.test(raw)) return "";
  return raw;
}

function normalizePxNumber(input, fallback = 16) {
  const n = Number.parseFloat(String(input || "").replace("px", "").trim());
  if (!Number.isFinite(n)) return fallback;
  return Math.max(8, Math.min(96, Math.round(n)));
}

function getClickOverridesBlock(css) {
  const re = new RegExp(`${escapeRegExp(CLICK_OVERRIDES_START)}([\\s\\S]*?)${escapeRegExp(CLICK_OVERRIDES_END)}`, "i");
  const m = String(css || "").match(re);
  return m ? m[1] : "";
}

function stripClickOverridesBlock(css) {
  const re = new RegExp(`\\s*${escapeRegExp(CLICK_OVERRIDES_START)}[\\s\\S]*?${escapeRegExp(CLICK_OVERRIDES_END)}\\s*`, "gi");
  return String(css || "").replace(re, "\n").trimEnd();
}

function writeClickOverridesBlock(css, blockText) {
  const base = stripClickOverridesBlock(css);
  const body = String(blockText || "").trim();
  if (!body) return `${base}\n`;
  return `${base}\n\n${CLICK_OVERRIDES_START}\n${body}\n${CLICK_OVERRIDES_END}\n`;
}

function upsertClickOverrideRule(css, selector, declarations) {
  const cleanSelector = String(selector || "").trim();
  if (!cleanSelector || !declarations || typeof declarations !== "object") return css;
  const lines = [];
  for (const [prop, value] of Object.entries(declarations)) {
    if (!value) continue;
    lines.push(`  ${prop}: ${value} !important;`);
  }
  if (!lines.length) return css;
  let block = getClickOverridesBlock(css).trim();
  const selectorRe = new RegExp(`${escapeRegExp(cleanSelector)}\\s*\\{[\\s\\S]*?\\}`, "i");
  block = block.replace(selectorRe, "").trim();
  const rule = `${cleanSelector} {\n${lines.join("\n")}\n}`;
  block = block ? `${block}\n\n${rule}` : rule;
  return writeClickOverridesBlock(css, block);
}

function normalizeSelectorForMatch(selector) {
  return String(selector || "")
    .trim()
    .replace(/\s*([>+~])\s*/g, "$1")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function splitSelectorList(selectorText) {
  return String(selectorText || "")
    .split(",")
    .map((token) => normalizeSelectorForMatch(token))
    .filter(Boolean);
}

function parseCssRuleDeclarationsMap(cssText) {
  const map = new Map();
  const ruleRe = /([^{}]+)\{([^}]*)\}/g;
  for (const match of String(cssText || "").matchAll(ruleRe)) {
    const selectorRaw = String(match[1] || "").trim();
    const declarationsRaw = String(match[2] || "");
    if (!selectorRaw) continue;
    const selectors = splitSelectorList(selectorRaw);
    if (!selectors.length) continue;
    const props = new Set();
    for (const chunk of declarationsRaw.split(";")) {
      const line = String(chunk || "").trim();
      if (!line) continue;
      const colon = line.indexOf(":");
      if (colon <= 0) continue;
      const prop = line.slice(0, colon).trim().toLowerCase();
      if (prop) props.add(prop);
    }
    if (!props.size) continue;
    for (const selector of selectors) {
      const existing = map.get(selector) || new Set();
      for (const prop of props) existing.add(prop);
      map.set(selector, existing);
    }
  }
  return map;
}

function pruneClickOverridesConflicts(baseCss, quickCssBlock) {
  const quickRuleMap = parseCssRuleDeclarationsMap(quickCssBlock);
  if (!quickRuleMap.size) return baseCss;
  const clickBlock = getClickOverridesBlock(baseCss);
  if (!clickBlock.trim()) return baseCss;

  const ruleRe = /([^{}]+)\{([^}]*)\}/g;
  const keptRules = [];
  for (const match of clickBlock.matchAll(ruleRe)) {
    const selectorRaw = String(match[1] || "").trim();
    const declarationsRaw = String(match[2] || "");
    if (!selectorRaw) continue;
    const selectors = splitSelectorList(selectorRaw);
    const blockedProps = new Set();
    for (const selector of selectors) {
      const props = quickRuleMap.get(selector);
      if (!props) continue;
      for (const prop of props) blockedProps.add(prop);
    }
    if (!blockedProps.size) {
      keptRules.push(`${selectorRaw} {\n${declarationsRaw.trim()}\n}`);
      continue;
    }
    const keptLines = declarationsRaw
      .split(";")
      .map((chunk) => String(chunk || "").trim())
      .filter(Boolean)
      .filter((line) => {
        const colon = line.indexOf(":");
        if (colon <= 0) return false;
        const prop = line.slice(0, colon).trim().toLowerCase();
        return !blockedProps.has(prop);
      })
      .map((line) => `  ${line};`);
    if (keptLines.length) {
      keptRules.push(`${selectorRaw} {\n${keptLines.join("\n")}\n}`);
    }
  }
  return writeClickOverridesBlock(baseCss, keptRules.join("\n\n"));
}

function clearClickOverrides() {
  const css = readCss();
  const next = writeClickOverridesBlock(css, "");
  if (next === css) {
    setStatusT("status.noClickChangesToUndo", "No había cambios por clic que deshacer.");
    return;
  }
  writeCss(next);
  markDirty();
  setStatusT("status.clickChangesRemoved", "Cambios por clic eliminados.");
}

function renderFileList() {
  const selectedFilter = els.fileTypeFilter?.value || "all";
  const query = String(els.fileNameFilter?.value || "").trim().toLowerCase();
  els.fileList.innerHTML = "";
  const visiblePaths = [];
  for (const path of listFilesSorted()) {
    const group = fileGroup(path);
    if (selectedFilter !== "all" && group !== selectedFilter) continue;
    if (query && !path.toLowerCase().includes(query)) continue;
    visiblePaths.push(path);
    const btn = document.createElement("button");
    btn.className = `file-item${path === state.activePath ? " active" : ""}`;
    btn.type = "button";
    btn.textContent = path;
    btn.addEventListener("click", () => {
      state.activePath = path;
      syncEditorWithActiveFile();
      renderFileList();
    });
    els.fileList.appendChild(btn);
  }

  if (visiblePaths.length && !visiblePaths.includes(state.activePath)) {
    state.activePath = visiblePaths[0];
    syncEditorWithActiveFile();
    renderFileList();
    return;
  }

  if (!els.fileList.children.length) {
    const empty = document.createElement("div");
    empty.className = "file-group-header";
    empty.textContent = query
      ? i18nText("files.noSearchMatches", "No hay coincidencias para la búsqueda en este tipo.")
      : i18nText("files.noFilesForType", "No hay archivos para este tipo.");
    els.fileList.appendChild(empty);
  }
}

function syncEditorWithActiveFile() {
  const bytes = state.files.get(state.activePath);
  if (!bytes) {
    els.editorPath.textContent = i18nText("files.notFound", "Archivo no encontrado");
    els.textEditor.value = "";
    els.textEditor.disabled = true;
    els.textEditor.style.display = "block";
    els.imageActions.classList.remove("active");
    els.binaryPreview.classList.remove("active");
    els.binaryPreview.innerHTML = "";
    scheduleEditorHighlight(state.activePath);
    setDetachedEditorButtonState();
    syncDetachedEditorFromMain();
    return;
  }

  els.binaryPreview.classList.remove("active");
  els.binaryPreview.innerHTML = "";
  els.textEditor.style.display = "block";
  els.imageActions.classList.remove("active");

  if (!isTextFile(state.activePath)) {
    if (isImageFile(state.activePath)) {
      const url = getBlobUrl(state.activePath);
      els.editorPath.textContent = `${state.activePath} (imagen)`;
      els.textEditor.value = "Vista previa de imagen.";
      els.textEditor.disabled = true;
      els.textEditor.style.display = "none";
      els.imageActions.classList.add("active");
      els.binaryPreview.classList.add("active");
      els.binaryPreview.innerHTML = `
        <img src="${escapeHtml(url)}" alt="${escapeHtml(state.activePath)}" />
        <div class="file-meta">${escapeHtml(state.activePath)}</div>
      `;
      scheduleEditorHighlight(state.activePath);
      setDetachedEditorButtonState();
      syncDetachedEditorFromMain();
      return;
    }
    if (isFontFile(state.activePath)) {
      const url = getBlobUrl(state.activePath);
      const family = normalizeFontFamilyFromFileName(state.activePath.split("/").pop() || state.activePath);
      const stack = `${quoteFontFamily(family)}, Arial, Verdana, Helvetica, sans-serif`;
      els.editorPath.textContent = `${state.activePath} (fuente)`;
      els.textEditor.value = "Vista previa de fuente.";
      els.textEditor.disabled = true;
      els.textEditor.style.display = "none";
      els.binaryPreview.classList.add("active");
      els.binaryPreview.innerHTML = `
        <style>
          @font-face {
            font-family: "__preview_font__";
            src: url("${escapeHtml(url)}");
            font-display: swap;
          }
          .font-preview {
            font-family: "__preview_font__", Arial, sans-serif;
            font-size: 1.4rem;
            line-height: 1.4;
            text-align: left;
            padding: 10px;
          }
        </style>
        <div class="font-preview">
          <strong>${escapeHtml(family)}</strong><br />
          ABCDEFGHIJKLMNÑOPQRSTUVWXYZ<br />
          abcdefghijklmnñopqrstuvwxyz<br />
          0123456789 · áéíóú ü ¿? ¡!
        </div>
        <div class="font-quick-actions">
          <button type="button" data-font-action="add">Añadir fuente</button>
          <button type="button" data-font-target="body" data-font-stack="${escapeHtml(stack)}">Usar en general</button>
          <button type="button" data-font-target="titles" data-font-stack="${escapeHtml(stack)}">Usar en títulos</button>
          <button type="button" data-font-target="menu" data-font-stack="${escapeHtml(stack)}">Usar en menú</button>
          <button type="button" data-font-target="all" data-font-stack="${escapeHtml(stack)}">Usar en todas</button>
        </div>
        <div class="file-meta">${escapeHtml(state.activePath)}</div>
      `;
      scheduleEditorHighlight(state.activePath);
      setDetachedEditorButtonState();
      syncDetachedEditorFromMain();
      return;
    }
    els.editorPath.textContent = `${state.activePath} (binario)`;
    els.textEditor.value = "Este archivo es binario y no se edita aquí.";
    els.textEditor.disabled = true;
    scheduleEditorHighlight(state.activePath);
    setDetachedEditorButtonState();
    syncDetachedEditorFromMain();
    return;
  }

  els.editorPath.textContent = state.activePath;
  els.textEditor.style.display = "block";
  els.textEditor.disabled = false;
  els.textEditor.value = decode(bytes);
  scheduleEditorHighlight(state.activePath);
  setDetachedEditorButtonState();
  syncDetachedEditorFromMain();
}

function quickFromUI({ base = state.quick, onlyKey = "" } = {}) {
  const next = { ...base };
  const normalizedOnlyKey = String(onlyKey || "").trim();
  for (const input of els.quickInputs) {
    const key = input.dataset.quick;
    if (!key || !(key in next)) continue;
    if (normalizedOnlyKey && key !== normalizedOnlyKey) continue;
    if (input.type === "number") next[key] = Number(input.value || QUICK_DEFAULTS[key]);
    else if (input.type === "checkbox") next[key] = input.checked;
    else next[key] = input.value;
  }
  if (!CONTENT_WIDTH_MODE_OPTIONS.includes(String(next.contentWidthMode || "").toLowerCase())) {
    next.contentWidthMode = QUICK_DEFAULTS.contentWidthMode;
  } else {
    next.contentWidthMode = String(next.contentWidthMode).toLowerCase();
  }
  next.contentWidth = Math.max(640, Math.min(2000, Number(next.contentWidth) || QUICK_DEFAULTS.contentWidth));
  next.contentWidthPercent = Math.max(10, Math.min(100, Number(next.contentWidthPercent) || QUICK_DEFAULTS.contentWidthPercent));
  next.contentCentered = Boolean(next.contentCentered);
  next.contentOuterBgColor = normalizeHex(next.contentOuterBgColor, QUICK_DEFAULTS.contentOuterBgColor);
  if (next.contentWidthMode === "percent" && next.contentWidthPercent >= 100) next.contentCentered = true;
  next.baseFontSize = Math.max(12, Math.min(28, Number(next.baseFontSize) || QUICK_DEFAULTS.baseFontSize));
  next.lineHeight = Math.max(1, Math.min(2.2, Number(next.lineHeight) || QUICK_DEFAULTS.lineHeight));
  next.headerImageHeight = Math.max(48, Math.min(420, Number(next.headerImageHeight) || QUICK_DEFAULTS.headerImageHeight));
  if (!["contain", "cover", "auto"].includes(next.headerImageFit)) next.headerImageFit = QUICK_DEFAULTS.headerImageFit;
  if (!["left top", "center top", "right top", "left center", "center center", "right center", "left bottom", "center bottom", "right bottom"].includes(next.headerImagePosition)) {
    next.headerImagePosition = QUICK_DEFAULTS.headerImagePosition;
  }
  if (!["no-repeat", "repeat-x", "repeat-y", "repeat"].includes(next.headerImageRepeat)) next.headerImageRepeat = QUICK_DEFAULTS.headerImageRepeat;
  next.footerImageHeight = Math.max(36, Math.min(320, Number(next.footerImageHeight) || QUICK_DEFAULTS.footerImageHeight));
  if (!["contain", "cover", "auto"].includes(next.footerImageFit)) next.footerImageFit = QUICK_DEFAULTS.footerImageFit;
  if (!["left top", "center top", "right top", "left center", "center center", "right center", "left bottom", "center bottom", "right bottom"].includes(next.footerImagePosition)) {
    next.footerImagePosition = QUICK_DEFAULTS.footerImagePosition;
  }
  if (!["no-repeat", "repeat-x", "repeat-y", "repeat"].includes(next.bgImageRepeat)) next.bgImageRepeat = QUICK_DEFAULTS.bgImageRepeat;
  next.bgImageSoftness = Math.max(0, Math.min(90, Number(next.bgImageSoftness) || QUICK_DEFAULTS.bgImageSoftness));
  if (!["no-repeat", "repeat-x", "repeat-y", "repeat"].includes(next.footerImageRepeat)) next.footerImageRepeat = QUICK_DEFAULTS.footerImageRepeat;
  next.pageTitleSize = Math.max(1.1, Math.min(3.2, Number(next.pageTitleSize) || QUICK_DEFAULTS.pageTitleSize));
  next.pageTitleLetterSpacing = Math.max(0, Math.min(6, Number(next.pageTitleLetterSpacing) || QUICK_DEFAULTS.pageTitleLetterSpacing));
  next.pageTitleMarginBottom = Math.max(0, Math.min(2.5, Number(next.pageTitleMarginBottom) || QUICK_DEFAULTS.pageTitleMarginBottom));
  next.packageTitleSize = Math.max(0, Math.min(4, Number(next.packageTitleSize) || QUICK_DEFAULTS.packageTitleSize));
  next.boxTitleSize = Math.max(1, Math.min(2.4, Number(next.boxTitleSize) || QUICK_DEFAULTS.boxTitleSize));
  next.boxTitleGap = Math.max(0, Math.min(28, Number(next.boxTitleGap) || QUICK_DEFAULTS.boxTitleGap));
  if (!["inherit", "left", "center", "right", "justify"].includes(next.boxTextAlign)) {
    next.boxTextAlign = QUICK_DEFAULTS.boxTextAlign;
  }
  if (!BOX_FONT_SIZE_OPTIONS.includes(String(next.boxFontSize || "").toLowerCase())) {
    next.boxFontSize = QUICK_DEFAULTS.boxFontSize;
  } else {
    next.boxFontSize = String(next.boxFontSize).toLowerCase();
  }
  next.logoSize = Math.max(40, Math.min(500, Number(next.logoSize) || QUICK_DEFAULTS.logoSize));
  next.logoMarginX = Math.max(0, Math.min(300, Number(next.logoMarginX) || QUICK_DEFAULTS.logoMarginX));
  next.logoMarginY = Math.max(0, Math.min(300, Number(next.logoMarginY) || QUICK_DEFAULTS.logoMarginY));
  if (normalizeHex(next.menuTextColor) === normalizeHex(next.menuBgColor)) {
    next.menuTextColor = QUICK_DEFAULTS.menuTextColor;
  }
  if (normalizeHex(next.menuActiveTextColor) === normalizeHex(next.menuActiveBgColor)) {
    next.menuActiveTextColor = QUICK_DEFAULTS.menuActiveTextColor;
  }
  return next;
}

function quickToUI(values) {
  for (const input of els.quickInputs) {
    const key = input.dataset.quick;
    if (!key || !(key in values)) continue;
    if (key === "fontBody" || key === "fontTitles" || key === "fontMenu") {
      ensureFontFamilyOption(String(values[key]), input.id);
    }
    if (input.type === "checkbox") input.checked = Boolean(values[key]);
    else input.value = String(values[key]);
  }
  refreshHeaderFooterImageSelects();
  refreshNavIconSelects();
  updateLogoInfo();
  updateBgImageInfo();
  updateHeaderImageInfo();
  updateFooterImageInfo();
  updateNavIconsInfo();
  updateContentWidthControls(values);
}

function updateContentWidthControls(values = state.quick) {
  const mode = String(values?.contentWidthMode || QUICK_DEFAULTS.contentWidthMode).toLowerCase();
  const pxWrap = document.getElementById("contentWidthPxWrap");
  const percentWrap = document.getElementById("contentWidthPercentWrap");
  const centerWrap = document.getElementById("contentCenterWrap");
  const outerBgWrap = document.getElementById("contentOuterBgWrap");
  const mixedHint = document.getElementById("contentWidthMixedHint");
  const defaultSummary = document.getElementById("contentWidthDefaultSummary");
  const pct = Math.max(10, Math.min(100, Number(values?.contentWidthPercent) || QUICK_DEFAULTS.contentWidthPercent));

  let showPx = false;
  let showPercent = false;
  let showCenter = false;
  let showMixedHint = false;

  if (mode === "px") {
    showPx = true;
    showCenter = true;
  } else if (mode === "percent") {
    showPercent = true;
    showCenter = pct < 100;
  } else if (mode === "mixed") {
    showPx = true;
    showPercent = true;
    showCenter = true;
    showMixedHint = true;
  }

  if (pxWrap) pxWrap.hidden = !showPx;
  if (percentWrap) percentWrap.hidden = !showPercent;
  if (centerWrap) centerWrap.hidden = !showCenter;
  if (outerBgWrap) outerBgWrap.hidden = !showCenter;
  if (mixedHint) mixedHint.hidden = !showMixedHint;
  if (defaultSummary) {
    const showDefaultSummary = mode === "default";
    defaultSummary.hidden = !showDefaultSummary;
    if (showDefaultSummary) {
      defaultSummary.textContent = summarizeDefaultWidthConfig(readCss());
    }
  }
}

function summarizeDefaultWidthConfig(cssText) {
  const css = stripQuickBlock(String(cssText || ""));
  if (!css) return "El estilo no define un ancho específico: se usa el comportamiento por defecto del navegador.";

  const selectorHints = [
    "#node-content-container.exe-content #node-content",
    ".exe-web-site .page-content",
    ".exe-ims .page-content",
    ".exe-scorm .page-content",
    ".exe-web-site main.page",
    ".exe-ims main.page",
    ".exe-scorm main.page"
  ].map((s) => s.toLowerCase());
  const blockRe = /([^{}]+)\{([^}]*)\}/g;
  let maxWidth = "";
  let width = "";
  let marginLeft = "";
  let marginRight = "";
  let margin = "";

  for (const m of css.matchAll(blockRe)) {
    const selectorsRaw = String(m[1] || "").toLowerCase();
    const selectors = selectorsRaw.replace(/\s+/g, " ");
    if (!selectorHints.some((hint) => selectors.includes(hint))) continue;
    const declarations = String(m[2] || "");
    const grab = (prop) => {
      const re = new RegExp(`(?:^|[\\s;])${prop}(?![-\\w])\\s*:\\s*([^;]+)`, "gi");
      let last = "";
      for (const pm of declarations.matchAll(re)) last = String(pm[1] || "").trim();
      return last;
    };
    const w = grab("width");
    const mw = grab("max-width");
    const ml = grab("margin-left");
    const mr = grab("margin-right");
    const mg = grab("margin");
    if (w) width = w;
    if (mw) maxWidth = mw;
    if (ml) marginLeft = ml;
    if (mr) marginRight = mr;
    if (mg) margin = mg;
  }

  const normalizedWidth = String(width || "").replace(/\s+/g, "").toLowerCase();
  const isFluid100 = normalizedWidth === "100%" || normalizedWidth === "100vw";
  let widthText = "sin ancho explícito definido";
  if (isFluid100 && maxWidth) widthText = `ancho 100% con límite máximo ${maxWidth}`;
  else if (isFluid100) widthText = "ancho 100% (fluido)";
  else if (maxWidth) widthText = `ancho fluido (auto/100%) con límite máximo ${maxWidth}`;
  else if (width) widthText = `ancho ${width}`;

  let centered = false;
  if (marginLeft && marginRight) {
    centered = marginLeft.toLowerCase().includes("auto") && marginRight.toLowerCase().includes("auto");
  } else if (margin) {
    centered = /\bauto\b/i.test(margin);
  }

  return centered
    ? `Configuración del estilo: ${widthText}, contenido centrado.`
    : `Configuración del estilo: ${widthText}.`;
}

function previewFromUI() {
  const next = { ...state.preview };
  for (const input of els.previewInputs) {
    const key = input.dataset.preview;
    if (!key || !(key in next)) continue;
    next[key] = Boolean(input.checked);
  }
  return next;
}

function previewToUI(values) {
  for (const input of els.previewInputs) {
    const key = input.dataset.preview;
    if (!key || !(key in values)) continue;
    input.checked = Boolean(values[key]);
  }
}

function loadPreviewToggles() {
  try {
    const raw = window.localStorage.getItem(PREVIEW_TOGGLES_KEY);
    if (!raw) return { ...PREVIEW_DEFAULTS };
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return { ...PREVIEW_DEFAULTS };
    return { ...PREVIEW_DEFAULTS, ...parsed };
  } catch {
    return { ...PREVIEW_DEFAULTS };
  }
}

function savePreviewToggles(values) {
  try {
    window.localStorage.setItem(PREVIEW_TOGGLES_KEY, JSON.stringify(values));
  } catch {
    // ignore storage errors
  }
}

function applyPreviewTogglesFromUI() {
  state.preview = previewFromUI();
  savePreviewToggles(state.preview);
  renderPreview();
  setStatusT("status.previewUpdated", "Previsualización actualizada.");
}

function setupPreviewFrame() {
  const frame = els.previewFrame;
  if (!frame) return;

  frame.addEventListener("load", () => {
    if (state.elpxMode) {
      state.previewLastElpxCss = "";
      applyLiveElpxCssToFrame();
      bindClickEditFrameHandlers();
      renderLiveClickEditPreview();
      return;
    }
    bindClickEditFrameHandlers();
    if (state.previewPendingRender) renderPreview();
  });

  // Fallback: if iframe was already loaded before binding events, render once.
  window.setTimeout(() => {
    if (state.elpxMode) return;
    bindClickEditFrameHandlers();
  }, 0);
}

function setClickEditButtonState() {
  if (!els.previewInspectBtn) return;
  els.previewInspectBtn.setAttribute("aria-pressed", state.clickEditMode ? "true" : "false");
}

function resetClickEditModalPosition() {
  const card = els.clickEditCard;
  if (!card) return;
  card.style.left = "50%";
  card.style.top = "50%";
  card.style.transform = "translate(-50%, -50%)";
}

function removeLiveClickEditPreviewStyle() {
  const doc = els.previewFrame?.contentDocument || null;
  if (!doc) return;
  const node = doc.getElementById("editor-click-live-edit-style");
  if (node) node.remove();
}

function getClickEditFieldWrap(input) {
  return input?.closest("label") || null;
}

function defaultClickEditProfile() {
  return {
    allowText: true,
    allowBackground: true,
    allowWidth: true,
    allowMaxWidth: true,
    allowMarginBottom: true,
    allowPadding: true,
    allowInteractiveStates: true
  };
}

function currentClickEditProfile() {
  const profile = state.clickEditProfile;
  if (!profile || typeof profile !== "object") return defaultClickEditProfile();
  return { ...defaultClickEditProfile(), ...profile };
}

function setClickEditProfile(nextProfile) {
  state.clickEditProfile = { ...defaultClickEditProfile(), ...(nextProfile || {}) };
}

function profileForElementSelector(selector) {
  const value = String(selector || "").trim();
  if (!value) return defaultClickEditProfile();

  const textSafeProfile = {
    allowText: true,
    allowBackground: true,
    allowWidth: false,
    allowMaxWidth: false,
    allowMarginBottom: false,
    allowPadding: false
  };
  const contentSafeProfile = {
    allowText: true,
    allowBackground: true,
    allowWidth: false,
    allowMaxWidth: false,
    allowMarginBottom: true,
    allowPadding: true
  };
  const layoutSafeProfile = {
    allowText: false,
    allowBackground: true,
    allowWidth: false,
    allowMaxWidth: false,
    allowMarginBottom: false,
    allowPadding: false,
    allowInteractiveStates: false
  };

  if (
    /(?:^|,)\s*\.exe-content\s+\.fx-accordion-title\s+h[1-6]\b/i.test(value) ||
    /(?:^|,)\s*\.exe-content\s+\.exe-tabs\s+\.fx-tabs\s+a\b/i.test(value) ||
    /(?:^|,)\s*\.exe-content\s+\.fx-pagination\s+(?:\.fx-current\s+)?a\b/i.test(value) ||
    /(?:^|,)\s*\.exe-content\s+\.fx-carousel-pagination\s+a\b/i.test(value) ||
    /(?:^|,)\s*\.exe-content\s+\.fx-timeline-(?:major\s+h2|minor\s+h3)\s+a\b/i.test(value) ||
    /(?:^|,)\s*\.exe-content\s+\.fx-timeline-expand\b/i.test(value) ||
    /(?:^|,)\s*#siteNav\s+a\b/i.test(value) ||
    /(?:^|,)\s*\.nav-buttons\s+a\b/i.test(value) ||
    /(?:^|,)\s*\.nav-buttons\s+span\.nav-button\b/i.test(value) ||
    /(?:^|,)\s*\.exe-content\s+\.package-title\b/i.test(value) ||
    /(?:^|,)\s*\.exe-content\s+\.page-title\b/i.test(value) ||
    /(?:^|,)\s*\.exe-content\s+\.box-title\b/i.test(value) ||
    /(?:^|,)\s*\.exe-content\s+\.iDeviceTitle\b/i.test(value)
  ) {
    return textSafeProfile;
  }

  if (
    /(?:^|,)\s*\.exe-content\s+\.fx-accordion-content\b/i.test(value) ||
    /(?:^|,)\s*\.exe-content\s+\.exe-tabs\s+\.fx-tab-content\b/i.test(value) ||
    /(?:^|,)\s*\.exe-content\s+\.fx-page-content\b/i.test(value) ||
    /(?:^|,)\s*\.exe-content\s+\.fx-carousel-content\b/i.test(value) ||
    /(?:^|,)\s*\.exe-content\s+\.fx-timeline-event\b/i.test(value) ||
    /(?:^|,)\s*\.exe-content\s+.*(?:\.box-content|\.iDevice_content|\.iDevice_inner)\b/i.test(value)
  ) {
    return contentSafeProfile;
  }

  if (
    /(?:^|,)\s*#siteNav\b/i.test(value) ||
    /(?:^|,)\s*\.nav-buttons\b/i.test(value) ||
    /(?:^|,)\s*\.exe-content\s+\.exe-fx(?:[.\s]|$)/i.test(value) ||
    /(?:^|,)\s*\.exe-content\s+\.fx-timeline-container\b/i.test(value)
  ) {
    return layoutSafeProfile;
  }

  return defaultClickEditProfile();
}

function resetClickEditTouchedFields() {
  state.clickEditTouchedFields = Object.create(null);
}

function markClickEditFieldTouched(fieldKey) {
  const key = String(fieldKey || "").trim();
  if (!key) return;
  if (!state.clickEditTouchedFields || typeof state.clickEditTouchedFields !== "object") {
    resetClickEditTouchedFields();
  }
  state.clickEditTouchedFields[key] = true;
}

function wasClickEditFieldTouched(...fieldKeys) {
  const touched = state.clickEditTouchedFields;
  if (!touched || typeof touched !== "object") return false;
  return fieldKeys.some((key) => Boolean(touched[key]));
}

function expandedClickEditSelector() {
  const baseSelector = String(state.clickEditTargetSelector || "").trim();
  if (!baseSelector) return "";
  const withInteractiveStates = Boolean(
    els.clickApplyInteractiveStates?.checked && !els.clickApplyInteractiveWrap?.hidden
  );
  return withInteractiveStates
    ? `${baseSelector},\n${baseSelector}:hover,\n${baseSelector}:focus,\n${baseSelector}:active`
    : baseSelector;
}

function currentClickEditDeclarations() {
  const profile = currentClickEditProfile();
  const bgHex = normalizeHex(els.clickPropBg?.value || "");
  const bgTransparency = normalizePercentNumber(els.clickPropBgAlpha?.value || "0", 0);
  const declarations = {};
  if (profile.allowBackground && wasClickEditFieldTouched("bg", "bgAlpha") && !(state.clickEditBgInitiallyTransparent && bgTransparency >= 100)) {
    declarations["background-color"] = cssColorWithTransparency(bgHex, bgTransparency);
  }
  if (profile.allowText && state.clickEditHasText) {
    const textHex = normalizeHex(els.clickPropColor?.value || "");
    const textTransparency = normalizePercentNumber(els.clickPropColorAlpha?.value || "0", 0);
    if (wasClickEditFieldTouched("color", "colorAlpha")) {
      declarations.color = cssColorWithTransparency(textHex, textTransparency);
    }
    if (wasClickEditFieldTouched("fontSize")) {
      declarations["font-size"] = `${normalizePxNumber(els.clickPropFontSize?.value || "16", 16)}px`;
    }
    if (wasClickEditFieldTouched("fontWeight")) {
      declarations["font-weight"] = String(Number.parseInt(els.clickPropFontWeight?.value || "400", 10) || 400);
    }
  }
  const width = sanitizeCssValue(els.clickPropWidth?.value || "");
  const maxWidth = sanitizeCssValue(els.clickPropMaxWidth?.value || "");
  const marginBottom = sanitizeCssValue(els.clickPropMarginBottom?.value || "");
  const padding = sanitizeCssValue(els.clickPropPadding?.value || "");
  if (profile.allowWidth && wasClickEditFieldTouched("width") && width) declarations.width = width;
  if (profile.allowMaxWidth && wasClickEditFieldTouched("maxWidth") && maxWidth) declarations["max-width"] = maxWidth;
  if (profile.allowMarginBottom && wasClickEditFieldTouched("marginBottom") && marginBottom) declarations["margin-bottom"] = marginBottom;
  if (profile.allowPadding && wasClickEditFieldTouched("padding") && padding) declarations.padding = padding;
  return declarations;
}

function renderLiveClickEditPreview() {
  if (!state.elpxMode || !els.clickEditModal || els.clickEditModal.hidden) return;
  const selector = expandedClickEditSelector();
  if (!selector) {
    removeLiveClickEditPreviewStyle();
    return;
  }
  const declarations = currentClickEditDeclarations();
  const lines = [];
  for (const [prop, value] of Object.entries(declarations)) {
    if (!value) continue;
    lines.push(`  ${prop}: ${value} !important;`);
  }
  if (!lines.length) {
    removeLiveClickEditPreviewStyle();
    return;
  }
  const doc = els.previewFrame?.contentDocument || null;
  if (!doc?.head) return;
  let node = doc.getElementById("editor-click-live-edit-style");
  if (!node) {
    node = doc.createElement("style");
    node.id = "editor-click-live-edit-style";
    doc.head.appendChild(node);
  }
  node.textContent = `${selector} {\n${lines.join("\n")}\n}\n`;
}

function openClickEditModal() {
  if (!els.clickEditModal) return;
  els.clickEditModal.hidden = false;
  resetClickEditModalPosition();
}

function closeClickEditModal() {
  if (!els.clickEditModal) return;
  els.clickEditModal.hidden = true;
  state.clickEditDragActive = false;
  state.clickEditProfile = null;
  resetClickEditTouchedFields();
  removeLiveClickEditPreviewStyle();
}

function onClickEditModalDragMove(ev) {
  if (!state.clickEditDragActive || !els.clickEditCard) return;
  ev.preventDefault();
  const card = els.clickEditCard;
  const viewportW = window.innerWidth || document.documentElement.clientWidth || 1200;
  const viewportH = window.innerHeight || document.documentElement.clientHeight || 800;
  const cardW = Math.max(260, card.offsetWidth || 520);
  const cardH = Math.max(180, card.offsetHeight || 360);
  let left = ev.clientX - state.clickEditDragOffsetX;
  let top = ev.clientY - state.clickEditDragOffsetY;
  left = Math.max(6, Math.min(viewportW - cardW - 6, left));
  top = Math.max(6, Math.min(viewportH - cardH - 6, top));
  card.style.transform = "none";
  card.style.left = `${left}px`;
  card.style.top = `${top}px`;
}

function stopClickEditModalDrag() {
  state.clickEditDragActive = false;
  document.removeEventListener("mousemove", onClickEditModalDragMove, true);
  document.removeEventListener("mouseup", stopClickEditModalDrag, true);
}

function startClickEditModalDrag(ev) {
  if (ev.button !== 0 || !els.clickEditCard || !els.clickEditModal || els.clickEditModal.hidden) return;
  ev.preventDefault();
  const rect = els.clickEditCard.getBoundingClientRect();
  els.clickEditCard.style.transform = "none";
  els.clickEditCard.style.left = `${rect.left}px`;
  els.clickEditCard.style.top = `${rect.top}px`;
  state.clickEditDragActive = true;
  state.clickEditDragOffsetX = ev.clientX - rect.left;
  state.clickEditDragOffsetY = ev.clientY - rect.top;
  document.addEventListener("mousemove", onClickEditModalDragMove, true);
  document.addEventListener("mouseup", stopClickEditModalDrag, true);
}

function ideviceTypeClassFromElement(el) {
  if (!isDomElement(el)) return "";
  let node = el;
  while (node && isDomElement(node)) {
    const classes = Array.from(node.classList || []);
    const typeClass = classes.find((name) => /Idevice$/i.test(name) && !/^iDevice(?:_|$)/i.test(name));
    if (typeClass) return typeClass;
    node = node.parentElement;
  }
  return "";
}

function buildFxSelector(el) {
  if (!isDomElement(el)) return "";
  const directMap = [
    [
      ".fx-accordion-title h1, .fx-accordion-title h2, .fx-accordion-title h3, .fx-accordion-title h4, .fx-accordion-title h5, .fx-accordion-title h6",
      ".exe-content .fx-accordion-title h1, .exe-content .fx-accordion-title h2, .exe-content .fx-accordion-title h3, .exe-content .fx-accordion-title h4, .exe-content .fx-accordion-title h5, .exe-content .fx-accordion-title h6"
    ],
    [".fx-accordion-title", ".exe-content .fx-accordion-title"],
    [".fx-accordion-content", ".exe-content .fx-accordion-content"],
    [".exe-tabs .fx-tabs a", ".exe-content .exe-tabs .fx-tabs a"],
    [".exe-tabs .fx-tab-content", ".exe-content .exe-tabs .fx-tab-content"],
    [".fx-pagination .fx-current a", ".exe-content .fx-pagination .fx-current a"],
    [".fx-pagination a", ".exe-content .fx-pagination a"],
    [".fx-page-content", ".exe-content .fx-page-content"],
    [".fx-carousel-pagination a", ".exe-content .fx-carousel-pagination a"],
    [".fx-carousel-content", ".exe-content .fx-carousel-content"],
    [".fx-timeline-major h2 a", ".exe-content .fx-timeline-major h2 a"],
    [".fx-timeline-minor h3 a", ".exe-content .fx-timeline-minor h3 a"],
    [".fx-timeline-event", ".exe-content .fx-timeline-event"],
    [".fx-timeline-expand", ".exe-content .fx-timeline-expand"]
  ];
  for (const [query, selector] of directMap) {
    if (el.closest(query)) return selector;
  }
  const fxContainer = el.closest(".exe-fx");
  if (!fxContainer) return "";
  if (fxContainer.classList.contains("exe-accordion")) return ".exe-content .exe-fx.exe-accordion";
  if (fxContainer.classList.contains("exe-tabs")) return ".exe-content .exe-fx.exe-tabs";
  if (fxContainer.classList.contains("exe-paginated")) return ".exe-content .exe-fx.exe-paginated";
  if (fxContainer.classList.contains("exe-carousel")) return ".exe-content .exe-fx.exe-carousel";
  if (fxContainer.classList.contains("fx-timeline-container")) return ".exe-content .fx-timeline-container";
  return ".exe-content .exe-fx";
}

function buildElementSelector(el) {
  if (!isDomElement(el)) return "";
  const tag = String(el.tagName || "").toLowerCase();

  if (el.closest("#siteNav")) {
    if (tag === "a" || el.closest("a")) return "#siteNav a";
    return "#siteNav";
  }
  if (el.closest(".nav-buttons")) {
    if (tag === "a" || el.closest(".nav-buttons a")) return ".nav-buttons a";
    if (el.closest(".nav-buttons span.nav-button")) return ".nav-buttons span.nav-button";
    return ".nav-buttons";
  }
  const fxSelector = buildFxSelector(el);
  if (fxSelector) return fxSelector;
  if (el.closest(".package-title")) return ".exe-content .package-title";
  if (el.closest(".page-title")) return ".exe-content .page-title";
  if (el.closest(".box-title, .iDeviceTitle")) return ".exe-content .box-title, .exe-content .iDeviceTitle";
  if (el.closest(".box-content, .iDevice_content, .iDevice_inner")) {
    const ideviceType = ideviceTypeClassFromElement(el);
    if (ideviceType) {
      return `.exe-content .${cssEscape(ideviceType)} .box-content, .exe-content .${cssEscape(ideviceType)} .iDevice_content, .exe-content .${cssEscape(ideviceType)} .iDevice_inner`;
    }
    return ".exe-content .box-content, .exe-content .iDevice_content, .exe-content .iDevice_inner";
  }

  const ideviceType = ideviceTypeClassFromElement(el);
  if (ideviceType) {
    if (tag === "a" || el.closest("a")) return `.exe-content .${cssEscape(ideviceType)} a`;
    if (tag === "button" || el.closest("button")) return `.exe-content .${cssEscape(ideviceType)} button:not(.toggler):not(.box-toggle)`;
    if (/^(h1|h2|h3|h4|h5|h6)$/.test(tag)) return `.exe-content .${cssEscape(ideviceType)} ${tag}`;
    return `.exe-content .${cssEscape(ideviceType)}`;
  }

  if (tag === "a" || el.closest("a")) return ".exe-content a";
  if (tag === "button" || el.closest("button")) return ".exe-content button:not(.toggler):not(.box-toggle)";
  if (/^(h1|h2|h3|h4|h5|h6|p|li|td|th|blockquote)$/.test(tag)) return `.exe-content ${tag}`;
  if (el.id) return `#${cssEscape(el.id)}`;
  return ".exe-content";
}

function isInteractiveLikeElement(el, computedStyle = null) {
  if (!isDomElement(el)) return false;
  const tag = String(el.tagName || "").toLowerCase();
  if (["a", "button", "summary", "input", "select", "textarea"].includes(tag)) return true;
  if (el.closest("a, button, summary, [role='button'], #siteNav, .nav-buttons, .box-toggle, .toggler")) return true;
  const computed = computedStyle || (el.ownerDocument?.defaultView || window).getComputedStyle(el);
  if (String(computed?.cursor || "").toLowerCase() === "pointer") return true;
  return false;
}

function elementHasVisibleText(el) {
  if (!isDomElement(el)) return false;
  const doc = el.ownerDocument || document;
  const walker = doc.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const text = String(walker.currentNode?.textContent || "").replace(/\s+/g, " ").trim();
    if (text) return true;
  }
  return false;
}

function fillClickEditModalFromElement(el, selector) {
  if (!isDomElement(el)) return;
  const ownerWin = el.ownerDocument?.defaultView || window;
  const computed = ownerWin.getComputedStyle(el);
  const bgAlpha = alphaPercentFromColor(computed.backgroundColor, 0);
  const profile = profileForElementSelector(selector);
  const hasText = elementHasVisibleText(el);
  const allowText = profile.allowText && hasText;
  resetClickEditTouchedFields();
  setClickEditProfile(profile);
  if (els.clickEditSelector) els.clickEditSelector.textContent = selector || "(sin selector)";
  if (els.clickPropColor) els.clickPropColor.value = rgbToHex(computed.color, "#333333");
  if (els.clickPropBg) els.clickPropBg.value = rgbToHex(computed.backgroundColor, "#ffffff");
  if (els.clickPropColorAlpha) els.clickPropColorAlpha.value = String(alphaPercentFromColor(computed.color, 0));
  if (els.clickPropBgAlpha) els.clickPropBgAlpha.value = String(bgAlpha);
  if (els.clickPropFontSize) els.clickPropFontSize.value = String(normalizePxNumber(computed.fontSize, 16));
  if (els.clickPropFontWeight) {
    const weight = Number.parseInt(String(computed.fontWeight || "400"), 10);
    const clamped = Number.isFinite(weight) ? Math.max(400, Math.min(800, Math.round(weight / 100) * 100)) : 400;
    els.clickPropFontWeight.value = String(clamped);
  }
  if (els.clickPropWidth) {
    const width = String(computed.width || "").trim();
    els.clickPropWidth.value = width && width !== "auto" ? width : "";
  }
  if (els.clickPropMaxWidth) {
    const maxWidth = String(computed.maxWidth || "").trim();
    els.clickPropMaxWidth.value = maxWidth && maxWidth !== "none" ? maxWidth : "";
  }
  if (els.clickPropMarginBottom) {
    const marginBottom = String(computed.marginBottom || "").trim();
    els.clickPropMarginBottom.value = marginBottom && marginBottom !== "auto" ? marginBottom : "";
  }
  if (els.clickPropPadding) {
    const padding = String(computed.padding || "").trim();
    els.clickPropPadding.value = padding && padding !== "0px" ? padding : "";
  }
  state.clickEditHasText = hasText;
  state.clickEditBgInitiallyTransparent = bgAlpha >= 100;
  if (els.clickTextColorWrap) els.clickTextColorWrap.hidden = !allowText;
  if (els.clickTextAlphaWrap) els.clickTextAlphaWrap.hidden = !allowText;
  if (els.clickTextSizeWrap) els.clickTextSizeWrap.hidden = !allowText;
  if (els.clickTextWeightWrap) els.clickTextWeightWrap.hidden = !allowText;
  const bgWrap = getClickEditFieldWrap(els.clickPropBg);
  const bgAlphaWrap = getClickEditFieldWrap(els.clickPropBgAlpha);
  const widthWrap = getClickEditFieldWrap(els.clickPropWidth);
  const maxWidthWrap = getClickEditFieldWrap(els.clickPropMaxWidth);
  const marginBottomWrap = getClickEditFieldWrap(els.clickPropMarginBottom);
  const paddingWrap = getClickEditFieldWrap(els.clickPropPadding);
  if (bgWrap) bgWrap.hidden = !profile.allowBackground;
  if (bgAlphaWrap) bgAlphaWrap.hidden = !profile.allowBackground;
  if (widthWrap) widthWrap.hidden = !profile.allowWidth;
  if (maxWidthWrap) maxWidthWrap.hidden = !profile.allowMaxWidth;
  if (marginBottomWrap) marginBottomWrap.hidden = !profile.allowMarginBottom;
  if (paddingWrap) paddingWrap.hidden = !profile.allowPadding;
  const canUseInteractiveStates = isInteractiveLikeElement(el, computed);
  if (els.clickApplyInteractiveWrap) els.clickApplyInteractiveWrap.hidden = !(canUseInteractiveStates && profile.allowInteractiveStates);
  if (els.clickApplyInteractiveStates) {
    els.clickApplyInteractiveStates.checked = canUseInteractiveStates && profile.allowInteractiveStates;
  }
}

function injectClickEditPreviewStyle(doc) {
  if (!isDomDocument(doc) || !doc.head) return;
  let styleNode = doc.getElementById("editor-click-mode-style");
  if (!styleNode) {
    styleNode = doc.createElement("style");
    styleNode.id = "editor-click-mode-style";
    styleNode.textContent = `
      html[data-editor-click-mode="1"], html[data-editor-click-mode="1"] * { cursor: crosshair !important; }
      [data-editor-click-hover="1"] { outline: 2px dashed #0ba1a1 !important; outline-offset: 1px; }
    `;
    doc.head.appendChild(styleNode);
  }
  doc.documentElement.setAttribute("data-editor-click-mode", state.clickEditMode ? "1" : "0");
}

function removeClickEditHoverMarker(doc) {
  if (!isDomDocument(doc)) return;
  const prev = doc.querySelector("[data-editor-click-hover='1']");
  if (prev) prev.removeAttribute("data-editor-click-hover");
}

function handleClickEditMouseMove(ev) {
  if (!state.clickEditMode) return;
  const doc = ev.currentTarget;
  if (!isDomDocument(doc)) return;
  const target = targetElementFromEventTarget(ev.target);
  if (!target) return;
  removeClickEditHoverMarker(doc);
  target.setAttribute("data-editor-click-hover", "1");
}

function handleClickEditClick(ev) {
  if (!state.clickEditMode) return;
  if (Date.now() < Number(state.clickEditIgnoreUntil || 0)) return;
  ev.preventDefault();
  ev.stopPropagation();
  const target = targetElementFromEventTarget(ev.target);
  if (!target) return;
  const selector = buildElementSelector(target);
  if (!selector) {
    setStatusT("status.selectorNotIdentified", "No se pudo identificar un selector para ese elemento.");
    return;
  }
  state.clickEditTargetSelector = selector;
  fillClickEditModalFromElement(target, selector);
  openClickEditModal();
}

function onClickEditFrameMouseMove(ev) {
  handleClickEditMouseMove(ev);
}

function onClickEditFrameClick(ev) {
  handleClickEditClick(ev);
}

function unbindClickEditFrameHandlers() {
  const doc = state.clickEditFrameDoc;
  if (!isDomDocument(doc)) return;
  const win = doc.defaultView;
  if (win) win.removeEventListener("click", onClickEditFrameClick, true);
  doc.removeEventListener("mousemove", onClickEditFrameMouseMove, true);
  doc.removeEventListener("click", onClickEditFrameClick, true);
  doc.documentElement.removeAttribute("data-editor-click-mode");
  removeClickEditHoverMarker(doc);
  state.clickEditFrameDoc = null;
}

function bindClickEditFrameHandlers() {
  const frame = els.previewFrame;
  let doc = null;
  try {
    doc = frame?.contentDocument || null;
  } catch {
    doc = null;
  }
  if (!isDomDocument(doc)) return;
  if (state.clickEditFrameDoc !== doc) {
    unbindClickEditFrameHandlers();
    state.clickEditFrameDoc = doc;
  }
  injectClickEditPreviewStyle(doc);
  doc.removeEventListener("mousemove", onClickEditFrameMouseMove, true);
  doc.removeEventListener("click", onClickEditFrameClick, true);
  if (!state.clickEditMode) return;
  const win = doc.defaultView;
  if (win) {
    win.removeEventListener("click", onClickEditFrameClick, true);
    win.addEventListener("click", onClickEditFrameClick, true);
  }
  doc.addEventListener("mousemove", onClickEditFrameMouseMove, true);
  doc.addEventListener("click", onClickEditFrameClick, true);
}

function setClickEditMode(nextMode) {
  state.clickEditMode = Boolean(nextMode);
  setClickEditButtonState();
  if (!state.clickEditMode) {
    closeClickEditModal();
    state.clickEditTargetSelector = "";
  }
  bindClickEditFrameHandlers();
  setStatus(state.clickEditMode
    ? "Modo edición por clic activo: haz clic en un elemento de la previsualización."
    : "Modo navegación activo.");
}

function toggleClickEditMode() {
  setClickEditMode(!state.clickEditMode);
}

function applyClickEditChanges() {
  const baseSelector = String(state.clickEditTargetSelector || "").trim();
  if (!baseSelector) {
    setStatusT("status.noElementSelected", "No hay elemento seleccionado para aplicar cambios.");
    return;
  }
  const selector = expandedClickEditSelector();
  const withInteractiveStates = selector.includes(":hover");
  const declarations = currentClickEditDeclarations();
  const css = readCss();
  const nextCss = upsertClickOverrideRule(css, selector, declarations);
  state.clickEditIgnoreUntil = Date.now() + 350;
  if (nextCss === css) {
    closeClickEditModal();
    setStatusT("status.noNewClickChanges", "No había cambios nuevos para aplicar.");
    return;
  }
  writeCss(nextCss);
  markDirty();
  closeClickEditModal();
  setStatus(i18nText(
    "status.clickChangesApplied",
    `Cambios aplicados en ${baseSelector}${withInteractiveStates ? " (incluye hover/focus/active)" : ""}`,
    { selector: baseSelector, extra: withInteractiveStates ? " (incluye hover/focus/active)" : "" }
  ));
}

function ensureFontFamilyOption(fontValue, selectId) {
  const select = document.getElementById(selectId);
  if (!select || !fontValue) return;
  const exists = Array.from(select.options).some((opt) => opt.value === fontValue);
  if (exists) return;
  const firstFamily = String(fontValue)
    .split(",")[0]
    .trim()
    .replace(/^['"]|['"]$/g, "");
  const opt = document.createElement("option");
  opt.value = fontValue;
  opt.textContent = `Detectada: ${firstFamily}`;
  select.prepend(opt);
}

function quickFromCss(cssText) {
  const q = { ...QUICK_DEFAULTS };
  const lastCssPropValue = (selectorPattern, propPattern) => {
    const blockRe = new RegExp(`${selectorPattern}\\s*\\{([^}]*)\\}`, "gi");
    let value = "";
    for (const m of cssText.matchAll(blockRe)) {
      const decls = m[1] || "";
      const propRe = new RegExp(`(?:^|[\\s;])(?:${propPattern})(?![-\\w])\\s*:\\s*([^;]+);`, "i");
      const pm = decls.match(propRe);
      if (pm && pm[1]) value = pm[1].trim();
    }
    return value;
  };
  const matchValue = (regex, fallback) => {
    const matches = Array.from(cssText.matchAll(new RegExp(regex.source, regex.flags.includes("g") ? regex.flags : `${regex.flags}g`)));
    if (!matches.length) return fallback;
    const last = matches[matches.length - 1];
    return last && last[1] ? last[1].trim() : fallback;
  };
  const extractCssUrl = (value) => {
    const m = String(value || "").match(/url\(\s*(["']?)([^"')]+)\1\s*\)/i);
    if (!m || !m[2]) return "";
    return normalizePath(m[2].trim());
  };
  const parseCssPx = (value, fallback) => {
    const m = String(value || "").match(/([0-9.]+)\s*px/i);
    if (!m) return fallback;
    const n = Number.parseFloat(m[1]);
    return Number.isFinite(n) ? Math.round(n) : fallback;
  };
  const parseCssLengthToRem = (value, fallback) => {
    const raw = String(value || "").trim().toLowerCase();
    if (!raw) return fallback;
    const rem = raw.match(/^([0-9.]+)\s*rem$/);
    if (rem) {
      const n = Number.parseFloat(rem[1]);
      return Number.isFinite(n) ? n : fallback;
    }
    const em = raw.match(/^([0-9.]+)\s*em$/);
    if (em) {
      const n = Number.parseFloat(em[1]);
      return Number.isFinite(n) ? n : fallback;
    }
    const px = raw.match(/^([0-9.]+)\s*px$/);
    if (px) {
      const n = Number.parseFloat(px[1]);
      return Number.isFinite(n) ? n / 16 : fallback;
    }
    const pct = raw.match(/^([0-9.]+)\s*%$/);
    if (pct) {
      const n = Number.parseFloat(pct[1]);
      return Number.isFinite(n) ? n / 100 : fallback;
    }
    return fallback;
  };
  const normalizeBgFit = (value, fallback) => {
    const v = String(value || "").trim().toLowerCase();
    if (v === "contain" || v === "cover" || v === "auto") return v;
    return fallback;
  };
  const normalizeBgPosition = (value, fallback) => {
    const v = String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
    const allowed = new Set(["left", "center", "right", "top", "bottom"]);
    const mapAxis = (token, axis) => {
      const t = String(token || "").trim().toLowerCase();
      if (axis === "x") {
        if (t === "0" || t === "0px" || t === "0%") return "left";
        if (t === "50%" || t === "50" || t === "center") return "center";
        if (t === "100%" || t === "100" || t === "right") return "right";
        if (t === "left" || t === "right") return t;
      } else {
        if (t === "0" || t === "0px" || t === "0%") return "top";
        if (t === "50%" || t === "50" || t === "center") return "center";
        if (t === "100%" || t === "100" || t === "bottom") return "bottom";
        if (t === "top" || t === "bottom") return t;
      }
      return "";
    };

    const tokens = v.split(" ").filter(Boolean);
    if (!tokens.length) return fallback;
    if (tokens.length === 1) {
      if (tokens[0] === "left" || tokens[0] === "center" || tokens[0] === "right") return `${tokens[0]} center`;
      if (tokens[0] === "top" || tokens[0] === "bottom") return `center ${tokens[0]}`;
      return fallback;
    }
    const x = mapAxis(tokens[0], "x");
    const y = mapAxis(tokens[1], "y");
    if (!allowed.has(x) || !allowed.has(y)) return fallback;
    return `${x} ${y}`;
  };
  const normalizeBgRepeat = (value, fallback) => {
    const v = String(value || "").trim().toLowerCase();
    if (v === "no-repeat" || v === "repeat-x" || v === "repeat-y" || v === "repeat") return v;
    return fallback;
  };
  const normalizeSelectorText = (selector) => String(selector || "").replace(/\s+/g, " ").trim();
  const cssRules = Array.from(cssText.matchAll(/([^{}]+)\{([^}]*)\}/g)).map((m) => ({
    selectors: String(m[1] || ""),
    declarations: String(m[2] || "")
  }));
  const selectorListContains = (selectorsText, targetSelector) => {
    const target = normalizeSelectorText(targetSelector);
    if (!target) return false;
    return selectorsText
      .split(",")
      .map(normalizeSelectorText)
      .some((s) => s === target);
  };
  const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const lastRulePropValue = (selectors, propNames) => {
    let value = "";
    for (const rule of cssRules) {
      const applies = selectors.some((s) => selectorListContains(rule.selectors, s));
      if (!applies) continue;
      for (const propName of propNames) {
        const propRe = new RegExp(`(?:^|[\\s;])${escapeRegExp(propName)}(?![-\\w])\\s*:\\s*([^;]+);?`, "gi");
        for (const pm of rule.declarations.matchAll(propRe)) {
          if (pm && pm[1]) value = pm[1].trim();
        }
      }
    }
    return value;
  };
  const lastRulePropWithUrl = (selectors, propNames) => {
    let value = "";
    for (const rule of cssRules) {
      const applies = selectors.some((s) => selectorListContains(rule.selectors, s));
      if (!applies) continue;
      for (const propName of propNames) {
        const propRe = new RegExp(`(?:^|[\\s;])${escapeRegExp(propName)}(?![-\\w])\\s*:\\s*([^;]+);?`, "gi");
        for (const pm of rule.declarations.matchAll(propRe)) {
          const candidate = pm && pm[1] ? pm[1].trim() : "";
          if (extractCssUrl(candidate)) value = candidate;
        }
      }
    }
    return value;
  };
  const bodyModeSelectors = ["body.exe-web-site", "body.exe-ims", "body.exe-scorm", "body.exe-export", "body"];
  const contentTypographySelectors = [".exe-content", "#node-content-container.exe-content"];
  const bodyFontSizeRaw = lastRulePropValue(bodyModeSelectors, ["font-size"]);
  const bodyLineHeightRaw = lastRulePropValue(bodyModeSelectors, ["line-height"]);
  const contentFontSizeRaw = lastRulePropValue(contentTypographySelectors, ["font-size"]);
  const contentLineHeightRaw = lastRulePropValue(contentTypographySelectors, ["line-height"]);
  const contentFontFamilyRaw = lastRulePropValue(contentTypographySelectors, ["font-family"]);

  q.pageBgColor = normalizeHex(
    lastRulePropValue(bodyModeSelectors, ["background-color", "background"]) || q.pageBgColor,
    q.pageBgColor
  );
  q.fontBody = matchValue(
    /\.exe-content\s*\{[\s\S]*?font-family:\s*([^;]+);/i,
    contentFontFamilyRaw || lastRulePropValue(bodyModeSelectors, ["font-family"]) || q.fontBody
  );
  q.fontTitles = matchValue(
    /\.exe-content\s*\.page-title\s*\{[\s\S]*?font-family:\s*([^;]+);/i,
    matchValue(
      /\.exe-content\s*\.box-head\s*\.box-title\s*\{[\s\S]*?font-family:\s*([^;]+);/i,
      q.fontBody
    )
  );
  q.fontMenu = matchValue(/#siteNav a\s*\{[\s\S]*?font-family:\s*([^;]+);/i, q.fontBody);
  const effectiveFontSizeRaw = String(contentFontSizeRaw || bodyFontSizeRaw || "").trim();
  const sizeMatch = effectiveFontSizeRaw.match(/([0-9.]+)\s*px/i);
  if (sizeMatch) q.baseFontSize = Number(sizeMatch[1]);
  else {
    const sizeRem = parseCssLengthToRem(effectiveFontSizeRaw, q.baseFontSize / 16);
    if (Number.isFinite(sizeRem)) q.baseFontSize = Math.round(sizeRem * 16);
  }
  const lineHeightMatch = String(contentLineHeightRaw || bodyLineHeightRaw || "").match(/([0-9.]+)/);
  if (lineHeightMatch) q.lineHeight = Number(lineHeightMatch[1]);
  const pageTitleSizeRaw = matchValue(/\.exe-content\s*\.page-title\s*\{[\s\S]*?font-size:\s*([^;]+);/i, "");
  const pageTitleSizeMatch = pageTitleSizeRaw.match(/([0-9.]+)\s*rem/i);
  if (pageTitleSizeMatch) q.pageTitleSize = Number(pageTitleSizeMatch[1]);
  const pageTitleWeightRaw = matchValue(/\.exe-content\s*\.page-title\s*\{[\s\S]*?font-weight:\s*([^;]+);/i, "");
  if (/^\d{3}$/.test(pageTitleWeightRaw)) q.pageTitleWeight = pageTitleWeightRaw;
  const pageTitleUpperRaw = matchValue(/\.exe-content\s*\.page-title\s*\{[\s\S]*?text-transform:\s*([^;]+);/i, "");
  if (pageTitleUpperRaw) q.pageTitleUppercase = pageTitleUpperRaw.toLowerCase().includes("upper");
  const pageTitleLsRaw = matchValue(/\.exe-content\s*\.page-title\s*\{[\s\S]*?letter-spacing:\s*([^;]+);/i, "");
  const pageTitleLsMatch = pageTitleLsRaw.match(/([0-9.]+)\s*px/i);
  if (pageTitleLsMatch) q.pageTitleLetterSpacing = Number(pageTitleLsMatch[1]);
  const pageTitleMbRaw = matchValue(/\.exe-content\s*\.page-title\s*\{[\s\S]*?margin-bottom:\s*([^;]+);/i, "");
  const pageTitleMbMatch = pageTitleMbRaw.match(/([0-9.]+)\s*rem/i);
  if (pageTitleMbMatch) q.pageTitleMarginBottom = Number(pageTitleMbMatch[1]);
  const packageTitleSelectors = [".exe-content .package-title", ".package-title", "#headerContent"];
  const packageTitleSizeRaw = lastRulePropValue(packageTitleSelectors, ["font-size"])
    || matchValue(/\.exe-content\s*\.package-title\s*\{[\s\S]*?font-size:\s*([^;]+);/i, "");
  q.packageTitleSize = parseCssLengthToRem(packageTitleSizeRaw, q.packageTitleSize);
  const packageTitleWeightRaw = lastRulePropValue(packageTitleSelectors, ["font-weight"])
    || matchValue(/\.exe-content\s*\.package-title\s*\{[\s\S]*?font-weight:\s*([^;]+);/i, "");
  if (/^\d{3}$/.test(packageTitleWeightRaw)) q.packageTitleWeight = packageTitleWeightRaw;
  q.packageTitleColor = normalizeHex(
    lastRulePropValue(packageTitleSelectors, ["color"])
      || matchValue(/\.exe-content\s*\.package-title\s*\{[\s\S]*?color:\s*([^;]+);/i, q.packageTitleColor),
    q.packageTitleColor
  );
  const boxTitleSelectors = [".exe-export .box-title", ".exe-content .box-title", ".exe-content .iDeviceTitle", ".box-title", ".iDeviceTitle"];
  const boxTitleSizeRaw = lastRulePropValue(boxTitleSelectors, ["font-size"])
    || matchValue(/\.exe-content\s*\.box-title,\s*[\s\S]*?\.exe-content\s*\.iDeviceTitle\s*\{[\s\S]*?font-size:\s*([^;]+);/i, "");
  q.boxTitleSize = parseCssLengthToRem(boxTitleSizeRaw, q.baseFontSize / 16);
  const boxHeadGapRaw = lastRulePropValue([".exe-content .box-head", ".box-head"], ["gap"])
    || matchValue(/\.exe-content\s*\.box-head\s*\{[\s\S]*?gap:\s*([^;]+);/i, "");
  q.boxTitleGap = parseCssPx(boxHeadGapRaw, 0);

  q.linkColor = normalizeHex(lastCssPropValue("\\.exe-content a", "color") || q.linkColor, q.linkColor);
  q.titleColor = normalizeHex(lastCssPropValue("\\.exe-content \\.page-title", "color") || q.titleColor, q.titleColor);
  q.textColor = normalizeHex(lastCssPropValue("\\.exe-content", "color") || q.textColor, q.textColor);
  q.contentBgColor = normalizeHex(
    lastCssPropValue("\\.exe-content", "background-color")
      || lastCssPropValue("\\.exe-content", "background")
      || q.contentBgColor,
    q.contentBgColor
  );
  q.menuBgColor = normalizeHex(
    lastCssPropValue("#siteNav", "background-color")
      || lastCssPropValue("#siteNav", "background")
      || q.menuBgColor,
    q.menuBgColor
  );
  q.menuTextColor = normalizeHex(
    lastCssPropValue("#siteNav a", "color")
      || lastCssPropValue("#siteNav ul li a", "color")
      || lastCssPropValue("#siteNav", "color")
      || q.menuTextColor,
    q.menuTextColor
  );
  q.menuActiveBgColor = normalizeHex(
    lastCssPropValue("#siteNav a\\.active", "background-color")
      || lastCssPropValue("#siteNav a\\.active", "background")
      || q.menuActiveBgColor,
    q.menuActiveBgColor
  );
  q.menuActiveTextColor = normalizeHex(lastCssPropValue("#siteNav a\\.active", "color") || q.menuActiveTextColor, q.menuActiveTextColor);
  q.boxBgColor = normalizeHex(
    lastRulePropValue([".exe-content .box-content", ".exe-content .iDevice_content", ".exe-content .iDevice_inner"], ["background-color"])
      || lastRulePropValue([".exe-content .box-content", ".exe-content .iDevice_content", ".exe-content .iDevice_inner"], ["background"])
      || matchValue(/\.exe-content \.box-content,\s*[\s\S]*?\.exe-content \.iDevice_content,\s*[\s\S]*?\.exe-content \.iDevice_inner\s*\{[\s\S]*?background-color:\s*([^;]+);/i, "")
      || matchValue(/\.exe-content \.box-content,\s*[\s\S]*?\.exe-content \.iDevice_content,\s*[\s\S]*?\.exe-content \.iDevice_inner\s*\{[\s\S]*?background:\s*([^;]+);/i, q.boxBgColor),
    q.boxBgColor
  );
  q.boxBorderColor = normalizeHex(matchValue(/\.exe-content \.box,\s*[\s\S]*?#node-content-container\.exe-content \.box\s*\{[\s\S]*?border-color:\s*([^;]+);/i, q.boxBorderColor), q.boxBorderColor);
  q.boxTitleColor = normalizeHex(
    lastRulePropValue(boxTitleSelectors, ["color"])
      || matchValue(/\.exe-content \.box-title,\s*[\s\S]*?\.exe-content \.iDeviceTitle\s*\{[\s\S]*?color:\s*([^;]+);/i, q.boxTitleColor),
    q.boxTitleColor
  );
  const boxTextAlignRaw = lastRulePropValue([".exe-content .box-content", ".exe-content .iDevice_inner", ".exe-content .iDevice_content"], ["text-align"]);
  if (["left", "center", "right", "justify", "inherit"].includes(String(boxTextAlignRaw).toLowerCase())) {
    q.boxTextAlign = String(boxTextAlignRaw).toLowerCase();
  }
  const boxFontSizeRaw = lastRulePropValue([".exe-content .box-content", ".exe-content .iDevice_inner", ".exe-content .iDevice_content"], ["font-size"]);
  const boxFontSizePx = String(boxFontSizeRaw || "").match(/([0-9.]+)\s*px/i);
  if (boxFontSizePx) {
    const size = Math.round(Number.parseFloat(boxFontSizePx[1]));
    const candidate = `${size}px`;
    if (BOX_FONT_SIZE_OPTIONS.includes(candidate)) q.boxFontSize = candidate;
    else if (size <= 15) q.boxFontSize = "14px";
    else if (size <= 17) q.boxFontSize = "16px";
    else if (size <= 19) q.boxFontSize = "18px";
    else if (size <= 21) q.boxFontSize = "20px";
    else if (size <= 23) q.boxFontSize = "22px";
    else q.boxFontSize = "24px";
  }
  q.buttonBgColor = normalizeHex(
    matchValue(/\.exe-content button(?:\s*:not\(\.toggler\)(?:\s*:not\(\.box-toggle\))?)?\s*\{[\s\S]*?background:\s*([^;]+);/i, q.buttonBgColor),
    q.buttonBgColor
  );
  q.buttonTextColor = normalizeHex(
    matchValue(/\.exe-content button(?:\s*:not\(\.toggler\)(?:\s*:not\(\.box-toggle\))?)?\s*\{[\s\S]*?color:\s*([^;]+);/i, q.buttonTextColor),
    q.buttonTextColor
  );

  const widthMeta = cssText.match(/\/\*\s*content-width-editor:mode=(default|px|percent|mixed);px=(\d+);pct=(\d+);center=(0|1)(?:;outer=(#[0-9a-f]{6}|#[0-9a-f]{8}))?\s*\*\//i);
  if (widthMeta) {
    q.contentWidthMode = String(widthMeta[1] || q.contentWidthMode).toLowerCase();
    q.contentWidth = Number(widthMeta[2]) || q.contentWidth;
    q.contentWidthPercent = Number(widthMeta[3]) || q.contentWidthPercent;
    q.contentCentered = widthMeta[4] === "1";
    q.contentOuterBgColor = normalizeHex(widthMeta[5] || "", QUICK_DEFAULTS.contentOuterBgColor);
  } else {
    const quickBlock = getQuickBlock(cssText);
    if (quickBlock) {
      const pxMatches = Array.from(quickBlock.matchAll(/max-width:\s*(\d+)\s*px\s*;/gi));
      if (pxMatches.length) {
        q.contentWidthMode = "px";
        q.contentWidth = Number(pxMatches[pxMatches.length - 1][1]) || q.contentWidth;
      } else {
        const percentMatches = Array.from(quickBlock.matchAll(/max-width:\s*([0-9.]+)\s*%\s*;/gi));
        if (percentMatches.length) {
          const raw = percentMatches[percentMatches.length - 1]?.[1];
          const pct = Math.round(Number.parseFloat(raw || ""));
          if (Number.isFinite(pct)) {
            q.contentWidthMode = "percent";
            q.contentWidthPercent = Math.max(10, Math.min(100, pct));
          }
        }
      }
      const alignRuleMatches = Array.from(quickBlock.matchAll(/margin-left:\s*([^;]+);[\s\S]*?margin-right:\s*([^;]+);/gi));
      if (alignRuleMatches.length) {
        const last = alignRuleMatches[alignRuleMatches.length - 1];
        const left = String(last?.[1] || "").trim().toLowerCase();
        const right = String(last?.[2] || "").trim().toLowerCase();
        q.contentCentered = left === "auto" && right === "auto";
      }
    }
    q.contentOuterBgColor = QUICK_DEFAULTS.contentOuterBgColor;
  }

  const logoMeta = cssText.match(/\/\*\s*logo-editor:path=([^;]*);enabled=(0|1);size=(\d+);position=([^;]+);mx=(\d+);my=(\d+)\s*\*\//i);
  if (logoMeta) {
    q.logoPath = normalizePath(logoMeta[1].trim());
    q.logoEnabled = logoMeta[2] === "1";
    q.logoSize = Number(logoMeta[3]) || q.logoSize;
    q.logoPosition = logoMeta[4].trim() || q.logoPosition;
    q.logoMarginX = Number(logoMeta[5]) || q.logoMarginX;
    q.logoMarginY = Number(logoMeta[6]) || q.logoMarginY;
  }
  const bgMeta = cssText.match(/\/\*\s*bg-editor:path=([^;]*);enabled=(0|1)(?:;repeat=(no-repeat|repeat-x|repeat-y|repeat))?(?:;soft=(\d+))?\s*\*\//i);
  if (bgMeta) {
    q.bgImagePath = normalizePath(bgMeta[1].trim());
    q.bgImageEnabled = bgMeta[2] === "1";
    if (bgMeta[3]) q.bgImageRepeat = normalizeBgRepeat(bgMeta[3], q.bgImageRepeat);
    if (bgMeta[4]) q.bgImageSoftness = Math.max(0, Math.min(90, Number(bgMeta[4]) || q.bgImageSoftness));
  } else {
    const contentBgSelectors = [
      ".exe-content",
      ".exe-web-site .exe-content",
      "#node-content-container.exe-content"
    ];
    const contentBgRaw = lastRulePropWithUrl(contentBgSelectors, ["background-image", "background"]);
    const contentBgPath = extractCssUrl(contentBgRaw);
    if (contentBgPath) {
      q.bgImagePath = normalizePath(contentBgPath);
      q.bgImageEnabled = true;
      const contentRepeatRaw = lastRulePropValue(contentBgSelectors, ["background-repeat"]);
      q.bgImageRepeat = normalizeBgRepeat(contentRepeatRaw, q.bgImageRepeat);
      const contentBgImageRaw = String(contentBgRaw || "");
      const softMatch = contentBgImageRaw.match(/linear-gradient\(\s*rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*([0-9.]+)\s*\)/i);
      if (softMatch) {
        const alpha = Number.parseFloat(softMatch[1]);
        if (Number.isFinite(alpha)) q.bgImageSoftness = Math.max(0, Math.min(90, Math.round(alpha * 100)));
      }
    } else {
      const quickBlock = getQuickBlock(cssText);
      if (quickBlock) {
        const bgRepeatMatches = Array.from(quickBlock.matchAll(/background-repeat:\s*(no-repeat|repeat-x|repeat-y|repeat)\s*;/gi));
        if (bgRepeatMatches.length) {
          const lastRepeat = bgRepeatMatches[bgRepeatMatches.length - 1]?.[1] || "";
          q.bgImageRepeat = normalizeBgRepeat(lastRepeat, q.bgImageRepeat);
        }
      }
    }
  }
  const headerMetaV3 = cssText.match(/\/\*\s*header-image-editor:path=([^;]*);enabled=(0|1);hide=(0|1);height=(\d+);fit=(contain|cover|auto);pos=([^;]*);repeat=(no-repeat|repeat-x|repeat-y|repeat)\s*\*\//i);
  const headerMetaV2 = cssText.match(/\/\*\s*header-image-editor:path=([^;]*);enabled=(0|1);height=(\d+);fit=(contain|cover|auto);pos=([^;]*);repeat=(no-repeat|repeat-x|repeat-y|repeat)\s*\*\//i);
  const headerMetaV1 = cssText.match(/\/\*\s*header-image-editor:path=([^;]*);enabled=(0|1);height=(\d+);fit=(contain|cover|auto)\s*\*\//i);
  if (headerMetaV3) {
    q.headerImagePath = normalizePath(headerMetaV3[1].trim());
    q.headerImageEnabled = headerMetaV3[2] === "1";
    q.headerHideTitle = headerMetaV3[3] === "1";
    q.headerImageHeight = Number(headerMetaV3[4]) || q.headerImageHeight;
    q.headerImageFit = headerMetaV3[5] || q.headerImageFit;
    q.headerImagePosition = normalizeBgPosition(headerMetaV3[6], q.headerImagePosition);
    q.headerImageRepeat = normalizeBgRepeat(headerMetaV3[7], q.headerImageRepeat);
  } else if (headerMetaV2) {
    q.headerImagePath = normalizePath(headerMetaV2[1].trim());
    q.headerImageEnabled = headerMetaV2[2] === "1";
    q.headerImageHeight = Number(headerMetaV2[3]) || q.headerImageHeight;
    q.headerImageFit = headerMetaV2[4] || q.headerImageFit;
    q.headerImagePosition = normalizeBgPosition(headerMetaV2[5], q.headerImagePosition);
    q.headerImageRepeat = normalizeBgRepeat(headerMetaV2[6], q.headerImageRepeat);
  } else if (headerMetaV1) {
    q.headerImagePath = normalizePath(headerMetaV1[1].trim());
    q.headerImageEnabled = headerMetaV1[2] === "1";
    q.headerImageHeight = Number(headerMetaV1[3]) || q.headerImageHeight;
    q.headerImageFit = headerMetaV1[4] || q.headerImageFit;
  }
  const footerMetaV2 = cssText.match(/\/\*\s*footer-image-editor:path=([^;]*);enabled=(0|1);height=(\d+);fit=(contain|cover|auto);pos=([^;]*);repeat=(no-repeat|repeat-x|repeat-y|repeat)\s*\*\//i);
  const footerMetaV1 = cssText.match(/\/\*\s*footer-image-editor:path=([^;]*);enabled=(0|1);height=(\d+);fit=(contain|cover|auto)\s*\*\//i);
  if (footerMetaV2) {
    q.footerImagePath = normalizePath(footerMetaV2[1].trim());
    q.footerImageEnabled = footerMetaV2[2] === "1";
    q.footerImageHeight = Number(footerMetaV2[3]) || q.footerImageHeight;
    q.footerImageFit = footerMetaV2[4] || q.footerImageFit;
    q.footerImagePosition = normalizeBgPosition(footerMetaV2[5], q.footerImagePosition);
    q.footerImageRepeat = normalizeBgRepeat(footerMetaV2[6], q.footerImageRepeat);
  } else if (footerMetaV1) {
    q.footerImagePath = normalizePath(footerMetaV1[1].trim());
    q.footerImageEnabled = footerMetaV1[2] === "1";
    q.footerImageHeight = Number(footerMetaV1[3]) || q.footerImageHeight;
    q.footerImageFit = footerMetaV1[4] || q.footerImageFit;
  }

  const navIconsMeta = cssText.match(/\/\*\s*nav-icons-editor:prev=([^;]*);next=([^;]*);menu=([^;]*)\s*\*\//i);
  if (navIconsMeta) {
    q.navIconPrevPath = normalizePath(navIconsMeta[1].trim());
    q.navIconNextPath = normalizePath(navIconsMeta[2].trim());
    q.navIconMenuPath = normalizePath(navIconsMeta[3].trim());
  } else {
    const prevRaw = lastRulePropWithUrl([".nav-buttons .nav-button-left"], ["background-image", "background"]);
    const nextRaw = lastRulePropWithUrl([".nav-buttons .nav-button-right"], ["background-image", "background"]);
    const menuRaw = lastRulePropWithUrl(["button#siteNavToggler", "#siteNavToggler"], ["background-image", "background"]);
    q.navIconPrevPath = extractCssUrl(prevRaw);
    q.navIconNextPath = extractCssUrl(nextRaw);
    q.navIconMenuPath = extractCssUrl(menuRaw);
  }

  if (!headerMetaV1 && !headerMetaV2 && !headerMetaV3) {
    const headerSelectors = [
      ".exe-content .package-header",
      ".package-header",
      "#header",
      "#emptyHeader"
    ];
    const headerBgRaw = lastRulePropWithUrl(headerSelectors, ["background-image", "background"]);
    const headerPath = extractCssUrl(headerBgRaw);
    if (headerPath) {
      q.headerImagePath = headerPath;
      q.headerImageEnabled = true;
      const headerSizeRaw = lastRulePropValue(headerSelectors, ["background-size"]);
      q.headerImageFit = normalizeBgFit(headerSizeRaw, q.headerImageFit);
      const headerPosRaw = lastRulePropValue(headerSelectors, ["background-position"]);
      q.headerImagePosition = normalizeBgPosition(headerPosRaw, q.headerImagePosition);
      const headerRepeatRaw = lastRulePropValue(headerSelectors, ["background-repeat"]);
      q.headerImageRepeat = normalizeBgRepeat(headerRepeatRaw, q.headerImageRepeat);
      const headerHeightRaw = lastRulePropValue(headerSelectors, ["min-height"])
        || lastRulePropValue(headerSelectors, ["height"]);
      q.headerImageHeight = parseCssPx(headerHeightRaw, q.headerImageHeight);
    }
  }
  if (!footerMetaV1 && !footerMetaV2) {
    const footerSelectors = ["#siteFooterContent", "#siteFooter", "footer#siteFooter"];
    const footerBgRaw = lastRulePropWithUrl(footerSelectors, ["background-image", "background"]);
    const footerPath = extractCssUrl(footerBgRaw);
    if (footerPath) {
      q.footerImagePath = footerPath;
      q.footerImageEnabled = true;
      const footerSizeRaw = lastRulePropValue(footerSelectors, ["background-size"]);
      q.footerImageFit = normalizeBgFit(footerSizeRaw, q.footerImageFit);
      const footerPosRaw = lastRulePropValue(footerSelectors, ["background-position"]);
      q.footerImagePosition = normalizeBgPosition(footerPosRaw, q.footerImagePosition);
      const footerRepeatRaw = lastRulePropValue(footerSelectors, ["background-repeat"]);
      q.footerImageRepeat = normalizeBgRepeat(footerRepeatRaw, q.footerImageRepeat);
      const footerHeightRaw = lastRulePropValue(footerSelectors, ["min-height"])
        || lastRulePropValue(footerSelectors, ["height"]);
      q.footerImageHeight = parseCssPx(footerHeightRaw, q.footerImageHeight);
    }
  }

  return q;
}

function buildQuickCss({ important = true } = {}) {
  const q = state.quick;
  const bang = important ? " !important" : "";
  const boxBgBang = " !important";
  const bodyModeSelectors = modeBodySelectors();
  const bodyModeAfterSelectors = modeBodySelectors("::after");
  const contentAreaSelectors = joinSelectorList([
    modeScopedSelectors(".exe-content"),
    ".exe-export .exe-content",
    ".exe-content"
  ]);
  const layoutWidthSelectors = joinSelectorList([
    "#node-content-container.exe-content #node-content",
    modeScopedSelectors(".page-content"),
    modeScopedSelectors("main>header"),
    modeScopedSelectors("#siteFooterContent"),
    ".exe-export .exe-content"
  ]);
  const headerImageSelectors = joinSelectorList([
    modeScopedSelectors(".exe-content .package-header"),
    modeScopedSelectors("#header")
  ]);
  const headerTitleSelectors = modeScopedSelectors(["#headerContent", ".package-header .package-title"]);
  const footerImageSelectors = modeScopedSelectors(["#siteFooter", "#siteFooterContent"]);
  const logoPath = q.logoPath && state.files.has(q.logoPath) ? q.logoPath : "";
  const bgImagePath = q.bgImagePath && state.files.has(q.bgImagePath) ? q.bgImagePath : "";
  const headerImagePath = q.headerImagePath && state.files.has(q.headerImagePath) ? q.headerImagePath : "";
  const footerImagePath = q.footerImagePath && state.files.has(q.footerImagePath) ? q.footerImagePath : "";
  const navPrevIconPath = q.navIconPrevPath && state.files.has(q.navIconPrevPath) ? q.navIconPrevPath : "";
  const navNextIconPath = q.navIconNextPath && state.files.has(q.navIconNextPath) ? q.navIconNextPath : "";
  const navMenuIconPath = q.navIconMenuPath && state.files.has(q.navIconMenuPath) ? q.navIconMenuPath : "";
  const hasLateralSpace = q.contentWidthMode === "px" || q.contentWidthMode === "mixed" || (q.contentWidthMode === "percent" && q.contentWidthPercent < 100);
  const effectivePageBgColor = hasLateralSpace
    ? normalizeHex(q.contentOuterBgColor, QUICK_DEFAULTS.contentOuterBgColor)
    : normalizeHex(q.pageBgColor);
  const logoMeta = `/* logo-editor:path=${logoPath};enabled=${q.logoEnabled ? "1" : "0"};size=${q.logoSize};position=${q.logoPosition};mx=${q.logoMarginX};my=${q.logoMarginY} */`;
  const widthMeta = `/* content-width-editor:mode=${q.contentWidthMode};px=${q.contentWidth};pct=${q.contentWidthPercent};center=${q.contentCentered ? "1" : "0"};outer=${normalizeHex(q.contentOuterBgColor, QUICK_DEFAULTS.contentOuterBgColor)} */`;
  const bgMeta = `/* bg-editor:path=${bgImagePath};enabled=${q.bgImageEnabled ? "1" : "0"};repeat=${q.bgImageRepeat};soft=${Math.max(0, Math.min(90, Number(q.bgImageSoftness) || QUICK_DEFAULTS.bgImageSoftness))} */`;
  const headerMeta = `/* header-image-editor:path=${headerImagePath};enabled=${q.headerImageEnabled ? "1" : "0"};hide=${q.headerHideTitle ? "1" : "0"};height=${q.headerImageHeight};fit=${q.headerImageFit};pos=${q.headerImagePosition};repeat=${q.headerImageRepeat} */`;
  const footerMeta = `/* footer-image-editor:path=${footerImagePath};enabled=${q.footerImageEnabled ? "1" : "0"};height=${q.footerImageHeight};fit=${q.footerImageFit};pos=${q.footerImagePosition};repeat=${q.footerImageRepeat} */`;
  const navIconsMeta = `/* nav-icons-editor:prev=${navPrevIconPath};next=${navNextIconPath};menu=${navMenuIconPath} */`;
  const logoRule = q.logoEnabled && logoPath
    ? `
${bodyModeAfterSelectors} {
  content: ""${bang};
  position: fixed${bang};
  width: ${q.logoSize}px${bang};
  height: ${q.logoSize}px${bang};
  background: url("${logoPath}") no-repeat center / contain${bang};
  ${logoCssPosition(q.logoPosition, q.logoMarginX, q.logoMarginY)}
  z-index: 450${bang};
  pointer-events: none${bang};
}
`
    : "";
  const headerImageRule = q.headerImageEnabled && headerImagePath
    ? `
${headerImageSelectors} {
  background-image: url("${headerImagePath}")${bang};
  background-repeat: ${q.headerImageRepeat}${bang};
  background-position: ${q.headerImagePosition}${bang};
  background-size: ${q.headerImageFit}${bang};
  height: ${q.headerImageHeight}px !important;
  min-height: ${q.headerImageHeight}px !important;
  box-sizing: border-box !important;
  overflow: hidden !important;
  padding-top: 0 !important;
  padding-bottom: 0 !important;
}
`
    : "";
  const headerHideTitleRule = q.headerHideTitle
    ? `
${headerTitleSelectors} {
  display: none !important;
}
`
    : "";
  const footerImageRule = q.footerImageEnabled && footerImagePath
    ? `
${footerImageSelectors} {
  background-image: url("${footerImagePath}")${bang};
  background-repeat: ${q.footerImageRepeat}${bang};
  background-position: ${q.footerImagePosition}${bang};
  background-size: ${q.footerImageFit}${bang};
  height: ${q.footerImageHeight}px !important;
  min-height: ${q.footerImageHeight}px !important;
  box-sizing: border-box !important;
  overflow: hidden !important;
  padding-top: 0 !important;
  padding-bottom: 0 !important;
}
`
    : "";
  const navPrevIconRule = navPrevIconPath
    ? `
${modeScopedSelectors([".nav-buttons .nav-button-left"])} {
  background-image: url("${navPrevIconPath}")${bang};
}
`
    : "";
  const navNextIconRule = navNextIconPath
    ? `
${modeScopedSelectors([".nav-buttons .nav-button-right"])} {
  background-image: url("${navNextIconPath}")${bang};
}
`
    : "";
  const navMenuIconRule = navMenuIconPath
    ? `
${joinSelectorList([
  modeScopedSelectors(["button#siteNavToggler", "#siteNavToggler"]),
  "body.siteNav-off button#siteNavToggler"
])} {
  background-image: url("${navMenuIconPath}")${bang};
}
`
    : "";
  return `
${logoMeta}
${widthMeta}
${bgMeta}
${headerMeta}
${footerMeta}
${navIconsMeta}
${bodyModeSelectors} {
  background-color: ${effectivePageBgColor}${bang};
  font-family: ${q.fontBody}${bang};
  font-size: ${q.baseFontSize}px${bang};
  line-height: ${q.lineHeight}${bang};
}
${q.bgImageEnabled && bgImagePath ? `
${contentAreaSelectors} {
  background-image: ${Math.max(0, Math.min(90, Number(q.bgImageSoftness) || QUICK_DEFAULTS.bgImageSoftness)) > 0
    ? `linear-gradient(rgba(255, 255, 255, ${Math.max(0, Math.min(90, Number(q.bgImageSoftness) || QUICK_DEFAULTS.bgImageSoftness)) / 100}), rgba(255, 255, 255, ${Math.max(0, Math.min(90, Number(q.bgImageSoftness) || QUICK_DEFAULTS.bgImageSoftness)) / 100})), `
    : ""}url("${bgImagePath}")${bang};
  background-repeat: ${q.bgImageRepeat}${bang};
  background-position: ${q.bgImageRepeat === "no-repeat" ? "center center" : "left top"}${bang};
  background-size: ${q.bgImageRepeat === "no-repeat" ? "cover" : "auto"}${bang};
  background-attachment: ${q.bgImageRepeat === "no-repeat" ? "fixed" : "scroll"}${bang};
}
` : ""}
${q.contentWidthMode === "default" ? "" : `
${layoutWidthSelectors} {
  max-width: ${q.contentWidthMode === "percent"
    ? `${q.contentWidthPercent}%`
    : (q.contentWidthMode === "mixed"
      ? `min(${q.contentWidth}px, ${q.contentWidthPercent}%)`
      : `${q.contentWidth}px`)}${bang};
  margin-left: ${q.contentCentered ? "auto" : "0"}${bang};
  margin-right: ${q.contentCentered ? "auto" : "0"}${bang};
}
`}
.exe-content {
  font-family: ${q.fontBody}${bang};
  color: ${normalizeHex(q.textColor)}${bang};
  background-color: ${normalizeHex(q.contentBgColor)}${bang};
}
.exe-content .page-title,
.exe-content .box-title,
.exe-content .iDeviceTitle {
  font-family: ${q.fontTitles}${bang};
}
.exe-content .package-title {
  color: ${normalizeHex(q.packageTitleColor)}${bang};
  font-size: ${q.packageTitleSize}rem${bang};
  font-weight: ${q.packageTitleWeight}${bang};
}
.exe-content a {
  color: ${normalizeHex(q.linkColor)}${bang};
}
.exe-content .page-title {
  color: ${normalizeHex(q.titleColor)}${bang};
  font-size: ${q.pageTitleSize}rem${bang};
  font-weight: ${q.pageTitleWeight}${bang};
  text-transform: ${q.pageTitleUppercase ? "uppercase" : "none"}${bang};
  letter-spacing: ${q.pageTitleLetterSpacing}px${bang};
  margin-bottom: ${q.pageTitleMarginBottom}rem${bang};
}
#siteNav {
  background-color: ${normalizeHex(q.menuBgColor)}${bang};
}
#siteNav a {
  font-family: ${q.fontMenu}${bang};
  color: ${normalizeHex(q.menuTextColor)}${bang};
}
#siteNav a.active {
  background-color: ${normalizeHex(q.menuActiveBgColor)}${bang};
  color: ${normalizeHex(q.menuActiveTextColor)}${bang};
}
.exe-content .box,
#node-content-container.exe-content .box {
  border-color: ${normalizeHex(q.boxBorderColor)}${bang};
}
.exe-content .box-title,
.exe-content .iDeviceTitle {
  color: ${normalizeHex(q.boxTitleColor)}${bang};
  font-size: ${q.boxTitleSize}rem${bang};
}
.exe-content .box-head {
  gap: ${q.boxTitleGap}px${bang};
}
.exe-content .box-content,
.exe-content .iDevice_content,
.exe-content .iDevice_inner {
  background-color: ${normalizeHex(q.boxBgColor)}${boxBgBang};
  text-align: ${q.boxTextAlign}${bang};
  ${q.boxFontSize !== "inherit" ? `font-size: ${q.boxFontSize}${bang};` : ""}
}
.exe-content button:not(.toggler):not(.box-toggle) {
  background-color: ${normalizeHex(q.buttonBgColor)}${bang};
  color: ${normalizeHex(q.buttonTextColor)}${bang};
  border-color: ${normalizeHex(q.buttonBgColor)}${bang};
}
${headerImageRule}
${headerHideTitleRule}
${footerImageRule}
${navPrevIconRule}
${navNextIconRule}
${navMenuIconRule}
${logoRule}
`;
}

function stripQuickBlock(css) {
  return css.replace(/\/\* quick-overrides:start \*\/[\s\S]*?\/\* quick-overrides:end \*\//gi, "").trimEnd();
}

function getQuickBlock(css) {
  const m = css.match(/\/\* quick-overrides:start \*\/([\s\S]*?)\/\* quick-overrides:end \*\//i);
  return m ? m[1] : "";
}

function sanitizeStyleCss(css) {
  const startRe = /\/\* quick-overrides:start \*\//i;
  const endRe = /\/\* quick-overrides:end \*\//i;
  if (!startRe.test(css) || !endRe.test(css)) return css;

  const quickBlock = getQuickBlock(css);
  if (!quickBlock) return css;

  let sanitizedQuick = quickBlock;
  // Remove any protected selectors from legacy quick-overrides automatically.
  for (const p of QUICK_PROTECTED_PATTERNS) {
    const token = p.label
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      .replace(/\\\./g, "\\.");
    const ruleRe = new RegExp(`[^{}]*${token}[^{}]*\\{[^{}]*\\}`, "gi");
    sanitizedQuick = sanitizedQuick.replace(ruleRe, "");
  }
  sanitizedQuick = sanitizedQuick.replace(
    /(^|[\r\n])\s*button\s*,\s*[\r\n]+\s*\.exe-content button\s*,\s*[\r\n]+\s*\.nav-buttons a\s*\{/gi,
    "\n.exe-content button:not(.toggler):not(.box-toggle) {"
  );
  sanitizedQuick = sanitizedQuick.replace(
    /(^|[\r\n])\s*\.exe-content button(?!\s*:not\(\.toggler\):not\(\.box-toggle\))\s*\{/gi,
    "\n.exe-content button:not(.toggler):not(.box-toggle) {"
  );

  return css.replace(
    /\/\* quick-overrides:start \*\/[\s\S]*?\/\* quick-overrides:end \*\//gi,
    `/* quick-overrides:start */\n${sanitizedQuick.trim()}\n/* quick-overrides:end */`
  );
}

function auditStyleCss(css) {
  const issues = [];
  const quickBlock = getQuickBlock(css);

  if (quickBlock && /(^|[\r\n])\s*button\s*,\s*[\r\n]+\s*\.exe-content button\s*,\s*[\r\n]+\s*\.nav-buttons a\s*\{/i.test(quickBlock)) {
    issues.push("Selector inseguro detectado: `button, .exe-content button, .nav-buttons a`.");
  }
  if (quickBlock && /(^|[\r\n])\s*\.exe-content button(?!\s*:not\(\.toggler\):not\(\.box-toggle\))\s*\{/i.test(quickBlock)) {
    issues.push("Selector inseguro detectado: `.exe-content button {` (debe excluir `.toggler` y `.box-toggle`).");
  }
  // Protected selectors inside quick-overrides are auto-sanitized on load/export.

  const starts = (css.match(/\/\* quick-overrides:start \*\//gi) || []).length;
  const ends = (css.match(/\/\* quick-overrides:end \*\//gi) || []).length;
  if (starts !== ends) {
    issues.push("Bloque `quick-overrides` desbalanceado (start/end no coinciden).");
  }
  if (starts > 1) {
    issues.push("Hay más de un bloque `quick-overrides`; debe existir solo uno.");
  }

  return issues;
}

function applyQuickControls({ showStatus = true, changedKey = "" } = {}) {
  const key = String(changedKey || "").trim();
  if (key) {
    state.quick = quickFromUI({
      base: quickFromPreviewSnapshot(quickFromCss(readCss())),
      onlyKey: key
    });
  } else {
    state.quick = quickFromUI();
  }
  updateContentWidthControls(state.quick);
  applyEditorTheme();
  const baseCss = stripQuickBlock(readCss());
  const quickCss = buildQuickCss({ important: false });
  const cleanedBaseCss = pruneClickOverridesConflicts(baseCss, quickCss);
  const css = `${cleanedBaseCss}\n\n/* quick-overrides:start */\n${quickCss}\n/* quick-overrides:end */\n`;
  writeCss(css);
  markDirty();
  if (showStatus) setStatusT("status.quickApplied", "Ajustes rápidos volcados en style.css");
}

function quickBlockNeedsSchemaMigration(css) {
  const quickBlock = getQuickBlock(css);
  if (!quickBlock) return false;
  const hasLegacyEmptyHeader = /(?:^|[\s,{])#emptyHeader(?:[\s,.:{]|$)/i.test(quickBlock);
  const hasLegacyHeaderContentReset = /(?:^|[\s,{])#headerContent(?:[\s,.:{]|$)[\s\S]*?(padding-top|margin-top|margin-bottom)\s*:\s*0/i.test(quickBlock);
  const hasWebsiteModeSelectors = /\.(?:exe-web-site)\b/i.test(quickBlock);
  const hasImsModeSelectors = /\.(?:exe-ims)\b/i.test(quickBlock);
  const hasScormModeSelectors = /\.(?:exe-scorm)\b/i.test(quickBlock);
  const hasMissingDeliveryModes = hasWebsiteModeSelectors && (!hasImsModeSelectors || !hasScormModeSelectors);
  return hasLegacyEmptyHeader || hasLegacyHeaderContentReset || hasMissingDeliveryModes;
}

function migrateQuickBlockSchemaIfNeeded() {
  const currentCss = readCss();
  if (!quickBlockNeedsSchemaMigration(currentCss)) return false;
  const baseCss = stripQuickBlock(currentCss);
  const rebuiltCss = `${baseCss}\n\n/* quick-overrides:start */\n${buildQuickCss({ important: false })}\n/* quick-overrides:end */\n`;
  if (rebuiltCss === currentCss) return false;
  writeCss(rebuiltCss);
  return true;
}

function refreshQuickControls() {
  const css = readCss();
  state.quick = { ...state.quick, ...quickFromCss(css) };
  state.quick = quickFromPreviewSnapshot(state.quick);
  if (state.quick.bgImagePath && !state.files.has(state.quick.bgImagePath)) {
    state.quick.bgImagePath = "";
    state.quick.bgImageEnabled = false;
  }
  if (state.quick.headerImagePath && !state.files.has(state.quick.headerImagePath)) {
    state.quick.headerImagePath = "";
    state.quick.headerImageEnabled = false;
  }
  if (state.quick.footerImagePath && !state.files.has(state.quick.footerImagePath)) {
    state.quick.footerImagePath = "";
    state.quick.footerImageEnabled = false;
  }
  if (!state.quick.logoPath) {
    state.quick.logoPath = findCustomLogoPath();
  }
  if (state.quick.logoPath && !state.files.has(state.quick.logoPath)) {
    state.quick.logoPath = "";
    state.quick.logoEnabled = false;
  }
  if (state.quick.navIconPrevPath && !state.files.has(state.quick.navIconPrevPath)) {
    state.quick.navIconPrevPath = "";
  }
  if (state.quick.navIconNextPath && !state.files.has(state.quick.navIconNextPath)) {
    state.quick.navIconNextPath = "";
  }
  if (state.quick.navIconMenuPath && !state.files.has(state.quick.navIconMenuPath)) {
    state.quick.navIconMenuPath = "";
  }
  migrateQuickBlockSchemaIfNeeded();
  quickToUI(state.quick);
  applyEditorTheme();
}

function parseConfigFields(xmlText) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, "application/xml");
  if (doc.querySelector("parsererror")) return null;
  const get = (tag) => doc.querySelector(tag)?.textContent?.trim() || "";
  return {
    name: get("name"),
    title: get("title"),
    version: get("version"),
    compatibility: get("compatibility"),
    author: get("author"),
    license: get("license"),
    licenseUrl: get("license-url"),
    description: get("description"),
    downloadable: get("downloadable")
  };
}

function getCurrentThemeNameFromConfigXml() {
  if (!state.files.has("config.xml")) return "";
  const data = parseConfigFields(decode(state.files.get("config.xml")));
  return String(data?.name || "").trim();
}

function rewriteElpxProjectThemeReference(xmlText, themeName) {
  const nextTheme = String(themeName || "").trim();
  if (!nextTheme) return String(xmlText || "");
  let xml = String(xmlText || "");
  xml = xml.replace(/(<key>\s*theme\s*<\/key>\s*<value>)([^<]*)(<\/value>)/gi, `$1${nextTheme}$3`);
  xml = xml.replace(/(<pp_style>)([^<]*)(<\/pp_style>)/gi, `$1${nextTheme}$3`);
  xml = xml.replace(/(<key>\s*pp_style\s*<\/key>\s*<value>)([^<]*)(<\/value>)/gi, `$1${nextTheme}$3`);
  return xml;
}

async function syncElpxProjectThemeNameReference() {
  if (!state.elpxMode || !state.elpxSessionId || !state.elpxCacheName) return;
  const themeName = getCurrentThemeNameFromConfigXml();
  if (!themeName) return;

  const targets = Array.from(state.elpxFiles.keys()).filter((path) => {
    const clean = normalizePath(path).toLowerCase();
    return /(^|\/)content(?:v3)?\.xml$/.test(clean);
  });
  if (!targets.length) return;

  const cache = ("caches" in window) ? await window.caches.open(state.elpxCacheName) : null;
  for (const path of targets) {
    const bytes = state.elpxFiles.get(path);
    if (!bytes) continue;
    const currentXml = decode(bytes);
    const nextXml = rewriteElpxProjectThemeReference(currentXml, themeName);
    if (nextXml === currentXml) continue;
    const nextBytes = encode(nextXml);
    state.elpxFiles.set(path, nextBytes);
    if (cache) await writeElpxFileToCache(cache, state.elpxSessionId, path, nextBytes);
  }
}

function writeConfigField(xml, tag, value) {
  const escaped = value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const pattern = new RegExp(`<${tag}>[\\s\\S]*?<\\/${tag}>`, "i");
  if (pattern.test(xml)) return xml.replace(pattern, `<${tag}>${escaped}</${tag}>`);
  return xml.replace(/<theme>/i, `<theme>\n    <${tag}>${escaped}</${tag}>`);
}

function refreshMetaFields() {
  const xml = state.files.has("config.xml") ? decode(state.files.get("config.xml")) : "";
  const data = parseConfigFields(xml);
  if (!data) return;
  els.metaName.value = data.name;
  els.metaTitle.value = data.title;
  els.metaVersion.value = data.version;
  els.metaCompatibility.value = data.compatibility;
  els.metaAuthor.value = data.author;
  els.metaLicense.value = data.license;
  els.metaLicenseUrl.value = data.licenseUrl;
  els.metaDescription.value = data.description;
  els.metaDownloadable.value = data.downloadable === "0" ? "0" : "1";
}

function ensureMetaTitleFromNameFallback() {
  if (!state.files.has("config.xml")) return false;
  const xml = decode(state.files.get("config.xml"));
  const data = parseConfigFields(xml);
  if (!data) return false;
  const name = String(data.name || "").trim();
  const title = String(data.title || "").trim();
  if (!name || title) return false;
  const updated = writeConfigField(xml, "title", name);
  state.files.set("config.xml", encode(updated));
  invalidateBlob("config.xml");
  return true;
}

function saveMetaFields({ showStatus = true } = {}) {
  if (!state.files.has("config.xml")) {
    if (showStatus) setStatusT("status.configMissing", "No existe config.xml en este estilo");
    return;
  }
  pushUndoSnapshot();
  let xml = decode(state.files.get("config.xml"));
  xml = writeConfigField(xml, "name", els.metaName.value.trim());
  xml = writeConfigField(xml, "title", els.metaTitle.value.trim());
  xml = writeConfigField(xml, "version", els.metaVersion.value.trim());
  xml = writeConfigField(xml, "compatibility", els.metaCompatibility.value.trim() || "3.0");
  xml = writeConfigField(xml, "author", els.metaAuthor.value.trim());
  xml = writeConfigField(xml, "license", els.metaLicense.value.trim());
  xml = writeConfigField(xml, "license-url", els.metaLicenseUrl.value.trim());
  xml = writeConfigField(xml, "description", els.metaDescription.value);
  xml = writeConfigField(xml, "downloadable", els.metaDownloadable.value === "0" ? "0" : "1");
  state.files.set("config.xml", encode(xml));
  markDirty();
  if (state.activePath === "config.xml") syncEditorWithActiveFile();
  renderPreview();
  if (showStatus) setStatusT("status.configUpdated", "config.xml actualizado");
}

function warnIfNotDownloadable(context = "estilo") {
  if (!els.metaDownloadable) return;
  if (els.metaDownloadable.value !== "0") return;
  const msg = `Aviso: este ${context} está marcado como no descargable (downloadable=0). En eXe no podrá importarse desde la interfaz.`;
  setStatus(msg);
}

function rewriteCssUrls(css) {
  return css.replace(/url\(([^)]+)\)/gi, (full, raw) => {
    const token = raw.trim().replace(/^['"]|['"]$/g, "");
    if (!token || token.startsWith("data:") || token.startsWith("http") || token.startsWith("#")) return full;
    const clean = normalizePath(token);
    const url = getBlobUrl(clean);
    return url ? `url("${url}")` : full;
  });
}

function previewIconUrl(name) {
  const candidates = ["svg", "png", "gif", "jpg", "jpeg", "webp"];
  for (const ext of candidates) {
    const path = `icons/${name}.${ext}`;
    if (state.files.has(path)) return getBlobUrl(path);
    const legacyPath = `icon_${name}.${ext}`;
    if (state.files.has(legacyPath)) return getBlobUrl(legacyPath);
  }
  return "";
}

function buildPreviewPayload(cssText) {
  return {
    cssText: rewriteCssUrls(cssText),
    styleJsText: styleJsText(),
    layoutMode: state.previewLayoutMode || "modern",
    legacyImport: Boolean(state.previewFromLegacyZip),
    preview: { ...PREVIEW_DEFAULTS, ...state.preview },
    iconUrls: {
      info: previewIconUrl("info"),
      objectives: previewIconUrl("objectives"),
      activity: previewIconUrl("activity")
    },
    screenshotUrl: getBlobUrl("screenshot.png"),
    packageTitle: "Proyecto de ejemplo",
    pageTitle: "Introducción"
  };
}

function detectPreviewLayoutMode() {
  const configXml = state.files.has("config.xml") ? decode(state.files.get("config.xml")) : "";
  const compatibility = compatibilityNumberFromConfigXml(configXml);
  if (compatibility !== null) return compatibility < 3 ? "legacy" : "modern";

  const css = readCss();
  if (/legacy-source-file:(?:content|nav)\.css/i.test(css)) return "legacy";
  if (/#main-wrapper\b|#nodeDecoration\b|\.iDevice_header\b/i.test(css)) return "legacy";
  return "modern";
}

function getMainPreviewRuntime() {
  const frame = els.previewFrame;
  if (!frame) return null;
  try {
    const runtime = frame.contentWindow?.__previewRuntime;
    if (runtime && typeof runtime.render === "function") return runtime;
  } catch {
    return null;
  }
  return null;
}

function renderPreview() {
  if (state.elpxMode) {
    state.previewPendingRender = false;
    applyLiveElpxCssToFrame();
    scheduleElpxThemeSync();
    return;
  }
  state.previewPendingRender = false;
}

function styleJsText() {
  if (!state.files.has("style.js")) return "";
  try {
    return decode(state.files.get("style.js"));
  } catch {
    return "";
  }
}

function waitForPreviewFrameReady(timeoutMs = 1200) {
  return new Promise((resolve) => {
    const deadline = Date.now() + Math.max(200, timeoutMs);
    const tick = () => {
      if (state.elpxMode) {
        const ready = Boolean(els.previewFrame?.contentDocument?.readyState === "complete");
        if (ready) {
          resolve(true);
          return;
        }
      }
      if (getMainPreviewRuntime()) {
        resolve(true);
        return;
      }
      if (Date.now() >= deadline) {
        resolve(false);
        return;
      }
      setTimeout(tick, 30);
    };
    tick();
  });
}

async function capturePreviewScreenshotBytes({ width = 1200, height = 550 } = {}) {
  const frame = els.previewFrame;
  if (!frame?.contentDocument?.documentElement) throw new Error(i18nText("error.previewUnavailable", "Previsualización no disponible"));

  const htmlClone = frame.contentDocument.documentElement.cloneNode(true);
  const body = htmlClone.querySelector("body");
  if (body) {
    body.style.margin = "0";
    body.style.width = `${width}px`;
    body.style.minHeight = `${height}px`;
  }
  htmlClone.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");
  const htmlSerialized = new XMLSerializer().serializeToString(htmlClone);
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <foreignObject x="0" y="0" width="100%" height="100%">${htmlSerialized}</foreignObject>
</svg>`.trim();

  const svgBlob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const svgUrl = URL.createObjectURL(svgBlob);
  try {
    const img = await new Promise((resolve, reject) => {
      const i = new Image();
      i.decoding = "sync";
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error(i18nText("error.previewSvgRender", "No se pudo renderizar SVG de previsualización")));
      i.src = svgUrl;
    });
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error(i18nText("error.canvasUnavailable", "Canvas no disponible"));
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) throw new Error(i18nText("error.pngGenerationFailed", "No se pudo generar PNG"));
    return new Uint8Array(await blob.arrayBuffer());
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}

async function autoUpdateScreenshotFromPreview() {
  try {
    await waitForPreviewFrameReady();
    renderPreview();
    const bytes = await capturePreviewScreenshotBytes({ width: 1200, height: 550 });
    if (!bytes?.length) return false;
    state.files.set("screenshot.png", bytes);
    invalidateBlob("screenshot.png");
    return true;
  } catch {
    return false;
  }
}

function commonRoot(paths) {
  const split = paths.map((p) => normalizePath(p).split("/"));
  if (!split.length) return "";
  const first = split[0];
  const root = [];
  for (let i = 0; i < first.length - 1; i += 1) {
    const seg = first[i];
    if (split.every((parts) => parts[i] === seg)) root.push(seg);
    else break;
  }
  return root.join("/");
}

async function loadOfficialStylesCatalog() {
  const manifest = await fetch("app/official-styles.json").then((r) => {
    if (!r.ok) throw new Error(i18nText("error.officialCatalogLoad", "No se pudo cargar app/official-styles.json"));
    return r.json();
  });
  state.officialStyles = Array.isArray(manifest.styles) ? manifest.styles : [];
  if (!state.officialStyles.length) throw new Error(i18nText("error.noOfficialStyles", "No hay estilos oficiales en el catálogo"));

  const defaultId = state.officialStyles.some((s) => s.id === "base") ? "base" : state.officialStyles[0].id;
  state.selectedOfficialStyleId = defaultId;
  renderOfficialStylesSelect();
  renderOfficialStylePreview(defaultId);
}

async function loadOfficialStyle(styleId, { showStatus = true, resetFileFilter = true } = {}) {
  const applyOverLoadedElpx = state.elpxMode;
  if (!applyOverLoadedElpx) {
    await deactivateElpxMode({ resetFrame: true });
  }
  const style = getOfficialStyleById(styleId);
  if (!style) throw new Error(`Plantilla oficial no encontrada: ${styleId}`);

  invalidateAllBlobs();
  state.files.clear();

  const fetched = await Promise.all(
    style.files.map(async (filePath) => {
      const res = await fetch(`${style.dir}/${filePath}`);
      if (!res.ok) throw new Error(`No se pudo cargar ${style.id}/${filePath}`);
      return [filePath, new Uint8Array(await res.arrayBuffer())];
    })
  );

  for (const [filePath, bytes] of fetched) state.files.set(filePath, bytes);

  if (state.files.has("style.css")) {
    const sanitized = sanitizeStyleCss(readCss());
    state.files.set("style.css", encode(sanitized));
    invalidateBlob("style.css");
  }

  state.templateFiles = new Set(style.files);
  state.baseFiles = new Set(style.files);
  state.selectedOfficialStyleId = style.id;
  state.officialSourceId = style.id;
  state.previewLayoutMode = "modern";
  state.previewFromLegacyZip = false;
  state.activePath = state.files.has("style.css") ? "style.css" : listFilesSorted()[0] || "";

  renderOfficialStylesSelect();
  renderOfficialStylePreview(style.id);
  refreshFileTypeFilterOptions({ forceAll: resetFileFilter });
  renderFileList();
  syncEditorWithActiveFile();
  refreshQuickControls();
  refreshMetaFields();
  warnIfNotDownloadable("estilo");
  if (applyOverLoadedElpx) {
    state.elpxThemeFiles = new Set(state.files.keys());
    await syncThemeFilesToElpxCache({ replaceTheme: true });
    reloadElpxPreviewPage();
    setElpxModeUi();
  }
  renderPreview();
  clearDirty();
  clearUndoHistory();

  if (showStatus) {
    const label = style.meta?.title || style.id;
    setStatus(
      applyOverLoadedElpx
        ? i18nText("status.officialTemplateAppliedToElpx", `Plantilla oficial aplicada al ELPX actual: ${label} (${style.id})`, { label, styleId: style.id })
        : i18nText("status.officialTemplateLoaded", `Plantilla oficial cargada: ${label} (${style.id})`, { label, styleId: style.id })
    );
  }
}

async function loadZip(file) {
  const applyOverLoadedElpx = state.elpxMode;
  if (!applyOverLoadedElpx) {
    await deactivateElpxMode({ resetFrame: true });
  }
  const zip = await window.JSZip.loadAsync(file);
  const names = Object.keys(zip.files).filter((name) => !zip.files[name].dir);
  const root = commonRoot(names);

  invalidateAllBlobs();
  state.files.clear();

  for (const rawName of names) {
    const short = normalizePath(root ? rawName.replace(`${root}/`, "") : rawName);
    if (!short) continue;
    const bytes = await zip.files[rawName].async("uint8array");
    state.files.set(short, bytes);
  }

  const legacyConversion = convertLegacyThemePackageIfNeeded();
  const autoAddedOnLoad = ensureCoreFilesPresent({ markAsDirty: false });
  state.previewLayoutMode = detectPreviewLayoutMode();
  state.previewFromLegacyZip = Boolean(legacyConversion.detectedLegacy);

  let zipStatus = "";
  if (legacyConversion.converted) {
    zipStatus = `ZIP legado convertido automáticamente: ${legacyConversion.notes.join(" | ")}`;
  }
  if (state.files.has("style.css")) {
    const originalCss = readCss();
    const sanitized = sanitizeStyleCss(originalCss);
    state.files.set("style.css", encode(sanitized));
    invalidateBlob("style.css");
    const issues = auditStyleCss(sanitized);
    if (issues.length) {
      zipStatus = `ZIP cargado con advertencias CSS: ${issues.join(" | ")}`;
    } else if (sanitized !== originalCss) {
      zipStatus = `ZIP cargado: ${file.name} (${state.files.size} archivos). Se aplicaron correcciones de compatibilidad CSS.`;
    }
  }
  if (autoAddedOnLoad.length) {
    const msg = `Se añadieron automáticamente obligatorios faltantes: ${autoAddedOnLoad.join(", ")}.`;
    zipStatus = zipStatus ? `${zipStatus} ${msg}` : msg;
  }

  state.templateFiles = new Set(state.files.keys());
  state.officialSourceId = "";
  state.activePath = state.files.has("style.css") ? "style.css" : listFilesSorted()[0] || "";
  hideOfficialStylePreview();
  refreshFileTypeFilterOptions({ forceAll: true });
  renderFileList();
  syncEditorWithActiveFile();
  refreshQuickControls();
  refreshMetaFields();
  const titleAutofilledFromName = ensureMetaTitleFromNameFallback();
  if (titleAutofilledFromName) refreshMetaFields();
  if (els.metaDownloadable?.value === "0") {
    alertT(
      "alert.notDownloadableStyle",
      "Este estilo está marcado como no descargable (downloadable=0).\n\nPuedes editarlo aquí, pero en eXe no se podrá importar desde la interfaz mientras siga en 0."
    );
  }
  warnIfNotDownloadable("ZIP");
  if (applyOverLoadedElpx) {
    state.elpxThemeFiles = new Set(state.files.keys());
    await syncThemeFilesToElpxCache({ replaceTheme: true });
    reloadElpxPreviewPage();
    setElpxModeUi();
  }
  renderPreview();
  clearDirty();
  clearUndoHistory();
  const importIssues = importValidationSummary();
  if (importIssues.missingCore.length || importIssues.cssIssues.length) {
    const parts = [];
    if (importIssues.missingCore.length) parts.push(`faltan obligatorios: ${importIssues.missingCore.join(", ")}`);
    if (importIssues.cssIssues.length) parts.push(`incidencias CSS: ${importIssues.cssIssues.join(" | ")}`);
    if (titleAutofilledFromName) parts.push("title vacío completado automáticamente con name");
    setStatus(
      applyOverLoadedElpx
        ? i18nText("status.zipAppliedWithIssues", `ZIP aplicado al ELPX con incidencias: ${parts.join(" ; ")}`, { details: parts.join(" ; ") })
        : i18nText("status.zipLoadedWithIssues", `ZIP cargado con incidencias: ${parts.join(" ; ")}`, { details: parts.join(" ; ") })
    );
  } else {
    const fallbackMsg = titleAutofilledFromName ? i18nText("status.titleAutofilled", " Se completó automáticamente Título con Nombre.") : "";
    const baseMsg = zipStatus || i18nText("status.zipLoaded", `ZIP cargado: ${file.name} (${state.files.size} archivos)`, { fileName: file.name, count: state.files.size });
    const prefix = applyOverLoadedElpx ? i18nText("status.zipAppliedToElpxPrefix", `ZIP aplicado al ELPX: ${file.name}. `, { fileName: file.name }) : "";
    setStatus(`${prefix}${baseMsg}${fallbackMsg}`);
  }
}

async function loadElpx(file) {
  await registerElpxServiceWorkerIfNeeded();
  await deactivateElpxMode({ resetFrame: false });

  const zip = await window.JSZip.loadAsync(file);
  const names = Object.keys(zip.files).filter((name) => !zip.files[name].dir);
  const root = commonRoot(names);
  const packageFiles = new Map();
  for (const rawName of names) {
    const short = normalizePath(root ? rawName.replace(`${root}/`, "") : rawName);
    if (!short) continue;
    const bytes = await zip.files[rawName].async("uint8array");
    packageFiles.set(short, bytes);
  }

  if (!packageFiles.has("index.html")) throw new Error(i18nText("error.elpxMissingIndex", "El ELPX no contiene index.html."));
  if (!packageFiles.has("content.xml")) throw new Error(i18nText("error.elpxMissingContent", "El ELPX no contiene content.xml."));

  const themePrefixRaw = detectElpxThemePrefix(Array.from(packageFiles.keys()));
  const themePrefix = themePrefixRaw ? (themePrefixRaw.endsWith("/") ? themePrefixRaw : `${themePrefixRaw}/`) : "";
  const themeEntries = Array.from(packageFiles.entries()).filter(([path]) => path.startsWith(themePrefix));
  if (!themeEntries.length) throw new Error(`No se encontró carpeta de estilo en el ELPX (${themePrefix}).`);

  invalidateAllBlobs();
  state.files.clear();
  state.elpxFiles.clear();
  state.elpxThemeFiles.clear();

  for (const [path, bytes] of packageFiles.entries()) state.elpxFiles.set(path, cloneBytes(bytes));
  for (const [fullPath, bytes] of themeEntries) {
    const rel = normalizePath(fullPath.slice(themePrefix.length));
    if (!rel) continue;
    state.files.set(rel, cloneBytes(bytes));
    state.elpxThemeFiles.add(rel);
  }

  if (state.files.has("style.css")) {
    const sanitized = sanitizeStyleCss(readCss());
    state.files.set("style.css", encode(sanitized));
    invalidateBlob("style.css");
  }
  const autoAddedOnLoad = ensureCoreFilesPresent({ markAsDirty: false });

  state.elpxMode = true;
  state.elpxThemePrefix = themePrefix;
  state.elpxOriginalName = safeFileName(file.name || "project.elpx") || "project.elpx";
  state.elpxSessionId = elpxSessionId();
  state.elpxCacheName = elpxCacheNameFromSession(state.elpxSessionId);
  state.previewLastElpxCss = "";

  await clearElpxCaches({ keepCacheName: "" });
  const cache = await window.caches.open(state.elpxCacheName);
  for (const [path, bytes] of state.elpxFiles.entries()) {
    await writeElpxFileToCache(cache, state.elpxSessionId, path, bytes);
  }
  await syncThemeFilesToElpxCache();

  state.templateFiles = new Set(state.files.keys());
  state.baseFiles = new Set(state.files.keys());
  state.officialSourceId = "";
  state.activePath = state.files.has("style.css") ? "style.css" : listFilesSorted()[0] || "";
  state.previewLayoutMode = "modern";
  state.previewFromLegacyZip = false;
  hideOfficialStylePreview();
  renderOfficialStylesSelect();
  refreshFileTypeFilterOptions({ forceAll: true });
  renderFileList();
  syncEditorWithActiveFile();
  refreshQuickControls();
  refreshMetaFields();
  setElpxModeUi();

  const startPath = packageFiles.has("index.html") ? "index.html" : Array.from(packageFiles.keys()).find((p) => p.endsWith(".html")) || "index.html";
  const previewUrl = elpxUrlPath(state.elpxSessionId, startPath);
  els.previewFrame?.setAttribute("src", previewUrl);
  renderPreview();
  clearDirty();
  clearUndoHistory();

  const autoAddedMsg = autoAddedOnLoad.length
    ? i18nText("status.elpxThemeFilesAdded", ` Se añadieron ficheros de tema faltantes: ${autoAddedOnLoad.join(", ")}.`, { files: autoAddedOnLoad.join(", ") })
    : "";
  setStatus(
    i18nText(
      "status.elpxLoaded",
      `Proyecto ELPX cargado: ${file.name} (${packageFiles.size} archivos). Navega el contenido real en la previsualización.${autoAddedMsg}`,
      { fileName: file.name, count: packageFiles.size, extra: autoAddedMsg }
    )
  );
}

function validationReport() {
  const current = new Set(state.files.keys());
  const missingCore = CORE_REQUIRED.filter((f) => !current.has(f));
  const missingTemplate = Array.from(state.templateFiles).filter((f) => !current.has(f));
  const missingBase = Array.from(state.baseFiles).filter((f) => !current.has(f));

  const lines = [];
  lines.push(`Archivos actuales: ${current.size}`);
  lines.push(`Faltan obligatorios: ${missingCore.length}`);
  if (missingCore.length) lines.push(`- ${missingCore.join("\n- ")}`);
  lines.push(`Faltan respecto a plantilla cargada: ${missingTemplate.length}`);
  if (missingTemplate.length) lines.push(`- ${missingTemplate.join("\n- ")}`);
  lines.push(`Faltan respecto a base: ${missingBase.length}`);
  if (missingBase.length) lines.push(`- ${missingBase.slice(0, 30).join("\n- ")}${missingBase.length > 30 ? "\n- ..." : ""}`);
  const cssIssues = state.files.has("style.css") ? auditStyleCss(readCss()) : ["No existe style.css"];
  lines.push(`Incidencias CSS críticas: ${cssIssues.length}`);
  if (cssIssues.length) lines.push(`- ${cssIssues.join("\n- ")}`);

  return { missingCore, missingTemplate, cssIssues, text: lines.join("\n") };
}

function importValidationSummary() {
  const current = new Set(state.files.keys());
  const missingCore = CORE_REQUIRED.filter((f) => !current.has(f));
  const cssIssues = state.files.has("style.css") ? auditStyleCss(readCss()) : ["No existe style.css"];
  return { missingCore, cssIssues };
}

async function exportZip() {
  if (blockExportForOfficialMetadataConflict("exportar")) return;

  if (state.files.has("style.css")) {
    const sanitized = sanitizeStyleCss(readCss());
    state.files.set("style.css", encode(sanitized));
    invalidateBlob("style.css");
  }
  if (state.files.has("style.js")) {
    const currentStyleJs = decode(state.files.get("style.js"));
    const needsLegacyCompatRefresh = state.previewFromLegacyZip || LEGACY_COMPAT_MARKERS.some((marker) => currentStyleJs.includes(marker));
    if (needsLegacyCompatRefresh) {
      const upgradedStyleJs = upsertLegacyCompatStyleJs(currentStyleJs);
      if (upgradedStyleJs !== currentStyleJs) {
        state.files.set("style.js", encode(upgradedStyleJs));
        invalidateBlob("style.js");
      }
    }
  }
  const screenshotUpdated = await autoUpdateScreenshotFromPreview();
  const autoAddedOnExport = ensureCoreFilesPresent({ markAsDirty: false });
  if (autoAddedOnExport.length) {
    refreshFileTypeFilterOptions();
    renderFileList();
    if (!state.activePath || !state.files.has(state.activePath)) {
      state.activePath = state.files.has("style.css") ? "style.css" : listFilesSorted()[0] || "";
    }
    syncEditorWithActiveFile();
    renderPreview();
  }

  const report = validationReport();
  if (report.missingCore.length || report.cssIssues.length) {
    const parts = [];
    if (report.missingCore.length) parts.push(`faltan obligatorios: ${report.missingCore.join(", ")}`);
    if (report.cssIssues.length) parts.push(`incidencias CSS: ${report.cssIssues.join(" | ")}`);
    setStatus(i18nText("status.exportBlocked", `Exportación bloqueada: ${parts.join(" ; ")}`, { details: parts.join(" ; ") }));
    return;
  }

  const zip = new window.JSZip();
  for (const [path, bytes] of state.files.entries()) zip.file(path, bytes);
  const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE" });

  const name = (els.metaName.value || "style").replace(/[^a-zA-Z0-9_-]/g, "-").toLowerCase();
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${name}.zip`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(a.href);
    a.remove();
  }, 0);

  clearDirty();
  const warnings = [];
  if (!screenshotUpdated) warnings.push("no se pudo actualizar screenshot automáticamente (se mantuvo el existente)");
  if (autoAddedOnExport.length) warnings.push(`se crearon obligatorios: ${autoAddedOnExport.join(", ")}`);
  if (report.missingTemplate.length) warnings.push(`faltan ${report.missingTemplate.length} archivo(s) respecto a la plantilla original`);
  if (report.missingBase.length) warnings.push(`faltan ${report.missingBase.length} archivo(s) respecto a la base oficial`);
  const warningText = warnings.length ? i18nText("status.withWarning", ` con aviso: ${warnings.join(" ; ")}`, { details: warnings.join(" ; ") }) : "";
  setStatus(i18nText("status.zipExported", `ZIP exportado correctamente (${state.files.size} archivos)${warningText}`, { count: state.files.size, warningText }));
}

async function exportElpx() {
  if (!state.elpxMode) {
    setStatusT("status.loadElpxFirst", "Primero carga un ELPX para poder exportarlo modificado.");
    return;
  }
  const renameCheck = await ensureElpxRenameForOfficialStyle();
  if (!renameCheck.ok) return;
  await syncElpxProjectThemeNameReference();
  await syncThemeFilesToElpxCache();
  const zip = new window.JSZip();
  for (const [path, bytes] of state.elpxFiles.entries()) zip.file(path, bytes);
  const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE" });
  const original = String(state.elpxOriginalName || "project.elpx").replace(/\.elpx$/i, "");
  const safe = safeFileName(original) || "project";
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${safe}-mod.elpx`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(a.href);
    a.remove();
  }, 0);
  const warning = renameCheck.keptOfficialMetadata
    ? i18nText("status.elpxExportWarningPreviousStyle", " Aviso: en eXeLearning elimina antes el estilo anterior con ese Nombre/Título para poder importarlo.")
    : "";
  setStatus(i18nText("status.elpxExported", `ELPX exportado correctamente (${state.elpxFiles.size} archivos).${warning}`, { count: state.elpxFiles.size, warning }));
}

function onEditorInput() {
  const path = state.activePath;
  if (!path || !isTextFile(path)) return;
  pushUndoSnapshot();
  state.files.set(path, encode(els.textEditor.value));
  markDirty();
  invalidateBlob(path);
  scheduleEditorHighlight(path);
  syncDetachedEditorFromMain();

  if (path === "style.css") {
    state.quick = { ...state.quick, ...quickFromCss(readCss()) };
    quickToUI(state.quick);
    applyEditorTheme();
    renderPreview();
  }

  if (path === "config.xml") refreshMetaFields();
}

async function onReplaceImageSelected(file) {
  if (!file || !isImageFile(state.activePath)) return;
  pushUndoSnapshot();
  const bytes = new Uint8Array(await file.arrayBuffer());
  state.files.set(state.activePath, bytes);
  markDirty();
  invalidateBlob(state.activePath);
  syncEditorWithActiveFile();
  renderPreview();
  setStatus(i18nText("status.imageReplaced", `Imagen reemplazada: ${state.activePath}`, { path: state.activePath }));
}

async function onAddLogoSelected(file) {
  if (!file) return;
  if (!isImageFile(file.name)) {
    setStatusT("status.logoInvalidImage", "El logo debe ser una imagen válida.");
    return;
  }
  const extension = (file.name.split(".").pop() || "png").toLowerCase();
  const path = `img/custom-logo.${extension}`;
  pushUndoSnapshot();
  const bytes = new Uint8Array(await file.arrayBuffer());
  state.files.set(path, bytes);
  invalidateBlob(path);
  state.quick.logoPath = path;
  state.quick.logoEnabled = true;
  quickToUI(state.quick);
  applyQuickControls({ showStatus: false });
  markDirty();
  refreshFileTypeFilterOptions();
  renderFileList();
  if (state.elpxMode) {
    await syncThemeFilesToElpxCache();
    reloadElpxPreviewPage();
  } else {
    renderPreview();
  }
  setStatus(i18nText("status.logoLoaded", `Logo cargado: ${path}`, { path }));
}

async function removeLogo() {
  pushUndoSnapshot();
  if (state.quick.logoPath && state.files.has(state.quick.logoPath)) {
    state.files.delete(state.quick.logoPath);
    invalidateBlob(state.quick.logoPath);
  }
  state.quick.logoPath = "";
  state.quick.logoEnabled = false;
  quickToUI(state.quick);
  applyQuickControls({ showStatus: false });
  markDirty();
  refreshFileTypeFilterOptions();
  renderFileList();
  if (state.elpxMode) {
    await syncThemeFilesToElpxCache();
    reloadElpxPreviewPage();
  } else {
    renderPreview();
  }
  setStatusT("status.logoRemoved", "Logo eliminado.");
}

async function onAddBackgroundImageSelected(file) {
  if (!file) return;
  if (!isImageFile(file.name)) {
    setStatusT("status.bgImageInvalid", "La imagen de fondo debe ser un archivo de imagen válido.");
    return;
  }
  const extension = (file.name.split(".").pop() || "png").toLowerCase();
  const path = `img/custom-background.${extension}`;
  pushUndoSnapshot();
  const bytes = new Uint8Array(await file.arrayBuffer());

  if (state.quick.bgImagePath && state.quick.bgImagePath !== path && state.files.has(state.quick.bgImagePath)) {
    state.files.delete(state.quick.bgImagePath);
    invalidateBlob(state.quick.bgImagePath);
  }

  state.files.set(path, bytes);
  invalidateBlob(path);
  state.quick.bgImagePath = path;
  state.quick.bgImageEnabled = true;
  quickToUI(state.quick);
  applyQuickControls({ showStatus: false });
  markDirty();
  refreshFileTypeFilterOptions();
  renderFileList();
  renderPreview();
  setStatus(i18nText("status.bgImageLoaded", `Imagen de fondo cargada: ${path}`, { path }));
}

function selectBackgroundImageFromStylePath(path) {
  const clean = normalizePath(path || "");
  if (!clean) return;
  if (!state.files.has(clean) || !isImageFile(clean)) {
    setStatusT("status.bgImageUnavailable", "La imagen seleccionada para fondo no está disponible en el estilo.");
    return;
  }
  state.quick.bgImagePath = clean;
  state.quick.bgImageEnabled = true;
  quickToUI(state.quick);
  applyQuickControls({ showStatus: false });
  markDirty();
  renderPreview();
  setStatus(i18nText("status.bgImageSelected", `Imagen de fondo seleccionada desde el estilo: ${clean}`, { path: clean }));
}

function removeBackgroundImage() {
  pushUndoSnapshot();
  if (state.quick.bgImagePath && state.files.has(state.quick.bgImagePath)) {
    state.files.delete(state.quick.bgImagePath);
    invalidateBlob(state.quick.bgImagePath);
  }
  state.quick.bgImagePath = "";
  state.quick.bgImageEnabled = false;
  quickToUI(state.quick);
  applyQuickControls({ showStatus: false });
  markDirty();
  refreshFileTypeFilterOptions();
  renderFileList();
  renderPreview();
  setStatusT("status.bgImageRemoved", "Imagen de fondo eliminada.");
}

async function onAddHeaderImageSelected(file) {
  if (!file) return;
  if (!isImageFile(file.name)) {
    setStatusT("status.headerImageInvalid", "La imagen de cabecera debe ser un archivo de imagen válido.");
    return;
  }
  const extension = (file.name.split(".").pop() || "png").toLowerCase();
  const path = `img/custom-header.${extension}`;
  pushUndoSnapshot();
  const bytes = new Uint8Array(await file.arrayBuffer());

  if (
    state.quick.headerImagePath
    && state.quick.headerImagePath !== path
    && state.files.has(state.quick.headerImagePath)
    && isEditorManagedHeaderImage(state.quick.headerImagePath)
  ) {
    state.files.delete(state.quick.headerImagePath);
    invalidateBlob(state.quick.headerImagePath);
  }

  state.files.set(path, bytes);
  invalidateBlob(path);
  state.quick.headerImagePath = path;
  state.quick.headerImageEnabled = true;
  quickToUI(state.quick);
  applyQuickControls({ showStatus: false });
  markDirty();
  refreshFileTypeFilterOptions();
  renderFileList();
  renderPreview();
  setStatus(i18nText("status.headerImageLoaded", `Imagen de cabecera cargada: ${path}`, { path }));
}

function selectHeaderImageFromStylePath(path) {
  const clean = normalizePath(path || "");
  if (!clean) return;
  if (!state.files.has(clean) || !isImageFile(clean)) {
    setStatusT("status.headerImageUnavailable", "La imagen seleccionada para cabecera no está disponible en el estilo.");
    return;
  }
  state.quick.headerImagePath = clean;
  state.quick.headerImageEnabled = true;
  quickToUI(state.quick);
  applyQuickControls({ showStatus: false });
  markDirty();
  renderPreview();
  setStatus(i18nText("status.headerImageSelected", `Imagen de cabecera seleccionada desde el estilo: ${clean}`, { path: clean }));
}

function removeHeaderImage() {
  pushUndoSnapshot();
  if (
    state.quick.headerImagePath
    && state.files.has(state.quick.headerImagePath)
    && isEditorManagedHeaderImage(state.quick.headerImagePath)
  ) {
    state.files.delete(state.quick.headerImagePath);
    invalidateBlob(state.quick.headerImagePath);
  }
  state.quick.headerImagePath = "";
  state.quick.headerImageEnabled = false;
  quickToUI(state.quick);
  applyQuickControls({ showStatus: false });
  markDirty();
  refreshFileTypeFilterOptions();
  renderFileList();
  renderPreview();
  setStatusT("status.headerImageRemoved", "Imagen de cabecera eliminada.");
}

async function onAddFooterImageSelected(file) {
  if (!file) return;
  if (!isImageFile(file.name)) {
    setStatusT("status.footerImageInvalid", "La imagen de pie debe ser un archivo de imagen válido.");
    return;
  }
  const extension = (file.name.split(".").pop() || "png").toLowerCase();
  const path = `img/custom-footer.${extension}`;
  pushUndoSnapshot();
  const bytes = new Uint8Array(await file.arrayBuffer());

  if (
    state.quick.footerImagePath
    && state.quick.footerImagePath !== path
    && state.files.has(state.quick.footerImagePath)
    && isEditorManagedFooterImage(state.quick.footerImagePath)
  ) {
    state.files.delete(state.quick.footerImagePath);
    invalidateBlob(state.quick.footerImagePath);
  }

  state.files.set(path, bytes);
  invalidateBlob(path);
  state.quick.footerImagePath = path;
  state.quick.footerImageEnabled = true;
  quickToUI(state.quick);
  applyQuickControls({ showStatus: false });
  markDirty();
  refreshFileTypeFilterOptions();
  renderFileList();
  renderPreview();
  setStatus(i18nText("status.footerImageLoaded", `Imagen de pie cargada: ${path}`, { path }));
}

function selectFooterImageFromStylePath(path) {
  const clean = normalizePath(path || "");
  if (!clean) return;
  if (!state.files.has(clean) || !isImageFile(clean)) {
    setStatusT("status.footerImageUnavailable", "La imagen seleccionada para pie no está disponible en el estilo.");
    return;
  }
  state.quick.footerImagePath = clean;
  state.quick.footerImageEnabled = true;
  quickToUI(state.quick);
  applyQuickControls({ showStatus: false });
  markDirty();
  renderPreview();
  setStatus(i18nText("status.footerImageSelected", `Imagen de pie seleccionada desde el estilo: ${clean}`, { path: clean }));
}

function removeFooterImage() {
  pushUndoSnapshot();
  if (
    state.quick.footerImagePath
    && state.files.has(state.quick.footerImagePath)
    && isEditorManagedFooterImage(state.quick.footerImagePath)
  ) {
    state.files.delete(state.quick.footerImagePath);
    invalidateBlob(state.quick.footerImagePath);
  }
  state.quick.footerImagePath = "";
  state.quick.footerImageEnabled = false;
  quickToUI(state.quick);
  applyQuickControls({ showStatus: false });
  markDirty();
  refreshFileTypeFilterOptions();
  renderFileList();
  renderPreview();
  setStatusT("status.footerImageRemoved", "Imagen de pie eliminada.");
}

function navIconManagedPath(slot, extension = "svg") {
  const safeExt = String(extension || "svg").toLowerCase().replace(/[^a-z0-9]/g, "") || "svg";
  return `img/custom-nav-${slot}.${safeExt}`;
}

function isEditorManagedNavIcon(path, slot) {
  return new RegExp(`^img/custom-nav-${String(slot || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\.(png|jpe?g|gif|webp|svg)$`, "i")
    .test(normalizePath(path || ""));
}

function quickNavKeyBySlot(slot) {
  if (slot === "prev") return "navIconPrevPath";
  if (slot === "next") return "navIconNextPath";
  return "navIconMenuPath";
}

function navSlotLabel(slot) {
  if (slot === "prev") return i18nText("slot.prev", "Anterior");
  if (slot === "next") return i18nText("slot.next", "Siguiente");
  return i18nText("slot.menu", "Menú");
}

function selectNavIconFromStylePath(path, slot) {
  const clean = normalizePath(path || "");
  if (!clean) return;
  if (!state.files.has(clean) || !isImageFile(clean)) {
    setStatus(i18nText("status.navIconUnavailable", `La imagen seleccionada para ${navSlotLabel(slot)} no está disponible en el estilo.`, { slot: navSlotLabel(slot) }));
    return;
  }
  const key = quickNavKeyBySlot(slot);
  state.quick[key] = clean;
  quickToUI(state.quick);
  applyQuickControls({ showStatus: false });
  markDirty();
  renderPreview();
  setStatus(i18nText("status.navIconSelected", `Icono de ${navSlotLabel(slot)} seleccionado desde el estilo: ${clean}`, { slot: navSlotLabel(slot), path: clean }));
}

async function onAddNavIconSelected(file, slot) {
  if (!file) return;
  if (!isImageFile(file.name)) {
    setStatus(i18nText("status.navIconInvalid", `El icono de ${navSlotLabel(slot)} debe ser un archivo de imagen válido.`, { slot: navSlotLabel(slot) }));
    return;
  }
  const extension = (file.name.split(".").pop() || "svg").toLowerCase();
  const path = navIconManagedPath(slot, extension);
  const key = quickNavKeyBySlot(slot);
  pushUndoSnapshot();
  const bytes = new Uint8Array(await file.arrayBuffer());

  const previousPath = String(state.quick[key] || "");
  if (
    previousPath
    && previousPath !== path
    && state.files.has(previousPath)
    && isEditorManagedNavIcon(previousPath, slot)
  ) {
    state.files.delete(previousPath);
    invalidateBlob(previousPath);
  }

  state.files.set(path, bytes);
  invalidateBlob(path);
  state.quick[key] = path;
  quickToUI(state.quick);
  applyQuickControls({ showStatus: false });
  markDirty();
  refreshFileTypeFilterOptions();
  renderFileList();
  renderPreview();
  setStatus(i18nText("status.navIconLoaded", `Icono de ${navSlotLabel(slot)} cargado: ${path}`, { slot: navSlotLabel(slot), path }));
}

function normalizeIconBaseName(fileName) {
  const base = String(fileName || "")
    .replace(/\.[^.]+$/, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .toLowerCase()
    .trim();
  return base;
}

async function onAddIdeviceIconsSelected(fileList) {
  const files = Array.from(fileList || []).filter((f) => isImageFile(f.name));
  if (!files.length) {
    setStatusT("status.noValidIcons", "No se seleccionaron iconos válidos (.png, .jpg, .jpeg, .gif, .webp, .svg).");
    return;
  }
  pushUndoSnapshot();

  let added = 0;
  let replaced = 0;
  for (const file of files) {
    const cleanName = safeFileName(file.name);
    const extension = (cleanName.split(".").pop() || "").toLowerCase();
    if (!extension || !isImageFile(`x.${extension}`)) continue;
    const baseName = normalizeIconBaseName(cleanName);
    if (!baseName) continue;
    const iconPath = `icons/${baseName}.${extension}`;

    for (const ext of ["svg", "png", "gif", "jpg", "jpeg", "webp"]) {
      const existingPath = `icons/${baseName}.${ext}`;
      if (existingPath === iconPath) continue;
      if (state.files.has(existingPath)) {
        state.files.delete(existingPath);
        invalidateBlob(existingPath);
        replaced += 1;
      }
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    if (state.files.has(iconPath)) replaced += 1;
    else added += 1;
    state.files.set(iconPath, bytes);
    invalidateBlob(iconPath);
  }

  if (!added && !replaced) {
    setStatusT("status.noIdeviceIconsAdded", "No se añadieron iconos iDevice.");
    return;
  }

  markDirty();
  refreshFileTypeFilterOptions();
  renderFileList();
  renderPreview();
  setStatus(i18nText("status.ideviceIconsUpdated", `Iconos iDevice actualizados: ${added} añadidos, ${replaced} reemplazados.`, { added, replaced }));
}

function isFontFileName(name) {
  const lower = String(name || "").toLowerCase();
  return lower.endsWith(".woff") || lower.endsWith(".woff2") || lower.endsWith(".ttf") || lower.endsWith(".otf");
}

function safeFileName(name) {
  return String(name || "")
    .replace(/[/\\]/g, "_")
    .replace(/[^\w.\- ]/g, "_")
    .trim();
}

function quoteFontFamily(name) {
  const escaped = String(name || "").replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return `"${escaped}"`;
}

function normalizeFontFamilyFromFileName(fileName) {
  const base = fileName.replace(/\.[^.]+$/, "");
  const cleaned = base
    .replace(/[_-]+/g, " ")
    .replace(/\b(thin|extralight|ultralight|light|regular|book|normal|medium|semibold|demibold|bold|extrabold|ultrabold|black|heavy|italic|oblique)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned || base;
}

function fontWeightFromFileName(fileName) {
  const lower = fileName.toLowerCase();
  if (/\bthin\b/.test(lower)) return 100;
  if (/\b(extralight|ultralight)\b/.test(lower)) return 200;
  if (/\blight\b/.test(lower)) return 300;
  if (/\bmedium\b/.test(lower)) return 500;
  if (/\b(semibold|demibold)\b/.test(lower)) return 600;
  if (/\bbold\b/.test(lower)) return 700;
  if (/\b(extrabold|ultrabold)\b/.test(lower)) return 800;
  if (/\b(black|heavy)\b/.test(lower)) return 900;
  return 400;
}

function fontStyleFromFileName(fileName) {
  return /\b(italic|oblique)\b/i.test(fileName) ? "italic" : "normal";
}

function fontFormatFromFileName(fileName) {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".woff2")) return "woff2";
  if (lower.endsWith(".woff")) return "woff";
  if (lower.endsWith(".ttf")) return "truetype";
  if (lower.endsWith(".otf")) return "opentype";
  return "";
}

function buildFontFaceRule(fileName) {
  const family = normalizeFontFamilyFromFileName(fileName);
  const quotedFamily = quoteFontFamily(family);
  const weight = fontWeightFromFileName(fileName);
  const style = fontStyleFromFileName(fileName);
  const format = fontFormatFromFileName(fileName);
  const src = format
    ? `url(fonts/${fileName}) format("${format}")`
    : `url(fonts/${fileName})`;
  return `
@font-face {
  font-family: ${quotedFamily};
  src: ${src};
  font-weight: ${weight};
  font-style: ${style};
  font-display: swap;
}
`;
}

function ensureCustomFontFaces(fileNames) {
  if (!state.files.has("style.css") || !fileNames.length) return [];
  const originalCss = readCss();
  const blockMatch = originalCss.match(/\/\* custom-fonts:start \*\/[\s\S]*?\/\* custom-fonts:end \*\//i);
  const currentBlock = blockMatch ? blockMatch[0] : "";
  const baseCss = blockMatch ? originalCss.replace(blockMatch[0], "").trimEnd() : originalCss.trimEnd();
  const currentRules = currentBlock
    .replace(/\/\* custom-fonts:start \*\//i, "")
    .replace(/\/\* custom-fonts:end \*\//i, "")
    .trim();
  const existingUrls = new Set(
    Array.from(originalCss.matchAll(/url\(([^)]+)\)/gi))
      .map((m) => m[1]?.trim().replace(/^['"]|['"]$/g, ""))
      .filter(Boolean)
      .map((u) => normalizePath(u))
  );

  const rules = [];
  for (const fileName of fileNames) {
    const fontPath = normalizePath(`fonts/${fileName}`);
    if (existingUrls.has(fontPath)) continue;
    rules.push(buildFontFaceRule(fileName));
  }

  if (!rules.length) return [];
  const mergedRules = [currentRules, rules.join("\n")].filter(Boolean).join("\n\n");
  const block = `/* custom-fonts:start */\n${mergedRules}\n/* custom-fonts:end */\n`;
  writeCss(`${block}\n${baseCss}\n`);
  return fileNames.map((f) => normalizeFontFamilyFromFileName(f));
}

function addCustomFontOptions(families) {
  for (const family of families) {
    const value = `${quoteFontFamily(family)}, Arial, Verdana, Helvetica, sans-serif`;
    ensureFontFamilyOption(value, "fontBody");
    ensureFontFamilyOption(value, "fontTitles");
    ensureFontFamilyOption(value, "fontMenu");
  }
}

function applyFontStackToTargets(fontStack, targets) {
  if (!fontStack) return;
  const targetToSelectId = {
    body: "fontBody",
    titles: "fontTitles",
    menu: "fontMenu"
  };
  for (const target of targets) {
    const selectId = targetToSelectId[target];
    if (!selectId) continue;
    ensureFontFamilyOption(fontStack, selectId);
    const select = document.getElementById(selectId);
    if (select) select.value = fontStack;
  }
  applyQuickControls({ showStatus: false });
}

async function onAddFontsSelected(fileList) {
  const files = Array.from(fileList || []).filter((f) => isFontFileName(f.name));
  if (!files.length) {
    setStatusT("status.noValidFonts", "No se seleccionaron fuentes válidas (.woff, .woff2, .ttf, .otf).");
    return;
  }
  pushUndoSnapshot();

  let added = 0;
  const addedFileNames = [];
  for (const file of files) {
    const name = safeFileName(file.name);
    if (!name) continue;
    const path = `fonts/${name}`;
    const bytes = new Uint8Array(await file.arrayBuffer());
    state.files.set(path, bytes);
    markDirty();
    invalidateBlob(path);
    addedFileNames.push(name);
    added += 1;
  }

  const families = ensureCustomFontFaces(addedFileNames);
  if (families.length) addCustomFontOptions(families);

  refreshFileTypeFilterOptions();
  renderFileList();
  renderPreview();
  setStatus(i18nText("status.fontsAdded", `Fuentes añadidas: ${added}. Ya están disponibles en los selectores de tipografía.`, { added }));
}

function setupTabs() {
  for (const tab of els.tabs) {
    tab.addEventListener("click", () => {
      const id = tab.dataset.tab;
      for (const t of els.tabs) t.classList.toggle("active", t === tab);
      for (const p of els.panels) p.classList.toggle("active", p.dataset.panel === id);
    });
  }
}

function setupPanelAccordion(panelId) {
  const panel = document.querySelector(`.tab-panel[data-panel="${panelId}"]`);
  if (!panel) return;
  const sections = Array.from(panel.querySelectorAll("details"));
  for (const section of sections) {
    section.addEventListener("toggle", () => {
      if (!section.open) return;
      for (const other of sections) {
        if (other !== section) other.open = false;
      }
    });
  }
}

function setupEvents() {
  setupTrialNotice();
  applyControlTooltips();
  setupTabs();
  setupPanelAccordion("io");
  setupPanelAccordion("quick");
  setupPreviewFrame();
  setElpxModeUi();
  setClickEditButtonState();
  updateHistoryButtonsState();
  els.textEditor.addEventListener("input", onEditorInput);
  els.textEditor.addEventListener("scroll", syncHighlightedScroll);
  els.previewInspectBtn?.addEventListener("click", toggleClickEditMode);
  els.undoBtn?.addEventListener("click", () => {
    undoLastChange().catch((err) => setStatus(i18nText("status.undoError", `No se pudo deshacer: ${err.message}`, { error: err.message })));
  });
  els.redoBtn?.addEventListener("click", () => {
    redoLastChange().catch((err) => setStatus(i18nText("status.redoError", `No se pudo rehacer: ${err.message}`, { error: err.message })));
  });
  els.openDetachedEditorBtn?.addEventListener("click", openDetachedEditor);
  els.clickEditTitle?.addEventListener("mousedown", startClickEditModalDrag);
  els.clickEditApplyBtn?.addEventListener("click", applyClickEditChanges);
  els.clickEditCancelBtn?.addEventListener("click", closeClickEditModal);
  for (const [input, fieldKey] of [
    [els.clickPropColor, "color"],
    [els.clickPropBg, "bg"],
    [els.clickPropColorAlpha, "colorAlpha"],
    [els.clickPropBgAlpha, "bgAlpha"],
    [els.clickPropFontSize, "fontSize"],
    [els.clickPropFontWeight, "fontWeight"],
    [els.clickPropWidth, "width"],
    [els.clickPropMaxWidth, "maxWidth"],
    [els.clickPropMarginBottom, "marginBottom"],
    [els.clickPropPadding, "padding"],
    [els.clickApplyInteractiveStates, "interactiveStates"]
  ]) {
    if (!input) continue;
    const onInput = () => {
      markClickEditFieldTouched(fieldKey);
      renderLiveClickEditPreview();
    };
    input.addEventListener("input", onInput);
    input.addEventListener("change", onInput);
  }
  // No cerrar por clic en el fondo: evita cierres accidentales al arrastrar.
  document.addEventListener("keydown", (ev) => {
    if (ev.key !== "Escape") return;
    if (els.exportRenameModal && !els.exportRenameModal.hidden) {
      els.exportRenameCancelBtn?.click();
      return;
    }
    if (els.clickEditModal && !els.clickEditModal.hidden) closeClickEditModal();
  });
  window.addEventListener("beforeunload", closeDetachedEditorIfOpen);
  const onFileTypeFilterChange = () => {
    renderFileList();
  };
  els.fileTypeFilter?.addEventListener("change", onFileTypeFilterChange);
  els.fileTypeFilter?.addEventListener("input", onFileTypeFilterChange);
  els.fileTypeFilter?.addEventListener("keyup", onFileTypeFilterChange);
  els.fileTypeFilter?.addEventListener("keydown", (ev) => {
    if (ev.key === "ArrowDown" || ev.key === "ArrowUp" || ev.key === "Home" || ev.key === "End" || ev.key === "PageDown" || ev.key === "PageUp") {
      requestAnimationFrame(onFileTypeFilterChange);
    }
  });
  const onFileNameFilterChange = () => {
    renderFileList();
  };
  els.fileNameFilter?.addEventListener("input", onFileNameFilterChange);
  els.fileNameFilter?.addEventListener("search", onFileNameFilterChange);

  els.fileList?.addEventListener("keydown", (ev) => {
    const activeEl = document.activeElement;
    if (!(activeEl instanceof HTMLButtonElement) || !activeEl.classList.contains("file-item")) return;
    const items = Array.from(els.fileList.querySelectorAll(".file-item"));
    const idx = items.indexOf(activeEl);
    if (idx < 0) return;
    if (ev.key === "ArrowDown") {
      ev.preventDefault();
      const next = items[Math.min(idx + 1, items.length - 1)];
      next?.focus();
      next?.click();
    } else if (ev.key === "ArrowUp") {
      ev.preventDefault();
      const prev = items[Math.max(idx - 1, 0)];
      prev?.focus();
      prev?.click();
    }
  });

  els.binaryPreview?.addEventListener("click", (ev) => {
    const actionBtn = ev.target.closest("button[data-font-action]");
    if (actionBtn instanceof HTMLButtonElement && actionBtn.dataset.fontAction === "add") {
      if (!els.addFontInput) return;
      els.addFontInput.value = "";
      els.addFontInput.click();
      return;
    }

    const btn = ev.target.closest("button[data-font-target]");
    if (!(btn instanceof HTMLButtonElement)) return;
    const target = btn.dataset.fontTarget || "";
    const fontStack = btn.dataset.fontStack || "";
    if (!fontStack) return;
    if (target === "all") applyFontStackToTargets(fontStack, ["body", "titles", "menu"]);
    else applyFontStackToTargets(fontStack, [target]);
    setStatusT("status.fontApplied", "Fuente aplicada en tipografía.");
  });

  els.officialStyleSelect.addEventListener("change", async () => {
    const nextId = els.officialStyleSelect.value;
    const previousId = state.selectedOfficialStyleId;
    if (nextId === previousId) return;
    if (!confirmDiscardUnsavedChanges("usar otra plantilla oficial")) {
      els.officialStyleSelect.value = previousId;
      renderOfficialStylePreview(previousId);
      return;
    }
    try {
      await loadOfficialStyle(nextId);
    } catch (err) {
      els.officialStyleSelect.value = previousId;
      renderOfficialStylePreview(previousId);
      setStatus(i18nText("status.errorLoadingOfficialTemplate", `Error cargando plantilla oficial: ${err.message}`, { error: err.message }));
    }
  });

  els.zipPickBtn?.addEventListener("click", () => {
    els.zipInput?.click();
  });

  els.zipInput.addEventListener("change", async (ev) => {
    const file = ev.target.files?.[0];
    if (els.zipInputName) els.zipInputName.textContent = file ? file.name : i18nText("file.none", "Ningún archivo seleccionado");
    if (!file) return;
    if (!confirmDiscardUnsavedChanges("cargar un ZIP")) {
      ev.target.value = "";
      if (els.zipInputName) els.zipInputName.textContent = i18nText("file.none", "Ningún archivo seleccionado");
      return;
    }
    try {
      await loadZip(file);
    } catch (err) {
      setStatus(i18nText("status.errorLoadingZip", `Error cargando ZIP: ${err.message}`, { error: err.message }));
    }
  });

  els.elpxPickBtn?.addEventListener("click", () => {
    els.elpxInput?.click();
  });

  els.elpxInput?.addEventListener("change", async (ev) => {
    const file = ev.target.files?.[0];
    if (els.elpxInputName) els.elpxInputName.textContent = file ? file.name : i18nText("file.none", "Ningún archivo seleccionado");
    if (!file) return;
    if (!confirmDiscardUnsavedChanges("cargar un ELPX")) {
      ev.target.value = "";
      if (els.elpxInputName) els.elpxInputName.textContent = i18nText("file.none", "Ningún archivo seleccionado");
      return;
    }
    try {
      setBusyOverlay(true, "Cargando ELPX…");
      await loadElpx(file);
    } catch (err) {
      setStatus(i18nText("status.errorLoadingElpx", `Error cargando ELPX: ${err.message}`, { error: err.message }));
      if (els.elpxInputName) els.elpxInputName.textContent = i18nText("file.none", "Ningún archivo seleccionado");
      await deactivateElpxMode({ resetFrame: true });
    } finally {
      setBusyOverlay(false);
    }
  });

  els.replaceImageBtn.addEventListener("click", () => {
    if (!isImageFile(state.activePath)) return;
    els.replaceImageInput.value = "";
    els.replaceImageInput.click();
  });

  els.addFontBtn?.addEventListener("click", () => {
    if (!els.addFontInput) return;
    els.addFontInput.value = "";
    els.addFontInput.click();
  });

  els.addFontInput?.addEventListener("change", async (ev) => {
    try {
      await onAddFontsSelected(ev.target.files);
    } catch (err) {
      setStatus(i18nText("status.errorAddingFonts", `Error añadiendo fuentes: ${err.message}`, { error: err.message }));
    }
  });

  els.addLogoBtn?.addEventListener("click", () => {
    if (!els.addLogoInput) return;
    els.addLogoInput.value = "";
    els.addLogoInput.click();
  });

  els.addLogoInput?.addEventListener("change", async (ev) => {
    const file = ev.target.files?.[0];
    if (!file) return;
    try {
      await onAddLogoSelected(file);
    } catch (err) {
      setStatus(i18nText("status.errorLoadingLogo", `Error cargando logo: ${err.message}`, { error: err.message }));
    }
  });

  els.removeLogoBtn?.addEventListener("click", () => {
    removeLogo().catch((err) => {
      setStatus(i18nText("status.errorLoadingLogo", `Error cargando logo: ${err.message}`, { error: err.message }));
    });
  });

  els.addBgImageBtn?.addEventListener("click", () => {
    if (!els.addBgImageInput) return;
    els.addBgImageInput.value = "";
    els.addBgImageInput.click();
  });

  els.addBgImageInput?.addEventListener("change", async (ev) => {
    const file = ev.target.files?.[0];
    if (!file) return;
    try {
      await onAddBackgroundImageSelected(file);
    } catch (err) {
      setStatus(i18nText("status.errorLoadingBgImage", `Error cargando imagen de fondo: ${err.message}`, { error: err.message }));
    }
  });

  els.removeBgImageBtn?.addEventListener("click", () => {
    removeBackgroundImage();
  });

  els.bgImageSelect?.addEventListener("change", () => {
    const selectedPath = els.bgImageSelect.value;
    if (!selectedPath) return;
    selectBackgroundImageFromStylePath(selectedPath);
  });

  els.addHeaderImageBtn?.addEventListener("click", () => {
    if (!els.addHeaderImageInput) return;
    els.addHeaderImageInput.value = "";
    els.addHeaderImageInput.click();
  });

  els.addHeaderImageInput?.addEventListener("change", async (ev) => {
    const file = ev.target.files?.[0];
    if (!file) return;
    try {
      await onAddHeaderImageSelected(file);
    } catch (err) {
      setStatus(i18nText("status.errorLoadingHeaderImage", `Error cargando imagen de cabecera: ${err.message}`, { error: err.message }));
    }
  });

  els.removeHeaderImageBtn?.addEventListener("click", () => {
    removeHeaderImage();
  });

  els.showAllStyleImages?.addEventListener("change", () => {
    refreshHeaderFooterImageSelects();
    refreshNavIconSelects();
  });

  els.headerImageSelect?.addEventListener("change", () => {
    const selectedPath = els.headerImageSelect.value;
    if (!selectedPath) return;
    selectHeaderImageFromStylePath(selectedPath);
  });

  els.addFooterImageBtn?.addEventListener("click", () => {
    if (!els.addFooterImageInput) return;
    els.addFooterImageInput.value = "";
    els.addFooterImageInput.click();
  });

  els.addFooterImageInput?.addEventListener("change", async (ev) => {
    const file = ev.target.files?.[0];
    if (!file) return;
    try {
      await onAddFooterImageSelected(file);
    } catch (err) {
      setStatus(i18nText("status.errorLoadingFooterImage", `Error cargando imagen de pie: ${err.message}`, { error: err.message }));
    }
  });

  els.removeFooterImageBtn?.addEventListener("click", () => {
    removeFooterImage();
  });

  els.footerImageSelect?.addEventListener("change", () => {
    const selectedPath = els.footerImageSelect.value;
    if (!selectedPath) return;
    selectFooterImageFromStylePath(selectedPath);
  });

  els.navPrevIconSelect?.addEventListener("change", () => {
    const selectedPath = els.navPrevIconSelect.value;
    if (!selectedPath) return;
    selectNavIconFromStylePath(selectedPath, "prev");
  });

  els.navNextIconSelect?.addEventListener("change", () => {
    const selectedPath = els.navNextIconSelect.value;
    if (!selectedPath) return;
    selectNavIconFromStylePath(selectedPath, "next");
  });

  els.navMenuIconSelect?.addEventListener("change", () => {
    const selectedPath = els.navMenuIconSelect.value;
    if (!selectedPath) return;
    selectNavIconFromStylePath(selectedPath, "menu");
  });

  els.addNavPrevIconBtn?.addEventListener("click", () => {
    if (!els.addNavPrevIconInput) return;
    els.addNavPrevIconInput.value = "";
    els.addNavPrevIconInput.click();
  });

  els.addNavNextIconBtn?.addEventListener("click", () => {
    if (!els.addNavNextIconInput) return;
    els.addNavNextIconInput.value = "";
    els.addNavNextIconInput.click();
  });

  els.addNavMenuIconBtn?.addEventListener("click", () => {
    if (!els.addNavMenuIconInput) return;
    els.addNavMenuIconInput.value = "";
    els.addNavMenuIconInput.click();
  });

  els.addNavPrevIconInput?.addEventListener("change", async (ev) => {
    const file = ev.target.files?.[0];
    if (!file) return;
    try {
      await onAddNavIconSelected(file, "prev");
    } catch (err) {
      setStatus(i18nText("status.errorLoadingPrevIcon", `Error cargando icono de Anterior: ${err.message}`, { error: err.message }));
    }
  });

  els.addNavNextIconInput?.addEventListener("change", async (ev) => {
    const file = ev.target.files?.[0];
    if (!file) return;
    try {
      await onAddNavIconSelected(file, "next");
    } catch (err) {
      setStatus(i18nText("status.errorLoadingNextIcon", `Error cargando icono de Siguiente: ${err.message}`, { error: err.message }));
    }
  });

  els.addNavMenuIconInput?.addEventListener("change", async (ev) => {
    const file = ev.target.files?.[0];
    if (!file) return;
    try {
      await onAddNavIconSelected(file, "menu");
    } catch (err) {
      setStatus(i18nText("status.errorLoadingMenuIcon", `Error cargando icono de Menú: ${err.message}`, { error: err.message }));
    }
  });

  els.addIdeviceIconsBtn?.addEventListener("click", () => {
    if (!els.addIdeviceIconsInput) return;
    els.addIdeviceIconsInput.value = "";
    els.addIdeviceIconsInput.click();
  });

  els.addIdeviceIconsInput?.addEventListener("change", async (ev) => {
    try {
      await onAddIdeviceIconsSelected(ev.target.files);
    } catch (err) {
      setStatus(i18nText("status.errorAddingIdeviceIcons", `Error añadiendo iconos iDevice: ${err.message}`, { error: err.message }));
    }
  });

  els.replaceImageInput.addEventListener("change", async (ev) => {
    const file = ev.target.files?.[0];
    if (!file) return;
    try {
      await onReplaceImageSelected(file);
    } catch (err) {
      setStatus(i18nText("status.errorReplacingImage", `Error reemplazando imagen: ${err.message}`, { error: err.message }));
    }
  });

  els.exportBtn.addEventListener("click", exportZip);
  els.exportElpxBtn?.addEventListener("click", exportElpx);

  for (const input of els.quickInputs) {
    input.addEventListener("input", () => {
      applyQuickControls({ showStatus: false, changedKey: input.dataset.quick || "" });
    });
    input.addEventListener("change", () => {
      applyQuickControls({ showStatus: false, changedKey: input.dataset.quick || "" });
    });
  }

  for (const input of els.previewInputs) {
    input.addEventListener("change", applyPreviewTogglesFromUI);
    input.addEventListener("input", applyPreviewTogglesFromUI);
  }
  // Fallback delegado por si algún toggle se renderiza/reemplaza dinámicamente.
  document.addEventListener("change", (ev) => {
    const target = ev.target;
    if (!(target instanceof HTMLInputElement)) return;
    if (!target.matches("[data-preview]")) return;
    applyPreviewTogglesFromUI();
  });

  for (const metaInput of [
    els.metaName,
    els.metaTitle,
    els.metaVersion,
    els.metaCompatibility,
    els.metaAuthor,
    els.metaLicense,
    els.metaLicenseUrl,
    els.metaDescription,
    els.metaDownloadable
  ]) {
    metaInput.addEventListener("input", () => {
      saveMetaFields({ showStatus: false });
    });
  }

  els.metaDownloadable?.addEventListener("change", () => {
    saveMetaFields({ showStatus: false });
    if (els.metaDownloadable.value === "0") {
      alertT(
        "alert.downloadableZero",
        "Has marcado el estilo como no descargable (downloadable=0).\n\nEn eXe no podrá importarse desde la interfaz mientras mantengas ese valor."
      );
      setStatusT("status.downloadableZero", "downloadable=0: el estilo no será importable desde la interfaz de eXe.");
    } else {
      setStatusT("status.downloadableOne", "downloadable=1: el estilo será importable desde la interfaz de eXe.");
    }
  });
}

function refreshI18nDependentUi() {
  applyControlTooltips();
  setDetachedEditorButtonState();
  refreshFileTypeFilterOptions();
  refreshHeaderFooterImageSelects();
  refreshNavIconSelects();
  updateLogoInfo();
  updateBgImageInfo();
  updateHeaderImageInfo();
  updateFooterImageInfo();
  updateNavIconsInfo();
  syncDetachedEditorFromMain();
}

async function loadDefaultBootElpx() {
  const response = await fetch(DEFAULT_BOOT_ELPX_URL, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`No se pudo cargar ${DEFAULT_BOOT_ELPX_URL} (${response.status})`);
  }
  const blob = await response.blob();
  const file = new File([blob], "ejemplo.elpx", { type: blob.type || "application/zip" });
  setBusyOverlay(true, i18nText("preview.loadingExample", "Cargando ejemplo..."));
  try {
    await loadElpx(file);
    if (els.elpxInputName) els.elpxInputName.textContent = i18nText("file.defaultExampleLoaded", "ejemplo.elpx (cargado por defecto)");
    setStatus(i18nText("status.defaultExampleLoaded", "Ejemplo cargado por defecto."));
  } finally {
    setBusyOverlay(false);
  }
}

(async function boot() {
  if (window.EditorI18n && typeof window.EditorI18n.init === "function") {
    window.EditorI18n.init();
  }
  setupEvents();
  refreshI18nDependentUi();
  window.addEventListener("editor-i18n:changed", refreshI18nDependentUi);
  state.preview = loadPreviewToggles();
  previewToUI(state.preview);
  try {
    await loadOfficialStylesCatalog();
    await loadDefaultBootElpx();
  } catch (err) {
    setStatus(i18nText("status.defaultElpxLoadError", `No se pudo cargar ejemplo.elpx por defecto: ${err.message}`, { error: err.message }));
    setBusyOverlay(false);
  }
})();
