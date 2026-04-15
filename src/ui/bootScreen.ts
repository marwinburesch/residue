import { BOOT_LINES, BOOT_LINE_MS } from "../data/narrative.ts";
import { SAVE_KEY } from "./storage.ts";

export function showBootScreen(): Promise<void> {
  return new Promise((resolve) => {
    const hasSave = safeHasSave();
    const overlay = document.createElement("div");
    overlay.className = "boot-screen";
    overlay.innerHTML = `
      <div class="boot-inner">
        <pre class="boot-log" aria-live="polite"></pre>
        <button type="button" class="boot-begin" disabled>
          ${hasSave ? "[ Resume shift ]" : "[ Begin shift ]"}
        </button>
      </div>
    `;
    document.body.appendChild(overlay);

    const logEl = overlay.querySelector<HTMLElement>(".boot-log")!;
    const btn = overlay.querySelector<HTMLButtonElement>(".boot-begin")!;

    let i = 0;
    const tick = () => {
      if (i < BOOT_LINES.length) {
        logEl.textContent += (i === 0 ? "" : "\n") + BOOT_LINES[i];
        i++;
        setTimeout(tick, BOOT_LINE_MS);
      } else {
        btn.disabled = false;
        btn.focus();
      }
    };
    setTimeout(tick, BOOT_LINE_MS);

    btn.addEventListener("click", () => {
      overlay.classList.add("boot-screen--leaving");
      setTimeout(() => overlay.remove(), 200);
      resolve();
    });
  });
}

function safeHasSave(): boolean {
  try {
    return localStorage.getItem(SAVE_KEY) !== null;
  } catch {
    return false;
  }
}
