import {Intent} from "./intent";
import {Model} from "./model";
import {ParserContext} from "./parserContext";
import {UtteranceAlternate} from "./uterranceAlternate";
import {UtteranceSequencePart} from "./utteranceSequencePart";
import {UtteranceSlot} from "./utteranceSlot";
import {UtteranceText} from "./utteranceText";


export class UtteranceSequence {
  parts: UtteranceSequencePart[] = [];
  parsedText: string = "";
  
  get isEmpty() { return this.parts.length === 0 };
  
  constructor( public pc: ParserContext, readonly intent: Intent, text?: string ) {
    if ( text ) {
      this.parse( text );
    }
  }
    
  
  pushText( text: string ) {
    text = text.trim();
    if ( text.length === 0 ) {
      return;
    }
    this.pushItem(new UtteranceText(text));
  }
  
  pushItem( item: UtteranceSequencePart ) {
    let last = this.parts[this.parts.length-1];
    if ( !(last instanceof UtteranceAlternate) ) {
      last = new UtteranceAlternate(this.pc, this.intent);
      this.parts.push( last );
    }
    last.pushItem(item);
  }
  
  parse( text: string ) {
    this.parsedText = text;
    text = text.trim();
    let head = 0;
    let depth = 0;
    
    /* scan through each character in this input, looking for 
      features like alternation groups, alternates, and slots.
      To support recursion, we only recognize features at our 
      level, and otherwise collect all characters to pass to our
      descendants.
    */
    
    for ( let i=0; i<text.length; ++i ) {
      let c = text[i];
      if ( depth === 0 ){
        if ( c === '{' ) {
          this.pushText(text.substring(head,i));
          head = i + 1;
        }
        if ( c === '}' ) {
          this.pushItem( new UtteranceSlot(this.pc, this.intent, text.substring(head, i)) );
          head = i + 1;
        }
      }
      
      if ( c === '(' ) {
        if ( depth === 0 ) {
          if ( head < i ) {
            this.pushText(text.substring(head,i));
          }
          head = i + 1;
        }
        depth ++;
      }
      if ( c === ')' ) {
        if ( depth === 1 ) {
          this.pushItem( new UtteranceSequence(this.pc, this.intent, text.substring(head, i)) );
          head = i + 1;
        }
        depth --;
      }
      
      if ( c === '|' ) {
        if ( depth === 0 ) {
          this.pushText(text.substring(head,i));
          head = i + 1;
          let last = this.parts[this.parts.length-1];
          if ( last instanceof UtteranceAlternate ) {
            last.startAlternate();
          }
        }
      }
    }
    if ( head < text.length ) {
      this.pushText(text.substring(head, text.length));
    }
  }
  
  trim() {
    this.parts = this.parts.map( p => p.trim() );
    this.parts = this.parts.filter( p => !p.isEmpty );
    if ( this.parts.length === 1 ) {
      return this.parts[0];
    }
    return this;
  }
  
  get alternateCount(): number {
    let count = 1;
    this.parts.forEach( p => count = count * p.alternateCount );
    return count;
  }
  
  logDebug(indent: string) {
    console.log(`${indent}SEQ ${this.parsedText} ${this.alternateCount}x`);
    this.parts.forEach( p => p.logDebug(indent + '. ') );
  }
  
  summary() : string { 
    return this.parts.map(p => p.summary()).join(' ');
  }
  
  pickRandom(): string {
    return this.parts.map( p => p.pickRandom() ).join(' ');
  }
  
  generateUtterances(list: string[][]): string[][] {
    this.parts.forEach( p => {
      list = p.generateUtterances( list );
    })
    return list;
  }
  
  generateSamples(list: string[][]): string[][] {
    this.parts.forEach( p => {
      list = p.generateSamples( list );
    })
    return list;
  }
  
  validate(intent: Intent) {
    this.parts.forEach( p => p.validate(intent) );
  }
  
  collectSlotNames(names: Record<string, number>) {
    this.parts.forEach( p => p.collectSlotNames(names) );
  }
}
