import {Intent} from "./intent";
import {Model} from "./model";

export class UtteranceText {
  constructor( public text: string ) {
    this.text = text.trim();
  }
  
  get isEmpty() { return this.text.length === 0 };
  
  trim() {
    return this;
  }
  
  summary() { 
    return this.text;
  }
  
  logDebug(indent: string) {
    console.log(`${indent}"${this.text}"`);
  }
  
  pickRandom() { return this.text; }
  
  get alternateCount() { return 1 }
  
  generateUtterances( list: string[][] ): string[][] {
    return list.map( s => s.concat( [this.text] ) );
  }
  
  generateSamples(list: string[][]): string[][] {
    return list.map( s => s.concat([this.text]) );
  }
  
  validate( intent: Intent ) {}
  
  collectSlotNames(names: Record<string, number>) {}
}