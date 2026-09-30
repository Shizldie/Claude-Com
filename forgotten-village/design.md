# Forgotten Village — Design Notes (Prototype v0.1)

A recreation of the core loop of the first three *Virtual Villagers* games (A New Home, The Lost Children, The Secret City), with original art, original names, and no story yet. Built as a single-file HTML5 prototype so it runs on any phone browser, tablet, or desktop.

## What the originals were (research summary)

- **Real-time village sim.** A small tribe on an island lives on even when the game is closed. Speed can be set to slow, normal, or fast.
- **Drag-and-drop is the only verb.** You pick up a villager and drop them on things: a berry bush to farm, the research table to study, a building site to build, a sick villager to heal, an opposite-sex adult to have a family. Untrained villagers often need several tries before they take to a job.
- **Five skills with ranks.** Farming, Building, Research, Healing, Parenting (called Breeding in the first game), each going Untrained → Trainee → Adept → Master.
- **Tech points and six technologies.** Scientists earn tech points that buy upgrades in six trees (e.g. Farming, Medicine, Fertility, Construction, Science, Spirituality in game 1; Engineering, Exploration and Culture appear in game 2; Leadership and factions in game 3).
- **Lifecycle.** Babies, children (who can only gather mushrooms, collect items, and heal), adults, elders, death. Housing caps the population.
- **16 puzzles per game** that combine tech levels, skill ranks, and earlier puzzles: a freshwater spring, clearing a beach, founding a school, lighting a fire from wood and dry grass, a dam, a scarecrow, smoking out a beehive, finding the chief by trying a robe on everyone, a weather dance, assembling a great gong from hidden pieces.
- **Collectibles** that only children can pick up; duplicates turn into tech points (game 2 onward), and sets raise the population cap.
- **Potions/stews** from three herbs with odd effects (game 2 onward), including one needed to dive for a sunken piece.
- **Weather** (game 3) and random island events. Game 3 also added in-game achievements.

## How the prototype maps it

| Original idea | Forgotten Village version |
|---|---|
| Farming / Building / Research / Healing / Parenting | Foraging / Building / Scholarship / Healing / Parenting |
| Trainee / Adept / Master | Novice / Skilled / Master |
| Tech points | Lore |
| 6 techs | Harvest, Remedy, Kinship, Craft, Lore, Spirit (3 levels each) |
| Berry bush, mushrooms, farm, fishing, honey | Berry Bramble, Glowcaps (children only), Terrace Field, Tide Nets, Hive Tree |
| Chief & robe | The Warden & the mantle on the Stone Dais |
| Collectibles | 30 Curios in 5 sets (Shells, Feathers, Stones, Relics, Keepsakes) |
| Stews / alchemy | 6 herbs, 10 brews in a mended cauldron |
| Gong of Wonder | Bell of Echoes (crown + tongue + belfry) |

## Core systems in the prototype

- **Time.** 1 game year = 8 real minutes at 1× (3× and 8× available, plus pause). While closed, time runs at ~1 year per real hour, capped at 12 hours, with a "While you were away" summary.
- **Day/night follows the player's real clock.** Weather cycles through clear, cloudy, fog, rain, storm, and rainbows.
- **Villagers.** Ages 0–2 are carried by their mother, children 2–14, adults, elders at 60, natural lifespan ~66–82 (+ Spirit 3 and House of Mending bonuses). Hunger, health, illness, pregnancy (twins possible), generations, family ties (no pairing between close relatives).
- **Job acceptance.** Untrained villagers accept a job ~40% of the time, rising with each confused attempt, like the originals. Once trained they keep working on their own.
- **Population cap.** 4 + 4 per hut (7 hut sites unlocked by Craft levels) + 2 per completed curio set + 2 each for the House of Mending and Weaver's Lodge. Max 46.
- **Random events.** Castaways washing ashore, storms that spoil food, bumper bramble seasons, fish on the beach, fever outbreaks, and tappable shooting stars.
- **Save.** Autosaves in the browser. A copy/paste save code moves a village between devices (the start of cross-platform play).

