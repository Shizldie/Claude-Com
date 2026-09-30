'use strict';
/* ================= TROPHIES =================
   Every trophy is tied to something the player actually does in the game. */
const ACH_CATS = ['Village & Family', 'Food', 'Lore & Tech', 'Skills', 'Mysteries', 'Curios', 'Brewing', 'Building', 'Island Life'];
const ACH = [];
function A(cat, id, n, d, c) { ACH.push({ cat, id, n, d, c }); }
const st = () => S.stats;
// Village & Family
A(0, 'first_steps', 'First Footprints', 'Start a new village.', () => true);
A(0, 'first_baby', 'A New Voice', 'Welcome your first baby.', () => st().births >= 1);
A(0, 'births10', 'Growing Family', '10 babies born.', () => st().births >= 10);
A(0, 'births25', 'Full Cradles', '25 babies born.', () => st().births >= 25);
A(0, 'births60', 'Sea of Faces', '60 babies born.', () => st().births >= 60);
A(0, 'twins', 'Double Blessing', 'Twins are born.', () => st().twins >= 1);
A(0, 'pop10', 'Hamlet', 'Reach 10 villagers.', H => H.pop >= 10);
A(0, 'pop20', 'Village', 'Reach 20 villagers.', H => H.pop >= 20);
A(0, 'pop30', 'Township', 'Reach 30 villagers.', H => H.pop >= 30);
A(0, 'pop40', 'Island Nation', 'Reach 40 villagers.', H => H.pop >= 40);
A(0, 'fullhouse', 'Full House', 'Fill every bed: population equals capacity (12 or more).', H => H.cap >= 12 && H.pop >= H.cap);
A(0, 'gen2', 'Second Generation', 'A villager of the 2nd generation is born.', () => st().maxGen >= 2);
A(0, 'gen3', 'Grandchildren', 'A 3rd-generation villager is born.', () => st().maxGen >= 3);
A(0, 'gen4', 'Deep Roots', 'A 4th-generation villager is born.', () => st().maxGen >= 4);
A(0, 'gen6', 'Dynasty', 'A 6th-generation villager is born.', () => st().maxGen >= 6);
A(0, 'comeofage', 'Coming of Age', 'A child born on the island grows up.', () => st().comeOfAge >= 1);
A(0, 'comeofage10', 'Next of Kin', '10 island-born children grow up.', () => st().comeOfAge >= 10);
A(0, 'elder', 'Silver Hair', 'A villager reaches 60.', () => st().maxAge >= 60);
A(0, 'age75', 'Venerable', 'A villager reaches 75.', () => st().maxAge >= 75);
A(0, 'age85', 'Ancient One', 'A villager reaches 85.', () => st().maxAge >= 85);
A(0, 'firstloss', 'Remembered', 'A villager passes away.', () => st().deaths >= 1);
A(0, 'boom', 'Baby Boom', '3 babies born within a single year.', () => { const b = st().birthTimes; return b.length >= 3 && S.t - b[b.length - 3] <= YEAR; });
A(0, 'matchmaker', 'Matchmaker', 'Pair villagers up 15 times.', () => st().pairDrops >= 15);
A(0, 'bigfamily', 'Big Family', 'One villager has 5 children.', () => st().maxKids >= 5);
A(0, 'stranger', 'Castaway', 'A stranger washes ashore and joins you.', () => st().stranger >= 1);
A(0, 'warden2', 'Long Live the Warden', 'Crown a second Warden.', () => st().wardens >= 1);
// Food
A(1, 'food_first', 'First Harvest', 'Bring food to the larder.', () => st().food1);
A(1, 'food_1k', 'Stocked Larder', 'Hold 1,000 food at once.', () => S.food >= 1000);
A(1, 'food_5k', 'Overflowing Larder', 'Hold 5,000 food at once.', () => S.food >= 5000);
A(1, 'food_20k', 'Endless Feast', 'Hold 20,000 food at once.', () => S.food >= 20000);
A(1, 'foodT_5k', 'Hard Workers', 'Gather 5,000 food in total.', () => st().foodT >= 5000);
A(1, 'foodT_50k', 'Bountiful Isle', 'Gather 50,000 food in total.', () => st().foodT >= 50000);
A(1, 'foodT_250k', 'Breadbasket', 'Gather 250,000 food in total.', () => st().foodT >= 250000);
A(1, 'glow1', 'Little Helpers', 'A child brings in a glowcap.', () => st().glow >= 1);
A(1, 'glow30', 'Glowcap Hunters', 'Children bring in 30 glowcaps.', () => st().glow >= 30);
A(1, 'bramble_empty', 'Picked Clean', 'Empty the Berry Bramble.', () => st().brambleEmpty);
A(1, 'honey', 'Sweet Reward', 'Collect honey from the Hive Tree.', () => st().honey >= 1);
A(1, 'honey100', 'Busy Bees', 'Collect honey 100 times.', () => st().honey >= 100);
A(1, 'crop', 'First Sprouts', 'Harvest the Terrace Field.', () => st().crop >= 1);
A(1, 'crop200', 'Golden Rows', 'Harvest the field 200 times.', () => st().crop >= 200);
A(1, 'fish', 'Catch of the Day', 'Bring in fish from the Tide Nets.', () => st().fish >= 1);
A(1, 'fish300', 'Net Profits', 'Bring in fish 300 times.', () => st().fish >= 300);
A(1, 'starving', 'Lean Times', 'A villager goes hungry with an empty larder.', () => st().starved);
A(1, 'wellfed', 'Well Fed', 'Go 5 years without anyone starving.', () => S.t - st().lastStarve >= 5 * YEAR);
// Lore & Tech
A(2, 'lore1', 'First Insight', 'Earn your first Lore.', () => st().lore1);
A(2, 'lore5k', "Scholars' Circle", 'Earn 5,000 Lore in total.', () => st().loreT >= 5000);
A(2, 'lore50k', 'Keepers of Lore', 'Earn 50,000 Lore in total.', () => st().loreT >= 50000);
A(2, 'lore200k', 'Living Library', 'Earn 200,000 Lore in total.', () => st().loreT >= 200000);
A(2, 'bank10k', 'Saving Up', 'Hold 10,000 Lore at once.', () => S.lore >= 10000);
[['harvest', 'Tilled Earth', 'Harvest Mastery'], ['remedy', 'Herbal Wisdom', 'Healing Arts'], ['kinship', 'Close-Knit', 'Bonds Unbroken'],
 ['craft', 'Stone and Timber', 'Master Plans'], ['lore', 'Written Word', 'Enlightenment'], ['spirit', 'Old Songs', 'One with the Island']].forEach(([t, a, b]) => {
  A(2, t + '2', a, `Reach ${TECH[t].n} level 2.`, () => S.tech[t] >= 2);
  A(2, t + '3', b, `Reach ${TECH[t].n} level 3.`, () => S.tech[t] >= 3);
});
A(2, 'allL2', 'Well Rounded', 'Every tech at level 2 or higher.', () => TECHS.every(t => S.tech[t.id] >= 2));
A(2, 'allL3', 'Golden Age', 'Every tech at level 3.', () => TECHS.every(t => S.tech[t.id] >= 3));
// Skills
const SKN = { forage: ['Green Thumb', 'Master Forager'], build: ['Hammer and Peg', 'Master Builder'], research: ['Curious Mind', 'Master Scholar'], heal: ['Gentle Hands', 'Master Healer'], parent: ['Nurturer', 'Devoted Parent'] };
for (const k of SKILLS) {
  A(3, 'nov_' + k, SKN[k][0], `Train a Novice ${NOUN[k]}.`, H => H.maxRank[k] >= 1);
  A(3, 'skl_' + k, 'Skilled ' + NOUN[k], `Train a Skilled ${NOUN[k]}.`, H => H.maxRank[k] >= 2);
  A(3, 'mas_' + k, SKN[k][1], `Train a Master ${NOUN[k]}.`, H => H.maxRank[k] >= 3);
}
A(3, 'jack', 'Jack of All Trades', 'One villager Skilled in 3 different skills.', H => H.bestSkilled >= 3);
A(3, 'paragon', 'Paragon', 'One villager Master of 3 different skills.', H => H.bestMaster >= 3);
A(3, 'guild', "Builders' Guild", '3 Master Builders alive at once.', H => H.masters.build >= 3);
A(3, 'faculty', 'Faculty', '3 Master Scholars alive at once.', H => H.masters.research >= 3);
A(3, 'prodigy', 'Prodigy', 'A child reaches Novice in any skill.', H => H.prodigy);
A(3, 'cure1', 'First Cure', 'Heal a sick villager.', () => st().cures >= 1);
A(3, 'cure25', 'Village Healer', 'Heal 25 sick villagers.', () => st().cures >= 25);
A(3, 'cure100', 'Island Physician', 'Heal 100 sick villagers.', () => st().cures >= 100);
A(3, 'schooled', 'Born Learner', 'A baby is born already knowing a skill.', () => st().schooled >= 1);
A(3, 'persist', 'Persistence', 'Teach a job to a villager who was confused 3 times first.', () => st().persist >= 1);
// Mysteries
for (const m of MYST) A(4, 'myst_' + m.id, m.n, 'Solve the mystery: ' + m.n + '.', () => !!S.myst[m.id]);
A(4, 'myst4', 'Getting Curious', 'Solve 4 mysteries.', H => H.myst >= 4);
A(4, 'myst8', 'Halfway There', 'Solve 8 mysteries.', H => H.myst >= 8);
A(4, 'myst12', 'Nearly Unveiled', 'Solve 12 mysteries.', H => H.myst >= 12);
A(4, 'myst16', 'Island Remembered', 'Solve all 16 mysteries.', H => H.myst >= 16);
// Curios
A(5, 'cur1', 'Shiny Thing', 'A child digs up a curio.', H => H.curios >= 1);
A(5, 'cur10', 'Collector', 'Find 10 different curios.', H => H.curios >= 10);
A(5, 'cur20', 'Cabinet of Wonders', 'Find 20 different curios.', H => H.curios >= 20);
A(5, 'cur30', 'Curator', 'Find all 30 curios.', H => H.curios >= 30);
CURIO_SETS.forEach((s, i) => A(5, 'set_' + s.id, ['Tide Pool', 'Plumage', 'Rockhound', "Ancestors' Things", 'Keepsakes'][i], `Complete the ${s.n} collection.`, H => H.sets[i]));
A(5, 'dupe', 'Déjà Vu', 'Find a curio you already had.', () => st().dupes >= 1);
A(5, 'cur100', 'Magpies', 'Dig up 100 curios in total.', () => st().curioPick >= 100);
// Brewing
A(6, 'herbs1', 'Into the Pot', 'Put a herb in the cauldron.', () => st().herbs >= 1);
A(6, 'brew1', 'First Bubbles', 'Brew anything.', () => st().brews >= 1);
A(6, 'murky', 'Murky Results', 'Brew something that does nothing.', () => st().murky >= 1);
A(6, 'rec3', 'Apprentice Brewer', 'Discover 3 recipes.', H => H.recipes >= 3);
A(6, 'rec6', 'Brewmaster', 'Discover 6 recipes.', H => H.recipes >= 6);
A(6, 'rec10', 'Grand Alchemist', 'Discover all 10 recipes.', H => H.recipes >= 10);
A(6, 'deepbreath', 'Hold Your Breath', 'Brew Deep Breath.', () => !!S.recipes[RECIPES[0].k]);
A(6, 'youth', 'Spring in Their Step', 'Someone drinks a Youth Draught.', () => st().youth >= 1);
A(6, 'herbs50', 'Herb Basket', 'Bring 50 herbs to the cauldron.', () => st().herbs >= 50);
A(6, 'brews25', 'Busy Cauldron', 'Brew 25 times.', () => st().brews >= 25);
// Building
A(7, 'hut1', 'A Roof Overhead', 'Build a new hut.', H => H.newHuts >= 1);
A(7, 'hut4', 'Neighborhood', 'Build 4 new huts.', H => H.newHuts >= 4);
A(7, 'hut6', 'Every Site Filled', 'Build all 6 new huts.', H => H.newHuts >= 6);
A(7, 'proj5', 'Busy Hands', 'Finish 5 construction projects.', () => st().projects >= 5);
A(7, 'proj12', 'Construction Boom', 'Finish 12 construction projects.', () => st().projects >= 12);
A(7, 'refuel10', 'Keep It Burning', 'Refuel the hearth fire 10 times.', () => st().refuels >= 10);
A(7, 'outfit1', 'New Threads', 'Buy an outfit at the Weaver\'s Lodge.', () => st().outfits >= 1);
A(7, 'outfit10', 'Fashion Parade', 'Buy 10 outfits.', () => st().outfits >= 10);
// Island life
A(8, 'year1', 'First Year', 'Survive one year on the island.', () => S.t >= YEAR);
A(8, 'year10', 'A Decade', 'Reach year 10.', () => S.t >= 10 * YEAR);
A(8, 'year25', 'Quarter Century', 'Reach year 25.', () => S.t >= 25 * YEAR);
A(8, 'year50', 'Half a Century', 'Reach year 50.', () => S.t >= 50 * YEAR);
A(8, 'year100', 'Timeless', 'Reach year 100.', () => S.t >= 100 * YEAR);
A(8, 'rain', 'Rain on the Roofs', 'Weather a rain shower.', () => st().rainSeen >= 1);
A(8, 'fog', 'Into the Mist', 'See the island covered in fog.', () => st().fogSeen >= 1);
A(8, 'storm', 'Weathered the Storm', 'Make it through a storm.', () => st().stormSeen >= 1);
A(8, 'rainbow', "Rainbow's End", 'See a rainbow after the rain.', () => st().rainbow >= 1);
A(8, 'star', 'Wish Upon a Star', 'Tap a shooting star.', () => st().stars >= 1);
A(8, 'stars5', 'Stargazer', 'Tap 5 shooting stars.', () => st().stars >= 5);
A(8, 'night', 'Night Owl', 'Visit your village late at night.', () => st().night);
A(8, 'dawn', 'Early Riser', 'Visit your village at dawn.', () => st().dawn);
A(8, 'pickup', 'Helping Hand', 'Pick up a villager.', () => st().pickups >= 1);
A(8, 'drops100', 'Guiding Hand', 'Guide villagers 100 times.', () => st().drops >= 100);
A(8, 'splash', 'Splash!', 'Drop a villager in the sea.', () => st().splash >= 1);
A(8, 'rename', 'Name Giver', 'Rename a villager.', () => st().renames >= 1);
A(8, 'cards20', 'People Person', 'Look at villager cards 20 times.', () => st().cards >= 20);
A(8, 'fast', 'Hurry Up', 'Play at the fastest speed.', () => st().fast);
A(8, 'away1', 'Welcome Back', 'Return after at least an hour away.', () => st().awayMax >= 3600);
A(8, 'days7', 'Faithful Keeper', 'Visit the village on 7 different days.', () => S.days.length >= 7);

