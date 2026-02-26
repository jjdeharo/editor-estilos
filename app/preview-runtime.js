const PREVIEW_DEFAULTS = {
  showSearch: true,
  showPageCounter: true,
  showNavButtons: true,
  navCollapsed: false,
  showPackageTitle: true,
  showPageTitle: true,
  collapseIdevices: false
};

const PREVIEW_PAGE_ID = "20260101000000SIMULADO";
let modernPageIndex = 0;
const toggleBgImageInfoCache = new Map();

function escapeHtml(text) {
  return String(text || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function iconMarkup(src, label) {
  if (!src) return { html: "", hasIcon: false };
  return {
    html: `<img class="exe-icon" src="${escapeHtml(src)}" alt="" aria-label="${escapeHtml(label)}" width="48" height="48" />`,
    hasIcon: true
  };
}

function styleMovesPageTitle(styleJsText) {
  const styleJs = String(styleJsText || "");
  if (!styleJs) return false;
  return /this\.movePageTitle\s*\(\s*\)/i.test(styleJs)
    || /movePageTitle\s*:\s*function/i.test(styleJs)
    || /prepend\s*\(\s*\$title\s*\)/i.test(styleJs);
}

function applyThemeDomFixes(styleJsText) {
  if (!styleMovesPageTitle(styleJsText)) return;

  const header = document.querySelector(".main-header .page-header");
  const title = header?.querySelector(".page-title");
  let content = document.querySelector(".page-content");
  if (!content) content = document.querySelector(".content, main .content");
  if (!content) content = document.querySelector("#main, #content");
  if (!content && header) {
    let next = header.nextElementSibling;
    while (next && /^header$/i.test(next.tagName)) next = next.nextElementSibling;
    if (next) content = next;
  }
  if (!content && header) content = header.parentElement;

  if (header && title && content && !content.contains(title)) {
    content.prepend(title);
  }
}

function previewPayload(rawPayload) {
  const payload = rawPayload && typeof rawPayload === "object" ? rawPayload : {};
  return {
    cssText: String(payload.cssText || ""),
    styleJsText: String(payload.styleJsText || ""),
    layoutMode: String(payload.layoutMode || "modern"),
    legacyImport: Boolean(payload.legacyImport),
    preview: { ...PREVIEW_DEFAULTS, ...(payload.preview || {}) },
    iconUrls: payload.iconUrls && typeof payload.iconUrls === "object" ? payload.iconUrls : {},
    screenshotUrl: String(payload.screenshotUrl || ""),
    packageTitle: String(payload.packageTitle || "Curso de ejemplo"),
    pageTitle: String(payload.pageTitle || "Introducción")
  };
}

function buildModernPages(payload) {
  const p = payload.preview;
  const boxToggleClass = p.collapseIdevices ? "box-toggle" : "box-toggle box-toggle-on";
  const infoIcon = iconMarkup(payload.iconUrls.info, "icono info");
  const objectivesIcon = iconMarkup(payload.iconUrls.objectives, "icono objetivos");
  const activityIcon = iconMarkup(payload.iconUrls.activity, "icono actividad");
  const introTitle = String(payload.pageTitle || "Introducción");

  return [
    {
      title: introTitle,
      linkClass: "main-node daddy",
      content: `
        <article class="box" id="id1">
          <header class="box-head${infoIcon.hasIcon ? "" : " no-icon"}">
            ${infoIcon.html}
            <h1 class="box-title">Presentación del curso</h1>
            <button class="${boxToggleClass}" title="Ocultar/Mostrar contenido"><span>Ocultar/Mostrar contenido</span></button>
          </header>
          <div class="box-content">
            <p>Bienvenido al recurso. Esta página resume el itinerario y la metodología de trabajo.</p>
            <p>Dispones de contenidos teóricos, actividades de aplicación y una evaluación final.</p>
            <ul>
              <li>Objetivos de aprendizaje claros por unidad.</li>
              <li>Prácticas guiadas con retroalimentación.</li>
              <li>Material de ampliación para profundizar.</li>
            </ul>
            <table border="1" cellpadding="6">
              <tr><th>Unidad</th><th>Duración</th></tr>
              <tr><td>Unidad 1</td><td>2 sesiones</td></tr>
              <tr><td>Unidad 2</td><td>3 sesiones</td></tr>
              <tr><td>Evaluación</td><td>1 sesión</td></tr>
            </table>
            <p><a href="#">Descargar guía de estudio</a></p>
          </div>
        </article>
        <article class="box" id="id1b">
          <header class="box-head${activityIcon.hasIcon ? "" : " no-icon"}">
            ${activityIcon.html}
            <h1 class="box-title">Actividad inicial</h1>
            <button class="${boxToggleClass}" title="Ocultar/Mostrar contenido"><span>Ocultar/Mostrar contenido</span></button>
          </header>
          <div class="box-content">
            <p>Antes de comenzar, responde brevemente:</p>
            <ol>
              <li>¿Qué conocimientos previos tienes sobre el tema?</li>
              <li>¿Qué objetivo personal te marcas para este recurso?</li>
            </ol>
            <p><button type="button">Guardar respuestas</button></p>
          </div>
        </article>
      `
    },
    {
      title: "Tema 1: Células",
      linkClass: "daddy",
      content: `
        <article class="box" id="id2">
          <header class="box-head${objectivesIcon.hasIcon ? "" : " no-icon"}">
            ${objectivesIcon.html}
            <h1 class="box-title">Conceptos clave</h1>
            <button class="${boxToggleClass}" title="Ocultar/Mostrar contenido"><span>Ocultar/Mostrar contenido</span></button>
          </header>
          <div class="box-content">
            <p>La célula es la unidad estructural y funcional básica de los seres vivos.</p>
            <ul>
              <li>Membrana plasmática.</li>
              <li>Citoplasma y orgánulos.</li>
              <li>Núcleo y material genético.</li>
            </ul>
            <p>Compara célula procariota y eucariota en la siguiente tabla:</p>
            <table border="1" cellpadding="6">
              <tr><th>Característica</th><th>Procariota</th><th>Eucariota</th></tr>
              <tr><td>Núcleo</td><td>No</td><td>Sí</td></tr>
              <tr><td>Tamaño</td><td>Pequeño</td><td>Mayor</td></tr>
              <tr><td>Orgánulos membranosos</td><td>No</td><td>Sí</td></tr>
            </table>
          </div>
        </article>
        <article class="box" id="id2b">
          <header class="box-head${activityIcon.hasIcon ? "" : " no-icon"}">
            ${activityIcon.html}
            <h1 class="box-title">Actividad práctica</h1>
            <button class="${boxToggleClass}" title="Ocultar/Mostrar contenido"><span>Ocultar/Mostrar contenido</span></button>
          </header>
          <div class="box-content">
            <p>Identifica en el esquema las partes de una célula eucariota.</p>
            <p><button type="button">Comprobar respuesta</button></p>
          </div>
        </article>
      `
    },
    {
      title: "Tema 2: Genética",
      linkClass: "daddy",
      content: `
        <article class="box" id="id3">
          <header class="box-head${activityIcon.hasIcon ? "" : " no-icon"}">
            ${activityIcon.html}
            <h1 class="box-title">ADN y herencia</h1>
            <button class="${boxToggleClass}" title="Ocultar/Mostrar contenido"><span>Ocultar/Mostrar contenido</span></button>
          </header>
          <div class="box-content">
            <p>El ADN contiene la información hereditaria y se organiza en genes.</p>
            <p>Relaciona cada término con su definición:</p>
            <ul>
              <li><strong>Gen:</strong> unidad de información hereditaria.</li>
              <li><strong>Alelo:</strong> variante de un mismo gen.</li>
              <li><strong>Genotipo:</strong> conjunto de alelos de un individuo.</li>
            </ul>
            <p>Secuencia de ejemplo: <code>ATG-CCT-TAA</code></p>
          </div>
        </article>
        <article class="box" id="id3b">
          <header class="box-head${objectivesIcon.hasIcon ? "" : " no-icon"}">
            ${objectivesIcon.html}
            <h1 class="box-title">Cuestionario rápido</h1>
            <button class="${boxToggleClass}" title="Ocultar/Mostrar contenido"><span>Ocultar/Mostrar contenido</span></button>
          </header>
          <div class="box-content">
            <p>¿Qué molécula almacena la información genética?</p>
            <ul>
              <li><label><input type="radio" name="q-genetica" /> ARN</label></li>
              <li><label><input type="radio" name="q-genetica" /> ADN</label></li>
              <li><label><input type="radio" name="q-genetica" /> Proteína</label></li>
            </ul>
            <p><button type="button">Enviar</button></p>
          </div>
        </article>
      `
    },
    {
      title: "Evaluación",
      linkClass: "no-ch",
      content: `
        <article class="box" id="id4">
          <header class="box-head${infoIcon.hasIcon ? "" : " no-icon"}">
            ${infoIcon.html}
            <h1 class="box-title">Evaluación final</h1>
            <button class="${boxToggleClass}" title="Ocultar/Mostrar contenido"><span>Ocultar/Mostrar contenido</span></button>
          </header>
          <div class="box-content">
            <p>Responde a las preguntas para comprobar tu progreso:</p>
            <ol>
              <li>Define célula y explica dos funciones.</li>
              <li>Diferencia gen y alelo con un ejemplo.</li>
              <li>Indica una aplicación actual de la genética.</li>
            </ol>
            <p><button type="button">Enviar evaluación</button></p>
          </div>
        </article>
        ${payload.screenshotUrl ? `<article class="box"><header class="box-head"><h1 class="box-title">Miniatura del estilo</h1></header><div class="box-content"><img src="${escapeHtml(payload.screenshotUrl)}" alt="screenshot" style="max-width:100%;height:auto" /></div></article>` : ""}
      `
    }
  ];
}

function extractBackgroundImageUrl(backgroundImage) {
  const raw = String(backgroundImage || "").trim();
  if (!raw || raw === "none") return "";
  const start = raw.indexOf("url(");
  if (start < 0) return "";
  const end = raw.indexOf(")", start + 4);
  if (end < 0) return "";
  return raw
    .slice(start + 4, end)
    .trim()
    .replace(/^["']|["']$/g, "");
}

function getImageInfo(url) {
  if (!url) return Promise.resolve(null);
  if (toggleBgImageInfoCache.has(url)) return Promise.resolve(toggleBgImageInfoCache.get(url));

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const info = { ok: true, width: img.naturalWidth || 0, height: img.naturalHeight || 0 };
      toggleBgImageInfoCache.set(url, info);
      resolve(info);
    };
    img.onerror = () => {
      const info = { ok: false, width: 0, height: 0 };
      toggleBgImageInfoCache.set(url, info);
      resolve(info);
    };
    img.src = url;
  });
}

function hasDefaultTopLeftPosition(backgroundPosition) {
  const pos = String(backgroundPosition || "").trim().toLowerCase().replace(/\s+/g, " ");
  return pos === "0% 0%" || pos === "0px 0px" || pos === "left top";
}

async function shouldUseBackgroundFallback(element) {
  if (!element) return false;
  const style = window.getComputedStyle(element);
  const bgImage = String(style.backgroundImage || "").trim();
  if (!bgImage || bgImage === "none") return true;

  const url = extractBackgroundImageUrl(bgImage);
  if (!url) return false;

  const info = await getImageInfo(url);
  if (!info || !info.ok) return true;

  const bgSize = String(style.backgroundSize || "").trim().toLowerCase();
  const hasExplicitBgSize = bgSize && bgSize !== "auto" && bgSize !== "auto auto";
  if (hasExplicitBgSize) return false;

  const width = Math.max(element.clientWidth, Math.round(parseFloat(style.width) || 0), 16);
  const height = Math.max(element.clientHeight, Math.round(parseFloat(style.height) || 0), 16);
  const looksLikeSprite = info.width >= width * 3 || info.height >= height * 3;
  const defaultPosition = hasDefaultTopLeftPosition(style.backgroundPosition);
  return looksLikeSprite && defaultPosition;
}

async function applyToggleFallbackIcons(scope = document) {
  const toggles = scope.querySelectorAll(".box-toggle");
  await Promise.all(Array.from(toggles).map(async (toggle) => {
    const useFallback = await shouldUseBackgroundFallback(toggle);
    toggle.classList.toggle("preview-toggle-fallback", useFallback);
  }));
}

async function applyHeaderToggleFallbackIcons(scope = document) {
  const entries = [
    { id: "siteNavToggler", roleClass: "preview-header-toggle-menu" },
    { id: "searchBarTogger", roleClass: "preview-header-toggle-search" }
  ];
  await Promise.all(entries.map(async ({ id, roleClass }) => {
    const button = scope.getElementById ? scope.getElementById(id) : document.getElementById(id);
    if (!button) return;
    button.classList.remove("preview-header-toggle-menu", "preview-header-toggle-search");
    const useFallback = await shouldUseBackgroundFallback(button);
    button.classList.toggle("preview-header-toggle-fallback", useFallback);
    if (useFallback) button.classList.add(roleClass);
  }));
}

function bindBoxToggles(scope = document) {
  const buttons = scope.querySelectorAll(".box-toggle");
  buttons.forEach((btn) => {
    if (!(btn instanceof HTMLButtonElement)) return;
    if (btn.dataset.previewBound === "1") return;
    btn.dataset.previewBound = "1";
    btn.addEventListener("click", () => {
      const box = btn.closest(".box");
      const content = box?.querySelector(".box-content");
      if (!box || !content) return;
      const isMinimized = box.classList.toggle("minimized");
      if (isMinimized) {
        content.style.display = "none";
        btn.classList.remove("box-toggle-on");
      } else {
        content.style.display = "";
        btn.classList.add("box-toggle-on");
      }
      void applyToggleFallbackIcons(scope);
    });
  });
  void applyToggleFallbackIcons(scope);
}

function applyModernInteractivity(payload) {
  const pages = buildModernPages(payload);
  if (!pages.length) return;

  const navLinks = Array.from(document.querySelectorAll("#siteNav a[data-preview-page]"));
  const content = document.getElementById(`page-content-${PREVIEW_PAGE_ID}`);
  const title = document.querySelector(".page-title");
  const counterCurrent = Array.from(document.querySelectorAll(".page-counter-current-page"));
  const counterTotal = Array.from(document.querySelectorAll(".page-counter-total"));
  const prev = Array.from(
    new Set([
      ...Array.from(document.querySelectorAll("[data-preview-nav=\"prev\"]")),
      document.getElementById("previewNavPrev")
    ].filter(Boolean))
  );
  const next = Array.from(
    new Set([
      ...Array.from(document.querySelectorAll("[data-preview-nav=\"next\"]")),
      document.getElementById("previewNavNext")
    ].filter(Boolean))
  );
  const navToggler = document.getElementById("siteNavToggler") || document.getElementById("toggle-nav");
  const searchToggler = document.getElementById("searchBarTogger");
  const searchBar = document.getElementById("exe-client-search");
  const searchForm = document.getElementById("exe-client-search-form");
  const searchReset = document.getElementById("exe-client-search-reset");

  counterTotal.forEach((el) => {
    el.textContent = String(pages.length);
  });

  const renderPage = (index) => {
    const safeIndex = Math.max(0, Math.min(index, pages.length - 1));
    modernPageIndex = safeIndex;
    const page = pages[safeIndex];

    if (title && payload.preview.showPageTitle) {
      title.textContent = page.title;
    }
    counterCurrent.forEach((el) => {
      el.textContent = String(safeIndex + 1);
    });
    if (content) {
      content.innerHTML = page.content;
      bindBoxToggles(content);
    }

    navLinks.forEach((a, idx) => {
      const active = idx === safeIndex;
      a.classList.toggle("active", active);
      a.parentElement?.classList.toggle("active", active);
    });

    prev.forEach((el) => {
      el.style.display = safeIndex === 0 ? "none" : "";
    });
    next.forEach((el) => {
      el.style.display = safeIndex >= pages.length - 1 ? "none" : "";
    });
  };

  navLinks.forEach((a) => {
    a.addEventListener("click", (ev) => {
      ev.preventDefault();
      const idx = Number.parseInt(a.dataset.previewPage || "0", 10);
      renderPage(Number.isFinite(idx) ? idx : 0);
    });
  });

  prev.forEach((el) => {
    el.addEventListener("click", (ev) => {
      ev.preventDefault();
      renderPage(modernPageIndex - 1);
    });
  });
  next.forEach((el) => {
    el.addEventListener("click", (ev) => {
      ev.preventDefault();
      renderPage(modernPageIndex + 1);
    });
  });
  if (navToggler) {
    navToggler.addEventListener("click", () => {
      document.body.classList.toggle("siteNav-off");
    });
  }
  if (searchToggler && searchBar) {
    searchToggler.addEventListener("click", () => {
      const isHidden = window.getComputedStyle(searchBar).display === "none";
      searchBar.style.display = isHidden ? "block" : "none";
      if (isHidden) {
        const input = document.getElementById("exe-client-search-text");
        if (input instanceof HTMLInputElement) input.focus();
      }
    });
  }
  if (searchForm) {
    searchForm.addEventListener("submit", (ev) => ev.preventDefault());
  }
  if (searchReset && searchBar) {
    searchReset.addEventListener("click", (ev) => {
      ev.preventDefault();
      searchBar.style.display = "none";
      const input = document.getElementById("exe-client-search-text");
      if (input instanceof HTMLInputElement) input.value = "";
    });
  }

  void applyHeaderToggleFallbackIcons(document);
  renderPage(modernPageIndex);
}

function previewMarkupModern(payload) {
  const p = payload.preview;
  const pages = buildModernPages(payload);
  const bodyClasses = ["exe-export", "exe-web-site", "js", "preview-sim"];
  if (p.navCollapsed) bodyClasses.push("siteNav-off");
  if (p.showSearch) bodyClasses.push("exe-search-on");
  if (p.collapseIdevices) bodyClasses.push("preview-boxes-collapsed");
  if (payload.legacyImport) bodyClasses.push("legacy-import-preview");

  const searchHtml = p.showSearch ? `
      <div id="exe-client-search" data-block-order-string="Caja %e" data-no-results-string="Sin resultados.">
        <form id="exe-client-search-form" action="#" method="GET">
          <p>
            <label for="exe-client-search-text" class="sr-av">Buscar</label>
            <input id="exe-client-search-text" type="text" placeholder="Buscar en este recurso" />
            <input id="exe-client-search-submit" type="submit" value="Buscar" />
            <a id="exe-client-search-reset" href="#main" title="Ocultar"><span>Ocultar</span></a>
          </p>
        </form>
        <div id="exe-client-search-results"><div id="exe-client-search-results-list"></div></div>
      </div>` : "";
  const pageCounterHtml = p.showPageCounter
    ? `<p class="page-counter"><span class="page-counter-label">Página </span><span class="page-counter-content"><strong class="page-counter-current-page">1</strong><span class="page-counter-sep">/</span><strong class="page-counter-total">${pages.length}</strong></span></p>`
    : "";
  const navLinksHtml = pages
    .map((page, index) => `<li${index === 0 ? " class=\"active\"" : ""}><a class="${index === 0 ? "active " : ""}${page.linkClass}" href="#" data-preview-page="${index}">${escapeHtml(page.title)}</a></li>`)
    .join("");

  if (payload.legacyImport) {
    const legacyTopHeaderHtml = p.showPackageTitle
      ? `<header id="header" class="main-header package-header"><h1 id="headerContent" class="package-title">${escapeHtml(payload.packageTitle)}</h1></header>`
      : "<div id=\"emptyHeader\" class=\"main-header package-header\"></div>";
    const legacyControlsHtml = `
      <div class="legacy-preview-controls">
        ${searchHtml}
        ${pageCounterHtml}
        ${p.showNavButtons ? "<div class=\"legacy-nav-buttons preview-nav-buttons\"><a href=\"#\" data-preview-nav=\"prev\" title=\"Anterior\" class=\"preview-nav-btn preview-nav-btn-prev\"><span>Anterior</span></a><a href=\"#\" data-preview-nav=\"next\" title=\"Siguiente\" class=\"preview-nav-btn preview-nav-btn-next\"><span>Siguiente</span></a></div>" : ""}
      </div>`;
    const html = `
  <div id="content" class="exe-content exe-export">
    ${legacyTopHeaderHtml}
    <button type="button" id="siteNavToggler" class="toggler" title="Menú"><span class="sr-av">Menú</span></button>
    <button type="button" id="searchBarTogger" class="toggler" title="Buscar"><span class="sr-av">Buscar</span></button>
    ${p.navCollapsed ? "" : `
    <nav id="siteNav" aria-label="Navegación">
      <ul>
        ${navLinksHtml}
      </ul>
    </nav>`}

    <main id="${PREVIEW_PAGE_ID}" class="page">
      <div id="main-wrapper"><div id="main">
        ${legacyControlsHtml}
        ${p.showPageTitle ? `<div class="page-header"><h2 class="page-title">${escapeHtml(pages[0]?.title || payload.pageTitle)}</h2></div>` : ""}
        <div id="page-content-${PREVIEW_PAGE_ID}" class="page-content">
          ${pages[0]?.content || ""}
        </div>
      </div></div>
    </main>

    <footer id="siteFooter"><div id="siteFooterContent">Pie de página simulado</div></footer>
  </div>`;
    return { html, bodyClasses };
  }

  const headerHtml = `
      <header id="header-${PREVIEW_PAGE_ID}" class="main-header">
        ${pageCounterHtml}
        ${p.showPackageTitle ? `<div class="package-header"><h1 class="package-title">${escapeHtml(payload.packageTitle)}</h1></div>` : ""}
        ${p.showPageTitle ? `<div class="page-header"><h2 class="page-title">${escapeHtml(pages[0]?.title || payload.pageTitle)}</h2></div>` : ""}
      </header>`;

  const html = `
  <div class="exe-content exe-export">
    <button type="button" id="siteNavToggler" class="toggler" title="Menú"><span class="sr-av">Menú</span></button>
    <button type="button" id="searchBarTogger" class="toggler" title="Buscar"><span class="sr-av">Buscar</span></button>
    <nav id="siteNav" aria-label="Navegación">
      <ul>
        ${navLinksHtml}
      </ul>
    </nav>

    <main id="${PREVIEW_PAGE_ID}" class="page">
      ${searchHtml}${headerHtml}

      <div id="page-content-${PREVIEW_PAGE_ID}" class="page-content">
        ${pages[0]?.content || ""}
      </div>
    </main>

    ${p.showNavButtons ? "<div class=\"nav-buttons\"><a href=\"#\" id=\"previewNavPrev\" data-preview-nav=\"prev\" title=\"Anterior\" class=\"nav-button nav-button-left\"><span>Anterior</span></a><a href=\"#\" id=\"previewNavNext\" data-preview-nav=\"next\" title=\"Siguiente\" class=\"nav-button nav-button-right\"><span>Siguiente</span></a></div>" : ""}
    <footer id="siteFooter"><div id="siteFooterContent">Pie de página simulado</div></footer>
  </div>`;

  return { html, bodyClasses };
}

function legacyCounterMarkup(showPageCounter) {
  if (!showPageCounter) return "";
  return "<p class=\"page-counter\">Página <strong class=\"page-counter-current-page\">1</strong>/<strong class=\"page-counter-total\">20</strong></p>";
}

function legacyPaginationMarkup(preview) {
  if (!preview.showNavButtons && !preview.showPageCounter) return "";
  return `
  <div class="pagination">
    ${legacyCounterMarkup(preview.showPageCounter)}
    ${preview.showNavButtons ? "<span class=\"next\"><a href=\"#\" title=\"Siguiente\">Siguiente »</a></span>" : ""}
  </div>`;
}

function previewMarkupLegacy(payload) {
  const p = payload.preview;
  const bodyClasses = ["exe-export", "exe-web-site", "js", "preview-sim", "legacy-preview"];
  if (p.navCollapsed) bodyClasses.push("no-nav");
  if (p.collapseIdevices) bodyClasses.push("preview-boxes-collapsed");

  const packageTitle = p.showPackageTitle ? escapeHtml(payload.packageTitle) : "";
  const pageTitle = p.showPageTitle ? escapeHtml(payload.pageTitle) : "";
  const ideviceHiddenClass = p.collapseIdevices ? " hidden-idevice" : "";
  const ideviceToggleClass = p.collapseIdevices ? "toggle-idevice toggle-em1" : "toggle-idevice";
  const ideviceToggleLinkClass = p.collapseIdevices ? "show-idevice" : "";

  const html = `
  <div id="content" class="exe-content legacy-content">
    ${p.showNavButtons || p.showPageCounter ? `<div id="topPagination">${legacyPaginationMarkup(p)}</div>` : ""}
    ${p.showPackageTitle ? `<div id="header"><h1 id="headerContent" class="package-title">${packageTitle}</h1></div>` : "<div id=\"emptyHeader\"></div>"}
    ${p.navCollapsed ? "" : `
    <div id="siteNav" aria-label="Navegación">
      <ul>
        <li><a class="active main-node" href="#">Inicio</a></li>
        <li><a href="#">Tema</a></li>
      </ul>
    </div>`}
    <p id="header-options">
      <a href="#" id="toggle-nav" title="Menú"><span>Menú</span></a>
    </p>
    <div id="main-wrapper">
      <div id="main" class="page-content">
        ${p.showSearch ? "<form id=\"exe-client-search-form\" action=\"#\"><input id=\"exe-client-search-text\" type=\"search\" placeholder=\"Buscar en este recurso\" /><input id=\"exe-client-search-submit\" type=\"submit\" value=\"Buscar\" /></form>" : ""}
        ${p.showPageTitle ? `<div id="nodeDecoration"><h2 id="nodeTitle" class="page-title">${pageTitle}</h2></div>` : ""}
        <p>Contenido de ejemplo de la página.</p>
        <div id="packageLicense" class="cc cc-by-sa">
          <p>Obra publicada con <a href="#">Licencia Creative Commons Reconocimiento Compartir igual 4.0</a></p>
        </div>

      </div>
    </div>
    ${p.showNavButtons || p.showPageCounter ? `<div id="bottomPagination">${legacyPaginationMarkup(p)}</div>` : ""}
    <div id="siteFooter">Pie de página simulado</div>
    <div class="legacy-extra-sample">
      <div class="iDevice_wrapper activityIdevice em_iDevice em_iDevice_activity box" id="id1">
        <div class="iDevice emphasis0 box${ideviceHiddenClass}">
          <div class="iDevice_header box-head">
            <h2 class="iDeviceTitle box-title">Texto</h2>
            <p class="${ideviceToggleClass}"><a href="#" class="${ideviceToggleLinkClass}"><span>Ocultar/Mostrar contenido</span></a></p>
          </div>
          <div class="iDevice_content_wrapper box-content">
            <div class="iDevice_content">
              <div class="iDevice_inner">
                <p>Bloque iDevice de ejemplo para estilos legacy.</p>
                <ul><li>Elemento 1</li><li>Elemento 2</li></ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  `;

  return { html, bodyClasses };
}

function previewMarkup(payload) {
  if (payload.layoutMode === "legacy") return previewMarkupLegacy(payload);
  return previewMarkupModern(payload);
}

function render(rawPayload) {
  const payload = previewPayload(rawPayload);
  const themeStyle = document.getElementById("previewThemeStyle");
  const root = document.getElementById("previewRoot");
  if (!themeStyle || !root) return;

  themeStyle.textContent = payload.cssText;

  const { html, bodyClasses } = previewMarkup(payload);
  document.body.className = bodyClasses.join(" ");
  root.innerHTML = html;

  if (payload.layoutMode !== "legacy") {
    applyThemeDomFixes(payload.styleJsText);
    applyModernInteractivity(payload);
  } else {
    bindBoxToggles(root);
  }
}

document.addEventListener("click", (ev) => {
  const target = ev.target;
  if (!(target instanceof Element)) return;
  const link = target.closest("a[href]");
  if (!link) return;
  ev.preventDefault();
});

window.__previewRuntime = {
  render,
  isReady: () => true
};
