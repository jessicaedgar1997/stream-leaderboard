const BONUS_API="https://xbogfbyysrjttyfvzluh.supabase.co/functions/v1/slotbuddy-bonus-hunt";
const COZIES_API="https://xbogfbyysrjttyfvzluh.supabase.co/functions/v1/cozies-bonus-tracker";
function cleanGameName(value){
 return String(value||"").replace(/\\s*[|–—-]\\s*Rainbet.*$/i,"").replace(/^play\\s+/i,"").replace(/\\s+/g," ").trim();
}
function findGameName(){
 const selectors=['[data-testid*="game-title"]','[data-testid*="game-name"]','[class*="game-title"]','[class*="GameTitle"]','main h1','[role="dialog"] h1','h1'];
 for(const selector of selectors){const node=document.querySelector(selector);const value=cleanGameName(node?.textContent);if(value&&!/^(casino|slots|live casino|rainbet)$/i.test(value)&&value.length<=80)return value;}
 const title=cleanGameName(document.title);if(title&&!/^(casino|slots|live casino|rainbet)$/i.test(title)&&title.length<=80)return title;
 const parts=location.pathname.split("/").filter(Boolean),last=parts.at(-1)||"";
 if(last&&!/^(casino|slots|games)$/i.test(last))return decodeURIComponent(last).replace(/[-_]+/g," ").replace(/\\b\\w/g,c=>c.toUpperCase()).slice(0,80);
 return "";
}
chrome.runtime.onMessage.addListener((message,sender,sendResponse)=>{
 if(message?.type==="slotbuddy-get-game"){
  chrome.storage.local.get("slotbuddyAddonEnabled").then(({slotbuddyAddonEnabled=true})=>sendResponse(slotbuddyAddonEnabled?{gameName:findGameName(),pageTitle:document.title}:{gameName:"",disabled:true}));
  return true;
 }
});
(() => {
 if(window.__slotBuddyRainbetWidget)return;window.__slotBuddyRainbetWidget=true;
 const host=document.createElement("div");host.id="slotbuddy-rainbet-widget";document.documentElement.appendChild(host);
 const root=host.attachShadow({mode:"open"});
 root.innerHTML=`
 <style>
 :host{all:initial}*{box-sizing:border-box}
 .launcher{position:fixed;right:18px;bottom:22%;z-index:2147483647;border:1px solid #67e6ff;border-radius:30px;padding:11px 16px;background:linear-gradient(110deg,#17294b,#54234e);color:#fff;font:800 13px Arial;box-shadow:0 5px 24px #0009;cursor:pointer}
 .panel{position:fixed;right:18px;bottom:calc(22% + 52px);z-index:2147483647;width:310px;max-height:75vh;overflow:auto;padding:15px;border:1px solid #536b9a;border-radius:16px;background:#0b1023;color:#f7f8ff;font:13px Arial;box-shadow:0 10px 35px #000c}
 .head{display:flex;justify-content:space-between;align-items:center;color:#ff80d7;font-size:16px;font-weight:900;margin-bottom:8px}
 .close{background:#273655;color:white;border:0;border-radius:8px;padding:5px 9px;cursor:pointer}
 label{display:block;margin:10px 0 5px;color:#cbd8f4;font-weight:700}
 input,select{width:100%;padding:9px;border-radius:8px;border:1px solid #52628c;background:#121d39;color:white;font:13px Arial}
 button.action{width:100%;padding:10px;margin-top:9px;border:0;border-radius:20px;background:linear-gradient(90deg,#35d5ff,#ff39b9);color:#080d1d;font-weight:900;cursor:pointer}
 button:disabled{opacity:.55;cursor:wait}.muted{color:#9eaccb;font-size:11px;line-height:1.4;margin-top:8px}.status{min-height:28px;margin-top:10px;color:#72e4ff;line-height:1.35}
 .toggle{display:flex;align-items:center;gap:8px;font-size:11px;color:#cbd8f4}.toggle input{width:auto}
 </style>
 <button class="launcher" id="open">⚡ SLOTBUDDY</button>
 <section class="panel" id="panel" hidden>
  <div class="head"><span>⚡ SlotBuddy Quick Add</span><button class="close" id="close">✕</button></div>
  <label class="toggle"><input type="checkbox" id="enabled" checked> Quick Add ON</label>
  <label for="dest">Send to</label><select id="dest"><option value="bonus_hunt">Bonus Hunt</option><option value="cozies">Cozies</option></select>
  <label for="game">Current Rainbet game</label><input id="game" maxlength="100">
  <label for="username">Kick username</label><input id="username" maxlength="25" value="jessicaedgar1997">
  <button class="action" id="queueAdd">ADD GAME TO QUEUE</button>
  <hr style="border:0;border-top:1px solid #34415f;margin:14px 0">
  <label for="queued">Game already in queue</label><select id="queued"><option value="">Load queue…</option></select>
  <label for="spin">Bet / spin amount ($)</label><input id="spin" type="number" min="0" step="0.01" placeholder="Required">
  <label for="type">Bonus type</label><select id="type"><option>Regular</option><option>Gamba</option><option>Super</option><option>Epic</option><option>5 Scatters</option></select>
  <label for="payout">Payout amount ($) — optional</label><input id="payout" type="number" min="0" step="0.01" placeholder="0">
  <button class="action" id="addBonus">ADD BONUS & REMOVE FROM QUEUE</button>
  <button class="close" id="refresh" style="width:100%;margin-top:8px">REFRESH QUEUE</button>
  <div class="muted">A queued game is removed only after its bonus is saved successfully. Bonus Hunt and Cozies remain separate.</div>
  <div class="status" id="status">Ready.</div>
 </section>`;
 const $=id=>root.getElementById(id), panel=$("panel");
 $("open").addEventListener("click",()=>{panel.hidden=!panel.hidden;if(!panel.hidden){$("game").value=findGameName();refreshQueue();refreshEnabled();}});
 $("close").addEventListener("click",()=>panel.hidden=true);
 async function refreshEnabled(){const {slotbuddyAddonEnabled=true}=await chrome.storage.local.get("slotbuddyAddonEnabled");$("enabled").checked=slotbuddyAddonEnabled;$("queueAdd").disabled=!slotbuddyAddonEnabled;$("addBonus").disabled=!slotbuddyAddonEnabled;$("status").textContent=slotbuddyAddonEnabled?"Ready.":"SlotBuddy Quick Add is OFF.";}
 $("enabled").addEventListener("change",async()=>{await chrome.storage.local.set({slotbuddyAddonEnabled:$("enabled").checked});refreshEnabled();});
 function endpoint(){return $("dest").value==="cozies"?COZIES_API:BONUS_API;}
 async function loadQueue(){
  const select=$("queued");select.innerHTML='<option value="">Loading queue…</option>';
  try{const isCozies=$("dest").value==="cozies";const response=await fetch(isCozies?COZIES_API:BONUS_API+"?action=snapshot");const data=await response.json();if(!response.ok||data.error)throw Error(data.error||"Could not load queue.");
   const items=data.queue||[];select.innerHTML=items.length?'<option value="">Choose a queued game…</option>':'<option value="">No games waiting</option>';
   for(const item of items){const opt=document.createElement("option");opt.value=String(item.id);opt.textContent="@"+item.username+" — "+item.game_name;select.appendChild(opt);}
   select.dataset.items=JSON.stringify(items);$("status").textContent=items.length?items.length+" game(s) waiting.":"No games waiting in this queue.";
  }catch(e){select.innerHTML='<option value="">Queue unavailable</option>';$("status").textContent=e.message;}
 }
 $("dest").addEventListener("change",loadQueue);$("refresh").addEventListener("click",loadQueue);
 $("queueAdd").addEventListener("click",async()=>{
  const gameName=$("game").value.trim(),username=$("username").value.trim().replace(/^@/,"");
  if(!gameName){$("status").textContent="Enter a game name.";return;}if(!/^[a-zA-Z0-9_]{1,25}$/.test(username)){$("status").textContent="Enter a valid Kick username.";return;}
  const {slotbuddySession,slotbuddyAddonEnabled=true}=await chrome.storage.local.get(["slotbuddySession","slotbuddyAddonEnabled"]);
  if(!slotbuddyAddonEnabled){$("status").textContent="Turn Quick Add ON first.";return;}if(!slotbuddySession){$("status").textContent="Sign in with Kick on your SlotBuddy site first.";return;}
  const button=$("queueAdd");button.disabled=true;
  try{const isCozies=$("dest").value==="cozies";const response=await fetch(isCozies?COZIES_API:BONUS_API+"?action=queue-add",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(isCozies?{action:"queue-add",session_key:slotbuddySession,username,game_name:gameName}:{session_key:slotbuddySession,username,game_name:gameName})});const data=await response.json();if(!response.ok||data.error||data.ok!==true)throw Error(data.error||"Could not add game.");$("status").textContent=data.message||"Game added to queue.";await loadQueue();}
  catch(e){$("status").textContent=e.message;}finally{button.disabled=false;}
 });
 $("addBonus").addEventListener("click",async()=>{
  const items=JSON.parse($("queued").dataset.items||"[]"),item=items.find(x=>String(x.id)===$("queued").value);
  if(!item){$("status").textContent="Choose a queued game.";return;}if($("spin").value===""){$("status").textContent="Enter the bet / spin amount.";return;}
  const {slotbuddySession,slotbuddyAddonEnabled=true}=await chrome.storage.local.get(["slotbuddySession","slotbuddyAddonEnabled"]);
  if(!slotbuddyAddonEnabled){$("status").textContent="Turn Quick Add ON first.";return;}if(!slotbuddySession){$("status").textContent="Sign in with Kick on your SlotBuddy site first.";return;}
  const button=$("addBonus");button.disabled=true;button.textContent="SAVING…";
  try{const isCozies=$("dest").value==="cozies";const payload=isCozies?{action:"add-bonus",session_key:slotbuddySession,caller_name:item.username,bonus_name:item.game_name,spin_amount:$("spin").value,payout_amount:$("payout").value||0,bonus_type:$("type").value,queue_id:item.id}:{session_key:slotbuddySession,username:item.username,game_name:item.game_name,spin_amount:$("spin").value,payout_amount:$("payout").value||0,bonus_type:$("type").value,queue_id:item.id,remove_from_queue:true};
   const response=await fetch(isCozies?COZIES_API:BONUS_API+"?action=add",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});const data=await response.json();if(!response.ok||data.error||data.ok===false)throw Error(data.error||"Could not save bonus.");$("status").textContent=data.message||"Bonus saved."; $("spin").value="";$("payout").value="";await loadQueue();
  }catch(e){$("status").textContent=e.message;}finally{button.disabled=false;button.textContent="ADD BONUS & REMOVE FROM QUEUE";}
 });
 refreshEnabled();
})();
