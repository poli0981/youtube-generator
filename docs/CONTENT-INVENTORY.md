# Content Inventory

A static manifest of every video type, game genre, content warning, tech note, store, link field and cross-post platform surfaced in YTDescGen's editor (as of v1.2.0). Maintained manually — when adding a new option to one of the source files below, **add a row here too** in the same PR.

This file exists for **transparency** — anyone curious about what the editor can describe (without installing the app or reading the source) can scan it in one minute.

**Vietnamese mirror:** [`docs/i18n/vi/CONTENT-INVENTORY.md`](./i18n/vi/CONTENT-INVENTORY.md).

**Source of truth:**

- Video types: [`src/config/video-types.ts`](../src/config/video-types.ts)
- Game genres: [`src/config/genres.ts`](../src/config/genres.ts)
- Content warnings: [`src/config/content-warning-groups.ts`](../src/config/content-warning-groups.ts)
- Tech notes: [`src/config/tech-note-groups.ts`](../src/config/tech-note-groups.ts)
- Stores: [`src/config/platforms.ts`](../src/config/platforms.ts)
- Social & donate links: [`src/config/social-fields.ts`](../src/config/social-fields.ts)
- Community links: [`src/components/editor/CommunityEditor.tsx`](../src/components/editor/CommunityEditor.tsx)
- Vietnamese banks: [`src/config/vietnamese-banks.ts`](../src/config/vietnamese-banks.ts)
- Cross-post platforms: [`src/config/social-platforms.ts`](../src/config/social-platforms.ts)

---

## 1. Video types (20)

Each video type drives a dedicated description template + title structure + tag bias. The "Extra fields" column lists fields the editor reveals when this type is selected.

| Icon | Type                 | Extra fields                                      |
| ---- | -------------------- | ------------------------------------------------- |
| 🎮   | Full Gameplay        | —                                                 |
| 📂   | Gameplay Part        | Part Number                                       |
| 🎬   | Full Demo            | —                                                 |
| 🎞    | Demo Part            | Part Number                                       |
| 👹   | Boss Fight           | Boss Name                                         |
| 💀   | Boss No Hit          | Boss Name                                         |
| 🏁   | Ending / All Endings | —                                                 |
| ⚡   | Speedrun             | —                                                 |
| 💯   | 100% Completion      | —                                                 |
| 📦   | DLC Content          | DLC Name                                          |
| 🔄   | New Game+            | —                                                 |
| 🏆   | Challenge Run        | Challenge Name                                    |
| 📌   | Side Quests          | —                                                 |
| 🔍   | Secrets / Hidden     | —                                                 |
| ⚖️   | Graphics Comparison  | —                                                 |
| 📘   | Silent Guide         | —                                                 |
| 🧩   | Modded Gameplay      | Mod Name                                          |
| ⭐   | All Collectibles     | —                                                 |
| 🔴   | Livestream           | Live URL, Scheduled Time                          |
| 🎴   | Gacha Quest          | Quest Type, Chapter Name, Quest Name, Part Number |

---

## 2. Game genres (42)

Selected genres (up to 3 per video) feed the title format, the tag pool, and (when configured in Settings → Genre Playlists) the pinned-comment recommendation.

Bulk-select groups available in the editor: **All RPGs** (rpg + jrpg + action_rpg + crpg), **All Shooters** (fps + arena_shooter + tactical_fps + boomer_shooter + extraction_shooter + shmup), **All Horror** (horror + survival_horror + psychological_horror). A group replaces the selection with its first three genres.