function achHelpers() {
  const maxRank = {}, masters = {};
  for (const k of SKILLS) { maxRank[k] = 0; masters[k] = 0; }
  let bestSkilled = 0, bestMaster = 0, prodigy = false;
  for (const v of S.vill) {
    let sk = 0, ms = 0;
    for (const k of SKILLS) { const r = rankOf(v.sk[k]); if (r > maxRank[k]) maxRank[k] = r; if (r >= 2) sk++; if (r >= 3) { ms++; masters[k]++; } if (r >= 1 && stage(v) === 'child') prodigy = true; }
    bestSkilled = Math.max(bestSkilled, sk); bestMaster = Math.max(bestMaster, ms);
  }
  const sets = [0, 1, 2, 3, 4].map(s => { for (let i = 0; i < 6; i++) if (!S.curios[s * 6 + i]) return false; return true; });
  return { pop: S.vill.length, cap: popCap(), maxRank, masters, bestSkilled, bestMaster, prodigy, myst: Object.keys(S.myst).length,
    curios: Object.keys(S.curios).length, sets, recipes: Object.keys(S.recipes).length, newHuts: hutsBuilt() - 1 };
}
function checkAch(quiet) {
  const H = achHelpers(); const got = [];
  for (const a of ACH) if (!S.ach[a.id]) { let ok = false; try { ok = a.c(H); } catch (e) { ok = false; } if (ok) { S.ach[a.id] = Date.now(); got.push(a); } }
  if (got.length && !quiet) HOOK.trophy(got);
  return got;
}