## The 16 mysteries (solutions)

1. **Sweetwater Spring** — Drop a Novice+ builder on the Mossy Rocks, then builders finish the project. Cuts illness 40%.
2. **First Flame** — Carry deadfall and dry reeds to the hearth, then drop anyone on it to light it. Builders refuel it automatically.
3. **Smoke and Honey** — With the fire lit, drop an adult on the Old Torches. They light one at the hearth and smoke the Hive Tree. Unlocks honey.
4. **Clearing the Shore** — Craft 2. Builders clear the Wreckage.
5. **Tide Nets** — Shore cleared + Harvest 3 + a Skilled Forager on the Tide Rocks. Unlimited food.
6. **The Terrace** — Harvest 2. Drop an adult on the Overgrown Terrace, builders clear it. Unlocks the field.
7. **The Straw Watcher** — Terrace done + a Skilled Forager on the Twisted Driftwood, two trips. Field yield +50%.
8. **Hall of Learning** — A Master Scholar on the Ruined Hall. Babies are born with a skill; children can attend school.
9. **The Warden's Mantle** — Try the mantle on adults until it fits one. The Warden boosts all work 10%. Repeat when the Warden dies.
10. **Rain Chant** — Warden + Spirit 2 + three Skilled Foragers on the Standing Stones. Bramble regrows 3× faster.
11. **Brewer's Cauldron** — Lore 2 + Remedy 2 + a Novice+ Scholar on the Cracked Cauldron. Herbs start to grow.
12. **House of Mending** — Craft 3 + Remedy 3, then build. Healing always works, +4 years lifespan, +2 room.
13. **Weaver's Lodge** — Craft 2 + Spirit 2, then build. Outfits (300 Lore each), +2 room.
14. **Buried Crown** — Craft 2 + three Master Builders on the Glinting Dune together.
15. **Sunken Tongue** — Brew Deep Breath (2 Moonleaf + 1 Mistfern; the Hall shows this clue), then drop the drinker on the Still Pond.
16. **Bell of Echoes** — Crown + Tongue + Spirit 3 + a Master Builder on the Hilltop Plinth, then build the belfry. Finale.

## Brews

Deep Breath (Moonleaf, Moonleaf, Mistfern) · Hearty Stew (Sunpetal, Emberberry, Ashroot) · Clear Mind (Moonleaf, Duskbloom, Sunpetal) · Mending Tonic (Mistfern, Mistfern, Sunpetal) · Quickstep (Emberberry ×3) · Youth Draught (Duskbloom, Duskbloom, Moonleaf) · Kinship Cordial (Emberberry, Duskbloom, Mistfern) · Glow Tea (Sunpetal ×3) · Stonebrew (Ashroot ×3) · Rain Tonic (Mistfern, Ashroot, Moonleaf). Anything else is a Murky Brew (+40 Lore).

## Map (v0.4)

The playable area is the south-western corner of a much larger island (world is 4000 × 2800 units). v0.4 mirrored the whole map west-to-east.
- **Cliff wall** along the north and down the east side, drawn as one continuous rock face lit from a sculpted heightfield (columns, ledges and rounded masses), so it has real depth. The rim rolls, rising into two mountain spurs in the north-west and north-east. Jungle canopy spills over the rim, and shrubs, ferns, small gnarled trees and hanging vines grow from the ledges. Heaped boulders, ferns and bushes line the foot of both walls. Behind the rim, rows of forested uplands rise toward hazy interior mountain ranges, so there is no empty space behind the walls. Trees, palms, bushes and boulders stand along the rim. The rim height varies strongly: low saddles, tall spurs, and a dip where the waterfall pours over. Villagers can't climb it; dropping one on top puts them back at the foot.
- **Waterfall** pours off the north cliff into a plunge pool. One continuous river runs from it down the east of the basin into the Still Pond, then out to the sea on the south beach. Banks, shallows and the river mouth are blended into the terrain, so the pool, river, pond and sea read as one connected body of water.
- **Sealed Cave** in the north-west cliff face, blocked by boulders. It's reserved for a future unlock.
- **Beach** along the south and west coasts. The sea runs in one smooth gradient from the surf out to deep water, with no hard color seam. Waves roll in as long broken crests, steepen, and break into a foam wash that slides up the sand.
- **The Mire** in the south-east corner, under the east cliffs. Villagers refuse to enter it. It's reserved for the combat and defense system.