| Icon | Genre                   |
| ---- | ----------------------- |
| ⚔️   | Action / Adventure      |
| 🗡    | Hack & Slash            |
| 👊   | Beat 'em Up             |
| 🦘   | Platformer              |
| 👻   | Horror / Survival       |
| 🧟   | Survival Horror         |
| 🧠   | Psychological Horror    |
| 🛡    | RPG                     |
| 🎎   | JRPG                    |
| 🏹   | Action RPG              |
| 📜   | CRPG / Isometric        |
| 🔫   | FPS / Shooter           |
| 🎯   | Arena Shooter           |
| 🎖    | Tactical FPS            |
| 💥   | Boomer Shooter          |
| 🎒   | Extraction Shooter      |
| 🛸   | SHMUP / Bullet Hell     |
| 🌍   | Open World / Sandbox    |
| 🕹    | Indie                   |
| 💀   | Souls-like              |
| 🏎    | Racing / Sports         |
| 📖   | Story / Narrative       |
| 🏗    | Simulation / Strategy   |
| 🏙    | City Builder            |
| 🥊   | Fighting                |
| 🥷   | Stealth / Espionage     |
| ⛏    | Survival / Crafting     |
| 🎲   | Roguelike / Roguelite   |
| 🗺    | Metroidvania            |
| 🌐   | MMO / Online            |
| 🎵   | Rhythm / Music          |
| 🧩   | Puzzle                  |
| 🏰   | Tower Defense           |
| 🃏   | Card Game               |
| 🎴   | Deck Builder            |
| 🤖   | Auto Battler            |
| 🏆   | Battle Royale           |
| ♟    | Tactical / Turn-based   |
| 🚀   | Space / Sci-Fi          |
| 🌾   | Farming / Life Sim      |
| 🎬   | FMV / Interactive Movie |
| 💬   | Visual Novel            |

---

## 3. Content warnings (257, grouped)

Selected warnings are rendered in a `▸ ⚠️ CONTENT WARNINGS` block in the description, after the rig block (and the mod list, for Modded Gameplay). Each group is collapsible in the editor; warnings render in description order = user's selection order.

### Spoilers (6)

Story / ending spoilers · Ending spoilers · True-ending spoilers · Post-game / NG+ spoilers · Secret-ending spoilers · DLC story spoilers

### Photosensitive / Health (13)

Flashing lights · Motion sickness · Migraine trigger · Strobe lighting · Heavy screen shake · Lens flare / sun glare · Excessive bloom / overblown highlights · Dense particle effects · Flashing HUD / UI overlays · Extreme color saturation · Heavy motion blur · Aggressive depth of field · Intense post-processing

### Audio / Sensory (13)

Loud / sudden sounds · Ear-piercing / high-pitched · Audio jumpscares · Sudden volume changes · Distorted / clipping audio · Screeching / metallic sounds · Persistent high-pitched tones · Audio glitches / artifacts · Heavy bass / sub-bass rumble · Sustained screaming · Glass breaking / shattering · Mic pops / breath noise · White noise / static

### Dialogue / Language (10)

Frequent profanity · Sexual innuendo / suggestive dialogue · Inflammatory / inciting dialogue · Verbal abuse · Threats / intimidation · Slurs / derogatory terms · Crude / toilet humor · Mature / adult humor · Dark / morbid humor · Drug / alcohol references

### Phobias (56)

Jumpscares · Heights (acrophobia) · Holes / clusters (trypophobia) · Deep water (thalassophobia) · Confined spaces (claustrophobia) · Spiders (arachnophobia) · Insects (entomophobia) · Snakes (ophidiophobia) · Dogs (cynophobia) · Darkness (nyctophobia) · Fire (pyrophobia) · Dolls (pediophobia) · Blood (hemophobia) · Clowns (coulrophobia) · Drowning / water immersion (ablutophobia) · Live burial (taphophobia) · Animatronics / mannequins (automatonophobia) · Large objects (megalophobia) · Submerged man-made objects (submechanophobia) · Corpses (necrophobia) · Ghosts (spectrophobia) · Demons (demonophobia) · Sharks (selachophobia) · Germs / contamination (mysophobia) · Vomiting (emetophobia) · Being watched (scopophobia) · Isolation (monophobia) · Mice / rats (musophobia) · Bats (chiroptophobia) · Birds (ornithophobia) · Fish (ichthyophobia) · Reptiles (herpetophobia) · Cockroaches (katsaridaphobia) · Bees / wasps (apiphobia) · Thunder / lightning (astraphobia) · Open spaces (agoraphobia) · Crowds (enochlophobia) · Snow / extreme cold (chionophobia) · Hospitals (nosocomephobia) · Sharp objects (aichmophobia) · Choking / suffocation (pnigophobia) · Fog / mist (homichlophobia) · Tornadoes / hurricanes (lilapsophobia) · Heavy rain (ombrophobia) · Clouds (nephophobia) · Strong wind (ancraophobia) · Extreme cold (cryophobia) · Sunlight (heliophobia) · Large waves (cymophobia) · Lakes / still water (limnophobia) · Rivers / currents (potamophobia) · Colors / vivid color scenes (chromophobia) · Red / all-red scenes (erythrophobia) · Yellow color (xanthophobia) · White / all-white spaces (leukophobia) · Black color (melanophobia)

