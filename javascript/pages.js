"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const parser_1 = require("./parser");
const outputDiv = document.getElementById('output');
const inputDiv = document.getElementById('input');
const modelDiv = document.getElementById('model');
// inital input
const sampleInput = `// a super basic example, change me!
INVOCATION hello world

SLOTTYPE Colors
  red | ruby
  green | emerald
  blue | saphire

INTENT MyNameIs
  (my|our) name is {name}
  + name as AMAZON.FIRST_NAME
  
INTENT FavoriteColor
  (my|our) (favorite|best|most loved|obsession) (color|) is {color}
  + color as Colors
  
INTENT AMAZON.FallbackIntent
  + fallback sensitivity medium
`;
// usurp the console to capture the tool output
const oldLog = console.log;
console.log = (...args) => {
    let p = document.createElement('p');
    p.innerText = args.join(' ');
    outputDiv.append(p);
    oldLog.apply(null, args);
};
const oldError = console.error;
console.error = (...args) => {
    let p = document.createElement('p');
    p.innerText = args.join(' ');
    p.classList.add('error');
    outputDiv.append(p);
    oldError.apply(null, args);
};
// function to build the input into the output
let lastInput = '';
function build(input) {
    if (input) {
        lastInput = input;
    }
    try {
        outputDiv.innerText = '';
        const [model, pc] = (0, parser_1.parse)(lastInput);
        if (modelModeIsJSON) {
            modelDiv.innerText = JSON.stringify(model.toASKModel(), null, 2);
        }
        else {
            modelDiv.innerText = model.toTypeScript();
        }
        pc.logErrors();
        pc.logWarnings();
        model.logSummary();
    }
    catch (err) {
        console.error(err);
    }
}
const codemirror_1 = require("codemirror");
const view_1 = require("@codemirror/view");
const language_1 = require("@codemirror/language");
const codeMirror_1 = require("./codeMirror");
const commands_1 = require("@codemirror/commands");
const fixedHeightEditor = codemirror_1.EditorView.theme({
    "&": { height: "100%" },
    ".cm-scroller": { overflow: "auto" }
});
let editor = new codemirror_1.EditorView({
    extensions: [
        codemirror_1.basicSetup,
        codemirror_1.EditorView.lineWrapping,
        fixedHeightEditor,
        view_1.ViewPlugin.fromClass(class {
            update(u) {
                if (!u.docChanged) {
                    return;
                }
                let value = u.state.doc.toString();
                build(value);
            }
        }),
        language_1.StreamLanguage.define(codeMirror_1.alsLang),
        (0, language_1.syntaxHighlighting)(codeMirror_1.alsHighlightStyle),
        view_1.keymap.of([commands_1.indentWithTab]),
    ],
    parent: inputDiv
});
editor.dispatch(editor.state.update({
    changes: { from: 0, insert: sampleInput }
}));
const copyButton = document.getElementById('copy-button');
copyButton.addEventListener('click', () => {
    const text = modelDiv.innerText;
    navigator.clipboard.writeText(text);
    copyButton.innerText = 'copied!';
    setTimeout(() => {
        copyButton.innerText = 'copy';
    }, 3000);
});
let modelModeIsJSON = true;
function setModelMode(json) {
    modelModeIsJSON = json;
    if (json) {
        jsonButton.classList.add('header-button-selected');
        typescriptButton.classList.remove('header-button-selected');
    }
    else {
        jsonButton.classList.remove('header-button-selected');
        typescriptButton.classList.add('header-button-selected');
    }
    build();
}
const jsonButton = document.getElementById('json-button');
jsonButton.addEventListener('click', () => setModelMode(true));
const typescriptButton = document.getElementById('typescript-button');
typescriptButton.addEventListener('click', () => setModelMode(false));
setModelMode(true);
