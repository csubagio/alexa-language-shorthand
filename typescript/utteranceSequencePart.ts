import {UtteranceAlternate} from "./uterranceAlternate";
import {UtteranceSequence} from "./utteranceSequence";
import {UtteranceSlot} from "./utteranceSlot";
import {UtteranceText} from "./utteranceText";

export type UtteranceSequencePart = UtteranceText | UtteranceAlternate | UtteranceSequence | UtteranceSlot;