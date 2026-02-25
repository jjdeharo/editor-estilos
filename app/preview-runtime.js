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
    preview: { ...PREVIEW_DEFAULTS, ...(payload.preview || {}) },
    iconUrls: payload.iconUrls && typeof payload.iconUrls === "object" ? payload.iconUrls : {},
    screenshotUrl: String(payload.screenshotUrl || ""),
    packageTitle: String(payload.packageTitle || "Curso de ejemplo"),
    pageTitle: String(payload.pageTitle || "Introducción")
  };
}

function previewMarkup(payload) {
  const p = payload.preview;
  const bodyClasses = ["exe-export", "exe-web-site", "js", "preview-sim"];
  if (p.navCollapsed) bodyClasses.push("siteNav-off");
  if (p.showSearch) bodyClasses.push("exe-search-on");
  if (p.collapseIdevices) bodyClasses.push("preview-boxes-collapsed");

  const boxToggleClass = p.collapseIdevices ? "box-toggle" : "box-toggle box-toggle-on";
  const infoIcon = iconMarkup(payload.iconUrls.info, "icono info");
  const objectivesIcon = iconMarkup(payload.iconUrls.objectives, "icono objetivos");
  const activityIcon = iconMarkup(payload.iconUrls.activity, "icono actividad");

  const html = `
  <div class="exe-content exe-export">
    <button type="button" id="siteNavToggler" class="toggler" title="Menú"><span class="sr-av">Menú</span></button>
    <button type="button" id="searchBarTogger" class="toggler" title="Buscar"><span class="sr-av">Buscar</span></button>
    <nav id="siteNav" aria-label="Navegación">
      <ul>
        <li class="active"><a class="active main-node daddy" href="#">Introducción</a></li>
        <li><a class="daddy" href="#">Tema 1: Células</a></li>
        <li><a class="daddy" href="#">Tema 2: Genética</a></li>
        <li><a class="no-ch" href="#">Evaluación</a></li>
      </ul>
    </nav>

    <main id="${PREVIEW_PAGE_ID}" class="page">
      ${p.showSearch ? "<div id=\"exe-client-search\"><input id=\"exe-client-search-text\" type=\"search\" placeholder=\"Buscar en este recurso\" /></div>" : ""}
      <header id="header-${PREVIEW_PAGE_ID}" class="main-header">
        ${p.showPageCounter ? "<p class=\"page-counter\"><span class=\"page-counter-label\">Página </span><span class=\"page-counter-content\"><strong class=\"page-counter-current-page\">1</strong><span class=\"page-counter-sep\">/</span><strong class=\"page-counter-total\">20</strong></span></p>" : ""}
        ${p.showPackageTitle ? `<div class="package-header"><h1 class="package-title">${escapeHtml(payload.packageTitle)}</h1></div>` : ""}
        ${p.showPageTitle ? `<div class="page-header"><h2 class="page-title">${escapeHtml(payload.pageTitle)}</h2></div>` : ""}
      </header>

      <div id="page-content-${PREVIEW_PAGE_ID}" class="page-content">
        <article class="box" id="id1">
          <header class="box-head${infoIcon.hasIcon ? "" : " no-icon"}">
            ${infoIcon.html}
            <h1 class="box-title">Texto</h1>
            <button class="${boxToggleClass}" title="Ocultar/Mostrar contenido"><span>Ocultar/Mostrar contenido</span></button>
          </header>
          <div class="box-content">
            <p>Contenido con <a href="#">enlace de prueba</a>, listas y tabla.</p>
            <ul><li>Elemento 1</li><li>Elemento 2</li></ul>
            <table border="1" cellpadding="6"><tr><th>Campo</th><th>Valor</th></tr><tr><td>A</td><td>10</td></tr></table>
          </div>
        </article>

        <article class="box" id="id2">
          <header class="box-head${objectivesIcon.hasIcon ? "" : " no-icon"}">
            ${objectivesIcon.html}
            <h1 class="box-title">Objetivos</h1>
            <button class="${boxToggleClass}" title="Ocultar/Mostrar contenido"><span>Ocultar/Mostrar contenido</span></button>
          </header>
          <div class="box-content"><p>Objetivo 1. Objetivo 2. Objetivo 3.</p></div>
        </article>

        <article class="box" id="id3">
          <header class="box-head${activityIcon.hasIcon ? "" : " no-icon"}">
            ${activityIcon.html}
            <h1 class="box-title">Actividad</h1>
            <button class="${boxToggleClass}" title="Ocultar/Mostrar contenido"><span>Ocultar/Mostrar contenido</span></button>
          </header>
          <div class="box-content">
            <p>Enunciado de actividad con botón de ejemplo.</p>
            <p><button type="button">Comprobar</button></p>
          </div>
        </article>

        ${payload.screenshotUrl ? `<article class="box"><header class="box-head"><h1 class="box-title">Screenshot del tema</h1></header><div class="box-content"><img src="${escapeHtml(payload.screenshotUrl)}" alt="screenshot" style="max-width:100%;height:auto" /></div></article>` : ""}
      </div>
    </main>

    ${p.showNavButtons ? "<div class=\"nav-buttons\"><span class=\"nav-button nav-button-left\" aria-hidden=\"true\"><span>Anterior</span></span><a href=\"#\" title=\"Siguiente\" class=\"nav-button nav-button-right\"><span>Siguiente</span></a></div>" : ""}
    <footer id="siteFooter"><div id="siteFooterContent">Pie de página simulado</div></footer>
  </div>`;

  return { html, bodyClasses };
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

  applyThemeDomFixes(payload.styleJsText);
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
