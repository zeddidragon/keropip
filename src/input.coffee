KeyboardInput = require './entities/keyboard-input'
GamepadInput = require './entities/gamepad-input'
TouchInput = require './entities/touch-input'

module.exports =
  class Input
    constructor: ->
      @inputs = [
        new TouchInput
        new GamepadInput
        new KeyboardInput
      ]
      @nextMove = null
      @heldMove = null
      @consideredMove = null
      @keyboardInput = true
      @peek = false
      @zoom = false
      @undo = false
      @invalidate = false

    update: (state) ->
      for input in @inputs
        input.update? state, this
      return

    init: (state) ->
      for input in @inputs
        input.init? state, this
      return

    deinit: (state) ->
      for input in @inputs
        input.deinit? state
      return
