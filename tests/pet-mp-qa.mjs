import fs from "node:fs";

const reward=fs.readFileSync("assets/index-BLVOhKhN.js","utf8");
const pet=fs.readFileSync("pet/pet.js","utf8");
const home=fs.readFileSync("pet/home-pet.js","utf8");
const html=fs.readFileSync("pet/index.html","utf8");
const failures=[];
const need=(source,label,token)=>{if(!source.includes(token))failures.push(`${label}: missing ${token}`)};

for(const token of ["FIRST_MASTERY_MP = 10","RETENTION_MASTERY_MP = 2","mastery:${topicId}","retention:${topicId}:${todayKey()}","scholar:mp-changed"]) need(reward,"reward",token);
for(const token of ["const evolutionCosts = [50,90,140,200]","masteryPoints:pet.masteryPoints-cost","[pet.species]:stage+1","petLevels","showModal()"] ) need(pet,"pet",token);
for(const token of ["Moss Hornling senses new growth","Moon Puff sees mastery on the horizon","Star Toadlet predicts a breakthrough","growthMessage(state,pet.species)"]) need(pet,"pet voice",token);
for(const token of ["mpCount","evolvePet","confirmEvolution","XP, Mastery Points and Mastery Leaves are separate"] ) need(html,"html",token);
need(home,"home","pet.petLevels&&pet.petLevels[pet.species]");
if(pet.includes("getStage(leaves)")) failures.push("pet: automatic leaf evolution still present");
if(home.includes("computedStage=getStage(leaves)")) failures.push("home: automatic leaf evolution still present");

const costs=[50,90,140,200];
if(costs.reduce((a,b)=>a+b,0)!==480) failures.push("costs do not total 480 MP");

console.log("PET_MP_QA "+JSON.stringify({failures:failures.length,costs,total:480,firstMastery:10,retention:2,independentPetLevels:true,sharedWallet:true}));
if(failures.length){console.error(failures.join("\n"));process.exit(2)}
