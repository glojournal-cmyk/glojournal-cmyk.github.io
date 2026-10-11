/* Phase 8B themed expeditions. Self-contained, Year 7–8 review questions only.
   Theme is locked on the first submitted answer; old saved Star Maps stay Physics. */
export const THEMES={
 physics:{title:"The Lost Observatory",subject:"Physics",icon:"✦",prize:"Observatory Star Map",intro:"Restore the observatory and reveal the missing stars.",chapters:["Light the lanterns","Decode the signal","Awaken the telescope","Reveal the constellation"]},
 french:{title:"The Moonlit Masquerade",subject:"French",icon:"☾",prize:"Moonlit Masquerade Seal",intro:"Decode four invitations before the midnight ball.",chapters:["Find the invitation","Decode the message","Speak the password","Open the ballroom"]},
 chemistry:{title:"The Alchemist’s Atelier",subject:"Chemistry",icon:"⚗",prize:"Alchemist’s Golden Sigil",intro:"Recover four missing ingredients and reopen the atelier.",chapters:["Unlock the cabinet","Purify the mixture","Read the elements","Finish the elixir"]},
 biology:{title:"The Secret Cell Laboratory",subject:"Biology",icon:"❋",prize:"Cell Detective Emblem",intro:"Investigate four mysteries hidden inside a living cell.",chapters:["Enter the laboratory","Find the nucleus","Inspect the membrane","Solve the cell mystery"]}
};
const q=(stage,title,prompt,options,answer,skill,hint)=>({stage,title,prompt,options,answer,skill,hint});
export function themedTasks(theme){
 if(theme==="french")return[
 q(0,"The secret greeting","What does « bonjour » mean?",["Hello","Goodbye","Please"],"Hello","french:vocab:greetings","It is a daytime greeting."),
 q(0,"The invitation","What does « samedi » mean?",["Saturday","Sunday","Monday"],"Saturday","french:vocab:days","Think about the day after vendredi."),
 q(1,"The missing word","Complete: « Je ___ pas de frère. »",["n'ai","ai","ne suis"],"n'ai","french:negatives","Use ne … pas around avoir."),
 q(1,"A secret comparison","What does « plus grand que » mean?",["Taller than","Smaller than","As tall as"],"Taller than","french:comparatives","Plus ... que means more ... than."),
 q(2,"The password","Choose the French for « I am thirteen years old ».",["J'ai treize ans","Je suis treize ans","J'ai trois ans"],"J'ai treize ans","french:age","Age uses avoir."),
 q(2,"The hidden opinion","What does « parce que » mean?",["Because","But","Sometimes"],"Because","french:opinions","It introduces a reason."),
 q(3,"The final invitation","Choose the correct translation: « I went to Paris ».",["Je suis allée à Paris","Je vais à Paris","J'irai à Paris"],"Je suis allée à Paris","french:past","Past with aller uses être."),
 q(3,"Open the ballroom","What does « je voudrais » mean?",["I would like","I must","I used to"],"I would like","french:polite","A polite conditional expression.")];
 if(theme==="chemistry")return[
 q(0,"The locked cabinet","What is the smallest part of an element?",["An atom","A compound","A mixture"],"An atom","chemistry:atoms","Elements consist of one type of atom."),
 q(0,"The first key","Which particle has a negative charge?",["Electron","Proton","Neutron"],"Electron","chemistry:atomic-structure","Electrons move around the nucleus."),
 q(1,"The separated pigments","What technique can separate dyes in ink?",["Chromatography","Filtration","Crystallisation"],"Chromatography","chemistry:chromatography","Different dyes travel different distances."),
 q(1,"The clear liquid","How can insoluble sand be removed from water?",["Filtration","Evaporation","Distillation"],"Filtration","chemistry:separation","A filter traps insoluble solids."),
 q(2,"A coded symbol","What is the chemical symbol for sodium?",["Na","S","So"],"Na","chemistry:periodic-table","It comes from natrium."),
 q(2,"The hidden group","Which group contains the noble gases?",["Group 0","Group 1","Group 7"],"Group 0","chemistry:periodic-table","These gases have full outer shells."),
 q(3,"The mystery mixture","In chromatography, what is the baseline drawn with?",["Pencil","Pen","Paint"],"Pencil","chemistry:practical","Graphite does not dissolve in the solvent."),
 q(3,"The golden sigil","What is the Rf value formula?",["Distance moved by substance ÷ distance moved by solvent front","Solvent ÷ substance","Mass ÷ volume"],"Distance moved by substance ÷ distance moved by solvent front","chemistry:rf","Rf is a ratio of two distances.")];
 if(theme==="biology")return[
 q(0,"The first specimen","Which instrument lets us see most cells?",["Microscope","Telescope","Thermometer"],"Microscope","biology:microscopy","Cells are often too small for the naked eye."),
 q(0,"The laboratory label","Which structure controls a cell's activities?",["Nucleus","Cell wall","Ribosome"],"Nucleus","biology:nucleus","It contains genetic material."),
 q(1,"The energy clue","Where does aerobic respiration mostly occur?",["Mitochondria","Chloroplasts","Vacuole"],"Mitochondria","biology:mitochondria","These organelles release energy."),
 q(1,"The building block","Which structure is the site of protein synthesis?",["Ribosomes","Nucleus","Cell wall"],"Ribosomes","biology:ribosomes","Small particles in the cytoplasm."),
 q(2,"The protective gate","What controls what enters and leaves a cell?",["Cell membrane","Cytoplasm","Nucleus"],"Cell membrane","biology:membrane","It is partially permeable."),
 q(2,"The plant specimen","Which structure provides support in a plant cell?",["Cell wall","Mitochondrion","Ribosome"],"Cell wall","biology:plant-cells","Made mainly of cellulose."),
 q(3,"The green clue","Where does photosynthesis occur?",["Chloroplasts","Nucleus","Cell membrane"],"Chloroplasts","biology:chloroplasts","Contains chlorophyll."),
 q(3,"The final finding","Which cells usually contain a permanent vacuole?",["Plant cells","Animal red blood cells","Bacterial cells only"],"Plant cells","biology:vacuole","The large vacuole contains cell sap.")];
 return null;
}
export function themeFor(row){return THEMES[row?.theme]?row.theme:"physics";}
