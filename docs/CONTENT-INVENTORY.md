# Content Inventory

A static manifest of every video type, game genre, and content warning surfaced in YTDescGen's editor. Maintained manually — when adding a new option to one of the source files below, **add a row here too** in the same PR.

This file exists for **transparency** — anyone curious about what the editor can describe (without installing the app or reading the source) can scan it in one minute.

**Vietnamese mirror:** [`docs/i18n/vi/CONTENT-INVENTORY.md`](./i18n/vi/CONTENT-INVENTORY.md).

**Source of truth:**
- Video types: [`src/config/video-types.ts`](../src/config/video-types.ts)
- Game genres: [`src/config/genres.ts`](../src/config/genres.ts)
- Content warnings: [`src/config/content-warning-groups.ts`](../src/config/content-warning-groups.ts)

---

## 1. Video types (20)

Each video type drives a dedicated description template + title structure + tag bias. The "Extra fields" column lists fields the editor reveals when this type is selected.

| Icon | Type | Extra fields |
|---|---|---|
| 🎮 | Full Gameplay | — |
| 📂 | Gameplay Part | Part Number |
| 🎬 | Full Demo | — |
| 🎞 | Demo Part | Part Number |
| 👹 | Boss Fight | Boss Name |
| 💀 | Boss No Hit | Boss Name |
| 🏁 | Ending / All Endings | — |
| ⚡ | Speedrun | — |
| 💯 | 100% Completion | — |
| 📦 | DLC Content | DLC Name |
| 🔄 | New Game+ | — |
| 🏆 | Challenge Run | Challenge Name |
| 📌 | Side Quests | — |
| 🔍 | Secrets / Hidden | — |
| ⚖️ | Graphics Comparison | — |
| 📘 | Silent Guide | — |
| 🧩 | Modded Gameplay | Mod Name |
| ⭐ | All Collectibles | — |
| 🔴 | Livestream | Live URL, Scheduled Time |
| 🎴 | Gacha Quest | Quest Type, Chapter Name, Quest Name, Part Number |

---

## 2. Game genres (41)

Selected genres feed the title format, the tag pool, and (when configured in Settings → Genre Playlists) the pinned-comment recommendation.

Bulk-select groups available in the editor: **All RPGs** (rpg + jrpg + action_rpg + crpg), **All Shooters** (fps + arena_shooter + tactical_fps + boomer_shooter + extraction_shooter + shmup), **All Horror** (horror + survival_horror + psychological_horror).

| Icon | Genre |
|---|---|
| ⚔️ | Action / Adventure |
| 🗡 | Hack & Slash |
| 👊 | Beat 'em Up |
| 🦘 | Platformer |
| 👻 | Horror / Survival |
| 🧟 | Survival Horror |
| 🧠 | Psychological Horror |
| 🛡 | RPG |
| 🎎 | JRPG |
| 🏹 | Action RPG |
| 📜 | CRPG / Isometric |
| 🔫 | FPS / Shooter |
| 🎯 | Arena Shooter |
| 🎖 | Tactical FPS |
| 💥 | Boomer Shooter |
| 🎒 | Extraction Shooter |
| 🛸 | SHMUP / Bullet Hell |
| 🌍 | Open World / Sandbox |
| 🕹 | Indie |
| 💀 | Souls-like |
| 🏎 | Racing / Sports |
| 📖 | Story / Narrative |
| 🏗 | Simulation / Strategy |
| 🏙 | City Builder |
| 🥊 | Fighting |
| 🥷 | Stealth / Espionage |
| ⛏ | Survival / Crafting |
| 🎲 | Roguelike / Roguelite |
| 🗺 | Metroidvania |
| 🌐 | MMO / Online |
| 🎵 | Rhythm / Music |
| 🧩 | Puzzle |
| 🏰 | Tower Defense |
| 🃏 | Card Game |
| 🎴 | Deck Builder |
| 🤖 | Auto Battler |
| 🏆 | Battle Royale |
| ♟ | Tactical / Turn-based |
| 🚀 | Space / Sci-Fi |
| 🌾 | Farming / Life Sim |
| 🎬 | FMV / Interactive Movie |
| 💬 | Visual Novel |

---

## 3. Content warnings (175, grouped)

Selected warnings are appended to a `⚠ CONTENT WARNINGS` block in the description, ahead of timestamps. Each group is collapsible in the editor; warnings render in description order = user's selection order.

### Spoilers (6)

Story / ending spoilers · Ending spoilers · True-ending spoilers · Post-game / NG+ spoilers · Secret-ending spoilers · DLC story spoilers

### Photosensitive / Health (6)

Flashing lights · Motion sickness · Migraine trigger · Loud / sudden sounds · Strobe lighting · Heavy screen shake

### Phobias (51)

