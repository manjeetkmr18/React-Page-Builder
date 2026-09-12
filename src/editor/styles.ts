/**
 * All colors/spacing are CSS custom properties with sensible neutral
 * defaults, scoped to .rpb-root. To theme the editor, set these variables
 * on a wrapper element around <PageBuilder /> (or on .rpb-root itself via a
 * global stylesheet) — no !important overrides needed:
 *
 *   .my-dark-editor .rpb-root { --rpb-bg: #050505; --rpb-accent: #dc2626; ... }
 *
 * See the full variable list below for everything that can be customized.
 */
export const EDITOR_CSS = `
.rpb-root{
  --rpb-bg:#eef1f5;
  --rpb-panel-bg:#ffffff;
  --rpb-tint:#f7f8fa;
  --rpb-border:#d8dee6;
  --rpb-border-soft:#e2e8f0;
  --rpb-text:#1e293b;
  --rpb-text-muted:#64748b;
  --rpb-text-faint:#94a3b8;
  --rpb-accent:#2563eb;
  --rpb-accent-hover:#1d4ed8;
  --rpb-accent-soft:rgba(37,99,235,.12);
  --rpb-accent-contrast:#ffffff;
  --rpb-danger:#b91c1c;
  --rpb-danger-bg:#fef2f2;
  --rpb-danger-border:#fecaca;
  --rpb-success:#15803d;
  --rpb-warning:#b45309;
  --rpb-input-bg:#ffffff;
  --rpb-radius:8px;
  --rpb-font:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
  --rpb-font-mono:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;

  display:flex;flex-direction:column;font-family:var(--rpb-font);font-size:13px;
  color:var(--rpb-text);background:var(--rpb-bg);overflow:hidden;border:1px solid var(--rpb-border);
}
.rpb-root *,.rpb-root *::before,.rpb-root *::after{box-sizing:border-box}

/* Toolbar */
.rpb-toolbar{display:flex;align-items:center;gap:8px;padding:7px 12px;background:var(--rpb-panel-bg);border-bottom:1px solid var(--rpb-border);flex-shrink:0;flex-wrap:wrap}
.rpb-brand{font-weight:700;letter-spacing:-.01em;margin-right:4px;color:var(--rpb-text);display:flex;align-items:center;gap:6px;font-size:12.5px}
.rpb-toolbar-group{display:flex;align-items:center;gap:2px;background:var(--rpb-tint);border:1px solid var(--rpb-border);border-radius:8px;padding:2px}
.rpb-toolbar-spacer{flex:1}
.rpb-icon-btn{appearance:none;border:1px solid transparent;background:transparent;border-radius:6px;width:28px;height:28px;display:inline-flex;align-items:center;justify-content:center;color:var(--rpb-text-muted);cursor:pointer;transition:background .12s,color .12s}
.rpb-icon-btn:hover{background:var(--rpb-border-soft);color:var(--rpb-text)}
.rpb-icon-btn:disabled{opacity:.4;cursor:not-allowed;background:transparent}
.rpb-icon-btn-active{background:var(--rpb-accent-soft);color:var(--rpb-accent)}
.rpb-btn{appearance:none;border:1px solid var(--rpb-border);background:var(--rpb-panel-bg);border-radius:7px;padding:6px 12px;font-size:12.5px;font-weight:500;color:var(--rpb-text-muted);cursor:pointer;transition:background .12s,border-color .12s;display:inline-flex;align-items:center;gap:6px}
.rpb-btn:hover{background:var(--rpb-tint);border-color:var(--rpb-text-faint)}
.rpb-btn:disabled{opacity:.6;cursor:not-allowed}
.rpb-btn:disabled:hover{background:var(--rpb-panel-bg);border-color:var(--rpb-border)}
.rpb-btn-active{background:var(--rpb-accent-soft);border-color:var(--rpb-accent);color:var(--rpb-accent)}
.rpb-btn-primary{background:var(--rpb-accent);border-color:var(--rpb-accent);color:var(--rpb-accent-contrast)}
.rpb-btn-primary:hover{background:var(--rpb-accent-hover);border-color:var(--rpb-accent-hover)}
.rpb-btn-danger{color:var(--rpb-danger);border-color:var(--rpb-danger-border)}
.rpb-btn-danger:hover{background:var(--rpb-danger-bg);border-color:var(--rpb-danger)}
.rpb-save-status{font-size:11.5px;color:var(--rpb-text-faint);white-space:nowrap}
.rpb-save-status-saved{color:var(--rpb-success)}
.rpb-save-status-error{color:var(--rpb-danger)}

/* Breakpoint + zoom controls */
.rpb-breakpoints{display:flex;align-items:center;gap:1px}
.rpb-breakpoint-btn{appearance:none;border:none;background:transparent;border-radius:5px;padding:5px 8px;display:inline-flex;align-items:center;gap:5px;color:var(--rpb-text-muted);cursor:pointer;font-size:11px;font-weight:500}
.rpb-breakpoint-btn:hover{color:var(--rpb-text)}
.rpb-breakpoint-btn-active{background:var(--rpb-panel-bg);color:var(--rpb-accent);box-shadow:0 1px 2px rgba(0,0,0,.08)}
.rpb-zoom-select{appearance:none;border:none;background:transparent;color:var(--rpb-text-muted);font-size:11.5px;font-family:var(--rpb-font-mono);padding:5px 6px;border-radius:6px;cursor:pointer}
.rpb-zoom-select:hover{background:var(--rpb-border-soft);color:var(--rpb-text)}

/* Layout */
.rpb-body{display:flex;flex:1;min-height:0}
.rpb-loading{align-items:center;justify-content:center}
.rpb-loading-message{color:var(--rpb-text-muted);font-size:14px}

.rpb-side{display:flex;flex-direction:column;flex-shrink:0;background:var(--rpb-panel-bg);overflow:hidden;transition:width .16s ease;position:relative}
.rpb-side-left{border-right:1px solid var(--rpb-border);width:264px}
.rpb-side-right{border-left:1px solid var(--rpb-border);width:280px}
.rpb-side-collapsed.rpb-side-left{width:44px}
.rpb-side-collapsed.rpb-side-right{width:44px}
.rpb-side-header{display:flex;align-items:center;justify-content:space-between;padding:9px 12px;border-bottom:1px solid var(--rpb-border);flex-shrink:0;background:var(--rpb-tint)}
.rpb-side-collapsed .rpb-side-header{display:none}
.rpb-side-content{flex:1;overflow-y:auto;padding:12px;min-width:264px}
.rpb-side-collapsed .rpb-side-content{display:none}
.rpb-side-dock{display:flex;align-items:center;justify-content:space-around;border-top:1px solid var(--rpb-border);background:var(--rpb-tint);padding:5px;flex-shrink:0}
.rpb-side-collapsed .rpb-side-dock{flex-direction:column;gap:4px;border-top:none;padding:8px 0}
.rpb-collapse-rail{display:none}
.rpb-side-collapsed .rpb-collapse-rail{display:flex;flex-direction:column;align-items:center;gap:6px;padding-top:10px;flex:1}

/* Search */
.rpb-search{position:relative;margin-bottom:10px}
.rpb-search-icon{position:absolute;left:9px;top:50%;transform:translateY(-50%);color:var(--rpb-text-faint);pointer-events:none}
.rpb-search-input{width:100%;background:var(--rpb-tint);border:1px solid var(--rpb-border);border-radius:7px;padding:7px 9px 7px 28px;font-size:12px;color:var(--rpb-text);font-family:var(--rpb-font)}
.rpb-search-input:focus{outline:none;border-color:var(--rpb-accent);box-shadow:0 0 0 2px var(--rpb-accent-soft)}
.rpb-search-input::placeholder{color:var(--rpb-text-faint)}

/* Palette */
.rpb-panel-title{font-size:11.5px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--rpb-text);display:flex;align-items:center;gap:6px}
.rpb-category{margin-bottom:12px}
.rpb-category-header{display:flex;align-items:center;justify-content:space-between;width:100%;appearance:none;border:none;background:transparent;padding:4px 2px;cursor:pointer;font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--rpb-text-faint)}
.rpb-category-chevron{transition:transform .14s ease;flex-shrink:0}
.rpb-category-open .rpb-category-chevron{transform:rotate(90deg)}
.rpb-category-body{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px}
.rpb-palette-item{display:flex;flex-direction:column;align-items:center;gap:6px;padding:12px 6px;border:1px solid var(--rpb-border-soft);border-radius:9px;background:var(--rpb-tint);cursor:grab;text-align:center;font-size:11.5px;color:var(--rpb-text-muted);transition:border-color .12s,box-shadow .12s,color .12s}
.rpb-palette-item:hover{border-color:var(--rpb-accent);color:var(--rpb-text);box-shadow:0 1px 6px var(--rpb-accent-soft)}
.rpb-palette-item:active{cursor:grabbing}
.rpb-palette-icon{color:var(--rpb-accent);display:flex}
.rpb-palette-empty{padding:24px 8px;text-align:center;color:var(--rpb-text-faint);font-size:12px}

/* Navigator */
.rpb-navigator-row{display:flex;align-items:center;gap:6px;padding:6px 6px;border-radius:6px;cursor:pointer;font-size:12px;color:var(--rpb-text-muted);white-space:nowrap;overflow:hidden}
.rpb-navigator-row:hover{background:var(--rpb-tint);color:var(--rpb-text)}
.rpb-navigator-row-selected{background:var(--rpb-accent-soft);color:var(--rpb-accent)}
.rpb-navigator-label{overflow:hidden;text-overflow:ellipsis}
.rpb-navigator-empty{padding:16px 4px;color:var(--rpb-text-faint);font-size:12px;line-height:1.5}

/* Canvas */
.rpb-canvas{flex:1;overflow:auto;padding:28px;display:flex;flex-direction:column;align-items:center;background:var(--rpb-bg)}
.rpb-canvas-preview{padding:0}
.rpb-canvas-frame{width:100%;background:var(--rpb-panel-bg);border-radius:10px;box-shadow:0 1px 3px rgba(15,23,42,.08),0 1px 24px rgba(15,23,42,.06);overflow:hidden;transition:max-width .18s ease}
.rpb-canvas-preview .rpb-canvas-frame{border-radius:0;box-shadow:none;max-width:none!important}
.rpb-canvas-chrome{height:30px;background:var(--rpb-tint);border-bottom:1px solid var(--rpb-border);display:flex;align-items:center;justify-content:center;position:relative;flex-shrink:0;gap:8px}
.rpb-canvas-chrome-dots{position:absolute;left:10px;display:flex;gap:4px}
.rpb-canvas-chrome-dot{width:7px;height:7px;border-radius:50%;background:var(--rpb-border-soft)}
.rpb-canvas-chrome-url{font-size:10.5px;font-family:var(--rpb-font-mono);color:var(--rpb-text-faint);background:var(--rpb-panel-bg);border:1px solid var(--rpb-border-soft);border-radius:5px;padding:2px 10px;max-width:70%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.rpb-page{background:var(--rpb-panel-bg);min-height:400px;transform-origin:top center}
.rpb-empty{padding:80px 24px;text-align:center;color:var(--rpb-text-faint);font-size:14px}

/* Nodes */
.rpb-node{position:relative;outline:1px dashed transparent;outline-offset:-1px;transition:outline-color .12s;cursor:pointer}
.rpb-node:hover{outline-color:var(--rpb-accent)}
.rpb-node-selected{outline:2px solid var(--rpb-accent)!important;outline-offset:-2px}
.rpb-node-toolbar{display:none;position:absolute;top:0;left:0;transform:translateY(-100%);z-index:6;align-items:center;background:var(--rpb-accent);color:var(--rpb-accent-contrast);border-radius:6px 6px 0 0;font-size:10px;font-weight:600;letter-spacing:.03em;text-transform:uppercase;pointer-events:none}
.rpb-node-selected>.rpb-node-toolbar,.rpb-node:hover>.rpb-node-toolbar{display:flex}
.rpb-node-toolbar-label{padding:4px 8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.rpb-node-toolbar-actions{display:flex;pointer-events:auto}
.rpb-node-toolbar-btn{width:22px;height:22px;display:flex;align-items:center;justify-content:center;color:inherit;background:transparent;border:none;cursor:pointer;opacity:.9}
.rpb-node-toolbar-btn:hover{opacity:1;background:rgba(0,0,0,.15)}
.rpb-node-container{min-height:36px}
.rpb-container-hint{padding:18px;text-align:center;color:var(--rpb-text-faint);font-size:12px;border:1px dashed var(--rpb-border);border-radius:6px;margin:6px}
.rpb-unknown{padding:12px;background:var(--rpb-danger-bg);color:var(--rpb-danger);font-size:12px;border:1px dashed var(--rpb-danger-border)}

/* Drop zones */
.rpb-dropzone-collapsed{height:0}
.rpb-dropzone{height:14px;margin:1px 0;border-radius:4px;background:var(--rpb-accent-soft);outline:1px dashed var(--rpb-accent);outline-offset:-1px;transition:height .1s,background .1s;opacity:.6}
.rpb-dropzone-over{height:30px;opacity:1;outline-width:2px}

/* Inspector */
.rpb-inspector-empty{color:var(--rpb-text-faint);font-size:12.5px;padding:12px 0;line-height:1.6}
.rpb-inspector-actions{display:flex;gap:6px;margin-bottom:14px}
.rpb-inspector-tabs{display:flex;border-bottom:1px solid var(--rpb-border);margin:-12px -12px 12px}
.rpb-inspector-tab{flex:1;appearance:none;border:none;background:transparent;padding:9px 4px;font-size:11.5px;font-weight:600;color:var(--rpb-text-faint);cursor:pointer;border-bottom:2px solid transparent}
.rpb-inspector-tab:hover{color:var(--rpb-text)}
.rpb-inspector-tab-active{color:var(--rpb-accent);border-bottom-color:var(--rpb-accent)}
.rpb-field{margin-bottom:13px}
.rpb-field-label{display:block;font-size:11.5px;font-weight:600;color:var(--rpb-text-muted);margin-bottom:5px}
.rpb-field-help{margin-top:5px;color:var(--rpb-text-faint);font-size:11.5px;line-height:1.45}
.rpb-field-error{margin-top:5px;color:var(--rpb-danger);font-size:11.5px;line-height:1.45}
.rpb-input{width:100%;border:1px solid var(--rpb-border);border-radius:6px;padding:7px 9px;font-size:12.5px;color:var(--rpb-text);background:var(--rpb-input-bg);font-family:inherit}
.rpb-input:focus{outline:2px solid var(--rpb-accent-soft);border-color:var(--rpb-accent)}
.rpb-textarea{resize:vertical;line-height:1.5}
.rpb-range-row{display:flex;align-items:center;gap:10px}
.rpb-range-row input[type=range]{flex:1;accent-color:var(--rpb-accent)}
.rpb-range-value{font-size:12px;color:var(--rpb-text-muted);min-width:32px;text-align:right;font-variant-numeric:tabular-nums}
.rpb-color-row{display:flex;align-items:center;gap:8px}
.rpb-color-row input[type=color]{width:34px;height:32px;padding:2px;border:1px solid var(--rpb-border);border-radius:6px;background:var(--rpb-input-bg);cursor:pointer;flex-shrink:0}
.rpb-switch{display:flex;align-items:center;gap:8px;font-size:12.5px;color:var(--rpb-text);cursor:pointer}
.rpb-switch input{accent-color:var(--rpb-accent);width:16px;height:16px}
.rpb-image-field{display:flex;flex-direction:column;gap:8px}
.rpb-media-actions{display:flex;gap:6px}
.rpb-image-preview{width:100%;max-height:140px;object-fit:cover;border:1px solid var(--rpb-border-soft);border-radius:6px;background:var(--rpb-tint)}
.rpb-inspector-footer{display:flex;align-items:center;justify-content:space-between;margin:12px -12px -12px;padding:10px 12px;border-top:1px solid var(--rpb-border);background:var(--rpb-tint)}
.rpb-inspector-id{font-size:10.5px;font-family:var(--rpb-font-mono);color:var(--rpb-text-faint)}
`;
