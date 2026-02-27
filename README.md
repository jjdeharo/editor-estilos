# Editor de estilos para eXeLearning

Editor web para crear, ajustar y exportar estilos (`.zip`) compatibles con eXeLearning.

Versión actual: `v 1.0.0-beta.3`

## Qué hace

- Carga estilos oficiales de eXe como base.
- Carga un estilo desde ZIP.
- Permite editar archivos del estilo (`style.css`, `config.xml`, imágenes, iconos, fuentes, etc.).
- Incluye ajustes rápidos seguros (colores, tipografía, menú, iDevices, botones).
- Permite añadir fuentes y logotipo institucional con controles básicos.
- Permite añadir/quitar imagen de fondo desde ajustes rápidos.
- Permite añadir/reemplazar iconos de iDevices en lote.
- Incluye ajustes avanzados de títulos (página, proyecto e iDevice) en la UI.
- Actualiza `screenshot.png` automáticamente al exportar (si falla, conserva el existente).
- Exporta ZIP listo para importar en eXeLearning.
- Incluye aviso inicial de fase de pruebas (se muestra una sola vez y se recuerda).

## Flujo recomendado

1. En **Proyecto > Cargar plantilla**, carga un ZIP o elige una plantilla oficial.
2. Ajusta visualmente en **Ajustes** y/o edita archivos en **Archivos**.
3. Completa **Proyecto > Información y exportación**.
4. Si partiste de plantilla oficial, cambia al menos:
   - `Nombre`
   - `Título`
5. Exporta ZIP.

## Notas de compatibilidad

- La previsualización del editor es simulada: la validación final debe hacerse en eXeLearning.
- El editor intenta aplicar cambios automáticos de forma segura.
- Si `downloadable=0`, el estilo se puede editar aquí, pero no será importable desde la interfaz de eXe.
- Los enlaces dentro de la previsualización están desactivados para evitar navegación accidental.

## Modo seguro (automático)

- Los ajustes rápidos se aplican en un bloque controlado: `quick-overrides`.
- El editor sanea automáticamente selectores inseguros heredados dentro de ese bloque.
- El usuario avanzado puede seguir haciendo cambios manuales en `style.css` desde la pestaña **Archivos**.

## Estructura mínima esperada del estilo

- `config.xml`
- `style.css`
- `style.js`
- `screenshot.png`

## Ejecutar en local

Abre `index.html` con un servidor estático (recomendado) para evitar problemas de carga de archivos locales.

Ejemplo:

```bash
cd /ruta/al/proyecto
python3 -m http.server 8000
```

Luego abre `http://localhost:8000`.

## Autoría y licencia

- (c) [Juan José de Haro](https://bilateria.org)
- Licencia: AGPLv3
