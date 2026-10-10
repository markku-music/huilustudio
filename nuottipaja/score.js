const teal='#347f82',orange='#c96944',ink='#22494b',grey='#bac3bc',red='#c8444c';
const stepIndex={C:0,D:1,E:2,F:3,G:4,A:5,B:6};
function pitchY(n,top){return top+60-(n.octave*7+stepIndex[n.step]-(4*7+2))*7.5;}
function midiNote(m){const names=['C','C','D','D','E','F','F','G','G','A','A','B'];return {step:names[m%12],octave:Math.floor(m/12)-1};}
function head(x,y,hollow,color){return `<ellipse cx="${x}" cy="${y}" rx="10" ry="6.5" transform="rotate(-18 ${x} ${y})" fill="${hollow?'#fffefa':color}" stroke="${color}" stroke-width="2.2"/>`;}
function rest(x,top,d,color){return d===2?`<rect x="${x-8}" y="${top+23}" width="16" height="7" fill="${color}"/>`:`<path d="M${x-4} ${top+10}l9 12-9 10 8 10q-14 -2-9 12" fill="none" stroke="${color}" stroke-width="4" stroke-linejoin="round"/>`;}
export function rhythmIcon(d,restFlag=false){return `<svg viewBox="0 0 52 70" aria-hidden="true">${restFlag?rest(26,0,d,'currentColor'):head(19,55,d>=2,'currentColor')+`<path d="M28 55V9" stroke="currentColor" stroke-width="3"/>`}</svg>`;}
export function scoreSVG(song,g,now=Date.now()){
 const rows=Math.ceil(song.measures.length/4),width=1000,height=rows*155+25;let s=`<svg class="score-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${song.title}, yhteinen nuottikuva">`;const positions=[];
 song.measures.forEach((m,mi)=>{const row=Math.floor(mi/4),col=mi%4,top=35+row*155,left=col*240+30,usable=200;for(let l=0;l<5;l++)s+=`<path d="M${left} ${top+l*15}h240" stroke="#82918a" stroke-width="1"/>`;if(col===0){s+=`<text x="${left+4}" y="${top+50}" font-size="55" fill="${grey}">𝄞</text>`;if(row===0)s+=`<text x="${left+41}" y="${top+23}" font-size="21" fill="${grey}">${song.beats}</text><text x="${left+41}" y="${top+49}" font-size="21" fill="${grey}">${song.beatType}</text>`;}
 let beat=0;const total=song.notes.slice(m.start,m.end).reduce((a,n)=>a+n.duration,0),offset=col===0?68:22;for(let i=m.start;i<m.end;i++){const n=song.notes[i],x=left+offset+(usable-offset)*beat/total,y=n.rest?top+30:pitchY(n,top);positions[i]={x,y,top};beat+=n.duration;const p=g.progress.pitch>i,d=g.progress.duration>i,both=p&&d,hc=both?ink:p?teal:grey,dc=both?ink:d?orange:grey;
 if(n.rest)s+=rest(x,top,n.duration,dc);else{for(let ly=top+75;ly<=y;ly+=15)s+=`<path d="M${x-14} ${ly}h28" stroke="${hc}"/>`;for(let ly=top-15;ly>=y;ly-=15)s+=`<path d="M${x-14} ${ly}h28" stroke="${hc}"/>`;s+=head(x,y,n.duration>=2,hc)+`<path d="M${x+9} ${y}v-43" stroke="${dc}" stroke-width="2.6"/>`;if(n.dot)s+=`<circle cx="${x+17}" cy="${y}" r="2.8" fill="${dc}"/>`;}
 if(p&&n.rest)s+=`<circle cx="${x}" cy="${top+78}" r="4" fill="${both?ink:teal}"/>`;
 }s+=`<path d="M${left+240} ${top}v60" stroke="#82918a" stroke-width="${mi===song.measures.length-1?3:1}"/><text x="${left+3}" y="${top-12}" font-size="12" fill="#86968c">${mi+1}</text>`;
 });
 for(const role of ['pitch','duration']){const pos=positions[g.progress[role]];if(!pos)continue;const color=role==='pitch'?teal:orange;s+=`<circle cx="${pos.x}" cy="${pos.top+(role==='pitch'? -5:94)}" r="5" fill="${color}"/>`;if(now-g.wrongAt[role]<950&&g.wrongAt[role]){if(role==='pitch'&&g.wrong.pitch>=0){const yy=pitchY(midiNote(g.wrong.pitch),pos.top);s+=`<g opacity=".75">${head(pos.x+18,yy,false,red)}</g>`;}else if(role==='pitch')s+=`<text x="${pos.x+10}" y="${pos.top+22}" fill="${red}" font-size="24">×</text>`;else s+=`<g transform="translate(${pos.x+16},${pos.top+52}) scale(.5)" color="${red}">${g.wrong.duration<0?rest(26,0,Math.abs(g.wrong.duration),red):head(19,55,Math.abs(g.wrong.duration)>=2,red)+`<path d="M28 55V9" stroke="${red}" stroke-width="3"/>`}</g>`;}}
 return s+'</svg>';
}
export const noteName=midi=>midi==null?'—':['C','C♯','D','E♭','E','F','F♯','G','A♭','A','B♭','H'][midi%12]+(Math.floor(midi/12)-4);
