'use strict';
/* ================= CORE CONSTANTS ================= */
const YEAR = 480;                 // sim-seconds per game year at 1x
const OFFLINE_RATE = YEAR / 3600; // while away: 1 game year per real hour
const OFFLINE_CAP = 12 * 3600;    // max real seconds simulated while away
const HUNGER_RATE = 100 / (YEAR * 0.22);
const SPEEDS = [0, 1, 3, 8];
const WORLD = { w: 4000, h: 2800 };

const SKILLS = ['forage', 'build', 'research', 'heal', 'parent'];
const SK = {
  forage:   { n: 'Foraging',    c: '#86c95a' },
  build:    { n: 'Building',    c: '#e9a052' },
  research: { n: 'Scholarship', c: '#72b8ea' },
  heal:     { n: 'Healing',     c: '#ec7b86' },
  parent:   { n: 'Parenting',   c: '#c9a0ec' }
};
const RANKS = ['Untrained', 'Novice', 'Skilled', 'Master'];
const RANK_XP = [0, 20, 60, 150];
const rankOf = xp => xp >= 150 ? 3 : xp >= 60 ? 2 : xp >= 20 ? 1 : 0;
const RANK_YIELD = [1, 1.35, 1.8, 2.5];
const WT = { forage: 7, build: 8, research: 9, heal: 3, eat: 2, fetch: 2.5 };

/* ================= VILLAGE TECH ================= */
const TECHS = [
  { id: 'harvest', n: 'Harvest', costs: [0, 900, 9000], c: '#86c95a',
    d: ['Berries from the bramble. Children can gather glowcaps.',
        'Terrace farming becomes possible. Foragers carry more.',
        'Tide-net fishing becomes possible. +25% food from every source.'] },
  { id: 'remedy', n: 'Remedy', costs: [0, 1400, 11000], c: '#ec7b86',
    d: ['Basic herbal care.',
        'Villagers fall ill 40% less often. Healers succeed more often.',
        'Illness is rare, and healing almost always works.'] },
  { id: 'kinship', n: 'Kinship', costs: [0, 1100, 8000], c: '#c9a0ec',
    d: ['Families form slowly.',
        'Couples have children more easily.',
        'Shorter pregnancies, and twins are more common.'] },
  { id: 'craft', n: 'Craft', costs: [0, 1000, 10000], c: '#e9a052',
    d: ['Two hut sites. Simple repairs.',
        'Two more hut sites. Heavy clearing work. Builders work faster.',
        'The last two hut sites and grand structures. Builders work much faster.'] },
  { id: 'lore', n: 'Lore', costs: [0, 1600, 14000], c: '#72b8ea',
    d: ['Scholars read the old carvings slowly.',
        'Research earns 50% more Lore, and villagers learn skills faster.',
        'Research earns more than double, and skills grow fastest.'] },
  { id: 'spirit', n: 'Spirit', costs: [0, 1800, 12000], c: '#f0c75a',
    d: ['The island feels watchful.',
        'Old rituals awaken: the Standing Stones and the Broken Loom.',
        'Villagers live longer, and the Hilltop Plinth awakens.'] }
];
const TECH = Object.fromEntries(TECHS.map(t => [t.id, t]));