## Art & performance

- **Style (v0.3):** grounded and naturalistic rather than cute. There are painterly leaf masses with shadowed undersides, bark texture, faceted rocks, strata and fractures on the cliffs, layered thatch and plastered walls, and muted wildflowers. Villagers are drawn in more natural proportions, and the outlines are thin and soft.
- **Screen:** it plays sideways (landscape) like a monitor. On a phone held upright, the whole game turns sideways automatically. The rotate button, or Menu → Screen, switches to upright play.
- Sprites render at 2.6× (1.6× in Battery Saver), and the ground texture is 0.6 px per world unit. All art is drawn by code at startup, with no image files. Startup takes about 1 second on a desktop and shows a loading screen while it works.
- Runs at 60 fps in testing. Controls are tap and drag, plus pinch or + and − to zoom.

## Next steps (suggested)

- Original storyline (who lived here, why the Bell matters) layered on top of the mysteries.
- A second and third island chapter, mirroring how games 2 and 3 moved to new shores.
- Sound and music.
- Real cross-device sync (cloud save) and store packaging.

## Trophies (158)

### Village & Family (26)

- **First Footprints**: Start a new village.
- **A New Voice**: Welcome your first baby.
- **Growing Family**: 10 babies born.
- **Full Cradles**: 25 babies born.
- **Sea of Faces**: 60 babies born.
- **Double Blessing**: Twins are born.
- **Hamlet**: Reach 10 villagers.
- **Village**: Reach 20 villagers.
- **Township**: Reach 30 villagers.
- **Island Nation**: Reach 40 villagers.
- **Full House**: Fill every bed: population equals capacity (12 or more).
- **Second Generation**: A villager of the 2nd generation is born.
- **Grandchildren**: A 3rd-generation villager is born.
- **Deep Roots**: A 4th-generation villager is born.
- **Dynasty**: A 6th-generation villager is born.
- **Coming of Age**: A child born on the island grows up.
- **Next of Kin**: 10 island-born children grow up.
- **Silver Hair**: A villager reaches 60.
- **Venerable**: A villager reaches 75.
- **Ancient One**: A villager reaches 85.
- **Remembered**: A villager passes away.
- **Baby Boom**: 3 babies born within a single year.
- **Matchmaker**: Pair villagers up 15 times.
- **Big Family**: One villager has 5 children.
- **Castaway**: A stranger washes ashore and joins you.
- **Long Live the Warden**: Crown a second Warden.

### Food (18)

- **First Harvest**: Bring food to the larder.
- **Stocked Larder**: Hold 1,000 food at once.
- **Overflowing Larder**: Hold 5,000 food at once.
- **Endless Feast**: Hold 20,000 food at once.
- **Hard Workers**: Gather 5,000 food in total.
- **Bountiful Isle**: Gather 50,000 food in total.
- **Breadbasket**: Gather 250,000 food in total.
- **Little Helpers**: A child brings in a glowcap.
- **Glowcap Hunters**: Children bring in 30 glowcaps.
- **Picked Clean**: Empty the Berry Bramble.
- **Sweet Reward**: Collect honey from the Hive Tree.
- **Busy Bees**: Collect honey 100 times.
- **First Sprouts**: Harvest the Terrace Field.
- **Golden Rows**: Harvest the field 200 times.
- **Catch of the Day**: Bring in fish from the Tide Nets.
- **Net Profits**: Bring in fish 300 times.
- **Lean Times**: A villager goes hungry with an empty larder.
- **Well Fed**: Go 5 years without anyone starving.

