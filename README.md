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


<img width="1440" height="834" alt="Screenshot 2026-10-03 at 3 44 02 AM" src="https://github.com/user-attachments/assets/fd295266-4b1f-47b1-949d-3cddae0606a5" />
<img width="1440" height="835" alt="Screenshot 2026-10-03 at 3 43 42 AM" src="https://github.com/user-attachments/assets/659503c9-ab49-46e2-9745-eafe96e41ba8" />
<img width="1440" height="833" alt="Screenshot 2026-10-03 at 3 43 18 AM" src="https://github.com/user-attachments/assets/32a24fb5-2eff-4b64-bb9d-7e7333778eb8" />

