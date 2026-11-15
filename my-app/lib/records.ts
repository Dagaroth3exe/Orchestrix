/**
 * The Listening Room crate. Audio streams through Spotify's official embed
 * player (licensed playback); cover art is Spotify's own artwork for each
 * release. Nothing is bundled with the app.
 */

export type RecordItem = {
  id: string;
  title: string;
  artist: string;
  uri: string; // spotify:track:… / spotify:album:…
  cover: string; // 640px cover art (CORS-enabled, used as a WebGL texture)
  label: string; // accent colour for the vinyl's label ring
  note: string; // short liner note
};

const art = (hash: string) => `https://i.scdn.co/image/ab67616d0000b273${hash}`;

export const RECORDS: RecordItem[] = [
  {
    id: "marcel",
    title: "Marcel",
    artist: "Her's",
    uri: "spotify:track:5u9cuDcYdOpSRB7fAYXXdp",
    cover: art("fc1bc1cf80c431c2bdbde601"),
    label: "#d9a3b5",
    note: "Jangly guitars and a bassline that never quite sits still.",
  },
  {
    id: "about-you",
    title: "About You",
    artist: "The 1975",
    uri: "spotify:track:1fDFHXcykq4iw8Gg7s5hG9",
    cover: art("1f44db452a68e229650a302c"),
    label: "#c9c2b4",
    note: "A slow, shimmering haze of guitars and two voices.",
  },
  {
    id: "fool-for-you",
    title: "A Fool for You",
    artist: "Shau Evans",
    uri: "spotify:album:11dEktsKJaEy2ynDrePq36",
    cover: art("8996ec43ba1780a9da3a466e"),
    label: "#c9a45c",
    note: "Warm, late-night soul with a heart on its sleeve.",
  },
  {
    id: "my-way",
    title: "My Way",
    artist: "Frank Sinatra",
    uri: "spotify:track:0mdefZ4yfFr2DehHGIqLCX",
    cover: art("db1be510b04d3d0631bf4a84"),
    label: "#b8443f",
    note: "Paul Anka's words, Sinatra's voice, and a full orchestra behind them.",
  },
  {
    id: "fire-for-you",
    title: "Fire for You",
    artist: "Cannons",
    uri: "spotify:track:4o0LyB69tylqDG6eTGhmig",
    cover: art("a201a9e6882334f40272453f"),
    label: "#e07a52",
    note: "Dreamy synths and a slow-burning groove.",
  },
  {
    id: "loser",
    title: "Loser",
    artist: "Tame Impala",
    uri: "spotify:track:3RmFPuTTAjSQ2pbEd2j9oA",
    cover: art("e2aa48290b3cd1040be92345"),
    label: "#8fa6c4",
    note: "Hazy, self-deprecating psych-pop with a groove that sticks.",
  },
];

/** "About a minute" per side. */
export const SIDE_SECONDS = 60;
