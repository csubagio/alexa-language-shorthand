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

export enum UnitType {
  wizard = "wizard",
  horse = "horse",
  tower = "tower",
  sword = "sword",
  thing = "thing",
}

export const UnitTypeValues = {
  "wizard": [
    "wizards",
    "mage",
    "mages",
    "warlock",
    "warlocks",
    "magician",
    "magicians",
    "sorceror",
    "sorcerors"
  ],
  "horse": [
    "horses",
    "officer",
    "officers",
    "knight",
    "knights"
  ],
  "tower": [
    "towers",
    "building",
    "buildings",
    "battlement",
    "battlements",
    "fortress",
    "fotresses"
  ],
  "sword": [
    "swords",
    "knife",
    "knives",
    "soldier",
    "soldiers"
  ],
  "thing": [
    "things",
    "icon",
    "icons",
    "unit",
    "units",
    "piece",
    "pieces"
  ]
};

export enum Location {
  lum_bend = "lum bend",
  gorrick = "gorrick",
  pullum_east = "pullum east",
  pullum_west = "pullum west",
  pullum = "pullum",
  upton_marsh = "upton marsh",
  inspeth = "inspeth",
  flack = "flack",
  dead_coast = "dead coast",
  coast = "coast",
  diffle = "diffle",
  upper_diffle = "upper diffle",
  clelan = "clelan",
  saffid_east = "saffid east",
  saffid_west = "saffid west",
  saffid = "saffid",
  kell_north = "kell north",
  kell_south = "kell south",
  kell_point = "kell point",
  kell = "kell",
  appleham = "appleham",
}

export const LocationValues = {
  "lum bend": [
    "lum",
    "the bend"
  ],
  "gorrick": [],
  "pullum east": [
    "east pullum"
  ],
  "pullum west": [
    "west pullum"
  ],
  "pullum": [],
  "upton marsh": [
    "upton",
    "the marsh",
    "marsh"
  ],
  "inspeth": [],
  "flack": [],
  "dead coast": [],
  "coast": [
    "the coast"
  ],
  "diffle": [],
  "upper diffle": [],
  "clelan": [
    "cleveland",
    "kleelun",
    "cleelan"
  ],
  "saffid east": [
    "saffid island east",
    "east saffid",
    "east saffid island"
  ],
  "saffid west": [
    "saffid island west",
    "west saffid",
    "west saffid island"
  ],
  "saffid": [
    "saffid island"
  ],
  "kell north": [
    "north kell"
  ],
  "kell south": [
    "south kell"
  ],
  "kell point": [
    "point kell"
  ],
  "kell": [
    "kell island"
  ],
  "appleham": []
};

export enum Color {
  red = "red",
  green = "green",
  blue = "blue",
}

export const ColorValues = {
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

export enum Amount {
  single = "single",
  couple = "couple",
  some = "some",
  half = "half",
  many = "many",
  half_dozen = "half dozen",
  dozen = "dozen",
  all = "all",
}

export const AmountValues = {
  "single": [
    "a single"
  ],
  "couple": [
    "a couple",
    "a couple of"
  ],
  "some": [
    "some of the",
    "a few",
    "a few of the"
  ],
  "half": [
    "half of the"
  ],
  "many": [
    "many of the",
    "several",
    "several of the",
    "most",
    "most of the"
  ],
  "half dozen": [
    "a half dozen"
  ],
  "dozen": [],
  "all": [
    "the",
    "all the",
    "all of the",
    "every"
  ]
};

export interface moveUnit {
  name: "moveUnit";
  request: ASK.Request;
  slots: {
    type?: Slot<UnitType>;
    source?: Slot<Location>;
    destination?: Slot<Location>;
    count?: Slot<string>;
    color?: Slot<Color>;
    amount?: Slot<Amount>;
  }
}

export interface moveUnitHere {
  name: "moveUnitHere";
  request: ASK.Request;
  slots: {
    source?: Slot<Location>;
    type?: Slot<UnitType>;
    count?: Slot<string>;
    color?: Slot<Color>;
    amount?: Slot<Amount>;
  }
}

export interface done {
  name: "done";
  request: ASK.Request;
  slots: {
  }
}

export interface AMAZON_YesIntent {
  name: "AMAZON.YesIntent";
  request: ASK.Request;
  slots: {
  }
}

export interface AMAZON_NoIntent {
  name: "AMAZON.NoIntent";
  request: ASK.Request;
  slots: {
  }
}

export interface AMAZON_NavigateHomeIntent {
  name: "AMAZON.NavigateHomeIntent";
  request: ASK.Request;
  slots: {
  }
}

export interface AMAZON_FallbackIntent {
  name: "AMAZON.FallbackIntent";
  request: ASK.Request;
  slots: {
  }
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
  moveUnit:{
    type: UnitTypeValues,
    source: LocationValues,
    destination: LocationValues,
    color: ColorValues,
    amount: AmountValues
  },
  moveUnitHere:{
    source: LocationValues,
    type: UnitTypeValues,
    color: ColorValues,
    amount: AmountValues
  }
};

type Intents = moveUnit | moveUnitHere | done | AMAZON_YesIntent | AMAZON_NoIntent | AMAZON_NavigateHomeIntent | AMAZON_FallbackIntent | _NotIntent | _InvalidInput;

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