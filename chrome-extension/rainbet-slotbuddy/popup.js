const $ = id => document.getElementById(id);
const BONUS_HUNT_URL = "https://jessicaedgar1997.github.io/stream-leaderboard/slotbuddy/bonus-hunt.html";
const COZIES_URL = "https://jessicaedgar1997.github.io/stream-leaderboard/cozies/";
function updateButtonLabel(){ $("addGame").textContent=$("destination").value==="cozies"?"ADD TO COZIES":"ADD TO BONUS HUNT"; }
$("destination").addEventListener("change",updateButtonLabel);
async function refreshAddonState(){
 const {slotbuddyAddonEnabled=true}=await chrome.storage.local.get("slotbuddyAddonEnabled");
 $("toggleAddon").checked=slotbuddyAddonEnabled;
 $("addGame").disabled=!slotbuddyAddonEnabled;
 if(!slotbuddyAddonEnabled)$("status").textContent="SlotBuddy Quick Add is OFF. BonusHunt.gg can be used normally.";
}
$("toggleAddon").addEventListener("change",async()=>{
 const enabled=$("toggleAddon").checked;
 await chrome.storage.local.set({slotbuddyAddonEnabled:enabled});
 $("addGame").disabled=!enabled;
 $("status").textContent=enabled?"SlotBuddy Quick Add is ON again!":"SlotBuddy Quick Add is OFF. BonusHunt.gg can be used normally.";
});
async function refreshConnectionStatus(){
 const {slotbuddySession}=await chrome.storage.local.get("slotbuddySession");
 if(slotbuddySession)$("status").textContent="SlotBuddy is connected. 💗";
 else $("status").textContent="Connect SlotBuddy before adding a game.";
}
async function detectGame(){
 const {slotbuddyAddonEnabled=true}=await chrome.storage.local.get("slotbuddyAddonEnabled");
 if(!slotbuddyAddonEnabled)return;
 const [tab]=await chrome.tabs.query({active:true,currentWindow:true});
 if(!tab?.id||!/^https?:\/\/(www\.)?rainbet\.com\//i.test(tab.url||"")){$("status").textContent="Open a game on Rainbet, then open this extension.";return;}
 try{
  const result=await chrome.tabs.sendMessage(tab.id,{type:"slotbuddy-get-game"});
  if(result?.gameName){$("gameName").value=result.gameName;$("status").textContent="Game detected. Check the name, choose a queue, then add it!";}
  else $("status").textContent="Couldn't detect the game name. You can type it in.";
 }catch{$("status").textContent="Refresh the Rainbet tab, then reopen this extension.";}
}
$("addGame").addEventListener("click",async()=>{
 const gameName=$("gameName").value.trim(),username=$("username").value.trim().replace(/^@/,""),destination=$("destination").value;
 if(!gameName){$("status").textContent="Enter a game name first.";return;}
 if(!/^[a-zA-Z0-9_]{1,25}$/.test(username)){$("status").textContent="Enter a valid Kick username.";return;}
 $("addGame").disabled=true;$("status").textContent="Adding game to "+(destination==="cozies"?"Cozies":"Bonus Hunt")+"…";
 try{const result=await chrome.runtime.sendMessage({type:"slotbuddy-add-game",gameName,username,destination});$("status").textContent=result?.ok?"✓ "+result.message:(result?.error||"Could not add the game.");}
 catch{$("status").textContent="Could not reach SlotBuddy. Try reconnecting.";}
 finally{const {slotbuddyAddonEnabled=true}=await chrome.storage.local.get("slotbuddyAddonEnabled");$("addGame").disabled=!slotbuddyAddonEnabled;}
});
$("connect").addEventListener("click",async()=>{const url=$("destination").value==="cozies"?COZIES_URL:BONUS_HUNT_URL;await chrome.tabs.create({url});$("status").textContent="SlotBuddy opened. Sign in with Kick there, then reopen this extension.";});
$("disconnect").addEventListener("click",async()=>{await chrome.runtime.sendMessage({type:"slotbuddy-disconnect"});$("status").textContent="SlotBuddy disconnected.";});
updateButtonLabel();refreshAddonState();detectGame();refreshConnectionStatus();

const BONUS_API="https://xbogfbyysrjttyfvzluh.supabase.co/functions/v1/slotbuddy-bonus-hunt";
const COZIES_API="https://xbogfbyysrjttyfvzluh.supabase.co/functions/v1/cozies-bonus-tracker";
let queueItems=[];
async function loadQueuedBonuses(){
 const dest=$("destination").value;
 const select=$("queueEntry");
 select.innerHTML='<option value="">Loading queue…</option>';
 try{
  const response=await fetch(dest==="cozies"?COZIES_API:BONUS_API+( "?action=snapshot"));
  const data=await response.json();
  if(!response.ok||data.error)throw new Error(data.error||"Could not load the queue.");
  queueItems=data.queue||[];
  select.innerHTML=queueItems.length?'<option value="">Choose a queued game…</option>': '<option value="">No games waiting in this queue</option>';
  for(const item of queueItems){
   const option=document.createElement("option");
   option.value=String(item.id);
   option.textContent="@"+item.username+" — "+item.game_name;
   select.appendChild(option);
  }
  $("addQueuedBonus").disabled=!queueItems.length;
 }catch(error){select.innerHTML='<option value="">Queue could not load</option>';$("status").textContent=error.message;}
}
$("destination").addEventListener("change",loadQueuedBonuses);
$("refreshQueue").addEventListener("click",loadQueuedBonuses);
$("addQueuedBonus").addEventListener("click",async()=>{
 const item=queueItems.find(x=>String(x.id)===$("queueEntry").value);
 if(!item){$("status").textContent="Choose a queued game first.";return;}
 const spin=$("spinAmount").value;
 if(spin===""){ $("status").textContent="Enter the bet / spin amount.";return;}
 const {slotbuddySession}=await chrome.storage.local.get("slotbuddySession");
 if(!slotbuddySession){$("status").textContent="Connect SlotBuddy and sign in with Kick first.";return;}
 const dest=$("destination").value,isCozies=dest==="cozies";
 const button=$("addQueuedBonus");button.disabled=true;button.textContent="SAVING BONUS…";
 try{
  const payload=isCozies
   ? {action:"add-bonus",session_key:slotbuddySession,caller_name:item.username,bonus_name:item.game_name,spin_amount:spin,payout_amount:$("payoutAmount").value||0,bonus_type:$("bonusType").value,queue_id:item.id}
   : {session_key:slotbuddySession,username:item.username,game_name:item.game_name,spin_amount:spin,payout_amount:$("payoutAmount").value||0,bonus_type:$("bonusType").value,queue_id:item.id,remove_from_queue:true};
  const response=await fetch(isCozies?COZIES_API:BONUS_API+"?action=add",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
  const data=await response.json().catch(()=>({}));
  if(!response.ok||data.error||data.ok===false)throw new Error(data.error||"The bonus could not be saved.");
  $("status").textContent=data.message||"Bonus saved!";
  $("queueEntry").value="";$("spinAmount").value="";$("payoutAmount").value="";
  await loadQueuedBonuses();
 }catch(error){$("status").textContent=error.message||"Could not save the bonus.";}
 finally{button.textContent="ADD BONUS & REMOVE FROM QUEUE";button.disabled=false;}
});
loadQueuedBonuses();