### Mental health (17)

Anxiety-inducing scenes · Depression themes · Eating disorders · Substance use · Self-harm / suicide · PTSD content · Needles · Body fluids · Pregnancy / birth horror · Illness / infection · Bipolar themes · OCD themes · Panic attacks · Dissociation · Paranoia · Intrusive thoughts · Medical horror

### Social phenomena (22)

Autism / neurodivergence themes · ADHD / executive dysfunction · Hikikomori / social withdrawal · NEET themes · Social anxiety themes · Social isolation / loneliness · Schizophrenia / psychosis · Burnout / overwork · Survivor guilt · Abandonment themes · Parasocial relationships · Gaslighting · Stockholm syndrome · Gaming / gambling addiction · Existential / nihilistic themes · Impostor syndrome · Midlife crisis · Quarter-life crisis · Workplace harassment · Gender-role pressure · Body shaming / appearance mockery · Unrealistic beauty standards

### Internet / Digital life (19)

Cyberbullying / online harassment · Doxxing / privacy exposure · Trolling / griefing · Cancel culture / public shaming · Social media addiction · Doomscrolling · FOMO (fear of missing out) · Fake news / misinformation · Online scams / phishing · Catfishing / fake identity · Deepfakes / synthetic media · Cyberstalking · Dangerous viral challenges · Influencer culture / clout chasing · Online radicalization / echo chambers · Loot boxes / gacha mechanics · In-game purchases · AI / artificial intelligence themes · Data privacy / mass surveillance

### Mature / Sensitive content (67)

Blood and gore · Mature 18+ · Revealing / skimpy outfits · Partial nudity · Sexualized character designs · Fan service / ecchi · Suggestive poses / camera angles · Disturbing imagery · Animal cruelty · Violence against minors · Domestic violence · Sexual assault references · Torture · Religious themes · War violence · Discrimination · State / police violence · Smoking / drinking · Simulated gambling · Detailed killing · Cult / occult · Psychological manipulation · Loss / grief · Kidnapping · Hate speech · Historical atrocities · Slavery themes · Terrorism themes · Bullying themes · Human experimentation · Cannibalism · Nuclear / radiation · Homophobia / anti-LGBTQ+ · Transphobia / anti-trans · Xenophobia / anti-foreigner · Political extremism · Religious extremism / fundamentalism · Genocide / ethnic cleansing · Holy war / sectarian conflict · Holocaust themes · Civil war · Mass / school shootings · Colonialism / imperialism · State propaganda · Surveillance / dystopian state · Conspiracy theories · Censorship themes · Ethnic / racial conflict · Refugee crisis · Revolution / uprising · Political assassination · Coup d'état · Inquisition / religious persecution · Forced labor · Ultranationalism · Hanging / strangulation · Drowning scene · Burning alive / immolation · Asphyxiation / suffocation · Bound / restrained victim · Public execution · Decapitation · Impalement · Mass-casualty event · Vehicular violence · Overdose scene · Falling from height (intentional)

### Heavy horror (12)

Eyes / eyeball clusters · Body horror (flesh distortion) · Distorted / mutilated faces · Cosmic / eldritch horror · Extreme gore / dismemberment · Decay, rot, maggots · Mutilation / amputation · Liminal spaces · Analog horror / VHS · Unreality / distortion · Pursuit / chase · Entity / SCP horror

### Playstyle disclosures (10)

Blind playthrough · No spoilers in chat · Casual / story mode · Hardcore / max difficulty · Permadeath / Iron Man · Speedrun attempt · 100% completionist · Still learning mechanics · First time playing · Returning / NG+

