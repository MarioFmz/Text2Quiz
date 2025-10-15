# Public Assets

This folder contains static files that are served directly by Vite.

## pdf.worker.min.mjs

This is the PDF.js web worker file required for processing PDF documents in the browser.

- **Source**: Copied from `pdfjs-dist/build/pdf.worker.min.mjs`
- **Version**: Matches the version of `pdfjs-dist` in package.json
- **Purpose**: Handles PDF parsing in a separate thread to avoid blocking the main UI
- **Required**: Do not delete this file or PDF processing will fail

### Updating

When updating the `pdfjs-dist` package, also update this worker:

```bash
cp node_modules/pdfjs-dist/build/pdf.worker.min.mjs public/pdf.worker.min.mjs
```
