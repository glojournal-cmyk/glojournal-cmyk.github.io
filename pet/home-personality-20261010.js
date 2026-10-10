/* Phase 3 — original pet artwork, personality-only dialogue.
   No persistent changes, rewards, bond or energy writes. */
const personalities=Object.freeze({
 "moss-hornling":["A patient little nod. The garden is waking up.","Your companion settles beside the Scholar.","A quiet rustle of leaves: ready for another chapter."],
 "antler-bean":["Tiny antlers catch the afternoon light.","Your companion stands proudly at attention.","A curious glance at the next adventure."],
 "inkling":["A swirl of ink draws a tiny constellation.","A mischievous ink flourish appears.","The next story is already taking shape."],
 "pebble-wisp":["A soft glow warms the little pebble.","The wisp sends a glimmer your way.","A small light follows the Scholar."],
 "moon-puff":["A moonlit shimmer dances softly.","Your companion gives a sleepy little glow.","A silvery spark drifts across the garden."],
 "mothling":["Delicate wings flutter in greeting.","The mothling circles a golden star.","A quiet flutter says hello."],
 "bloom-snail":["A flower unfurls at an unhurried pace.","Your companion admires the garden.","A tiny trail of light marks the path."],
 "velvet-batling":["Velvet wings make a graceful little bow.","A playful dusk-dance begins.","The batling watches over the next quest."],
 "sprig-dragon":["A proud little dragon stretches its wings.","A tiny golden sparkle escapes its nose.","The Scholar has an eager guardian today."],
 "star-toadlet":["A constellation sparkles on the pond.","One brave hop towards the next quest.","The little stargazer is listening."],
 "snow-owl":["The Moonveil Owl offers a solemn bow.","Silver feathers catch a distant starlight.","A watchful gaze guards the garden's secrets."],
 "night-spider":["The Nocturne Spider weaves a tiny silver star.","An elegant thread shimmers in greeting.","A velvet bow from the keeper of the stars."]
});
export function getHomePersonality(pet={},mood="",visit=0){
 const id=Object.hasOwn(personalities,String(pet.species))?String(pet.species):"moss-hornling";
 const lines=personalities[id];
 const stage=Math.max(1,Math.min(5,Math.trunc(Number(pet.petLevels?.[id])||Number(pet.highestStage)||1)));
 const label=String(mood||"").toLowerCase();
 const n=Number.isFinite(visit)?Math.max(0,Math.floor(visit)):0;
 const sleepy=/sleepy|quiet/.test(label);
 const intro=sleepy?"A gentle, quiet hello. ":/glowing|excited/.test(label)?"An excited greeting. ":"";
 return {species:id,kind:id==="snow-owl"?"owl":id==="night-spider"?"spider":id.includes("dragon")?"dragon":"companion",
   stage,message:intro+lines[(n+(stage>=4?1:0))%lines.length]};
}
