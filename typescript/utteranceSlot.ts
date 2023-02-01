import chalk from "chalk";
import {Intent} from "./intent";
import {Model} from "./model";
import {ParserContext} from "./parserContext";

export class UtteranceSlot {
  lineNumber: number;
  
  constructor( readonly pc: ParserContext, readonly intent: Intent, readonly name: string ) {
    this.lineNumber = pc.lineNumber;
    this.name = this.name.trim();
  }
  
  summary() { return chalk.greenBright(`{${this.name}}`) }
  
  get isEmpty() { return this.name.length === 0 }
  trim() { return this; }
  
  logDebug(indent: string) {
    console.log(`${indent}{${this.name}}`);
  }
  
  pickRandom() { return `{${this.name}}` }
  
  get alternateCount() { return 1; } 
  
  generateUtterances( list: string[][] ): string[][] {
    return list.map( s => s.concat( [`{${this.name}}`] ) );
  }
  
  generateSamples(list: string[][]): string[][] {
    return list.map( s => s.concat([this.intent.getRandomSlotValue(this.name)]) );
  }
  
  validate( intent: Intent ) {
    intent.addSlotReference( this );
  }
  
  collectSlotNames(names: Record<string, number>) {
    if ( !(this.name in names) ) {
      names[this.name] = 0;
    }
    names[this.name] ++;
  }
}