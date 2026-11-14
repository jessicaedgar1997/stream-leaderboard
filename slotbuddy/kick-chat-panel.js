(function(){
"use strict";
const BASE="https://xbogfbyysrjttyfvzluh.supabase.co/functions/v1/kick-connect";
const SESSION="slotbuddy_kick_session";
if(document.getElementById("slotbuddyKickPanel"))return;
const style=document.createElement("style");
style.textContent=`
#slotbuddyKickPanel{max-width:1000px;margin:12px auto 18px;padding:16px 18px;border:1px solid #49345f;border-radius:18px;background:linear-gradient(145deg,#211a3bf2,#131126f5);color:#fffaff;box-shadow:0 10px 28px #0004;font-family:system-ui,sans-serif}
#slotbuddyKickPanel h2{margin:0 0 7px;color:#65dfff;font-size:1.08rem}
#slotbuddyKickPanel p{margin:6px 0;color:#c5bad9;font-size:.9rem;line-height:1.5}
#slotbuddyKickPanel .kick-actions{display:flex;gap:9px;flex-wrap:wrap;margin-top:11px}
#slotbuddyKickPanel button{border:0;border-radius:999px;padding:10px 15px;font-weight:900;cursor:pointer;background:linear-gradient(100deg,#65dfff,#fff,#ff4fc8);color:#130d22}
#slotbuddyKickPanel button.secondary{background:#241a3a;color:white;border:1px solid #73538f}
#slotbuddyKickPanel button:disabled{opacity:.5;cursor:not-allowed}
#slotbuddyKickStatus{min-height:1.4em}
@media(max-width:560px){#slotbuddyKickPanel{margin:10px 12px;padding:14px}}
`;
document.head.appendChild(style);
const panel=document.createElement("section");
panel.id="slotbuddyKickPanel";
panel.innerHTML='<h2>🔗 SlotBuddy + Kick Chat</h2><p id="slotbuddyKickStatus" role="status" aria-live="polite">Checking Kick connection…</p><div class="kick-actions"><button type="button" id="slotbuddyKickConnect">Connect / Reconnect Kick</button><button type="button" class="secondary" id="slotbuddyKickTest" disabled>💬 Send test message</button></div>';
const nav=document.querySelector("nav,.topbar,.hub-nav");
if(nav&&nav.parentNode)nav.insertAdjacentElement("afterend",panel);else document.body.insertBefore(panel,document.body.firstChild);
const status=document.getElementById("slotbuddyKickStatus"),connect=document.getElementById("slotbuddyKickConnect"),test=document.getElementById("slotbuddyKickTest");
async function refresh(){
 try{const r=await fetch(BASE+"?action=status",{cache:"no-store"});const d=await r.json();if(!r.ok)throw new Error(d.error||"Status check failed.");status.textContent=d.connected?"✅ Kick is connected. Chat announcements can be sent from SlotBuddy.":"⚠️ Kick chat is not connected. Connect it here to enable announcements.";test.disabled=!d.connected;}
 catch(e){status.textContent="Couldn't check the Kick connection. Please refresh.";test.disabled=true;}
}
connect.onclick=async()=>{
 const session_key=localStorage.getItem(SESSION)||"";
 if(!session_key){status.textContent="Please sign in with Kick on SlotBuddy first, then return here.";return;}
 status.textContent="Opening Kick authorization…";connect.disabled=true;
 try{const u=new URL(BASE);u.searchParams.set("action","start");u.searchParams.set("session_key",session_key);const r=await fetch(u.toString());const d=await r.json();if(!r.ok||!d.authorize_url)throw new Error(d.error||"Couldn't start Kick authorization.");location.href=d.authorize_url;}
 catch(e){status.textContent=e.message||"Couldn't connect Kick.";connect.disabled=false;}
};
test.onclick=async()=>{
 const session_key=localStorage.getItem(SESSION)||"";
 if(!session_key){status.textContent="Please sign in with Kick first.";return;}
 test.disabled=true;status.textContent="Sending a test message to your Kick chat…";
 try{const r=await fetch(BASE,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"send-test",session_key})});const d=await r.json();status.textContent=r.ok?(d.message||"Test message sent! Check your Kick chat."): (d.error||"Test message failed.");}
 catch(e){status.textContent="Couldn't send the test message. Please try again.";}
 finally{await refresh();}
};
refresh();
})();