/* ================= SITES (drop targets) ================= */
const SITES = [
  { id: 'larder',      x: 1060, z: 770,  r: 42, n: 'Larder' },
  { id: 'hearth',      x: 975,  z: 700,  r: 38, n: 'Hearth' },
  { id: 'study',       x: 1175, z: 640,  r: 44, n: 'Study Stones' },
  { id: 'bramble',     x: 820,  z: 800,  r: 50, n: 'Berry Bramble' },
  { id: 'woodpile',    x: 830,  z: 560,  r: 36, n: 'Deadfall' },
  { id: 'reeds',       x: 1330, z: 770,  r: 36, n: 'Dry Reeds' },
  { id: 'torches',     x: 1390, z: 540,  r: 32, n: 'Old Torches' },
  { id: 'hive',        x: 1480, z: 470,  r: 50, n: 'Hive Tree' },
  { id: 'springrocks', x: 1570, z: 700,  r: 48, n: 'Mossy Rocks' },
  { id: 'wreck',       x: 1060, z: 1175, r: 68, n: 'Wreckage' },
  { id: 'nets',        x: 1290, z: 1165, r: 52, n: 'Tide Rocks' },
  { id: 'terrace',     x: 470,  z: 850,  r: 78, n: 'Overgrown Terrace' },
  { id: 'twisted',     x: 420,  z: 650,  r: 38, n: 'Twisted Driftwood' },
  { id: 'hall',        x: 780,  z: 430,  r: 66, n: 'Ruined Hall' },
  { id: 'mantle',      x: 1230, z: 900,  r: 38, n: 'Stone Dais' },
  { id: 'circle',      x: 1020, z: 350,  r: 78, n: 'Standing Stones' },
  { id: 'cauldron',    x: 1400, z: 960,  r: 42, n: 'Cracked Cauldron' },
  { id: 'mending',     x: 820,  z: 1010, r: 60, n: 'Old Foundation' },
  { id: 'lodge',       x: 1270, z: 380,  r: 58, n: 'Broken Loom' },
  { id: 'dunes',       x: 825,  z: 1210, r: 48, n: 'Glinting Dune' },
  { id: 'pond',        x: 600,  z: 1045, r: 72, n: 'Still Pond' },
  { id: 'belfry',      x: 1010, z: 225,  r: 58, n: 'Hilltop Plinth' }
];
const HUT_SITES = [
  { x: 1090, z: 545 }, // starting hut
  { x: 930, z: 545 }, { x: 1190, z: 790 },
  { x: 890, z: 905 }, { x: 1040, z: 905 },
  { x: 1270, z: 650 }, { x: 745, z: 705 }
];
/* The island is twice the size of v0.1: the village core spreads a little,
   outlying landmarks spread twice as far. */
const CORE_SITES = new Set(['larder', 'hearth', 'study', 'bramble', 'woodpile', 'reeds', 'mantle']);
const toCore = p => { p.x = 2000 + (p.x - 1000) * 1.35; p.z = 1440 + (p.z - 720) * 1.35; };
const toOuter = p => { p.x = 2000 + (p.x - 1000) * 2; p.z = 1440 + (p.z - 720) * 2; };
SITES.forEach(s => { if (CORE_SITES.has(s.id)) toCore(s); else { toOuter(s); s.r *= 1.3; } });
HUT_SITES.forEach(toCore);
// Landmarks of the wider island (absolute positions): the sealed cave in the cliff and the Mire.
SITES.push({ id: 'cave', x: 2950, z: 390, r: 90, n: 'Sealed Cave' }, { id: 'swamp', x: 3450, z: 2280, r: 330, n: 'The Mire' });
HUT_SITES.forEach(h => { h.x = 4000 - h.x; });
HUT_SITES.forEach((h, i) => SITES.push({ id: 'hut' + i, x: h.x, z: h.z, r: 46, n: i ? 'Hut Site' : 'Hut', hut: i }));
// v0.3: the whole map is mirrored west-to-east; the Mire stays in the south-east corner.
SITES.forEach(s => { if (s.hut === undefined) s.x = 4000 - s.x; });
{ const m = SITES.find(s => s.id === 'swamp'); m.x = 3330; m.z = 2200; m.r = 400; }
const SITE = Object.fromEntries(SITES.map(s => [s.id, s]));
const HUTS_BY_CRAFT = [2, 4, 6];