### Lore & Tech (19)

- **First Insight**: Earn your first Lore.
- **Scholars' Circle**: Earn 5,000 Lore in total.
- **Keepers of Lore**: Earn 50,000 Lore in total.
- **Living Library**: Earn 200,000 Lore in total.
- **Saving Up**: Hold 10,000 Lore at once.
- **Tilled Earth**: Reach Harvest level 2.
- **Harvest Mastery**: Reach Harvest level 3.
- **Herbal Wisdom**: Reach Remedy level 2.
- **Healing Arts**: Reach Remedy level 3.
- **Close-Knit**: Reach Kinship level 2.
- **Bonds Unbroken**: Reach Kinship level 3.
- **Stone and Timber**: Reach Craft level 2.
- **Master Plans**: Reach Craft level 3.
- **Written Word**: Reach Lore level 2.
- **Enlightenment**: Reach Lore level 3.
- **Old Songs**: Reach Spirit level 2.
- **One with the Island**: Reach Spirit level 3.
- **Well Rounded**: Every tech at level 2 or higher.
- **Golden Age**: Every tech at level 3.

### Skills (25)

- **Green Thumb**: Train a Novice Forager.
- **Skilled Forager**: Train a Skilled Forager.
- **Master Forager**: Train a Master Forager.
- **Hammer and Peg**: Train a Novice Builder.
- **Skilled Builder**: Train a Skilled Builder.
- **Master Builder**: Train a Master Builder.
- **Curious Mind**: Train a Novice Scholar.
- **Skilled Scholar**: Train a Skilled Scholar.
- **Master Scholar**: Train a Master Scholar.
- **Gentle Hands**: Train a Novice Healer.
- **Skilled Healer**: Train a Skilled Healer.
- **Master Healer**: Train a Master Healer.
- **Nurturer**: Train a Novice Parent.
- **Skilled Parent**: Train a Skilled Parent.
- **Devoted Parent**: Train a Master Parent.
- **Jack of All Trades**: One villager Skilled in 3 different skills.
- **Paragon**: One villager Master of 3 different skills.
- **Builders' Guild**: 3 Master Builders alive at once.
- **Faculty**: 3 Master Scholars alive at once.
- **Prodigy**: A child reaches Novice in any skill.
- **First Cure**: Heal a sick villager.
- **Village Healer**: Heal 25 sick villagers.
- **Island Physician**: Heal 100 sick villagers.
- **Born Learner**: A baby is born already knowing a skill.
- **Persistence**: Teach a job to a villager who was confused 3 times first.

### Mysteries (20)

- **Sweetwater Spring**: Solve the mystery: Sweetwater Spring.
- **First Flame**: Solve the mystery: First Flame.
- **Smoke and Honey**: Solve the mystery: Smoke and Honey.
- **Clearing the Shore**: Solve the mystery: Clearing the Shore.
- **Tide Nets**: Solve the mystery: Tide Nets.
- **The Terrace**: Solve the mystery: The Terrace.
- **The Straw Watcher**: Solve the mystery: The Straw Watcher.
- **Hall of Learning**: Solve the mystery: Hall of Learning.
- **The Warden's Mantle**: Solve the mystery: The Warden's Mantle.
- **Rain Chant**: Solve the mystery: Rain Chant.
- **Brewer's Cauldron**: Solve the mystery: Brewer's Cauldron.
- **House of Mending**: Solve the mystery: House of Mending.
- **Weaver's Lodge**: Solve the mystery: Weaver's Lodge.
- **Buried Crown**: Solve the mystery: Buried Crown.
- **Sunken Tongue**: Solve the mystery: Sunken Tongue.
- **Bell of Echoes**: Solve the mystery: Bell of Echoes.
- **Getting Curious**: Solve 4 mysteries.
- **Halfway There**: Solve 8 mysteries.
- **Nearly Unveiled**: Solve 12 mysteries.
- **Island Remembered**: Solve all 16 mysteries.