Jumpscares · Heights (acrophobia) · Holes / clusters (trypophobia) · Deep water (thalassophobia) · Confined spaces (claustrophobia) · Spiders (arachnophobia) · Insects (entomophobia) · Snakes (ophidiophobia) · Dogs (cynophobia) · Darkness (nyctophobia) · Fire (pyrophobia) · Dolls (pediophobia) · Blood (hemophobia) · Clowns (coulrophobia) · Drowning / water immersion (ablutophobia) · Live burial (taphophobia) · Animatronics / mannequins (automatonophobia) · Large objects (megalophobia) · Submerged man-made objects (submechanophobia) · Corpses (necrophobia) · Ghosts (spectrophobia) · Demons (demonophobia) · Sharks (selachophobia) · Germs / contamination (mysophobia) · Vomiting (emetophobia) · Being watched (scopophobia) · Isolation (monophobia) · Mice / rats (musophobia) · Bats (chiroptophobia) · Birds (ornithophobia) · Fish (ichthyophobia) · Reptiles (herpetophobia) · Cockroaches (katsaridaphobia) · Bees / wasps (apiphobia) · Thunder / lightning (astraphobia) · Open spaces (agoraphobia) · Crowds (enochlophobia) · Snow / extreme cold (chionophobia) · Hospitals (nosocomephobia) · Sharp objects (aichmophobia) · Choking / suffocation (pnigophobia) · Fog / mist (homichlophobia) · Tornadoes / hurricanes (lilapsophobia) · Heavy rain (ombrophobia) · Clouds (nephophobia) · Strong wind (ancraophobia) · Extreme cold (cryophobia) · Sunlight (heliophobia) · Large waves (cymophobia) · Lakes / still water (limnophobia) · Rivers / currents (potamophobia)

### Mental health (17)

Anxiety-inducing scenes · Depression themes · Eating disorders · Substance use · Self-harm / suicide · PTSD content · Needles · Body fluids · Pregnancy / birth horror · Illness / infection · Bipolar themes · OCD themes · Panic attacks · Dissociation · Paranoia · Intrusive thoughts · Medical horror

### Social phenomena (20)

Autism / neurodivergence themes · ADHD / executive dysfunction · Hikikomori / social withdrawal · NEET themes · Social anxiety themes · Social isolation / loneliness · Schizophrenia / psychosis · Burnout / overwork · Survivor guilt · Abandonment themes · Parasocial relationships · Gaslighting · Stockholm syndrome · Gaming / gambling addiction · Existential / nihilistic themes · Impostor syndrome · Midlife crisis · Quarter-life crisis · Workplace harassment · Gender-role pressure

### Mature / Sensitive content (49)

Blood and gore · Mature 18+ · Disturbing imagery · Animal cruelty · Violence against minors · Domestic violence · Sexual assault references · Torture · Religious themes · War violence · Discrimination · State / police violence · Smoking / drinking · Detailed killing · Cult / occult · Psychological manipulation · Loss / grief · Kidnapping · Hate speech · Historical atrocities · Slavery themes · Terrorism themes · Bullying themes · Human experimentation · Cannibalism · Nuclear / radiation · Homophobia / anti-LGBTQ+ · Transphobia / anti-trans · Xenophobia / anti-foreigner · Political extremism · Religious extremism / fundamentalism · Genocide / ethnic cleansing · Holy war / sectarian conflict · Holocaust themes · Civil war · Mass / school shootings · Colonialism / imperialism · State propaganda · Surveillance / dystopian state · Conspiracy theories · Censorship themes · Ethnic / racial conflict · Refugee crisis · Revolution / uprising · Political assassination · Coup d'état · Inquisition / religious persecution · Forced labor · Ultranationalism

### Heavy horror (12)

Eyes / eyeball clusters · Body horror (flesh distortion) · Distorted / mutilated faces · Cosmic / eldritch horror · Extreme gore / dismemberment · Decay, rot, maggots · Mutilation / amputation · Liminal spaces · Analog horror / VHS · Unreality / distortion · Pursuit / chase · Entity / SCP horror

### Playstyle disclosures (10)

Blind playthrough · No spoilers in chat · Casual / story mode · Hardcore / max difficulty · Permadeath / Iron Man · Speedrun attempt · 100% completionist · Still learning mechanics · First time playing · Returning / NG+

### Gameplay disclosure (4)

Mods used · Cheats / debug · Glitches used · Guide-assisted

---

## 4. Maintenance

When adding a new item to any of the source files:

1. **Video types** → append to [`src/config/video-types.ts`](../src/config/video-types.ts) AND add a row in section 1 above.
2. **Genres** → append to [`src/config/genres.ts`](../src/config/genres.ts) AND add a row in section 2.
3. **Content warnings** → append to the relevant group in [`src/config/content-warning-groups.ts`](../src/config/content-warning-groups.ts) AND add the label to the right group in section 3 — keep the group count in the heading accurate.
4. Update the Vietnamese mirror at [`docs/i18n/vi/CONTENT-INVENTORY.md`](./i18n/vi/CONTENT-INVENTORY.md) in the same PR.

Mismatch between this file and the source files is treated as a documentation bug — open an issue or PR.
