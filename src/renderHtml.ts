import { environmentBadgeCss, renderEnvironmentBadge } from "./environmentBadge";

export function renderHtml(environment: string | undefined) {
	return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Activity Log</title>
        <link rel="stylesheet" type="text/css" href="https://static.integrations.cloudflare.com/styles.css">
        <style>
          .entry-row { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 0.6rem 0; border-bottom: 1px solid rgba(0, 0, 0, 0.08); }
          .entry-text { margin: 0; }
          .entry-meta { font-size: 0.8rem; opacity: 0.6; }
          .entry-delete { cursor: pointer; border: none; background: none; color: #b91c1c; font-weight: 600; }
          .entry-form { display: flex; gap: 0.5rem; margin: 1rem 0; }
          .entry-form input { flex: 1; padding: 0.5rem; }
          .entry-empty { opacity: 0.6; font-style: italic; }
          .entry-error { display: none; margin: 1rem 0; padding: 0.75rem; border: 1px solid #dc2626; border-radius: 0.35rem; color: #991b1b; background: #fef2f2; }
          .entry-error[data-visible="true"] { display: block; }
          ${environmentBadgeCss}
        </style>
      </head>

      <body>
        <header>
          <img
            src="https://imagedelivery.net/wSMYJvS3Xw-n339CbDyDIA/30e0d3f6-6076-40f8-7abb-8a7676f83c00/public"
          />
          ${renderEnvironmentBadge(environment)}
          <h1>📋 Activity Log</h1>
          <p>Worker + D1 — add and delete entries, backed by a real database.</p>
        </header>
        <main>
          <form id="entry-form" class="entry-form">
            <input id="entry-text" type="text" placeholder="Log an activity…" required maxlength="200" />
            <button type="submit">Add entry</button>
          </form>

          <p id="entry-error" class="entry-error" role="alert" data-visible="false"></p>

          <ul id="entry-list" style="list-style: none; padding: 0; margin: 0;"></ul>

          <small class="blue" style="display: block; margin-top: 1.5rem;">
            <a target="_blank" href="https://developers.cloudflare.com/workers/previews/">Learn about Worker Previews</a>
          </small>
        </main>

        <script>
          const listEl = document.getElementById("entry-list");
          const formEl = document.getElementById("entry-form");
          const inputEl = document.getElementById("entry-text");
          const errorEl = document.getElementById("entry-error");

          function clearError() {
            errorEl.textContent = "";
            errorEl.dataset.visible = "false";
          }

          function showError(message) {
            errorEl.textContent = message;
            errorEl.dataset.visible = "true";
          }

          async function readJson(res) {
            return res.json().catch(() => ({}));
          }

          function renderEntries(entries) {
            listEl.innerHTML = "";
            if (entries.length === 0) {
              const li = document.createElement("li");
              li.className = "entry-empty";
              li.textContent = "No entries yet.";
              listEl.appendChild(li);
              return;
            }
            for (const entry of entries) {
              const li = document.createElement("li");
              li.className = "entry-row";
              li.dataset.id = String(entry.id);

              const textWrap = document.createElement("div");
              const p = document.createElement("p");
              p.className = "entry-text";
              p.textContent = entry.text;
              const meta = document.createElement("p");
              meta.className = "entry-meta";
              meta.textContent = entry.created_at;
              textWrap.appendChild(p);
              textWrap.appendChild(meta);

              const deleteBtn = document.createElement("button");
              deleteBtn.className = "entry-delete";
              deleteBtn.type = "button";
              deleteBtn.textContent = "Delete";
              deleteBtn.addEventListener("click", () => deleteEntry(entry.id));

              li.appendChild(textWrap);
              li.appendChild(deleteBtn);
              listEl.appendChild(li);
            }
          }

          async function loadEntries() {
            const res = await fetch("/api/entries");
            const data = await readJson(res);
            if (!res.ok) {
              showError(data.error || "Could not load entries.");
              return;
            }
            clearError();
            renderEntries(data.entries);
          }

          async function deleteEntry(id) {
            clearError();
            const res = await fetch("/api/entries/" + id, { method: "DELETE" });
            const data = await readJson(res);
            if (!res.ok) {
              showError(data.error || "Delete failed. Your data is unchanged.");
              return;
            }
            renderEntries(data.entries);
          }

          formEl.addEventListener("submit", async (event) => {
            event.preventDefault();
            const text = inputEl.value.trim();
            if (!text) return;
            clearError();
            const res = await fetch("/api/entries", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ text }),
            });
            const data = await readJson(res);
            if (!res.ok) {
              showError(data.error || "Could not add the entry.");
              return;
            }
            inputEl.value = "";
            renderEntries(data.entries);
          });

          loadEntries();
        </script>
      </body>
    </html>
`;
}