/* ================= MYSTERIES ================= */
const MYST = [
  { id: 'm1',  n: 'Sweetwater Spring', art: 'spring',
    hint: 'Water seems to trickle under some mossy rocks in the west. A trained builder could open them up.',
    done: 'Your builders opened a clean spring. Fresh water means far less sickness.' },
  { id: 'm2',  n: 'First Flame', art: 'hearthlit',
    hint: 'The hearth is cold. Deadfall wood and dry reeds, then a steady hand, might bring it to life.',
    done: 'The hearth is burning! Keep it fed with deadfall, or it will go out.' },
  { id: 'm3',  n: 'Smoke and Honey', art: 'hive',
    hint: 'Angry bees guard the hive tree. The old torches near it look like they were once lit from a fire.',
    done: 'Torch smoke calmed the bees. Foragers can now collect honey from the Hive Tree.' },
  { id: 'm4',  n: 'Clearing the Shore', art: 'shore',
    hint: 'The south beach is choked with wreckage. Better building methods (Craft 2) would help clear it.',
    done: 'Your builders cleared the wreckage. The sea is open to your villagers.' },
  { id: 'm5',  n: 'Tide Nets', art: 'nets',
    hint: 'Once the shore is clear, a skilled forager with Harvest 3 might see a use for the tide rocks.',
    done: 'Nets now stretch between the tide rocks. The sea is a food source that never runs out.' },
  { id: 'm6',  n: 'The Terrace', art: 'field',
    hint: 'An old terrace in the east is overgrown. With Harvest 2, someone could see its potential.',
    done: 'The terrace is cleared and planted. Foragers can now tend the field.' },
  { id: 'm7',  n: 'The Straw Watcher', art: 'scarecrow',
    hint: 'Birds peck at the field. A skilled forager could make something from the twisted driftwood. It may take two trips.',
    done: 'A straw watcher guards the field. Crop yields are up by half.' },
  { id: 'm8',  n: 'Hall of Learning', art: 'school',
    hint: 'The ruined hall is covered in carvings only a master scholar could understand.',
    done: 'A master scholar restored the hall as a school. Babies are born with a skill, and children can study here.' },
  { id: 'm9',  n: "The Warden's Mantle", art: 'mantle',
    hint: 'A robe lies on the stone dais. It seems made for one particular person. Try it on your villagers.',
    done: 'The mantle fits! Your village has a Warden, who inspires everyone to work a little faster.' },
  { id: 'm10', n: 'Rain Chant', art: 'circle',
    hint: 'The Standing Stones need the Warden and three skilled foragers together, once Spirit 2 is known.',
    done: 'The chant brought rain. The bramble now regrows three times faster.' },
  { id: 'm11', n: "Brewer's Cauldron", art: 'cauldron',
    hint: 'A cracked cauldron lies in the southwest. A scholar with Lore 2 and Remedy 2 could mend it.',
    done: 'The cauldron is mended. Herbs now grow around the island. Carry three into the cauldron to brew.' },
  { id: 'm12', n: 'House of Mending', art: 'mending',
    hint: 'An old foundation waits near the pond. It needs Craft 3 and Remedy 3 to rebuild.',
    done: 'The House of Mending stands. Healing now always succeeds.' },
  { id: 'm13', n: "Weaver's Lodge", art: 'lodge',
    hint: 'A broken loom sits in the north. Craft 2 and Spirit 2 would let builders restore it.',
    done: 'The Weaver\'s Lodge is open. Open a villager\'s card to change their outfit.' },
  { id: 'm14', n: 'Buried Crown', art: 'crown',
    hint: 'Something big glints under a dune on the south beach. It would take three master builders together.',
    done: 'Three master builders dug up the crown of a great bronze bell.' },
  { id: 'm15', n: 'Sunken Tongue', art: 'tongue',
    hint: 'Something rests at the bottom of the Still Pond, far too deep to reach without a special brew.',
    clue: 'A carving in the hall shows a diver surrounded by two Moonleaves and a Mistfern.',
    done: 'A villager dove deep into the pond and brought up the bell\'s bronze tongue.' },
  { id: 'm16', n: 'Bell of Echoes', art: 'belfry',
    hint: 'The hilltop plinth waits for a bell. It needs both bell pieces, Spirit 3, and a master builder to begin.',
    done: 'The Bell of Echoes rings out across the island. The forgotten village remembers itself.' }
];
const MYSTM = Object.fromEntries(MYST.map(m => [m.id, m]));

/* ================= HERBS & BREWS ================= */
const HERBS = [
  { id: 'sun',   n: 'Sunpetal',   c: '#f2c230', home: [1420, 820] },
  { id: 'ash',   n: 'Ashroot',    c: '#a39c90', home: [900, 360] },
  { id: 'moon',  n: 'Moonleaf',   c: '#74a6ea', home: [560, 950] },
  { id: 'ember', n: 'Emberberry', c: '#e2553b', home: [1160, 1060] },
  { id: 'mist',  n: 'Mistfern',   c: '#5dc79c', home: [650, 660] },
  { id: 'dusk',  n: 'Duskbloom',  c: '#a060d6', home: [480, 520] }
];
HERBS.forEach(h => { h.home = [4000 - (2000 + (h.home[0] - 1000) * 2), 1440 + (h.home[1] - 720) * 2]; });
const HERB = Object.fromEntries(HERBS.map(h => [h.id, h]));
const rkey = arr => arr.slice().sort().join(',');
const RECIPES = [
  { k: rkey(['moon', 'moon', 'mist']),  n: 'Deep Breath',     d: 'The drinker can hold their breath for a very long time.' },
  { k: rkey(['sun', 'ember', 'ash']),   n: 'Hearty Stew',     d: 'Adds 250 food to the larder.' },
  { k: rkey(['moon', 'dusk', 'sun']),   n: 'Clear Mind',      d: 'A flash of insight: +600 Lore.' },
  { k: rkey(['mist', 'mist', 'sun']),   n: 'Mending Tonic',   d: 'Cures every sick villager.' },
  { k: rkey(['ember', 'ember', 'ember']), n: 'Quickstep',     d: 'The drinker moves and works twice as fast for a year.' },
  { k: rkey(['dusk', 'dusk', 'moon']),  n: 'Youth Draught',   d: 'The drinker grows five years younger.' },
  { k: rkey(['ember', 'dusk', 'mist']), n: 'Kinship Cordial', d: 'The drinker\'s next family attempt is sure to succeed.' },
  { k: rkey(['sun', 'sun', 'sun']),     n: 'Glow Tea',        d: 'The drinker glows softly and gains skill in everything.' },
  { k: rkey(['ash', 'ash', 'ash']),     n: 'Stonebrew',       d: 'All builders work twice as fast for a year.' },
  { k: rkey(['mist', 'ash', 'moon']),   n: 'Rain Tonic',      d: 'The Berry Bramble bursts with new fruit.' }
];
const RECIPE = Object.fromEntries(RECIPES.map(r => [r.k, r]));

