/**
 * This file contains a brief type description of the 
 * salient parts of the ASK model we'll generate.
 * */ 

export interface ASKIntentSlot {
  name: string;
  type: string;
}

export interface ASKIntent {
  name: string;
  samples: string[];
  slots?: ASKIntentSlot[];
}

export interface ASKSlotName {
  value: string;
  synonyms?: string[];
}

export interface ASKSlotValue {
  id?: string;
  name: ASKSlotName;
}

export interface ASKSlotType {
  name: string;
  values: ASKSlotValue[];
}

export interface ASKLanguageModel {
  invocationName: string;
  intents: ASKIntent[];
  types: ASKSlotType[];  
}

export interface ASKInteractionModel {
  languageModel: ASKLanguageModel;
}

export interface ASKModel {
  interactionModel: ASKInteractionModel;
}