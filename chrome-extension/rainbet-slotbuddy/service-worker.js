const BONUS_HUNT_API = "https://xbogfbyysrjttyfvzluh.supabase.co/functions/v1/slotbuddy-bonus-hunt";
const COZIES_API = "https://xbogfbyysrjttyfvzluh.supabase.co/functions/v1/cozies-bonus-tracker";

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "slotbuddy-session" && typeof message.session === "string" && message.session.length > 10) {
    chrome.storage.local.set({ slotbuddySession: message.session, slotbuddySessionSavedAt: Date.now() })
      .then(() => sendResponse({ ok: true }));
    return true;
  }

  if (message?.type === "slotbuddy-disconnect") {
    chrome.storage.local.remove(["slotbuddySession", "slotbuddySessionSavedAt"])
      .then(() => sendResponse({ ok: true }));
    return true;
  }

  if (message?.type === "slotbuddy-add-game") {
    (async () => {
      const { slotbuddySession } = await chrome.storage.local.get("slotbuddySession");
      if (!slotbuddySession) {
        sendResponse({ ok: false, error: "Connect SlotBuddy first. Open either SlotBuddy page and sign in with Kick." });
        return;
      }
      const destination = message.destination === "cozies" ? "cozies" : "bonus_hunt";
      const isCozies = destination === "cozies";
      const endpoint = isCozies ? COZIES_API : BONUS_HUNT_API;
      const payload = isCozies
        ? { action: "queue-add", session_key: slotbuddySession, username: message.username, game_name: message.gameName }
        : { session_key: slotbuddySession, username: message.username, game_name: message.gameName };
      const url = isCozies ? endpoint : endpoint + "?action=queue-add";
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.error || data.ok !== true) {
        if (response.status === 403) {
          await chrome.storage.local.remove(["slotbuddySession", "slotbuddySessionSavedAt"]);
        }
        sendResponse({ ok: false, error: data.error || "SlotBuddy could not add that game." });
        return;
      }
      sendResponse({ ok: true, message: data.message || (isCozies ? "Game added to your Cozies queue!" : "Game added to your Bonus Hunt queue!") });
    })().catch(error => sendResponse({ ok: false, error: error?.message || "Something went wrong." }));
    return true;
  }
});