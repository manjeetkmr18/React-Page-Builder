export const EDITOR_CSS = `
.rpb-root{display:flex;flex-direction:column;font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;font-size:13px;color:#1e293b;background:#eef1f5;overflow:hidden;border:1px solid #d8dee6}
.rpb-root *,.rpb-root *::before,.rpb-root *::after{box-sizing:border-box}

/* Toolbar */
.rpb-toolbar{display:flex;align-items:center;gap:12px;padding:8px 14px;background:#ffffff;border-bottom:1px solid #d8dee6;flex-shrink:0}
.rpb-brand{font-weight:700;letter-spacing:.02em;margin-right:8px;color:#0f172a}
.rpb-toolbar-group{display:flex;gap:6px}
.rpb-toolbar-spacer{flex:1}
.rpb-btn{appearance:none;border:1px solid #cbd5e1;background:#fff;border-radius:6px;padding:6px 12px;font-size:12.5px;font-weight:500;color:#334155;cursor:pointer;transition:background .12s,border-color .12s}
.rpb-btn:hover{background:#f1f5f9;border-color:#94a3b8}
.rpb-btn:disabled{opacity:.6;cursor:not-allowed}
.rpb-btn:disabled:hover{background:inherit;border-color:#cbd5e1}
.rpb-btn-active{background:#eff6ff;border-color:#2563eb;color:#1d4ed8}
.rpb-btn-primary{background:#2563eb;border-color:#2563eb;color:#fff}
.rpb-btn-primary:hover{background:#1d4ed8}
.rpb-btn-danger{color:#b91c1c;border-color:#fecaca}
.rpb-btn-danger:hover{background:#fef2f2;border-color:#f87171}
.rpb-save-status{font-size:12px;color:#64748b}
.rpb-save-status-saved{color:#15803d}
.rpb-save-status-error{color:#b91c1c}

/* Layout */
.rpb-body{display:flex;flex:1;min-height:0}
.rpb-loading{align-items:center;justify-content:center}
.rpb-loading-message{color:#64748b;font-size:14px}
.rpb-palette,.rpb-inspector{width:250px;flex-shrink:0;background:#ffffff;overflow-y:auto;padding:14px}
.rpb-palette{border-right:1px solid #d8dee6}
.rpb-inspector{border-left:1px solid #d8dee6}
.rpb-panel-title{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#64748b;margin-bottom:12px}
.rpb-category{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8;margin:14px 0 8px}
.rpb-palette-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.rpb-palette-item{display:flex;flex-direction:column;align-items:center;gap:6px;padding:12px 6px;border:1px solid #e2e8f0;border-radius:8px;background:#fbfcfe;cursor:grab;text-align:center;font-size:12px;color:#334155;transition:border-color .12s,box-shadow .12s}
.rpb-palette-item:hover{border-color:#2563eb;box-shadow:0 1px 4px rgba(37,99,235,.15)}
.rpb-palette-item:active{cursor:grabbing}
.rpb-palette-icon{font-size:17px;line-height:1}

/* Canvas */
.rpb-canvas{flex:1;overflow-y:auto;padding:28px}
.rpb-canvas-preview{padding:0}
.rpb-page{background:#fff;min-height:100%;box-shadow:0 1px 8px rgba(15,23,42,.09);border-radius:4px;overflow:hidden}
.rpb-canvas-preview .rpb-page{border-radius:0;box-shadow:none}
.rpb-empty{padding:80px 24px;text-align:center;color:#94a3b8;font-size:14px}

/* Nodes */
.rpb-node{position:relative;outline:1px dashed transparent;outline-offset:-1px;transition:outline-color .12s;cursor:pointer}
.rpb-node:hover{outline-color:#93c5fd}
.rpb-node-selected{outline:2px solid #2563eb !important;outline-offset:-2px}
.rpb-node-label{display:none;position:absolute;top:0;left:0;z-index:5;background:#2563eb;color:#fff;font-size:10px;font-weight:600;padding:2px 7px;border-radius:0 0 6px 0;letter-spacing:.03em;pointer-events:none}
.rpb-node-selected>.rpb-node-label,.rpb-node:hover>.rpb-node-label{display:block}
.rpb-node-container{min-height:36px}
.rpb-container-hint{padding:18px;text-align:center;color:#94a3b8;font-size:12px;border:1px dashed #cbd5e1;border-radius:6px;margin:6px}
.rpb-unknown{padding:12px;background:#fef2f2;color:#b91c1c;font-size:12px;border:1px dashed #fca5a5}

/* Drop zones */
.rpb-dropzone-collapsed{height:0}
.rpb-dropzone{height:14px;margin:1px 0;border-radius:4px;background:rgba(37,99,235,.07);outline:1px dashed rgba(37,99,235,.35);outline-offset:-1px;transition:height .1s,background .1s}
.rpb-dropzone-over{height:30px;background:rgba(37,99,235,.18);outline:2px solid #2563eb}

/* Inspector */
.rpb-inspector-empty{color:#94a3b8;font-size:12.5px;padding:12px 0;line-height:1.6}
.rpb-inspector-actions{display:flex;gap:6px;margin-bottom:14px}
.rpb-field{margin-bottom:13px}
.rpb-field-label{display:block;font-size:11.5px;font-weight:600;color:#475569;margin-bottom:5px}
.rpb-field-help{margin-top:5px;color:#94a3b8;font-size:11.5px;line-height:1.45}
.rpb-field-error{margin-top:5px;color:#b91c1c;font-size:11.5px;line-height:1.45}
.rpb-input{width:100%;border:1px solid #cbd5e1;border-radius:6px;padding:7px 9px;font-size:12.5px;color:#1e293b;background:#fff;font-family:inherit}
.rpb-input:focus{outline:2px solid #bfdbfe;border-color:#2563eb}
.rpb-textarea{resize:vertical;line-height:1.5}
.rpb-range-row{display:flex;align-items:center;gap:10px}
.rpb-range-row input[type=range]{flex:1;accent-color:#2563eb}
.rpb-range-value{font-size:12px;color:#475569;min-width:32px;text-align:right;font-variant-numeric:tabular-nums}
.rpb-color-row{display:flex;align-items:center;gap:8px}
.rpb-color-row input[type=color]{width:34px;height:32px;padding:2px;border:1px solid #cbd5e1;border-radius:6px;background:#fff;cursor:pointer;flex-shrink:0}
.rpb-switch{display:flex;align-items:center;gap:8px;font-size:12.5px;color:#334155;cursor:pointer}
.rpb-switch input{accent-color:#2563eb;width:16px;height:16px}
.rpb-image-field{display:flex;flex-direction:column;gap:8px}
.rpb-media-actions{display:flex;gap:6px}
.rpb-image-preview{width:100%;max-height:140px;object-fit:cover;border:1px solid #e2e8f0;border-radius:6px;background:#f8fafc}
`;
