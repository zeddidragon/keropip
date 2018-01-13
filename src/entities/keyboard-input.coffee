module.exports =
  class KeyboardInput
    constructor: ->
      @held = []

    init: (state, parent) ->
      @onKeyDown = (event) =>
        key = event.key.toLowerCase()
        return unless 'qweasdzxcy'.includes(key)
        key = 'z' if key is 'y'
        unless @held.includes key
          @held.push key
          parent.nextMove = key
        parent.heldMove = key
        parent.keyboardInput = true
        return
      @onKeyUp = (event) =>
        key = event.key.toLowerCase()
        key = 'z' if key is 'y'
        index = @held.indexOf key
        @held.splice index, 1 if ~index
        parent.heldMove = @held[@held.length - 1]
        return
      document.addEventListener 'keydown', @onKeyDown
      document.addEventListener 'keyup', @onKeyUp

    deinit: ->
      document.removeEventListener 'keydown', @onKeyDown
      document.removeEventListener 'keyup', @onKeyUp

