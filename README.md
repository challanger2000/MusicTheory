# MusicTheory

Interactive music theory assistant for Fender Studio Pro with MIDI selection analysis and contextual explanations.

## Project goals

MusicTheory is intended to become a native-feeling Studio Pro extension focused on understanding musical material rather than generating or transforming it.

Core principles:

- one simple installation for the user
- clean, compact and native-feeling Studio Pro integration
- interactive music theory reference
- contextual analysis of selected MIDI notes
- deterministic, explainable results
- explicit handling of ambiguity instead of forced guesses
- no unnecessary duplication of Studio Pro features
- no unnecessary overlap with chord-generation and MIDI-transformation tools

## Planned 1.0 scope

- roots and intervals
- major and minor scales
- church modes
- harmonic and melodic minor
- pentatonic scales
- triads and seventh chords
- common sus, add, diminished and augmented chords
- chord and inversion recognition
- scale matching
- scale-degree / Roman-numeral analysis
- contextual explanations ("Why?")
- MIDI selection analysis inside Studio Pro

## Development strategy

The first milestone is a technical proof of the Studio Pro integration architecture before the full theory engine and UI are built.

Initial work will validate:

1. a persistent native Studio Pro music-editor panel
2. access to selected MIDI notes through a Studio Pro edit task
3. reliable communication between the selection-analysis command and the persistent panel
4. a clean separation between Studio Pro integration and the standalone theory engine

Version 1 is intentionally read-only: it analyzes and explains musical material without automatically changing MIDI notes.

## Status

Early development / architecture validation.
