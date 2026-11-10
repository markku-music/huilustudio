(function(){
  'use strict';
  const $=id=>document.getElementById(id),games=window.PELIMAAILMA_GAMES,api=window.Pelimaailma;
  const client=new api.Client(window.PELIMAAILMA_FIREBASE_CONFIG),cards=new Map(),states=new Map();
  let stops=[],dialogStop=null;
  const element=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el};
  const format=value=>new Intl.NumberFormat('fi-FI',{maximumFractionDigits:1}).format(value);
  const valueNode=row=>{const el=element('div','value',format(row.scoreValue));el.append(element('span','unit',row.scoreUnit));return el};
  function person(row){const el=element('div');el.append(element('div','player',row.playerName),element('div','instrument',row.instrumentName||''));return el}
  function rankRow(row,index){const el=element('div','rank-row');el.append(element('span','rank',String(index+1)),person(row),valueNode(row));return el}
  function showRanks(target,rows){target.replaceChildren(...rows.map(rankRow));if(!rows.length)target.append(element('p','empty','Ensimmäinen tulos odottaa vielä tekijäänsä.'))}
  function connectionStatus(){
    const values=[...states.values()],failed=values.find(s=>s.error),el=$('connection');
    if(failed){el.dataset.state='error';$('connectionText').textContent=api.message(failed.error);return}
    if(values.some(s=>s.loading)){$('connectionText').textContent='Haetaan tuloksia…';el.dataset.state='loading';return}
    const cache=values.some(s=>s.fromCache);el.dataset.state=cache?'cache':'live';
    $('connectionText').textContent=cache?'Näytetään välimuistin tuloksia. Odotetaan verkkoyhteyttä.':'● Tulokset päivittyvät automaattisesti';
  }
  function subscribe(key,options,render,onFailure){
    states.set(key,{loading:true});
    const stop=client.watch(options,(rows,meta)=>{states.set(key,meta);render(rows);connectionStatus()},error=>{states.set(key,{error});onFailure(api.message(error));connectionStatus()});stops.push(stop);
  }
  for(const game of games){
    const card=element('article','game-card'+(game.connected?'':' future'));card.style.setProperty('--accent',game.color);
    const head=element('div','game-heading'),icon=element('div','game-icon',game.icon);icon.setAttribute('aria-hidden','true');
    head.append(icon,element('h3','',game.name),element('p','game-description',game.description));
    const body=element('div','card-body');cards.set(game.id,body);card.append(head,body);
    if(game.connected){const button=element('button','card-footer','Kaikki tulokset →');button.type='button';button.addEventListener('click',()=>openBoard(game));card.append(button)}
    else body.append(element('span','waiting-badge','Liitetään myöhemmin'));
    $('games').append(card);
  }
  function recentRows(rows){
    $('recentStatus').hidden=rows.length>0;$('recentStatus').textContent='Tallennetut suoritukset ilmestyvät tähän.';$('recentCount').textContent=rows.length?rows.length+' suoritusta':'';
    $('recentRows').replaceChildren(...rows.map(row=>{
      const game=games.find(g=>g.id===row.gameId),el=element('div','recent-row'),label=element('div','recent-game',game?.name||row.gameId);
      if(game?.boardId&&game.boardId!==row.boardId)label.append(element('span','version','Aiempi peliversio'));
      const date=row.createdAt?.toDate?.(),time=element('time','recent-time',date?new Intl.DateTimeFormat('fi-FI',{day:'numeric',month:'numeric',hour:'2-digit',minute:'2-digit'}).format(date):'Aika vahvistuu');if(date)time.dateTime=date.toISOString();
      const icon=element('div','recent-icon',game?.icon||'♫');icon.setAttribute('aria-hidden','true');el.append(icon,person(row),label,valueNode(row),time);return el;
    }));
  }
  function stop(){stops.forEach(unsubscribe=>unsubscribe());stops=[]}
  function start(){
    stop();states.clear();
    if(!api.configured(window.PELIMAAILMA_FIREBASE_CONFIG)){
      $('connection').dataset.state='setup';$('connectionText').textContent='Yhteinen tulospalvelu odottaa käyttöönottoa. Pelit toimivat jo.';$('refresh').hidden=true;
      games.filter(g=>g.connected).forEach(g=>cards.get(g.id).replaceChildren(element('p','empty','Tulostaulu avautuu käyttöönoton jälkeen.')));
      $('recentStatus').textContent='Uusimmat suoritukset näkyvät tässä käyttöönoton jälkeen.';return;
    }
    for(const game of games.filter(g=>g.connected)){
      subscribe(game.id,{gameId:game.id,boardId:game.boardId,count:3},rows=>showRanks(cards.get(game.id),rows),message=>cards.get(game.id).replaceChildren(element('p','empty',message)));
    }
    subscribe('recent',{recent:true,count:20},recentRows,message=>{$('recentStatus').hidden=false;$('recentStatus').textContent=message});connectionStatus();
  }
  function openBoard(game){
    dialogStop?.();$('dialogTitle').textContent=game.name;$('dialogRows').replaceChildren();$('dialogStatus').textContent='Haetaan tuloksia…';$('fullBoard').showModal();
    dialogStop=client.watch({gameId:game.id,boardId:game.boardId,count:50},(rows,meta)=>{showRanks($('dialogRows'),rows);$('dialogStatus').textContent=meta.fromCache?'Välimuistin tulokset. Odotetaan verkkoyhteyttä.':'Päivitetty · '+rows.length+' suoritusta'},error=>{$('dialogStatus').textContent=api.message(error)});
  }
  $('closeBoard').addEventListener('click',()=>$('fullBoard').close());$('fullBoard').addEventListener('close',()=>{dialogStop?.();dialogStop=null});
  $('refresh').addEventListener('click',start);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){stop();if($('fullBoard').open)$('fullBoard').close()}else start()});
  window.addEventListener('pagehide',()=>{stop();dialogStop?.()});window.addEventListener('pageshow',event=>{if(event.persisted)start()});start();
})();
