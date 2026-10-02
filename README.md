# NOTEPAD

A personal notepad for notes and code that runs in the browser. Notes are saved in the browser's local storage, with optional Google Drive sync.

## Run it

**macOS:** double-click `Start Notepad.command`. It starts a local server with Python 3 and opens `http://127.0.0.1:8765`.

**Windows:** double-click `Start Notepad.bat`.

**Manually:**

```bash
python3 -m http.server 8765
```

Then open http://127.0.0.1:8765 in your browser.

Use the same address every time, because notes are stored per address in the browser.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Page layout |
| `styles.css` | Styles |
| `app.js` | App logic |
| `Start Notepad.command` | macOS launcher |
| `Start Notepad.bat` | Windows launcher |
