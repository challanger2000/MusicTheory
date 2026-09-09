var NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]

var SCALE_TEMPLATES = [
  { name: "Major / Ionian", pattern: [0,2,4,5,7,9,11] },
  { name: "Dorian", pattern: [0,2,3,5,7,9,10] },
  { name: "Phrygian", pattern: [0,1,3,5,7,8,10] },
  { name: "Lydian", pattern: [0,2,4,6,7,9,11] },
  { name: "Mixolydian", pattern: [0,2,4,5,7,9,10] },
  { name: "Natural Minor / Aeolian", pattern: [0,2,3,5,7,8,10] },
  { name: "Locrian", pattern: [0,1,3,5,6,8,10] },
  { name: "Harmonic Minor", pattern: [0,2,3,5,7,8,11] },
  { name: "Minor Pentatonic", pattern: [0,3,5,7,10] },
  { name: "Major Pentatonic", pattern: [0,2,4,7,9] }
]

var CHORD_TEMPLATES = [
  { name: "maj7", pattern: [0,4,7,11] },
  { name: "7", pattern: [0,4,7,10] },
  { name: "m7", pattern: [0,3,7,10] },
  { name: "dim7", pattern: [0,3,6,9] },
  { name: "m7b5", pattern: [0,3,6,10] },
  { name: "maj", pattern: [0,4,7] },
  { name: "min", pattern: [0,3,7] },
  { name: "dim", pattern: [0,3,6] },
  { name: "aug", pattern: [0,4,8] },
  { name: "sus2", pattern: [0,2,7] },
  { name: "sus4", pattern: [0,5,7] }
]

function uniquePitchClasses(pitches) {
  var seen = {}, out = []
  for (var i = 0; i < pitches.length; i++) {
    var pc = ((Number(pitches[i]) % 12) + 12) % 12
    if (!seen[pc]) { seen[pc] = true; out.push(pc) }
  }
  out.sort(function(a,b){ return a-b })
  return out
}

function pcNames(pcs) {
  var out = []
  for (var i = 0; i < pcs.length; i++) out.push(NOTE_NAMES[pcs[i]])
  return out.join("  ")
}

function patternForRoot(pattern, root) {
  var out = []
  for (var i = 0; i < pattern.length; i++) out.push((pattern[i] + root) % 12)
  out.sort(function(a,b){ return a-b })
  return out
}

function sameSet(a, b) {
  if (a.length !== b.length) return false
  for (var i = 0; i < a.length; i++) if (a[i] !== b[i]) return false
  return true
}

function isSubset(sub, sup) {
  for (var i = 0; i < sub.length; i++) if (sup.indexOf(sub[i]) < 0) return false
  return true
}

function detectChord(pcs, bassPc) {
  var matches = []
  for (var root = 0; root < 12; root++) {
    for (var i = 0; i < CHORD_TEMPLATES.length; i++) {
      var target = patternForRoot(CHORD_TEMPLATES[i].pattern, root)
      if (sameSet(pcs, target)) {
        var suffix = CHORD_TEMPLATES[i].name
        var label = NOTE_NAMES[root] + (suffix === "maj" ? "" : suffix === "min" ? "m" : suffix)
        if (bassPc !== root) label += "/" + NOTE_NAMES[bassPc]
        matches.push(label)
      }
    }
  }
  return matches
}

function detectScales(pcs) {
  var exact = [], compatible = []
  for (var root = 0; root < 12; root++) {
    for (var i = 0; i < SCALE_TEMPLATES.length; i++) {
      var target = patternForRoot(SCALE_TEMPLATES[i].pattern, root)
      var label = NOTE_NAMES[root] + " " + SCALE_TEMPLATES[i].name
      if (sameSet(pcs, target)) exact.push(label)
      else if (isSubset(pcs, target)) compatible.push(label)
    }
  }
  return { exact: exact, compatible: compatible }
}

function limitList(values, max) {
  if (!values.length) return "—"
  var shown = values.slice(0, max)
  var text = shown.join(" · ")
  if (values.length > max) text += " · +" + (values.length - max) + " more"
  return text
}

function MusicTheoryAnalyzer() {
  this.interfaces = [Host.Interfaces.IEditTask, Host.Interfaces.IController, Host.Interfaces.IObserver, Host.Interfaces.IParamObserver]
  this.paramList = Host.Classes.createInstance("CCL:ParamList")
  this.paramList.controller = this
  this.events = []
  this.editor = null
  this.selector = null

  this.prepareEdit = function(context) {
    context.restore()
    this.editor = context.editor
    this.selector = this.editor ? this.editor.createSelectFunctions(context.functions) : null
    if (this.selector) this.selector.executeImmediately = true
    this.events = []

    this.Headline = this.paramList.addString("Headline")
    this.Selection = this.paramList.addString("Selection")
    this.Chord = this.paramList.addString("Chord")
    this.ScaleExact = this.paramList.addString("ScaleExact")
    this.ScaleCompatible = this.paramList.addString("ScaleCompatible")
    this.Why = this.paramList.addString("Why")

    if (this.editor && this.editor.selection) {
      var it = this.editor.selection.newIterator()
      if (it && it.first) it.first()
      while (it && !it.done()) {
        var n = it.next()
        if (n) this.events.push(n)
      }
    }

    var pitches = []
    for (var i = 0; i < this.events.length; i++) pitches.push(Number(this.events[i].pitch))

    if (!pitches.length) {
      this.Headline.value = "SELECTION ANALYSIS"
      this.Selection.value = "No MIDI notes selected"
      this.Chord.value = "—"
      this.ScaleExact.value = "—"
      this.ScaleCompatible.value = "—"
      this.Why.value = "Select notes in the Music Editor and run the command again."
      return context.runDialog("MusicTheoryDialog", "challanger2000.music.theory")
    }

    var pcs = uniquePitchClasses(pitches)
    var bass = pitches[0]
    for (var p = 1; p < pitches.length; p++) if (pitches[p] < bass) bass = pitches[p]
    var bassPc = ((bass % 12) + 12) % 12
    var chords = detectChord(pcs, bassPc)
    var scales = detectScales(pcs)

    this.Headline.value = "SELECTION ANALYSIS"
    this.Selection.value = pitches.length + " notes · " + pcs.length + " pitch classes · " + pcNames(pcs)
    this.Chord.value = limitList(chords, 4)
    this.ScaleExact.value = limitList(scales.exact, 4)
    this.ScaleCompatible.value = limitList(scales.compatible, 6)

    if (chords.length === 1) {
      this.Why.value = "The selected pitch classes exactly match the interval structure of " + chords[0] + "."
    } else if (chords.length > 1) {
      this.Why.value = "The same notes allow more than one harmonic interpretation; context is needed for a definitive answer."
    } else if (scales.exact.length === 1) {
      this.Why.value = "The selected pitch classes form the complete note set of " + scales.exact[0] + "."
    } else if (scales.compatible.length) {
      this.Why.value = "The notes fit several scales. More notes or harmonic context are needed to identify the tonal center reliably."
    } else {
      this.Why.value = "No simple triad, seventh chord or included scale template matches exactly."
    }

    return context.runDialog("MusicTheoryDialog", "challanger2000.music.theory")
  }

  this.performEdit = function(context) { return Host.Results.kResultOk }
  this.paramChanged = function(param) {}
  this.notify = function(subject) {}
}

function createInstance() { return new MusicTheoryAnalyzer() }
