const API = "https://xbogfbyysrjttyfvzluh.supabase.co/functions/v1/slotbuddy-bonus-hunt";

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
        sendResponse({ ok: false, error: "Connect SlotBuddy first. Open the Bonus Hunt page and sign in with Kick." });
        return;
      }
      const response = await fetch(API + "?action=queue-add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_key: slotbuddySession,
          username: message.username,
          game_name: message.gameName
        })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.error || data.ok !== true) {
        if (response.status === 403) {
          await chrome.storage.local.remove(["slotbuddySession", "slotbuddySessionSavedAt"]);
        }
        sendResponse({ ok: false, error: data.error || "SlotBuddy could not add that game." });
        return;
      }
      sendResponse({ ok: true, message: data.message || "Game added to your Bonus Hunt queue!" });
    })().catch(error => sendResponse({ ok: false, error: error?.message || "Something went wrong." }));
    return true;
  }
});