# Melody to Chords: project handoff

## What this is
A single-page web tool for a pianist. They play a single-note melody on an acoustic piano, the tool turns it into notes, suggests chords per bar, and shows which keys to press. Target: iPad and phone, pop and Christian worship music, beginner-friendly.

User asked for:
- Record melody (acoustic piano, phone or iPad mic, single notes only).
- Several chord choices per bar (simple, worship, richer) because more than one chord can fit.
- After picking a chord, show the piano keys to press (left hand chord, right hand melody).
- Read chords as names, as sheet music, and hear them played.

## Current state (version 1, working)
Everything is in one file: `index.html` (about 62 KB, no build step, no dependencies except Google Fonts).

Page order inside the file: CSS tokens, HTML, then one `<script>` with these sections in order: theory, analysis, render, core, UI.

Features done:
- Load a recording (file input; `capture` attribute for "Record"). Decoded with OfflineAudioContext, notes found by pitch detection.
- Tap-in melody on an on-screen keyboard (note length picker, rest, undo, clear, octave shift).
- Note editor per bar: pitch, octave, length, position, delete, move all notes.
- Time signatures 4/4, 3/4, 6/8. Tempo field, optional tempo guess, key auto-detect with manual override (24 keys).
- Chords: 1 or 2 per bar, 3 to 5 candidates per bar ranked by fit, tap to pick. Styles Simple / Worship / Rich. Per-bar sound: Plain, Sus, Add9, 7th, Slash.
- Keyboard view for the selected bar: chord in blue (left hand), melody in amber (right hand), lowest note ringed, optional finger numbers. Left-hand shapes: chord only, bass + chord, open.
- Playback with a synthesised piano sound; left-hand patterns Hold, Pulse, Broken, Bass & chord. Play song, play bar, mute melody or chords.
- Sheet music (SVG grand staff with chord names, ties, rests, accidentals) and a text chord chart.
- State saved in localStorage key `melody-to-chords-v1`. An example melody loads when nothing is saved.

## How it works
- Time unit: eighth-note steps. A bar is 8 steps in 4/4 and 6 steps in 3/4 and 6/8. BPM counts quarter notes, so one step lasts 30/BPM seconds.
- Notes: `{p: midi, s: start step, d: length in steps}`. Kept sorted in `S.notes`.
- State object `S`; derived object `D` built by `derive()` (key, slots, chosen chord, spec, voicing). `changed()` = sort, derive, render, save.
- Pitch detection `analyseAudio`: downsample to about 11 kHz, YIN on 512-sample frames (hop 128), loudness gate, octave-error fix, median smoothing, segments of 5+ frames, split on loudness jumps for repeated notes. `guessBpm` fits an eighth-note grid between 50 and 140 BPM. `quantise` snaps to the grid. The first note counts as beat 1.
- Chords: `detectKey` uses Krumhansl profiles with a major-key bias and a bonus when the last note is the tonic. `analyseChords` scores diatonic chords against the melody (strong beats weigh more, non-chord tones penalised), adds chord priors and progression bonuses, and runs Viterbi. Picks pin a bar.
- Voicings: `closeVoice` / `voice` choose the inversion nearest the previous chord. Add9 chords put the 9th on top.
- Drawing: `kbSVG` (keyboard), `renderScore` (sheet music).

## Things that only applied inside the Claude page (change when self-hosting)
- The page could not use the microphone, so recording is "load a file". Self-hosted over HTTPS it can use `getUserMedia`.
- Saving used Claude's `downloads` capability (`window.claude.use('downloads')`). Outside Claude it is absent, so the two save buttons stay hidden. Replace with normal Blob downloads. MIDI (.mid) was not allowed there but is fine now.
- Script and font loading was restricted; fonts load from Google Fonts. Offline use needs local fonts or fallbacks.

## Testing done
- Node test: synthetic piano-like melody (92 BPM) through `analyseAudio`, `guessBpm`, `quantise`, `detectKey`, `analyseChords`. Tempo and nearly all notes correct.
- Playwright headless Chromium at 390 px wide, light and dark: no script errors, no sideways scroll, play/stop works.
- NOT tested: real acoustic piano recordings, real iPad Safari, listening to playback.

## Next steps (suggested order)
1. Live Record button using `getUserMedia` with echoCancellation, noiseSuppression and autoGainControl turned off. Add a count-in click so the first note lands on a beat, and feed the samples to `analyseAudio`. Needs a tap (user gesture) and HTTPS on iPad Safari.
2. Make it installable: manifest, icons, service worker for offline use, local copies of fonts.
3. Deploy: push to GitHub, import the repo in Vercel (static site, no build).
4. Try it on real piano recordings and tune: YIN threshold (0.15), loudness gate (6% of loud level), repeat-note jump ratio (1.8).
5. Add MIDI export and normal file saving.
6. Later ideas: sixteenth-note grid, beamed notes, real clef symbols (clefs are currently letters G and F), non-diatonic chords (secondary dominants), tap tempo, metronome during playback.

## Known limits
- Eighth-note grid only (no triplets or sixteenths). Lengths of 5 or 7 steps are split with ties.
- Diatonic chords only. Minor keys use natural minor plus a major V.
- Detection can slip an octave or merge fast notes; the note editor is the safety net.
