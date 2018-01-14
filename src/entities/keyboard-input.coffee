schemes =
  qwerty:
    valid: 'qweasdzxcy'
    remap:
      y: 'z'
  dvorak:
    valid: "',.aoe;qj"
    remap:
      "'": 'q'
      ",": 'w'
      ".": 'e'
      "o": 's'
      "e": 'd'
      ";": 'z'
      "q": 'x'
      "j": 'c'

{valid, remap} = schemes.qwerty

class KeyboardInput
  constructor: ->
    @held = []

  init: (state, parent) ->
    @onKeyDown = (event) =>
      key = event.key.toLowerCase()
      return unless valid.includes(key)
      key = remap[key] or key
      unless @held.includes key
        @held.push key
        parent.nextMove = key
      parent.heldMove = key
      parent.keyboardInput = true
      return
    @onKeyUp = (event) =>
      key = event.key.toLowerCase()
      key = remap[key] or key
      index = @held.indexOf key
      @held.splice index, 1 if ~index
      parent.heldMove = @held[@held.length - 1]
      return
    document.addEventListener 'keydown', @onKeyDown
    document.addEventListener 'keyup', @onKeyUp

  deinit: ->
    document.removeEventListener 'keydown', @onKeyDown
    document.removeEventListener 'keyup', @onKeyUp

  @setControls: (value) ->
    {valid, remap} = schemes[value]
    localStorage['settings.controls'] = value

KeyboardInput.setControls localStorage['settings.controls'] or 'qwerty'

module.exports = KeyboardInput
