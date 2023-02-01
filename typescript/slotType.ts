import chalk from "chalk";
import {ASKSlotType, ASKSlotValue} from "./askModel";
import {Intent} from "./intent";
import {ParserContext} from "./parserContext";




export class SlotValue {
  name: string;
  synonyms: string[] = [];
  
  constructor( line: string ) {
    // expect alternates to be separated by |
    let parts = line.split('|');
    this.name = parts[0].trim();
    for ( let i=1; i<parts.length; ++i ) {
      let s = parts[i].trim();
      if ( s ) {
        this.synonyms.push( s );
      }
    }
  }
  
  logSummary() {
    if ( this.synonyms.length > 0 ) {
      console.log(`    ${chalk.yellow(this.name)} or ${this.synonyms.join('/')}`);
    } else {
      console.log(`    ${chalk.yellow(this.name)}`);
    }
  }
  
  toAskSlotValue(): ASKSlotValue {
    const res: ASKSlotValue = {
      name: {
        value: this.name
      }
    }
    
    if ( this.synonyms.length > 0 ) {
      res.name.synonyms = this.synonyms.slice(0);
    }

    return res;
  }
  
  getRandom(): string {
    if ( this.synonyms.length === 0 || Math.random() * this.synonyms.length < 1 ) {
      return this.name;
    }
    
    let i = Math.floor( Math.random() * this.synonyms.length );
    return this.synonyms[i];
  }
}



/**
 * a SlotType defines a single kind of slot used in a language model
 * it defines a series of possible values that the user might say
 * and will be referred to later by an intent to type its slots.
 */
export class SlotType {
  values: Record<string, SlotValue> = {};
  references: Intent[] = [];
  readonly lineNumber: number;
  
  constructor( readonly pc: ParserContext, public name: string ) {
    this.lineNumber = pc.lineNumber;
  }
  
  addValue( line: string ): SlotValue {
    let value = new SlotValue(line);
    this.values[value.name] = value;
    return value;
  }
  
  logSummary() {
    console.log(`SLOT TYPE  ${chalk.cyan(this.name)}`);
    for ( let name in this.values ) {
      this.values[name].logSummary();
    }
  }
  
  processCommand( line: string ) {
    this.pc.error(`unrecognized command: ${line}`);
  }
  
  validate() {
    if ( Object.keys(this.values).length === 0 ) {
      this.pc.errorAt( this.lineNumber, `slot type ${this.name} has no values`);
    }
    
    // todo check additional ASK constraints
  }
  
  getRandomValue() {
    const keys = Object.keys( this.values );
    if ( keys.length === 0 ) {
      return "NOVALUE";
    }
    
    const i = Math.floor( Math.random() * keys.length );
    return this.values[keys[i]].getRandom();
  }
  
  toASKSlotType(): ASKSlotType {
    const res: ASKSlotType = {
      name: this.name,
      values: []
    };
    
    for ( let name in this.values ) {
      res.values.push(this.values[name].toAskSlotValue());
    }
    
    return res;
  }
}