### Curios (11)

- **Shiny Thing**: A child digs up a curio.
- **Collector**: Find 10 different curios.
- **Cabinet of Wonders**: Find 20 different curios.
- **Curator**: Find all 30 curios.
- **Tide Pool**: Complete the Shells collection.
- **Plumage**: Complete the Feathers collection.
- **Rockhound**: Complete the Stones collection.
- **Ancestors' Things**: Complete the Relics collection.
- **Keepsakes**: Complete the Keepsakes collection.
- **Déjà Vu**: Find a curio you already had.
- **Magpies**: Dig up 100 curios in total.

### Brewing (10)

- **Into the Pot**: Put a herb in the cauldron.
- **First Bubbles**: Brew anything.
- **Murky Results**: Brew something that does nothing.
- **Apprentice Brewer**: Discover 3 recipes.
- **Brewmaster**: Discover 6 recipes.
- **Grand Alchemist**: Discover all 10 recipes.
- **Hold Your Breath**: Brew Deep Breath.
- **Spring in Their Step**: Someone drinks a Youth Draught.
- **Herb Basket**: Bring 50 herbs to the cauldron.
- **Busy Cauldron**: Brew 25 times.

### Building (8)

- **A Roof Overhead**: Build a new hut.
- **Neighborhood**: Build 4 new huts.
- **Every Site Filled**: Build all 6 new huts.
- **Busy Hands**: Finish 5 construction projects.
- **Construction Boom**: Finish 12 construction projects.
- **Keep It Burning**: Refuel the hearth fire 10 times.
- **New Threads**: Buy an outfit at the Weaver's Lodge.
- **Fashion Parade**: Buy 10 outfits.

### Island Life (21)

- **First Year**: Survive one year on the island.
- **A Decade**: Reach year 10.
- **Quarter Century**: Reach year 25.
- **Half a Century**: Reach year 50.
- **Timeless**: Reach year 100.
- **Rain on the Roofs**: Weather a rain shower.
- **Into the Mist**: See the island covered in fog.
- **Weathered the Storm**: Make it through a storm.
- **Rainbow's End**: See a rainbow after the rain.
- **Wish Upon a Star**: Tap a shooting star.
- **Stargazer**: Tap 5 shooting stars.
- **Night Owl**: Visit your village late at night.
- **Early Riser**: Visit your village at dawn.
- **Helping Hand**: Pick up a villager.
- **Guiding Hand**: Guide villagers 100 times.
- **Splash!**: Drop a villager in the sea.
- **Name Giver**: Rename a villager.
- **People Person**: Look at villager cards 20 times.
- **Hurry Up**: Play at the fastest speed.
- **Welcome Back**: Return after at least an hour away.
- **Faithful Keeper**: Visit the village on 7 different days.

## Map v0.5
- The Mire enlarged (centre 3330,2200; ~530x430): runs from the river bank to the east cliff foot, fringed with reeds/ferns/dead trees, mud blending into meadow, boulders along the cliff foot.
- Centre thinned (less scenery around the hearth).
- South-west sandy spit with a shallow lagoon; beaches ~2.5x wider in the SW; coast pulled inland slightly so the ocean is larger; east coast added so the SE corner ends in sea.
- East wall shortened outward taper (sideX +140); forested massif filled behind east cliffs; cliffs/forest extended past the NW corner.

## Art pass v0.6 (naturalization)
- Sprites: volumetric light gradient (warm top / cool bottom), thinner, softer outlines, finer leaf clusters, per-instance scale and flip variation for scenery.
- Cliffs: strata blended (no flat stripes), warm/cool weathering patches, rain streaks, softer foot shadow + ground contact shadow.
- Backdrop: 10 forested ridge rows with stacked canopy strips (no flat floor showing), cached offscreen until the camera moves.
- Coasts: noisier shorelines, east coast + sea continues past the map edge without seams, feathered waterline under the east upland.
