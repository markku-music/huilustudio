import { buildMusicXml } from './musicxml.js';

export class ScoreRenderer {
  #container; #osmd; #rendering=false; #pending=null; #settings={};
  constructor(container){
    this.#container=container;
    const OSMD=window.opensheetmusicdisplay?.OpenSheetMusicDisplay;
    if(!OSMD)throw new Error('OSMD ei latautunut.');
    this.#osmd=new OSMD(container,{backend:'svg',autoResize:true,pageFormat:'A4_P',drawingParameters:'compacttight',drawTitle:true,drawSubtitle:false,drawComposer:true,drawCredits:false,drawPartNames:false,drawMeasureNumbers:false,newSystemFromXML:false,stretchLastSystemLine:false});
    this.#osmd.setPageFormat?.('A4_P');
  }
  setSettings(settings){ this.#settings={...settings}; }
  render(notes){ this.#pending=notes.map(n=>({...n})); if(!this.#rendering)return this.#drain(); }
  async #drain(){ this.#rendering=true; try{ while(this.#pending){ const notes=this.#pending; this.#pending=null; await this.#osmd.load(buildMusicXml(notes,this.#settings)); await this.#osmd.render(); } }catch(error){ console.error('Nuottikuvan renderöinti epäonnistui:',error); }finally{ this.#rendering=false; if(this.#pending)void this.#drain(); } }
}
