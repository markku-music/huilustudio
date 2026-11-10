/* All leaderboard work starts from a player action, after/outside playing. */
(()=>{
  'use strict';
  const $=id=>document.getElementById(id),api=window.MehulasitBoard;
  const client=new api.Client(window.PELIMAAILMA_FIREBASE_CONFIG);
  const saveDialog=$('saveScoreDialog'),boardDialog=$('leaderboardDialog'),saveButton=$('saveScoreBtn'),form=$('saveScoreForm');
  const nameInput=$('scorePlayerName'),instrumentInput=$('scoreInstrument'),submitButton=$('submitScoreBtn');
  const saveStatus=$('saveScoreStatus'),boardStatus=$('leaderboardStatus'),rows=$('leaderboardRows'),refreshButton=$('refreshBoardBtn');
  let current=null,lastSavedId=null,loading=false;
  const nameKey='mehulasit-scoreboard:player',instrumentKey='mehulasit-scoreboard:instrument';
  for(const name of api.INSTRUMENTS){const option=document.createElement('option');option.value=name;option.textContent=name;instrumentInput.appendChild(option)}
  instrumentInput.value='Huilu';
  try{nameInput.value=api.cleanName(localStorage.getItem(nameKey));const instrument=localStorage.getItem(instrumentKey);if(api.INSTRUMENTS.includes(instrument))instrumentInput.value=instrument}catch{}
  function status(element,text='',error=false){element.textContent=text;element.dataset.error=String(error)}
  function setResult(result){
    current=result?{result:JSON.parse(JSON.stringify(result)),id:api.newId(),saved:false,saving:false,identity:null}:null;
    saveButton.disabled=!current;saveButton.textContent='Tallenna';
    if(saveDialog.open)saveDialog.close();
  }
  function showSave(){
    if(!current||current.saved)return;
    const job=current;
    status(saveStatus);submitButton.disabled=job.saving;
    nameInput.disabled=instrumentInput.disabled=Boolean(job.identity);
    if(job.identity){nameInput.value=job.identity.name;instrumentInput.value=job.identity.instrument}
    saveDialog.showModal();if(!nameInput.disabled)nameInput.focus();
  }
  function render(results){
    rows.replaceChildren();let previous=null,rank=0;
    results.forEach((result,index)=>{
      if(previous!==result.rawPoints)rank=index+1;previous=result.rawPoints;
      const tr=document.createElement('tr');tr.dataset.current=String(result.id===lastSavedId);
      const cells=[String(rank),api.cleanName(result.playerName),String(result.points),(result.timeMs/1000).toFixed(1).replace('.',',')+' s',String(result.breathTotal)];
      cells.forEach((value,i)=>{const td=document.createElement('td');td.textContent=value;if(i===1){const small=document.createElement('small');small.textContent=result.instrumentName;td.appendChild(small)}tr.appendChild(td)});
      rows.appendChild(tr);
    });
  }
  async function refresh(){
    if(loading)return;loading=true;refreshButton.disabled=true;status(boardStatus,'Haetaan tuloksia…');
    try{const results=await client.list();render(results);status(boardStatus,results.length?'':'Tuloksia ei vielä ole. Pelaa ensimmäinen kierros!')}
    catch(error){status(boardStatus,api.message(error)+(rows.children.length?' Näytössä ovat aiemmin haetut tulokset.':''),true)}
    finally{loading=false;refreshButton.disabled=false}
  }
  function showBoard(){if(!boardDialog.open)boardDialog.showModal();void refresh()}
  for(const button of document.querySelectorAll('[data-close-dialog]'))button.addEventListener('click',()=>button.closest('dialog').close());
  for(const button of document.querySelectorAll('[data-open-board]'))button.addEventListener('click',showBoard);
  refreshButton.addEventListener('click',refresh);saveButton.addEventListener('click',showSave);
  form.addEventListener('submit',async event=>{
    event.preventDefault();const job=current;if(!job||job.saving||job.saved)return;
    const name=api.cleanName(nameInput.value),instrument=instrumentInput.value;
    if(!name){status(saveStatus,'Kirjoita nimimerkki.',true);nameInput.focus();return}
    if(!api.INSTRUMENTS.includes(instrument)){status(saveStatus,'Valitse soitin.',true);return}
    // Freeze the identity too: a retry must refer to exactly the same submitted result.
    job.identity??={name,instrument};job.saving=true;submitButton.disabled=true;nameInput.disabled=instrumentInput.disabled=true;
    status(saveStatus,'Tallennetaan…');
    try{
      const saved=await client.save(job.result,job.identity.name,job.identity.instrument,job.id);job.saved=true;lastSavedId=saved.id;
      try{localStorage.setItem(nameKey,job.identity.name);localStorage.setItem(instrumentKey,job.identity.instrument)}catch{}
      if(current===job){saveButton.textContent='Tallennettu';saveButton.disabled=true;status(saveStatus,'Tulos tallennettu.');if(saveDialog.open){saveDialog.close();showBoard()}}
    }catch(error){if(current===job)status(saveStatus,api.message(error)+' Tulos ei ole vielä vahvistunut tallennetuksi. Yritä uudelleen.',true)}
    finally{job.saving=false;if(current===job){submitButton.disabled=job.saved;}}
  });
  window.MehulasitBoardUI=Object.freeze({setResult});
})();