/* ================= CURIOS ================= */
const CURIO_SETS = [
  { id: 'shells',   n: 'Shells',   items: ['Spiral Conch', 'Cowrie', 'Sand Dollar', 'Scallop', 'Sea Star', 'Pearl'],
    cols: ['#f2b8a0', '#f5e2c0', '#e9dcc4', '#f09a7a', '#f07f5a', '#f4f1ea'] },
  { id: 'feathers', n: 'Feathers', items: ['Kestrel', 'Heron', 'Parrot', 'Owl', 'Gull', 'Hummingbird'],
    cols: ['#b8743a', '#9fb0c0', '#3fbf6a', '#8a6a4a', '#e8ecef', '#39b8c8'] },
  { id: 'stones',   n: 'Stones',   items: ['Quartz', 'Obsidian', 'Jade', 'Amber', 'Geode', 'Lodestone'],
    cols: ['#eef2f5', '#2a2530', '#3fae7a', '#e8a33a', '#9a6ad0', '#5a5f68'] },
  { id: 'relics',   n: 'Relics',   items: ['Clay Bead', 'Bone Flute', 'Carved Tooth', 'Copper Ring', 'Mask Shard', 'Glyph Tablet'],
    cols: ['#c46a3a', '#eadcc0', '#f0e6d0', '#d0773a', '#b8423a', '#8a8070'] },
  { id: 'tokens',   n: 'Keepsakes', items: ['Lucky Knot', 'Painted Pebble', 'Woven Star', 'Driftwood Fish', 'Tiny Drum', 'Reed Whistle'],
    cols: ['#d8b25a', '#4a8ad0', '#e0c070', '#a57a50', '#c0603a', '#b8c060'] }
];
const CURIO_COUNT = 30;

/* ================= OUTFITS ================= */
const OUTFITS = [
  { n: 'Leafwrap',     c: '#5e8f3a', acc: null },
  { n: 'Sun Sash',     c: '#e0a53a', acc: 'sash' },
  { n: 'Reed Tunic',   c: '#b89a58', acc: null },
  { n: 'Coral Wrap',   c: '#e0664e', acc: 'dots' },
  { n: 'Night Weave',  c: '#35406e', acc: 'stars' },
  { n: 'Feather Cape', c: '#3f9a8e', acc: 'feathers' },
  { n: 'Shell Vest',   c: '#d9c7a8', acc: 'shells' },
  { n: 'Plum Robe',    c: '#8a4f7d', acc: 'sash' }
];
const OUTFIT_COST = 300;

/* ================= LOOKS & NAMES ================= */
const SKINS = ['#6b4029', '#8d5a3b', '#a86b45', '#c58b62', '#dca47a', '#f0c8a2'];
const HAIRS = ['#221811', '#3e281a', '#6a3f22', '#a8582b', '#d6b068', '#171720', '#7a2e22'];
const SYL_A = ['Ka', 'Lo', 'Mi', 'Ta', 'Ri', 'Nu', 'Sa', 'Ena', 'Ali', 'Po', 'Le', 'Hu', 'Ya', 'Ko', 'Ni', 'Wa', 'Ze', 'Ol', 'Ira', 'Be', 'Tu', 'Ma', 'Fe', 'Ro', 'Da', 'Sei', 'Vo', 'Ke'];
const SYL_B = ['ni', 'ra', 'lo', 'ma', 'ki', 'ren', 'sa', 'vi', 'to', 'lu', 'na', 'mo', 'ri', 'la', 'ko', 'nel', 'wen', 'dro', 'ya', 'ti', 'sho', 'ba'];
const SYL_C = ['', '', '', 'n', 'a', 'o', 'i', 'k', 'l', 'e'];
