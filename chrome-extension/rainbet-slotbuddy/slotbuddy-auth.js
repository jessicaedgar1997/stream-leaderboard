(() => {
  let sent = "";
  const sendSession = () => {
    try {
      const session = localStorage.getItem("slotbuddy_kick_session");
      if (session && session !== sent) {
        sent = session;
        chrome.runtime.sendMessage({ type: "slotbuddy-session", session }).catch(() => {});
      }
    } catch {}
  };
  sendSession();
  const poll = setInterval(() => {
    sendSession();
    if (sent) clearInterval(poll);
  }, 1200);
  window.addEventListener("focus", sendSession);
  window.addEventListener("pageshow", sendSession);
  window.addEventListener("storage", event => {
    if (event.key === "slotbuddy_kick_session") sendSession();
  });
})();