### Gameplay disclosure (5)

Mods used · Cheats / debug · Glitches used · Guide-assisted · Educational / PSA purpose

### AI-generated content (7)

AI-generated content (general) · AI art / visuals · AI / synthetic voices · AI music / sound · AI-written text / dialogue · Generated live by AI while playing · AI use disclosed by the developer

The game itself is made or run with generative AI — a story _about_ AI is "AI / artificial intelligence themes" above. The split follows Steam's AI disclosure: content made with AI during development and shipped in the game, and content an AI generates live while you play. Machine translation is the **Language patch** field in Playthrough notes, so it has no warning here. YouTube doesn't ask for gameplay footage to be labelled as altered or synthetic; these lines are for viewers.

---

## 4. Tech notes (25, grouped)

Selected notes are rendered in a `▸ 🛠 TECH NOTES` block right after the content warnings, in the order you picked them. They describe the recording, not the game. Facts that have their own field — difficulty, endings shown, language patch, game version, the upscaler and frame generation in Video settings — are not repeated here.

### Audio (5)

Some sections muted (copyright) · Volume reduced (copyright) · Game music replaced (copyright) · Cutscene audio muted only · Original audio kept (claim risk)

### Video quality (4)

Low resolution (hardware) · Lower graphics (performance) · FPS drops (hardware) · Upscaling / frame-gen artifacts

### Recording issues (4)

Bugs are from the game · Crash kept (transparency) · Loading screens cut · Possible OBS artifacts

### Playstyle disclaimers (8)

NOT a no-hit run · Not a clean walkthrough · Casual, no commentary · Many deaths · Slow exploration · May get stuck on puzzles · Grinding cut · Not a speedrun

### Production & attribution (4)

Exploration-focused (skip combat) · Edited for pacing · Support the developers · Online connectivity issues

---

## 5. Stores (15 + publisher site)

Each store has a link field. A store link pasted anywhere in the editor lands in the right field; the first one also sets the video's platform, whose search name is used in the tags. Each link is marked paid, free or demo.

| Store                      | Links accepted                                                             | Name in tags    |
| -------------------------- | -------------------------------------------------------------------------- | --------------- |
| Steam                      | `store.steampowered.com/app/…` (also `/sub/`, `/bundle/` and `s.team/a/…`) | Steam           |
| Epic Games Store           | `store.epicgames.com/…`                                                    | Epic Games      |
| PlayStation Store          | `store.playstation.com/…`                                                  | PlayStation     |
| Xbox / Microsoft Store     | `xbox.com/…`, `apps.microsoft.com/…`, Microsoft Store pages                | Xbox            |
| Nintendo eShop             | `nintendo.com/…` and the regional Nintendo sites                           | Nintendo Switch |
| GOG                        | `gog.com/…`                                                                | GOG             |
| itch.io                    | `<dev>.itch.io/<game>`                                                     | itch.io         |
| Humble Bundle              | `humblebundle.com/…`                                                       | Humble Bundle   |
| Amazon Luna                | `luna.amazon.com/…`, Amazon storefronts                                    | Amazon Luna     |
| EA app                     | `ea.com/…`                                                                 | EA app          |
| Ubisoft Store              | `store.ubisoft.com/…`, `ubisoft.com/…`                                     | Ubisoft Connect |
| Battle.net                 | `shop.battle.net/…` and its regional hosts                                 | Battle.net      |
| Google Play                | `play.google.com/store/apps/details?id=…`                                  | Android         |
| App Store                  | `apps.apple.com/…`                                                         | iOS             |
| Meta Quest Store           | `meta.com/…`, `oculus.com/…`                                               | Meta Quest      |
| Publisher / Developer site | any `https://` link                                                        | —               |

---

## 6. Social, donate & community links

### Donate (5)

Ko-fi · Patreon · Buy Me a Coffee · PayPal · Streamlabs

### Social (17)

GitHub · YouTube · X (Twitter) · Discord · Twitch · Kick · TikTok · Instagram · Threads · Bluesky · Mastodon · Facebook · Facebook Page · Reddit · Bilibili · Telegram · Website

