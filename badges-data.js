const BADGE_CONFIG = {
  version: "v1",
  style: {
    name: "muted-boy-v1",
    notes: "Muted palette, circular badge with ribbon label. Icons in SVG; artwork can be swapped later with PNGs.",
    defaultSize: 256,
  },
  badges: [
    {
      id: "B001",
      key: "string_master",
      name: "STRING MASTER",
      tier: "starter",
      category: "instrument",
      unlock: {
        type: "rules_all",
        rules: [
          { type: "quiz_complete", value: "strings_basics" },
          { type: "audio_samples_listened", value: 3 },
        ],
      },
      assets: {
        svg: "assets/badges/svg/string_master.svg",
        png: "assets/badges/png/string_master.png",
      },
      ui: { order: 1, visibleOnboarding: true },
    },
    {
      id: "B002",
      key: "piano_prodigy",
      name: "PIANO PRODIGY",
      tier: "starter",
      category: "instrument",
      unlock: {
        type: "rules_all",
        rules: [
          { type: "quiz_complete", value: "keys_basics" },
          { type: "minigame_score_at_least", value: { game: "rhythm_match", score: 70 } },
        ],
      },
      assets: {
        svg: "assets/badges/svg/piano_prodigy.svg",
        png: "assets/badges/png/piano_prodigy.png",
      },
      ui: { order: 2, visibleOnboarding: true },
    },
    {
      id: "B003",
      key: "rock_star",
      name: "ROCK STAR",
      tier: "starter",
      category: "instrument",
      unlock: {
        type: "rules_all",
        rules: [
          { type: "instrument_selected", value: "electric_guitar" },
          { type: "path_complete", value: "guitar_intro" },
        ],
      },
      assets: {
        svg: "assets/badges/svg/rock_star.svg",
        png: "assets/badges/png/rock_star.png",
      },
      ui: { order: 3, visibleOnboarding: true },
    },
    {
      id: "B004",
      key: "brass_expert",
      name: "BRASS EXPERT",
      tier: "explorer",
      category: "instrument",
      unlock: {
        type: "rules_all",
        rules: [
          { type: "category_explored_count", value: { category: "brass", count: 2 } },
        ],
      },
      assets: {
        svg: "assets/badges/svg/brass_expert.svg",
        png: "assets/badges/png/brass_expert.png",
      },
      ui: { order: 4, visibleOnboarding: true },
    },
    {
      id: "B005",
      key: "acoustic_ace",
      name: "ACOUSTIC ACE",
      tier: "explorer",
      category: "instrument",
      unlock: {
        type: "rules_all",
        rules: [
          { type: "lesson_complete", value: "acoustic_vs_electric" },
        ],
      },
      assets: {
        svg: "assets/badges/svg/acoustic_ace.svg",
        png: "assets/badges/png/acoustic_ace.png",
      },
      ui: { order: 5, visibleOnboarding: true },
    },
    {
      id: "B006",
      key: "studio_star",
      name: "STUDIO STAR",
      tier: "identity",
      category: "creation",
      unlock: {
        type: "rules_all",
        rules: [
          { type: "feature_used", value: "beat_maker" },
          { type: "feature_used", value: "recording" },
        ],
      },
      assets: {
        svg: "assets/badges/svg/studio_star.svg",
        png: "assets/badges/png/studio_star.png",
      },
      ui: { order: 6, visibleOnboarding: true },
    },
    {
      id: "B007",
      key: "music_dude",
      name: "MUSIC DUDE",
      tier: "identity",
      category: "engagement",
      unlock: {
        type: "rules_all",
        rules: [
          { type: "activities_completed", value: 5 },
        ],
      },
      assets: {
        svg: "assets/badges/svg/music_dude.svg",
        png: "assets/badges/png/music_dude.png",
      },
      ui: { order: 7, visibleOnboarding: false },
    },
    {
      id: "B008",
      key: "music_hero",
      name: "MUSIC HERO",
      tier: "identity",
      category: "performance",
      unlock: {
        type: "rules_all",
        rules: [
          { type: "play_along_completed", value: 1 },
        ],
      },
      assets: {
        svg: "assets/badges/svg/music_hero.svg",
        png: "assets/badges/png/music_hero.png",
      },
      ui: { order: 8, visibleOnboarding: false },
    },
    {
      id: "B009",
      key: "jazz_cat",
      name: "JAZZ CAT",
      tier: "explorer",
      category: "genre",
      unlock: {
        type: "rules_all",
        rules: [
          { type: "genre_explored", value: "jazz" },
          { type: "audio_samples_listened", value: 3 },
        ],
      },
      assets: {
        svg: "assets/badges/svg/jazz_cat.svg",
        png: "assets/badges/png/jazz_cat.png",
      },
      ui: { order: 9, visibleOnboarding: false },
    },
    {
      id: "B010",
      key: "best_player",
      name: "BEST PLAYER",
      tier: "mastery",
      category: "skill",
      unlock: {
        type: "rules_all",
        rules: [
          { type: "streak_days", value: 7 },
        ],
      },
      assets: {
        svg: "assets/badges/svg/best_player.svg",
        png: "assets/badges/png/best_player.png",
      },
      ui: { order: 10, visibleOnboarding: true, showLockedOnboarding: true },
    },
    {
      id: "B011",
      key: "player_god",
      name: "PLAYER GOD",
      tier: "elite",
      category: "mastery",
      unlock: {
        type: "rules_all",
        rules: [
          { type: "all_core_badges_unlocked", value: true },
        ],
      },
      assets: {
        svg: "assets/badges/svg/player_god.svg",
        png: "assets/badges/png/player_god.png",
      },
      ui: { order: 11, visibleOnboarding: false, hiddenUntilEligible: true },
    },
  ],
};

const BADGE_INVENTORY = BADGE_CONFIG.badges;
const BADGE_ONBOARDING = BADGE_CONFIG.badges
  .filter((badge) => badge.ui && badge.ui.visibleOnboarding)
  .map((badge) => badge.id);

