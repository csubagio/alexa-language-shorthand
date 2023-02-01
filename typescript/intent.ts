import chalk from "chalk";
import {ASKIntent, ASKIntentSlot, ASKSlotType} from "./askModel";
import {Model} from "./model";
import {ParserContext} from "./parserContext";
import {Utterance} from "./utterance";
import {UtteranceSlot} from "./utteranceSlot";


/**
 * Metadata to describe the properties of a named slot within an intent
 */
export class IntentSlotInfo {
  lineNumber: number;
  references: UtteranceSlot[] = [];
  
  constructor( readonly pc: ParserContext, public name: string, public type: string ) {
    this.lineNumber = pc.lineNumber;
  }
  
  logSummary() {
    console.log(`     slot ${chalk.greenBright(this.name)} : ${chalk.cyan(this.type)}`);
  }
  
  toASKIntentSlot(): ASKIntentSlot {
    return {
      name: this.name,
      type: this.type
    }
  }
}


/**
 * An Intent is a single unit of recognition at Alexa, 
 * containing a list of sample utterances, and descriptions
 * of slots used by them.
 */
export class Intent {
  utterances: Utterance[] = [];
  slotsTypes: Record<string, IntentSlotInfo> = {};
  lineNumber: number;
  fallbackSensitivity = "MEDIUM";
  utteranceLimit = 2000;
  
  constructor( readonly pc: ParserContext, readonly model: Model, readonly name: string ) {
    this.lineNumber = pc.lineNumber;
  }
  
  countAllUtteranceVariations() {
    let sum = 0;
    this.utterances.forEach( u => sum += u.alternateCount );
    return sum;
  }
  
  addUtterance( line: string ) {
    this.utterances.push( new Utterance(this.pc, this, line) );
  }
  
  logSummary() {
    console.log(`INTENT ${chalk.cyan(this.name)} ${this.countAllUtteranceVariations()} utterances`);
    for ( let n in this.slotsTypes ) {
      this.slotsTypes[n].logSummary();
    }
    for ( let u of this.utterances ) {
      u.logSummary();
    }
  }
  
  processCommand( line: string ) {
    // commands are lines beginning with `+` that add information to an object
    // on a prior line
    
    // todo: 
    // * match a little more permissively to catch errors, 
    // * validate ASK requirements
    // Match: + slotName as slotType
    const slotTypeMatch = line.match( /(\w+)\s+as\s+([\w\.]+)/i );
    if ( slotTypeMatch ) {
      const name = slotTypeMatch[1];
      const type = slotTypeMatch[2];
      if ( name in this.slotsTypes ) {
        this.pc.error(`duplicate slot type definition ${name} for intent ${this.name}`);
        return;
      }
      this.slotsTypes[name] = new IntentSlotInfo( this.pc, name, type );
      return;
    }
    
    // Match: + fallback sensitivity medium
    const fallbackMatch = line.match( /fallback\s+sensitivity\s+(\w+)/ );
    if ( fallbackMatch ) {
      if ( this.name !== 'AMAZON.FallbackIntent' ) {
        this.pc.error(`fallback sensitivity only applies to AMAZON.FallbackIntent`);
        return;
      }
      const sensitivity = fallbackMatch[1].toUpperCase();
      if ( ["HIGH", "MEDIUM", "LOW"].indexOf(sensitivity) < 0 ) {
        this.pc.error(`unknown fallback sensitivity ${sensitivity}, must be LOW, MEDIUM or HIGH`);
        return;
      }
      this.fallbackSensitivity = sensitivity;
      return;
    }

    // Match: + utterance limit 1000
    const limitMatch = line.match( /utterance\s+limit\s+(\d+)/ );
    if ( limitMatch ) {
      let limit = parseInt( limitMatch[1]);
      if ( isNaN(limit) ) {
        this.pc.error(`invalid number encountred in utterance limit statement`);
        return;
      }
      this.utteranceLimit = limit;
      return;
    }
    
    this.pc.error(`unknown command ${line}`);
  }
  
  validate(model: Model) {
    if ( this.utterances.length === 0 ) {
      // built in utterances are allowed to be empty, their definition 
      // comes from the ASK
      if ( this.name.indexOf('AMAZON.') < 0 ) {
        this.pc.warnAt(this.lineNumber, `intent ${this.name} has no utterances`);
      }
    }
    
    for ( let u of this.utterances ) {
      u.validate( this );
    }
    
    for ( let name in this.slotsTypes ) {
      let slot = this.slotsTypes[name];
      if ( !model.isValidSlotType(slot.type, this) ) {
        this.pc.errorAt(slot.lineNumber, `unknown slot type ${slot.type}`);
      }
      if ( slot.references.length === 0 ) {
        // an unused slot definition is sketchy, could be an indicator of a typo
        this.pc.warnAt(slot.lineNumber, `unused slot definition ${slot.name}`);
      }
    }
  }
  
  addSlotReference( utteranceSlot: UtteranceSlot ) {
    // called by utterances during parsing, to let the intent know what slots are used
    const name = utteranceSlot.name;
    const slot = this.slotsTypes[name];
    if ( slot ) {
      slot.references.push( utteranceSlot );
    } else {
      this.pc.errorAt( utteranceSlot.lineNumber, `slot ${utteranceSlot.name} is not defined in the intent`);
    }
  }
  
  getRandomSlotValue(slotName: string): string {
    let slot = this.slotsTypes[slotName];
    if ( !slot ) {
      return "BADSLOT";
    }
    return this.model.getRandomSlotValue(slot.type);
  }
  
  generateUtterances() {
    let samples: string[] = [];
    for ( let u of this.utterances ) {
      samples = samples.concat( u.generateAll() );
    }

    // in the case that we have more utterances than we want to upload to 
    // the ASK, we'll cut them down by selecting a subset randomly. 
    // we select randomly to preserve as much diversity in the samples
    // as possible.
    if ( samples.length > this.utteranceLimit ) {
      let all = samples;
      samples = [];
      let rnd = mulberry32(0);
      for ( let i=0; i<this.utteranceLimit; ++i ) {
        let i = Math.floor( rnd() * all.length );
        samples.push( all[i] );
        all.splice(i,1);
      }
    }
    
    return samples;
  }
  
  toASKIntent() : ASKIntent {
    let res: ASKIntent = {
      name: this.name,
      samples: this.generateUtterances()
    };

    let slots: ASKIntentSlot[] = [];
    for ( let name in this.slotsTypes ) {
      slots.push( this.slotsTypes[name].toASKIntentSlot() );
    }
    if ( slots.length > 0 ) {
      res.slots = slots;
    }
    
    return res;
  }
}



function mulberry32(a: number) {
  return function() {
    var t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}