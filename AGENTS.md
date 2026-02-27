# AGENTS.md

## Contexto del proyecto
Editor web local para crear, previsualizar y exportar estilos de eXeLearning.
Prioridad acordada: **compatibilidad real con eXeLearning** y cambios automáticos seguros para usuarios no técnicos.

## Estado actual
- App estática: `index.html`, `app/main.js`, `app/styles.css`.
- ZIP en cliente con `vendor/jszip.min.js`.
- Carga inicial automática del estilo oficial `base`.
- Previsualización simulada fija en panel derecho (enlaces inactivos para evitar navegación accidental).

## Estructura relevante
- `index.html`: interfaz y controles.
- `app/main.js`: lógica de carga, edición, sanitización, validación y exportación.
- `app/styles.css`: estilos de la interfaz del editor.
- `app/official-styles.json`: catálogo de plantillas oficiales (`base`, `flux`, `neo`, `nova`, `universal`, `zen`).
- `reference/development/styles.md`: referencia de campos y empaquetado de estilos eXe.
- `reference/themes/official/`: copia de estilos oficiales para comparación y pruebas.
- Repo local de eXeLearning ya disponible para consulta (no clonar de nuevo): `/home/jjdeharo/Documentos/github/exelearning/`.

## Funcionalidades implementadas
- Carga de plantilla oficial y carga de ZIP.
- Edición de archivos (texto e imágenes) desde pestaña **Archivos**.
- Reemplazo de iconos/imágenes y añadido de fuentes.
- Ajustes rápidos (colores, tipografía, menú, iDevices, botones).
- Ajustes avanzados de títulos (página, curso e iDevice) desde la UI.
- Carga y retirada de imagen de fondo desde ajustes rápidos.
- Carga de iconos de iDevices en lote (con reemplazo por nombre base).
- Logotipo institucional (subida, tamaño, posición y márgenes).
- Autocreación de obligatorios faltantes (`style.js`, `screenshot.png`) para evitar bloqueos por ZIP incompletos.
- Intento de actualización automática de `screenshot.png` al exportar desde la previsualización (con fallback seguro).
- Metadatos completos de `config.xml`:
  - `name`, `title`, `version`, `compatibility`, `author`, `license`, `license-url`, `description`, `downloadable`.
- Exportación ZIP con validación automática.

## Reglas de compatibilidad y seguridad
- Los ajustes rápidos escriben solo dentro del bloque `quick-overrides`.
- Sanitización automática de selectores inseguros en `quick-overrides`.
- Selectores protegidos para evitar efectos colaterales (`.box-toggle`, togglers, etc.).
- El editor no debe exigir conocimientos de CSS para resolver errores comunes: corrige automáticamente cuando es posible.

## Reglas de exportación
- Se bloquea exportación solo por incidencias críticas:
  - faltan archivos obligatorios no autocorregibles (`config.xml`, `style.css`), o
  - bloque `quick-overrides` inválido.
- Si el estilo parte de plantilla oficial, para exportar deben cambiarse **Nombre** y **Título** respecto al oficial.
- Si `downloadable=0`, se permite editar/exportar, pero se avisa de que no será importable desde la interfaz de eXe.

## UX/operación
- Aviso superior de “fase de pruebas” al iniciar; al cerrarlo no vuelve a mostrarse (persistencia en `localStorage`).
- Pie visible con autoría y licencia AGPLv3.

## Criterio de calidad
- Cambios automáticos del programa: siempre seguros.
- Evitar regresiones visuales en componentes internos de eXe.
- Mantener diferencia clara entre ajustes seguros (UI) y edición avanzada (Archivos).
