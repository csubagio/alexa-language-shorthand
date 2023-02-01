import {Intent} from "./intent";
import {Model} from "./model";
import {ParserContext} from "./parserContext";
import {UtteranceSequence} from "./utteranceSequence";
import {UtteranceSequencePart} from "./utteranceSequencePart";

export class UtteranceAlternate {
  alternates: UtteranceSequencePart[] = [];
  
  constructor(public pc: ParserContext, readonly intent: Intent) {}
  
  get isEmpty() { return this.alternates.length === 0 };

  trim() {
    this.alternates = this.alternates.map( a => a.trim() );
    // we never drop empty alternates, they're syntactically intentional
    //this.alternates = this.alternates.filter( a => !a.isEmpty );
    if ( this.alternates.length === 1 ) {
      return this.alternates[0];
    }
    return this;
  }
  
  pushItem( item: UtteranceSequencePart ) {
    let last = this.alternates[this.alternates.length - 1];
    if ( !last || !(last instanceof UtteranceSequence) ) {
      last = new UtteranceSequence(this.pc, this.intent);
      this.alternates.push( last );
    }
    last.parts.push( item );
  }
  
  startAlternate() {
    this.alternates.push( new UtteranceSequence(this.pc, this.intent) );
  }
  
  summary(): string { 
    if ( this.alternates.length != 1 ) {
      return '(' + this.alternates.map( a => a.summary() ).join('|') + ')';
    } else {
      return this.alternates[0].summary();
    }
  }
  
  logDebug(indent: string) {
    console.log(`${indent}ALT ${this.alternateCount}x`);
    for ( let alt of this.alternates ) {
      alt.logDebug(indent + "+ ");
    }
  }
  
  pickRandom(): string {
    let i = Math.floor( Math.random() * this.alternates.length );
    return this.alternates[i].pickRandom();
  }
  
  get alternateCount() { 
    let count = 0;
    this.alternates.forEach( a => count += a.alternateCount );
    return count; 
  }
  
  generateUtterances( list: string[][] ): string[][] {
    let res: string[][] = [];
    for ( let a of this.alternates ) {
      res = res.concat( a.generateUtterances(list) );
    }
    return res;
  }
  
  generateSamples(list: string[][]): string[][] {
    let res: string[][] = [];
    for ( let a of this.alternates ) {
      res = res.concat( a.generateSamples(list) );
    }
    return res;
  }
  
  validate( intent: Intent ) {
    for ( let a of this.alternates ) {
      a.validate(intent);
    }
  }
  
  collectSlotNames(names: Record<string, number>) {
    this.alternates.forEach( a => a.collectSlotNames(names) );
  }
}
