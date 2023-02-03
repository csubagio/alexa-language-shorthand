import * as ASK from "ask-sdk-model"

/** Slot information parsed from an Alexa IntentRequest */
interface Slot<ValueType> {
  /** The original ASK SDK Slot value */
  slot: ASK.Slot;
  
  /** The slot's top level value as a string */  
  raw?: string;

  /** When this slot is a custom slot type, this is explicit that type's generated enum, otherwise it's a string */
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

export enum Color {
  red = "red",
  blue = "blue",
  green = "green",
}

export const ColorValues = {
  "red": [],
  "blue": [],
  "green": []
};

interface FavoriteColorSlots {
  aColor?: Slot<Color>;
}

export interface FavoriteColor {
  name: "FavoriteColor";
  request: ASK.Request;
  slots: FavoriteColorSlots;
}

interface _NotIntent {
  name: "_NotIntent";
  request: ASK.Request;
  slots: Record<string,Slot<string>>;
}

interface _InvalidInput {
  name: "_InvalidInput";
  request: ASK.Request;
  slots: Record<string,Slot<string>>;
}

const intentSlotMapping: IntentSlotMapping = {
  FavoriteColor:{
    aColor: ColorValues
  }
};

type Intents = FavoriteColor | _NotIntent | _InvalidInput;

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
        const values = Object.keys(slotMapping[slotName]);
        // is it the top level slot value?
        if ( slot.value && slot.value in values ) {
          result.slots[slotName].value = slot.value;
        } else {
          // dig into the resolution authorities then
          if ( slot.resolutions && slot.resolutions.resolutionsPerAuthority ) {
            slot.resolutions.resolutionsPerAuthority.forEach( auth => {
              for ( const authVal of auth.values ) {
                if ( authVal.value.name in values ) {
                  result.slots[slotName].value = authVal.value.name;
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