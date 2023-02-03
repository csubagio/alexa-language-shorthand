"use strict";
/**
 * dummy during development to work with the types
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.post = exports.pre = exports.parseAlexaRequest = void 0;
///////// EXCLUDE FROM TEMPLATE
const sampleSlotValues = {
    "red": [
        "reds"
    ],
    "green": [
        "greens"
    ],
    "blue": [
        "blues"
    ]
};
const intentSlotMapping = {
    "anIntent": {
        "aSlot": sampleSlotValues
    }
};
///////// 
function parseAlexaRequest(request) {
    if (!request || typeof (request) !== 'object') {
        return { name: "_InvalidInput", request, slots: {} };
    }
    if (request.type !== "IntentRequest") {
        return { name: "_NotIntent", request, slots: {} };
    }
    // we can uniformly convert any intent into our format
    // which will conform to the types we've defined
    // when they're recognized
    const result = {
        name: request.intent.name,
        request,
        slots: {}
    };
    if (request.intent.slots) {
        const slotMapping = intentSlotMapping[result.name] || {};
        for (const slotName in request.intent.slots) {
            const slot = request.intent.slots[slotName];
            result.slots[slotName] = {
                value: undefined,
                raw: slot.value,
                slot,
                asNumber: () => {
                    const v = parseFloat(slot.value || '');
                    if (isNaN(v))
                        return undefined;
                    return v;
                }
            };
            // try to find an exact match for one of our defined slots
            // there may not be one, in which case value remains undefined
            if (slotMapping[slotName]) {
                // map for quick case insensitive searching
                const valueMap = {};
                Object.keys(slotMapping[slotName]).forEach(v => valueMap[v.toLowerCase()] = v);
                const valueKeys = (Object.keys(valueMap));
                // is it the top level slot value?
                let test = (slot.value || "").toLowerCase();
                if (slot.value && valueKeys.indexOf(test) >= 0) {
                    result.slots[slotName].value = valueMap[test];
                }
                else {
                    // no? dig into the resolution authorities then
                    if (slot.resolutions && slot.resolutions.resolutionsPerAuthority) {
                        slot.resolutions.resolutionsPerAuthority.forEach(auth => {
                            for (const authVal of auth.values) {
                                test = authVal.value.name.toLowerCase();
                                if (valueKeys.indexOf(test) >= 0) {
                                    result.slots[slotName].value = valueMap[test];
                                    break;
                                }
                            }
                        });
                    }
                }
            }
        }
    }
    return result;
}
exports.parseAlexaRequest = parseAlexaRequest;
/**
 * Template we're tack onto the generated typescript file
 */
exports.pre = `
import * as ASK from "ask-sdk-model"

/** Slot information parsed from an Alexa IntentRequest */
interface Slot<ValueType> {
  /** The original ASK SDK Slot value */
  slot: ASK.Slot;
  
  /** The slot's top level value as a string */  
  raw?: string;

  /** When this slot is a custom slot type, this is explicitly that type's generated enum and will be undefined if any other value is recognized */
  value?: ValueType;
  
  /** helper that wraps parsing the raw value as number, returns undefined if the slot does not contain one */
  asNumber: () => number | undefined;
}

/** All custom slot types get a yourSlotTypeNameValues object below that contains all your value and synonym strings */
type SlotValues = Record< string, string[] >;

interface GenericIntent {
  name: string;
  request: ASK.Request;
  slots: Record<string, Slot<string>>;
}

type IntentSlotMapping = Record<string, Record< string, SlotValues > >;
`.trim();
exports.post = `

export function parseAlexaRequest( request: ASK.Request ): Intents {
  if ( !request || typeof(request) !== 'object' ) {
    return { name: "_InvalidInput", request, slots: {} };
  }
  
  if ( request.type !== "IntentRequest" ) {
    return { name: "_NotIntent", request, slots: {} };
  }

  // we can uniformly convert any intent into our format
  // which will conform to the types we've defined
  // when they're recognized
  let result = {
    name: request.intent.name,
    request,
    slots: {}
  } as any as Intents;
  
  if ( request.intent.slots ) {
    const slotMapping = intentSlotMapping[result.name] || {};
    
    for ( const slotName in request.intent.slots ) {
      const slot: ASK.Slot = request.intent.slots[slotName];
      result.slots[slotName] = {
        value: undefined,
        raw: slot.value,
        slot,
        asNumber: (): number|undefined => {
          const v = parseFloat(slot.value || '');
          if ( isNaN(v) ) return undefined;
          return v;
        }
      }
      
      // try to find an exact match for one of our defined slots
      // there may not be one, in which case value remains undefined
      if ( slotMapping[slotName] ) {
        // map for quick case insensitive searching
        const valueMap: Record<string,string> = {};
        Object.keys(slotMapping[slotName]).forEach( v => valueMap[v.toLowerCase()] = v );
        const valueKeys = (Object.keys(valueMap));
        
        // is it the top level slot value?
        let test = (slot.value || "").toLowerCase();
        if ( slot.value && valueKeys.indexOf(test) >= 0 ) {
          result.slots[slotName].value = valueMap[test];
        } else {
          // no? dig into the resolution authorities then
          if ( slot.resolutions && slot.resolutions.resolutionsPerAuthority ) {
            slot.resolutions.resolutionsPerAuthority.forEach( auth => {
              for ( const authVal of auth.values ) {
                test = authVal.value.name.toLowerCase();
                if ( valueKeys.indexOf(test) >= 0 ) {
                  result.slots[slotName].value = valueMap[test];
                  break;
                }
              }
            });
          }
        }
      }
    }
  }
  
  return result;
}
`.trim();
