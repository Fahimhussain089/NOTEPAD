const WRITE_FONTS = [
  ["Serif", 'Georgia, "Iowan Old Style", Palatino, "Times New Roman", serif'],
  ["Sans", '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'],
  ["Mono", 'ui-monospace, "SF Mono", Menlo, Consolas, monospace'],
  ["Rounded", 'ui-rounded, "SF Pro Rounded", "Segoe UI", sans-serif'],
];

const CODE_FONTS = [
  ["Mono", 'ui-monospace, "SF Mono", Menlo, Consolas, monospace'],
  ["Sans", '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'],
  ["Serif", 'Georgia, "Iowan Old Style", Palatino, serif'],
];

const LANGUAGES = [
  ["plain", "Plain text"],
  ["javascript", "JavaScript"],
  ["python", "Python"],
  ["kotlin", "Kotlin"],
  ["java", "Java"],
  ["html", "HTML"],
  ["css", "CSS"],
  ["json", "JSON"],
  ["sql", "SQL"],
];

const KEYWORDS = {
  javascript: ["const", "let", "var", "function", "return", "if", "else", "for", "while", "class", "new", "import", "export", "from", "async", "await", "try", "catch", "throw", "of", "in", "switch", "case", "break", "continue", "default", "typeof", "instanceof", "this", "null", "undefined", "true", "false"],
  python: ["def", "return", "if", "elif", "else", "for", "while", "class", "import", "from", "as", "try", "except", "with", "lambda", "pass", "break", "continue", "True", "False", "None", "in", "not", "and", "or", "yield", "async", "await"],
  kotlin: ["fun", "val", "var", "class", "object", "if", "else", "when", "for", "while", "return", "import", "package", "null", "true", "false", "override", "private", "public", "internal", "suspend", "data", "interface", "in", "is"],
  java: ["class", "public", "private", "protected", "static", "void", "int", "long", "boolean", "new", "return", "if", "else", "for", "while", "import", "package", "null", "true", "false", "extends", "implements", "try", "catch", "final", "this"],
  css: ["color", "background", "font", "font-size", "font-family", "margin", "padding", "display", "flex", "grid", "border", "width", "height", "content", "position", "top", "left", "right", "bottom"],
  json: ["true", "false", "null"],
  sql: ["select", "from", "where", "and", "or", "insert", "into", "values", "update", "set", "delete", "join", "left", "right", "inner", "on", "group", "by", "order", "limit", "create", "table", "as", "null", "not"],
};

const TEXT_COLORS = ["#211c18", "#9f1239", "#c2410c", "#1d4ed8", "#166534", "#6d28d9", "#f8fafc"];
const PAGE_COLORS = ["#fbf7f0", "#ffffff", "#e0f2fe", "#dcfce7", "#fee2e2", "#1c1917", "#0f172a"];
const HIGHLIGHTS = ["#fde68a", "#bbf7d0", "#bfdbfe", "#fecdd3", "#e9d5ff", "#fed7aa"];
const CODE_TEXT_COLORS = ["#f5f0e8", "#fde68a", "#86efac", "#7dd3fc", "#fda4af", "#e9d5ff", "#211c18"];
const CODE_PAGE_COLORS = ["#1c1917", "#0f172a", "#1e293b", "#14261c", "#fbf7f0", "#ffffff"];
const WRITE_SIZES = [15, 17, 19, 22, 28, 36];
const CODE_SIZES = [13, 14, 15, 16, 18, 20, 24];

const STORAGE_KEY = "personal-notepad-v1";

function uid() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return "n-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
}

