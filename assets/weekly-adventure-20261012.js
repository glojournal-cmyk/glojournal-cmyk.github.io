// New expedition rules are pinned per week; existing started expeditions keep their original bank.
export const STORIES={
 physics:{scenes:['The lantern room is dark. A solar panel outside is still intact.','A copper wire runs from the lantern to a broken signal switch.','The telescope carriage must reach the marked viewing position.','Four words are engraved around the locked star chart.'],clues:['light','current','lens','star'],ending:'The lanterns glow, the signal returns and the telescope reveals a constellation. The observatory is awake.'},
 french:{scenes:['A folded invitation has appeared under the garden gate. Read it to find the meeting day.','The host left a message with a missing negative. Repair it before you enter.','A portrait whispers a question about your age. Reply in French.','Four French words from the invitation form the ballroom password.'],clues:['lune','jardin','cle','bal'],ending:'The invitation unfolds into a silver seal. You decoded the messages and opened the moonlit ballroom.'},
 chemistry:{scenes:['A cabinet contains an atomic diagram and three charged particles.','A spilled sample must be purified before the elixir can be made.','A stained chromatogram holds the final measurement for the recipe.','The four recovered labels spell the atelier’s seal code.'],clues:['atom','filter','ratio','gold'],ending:'The sample is purified and the recipe is restored. A golden sigil lights up above the atelier door.'},
 biology:{scenes:['A tiny specimen waits beside a microscope. The first instrument has been misplaced.','The specimen is active, but you must identify its control centre and energy source.','A plant cell reveals a green compartment and a protective boundary.','The microscope image carries the last word needed to unlock the laboratory emblem.'],clues:['cell','nucleus','leaf','lens'],ending:'Your field notes reveal the specimen’s secrets. The laboratory opens and your Cell Detective Emblem is ready.'}
};
const typed=(stage,title,prompt,accepted,hint,skill)=>({stage,title,prompt,accepted,answer:accepted[0],hint,skill,kind:'typed'});
const sequence=(stage,title,prompt,tokens,hint,skill)=>({stage,title,prompt,tokens,answer:tokens.join(' '),hint,skill,kind:'sequence'});
const choice=(stage,title,prompt,options,answer,hint,skill)=>({stage,title,prompt,options,answer,hint,skill,kind:'choice'});
const number=(stage,title,prompt,numeric,unit,hint,skill)=>({stage,title,prompt,numeric,unit,hint,skill,kind:'number'});
export function adventureTasks(week,theme){
 const seed=[...week].reduce((n,c)=>n+c.charCodeAt(0),0),time=3+seed%3,speed=2+seed%3;
 let tasks;
 if(theme==='physics')tasks=[
 choice(0,'Repair the lantern','Which energy transfer takes place in the solar cell?',['Light → electrical','Electrical → light','Sound → chemical'],'Light → electrical','The panel receives light and supplies electricity.','physics:energy:transfers'),
 typed(0,'The warming room','The lamp gives out light and warms the room. Which energy store increases?',['thermal','thermal energy store','thermal store'],'The room’s temperature rises.','physics:energy:dissipation'),
 typed(1,'Reconnect the signal','The switch is open. Should you open or close it to restore current?',['close','close the switch'],'Current needs a complete circuit.','physics:circuits:current'),
 sequence(1,'Build the signal circuit','Order the path around a simple complete circuit, starting at the battery.',['battery','closed switch','lamp','back to battery'],'Go from the source, through the switch and lamp, then back to the source.','physics:circuits:current'),
 number(2,'Move the telescope',`The carriage travels ${time*speed} m in ${time} s. Calculate speed, with the unit.`,speed,'m/s','Speed = distance ÷ time.','physics:speed:calculation'),
 number(2,'Reach the viewing mark',`At ${speed} m/s, how far does it move in ${time+2} s? Include the unit.`,speed*(time+2),'m','Distance = speed × time.','physics:speed:distance'),
 number(3,'Locate the final star','Stars A and B are at (2, 4) and (7, 4). How many grid units apart are they?',5,'','Subtract their horizontal positions.','maths:coordinates:distance')];
 else if(theme==='french')tasks=[
 typed(0,'Read the invitation','« Rendez-vous samedi. » On which day should you meet? Answer in English.',['Saturday'],'The day after vendredi.','french:vocab:days'),
 choice(0,'Choose the entrance','« Le jardin » means…',['The garden','The school','The bedroom'],'The garden','It is where the flowers grow.','french:vocab:places'),
 sequence(1,'Repair the message','Build: “I do not have a brother.”',["Je","n'ai","pas","de","frère"],'Use ne … pas around avoir. After a negative, use de.','french:negatives'),
 typed(1,'Decode the portrait','« Ma sœur est plus grande que moi. » Is the sister taller or shorter than the speaker?',['taller','taller than the speaker'],'Plus … que means more … than.','french:comparatives'),
 typed(2,'Speak your age','Complete: « J’ai ___ ans. » Write thirteen in French.',['treize'],'Age uses avoir.','french:age'),
 sequence(2,'Explain your opinion','Build: “I like the garden because it is beautiful.”',["J'aime","le jardin","parce que","c'est","beau"],'An opinion, then parce que, then a reason.','french:opinions'),
 typed(3,'The final invitation','« La clé est dans le jardin. » Which object is in the garden? Answer in English.',['key','the key'],'Clé is the object used to unlock a door.','french:vocab:objects')];
 else if(theme==='chemistry')tasks=[
 typed(0,'The smallest piece','What is the smallest particle of an element that retains its chemical identity?',['atom','an atom'],'An element contains one type of this particle.','chemistry:atoms'),
 choice(0,'Inspect the diagram','Which particle has a negative charge?',['Electron','Proton','Neutron'],'Electron','It moves around the nucleus.','chemistry:atomic-structure'),
 typed(1,'Purify the sample','Name the technique that removes insoluble sand from water.',['filtration','filtering'],'A filter traps the insoluble solid.','chemistry:separation'),
 sequence(1,'Prepare the filter','Put the practical steps in a sensible order.',['fold filter paper','place paper in funnel','pour mixture','collect filtrate'],'Set up the filter before pouring. The liquid that passes through is the filtrate.','chemistry:practical'),
 number(2,'Measure the hidden ingredient','A dye moves 3 cm and the solvent front moves 6 cm. Calculate Rf.',.5,'','Rf = distance moved by dye ÷ distance moved by solvent front.','chemistry:rf'),
 typed(2,'Protect the evidence','For chromatography, draw the baseline with a pen or a pencil?',['pencil','a pencil'],'Graphite does not dissolve in the solvent.','chemistry:practical'),
 choice(3,'Read the last label','Which is the chemical symbol for sodium?',['Na','S','So'],'Na','The symbol comes from natrium.','chemistry:periodic-table')];
 else tasks=[
 typed(0,'Find your instrument','Which instrument lets you observe cells that are too small to see clearly with the naked eye?',['microscope','a microscope'],'It magnifies a small specimen.','biology:microscopy'),
 choice(0,'Inspect the specimen','Which feature supports a plant cell?',['Cell wall','Cell membrane','Ribosome'],'Cell wall','It is made mainly of cellulose.','biology:plant-cells'),
 typed(1,'Find the control centre','Which cell structure contains genetic material and controls most activities?',['nucleus','the nucleus'],'It contains DNA.','biology:nucleus'),
 sequence(1,'Follow the energy clue','Put these events in order.',['glucose enters cell','aerobic respiration','energy transferred','muscle contracts'],'Respiration supplies energy for muscle contraction.','biology:cells:adaptation'),
 typed(2,'The green compartment','Name the organelle where photosynthesis occurs.',['chloroplast','chloroplasts'],'It contains chlorophyll.','biology:chloroplasts'),
 typed(2,'Inspect the boundary','Which structure controls what enters and leaves a cell?',['cell membrane','membrane','the cell membrane'],'It is partially permeable.','biology:membrane'),
 number(3,'Read the microscope image','An image measures 2 mm. The real cell measures 0.01 mm. Calculate magnification.',200,'×','Magnification = image size ÷ real size. Both sizes are in mm.','biology:magnification')];
 const story=STORIES[theme]||STORIES.biology;
 tasks.push(typed(3,'Unlock your rare find','Enter the four clue words from your field notes, in chapter order.',[story.clues.join(' ')],'Open Field notes to read each chapter’s recovered clue.','adventure:clues'));
 return tasks;
}
export function normalAnswer(value){return String(value??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[’‘]/g,"'").toLowerCase().replace(/\s+/g,' ').trim()}
export function collectedClues(theme,progress){return (STORIES[theme]?.clues||[]).map((word,i)=>({chapter:i+1,word:progress>=i*2+1?word:null}))}
export function puzzleOrder(items,seed){
 const out=[...items];let n=[...String(seed)].reduce((a,c)=>(Math.imul(a,31)+c.charCodeAt(0))>>>0,12345);
 for(let i=out.length-1;i>0;i--){n^=n<<13;n^=n>>>17;n^=n<<5;const j=(n>>>0)%(i+1);[out[i],out[j]]=[out[j],out[i]]}
 if(out.every((v,i)=>v===items[i])&&out.length>1)out.push(out.shift());return out;
}
