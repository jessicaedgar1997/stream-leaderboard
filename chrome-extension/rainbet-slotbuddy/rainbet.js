function cleanGameName(value) {
  return String(value || "")
    .replace(/\s*[|–—-]\s*Rainbet.*$/i, "")
    .replace(/^play\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function findGameName() {
  const selectors = [
    '[data-testid*="game-title"]',
    '[data-testid*="game-name"]',
    '[class*="game-title"]',
    '[class*="GameTitle"]',
    'main h1',
    '[role="dialog"] h1',
    'h1'
  ];
  for (const selector of selectors) {
    const node = document.querySelector(selector);
    const text = cleanGameName(node?.textContent);
    if (text && !/^(casino|slots|live casino|rainbet)$/i.test(text) && text.length <= 80) return text;
  }
  const title = cleanGameName(document.title);
  if (title && !/^(casino|slots|live casino|rainbet)$/i.test(title) && title.length <= 80) return title;

  const parts = location.pathname.split("/").filter(Boolean);
  const last = parts[parts.length - 1] || "";
  if (last && !/^(casino|slots|games)$/i.test(last)) {
    return decodeURIComponent(last).replace(/[-_]+/g, " ").replace(/\b\w/g, c => c.toUpperCase()).slice(0, 80);
  }
  return "";
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "slotbuddy-get-game") {
    chrome.storage.local.get("slotbuddyAddonEnabled").then(({ slotbuddyAddonEnabled = true }) => {
      sendResponse(slotbuddyAddonEnabled ? { gameName: findGameName(), pageTitle: document.title } : { gameName: "", disabled: true });
    });
    return true;
  }
});