function escapeHtml(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function parseHex(hex) {
  let h = String(hex || "").trim().replace("#", "");
  if (h.length === 3) h = h.split("").map((part) => part + part).join("");
  if (h.length !== 6 || /[^0-9a-f]/i.test(h)) return { r: 0, g: 0, b: 0 };
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function toHex(hex) {
  const { r, g, b } = parseHex(hex);
  const part = (n) => n.toString(16).padStart(2, "0");
  return "#" + part(r) + part(g) + part(b);
}

function luminance(hex) {
  const { r, g, b } = parseHex(hex);
  return (r * 299 + g * 587 + b * 114) / 1000;
}

function isDark(hex) {
  return luminance(hex) < 150;
}

function pairedInk(previousPage, nextPage, ink) {
  const wasDark = isDark(previousPage);
  const nowDark = isDark(nextPage);
  const lightInk = "#f5f0e8";
  const darkInk = "#211c18";
  const current = toHex(ink);
  if (wasDark !== nowDark && (current === lightInk || current === darkInk)) return nowDark ? lightInk : darkInk;
  return current;
}

function isWord(ch) {
  return typeof ch === "string" && ch.length === 1 && /[A-Za-z_]/.test(ch);
}

function isDigit(ch) {
  return typeof ch === "string" && ch.length === 1 && /[0-9]/.test(ch);
}

function highlightCode(src, lang) {
  const keywords = new Set(KEYWORDS[lang] || []);
  const hashComment = lang === "python" || lang === "sql";
  const slashComment = lang !== "json" && !hashComment;
  let out = "";
  let i = 0;
  const n = src.length;

  const token = (cls, text) => {
    const safe = escapeHtml(text);
    return cls === "tok-plain" ? safe : `<span class="${cls}">${safe}</span>`;
  };

  while (i < n) {
    const ch = src[i];
    const next = src[i + 1];

    if (ch === '"' || ch === "'" || ch === "`") {
      let j = i + 1;
      while (j < n) {
        if (src[j] === "\\") {
          j += 2;
          continue;
        }
        if (src[j] === ch) {
          j += 1;
          break;
        }
        if (src[j] === "\n" && ch !== "`") break;
        j += 1;
      }
      out += token("tok-str", src.slice(i, j));
      i = j;
      continue;
    }

    if (src.startsWith("/*", i)) {
      const end = src.indexOf("*/", i + 2);
      const j = end === -1 ? n : end + 2;
      out += token("tok-cmt", src.slice(i, j));
      i = j;
      continue;
    }

    if (slashComment && ch === "/" && next === "/") {
      const end = src.indexOf("\n", i);
      const j = end === -1 ? n : end;
      out += token("tok-cmt", src.slice(i, j));
      i = j;
      continue;
    }

    if (hashComment && ch === "#") {
      const end = src.indexOf("\n", i);
      const j = end === -1 ? n : end;
      out += token("tok-cmt", src.slice(i, j));
      i = j;
      continue;
    }

    if (lang === "html" && ch === "<") {
      const end = src.indexOf(">", i + 1);
      if (end === -1) {
        out += escapeHtml(ch);
        i += 1;
        continue;
      }
      out += token("tok-kw", src.slice(i, end + 1));
      i = end + 1;
      continue;
    }

    if (isDigit(ch) && (i === 0 || !isWord(src[i - 1]))) {
      let j = i + 1;
      while (j < n && (isDigit(src[j]) || src[j] === ".")) j += 1;
      out += token("tok-num", src.slice(i, j));
      i = j;
      continue;
    }

    if (isWord(ch)) {
      let j = i + 1;
      while (j < n && (isWord(src[j]) || isDigit(src[j]) || (src[j] === "-" && isWord(src[j + 1])))) j += 1;
      const word = src.slice(i, j);
      out += token(keywords.has(word) ? "tok-kw" : "tok-plain", word);
      i = j;
      continue;
    }

    out += escapeHtml(ch);
    i += 1;
  }

  if (!src.endsWith("\n")) out += "\n";
  return out;
}

function normalizeNote(raw) {
  const kind = raw && raw.kind === "code" ? "code" : "write";
  const now = Date.now();
  const source = raw || {};
  const base = {
    id: String(source.id || uid()),
    kind,
    title: String(source.title || ""),
    pageColor: String(source.pageColor || (kind === "code" ? "#1c1917" : "#fbf7f0")),
    inkColor: String(source.inkColor || (kind === "code" ? "#f5f0e8" : "#211c18")),
    fontFamily: String(source.fontFamily || (kind === "code" ? CODE_FONTS[0][1] : WRITE_FONTS[0][1])),
    fontSize: Number(source.fontSize) || (kind === "code" ? 15 : 19),
    createdAt: Number(source.createdAt) || now,
    updatedAt: Number(source.updatedAt) || now,
  };
  if (kind === "code") {
    const language = LANGUAGES.some(([id]) => id === source.language) ? source.language : "javascript";
    return {
      ...base,
      code: String(source.code || "").replace(/\r\n/g, "\n"),
      language,
      syntax: source.syntax !== false,
      wrap: source.wrap === true,
    };
  }
  return { ...base, html: String(source.html || "") };
}

function mergeState(local, incoming) {
  const tombstones = new Map();
  for (const entry of [...(local.deletedIds || []), ...(incoming.deletedIds || [])]) {
    if (!entry || !entry.id) continue;
    const at = Number(entry.at) || 0;
    if (at >= (tombstones.get(entry.id) || 0)) tombstones.set(entry.id, at);
  }

  const notes = new Map();
  for (const note of [...(local.notes || []), ...(incoming.notes || [])]) {
    if (!note || !note.id) continue;
    const prev = notes.get(note.id);
    if (!prev || (Number(note.updatedAt) || 0) >= (Number(prev.updatedAt) || 0)) notes.set(note.id, note);
  }

  for (const [id, at] of tombstones) {
    const note = notes.get(id);
    if (!note) continue;
    if ((Number(note.updatedAt) || 0) <= at) notes.delete(id);
    else tombstones.delete(id);
  }

  const deletedIds = [...tombstones].map(([id, at]) => ({ id, at })).slice(-500);
  const list = [...notes.values()].sort((a, b) => b.updatedAt - a.updatedAt);
  const activeId = [local.activeId, incoming.activeId].find((id) => list.some((note) => note.id === id)) || list[0]?.id || null;
  return {
    version: 1,
    savedAt: Math.max(Number(local.savedAt) || 0, Number(incoming.savedAt) || 0),
    activeId,
    notes: list,
    deletedIds,
  };
}

function fingerprint(envelope) {
  const notes = (envelope.notes || []).map(normalizeNote).map((note) => {
    const common = {
      id: note.id,
      kind: note.kind,
      title: note.title,
      updatedAt: note.updatedAt,
      pageColor: toHex(note.pageColor),
      inkColor: toHex(note.inkColor),
      fontFamily: note.fontFamily,
      fontSize: Number(note.fontSize),
    };
    if (note.kind === "code") {
      return { ...common, code: note.code, language: note.language, syntax: !!note.syntax, wrap: !!note.wrap };
    }
    return { ...common, html: note.html };
  });
  notes.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const deleted = (envelope.deletedIds || []).map((entry) => entry.id + ":" + entry.at).sort();
  return JSON.stringify({ notes, deleted });
}

// END PURE

const state = {
  notes: [],
  deletedIds: [],
  activeId: null,
  savedAt: 0,
  fileHandle: null,
  fileName: "",
  fileReady: false,
  lastEdit: 0,
  pulling: false,
  google: {
    clientId: "",
    token: "",
    tokenExpires: 0,
    email: "",
    fileId: "",
  },
};

let savedRange = null;
let paintSpan = null;
let localTimer = 0;
let fileTimer = 0;
let driveTimer = 0;
let driveWriting = false;
let tokenClient = null;
let tokenPromise = null;
let listTimer = 0;
let highlightFrame = 0;
let confirmTimer = 0;

const els = {};

function $(id) {
  return document.getElementById(id);
}

function activeNote() {
  return state.notes.find((note) => note.id === state.activeId) || null;
}

function canLinkFile() {
  return window.isSecureContext && typeof window.showOpenFilePicker === "function";
}

function displayTitle(note) {
  const title = (note.title || "").trim();
  if (title) return title;
  return note.kind === "code" ? "Untitled code" : "Untitled";
}

function relativeTime(ts) {
  const seconds = Math.max(0, (Date.now() - ts) / 1000);
  if (seconds < 45) return "Just now";
  if (seconds < 3600) return Math.floor(seconds / 60) + "m ago";
  if (seconds < 86400) return Math.floor(seconds / 3600) + "h ago";
  return new Date(ts).toLocaleDateString();
}

function plainText(note) {
  if (note.kind === "code") return note.code || "";
  const holder = document.createElement("div");
  holder.innerHTML = note.html || "";
  return holder.textContent || "";
}

function sanitizeHtml(html) {
  const doc = new DOMParser().parseFromString(String(html || ""), "text/html");
  doc.querySelectorAll("script, iframe, object, embed, link, meta, img, video, audio, svg, math, form, style").forEach((node) => node.remove());
  doc.body.querySelectorAll("*").forEach((el) => {
    [...el.attributes].forEach((attr) => {
      const name = attr.name.toLowerCase();
      const value = attr.value || "";
      if (name.startsWith("on") || name === "srcdoc") {
        el.removeAttribute(attr.name);
        return;
      }
      if ((name === "href" || name === "src") && !/^(https?:|mailto:)/i.test(value.trim())) {
        el.removeAttribute(attr.name);
        return;
      }
      if (/javascript:|expression\s*\(/i.test(value)) el.removeAttribute(attr.name);
    });
  });
  return doc.body.innerHTML;
}

function sanitizeNotes(notes) {
  return notes.map((note) => (note.kind === "write" ? { ...note, html: sanitizeHtml(note.html) } : note));
}

function browserFingerprint(envelope) {
  return fingerprint({
    ...envelope,
    notes: sanitizeNotes((envelope.notes || []).map(normalizeNote)),
    deletedIds: envelope.deletedIds || [],
  });
}

function envelopeFromState() {
  return {
    version: 1,
    savedAt: state.savedAt,
    activeId: state.activeId,
    notes: state.notes,
    deletedIds: state.deletedIds,
  };
}

function applyEnvelope(data, { render = true } = {}) {
  const normalized = {
    ...data,
    notes: sanitizeNotes((data.notes || []).map(normalizeNote)),
  };
  state.notes = normalized.notes;
  state.deletedIds = normalized.deletedIds || [];
  state.savedAt = normalized.savedAt || 0;
  state.activeId = state.notes.some((note) => note.id === data.activeId) ? data.activeId : state.notes[0]?.id || null;
  if (render) renderAll();
}

function setStatus(text) {
  if (els.status) els.status.textContent = text;
}

function renderHelp() {
  renderDrive();
}

function renderDrive() {
  const signedIn = !!state.google.token;
  const input = $("clientId");
  if (input && document.activeElement !== input) input.value = state.google.clientId || "";
  const signIn = $("googleSignIn");
  const syncBtn = $("driveSync");
  const save = $("driveSave");
  const signOut = $("googleSignOut");
  if (signIn) signIn.hidden = signedIn;
  if (syncBtn) syncBtn.hidden = !signedIn;
  if (save) save.hidden = !signedIn;
  if (signOut) signOut.hidden = !signedIn;
  if (!els.syncHelp) return;
  if (signedIn) {
    els.syncHelp.textContent = "Signed in as " + (state.google.email || "Google") + ". Notes auto-sync with Drive.";
    els.fileLabel.textContent = "Google Drive: my-notes.json" + (state.google.fileId ? " (connected)" : " (new)");
  } else if (state.google.clientId) {
    els.syncHelp.textContent = "Sign in with your Gmail. Both laptops then open the same notes from Drive.";
    els.fileLabel.textContent = "Client ID saved. Sign in to upload notes.";
  } else {
    els.syncHelp.textContent = "Sign in with your Gmail so notes live in Drive, not only on this laptop.";
    els.fileLabel.textContent = "Add the Google client ID once, then sign in.";
  }
}

function renderFileLabel() {
  const saveBtn = $("saveFile");
  const openBtn = $("openFile");
  const localLabel = $("localLabel");
  if (!saveBtn || !localLabel) return;
  const supported = canLinkFile();
  saveBtn.hidden = !supported;
  if (openBtn) openBtn.hidden = !supported;
  if (!supported) {
    localLabel.textContent = "Open Notepad in Chrome with Start Notepad to save a folder on this laptop.";
    return;
  }
  if (state.fileName && state.fileReady) {
    saveBtn.textContent = "Update file";
    localLabel.textContent = "This laptop only: " + state.fileName + ". This does not upload to Drive.";
  } else if (state.fileName) {
    saveBtn.textContent = "Update file";
    localLabel.textContent = state.fileName + " needs permission. Click Update file.";
  } else {
    saveBtn.textContent = "Choose folder";
    localLabel.textContent = "Choose a folder once. Later saves update my-notes.json in that folder.";
  }
}

function renderList() {
  const query = els.search.value.trim().toLowerCase();
  els.noteList.replaceChildren();
  const notes = [...state.notes].sort((a, b) => b.updatedAt - a.updatedAt);
  const visible = notes.filter((note) => {
    if (!query) return true;
    return (displayTitle(note) + " " + plainText(note)).toLowerCase().includes(query);
  });

  if (!visible.length) {
    const empty = document.createElement("p");
    empty.className = "sync-help";
    empty.textContent = state.notes.length ? "No matching notes." : "No notes yet.";
    els.noteList.append(empty);
    return;
  }

  for (const note of visible) {
    const wrap = document.createElement("div");
    wrap.className = "note-row" + (note.id === state.activeId ? " active" : "");
    wrap.setAttribute("role", "listitem");

    const open = document.createElement("button");
    open.type = "button";
    open.className = "note-open";
    open.setAttribute("aria-current", note.id === state.activeId ? "true" : "false");

    const kind = document.createElement("span");
    kind.className = "kind";
    kind.textContent = note.kind === "code" ? "</>" : "Aa";

    const copy = document.createElement("span");
    copy.className = "note-copy";
    const title = document.createElement("span");
    title.className = "note-title";
    title.textContent = displayTitle(note);
    const time = document.createElement("span");
    time.className = "note-time";
    time.textContent = relativeTime(note.updatedAt);
    copy.append(title, time);

    const dot = document.createElement("span");
    dot.className = "dot";
    dot.style.background = note.pageColor;

    open.append(kind, copy, dot);
    open.addEventListener("click", () => selectNote(note.id));

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "delete-note";
    remove.textContent = "×";
    remove.setAttribute("aria-label", "Delete " + displayTitle(note));
    remove.addEventListener("click", (event) => {
      event.stopPropagation();
      if (!remove.classList.contains("confirm")) {
        remove.classList.add("confirm");
        remove.textContent = "Sure?";
        clearTimeout(confirmTimer);
        confirmTimer = setTimeout(() => {
          if (!remove.isConnected) return;
          remove.classList.remove("confirm");
          remove.textContent = "×";
        }, 2500);
        return;
      }
      deleteNote(note.id);
    });

    wrap.append(open, remove);
    els.noteList.append(wrap);
  }
}

function updateMeta() {
  const note = activeNote();
  if (!note) {
    els.meta.textContent = "";
    return;
  }
  let label;
  if (note.kind === "code") {
    const lines = note.code ? note.code.replace(/\n$/, "").split("\n").length : 0;
    label = lines + (lines === 1 ? " line" : " lines");
  } else {
    const words = plainText(note).trim().split(/\s+/).filter(Boolean).length;
    label = words + (words === 1 ? " word" : " words");
  }
  if (Math.abs(luminance(note.pageColor) - luminance(note.inkColor)) < 50) label += " · hard to read";
  els.meta.textContent = label;
}

function refreshPlaceholder() {
  const note = activeNote();
  const empty = !note || note.kind !== "write" || plainText(note).replace(/\u200B/g, "").trim() === "";
  els.placeholder.hidden = !note || note.kind !== "write" || !empty;
  if (note && note.kind === "write") els.placeholder.style.color = "color-mix(in srgb, " + note.inkColor + " 42%, transparent)";
}

function paintCode() {
  const note = activeNote();
  if (!note || note.kind !== "code") return;
  const dark = isDark(note.pageColor);
  els.codeShell.style.setProperty("--ink", note.inkColor);
  els.codeShell.style.setProperty("--page", note.pageColor);
  els.codeShell.style.setProperty("--code-font", note.fontFamily);
  els.codeShell.style.setProperty("--code-size", note.fontSize + "px");
  els.codeShell.style.setProperty("--kw", dark ? "#7dd3fc" : "#1d4ed8");
  els.codeShell.style.setProperty("--str", dark ? "#fbbf24" : "#b45309");
  els.codeShell.style.setProperty("--cmt", dark ? "#a8a29e" : "#78716c");
  els.codeShell.style.setProperty("--num", dark ? "#fda4af" : "#be123c");
  els.codeShell.style.background = note.pageColor;
  els.codeShell.classList.toggle("wrap", note.wrap);
  els.codeShell.classList.toggle("syntax-off", !note.syntax);
  els.codeInput.wrap = note.wrap ? "soft" : "off";
  const code = note.code || "";
  els.codeHighlight.innerHTML = note.syntax ? highlightCode(code, note.language) : escapeHtml(code) + (code.endsWith("\n") ? "" : "\n");
}

function applyChrome() {
  const note = activeNote();
  if (!note) return;
  if (note.kind === "write") {
    els.sheet.style.background = note.pageColor;
    els.editor.style.color = note.inkColor;
    els.editor.style.caretColor = note.inkColor;
    els.editor.style.fontFamily = note.fontFamily;
    els.editor.style.fontSize = note.fontSize + "px";
    els.sheet.style.setProperty("--ink", note.inkColor);
    refreshPlaceholder();
  } else {
    els.sheet.style.background = note.pageColor;
    paintCode();
  }
  updateMeta();
  markSwatches();
}

function markSwatches() {
  const note = activeNote();
  if (!note) return;
  els.toolbar.querySelectorAll("[data-swatch-group]").forEach((button) => {
    const group = button.dataset.swatchGroup;
    const current = group === "ink" || group === "selection-ink" ? note.inkColor : note.pageColor;
    if (group === "highlight") return;
    button.classList.toggle("on", toHex(button.dataset.color) === toHex(current));
  });
}

function toolButton(label, title, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "tool";
  button.title = title;
  button.setAttribute("aria-label", title);
  button.textContent = label;
  button.addEventListener("mousedown", (event) => event.preventDefault());
  button.addEventListener("click", onClick);
  return button;
}

function fontSelect(fonts, current, label, onChange) {
  const select = document.createElement("select");
  select.className = "tool-select";
  select.setAttribute("aria-label", label);
  fonts.forEach(([name, stack]) => {
    const option = document.createElement("option");
    option.value = stack;
    option.textContent = name;
    option.selected = stack === current;
    select.append(option);
  });
  select.addEventListener("change", () => onChange(select.value));
  return select;
}

function sizeSelect(sizes, current, onChange) {
  const select = document.createElement("select");
  select.className = "tool-select";
  select.setAttribute("aria-label", "Font size");
  sizes.forEach((size) => {
    const option = document.createElement("option");
    option.value = String(size);
    option.textContent = size + " px";
    option.selected = Number(current) === size;
    select.append(option);
  });
  select.addEventListener("change", () => onChange(Number(select.value)));
  return select;
}

function colorInput(value, label, onInput) {
  const input = document.createElement("input");
  input.type = "color";
  input.value = toHex(value);
  input.setAttribute("aria-label", label);
  input.title = label;
  input.addEventListener("pointerdown", () => {
    rememberEditorSelection();
    input.dataset.painting = "";
  });
  input.addEventListener("input", () => {
    const reuse = input.dataset.painting === "1";
    onInput(input.value, reuse);
    input.dataset.painting = "1";
  });
  return input;
}

function swatches(colors, group, onPick) {
  const wrap = document.createDocumentFragment();
  colors.forEach((color) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "swatch";
    button.style.background = color;
    button.dataset.color = color;
    button.dataset.swatchGroup = group;
    button.title = color;
    button.setAttribute("aria-label", group + " " + color);
    button.addEventListener("mousedown", (event) => event.preventDefault());
    button.addEventListener("click", () => onPick(color));
    wrap.append(button);
  });
  return wrap;
}

function separator() {
  const line = document.createElement("span");
  line.className = "sep";
  return line;
}

function label(text) {
  const node = document.createElement("span");
  node.className = "lbl";
  node.textContent = text;
  return node;
}

function renderToolbar() {
  const note = activeNote();
  els.toolbar.replaceChildren();
  if (!note) return;

  if (note.kind === "write") {
    const noteRow = document.createElement("div");
    noteRow.className = "tool-row";
    noteRow.append(
      label("Note"),
      fontSelect(WRITE_FONTS, note.fontFamily, "Note font", (value) => setNoteFont(value)),
      sizeSelect(WRITE_SIZES, note.fontSize, (value) => setNoteSize(value)),
      separator(),
      label("Text"),
      swatches(TEXT_COLORS, "ink", (color) => setInkColor(color)),
      colorInput(note.inkColor, "Custom text color", (color) => setInkColor(color)),
      separator(),
      label("Background"),
      swatches(PAGE_COLORS, "page", (color) => setPageColor(color)),
      colorInput(note.pageColor, "Custom background", (color) => setPageColor(color)),
    );

    const selectionRow = document.createElement("div");
    selectionRow.className = "tool-row";
    selectionRow.append(
      label("Selection"),
      toolButton("B", "Bold", () => exec("bold")),
      toolButton("I", "Italic", () => exec("italic")),
      toolButton("U", "Underline", () => exec("underline")),
      toolButton("S", "Strikethrough", () => exec("strikeThrough")),
      separator(),
      label("Color"),
      colorInput(note.inkColor, "Selected text color", (color, reuse) => applySpanStyle({ color }, { reuse })),
      label("Text background"),
      swatches(HIGHLIGHTS, "highlight", (color) => applySpanStyle({ backgroundColor: color })),
      colorInput("#fde68a", "Selected text background", (color, reuse) => applySpanStyle({ backgroundColor: color }, { reuse })),
      separator(),
      fontSelect(WRITE_FONTS, note.fontFamily, "Selection font", (value) => selectionFont(value)),
      sizeSelect(WRITE_SIZES, note.fontSize, (value) => selectionSize(value)),
      separator(),
      toolButton("•", "Bullet list", () => exec("insertUnorderedList")),
      toolButton("1.", "Numbered list", () => exec("insertOrderedList")),
      toolButton("⊞ Table", "Insert 3x3 table", () => insertBlankTable()),
      codeToolButton(),
      toolButton("Clear", "Clear selection formatting", () => clearFormatting()),
    );
    els.toolbar.append(noteRow, selectionRow);
  } else {
    const row = document.createElement("div");
    row.className = "tool-row";
    const language = document.createElement("select");
    language.className = "tool-select";
    language.setAttribute("aria-label", "Language");
    LANGUAGES.forEach(([id, name]) => {
      const option = document.createElement("option");
      option.value = id;
      option.textContent = name;
      option.selected = note.language === id;
      language.append(option);
    });
    language.addEventListener("change", () => {
      note.language = language.value;
      paintCode();
      touch();
    });

    const syntax = document.createElement("label");
    syntax.className = "check";
    const syntaxInput = document.createElement("input");
    syntaxInput.type = "checkbox";
    syntaxInput.checked = note.syntax;
    syntaxInput.addEventListener("change", () => {
      note.syntax = syntaxInput.checked;
      paintCode();
      touch();
    });
    syntax.append(syntaxInput, document.createTextNode("Syntax colors"));

    const wrap = document.createElement("label");
    wrap.className = "check";
    const wrapInput = document.createElement("input");
    wrapInput.type = "checkbox";
    wrapInput.checked = note.wrap;
    wrapInput.addEventListener("change", () => {
      note.wrap = wrapInput.checked;
      paintCode();
      touch();
    });
    wrap.append(wrapInput, document.createTextNode("Wrap"));

    row.append(
      label("Code"),
      language,
      fontSelect(CODE_FONTS, note.fontFamily, "Code font", (value) => setNoteFont(value)),
      sizeSelect(CODE_SIZES, note.fontSize, (value) => setNoteSize(value)),
      separator(),
      label("Text"),
      swatches(CODE_TEXT_COLORS, "ink", (color) => setInkColor(color)),
      colorInput(note.inkColor, "Code text color", (color) => setInkColor(color)),
      separator(),
      label("Background"),
      swatches(CODE_PAGE_COLORS, "page", (color) => setPageColor(color)),
      colorInput(note.pageColor, "Code background", (color) => setPageColor(color)),
      separator(),
      syntax,
      wrap,
    );
    els.toolbar.append(row);
  }
  markSwatches();
}

function renderAll() {
  const note = activeNote();
  els.empty.hidden = !!note;
  els.workspace.hidden = !note;
  renderList();
  renderEditor();
  renderFileLabel();
  renderDrive();
}

function renderEditor() {
  const note = activeNote();
  if (!note) return;
  els.title.value = note.title;
  renderToolbar();
  if (note.kind === "write") {
    els.editor.hidden = false;
    els.codeShell.hidden = true;
    els.editor.innerHTML = sanitizeHtml(note.html || "");
    refreshPlaceholder();
  } else {
    els.editor.hidden = true;
    els.placeholder.hidden = true;
    els.codeShell.hidden = false;
    if (els.codeInput.value !== (note.code || "")) els.codeInput.value = note.code || "";
    paintCode();
  }
  applyChrome();
}

function readDomInto(note) {
  note.title = els.title.value;
  if (note.kind === "write") note.html = els.editor.innerHTML;
  else note.code = els.codeInput.value.replace(/\r\n/g, "\n");
}

function changed() {
  const note = activeNote();
  if (!note) return;
  const beforeTitle = note.title;
  const beforeBody = note.kind === "code" ? note.code : note.html;
  readDomInto(note);
  const afterBody = note.kind === "code" ? note.code : note.html;
  if (note.title === beforeTitle && afterBody === beforeBody) {
    refreshPlaceholder();
    if (note.kind === "code") scheduleHighlight();
    return;
  }
  note.updatedAt = Date.now();
  state.lastEdit = note.updatedAt;
  state.savedAt = note.updatedAt;
  refreshPlaceholder();
  if (note.kind === "code") scheduleHighlight();
  updateMeta();
  scheduleList();
  schedulePersist();
  setStatus("Saving...");
}

function touch() {
  const note = activeNote();
  if (!note) return;
  note.updatedAt = Date.now();
  state.lastEdit = note.updatedAt;
  state.savedAt = note.updatedAt;
  updateMeta();
  scheduleList();
  schedulePersist();
  setStatus("Saving...");
}

function scheduleList() {
  clearTimeout(listTimer);
  listTimer = setTimeout(renderList, 180);
}

function scheduleHighlight() {
  cancelAnimationFrame(highlightFrame);
  highlightFrame = requestAnimationFrame(() => {
    const note = activeNote();
    if (!note || note.kind !== "code") return;
    note.code = els.codeInput.value.replace(/\r\n/g, "\n");
    paintCode();
    els.codeHighlight.scrollTop = els.codeInput.scrollTop;
    els.codeHighlight.scrollLeft = els.codeInput.scrollLeft;
  });
}

function schedulePersist() {
  clearTimeout(localTimer);
  localTimer = setTimeout(persistLocal, 180);
  if (state.fileReady) {
    clearTimeout(fileTimer);
    fileTimer = setTimeout(() => writeFile(), 700);
  }
  if (state.google.token) {
    clearTimeout(driveTimer);
    driveTimer = setTimeout(() => uploadDrive(), 800);
  }
}

function persistLocal() {
  const payload = JSON.stringify(envelopeFromState());
  try {
    localStorage.setItem(STORAGE_KEY, payload);
    if (!state.fileReady && !state.google.token) setStatus("Saved on this laptop");
  } catch (error) {
    setStatus("This browser storage is full. Save as file.");
  }
}

function createNote(kind) {
  captureActive();
  const note = normalizeNote({ kind, title: "", updatedAt: Date.now(), createdAt: Date.now() });
  state.notes.unshift(note);
  state.activeId = note.id;
  state.savedAt = note.updatedAt;
  renderAll();
  persistLocal();
  if (state.fileReady) writeFile();
  els.title.focus();
}

function selectNote(id) {
  if (id === state.activeId) return;
  captureActive();
  state.activeId = id;
  renderAll();
  persistLocal();
}

function deleteNote(id) {
  const note = state.notes.find((item) => item.id === id);
  state.notes = state.notes.filter((item) => item.id !== id);
  state.deletedIds.push({ id, at: Date.now() });
  state.deletedIds = state.deletedIds.slice(-500);
  if (state.activeId === id) state.activeId = state.notes[0]?.id || null;
  state.savedAt = Date.now();
  if (note) state.lastEdit = state.savedAt;
  renderAll();
  persistLocal();
  if (state.fileReady) writeFile();
}

function captureActive() {
  const note = activeNote();
  if (!note) return;
  const title = els.title.value;
  const body = note.kind === "write" ? els.editor.innerHTML : els.codeInput.value.replace(/\r\n/g, "\n");
  const previous = note.kind === "write" ? note.html : note.code;
  if (title === note.title && body === previous) {
    return;
  }
  note.title = title;
  if (note.kind === "write") note.html = body;
  else note.code = body;
  note.updatedAt = Date.now();
  state.savedAt = note.updatedAt;
  state.lastEdit = note.updatedAt;
}

function setInkColor(color) {
  const note = activeNote();
  if (!note) return;
  note.inkColor = toHex(color);
  applyChrome();
  touch();
}

function setPageColor(color) {
  const note = activeNote();
  if (!note) return;
  const previous = note.pageColor;
  note.pageColor = toHex(color);
  note.inkColor = pairedInk(previous, note.pageColor, note.inkColor);
  applyChrome();
  const inkInput = els.toolbar.querySelector('[aria-label="Custom text color"], [aria-label="Code text color"]');
  if (inkInput) inkInput.value = toHex(note.inkColor);
  touch();
}

function setNoteFont(value) {
  const note = activeNote();
  if (!note) return;
  note.fontFamily = value;
  applyChrome();
  touch();
}

function setNoteSize(value) {
  const note = activeNote();
  if (!note) return;
  note.fontSize = value;
  applyChrome();
  touch();
}

function rememberEditorSelection() {
  const selection = window.getSelection();
  if (!selection || !selection.rangeCount) return;
  const node = selection.anchorNode;
  if (node && els.editor.contains(node)) savedRange = selection.getRangeAt(0).cloneRange();
}

function restoreSelection() {
  const keepPicker = document.activeElement && document.activeElement.type === "color";
  if (!keepPicker) els.editor.focus();
  if (!savedRange) return;
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(savedRange);
}

function applySpanStyle(style, { reuse = false } = {}) {
  if (reuse && paintSpan && paintSpan.isConnected) {
    Object.assign(paintSpan.style, style);
    changed();
    return true;
  }
  const currentSel = window.getSelection();
  if (currentSel && currentSel.rangeCount && !currentSel.isCollapsed && els.editor.contains(currentSel.anchorNode)) {
    savedRange = currentSel.getRangeAt(0).cloneRange();
  }
  restoreSelection();
  const selection = window.getSelection();
  if (!selection || !selection.rangeCount || selection.isCollapsed || !savedRange || savedRange.collapsed) {
    setStatus("Select the words first, then choose text background.");
    return false;
  }
  const range = selection.getRangeAt(0);
  if (!els.editor.contains(range.commonAncestorContainer)) {
    setStatus("Select the words first, then choose text background.");
    return false;
  }
  const span = document.createElement("span");
  Object.assign(span.style, style);
  span.append(range.extractContents());
  range.insertNode(span);
  const next = document.createRange();
  next.selectNodeContents(span);
  selection.removeAllRanges();
  selection.addRange(next);
  savedRange = next.cloneRange();
  paintSpan = span;
  changed();
  return true;
}

function exec(command) {
  restoreSelection();
  document.execCommand("styleWithCSS", false, true);
  document.execCommand(command, false, null);
  changed();
}

function paintSelection(command, value) {
  restoreSelection();
  document.execCommand("styleWithCSS", false, true);
  let worked = document.execCommand(command, false, value);
  if (!worked && command === "hiliteColor") document.execCommand("backColor", false, value);
  changed();
}

function selectionFont(value) {
  const family = value.split(",")[0].replace(/['"]/g, "").trim();
  restoreSelection();
  document.execCommand("styleWithCSS", false, true);
  document.execCommand("fontName", false, family);
  changed();
}

function selectionSize(px) {
  restoreSelection();
  document.execCommand("styleWithCSS", false, true);
  document.execCommand("fontSize", false, "7");
  const selection = window.getSelection();
  const node = selection && selection.anchorNode;
  const element = node && (node.nodeType === 1 ? node : node.parentElement);
  const sized = element && element.closest ? element.closest('[style*="font-size"]') : null;
  if (sized) sized.style.fontSize = px + "px";
  changed();
}

function codeToolButton() {
  const button = toolButton("</>", "Code. Click again to remove it.", () => wrapInlineCode());
  button.classList.add("code-tool");
  return button;
}

function insertBlankTable(rows = 3, cols = 3) {
  restoreSelection();
  const table = document.createElement("table");
  const tbody = document.createElement("tbody");
  for (let r = 0; r < rows; r++) {
    const tr = document.createElement("tr");
    for (let c = 0; c < cols; c++) {
      const cell = document.createElement(r === 0 ? "th" : "td");
      cell.textContent = r === 0 ? `Header ${c + 1}` : `Data`;
      tr.appendChild(cell);
    }
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  const fragment = document.createDocumentFragment();
  fragment.appendChild(table);
  fragment.appendChild(document.createElement("p"));
  insertFragmentAtSelection(fragment);
  changed();
}

function elementAroundSelection(tagName) {
  const selection = window.getSelection();
  if (!selection || !selection.rangeCount) return null;
  const nodes = [selection.anchorNode, selection.focusNode];
  for (const node of nodes) {
    const el = node && (node.nodeType === 1 ? node : node.parentElement);
    const match = el && el.closest ? el.closest(tagName) : null;
    if (match && els.editor.contains(match)) return match;
  }
  return null;
}

function unwrap(el) {
  const parent = el.parentNode;
  if (!parent) return;
  while (el.firstChild) parent.insertBefore(el.firstChild, el);
  parent.removeChild(el);
}

function hasPaintedBackground(el) {
  if (!el || !el.style) return false;
  const bg = el.style.backgroundColor || el.style.background;
  return !!bg && bg !== "transparent" && bg !== "rgba(0, 0, 0, 0)";
}

function isLayoutElement(el) {
  if (!el || el === els.editor) return false;
  if (el.closest && (el.closest("table") || el.closest("td") || el.closest("th"))) return false;
  const tag = el.tagName;
  if (tag === "CODE" || tag === "PRE" || tag === "BLOCKQUOTE") return true;
  return hasPaintedBackground(el);
}

function layoutRoot(node) {
  let current = node && (node.nodeType === 1 ? node : node.parentElement);
  let found = null;
  while (current && current !== els.editor) {
    if (isLayoutElement(current)) found = current;
    current = current.parentElement;
  }
  return found;
}

function nearestBlock(el) {
  const blocks = new Set(["P", "DIV", "LI", "H1", "H2", "H3", "BLOCKQUOTE", "PRE"]);
  let current = el && (el.nodeType === 1 ? el : el.parentElement);
  while (current && current !== els.editor) {
    if (blocks.has(current.tagName)) return current;
    current = current.parentElement;
  }
  return null;
}

function stripLayout(root) {
  const nodes = [...root.querySelectorAll("*")];
  nodes.forEach((el) => {
    if (el.tagName === "CODE" || el.tagName === "PRE" || el.tagName === "BLOCKQUOTE") {
      unwrap(el);
      return;
    }
    if (el.style) {
      el.style.background = "";
      el.style.backgroundColor = "";
      if (!el.getAttribute("style")) el.removeAttribute("style");
      if ((el.tagName === "SPAN" || el.tagName === "FONT") && el.attributes.length === 0) unwrap(el);
    }
  });
}

function placeCaret(el) {
  const selection = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(el);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
  savedRange = range.cloneRange();
}

function breakOutOfLayout() {
  const selection = window.getSelection();
  if (!selection || !selection.rangeCount || !selection.isCollapsed) return false;
  const range = selection.getRangeAt(0);
  if (!els.editor.contains(range.startContainer)) return false;
  const layout = layoutRoot(range.startContainer);
  if (!layout) return false;
  if (nearestBlock(layout) && nearestBlock(layout).tagName === "LI" && layout.tagName !== "LI") return false;

  const host = nearestBlock(layout) || layout;
  const tail = document.createRange();
  tail.setStart(range.startContainer, range.startOffset);
  tail.setEnd(host, host.childNodes.length);
  const fragment = tail.extractContents();
  stripLayout(fragment);
  const fresh = document.createElement("p");
  if (!fragment.textContent.replace(/\u200B/g, "").trim()) fresh.append(document.createElement("br"));
  else fresh.append(fragment);
  host.after(fresh);
  if (layout.isConnected && layout !== host && !layout.textContent.replace(/\u200B/g, "").trim()) layout.remove();
  if (host.isConnected && !host.textContent.replace(/\u200B/g, "").trim() && !host.querySelector("br")) {
    host.append(document.createElement("br"));
  }
  placeCaret(fresh);
  changed();
  setStatus("New line is outside that layout.");
  return true;
}

function wrapInlineCode() {
  restoreSelection();
  const selection = window.getSelection();
  if (!selection || !selection.rangeCount || !els.editor.contains(selection.anchorNode)) {
    setStatus("Click inside the note first.");
    return;
  }
  const existing = elementAroundSelection("code");
  if (existing) {
    unwrap(existing);
    changed();
    setStatus("Code formatting removed.");
    updateCodeButton();
    return;
  }
  if (selection.isCollapsed) {
    setStatus("Select the words, then click code. Click again to remove it.");
    return;
  }
  const range = selection.getRangeAt(0);
  if (!els.editor.contains(range.commonAncestorContainer)) return;
  const code = document.createElement("code");
  code.spellcheck = false;
  code.append(range.extractContents());
  range.insertNode(code);
  changed();
  updateCodeButton();
}

function clearFormatting() {
  restoreSelection();
  const selection = window.getSelection();
  if (!selection || !selection.rangeCount) return;
  if (selection.isCollapsed) {
    const code = elementAroundSelection("code");
    if (code) unwrap(code);
    let el = selection.anchorNode && (selection.anchorNode.nodeType === 1 ? selection.anchorNode : selection.anchorNode.parentElement);
    while (el && el !== els.editor) {
      if (hasPaintedBackground(el) && el.tagName !== "DIV" && el.tagName !== "P") {
        unwrap(el);
        break;
      }
      el = el.parentElement;
    }
    changed();
    return;
  }
  document.execCommand("styleWithCSS", false, true);
  document.execCommand("removeFormat", false, null);
  const range = selection.getRangeAt(0);
  const root = range.commonAncestorContainer.nodeType === 1 ? range.commonAncestorContainer : range.commonAncestorContainer.parentElement;
  if (root && els.editor.contains(root)) {
    [...root.querySelectorAll("code")].forEach((code) => {
      if (selection.containsNode(code, true)) unwrap(code);
    });
  }
  changed();
}

function updateCodeButton() {
  const inside = !!elementAroundSelection("code");
  document.querySelectorAll(".code-tool").forEach((button) => button.classList.toggle("on", inside));
}

function snapshotForMerge() {
  captureActive();
  return envelopeFromState();
}

async function idb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("personal-notepad", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("kv");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function idbSet(key, value) {
  const db = await idb();
  await new Promise((resolve, reject) => {
    const tx = db.transaction("kv", "readwrite");
    tx.objectStore("kv").put(value, key);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

async function idbGet(key) {
  const db = await idb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("kv", "readonly");
    const request = tx.objectStore("kv").get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function pickerTypes() {
  return [{ description: "Notepad notes", accept: { "application/json": [".json"] } }];
}

async function rememberHandle(handle) {
  state.fileHandle = handle;
  state.fileName = handle.name;
  state.fileReady = true;
  await idbSet("file", handle);
  renderFileLabel();
}

async function chooseSaveLocation() {
  if (!canLinkFile()) return;
  try {
    if (typeof window.showDirectoryPicker === "function") {
      const dir = await window.showDirectoryPicker({ mode: "readwrite" });
      const handle = await dir.getFileHandle("my-notes.json", { create: true });
      await rememberHandle(handle);
      await idbSet("dir", dir);
      await pullFile({ force: true });
      setStatus("Saved on this laptop only. Sign in with Google to open the same notes on the other Mac.");
      return;
    }
    const handle = await window.showSaveFilePicker({
      suggestedName: "my-notes.json",
      types: pickerTypes(),
    });
    await rememberHandle(handle);
    await pullFile({ force: true });
  } catch (error) {
    if (error.name !== "AbortError") setStatus(error.message || "Could not use that folder");
  }
}

async function saveOrUpdate() {
  if (!canLinkFile()) {
    downloadBackup();
    return;
  }
  if (state.fileHandle) {
    if (!state.fileReady) {
      try {
        state.fileReady = (await state.fileHandle.requestPermission({ mode: "readwrite" })) === "granted";
      } catch (error) {
        state.fileReady = false;
      }
      renderFileLabel();
      if (!state.fileReady) {
        setStatus("Allow access so the same file can be updated.");
        return;
      }
    }
    await writeFile();
    return;
  }
  await chooseSaveLocation();
}

async function openNotesFile() {
  if (!canLinkFile()) return;
  try {
    const [handle] = await window.showOpenFilePicker({ types: pickerTypes(), multiple: false });
    await rememberHandle(handle);
    await pullFile({ force: true });
    setStatus("Opened " + handle.name + " on this laptop. The other Mac sees it after Google sign-in.");
  } catch (error) {
    if (error.name !== "AbortError") setStatus(error.message || "Could not open the file");
  }
}

async function connectFile() {
  if (!state.fileHandle) return openNotesFile();
  const options = { mode: "readwrite" };
  const granted = (await state.fileHandle.requestPermission(options)) === "granted";
  state.fileReady = granted;
  renderFileLabel();
  if (granted) await pullFile({ force: true });
  else setStatus("File access was not allowed");
}

async function writeFile() {
  if (!state.fileHandle || !state.fileReady) return;
  captureActive();
  const payload = envelopeFromState();
  try {
    const writable = await state.fileHandle.createWritable();
    await writable.write(JSON.stringify(payload, null, 2));
    await writable.close();
    persistLocal();
    setStatus("Updated " + state.fileName + " on this laptop only.");
  } catch (error) {
    state.fileReady = false;
    renderFileLabel();
    setStatus("Could not write the file. Click Connect file.");
  }
}

async function pullFile({ force = false } = {}) {
  if (!state.fileHandle || !state.fileReady || state.pulling) return;
  if (!force && Date.now() - state.lastEdit < 1600) return;
  state.pulling = true;
  try {
    const file = await state.fileHandle.getFile();
    const text = await file.text();
    if (!text.trim()) {
      await writeFile();
      return;
    }
    const incoming = JSON.parse(text);
    const local = snapshotForMerge();
    const remote = {
      ...incoming,
      notes: incoming.notes || [],
      deletedIds: incoming.deletedIds || [],
    };
    const merged = mergeState(local, remote);
    const localFp = browserFingerprint(local);
    const mergedFp = browserFingerprint(merged);
    if (localFp === mergedFp && !force) return;
    const activeStillThere = merged.notes.some((note) => note.id === state.activeId);
    applyEnvelope({ ...merged, activeId: activeStillThere ? state.activeId : merged.activeId });
    persistLocal();
    const afterFp = browserFingerprint(envelopeFromState());
    const incomingFp = browserFingerprint(remote);
    if (afterFp !== incomingFp) await writeFile();
    else setStatus("Synced " + state.fileName);
  } catch (error) {
    if (error.name === "NotAllowedError") {
      state.fileReady = false;
      renderFileLabel();
      setStatus("Click Connect file to keep syncing.");
    } else if (error instanceof SyntaxError) {
      setStatus("That file is not a notepad backup.");
    }
  } finally {
    state.pulling = false;
  }
}

function downloadBackup() {
  captureActive();
  const blob = new Blob([JSON.stringify(envelopeFromState(), null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "my-notes.json";
  link.click();
  URL.revokeObjectURL(link.href);
  setStatus("Downloaded my-notes.json");
}

function uploadBackup(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const incoming = JSON.parse(String(reader.result || ""));
      const merged = mergeState(snapshotForMerge(), {
        ...incoming,
        notes: (incoming.notes || []).map(normalizeNote),
        deletedIds: incoming.deletedIds || [],
      });
      applyEnvelope(merged);
      persistLocal();
      if (state.fileReady) writeFile();
      setStatus("Merged backup");
    } catch (error) {
      setStatus("That file is not a notepad backup.");
    }
  };
  reader.readAsText(file);
}

function loadLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    applyEnvelope({
      ...data,
      notes: (data.notes || []).map(normalizeNote),
      deletedIds: data.deletedIds || [],
    }, { render: false });
  } catch (error) {
    setStatus("Saved notes could not be read.");
  }
}

async function restoreHandle() {
  try {
    const handle = await idbGet("file");
    if (!handle) return;
    state.fileHandle = handle;
    state.fileName = handle.name || "notes.json";
    const permission = await handle.queryPermission({ mode: "readwrite" });
    state.fileReady = permission === "granted";
    renderFileLabel();
    if (state.fileReady) await pullFile({ force: true });
  } catch (error) {
    state.fileReady = false;
  }
}

function looksLikeCode(text) {
  if (!text) return false;
  // Code indicators: imports, package, class, function, braces, semicolons, brackets, arrows
  const codePatterns = [
    /\b(package|import|class|interface|fun|val|var|public|private|protected|override|suspend|data object|data class|sealed|const|def|function|return|if|else|for|while)\b/,
    /[{}();]/,
    /=>|->|===|!==/,
  ];
  let matches = 0;
  for (const pat of codePatterns) {
    if (pat.test(text)) matches++;
  }
  return matches >= 2;
}

function tryParseTextTable(text) {
  if (!text) return null;
  // If text looks heavily like programming code, never parse it into a table!
  if (looksLikeCode(text)) return null;

  const rawLines = text.trim().split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
  if (rawLines.length < 2) return null;

  // Check if first line is a title or checklist summary like "Summary Checklist"
  let lines = rawLines;
  let titlePrefix = null;
  if (lines.length >= 3 && !lines[0].includes("\t") && !lines[0].includes("|") && (lines[1].includes("\t") || lines[1].includes("|"))) {
    titlePrefix = lines[0];
    lines = lines.slice(1);
  }

  let table = null;

  // Case 1: Tab-separated (e.g. copied from Excel, Sheets, Notion, or Slack)
  if (lines.some((l) => l.includes("\t"))) {
    const rows = lines.map((line) => line.split("\t"));
    const maxCols = Math.max(...rows.map((r) => r.length));
    if (maxCols >= 2) table = buildTableElement(rows, maxCols);
  }

  // Case 2: Markdown style tables (with | dividers)
  if (!table) {
    const pipeLines = lines.filter((l) => l.includes("|"));
    if (pipeLines.length >= 2 && pipeLines.length >= lines.length - 1) {
      const rawRows = pipeLines
        .filter((l) => !/^\s*\|?[-:\s|]+\|?\s*$/.test(l)) // filter separator rows like |--|--|
        .map((l) => l.replace(/^\|/, "").replace(/\|$/, "").split("|"));
      const maxCols = Math.max(...rawRows.map((r) => r.length));
      if (maxCols >= 2) table = buildTableElement(rawRows, maxCols);
    }
  }

  // Case 3: Multiple spaces (at least 3 spaces separator, consistent across rows)
  if (!table) {
    const spaceRows = lines.map((line) => line.split(/\s{3,}|\t/));
    const multiColRows = spaceRows.filter((r) => r.length >= 2);
    if (multiColRows.length >= 2 && multiColRows.length >= lines.length * 0.7) {
      const maxCols = Math.max(...spaceRows.map((r) => r.length));
      table = buildTableElement(spaceRows, maxCols);
    }
  }

  if (table && titlePrefix) {
    const wrapper = document.createDocumentFragment();
    const h3 = document.createElement("p");
    h3.style.fontWeight = "bold";
    h3.textContent = titlePrefix;
    wrapper.appendChild(h3);
    wrapper.appendChild(table);
    return wrapper;
  }

  return table;
}

function buildTableElement(rows, maxCols) {
  const table = document.createElement("table");
  const tbody = document.createElement("tbody");

  rows.forEach((cols, rowIndex) => {
    const tr = document.createElement("tr");
    for (let i = 0; i < maxCols; i++) {
      const isHeader = rowIndex === 0;
      const cell = document.createElement(isHeader ? "th" : "td");
      cell.textContent = (cols[i] || "").trim();
      tr.appendChild(cell);
    }
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  return table;
}

function insertFragmentAtSelection(fragment) {
  const selection = window.getSelection();
  if (!selection || !selection.rangeCount) {
    els.editor.appendChild(fragment);
    return;
  }
  const range = selection.getRangeAt(0);
  range.deleteContents();
  const lastNode = fragment.lastChild;
  range.insertNode(fragment);
  if (lastNode) {
    const newRange = document.createRange();
    newRange.setStartAfter(lastNode);
    newRange.collapse(true);
    selection.removeAllRanges();
    selection.addRange(newRange);
  }
}

function onEditorPaste(event) {
  event.preventDefault();
  const html = event.clipboardData.getData("text/html");
  const text = event.clipboardData.getData("text/plain");

  // 1. Direct HTML Table pasted
  if (html && /<\s*(table|thead|tbody|tr|td|th)\b/i.test(html)) {
    const cleaned = sanitizeHtml(html);
    const template = document.createElement("template");
    template.innerHTML = cleaned;
    insertFragmentAtSelection(template.content);
    changed();
    return;
  }

  // 2. Structured text table pasted (Tabs, Multiple Spaces, Alternating Rows, or Markdown | pipes)
  if (text) {
    const tableEl = tryParseTextTable(text);
    if (tableEl) {
      const fragment = document.createDocumentFragment();
      fragment.appendChild(tableEl);
      const trailingP = document.createElement("p");
      trailingP.appendChild(document.createElement("br"));
      fragment.appendChild(trailingP);
      insertFragmentAtSelection(fragment);
      changed();
      return;
    }
  }

  // 3. Formatted HTML blocks
  if (html) {
    const cleaned = sanitizeHtml(html);
    const hasBlock = /<\s*(div|p|blockquote|pre|h[1-6]|ul|ol|li)\b/i.test(cleaned);
    let inserted = false;
    if (!hasBlock) {
      inserted = document.execCommand("insertHTML", false, cleaned);
    }
    if (!inserted) {
      const template = document.createElement("template");
      template.innerHTML = cleaned;
      insertFragmentAtSelection(template.content);
    }
    changed();
    return;
  }

  // 4. Fallback plain text
  if (text) {
    insertPlainLines(text);
    changed();
  }
}

function insertPlainLines(text) {
  const inserted = document.execCommand("insertText", false, text);
  if (!inserted) {
    const fragment = document.createDocumentFragment();
    const lines = text.split(/\r?\n/);
    lines.forEach((line, index) => {
      if (index > 0) fragment.appendChild(document.createElement("br"));
      if (line) fragment.appendChild(document.createTextNode(line));
    });
    insertFragmentAtSelection(fragment);
  }
}

function loadGoogleScript() {
  if (window.google && google.accounts && google.accounts.oauth2) return Promise.resolve();
  if (loadGoogleScript.promise) return loadGoogleScript.promise;
  loadGoogleScript.promise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Google sign-in could not load. Check the internet connection."));
    document.head.append(script);
  });
  return loadGoogleScript.promise;
}

function ensureTokenClient() {
  if (tokenClient) return;
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: state.google.clientId,
    scope: "https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email",
    callback: (response) => {
      const pending = tokenPromise;
      tokenPromise = null;
      if (!pending) return;
      if (response.error) pending.reject(new Error(response.error_description || response.error));
      else {
        state.google.token = response.access_token;
        state.google.tokenExpires = Date.now() + (Number(response.expires_in) || 3500) * 1000;
        pending.resolve();
      }
    },
  });
}

function requestGoogleToken(prompt) {
  ensureTokenClient();
  if (tokenPromise && tokenPromise.prompt === prompt) return tokenPromise.promise;
  let settle;
  const promise = new Promise((resolve, reject) => {
    settle = { resolve, reject };
  });
  tokenPromise = { promise, prompt, resolve: settle.resolve, reject: settle.reject };
  tokenClient.requestAccessToken(prompt ? { prompt } : {});
  return promise;
}

async function ensureFreshToken() {
  if (state.google.token && Date.now() < state.google.tokenExpires - 60000) return;
  await requestGoogleToken("");
}

async function driveError(response) {
  try {
    const data = await response.json();
    return (data.error && data.error.message) || ("Drive request failed (" + response.status + ")");
  } catch (error) {
    return "Drive request failed (" + response.status + ")";
  }
}

async function loadGoogleEmail() {
  const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: "Bearer " + state.google.token },
  });
  if (!response.ok) return;
  const data = await response.json();
  state.google.email = data.email || "";
}

async function findDriveFile() {
  const queries = [
    "name = 'my-notes.json' and trashed = false and appProperties has { key='personalNotepad' and value='1' }",
    "name = 'my-notes.json' and trashed = false",
  ];
  for (const q of queries) {
    const response = await fetch("https://www.googleapis.com/drive/v3/files?spaces=drive&fields=files(id,name,modifiedTime)&orderBy=modifiedTime desc&q=" + encodeURIComponent(q), {
      headers: { Authorization: "Bearer " + state.google.token },
    });
    if (!response.ok) throw new Error(await driveError(response));
    const data = await response.json();
    if (data.files && data.files.length) return data.files[0].id;
  }
  return "";
}

async function multipartUpload(fileId, metadata, payload) {
  const boundary = "-------personal_notepad_boundary_" + Math.random().toString(36).slice(2);
  const delimiter = "\r\n--" + boundary + "\r\n";
  const closeDelimiter = "\r\n--" + boundary + "--";

  const body =
    delimiter +
    "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
    JSON.stringify(metadata) +
    delimiter +
    "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
    payload +
    closeDelimiter;

  const url = fileId
    ? "https://www.googleapis.com/upload/drive/v3/files/" + fileId + "?uploadType=multipart&fields=id"
    : "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id";

  const response = await fetch(url, {
    method: fileId ? "PATCH" : "POST",
    headers: {
      Authorization: "Bearer " + state.google.token,
      "Content-Type": "multipart/related; boundary=" + boundary,
    },
    body,
  });

  if (!response.ok) throw new Error(await driveError(response));
  const data = await response.json();
  return data.id || fileId;
}

async function uploadDrive() {
  if (!state.google.token || driveWriting) return;
  if (state.pulling) {
    clearTimeout(driveTimer);
    driveTimer = setTimeout(() => uploadDrive(), 500);
    return;
  }
  driveWriting = true;
  try {
    await ensureFreshToken();
    captureActive();
    if (!state.google.fileId) state.google.fileId = await findDriveFile();
    const payload = JSON.stringify(envelopeFromState());
    if (!state.google.fileId) {
      state.google.fileId = await multipartUpload(null, {
        name: "my-notes.json",
        mimeType: "application/json",
        appProperties: { personalNotepad: "1" },
      }, payload);
      setStatus("Created my-notes.json in Drive");
    } else {
      try {
        await multipartUpload(state.google.fileId, {
          name: "my-notes.json",
          mimeType: "application/json",
        }, payload);
      } catch (error) {
        if (!/not found|404/i.test(error.message || "")) throw error;
        state.google.fileId = await multipartUpload(null, {
          name: "my-notes.json",
          mimeType: "application/json",
          appProperties: { personalNotepad: "1" },
        }, payload);
      }
      setStatus("Saved to Drive");
    }
    renderDrive();
  } catch (error) {
    console.error("Drive upload error:", error);
    setStatus(error.message || "Could not save to Drive");
  } finally {
    driveWriting = false;
  }
}

async function pullDrive({ force = false } = {}) {
  if (!state.google.token || state.pulling || driveWriting) return;
  if (!force && Date.now() - state.lastEdit < 1600) return;
  state.pulling = true;
  try {
    await ensureFreshToken();
    if (!state.google.fileId) state.google.fileId = await findDriveFile();
    if (!state.google.fileId) {
      if (force) setStatus("No notes file found on Drive yet. Click Save to Drive.");
      return;
    }
    const response = await fetch("https://www.googleapis.com/drive/v3/files/" + state.google.fileId + "?alt=media", {
      headers: { Authorization: "Bearer " + state.google.token },
    });
    if (response.status === 404) {
      state.google.fileId = "";
      await uploadDrive();
      return;
    }
    if (!response.ok) throw new Error(await driveError(response));
    const text = await response.text();
    if (!text.trim()) {
      await uploadDrive();
      return;
    }
    const incoming = JSON.parse(text);
    const local = snapshotForMerge();
    const remote = { ...incoming, notes: incoming.notes || [], deletedIds: incoming.deletedIds || [] };
    const merged = mergeState(local, remote);
    const localFp = browserFingerprint(local);
    const mergedFp = browserFingerprint(merged);
    if (localFp === mergedFp && !force) return;
    const activeStillThere = merged.notes.some((note) => note.id === state.activeId);
    applyEnvelope({ ...merged, activeId: activeStillThere ? state.activeId : merged.activeId });
    persistLocal();
    if (browserFingerprint(envelopeFromState()) !== browserFingerprint(remote)) await uploadDrive();
    else setStatus("Synced from Drive");
  } catch (error) {
    console.error("Drive pull error:", error);
    setStatus(error.message || "Could not read Drive");
  } finally {
    state.pulling = false;
  }
}

function saveClientId() {
  const value = ($("clientId").value || "").trim();
  if (!value.endsWith(".apps.googleusercontent.com")) {
    setStatus("Paste the Web client ID ending in .apps.googleusercontent.com");
    $("driveSetup").open = true;
    return;
  }
  state.google.clientId = value;
  localStorage.setItem("personal-notepad-google-client", value);
  tokenClient = null;
  setStatus("Client ID saved. Sign in with Google.");
  renderDrive();
}

async function signInGoogle() {
  const typed = ($("clientId").value || "").trim();
  if (typed.endsWith(".apps.googleusercontent.com")) {
    state.google.clientId = typed;
    localStorage.setItem("personal-notepad-google-client", typed);
    tokenClient = null;
  }
  if (!state.google.clientId) {
    $("driveSetup").open = true;
    setStatus("Paste the Google client ID first.");
    return;
  }
  if (location.protocol === "file:") {
    setStatus("Open Notepad with Start Notepad. The address must be http://127.0.0.1:8765.");
    return;
  }
  try {
    setStatus("Opening Google sign-in...");
    await loadGoogleScript();
    ensureTokenClient();
    await requestGoogleToken("select_account");
    await loadGoogleEmail();
    state.google.fileId = await findDriveFile();
    if (state.google.fileId) await pullDrive({ force: true });
    else await uploadDrive();
    renderDrive();
    setStatus("Signed in as " + (state.google.email || "Google") + ". Notes are in Drive.");
  } catch (error) {
    const message = error.message || "Google sign-in failed";
    if (/access_denied/i.test(message)) {
      setStatus("Google blocked sign-in. On the OAuth consent screen, add " + (state.google.email || "your Gmail") + " as a test user, then sign in again.");
    } else {
      setStatus(message);
    }
  }
}

function signOutGoogle() {
  const token = state.google.token;
  if (token && window.google && google.accounts && google.accounts.oauth2) {
    google.accounts.oauth2.revoke(token, () => {});
  }
  state.google.token = "";
  state.google.tokenExpires = 0;
  state.google.email = "";
  state.google.fileId = "";
  renderDrive();
  setStatus("Signed out. Sign in again to save to Drive.");
}

function toggleSidebar(force) {
  const app = document.querySelector(".app");
  const isCollapsed = force !== undefined ? !force : app.classList.toggle("sidebar-collapsed");
  if (force !== undefined) {
    app.classList.toggle("sidebar-collapsed", isCollapsed);
  }
  const expandBtn = $("expandSidebar");
  if (expandBtn) expandBtn.hidden = !isCollapsed;
  try {
    localStorage.setItem("personal-notepad-sidebar-collapsed", isCollapsed ? "1" : "0");
  } catch (e) {}
}

function bind() {
  const collapseBtn = $("collapseSidebar");
  if (collapseBtn) collapseBtn.addEventListener("click", () => toggleSidebar(false));
  const expandBtn = $("expandSidebar");
  if (expandBtn) expandBtn.addEventListener("click", () => toggleSidebar(true));

  $("newWrite").addEventListener("click", () => createNote("write"));
  $("emptyWrite").addEventListener("click", () => createNote("write"));
  $("newCode").addEventListener("click", () => createNote("code"));
  $("emptyCode").addEventListener("click", () => createNote("code"));
  $("saveClientId").addEventListener("click", saveClientId);
  $("googleSignIn").addEventListener("click", signInGoogle);
  $("driveSync").addEventListener("click", () => {
    setStatus("Syncing from Drive...");
    pullDrive({ force: true });
  });
  $("driveSave").addEventListener("click", () => uploadDrive());
  $("googleSignOut").addEventListener("click", signOutGoogle);
  $("saveFile").addEventListener("click", saveOrUpdate);
  $("openFile").addEventListener("click", openNotesFile);
  els.search.addEventListener("input", renderList);
  els.title.addEventListener("input", changed);
  els.editor.addEventListener("input", changed);
  els.editor.addEventListener("paste", onEditorPaste);
  els.editor.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" || event.shiftKey || event.metaKey || event.ctrlKey || event.isComposing) return;
    if (breakOutOfLayout()) event.preventDefault();
  });
  els.codeInput.addEventListener("input", changed);
  els.codeInput.addEventListener("scroll", () => {
    els.codeHighlight.scrollTop = els.codeInput.scrollTop;
    els.codeHighlight.scrollLeft = els.codeInput.scrollLeft;
  });
  els.codeInput.addEventListener("keydown", (event) => {
    if (event.key !== "Tab") return;
    event.preventDefault();
    const start = els.codeInput.selectionStart;
    const end = els.codeInput.selectionEnd;
    const value = els.codeInput.value;
    els.codeInput.value = value.slice(0, start) + "  " + value.slice(end);
    els.codeInput.selectionStart = els.codeInput.selectionEnd = start + 2;
    changed();
  });
  els.sheet.addEventListener("mousedown", (event) => {
    const note = activeNote();
    if (!note || event.target !== els.sheet) return;
    if (note.kind === "write") els.editor.focus();
    else els.codeInput.focus();
  });
  document.addEventListener("selectionchange", () => {
    if (paintSpan && document.activeElement && document.activeElement.type === "color") return;
    paintSpan = null;
    rememberEditorSelection();
    updateCodeButton();
  });
  document.addEventListener("keydown", (event) => {
    const meta = event.metaKey || event.ctrlKey;
    if (!meta) return;
    const key = event.key.toLowerCase();
    if (key === "s") {
      event.preventDefault();
      if (state.google.token) uploadDrive();
      if (state.fileHandle || !state.google.token) saveOrUpdate();
    } else if (key === "b") {
      event.preventDefault();
      toggleSidebar();
    } else if (key === "n" && event.shiftKey) {
      event.preventDefault();
      createNote("code");
    } else if (key === "n") {
      event.preventDefault();
      createNote("write");
    }
  });
  window.addEventListener("pagehide", () => {
    captureActive();
    persistLocal();
    if (state.fileReady) writeFile();
  });
}

function init() {
  els.status = $("status");
  els.syncHelp = $("syncHelp");
  els.fileLabel = $("fileLabel");
  els.search = $("search");
  els.noteList = $("noteList");
  els.empty = $("empty");
  els.workspace = $("workspace");
  els.title = $("title");
  els.meta = $("meta");
  els.toolbar = $("toolbar");
  els.sheet = $("sheet");
  els.placeholder = $("placeholder");
  els.editor = $("editor");
  els.codeShell = $("codeShell");
  els.codeHighlight = $("codeHighlight");
  els.codeInput = $("codeInput");
  state.google.clientId = localStorage.getItem("personal-notepad-google-client") || "";
  renderHelp();
  loadLocal();
  bind();
  try {
    if (localStorage.getItem("personal-notepad-sidebar-collapsed") === "1") {
      toggleSidebar(false);
    }
  } catch (e) {}
  renderAll();
  restoreHandle();
  setInterval(() => {
    if (state.fileReady) pullFile();
    if (state.google.token && state.google.fileId) pullDrive();
  }, 8000);
}

document.addEventListener("DOMContentLoaded", init);
