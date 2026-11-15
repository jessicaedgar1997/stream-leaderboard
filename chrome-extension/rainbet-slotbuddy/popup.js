const $ = id => document.getElementById(id);
const BONUS_HUNT_URL = "https://jessicaedgar1997.github.io/stream-leaderboard/slotbuddy/bonus-hunt.html";
const COZIES_URL = "https://jessicaedgar1997.github.io/stream-leaderboard/cozies/";

function updateButtonLabel() {
  $("addGame").textContent = $("destination").value === "cozies" ? "ADD TO COZIES" : "ADD TO BONUS HUNT";
}
$("destination").addEventListener("change", updateButtonLabel);

async function refreshConnectionStatus() {
  const { slotbuddySession } = await chrome.storage.local.get("slotbuddySession");
  if (slotbuddySession) $("status").textContent = "SlotBuddy is connected. 💗";
  else $("status").textContent = "Connect SlotBuddy before adding a game.";
}

async function detectGame() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !/^https?:\/\/(www\.)?rainbet\.com\//i.test(tab.url || "")) {
    $("status").textContent = "Open a game on Rainbet, then open this extension.";
    return;
  }
  try {
    const result = await chrome.tabs.sendMessage(tab.id, { type: "slotbuddy-get-game" });
    if (result?.gameName) {
      $("gameName").value = result.gameName;
      $("status").textContent = "Game detected. Check the name, choose a queue, then add it!";
    } else $("status").textContent = "Couldn't detect the game name. You can type it in.";
  } catch {
    $("status").textContent = "Refresh the Rainbet tab, then reopen this extension.";
  }
}

$("addGame").addEventListener("click", async () => {
  const gameName = $("gameName").value.trim();
  const username = $("username").value.trim().replace(/^@/, "");
  const destination = $("destination").value;
  if (!gameName) { $("status").textContent = "Enter a game name first."; return; }
  if (!/^[a-zA-Z0-9_]{1,25}$/.test(username)) { $("status").textContent = "Enter a valid Kick username."; return; }
  $("addGame").disabled = true;
  $("status").textContent = "Adding game to " + (destination === "cozies" ? "Cozies" : "Bonus Hunt") + "…";
  try {
    const result = await chrome.runtime.sendMessage({ type: "slotbuddy-add-game", gameName, username, destination });
    $("status").textContent = result?.ok ? "✓ " + result.message : (result?.error || "Could not add the game.");
  } catch {
    $("status").textContent = "Could not reach SlotBuddy. Try reconnecting.";
  } finally { $("addGame").disabled = false; }
});

$("connect").addEventListener("click", async () => {
  const url = $("destination").value === "cozies" ? COZIES_URL : BONUS_HUNT_URL;
  await chrome.tabs.create({ url });
  $("status").textContent = "SlotBuddy opened. Sign in with Kick there, then reopen this extension.";
});

$("disconnect").addEventListener("click", async () => {
  await chrome.runtime.sendMessage({ type: "slotbuddy-disconnect" });
  $("status").textContent = "SlotBuddy disconnected.";
});

updateButtonLabel();
detectGame();
refreshConnectionStatus();