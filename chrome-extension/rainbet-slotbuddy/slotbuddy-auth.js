(() => {
  const sendSession = () => {
    try {
      const session = localStorage.getItem("slotbuddy_kick_session");
      if (session) chrome.runtime.sendMessage({ type: "slotbuddy-session", session }).catch(() => {});
    } catch {}
  };
  sendSession();
  window.addEventListener("storage", event => {
    if (event.key === "slotbuddy_kick_session") sendSession();
  });
  setTimeout(sendSession, 1200);
})();