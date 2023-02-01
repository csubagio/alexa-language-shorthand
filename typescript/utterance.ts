import {Intent} from "./intent";
import {ParserContext} from "./parserContext";
import {UtteranceSequence} from "./utteranceSequence";
import {UtteranceSequencePart} from "./utteranceSequencePart";

export class Utterance {
  root: UtteranceSequencePart;
  
  constructor( public pc: ParserContext, readonly intent: Intent, readonly line: string ) {
    this.root = new UtteranceSequence( this.pc, intent, line );
    this.root = this.root.trim();
    //this.logDebug();
  }
  
  logDebug(): void {
    console.log(`utterance: ${this.root.summary()}`);
    this.root.logDebug("  ");
  }
  
  logSummary(): void {
    if ( this.alternateCount > 1 ) {
      console.log(`  ${this.root.summary()} (x ${this.alternateCount})`);
    } else {
      console.log(`  ${this.root.summary()}`);
    }
    if ( this.alternateCount > 1 ) {
      for ( let alt of shuffle(this.generateSamples()).slice(0,5) ) {
        console.log(`    e.g. ${alt}`);
      }
    }
  }
  
  get alternateCount(): number { return this.root.alternateCount }
  
  generateAll(): string[] {
    let res = this.root.generateUtterances([[]]);
    return res.map( r => r.join(' ') );
  }
  
  generateSamples(): string[] {
    let res = this.root.generateSamples([[]]);
    return res.map( r => r.join(' ') );
  }
  
  pickRandom(): string {
    return this.root.pickRandom();
  }
  
  validate(intent: Intent) {
    this.root.validate(intent);
  }

}

function shuffle( arr: any[] ): any[] {
  for ( let i=0; i<arr.length; ++i ) {
    for ( let j=1; j<arr.length; ++j ) {
      if ( Math.random() > 0.5 ) {
        let v = arr[i];
        arr[i] = arr[j];
        arr[j] = v;
      }
    }
  }
  return arr;
}