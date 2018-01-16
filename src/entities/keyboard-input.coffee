{special, actions} = require '../utils/actions'

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
    for action in actions
      this["#{action}Pressed"] = false
      this["#{action}Released"] = false
    @held = []

  init: (state, parent) ->
    @parent = parent
    @onKeyDown = (event) =>
      key = event.key.toLowerCase()
      action = special[key]
      if action
        this["#{action}Pressed"] = true
        return
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
      action = special[key]
      if action
        this["#{action}Released"] = true
        return
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

  update: (value) ->
    for action in actions
      key = "#{action}Pressed"
      if this[key]
        @parent[action] = true
        this[key] = false
      key = "#{action}Released"
      if this[key]
        @parent[action] = false
        this[key] = false
    return

KeyboardInput.setControls localStorage['settings.controls'] or 'qwerty'

module.exports = KeyboardInput