### Community (5)

Messenger community · Signal group · Instagram group chat · Facebook Group · Zalo group (Vietnamese output only)

### Vietnamese banks (37)

For the Donate (Vietnam) block — bank transfer, MoMo and ZaloPay — which renders only when the output language is Vietnamese. "Other" lets you type any bank; a profile saved with a bank's former name is offered the new one.

- **State-owned (4):** Vietcombank · BIDV · VietinBank · Agribank
- **Joint-stock (24):** Techcombank · MB Bank · ACB · VPBank · TPBank · Sacombank · HDBank · VIB · SHB · Eximbank · OCB · MSB · LPBank · SeABank · ABBank · BAC A Bank · PVcomBank · NCB · Nam A Bank · KienlongBank · Saigonbank · VietABank · Vietbank · BVBank
- **Renamed in 2025, and digital-first (5):** MBV (formerly OceanBank) · VCBNeo (formerly CBBank) · Vikki Bank (formerly DongA Bank) · Cake by VPBank · Timo
- **Foreign-owned (4):** HSBC Vietnam · Standard Chartered · Shinhan Bank · UOB Vietnam

---

## 7. Cross-post platforms (7)

The Social tab turns the same editor data into short-form captions. When a caption runs over the platform's limit, optional blocks are dropped (content warnings first); hashtags are capped per platform.

| Platform        | Caption limit                                                                                 | Hashtags |
| --------------- | --------------------------------------------------------------------------------------------- | -------- |
| TikTok          | 4,000                                                                                         | no cap   |
| YouTube Shorts  | 5,000                                                                                         | up to 5  |
| Instagram Reels | 2,200                                                                                         | no cap   |
| Facebook Reels  | 2,200                                                                                         | no cap   |
| X               | 280, counted the way X counts (CJK, Vietnamese letters with diacritics and emoji count twice) | up to 3  |
| Threads         | 500                                                                                           | 1        |
| Bluesky         | 300                                                                                           | up to 3  |

---

## 8. Maintenance

When adding a new item to any of the source files:

1. **Video types** → append to [`src/config/video-types.ts`](../src/config/video-types.ts) (plus its title, intro and pinned-comment greeting in every `templates.json`) AND add a row in section 1 above.
2. **Genres** → append to [`src/config/genres.ts`](../src/config/genres.ts) (plus its tag pool and search term in `src/engine/tag-generator.ts` — a test keeps them in sync) AND add a row in section 2.
3. **Content warnings** → append the id to `CONTENT_WARNINGS` in `src/engine/types.ts` and to the relevant group in [`src/config/content-warning-groups.ts`](../src/config/content-warning-groups.ts), plus its editor label and description bullet in every locale and `_schema.json` (a test fails without them), AND add the label to the right group in section 3 — keep the counts in the headings accurate.
4. **Tech notes** → the same in `TECH_NOTES` and [`src/config/tech-note-groups.ts`](../src/config/tech-note-groups.ts) AND section 4.
5. **Stores** → add to [`src/config/platforms.ts`](../src/config/platforms.ts) (URL pattern and `tagName`; optionally a game-name extractor in `src/utils/url-extractors.ts`) AND add a row in section 5.
6. **Social / donate links** → add to [`src/config/social-fields.ts`](../src/config/social-fields.ts) (plus its `social.<id>` label in every `ui.json`) AND add it to section 6.
7. **Vietnamese banks** → add to [`src/config/vietnamese-banks.ts`](../src/config/vietnamese-banks.ts) — for a renamed bank, add the new name and map the old one in `VIETNAMESE_BANK_RENAMES` — AND update section 6.
8. **Cross-post platforms** → add to [`src/config/social-platforms.ts`](../src/config/social-platforms.ts) (plus its `socialPost.platforms.<id>` label in every `ui.json`) AND add a row in section 7.
9. Update the Vietnamese mirror at [`docs/i18n/vi/CONTENT-INVENTORY.md`](./i18n/vi/CONTENT-INVENTORY.md) in the same PR.

Mismatch between this file and the source files is treated as a documentation bug — open an issue or PR.
