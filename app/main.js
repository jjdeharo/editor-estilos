const CORE_REQUIRED = ["config.xml", "style.css", "style.js", "screenshot.png"];
const TEXT_EXTENSIONS = [".css", ".js", ".xml", ".txt", ".html", ".json", ".md"];
const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"];
const DEFAULT_STYLE_JS = `/* style.js autogenerado por el editor para cumplir requisitos mínimos de eXe */\n`;
const MIN_SCREENSHOT_PNG_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO7+3xkAAAAASUVORK5CYII=";
const QUICK_PROTECTED_PATTERNS = [
  { re: /\.box-toggle\b/i, label: ".box-toggle" },
  { re: /#siteNavToggler\b/i, label: "#siteNavToggler" },
  { re: /#searchBarTogger\b/i, label: "#searchBarTogger" },
  { re: /\.nav-buttons\b/i, label: ".nav-buttons" }
];
const TRIAL_NOTICE_KEY = "editor-estilos:trial-notice-dismissed";
const PREVIEW_TOGGLES_KEY = "editor-estilos:preview-toggles";
const PREVIEW_FRAME_URL = "app/preview.html";

const FILE_TYPE_OPTIONS = [
  { value: "images", label: "Imágenes" },
  { value: "css", label: "CSS" },
  { value: "js", label: "JavaScript" },
  { value: "xml", label: "XML" },
  { value: "fonts", label: "Fuentes" },
  { value: "text", label: "Texto" },
  { value: "json", label: "JSON" },
  { value: "html", label: "HTML" },
  { value: "markdown", label: "Markdown" },
  { value: "other", label: "Otros" }
];

const QUICK_DEFAULTS = {
  linkColor: "#d76b4a",
  titleColor: "#078e8e",
  textColor: "#333333",
  contentBgColor: "#ffffff",
  pageBgColor: "#ffffff",
  contentWidth: 1280,
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
  buttonBgColor: "#005f73",
  buttonTextColor: "#ffffff",
  bgImageEnabled: false,
  bgImagePath: "",
  logoEnabled: false,
  logoPath: "",
  logoSize: 130,
  logoPosition: "top-right",
  logoMarginX: 20,
  logoMarginY: 14
};

const PREVIEW_DEFAULTS = {
  showSearch: true,
  showPageCounter: true,
  showNavButtons: true,
  navCollapsed: false,
  showPackageTitle: true,
  showPageTitle: true,
  collapseIdevices: false
};

const els = {
  trialNotice: document.getElementById("trialNotice"),
  dismissTrialNotice: document.getElementById("dismissTrialNotice"),
  tabs: Array.from(document.querySelectorAll(".tab")),
  panels: Array.from(document.querySelectorAll(".tab-panel")),
  officialStyleSelect: document.getElementById("officialStyleSelect"),
  officialPreview: document.getElementById("officialPreview"),
  zipInput: document.getElementById("zipInput"),
  exportBtn: document.getElementById("exportBtn"),
  status: document.getElementById("status"),
  fileList: document.getElementById("fileList"),
  fileTypeFilter: document.getElementById("fileTypeFilter"),
  editorPath: document.getElementById("editorPath"),
  imageActions: document.getElementById("imageActions"),
  addFontBtn: document.getElementById("addFontBtn"),
  addFontInput: document.getElementById("addFontInput"),
  replaceImageBtn: document.getElementById("replaceImageBtn"),
  replaceImageInput: document.getElementById("replaceImageInput"),
  textEditor: document.getElementById("textEditor"),
  binaryPreview: document.getElementById("binaryPreview"),
  previewFrame: document.getElementById("previewFrame"),
  previewOptionsBtn: document.getElementById("previewOptionsBtn"),
  previewOptionsPanel: document.getElementById("previewOptionsPanel"),
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
  bgImageInfo: document.getElementById("bgImageInfo"),
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
  previewPendingRender: false,
  isDirty: false
};

function markDirty() {
  state.isDirty = true;
}

function clearDirty() {
  state.isDirty = false;
}

function confirmDiscardUnsavedChanges(contextLabel = "cargar otro estilo") {
  if (!state.isDirty) return true;
  return window.confirm(
    `Hay cambios sin exportar. Antes de ${contextLabel}, exporta un ZIP para no perderlos.\n\n¿Continuar y descartar cambios?`
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
  if (!state.officialSourceId) return false;
  const currentName = String(els.metaName?.value || "").trim().toLowerCase();
  const currentTitle = String(els.metaTitle?.value || "").trim().toLowerCase();
  const official = getOfficialStyleById(state.officialSourceId);
  const officialName = String(state.officialSourceId || "").trim().toLowerCase();
  const officialTitle = String(official?.meta?.title || "").trim().toLowerCase();
  const nameEqual = Boolean(currentName && officialName && currentName === officialName);
  const titleEqual = Boolean(currentTitle && officialTitle && currentTitle === officialTitle);
  return { nameEqual, titleEqual, hasConflict: nameEqual || titleEqual };
}

function setStatus(text) {
  els.status.textContent = text;
}

function setupTrialNotice() {
  if (!els.trialNotice || !els.dismissTrialNotice) return;
  let dismissed = false;
  try {
    dismissed = window.localStorage.getItem(TRIAL_NOTICE_KEY) === "1";
  } catch {
    dismissed = false;
  }
  if (dismissed) {
    els.trialNotice.classList.add("hidden");
    return;
  }
  els.dismissTrialNotice.addEventListener("click", () => {
    els.trialNotice.classList.add("hidden");
    try {
      window.localStorage.setItem(TRIAL_NOTICE_KEY, "1");
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
    els.logoInfo.textContent = "Sin logo cargado.";
    return;
  }
  els.logoInfo.textContent = `Logo actual: ${state.quick.logoPath}`;
}

function updateBgImageInfo() {
  if (!els.bgImageInfo) return;
  if (!state.quick.bgImagePath || !state.files.has(state.quick.bgImagePath) || !state.quick.bgImageEnabled) {
    els.bgImageInfo.textContent = "Sin imagen de fondo.";
    return;
  }
  els.bgImageInfo.textContent = `Fondo actual: ${state.quick.bgImagePath}`;
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
  const author = meta.author || "Sin autor";
  const version = meta.version || "s/v";
  const compatibility = meta.compatibility || "s/d";
  const desc = meta.description || "Sin descripción.";
  const screenshot = `${style.dir}/screenshot.png`;

  els.officialPreview.className = "official-preview";
  els.officialPreview.innerHTML = `
    <figure>
      <img src="${escapeHtml(screenshot)}" alt="Vista previa ${escapeHtml(title)}" loading="lazy" />
      <figcaption>
        <span class="title">${escapeHtml(title)}</span>
        <span class="meta">ID: ${escapeHtml(style.id)} | Versión: ${escapeHtml(version)} | Compat: ${escapeHtml(compatibility)}</span>
        <span class="meta">Autor: ${escapeHtml(author)}</span>
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
  allOption.textContent = `Todos (${total})`;
  els.fileTypeFilter.appendChild(allOption);

  for (const opt of FILE_TYPE_OPTIONS) {
    const count = groupCounts.get(opt.value) || 0;
    if (!count) continue;
    const option = document.createElement("option");
    option.value = opt.value;
    option.textContent = `${opt.label} (${count})`;
    els.fileTypeFilter.appendChild(option);
  }

  els.fileTypeFilter.value = forceAll ? "all" : (previous === "all" || groupCounts.has(previous) ? previous : "all");
}

function readCss() {
  return state.files.has("style.css") ? decode(state.files.get("style.css")) : "";
}

function writeCss(cssText) {
  state.files.set("style.css", encode(cssText));
  invalidateBlob("style.css");
  if (state.activePath === "style.css") syncEditorWithActiveFile();
  renderPreview();
}

function renderFileList() {
  const selectedFilter = els.fileTypeFilter?.value || "all";
  els.fileList.innerHTML = "";
  const visiblePaths = [];
  for (const path of listFilesSorted()) {
    const group = fileGroup(path);
    if (selectedFilter !== "all" && group !== selectedFilter) continue;
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
    empty.textContent = "No hay archivos para este tipo.";
    els.fileList.appendChild(empty);
  }
}

function syncEditorWithActiveFile() {
  const bytes = state.files.get(state.activePath);
  if (!bytes) {
    els.editorPath.textContent = "Archivo no encontrado";
    els.textEditor.value = "";
    els.textEditor.disabled = true;
    els.textEditor.style.display = "block";
    els.imageActions.classList.remove("active");
    els.binaryPreview.classList.remove("active");
    els.binaryPreview.innerHTML = "";
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
      return;
    }
    els.editorPath.textContent = `${state.activePath} (binario)`;
    els.textEditor.value = "Este archivo es binario y no se edita aquí.";
    els.textEditor.disabled = true;
    return;
  }

  els.editorPath.textContent = state.activePath;
  els.textEditor.style.display = "block";
  els.textEditor.disabled = false;
  els.textEditor.value = decode(bytes);
}

function quickFromUI() {
  const next = { ...state.quick };
  for (const input of els.quickInputs) {
    const key = input.dataset.quick;
    if (!key || !(key in next)) continue;
    if (input.type === "number") next[key] = Number(input.value || QUICK_DEFAULTS[key]);
    else if (input.type === "checkbox") next[key] = input.checked;
    else next[key] = input.value;
  }
  next.contentWidth = Math.max(640, Math.min(2000, Number(next.contentWidth) || 1280));
  next.baseFontSize = Math.max(12, Math.min(28, Number(next.baseFontSize) || QUICK_DEFAULTS.baseFontSize));
  next.lineHeight = Math.max(1, Math.min(2.2, Number(next.lineHeight) || QUICK_DEFAULTS.lineHeight));
  next.pageTitleSize = Math.max(1.1, Math.min(3.2, Number(next.pageTitleSize) || QUICK_DEFAULTS.pageTitleSize));
  next.pageTitleLetterSpacing = Math.max(0, Math.min(6, Number(next.pageTitleLetterSpacing) || QUICK_DEFAULTS.pageTitleLetterSpacing));
  next.pageTitleMarginBottom = Math.max(0, Math.min(2.5, Number(next.pageTitleMarginBottom) || QUICK_DEFAULTS.pageTitleMarginBottom));
  next.packageTitleSize = Math.max(1, Math.min(2.6, Number(next.packageTitleSize) || QUICK_DEFAULTS.packageTitleSize));
  next.boxTitleSize = Math.max(1, Math.min(2.4, Number(next.boxTitleSize) || QUICK_DEFAULTS.boxTitleSize));
  next.boxTitleGap = Math.max(0, Math.min(28, Number(next.boxTitleGap) || QUICK_DEFAULTS.boxTitleGap));
  next.logoSize = Math.max(40, Math.min(500, Number(next.logoSize) || QUICK_DEFAULTS.logoSize));
  next.logoMarginX = Math.max(0, Math.min(300, Number(next.logoMarginX) || QUICK_DEFAULTS.logoMarginX));
  next.logoMarginY = Math.max(0, Math.min(300, Number(next.logoMarginY) || QUICK_DEFAULTS.logoMarginY));
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
  updateLogoInfo();
  updateBgImageInfo();
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
  setStatus("Previsualización actualizada.");
}

function setupPreviewOptionsPopover() {
  const btn = els.previewOptionsBtn;
  const panel = els.previewOptionsPanel;
  if (!btn || !panel) return;

  const setOpen = (open) => {
    panel.hidden = !open;
    btn.setAttribute("aria-expanded", open ? "true" : "false");
  };
  const isOpen = () => !panel.hidden;

  btn.addEventListener("click", (ev) => {
    ev.stopPropagation();
    setOpen(!isOpen());
  });

  panel.addEventListener("click", (ev) => {
    ev.stopPropagation();
  });

  document.addEventListener("click", () => {
    if (isOpen()) setOpen(false);
  });

  document.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape" && isOpen()) {
      setOpen(false);
      btn.focus();
    }
  });
}

function setupPreviewFrame() {
  const frame = els.previewFrame;
  if (!frame) return;

  const expectedSrc = PREVIEW_FRAME_URL;
  const currentAttr = frame.getAttribute("src");
  if (!currentAttr || currentAttr !== expectedSrc) frame.setAttribute("src", expectedSrc);

  frame.addEventListener("load", () => {
    if (state.previewPendingRender) renderPreview();
  });
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
      const propRe = new RegExp(`${propPattern}\\s*:\\s*([^;]+);`, "i");
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
  const bodyWebSiteDecls = lastCssPropValue("body\\.exe-web-site", "font-size|line-height") ? (Array.from(cssText.matchAll(/body\.exe-web-site\s*\{([^}]*)\}/gi)).at(-1)?.[1] || "") : "";

  q.pageBgColor = normalizeHex(lastCssPropValue("body\\.exe-web-site", "background") || q.pageBgColor, q.pageBgColor);
  q.fontBody = matchValue(
    /\.exe-content\s*\{[\s\S]*?font-family:\s*([^;]+);/i,
    matchValue(/body(?:\.exe-web-site)?\s*\{[\s\S]*?font-family:\s*([^;]+);/i, q.fontBody)
  );
  q.fontTitles = matchValue(
    /\.exe-content\s*\.page-title\s*\{[\s\S]*?font-family:\s*([^;]+);/i,
    matchValue(
      /\.exe-content\s*\.box-head\s*\.box-title\s*\{[\s\S]*?font-family:\s*([^;]+);/i,
      q.fontBody
    )
  );
  q.fontMenu = matchValue(/#siteNav a\s*\{[\s\S]*?font-family:\s*([^;]+);/i, q.fontBody);
  const sizeMatch = bodyWebSiteDecls.match(/font-size:\s*([0-9.]+)px\s*;/i);
  if (sizeMatch) q.baseFontSize = Number(sizeMatch[1]);
  const lhMatch = bodyWebSiteDecls.match(/line-height:\s*([0-9.]+)\s*;/i);
  if (lhMatch) q.lineHeight = Number(lhMatch[1]);
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
  const packageTitleSizeRaw = matchValue(/\.exe-content\s*\.package-title\s*\{[\s\S]*?font-size:\s*([^;]+);/i, "");
  const packageTitleSizeMatch = packageTitleSizeRaw.match(/([0-9.]+)\s*rem/i);
  if (packageTitleSizeMatch) q.packageTitleSize = Number(packageTitleSizeMatch[1]);
  const packageTitleWeightRaw = matchValue(/\.exe-content\s*\.package-title\s*\{[\s\S]*?font-weight:\s*([^;]+);/i, "");
  if (/^\d{3}$/.test(packageTitleWeightRaw)) q.packageTitleWeight = packageTitleWeightRaw;
  q.packageTitleColor = normalizeHex(matchValue(/\.exe-content\s*\.package-title\s*\{[\s\S]*?color:\s*([^;]+);/i, q.packageTitleColor), q.packageTitleColor);
  const boxTitleSizeRaw = matchValue(/\.exe-content\s*\.box-title,\s*[\s\S]*?\.exe-content\s*\.iDeviceTitle\s*\{[\s\S]*?font-size:\s*([^;]+);/i, "");
  const boxTitleSizeMatch = boxTitleSizeRaw.match(/([0-9.]+)\s*rem/i);
  if (boxTitleSizeMatch) q.boxTitleSize = Number(boxTitleSizeMatch[1]);
  const boxHeadGapRaw = matchValue(/\.exe-content\s*\.box-head\s*\{[\s\S]*?gap:\s*([^;]+);/i, "");
  const boxHeadGapMatch = boxHeadGapRaw.match(/([0-9.]+)\s*px/i);
  if (boxHeadGapMatch) q.boxTitleGap = Number(boxHeadGapMatch[1]);

  q.linkColor = normalizeHex(lastCssPropValue("\\.exe-content a", "color") || q.linkColor, q.linkColor);
  q.titleColor = normalizeHex(lastCssPropValue("\\.exe-content \\.page-title", "color") || q.titleColor, q.titleColor);
  q.textColor = normalizeHex(lastCssPropValue("\\.exe-content", "color") || q.textColor, q.textColor);
  q.contentBgColor = normalizeHex(lastCssPropValue("\\.exe-content", "background-color") || q.contentBgColor, q.contentBgColor);
  q.menuBgColor = normalizeHex(lastCssPropValue("#siteNav", "background") || q.menuBgColor, q.menuBgColor);
  q.menuTextColor = normalizeHex(lastCssPropValue("#siteNav a", "color") || q.menuTextColor, q.menuTextColor);
  q.menuActiveBgColor = normalizeHex(lastCssPropValue("#siteNav a\\.active", "background") || q.menuActiveBgColor, q.menuActiveBgColor);
  q.menuActiveTextColor = normalizeHex(lastCssPropValue("#siteNav a\\.active", "color") || q.menuActiveTextColor, q.menuActiveTextColor);
  q.boxBgColor = normalizeHex(matchValue(/\.exe-content \.box,\s*[\s\S]*?#node-content-container\.exe-content \.box\s*\{[\s\S]*?background:\s*([^;]+);/i, q.boxBgColor), q.boxBgColor);
  q.boxBorderColor = normalizeHex(matchValue(/\.exe-content \.box,\s*[\s\S]*?#node-content-container\.exe-content \.box\s*\{[\s\S]*?border-color:\s*([^;]+);/i, q.boxBorderColor), q.boxBorderColor);
  q.boxTitleColor = normalizeHex(matchValue(/\.exe-content \.box-title,\s*[\s\S]*?\.exe-content \.iDeviceTitle\s*\{[\s\S]*?color:\s*([^;]+);/i, q.boxTitleColor), q.boxTitleColor);
  q.buttonBgColor = normalizeHex(
    matchValue(/\.exe-content button(?:\s*:not\(\.toggler\)(?:\s*:not\(\.box-toggle\))?)?\s*\{[\s\S]*?background:\s*([^;]+);/i, q.buttonBgColor),
    q.buttonBgColor
  );
  q.buttonTextColor = normalizeHex(
    matchValue(/\.exe-content button(?:\s*:not\(\.toggler\)(?:\s*:not\(\.box-toggle\))?)?\s*\{[\s\S]*?color:\s*([^;]+);/i, q.buttonTextColor),
    q.buttonTextColor
  );

  const widthMatch = cssText.match(/#node-content-container\.exe-content\s*#node-content\s*\{[\s\S]*?max-width:\s*(\d+)px\s*;/i);
  if (widthMatch) q.contentWidth = Number(widthMatch[1]);

  const logoMeta = cssText.match(/\/\*\s*logo-editor:path=([^;]*);enabled=(0|1);size=(\d+);position=([^;]+);mx=(\d+);my=(\d+)\s*\*\//i);
  if (logoMeta) {
    q.logoPath = normalizePath(logoMeta[1].trim());
    q.logoEnabled = logoMeta[2] === "1";
    q.logoSize = Number(logoMeta[3]) || q.logoSize;
    q.logoPosition = logoMeta[4].trim() || q.logoPosition;
    q.logoMarginX = Number(logoMeta[5]) || q.logoMarginX;
    q.logoMarginY = Number(logoMeta[6]) || q.logoMarginY;
  }
  const bgMeta = cssText.match(/\/\*\s*bg-editor:path=([^;]*);enabled=(0|1)\s*\*\//i);
  if (bgMeta) {
    q.bgImagePath = normalizePath(bgMeta[1].trim());
    q.bgImageEnabled = bgMeta[2] === "1";
  }

  return q;
}

function buildQuickCss({ important = true } = {}) {
  const q = state.quick;
  const bang = important ? " !important" : "";
  const logoPath = q.logoPath && state.files.has(q.logoPath) ? q.logoPath : "";
  const bgImagePath = q.bgImagePath && state.files.has(q.bgImagePath) ? q.bgImagePath : "";
  const logoMeta = `/* logo-editor:path=${logoPath};enabled=${q.logoEnabled ? "1" : "0"};size=${q.logoSize};position=${q.logoPosition};mx=${q.logoMarginX};my=${q.logoMarginY} */`;
  const bgMeta = `/* bg-editor:path=${bgImagePath};enabled=${q.bgImageEnabled ? "1" : "0"} */`;
  const logoRule = q.logoEnabled && logoPath
    ? `
body.exe-web-site::after {
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
  return `
${logoMeta}
${bgMeta}
body.exe-web-site {
  background: ${normalizeHex(q.pageBgColor)}${bang};
  background-image: ${q.bgImageEnabled && bgImagePath ? `url("${bgImagePath}")` : "none"}${bang};
  background-repeat: no-repeat${bang};
  background-position: center top${bang};
  background-size: cover${bang};
  font-family: ${q.fontBody}${bang};
  font-size: ${q.baseFontSize}px${bang};
  line-height: ${q.lineHeight}${bang};
}
#node-content-container.exe-content #node-content,
.exe-web-site .page-content,
.exe-web-site main>header,
.exe-web-site #siteFooterContent,
.exe-export .exe-content {
  max-width: ${q.contentWidth}px${bang};
}
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
  background: ${normalizeHex(q.menuBgColor)}${bang};
}
#siteNav a {
  font-family: ${q.fontMenu}${bang};
  color: ${normalizeHex(q.menuTextColor)}${bang};
}
#siteNav a.active {
  background: ${normalizeHex(q.menuActiveBgColor)}${bang};
  color: ${normalizeHex(q.menuActiveTextColor)}${bang};
}
.exe-content .box,
#node-content-container.exe-content .box {
  background: ${normalizeHex(q.boxBgColor)}${bang};
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
.exe-content button:not(.toggler):not(.box-toggle) {
  background: ${normalizeHex(q.buttonBgColor)}${bang};
  color: ${normalizeHex(q.buttonTextColor)}${bang};
  border-color: ${normalizeHex(q.buttonBgColor)}${bang};
}
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

function applyQuickControls({ showStatus = true } = {}) {
  state.quick = quickFromUI();
  applyEditorTheme();
  const baseCss = stripQuickBlock(readCss());
  const css = `${baseCss}\n\n/* quick-overrides:start */\n${buildQuickCss({ important: false })}\n/* quick-overrides:end */\n`;
  writeCss(css);
  markDirty();
  if (showStatus) setStatus("Ajustes rápidos volcados en style.css");
}

function refreshQuickControls() {
  const css = readCss();
  state.quick = { ...state.quick, ...quickFromCss(css) };
  if (state.quick.bgImagePath && !state.files.has(state.quick.bgImagePath)) {
    state.quick.bgImagePath = "";
    state.quick.bgImageEnabled = false;
  }
  if (!state.quick.logoPath) {
    state.quick.logoPath = findCustomLogoPath();
  }
  if (state.quick.logoPath && !state.files.has(state.quick.logoPath)) {
    state.quick.logoPath = "";
    state.quick.logoEnabled = false;
  }
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

function saveMetaFields({ showStatus = true } = {}) {
  if (!state.files.has("config.xml")) {
    if (showStatus) setStatus("No existe config.xml en este estilo");
    return;
  }
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
  if (showStatus) setStatus("config.xml actualizado");
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
  }
  return "";
}

function buildPreviewPayload(cssText) {
  return {
    cssText: rewriteCssUrls(cssText),
    styleJsText: styleJsText(),
    preview: { ...PREVIEW_DEFAULTS, ...state.preview },
    iconUrls: {
      info: previewIconUrl("info"),
      objectives: previewIconUrl("objectives"),
      activity: previewIconUrl("activity")
    },
    screenshotUrl: getBlobUrl("screenshot.png"),
    packageTitle: "Curso de ejemplo",
    pageTitle: "Introducción"
  };
}

function getPreviewRuntime() {
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
  const runtime = getPreviewRuntime();
  if (!runtime) {
    state.previewPendingRender = true;
    return;
  }
  const css = readCss();
  runtime.render(buildPreviewPayload(css));
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
      if (getPreviewRuntime()) {
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
  if (!frame?.contentDocument?.documentElement) throw new Error("Previsualización no disponible");

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
      i.onerror = () => reject(new Error("No se pudo renderizar SVG de previsualización"));
      i.src = svgUrl;
    });
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas no disponible");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) throw new Error("No se pudo generar PNG");
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
    if (!r.ok) throw new Error("No se pudo cargar app/official-styles.json");
    return r.json();
  });
  state.officialStyles = Array.isArray(manifest.styles) ? manifest.styles : [];
  if (!state.officialStyles.length) throw new Error("No hay estilos oficiales en el catálogo");

  const defaultId = state.officialStyles.some((s) => s.id === "base") ? "base" : state.officialStyles[0].id;
  state.selectedOfficialStyleId = defaultId;
  renderOfficialStylesSelect();
  renderOfficialStylePreview(defaultId);
}

async function loadOfficialStyle(styleId, { showStatus = true, resetFileFilter = true } = {}) {
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
  state.activePath = state.files.has("style.css") ? "style.css" : listFilesSorted()[0] || "";

  renderOfficialStylesSelect();
  renderOfficialStylePreview(style.id);
  refreshFileTypeFilterOptions({ forceAll: resetFileFilter });
  renderFileList();
  syncEditorWithActiveFile();
  refreshQuickControls();
  refreshMetaFields();
  warnIfNotDownloadable("estilo");
  renderPreview();
  clearDirty();

  if (showStatus) {
    const label = style.meta?.title || style.id;
    setStatus(`Plantilla oficial cargada: ${label} (${style.id})`);
  }
}

async function loadZip(file) {
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

  const autoAddedOnLoad = ensureCoreFilesPresent({ markAsDirty: false });

  let zipStatus = "";
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
  if (els.metaDownloadable?.value === "0") {
    window.alert(
      "Este estilo está marcado como no descargable (downloadable=0).\n\nPuedes editarlo aquí, pero en eXe no se podrá importar desde la interfaz mientras siga en 0."
    );
  }
  warnIfNotDownloadable("ZIP");
  renderPreview();
  clearDirty();
  const importIssues = importValidationSummary();
  if (importIssues.missingCore.length || importIssues.cssIssues.length) {
    const parts = [];
    if (importIssues.missingCore.length) parts.push(`faltan obligatorios: ${importIssues.missingCore.join(", ")}`);
    if (importIssues.cssIssues.length) parts.push(`incidencias CSS: ${importIssues.cssIssues.join(" | ")}`);
    setStatus(`ZIP cargado con incidencias: ${parts.join(" ; ")}`);
  } else {
    setStatus(zipStatus || `ZIP cargado: ${file.name} (${state.files.size} archivos)`);
  }
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
  const officialConflict = officialMetadataConflict();
  if (officialConflict.hasConflict) {
    const fields = [];
    if (officialConflict.nameEqual) fields.push("Nombre");
    if (officialConflict.titleEqual) fields.push("Título");
    const fieldsText = fields.join(" y ");
    setStatus(`Debes cambiar ${fieldsText} del estilo en Metadatos antes de exportar para no sobrescribir la plantilla oficial.`);
    window.alert(
      `Exportación bloqueada.\n\n${fieldsText} coincide con la plantilla oficial.\nCámbialo en Proyecto > Información y exportación y vuelve a exportar.`
    );
    focusMetadataForRename({ preferTitle: !officialConflict.nameEqual && officialConflict.titleEqual });
    return;
  }

  if (state.files.has("style.css")) {
    const sanitized = sanitizeStyleCss(readCss());
    state.files.set("style.css", encode(sanitized));
    invalidateBlob("style.css");
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
    setStatus(`Exportación bloqueada: ${parts.join(" ; ")}`);
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
  const warningText = warnings.length ? ` con aviso: ${warnings.join(" ; ")}` : "";
  setStatus(`ZIP exportado correctamente (${state.files.size} archivos)${warningText}`);
}

function onEditorInput() {
  const path = state.activePath;
  if (!path || !isTextFile(path)) return;
  state.files.set(path, encode(els.textEditor.value));
  markDirty();
  invalidateBlob(path);

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
  const bytes = new Uint8Array(await file.arrayBuffer());
  state.files.set(state.activePath, bytes);
  markDirty();
  invalidateBlob(state.activePath);
  syncEditorWithActiveFile();
  renderPreview();
  setStatus(`Imagen reemplazada: ${state.activePath}`);
}

async function onAddLogoSelected(file) {
  if (!file) return;
  if (!isImageFile(file.name)) {
    setStatus("El logo debe ser una imagen válida.");
    return;
  }
  const extension = (file.name.split(".").pop() || "png").toLowerCase();
  const path = `img/custom-logo.${extension}`;
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
  renderPreview();
  setStatus(`Logo cargado: ${path}`);
}

function removeLogo() {
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
  renderPreview();
  setStatus("Logo eliminado.");
}

async function onAddBackgroundImageSelected(file) {
  if (!file) return;
  if (!isImageFile(file.name)) {
    setStatus("La imagen de fondo debe ser un archivo de imagen válido.");
    return;
  }
  const extension = (file.name.split(".").pop() || "png").toLowerCase();
  const path = `img/custom-background.${extension}`;
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
  setStatus(`Imagen de fondo cargada: ${path}`);
}

function removeBackgroundImage() {
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
  setStatus("Imagen de fondo eliminada.");
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
    setStatus("No se seleccionaron iconos válidos (.png, .jpg, .jpeg, .gif, .webp, .svg).");
    return;
  }

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
    setStatus("No se añadieron iconos iDevice.");
    return;
  }

  markDirty();
  refreshFileTypeFilterOptions();
  renderFileList();
  renderPreview();
  setStatus(`Iconos iDevice actualizados: ${added} añadidos, ${replaced} reemplazados.`);
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
    setStatus("No se seleccionaron fuentes válidas (.woff, .woff2, .ttf, .otf).");
    return;
  }

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
  setStatus(`Fuentes añadidas: ${added}. Ya están disponibles en los selectores de tipografía.`);
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
  setupTabs();
  setupPanelAccordion("io");
  setupPanelAccordion("quick");
  setupPreviewOptionsPopover();
  setupPreviewFrame();
  els.textEditor.addEventListener("input", onEditorInput);
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
    setStatus("Fuente aplicada en tipografía.");
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
      setStatus(`Error cargando plantilla oficial: ${err.message}`);
    }
  });

  els.zipInput.addEventListener("change", async (ev) => {
    const file = ev.target.files?.[0];
    if (!file) return;
    if (!confirmDiscardUnsavedChanges("cargar un ZIP")) {
      ev.target.value = "";
      return;
    }
    try {
      await loadZip(file);
    } catch (err) {
      setStatus(`Error cargando ZIP: ${err.message}`);
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
      setStatus(`Error añadiendo fuentes: ${err.message}`);
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
      setStatus(`Error cargando logo: ${err.message}`);
    }
  });

  els.removeLogoBtn?.addEventListener("click", () => {
    removeLogo();
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
      setStatus(`Error cargando imagen de fondo: ${err.message}`);
    }
  });

  els.removeBgImageBtn?.addEventListener("click", () => {
    removeBackgroundImage();
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
      setStatus(`Error añadiendo iconos iDevice: ${err.message}`);
    }
  });

  els.replaceImageInput.addEventListener("change", async (ev) => {
    const file = ev.target.files?.[0];
    if (!file) return;
    try {
      await onReplaceImageSelected(file);
    } catch (err) {
      setStatus(`Error reemplazando imagen: ${err.message}`);
    }
  });

  els.exportBtn.addEventListener("click", exportZip);

  for (const input of els.quickInputs) {
    input.addEventListener("input", () => {
      applyQuickControls({ showStatus: false });
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
      window.alert(
        "Has marcado el estilo como no descargable (downloadable=0).\n\nEn eXe no podrá importarse desde la interfaz mientras mantengas ese valor."
      );
      setStatus("downloadable=0: el estilo no será importable desde la interfaz de eXe.");
    } else {
      setStatus("downloadable=1: el estilo será importable desde la interfaz de eXe.");
    }
  });
}

(async function boot() {
  setupEvents();
  state.preview = loadPreviewToggles();
  previewToUI(state.preview);
  try {
    await loadOfficialStylesCatalog();
    await loadOfficialStyle(state.selectedOfficialStyleId, { showStatus: false });
    setStatus("Plantilla oficial base cargada por defecto");
  } catch (err) {
    setStatus(`Error inicializando catálogo oficial: ${err.message}`);
  }
})();
