module.exports =
  class KeyboardInput
    constructor: ->
      @held = []

    init: (state) ->
      player = state.level.player
      @onKeyDown = (event) =>
        key = event.key.toLowerCase()
        return unless 'qweasdzxcy'.includes(key)
        key = if key is 'y' then 'z' else key
        unless @held.includes key
          @held.push key
          player.nextMove = key
        player.heldMove = key
        player.keyboardInput = true
        return
      @onKeyUp = (event) =>
        key = event.key.toLowerCase()
        index = @held.indexOf key
        @held.splice index, 1 if ~index
        player.heldMove = @held[@held.length - 1]
        return
      document.addEventListener 'keydown', @onKeyDown
      document.addEventListener 'keyup', @onKeyUp

    deinit: ->
      document.removeEventListener 'keydown', @onKeyDown
      document.removeEventListener 'keyup', @onKeyUp

