var MUSIC_THEORY_SERVICE_ID = "{A3B0E91E-2D6C-4B94-9F0E-2B5F1C7A6D11}"

function pitchName(pc) {
  var names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
  return names[((pc % 12) + 12) % 12]
}

function MusicTheoryService() {
  this.interfaces = [Host.Interfaces.IComponent]
  this.panel = null
  this.lastResult = {
    count: 0,
    pitchClasses: [],
    text: "Select MIDI notes and run Analyze Selection"
  }

  this.initialize = function(context) {
    return Host.Results.kResultOk
  }

  this.terminate = function() {
    this.panel = null
    return Host.Results.kResultOk
  }

  this.registerPanel = function(panel) {
    this.panel = panel
    if (this.panel && this.panel.showAnalysis) this.panel.showAnalysis(this.lastResult)
  }

  this.unregisterPanel = function(panel) {
    if (this.panel === panel) this.panel = null
  }

  this.publishPitches = function(pitches) {
    var seen = {}
    var pcs = []
    for (var i = 0; i < pitches.length; i++) {
      var pc = ((Number(pitches[i]) % 12) + 12) % 12
      if (!seen[pc]) {
        seen[pc] = true
        pcs.push(pc)
      }
    }
    pcs.sort(function(a, b) { return a - b })

    var names = []
    for (var n = 0; n < pcs.length; n++) names.push(pitchName(pcs[n]))

    this.lastResult = {
      count: pitches.length,
      pitchClasses: pcs,
      text: pitches.length
        ? pitches.length + " note(s) selected | Pitch classes: " + names.join("  ")
        : "No MIDI notes selected"
    }

    if (this.panel && this.panel.showAnalysis) this.panel.showAnalysis(this.lastResult)
  }
}

function MusicTheoryPanel() {
  this.interfaces = [Host.Interfaces.IComponent, Host.Interfaces.IController, Host.Interfaces.IParamObserver]
  this.paramList = Host.Classes.createInstance("CCL:ParamList")
  this.paramList.controller = this
  this.Title = this.paramList.addString("Title")
  this.Status = this.paramList.addString("Status")
  this.Selection = this.paramList.addString("Selection")
  this.service = null

  this.Title.value = "MUSIC THEORY"
  this.Status.value = "Native panel architecture spike"
  this.Selection.value = "Select MIDI notes and run Analyze Selection"

  this.initialize = function(context) {
    this.service = Host.Services.getInstance(MUSIC_THEORY_SERVICE_ID)
    if (this.service && this.service.registerPanel) this.service.registerPanel(this)
    return Host.Results.kResultOk
  }

  this.terminate = function() {
    if (this.service && this.service.unregisterPanel) this.service.unregisterPanel(this)
    this.service = null
    return Host.Results.kResultOk
  }

  this.findParameter = function(name) {
    if (name === "Title") return this.Title
    if (name === "Status") return this.Status
    if (name === "Selection") return this.Selection
    return null
  }

  this.paramChanged = function(param) {}

  this.showAnalysis = function(result) {
    if (!result) return
    this.Status.value = result.count ? "Selection received from Music Editor" : "Ready"
    this.Selection.value = result.text || ""
  }
}

function AnalyzeSelectionTask() {
  this.interfaces = [Host.Interfaces.IEditTask]

  this.prepareEdit = function(context) {
    return Host.Results.kResultOk
  }

  this.performEdit = function(context) {
    var pitches = []
    try {
      var editor = context.editor
      if (editor && editor.selection) {
        var it = editor.selection.newIterator()
        if (it && it.first) it.first()
        while (it && !it.done()) {
          var event = it.next()
          if (event && event.pitch !== undefined && event.pitch !== null) {
            pitches.push(Number(event.pitch))
          }
        }
      }

      var service = Host.Services.getInstance(MUSIC_THEORY_SERVICE_ID)
      if (service && service.publishPitches) service.publishPitches(pitches)
      return Host.Results.kResultOk
    } catch (e) {
      Host.Console.writeLine("Music Theory Analyze Selection failed: " + e)
      return Host.Results.kResultFailed
    }
  }
}

function createServiceInstance() { return new MusicTheoryService() }
function createPanelInstance() { return new MusicTheoryPanel() }
function createAnalyzeSelectionInstance() { return new AnalyzeSelectionTask() }
