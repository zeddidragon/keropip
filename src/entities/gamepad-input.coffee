{actions} = require '../utils/actions'
validMoves = require '../utils/valid-moves'
transforms = require '../utils/transforms'

tmp = new THREE.Vector3
tmpA = new THREE.Vector3
tmpB = new THREE.Vector3

diff = (a, b) ->
  a
    .sub b
    .lengthSq()

bindings =
  undo: 1
  invalidate: 2
  zoom: 4
  peek: 5

module.exports =
  class GamepadInput
    constructor: ->
      @pressed = []
      for i in [0..3]
        @pressed[i] = {}
        for action in actions
          @pressed[i][action] = false
      return

    update: (state, parent) ->
      {mode} = state.level
      pads = navigator.getGamepads?()
      moves = validMoves[mode]
      transform = transforms[mode]
      for pad, i in pads
        continue unless pad
        pressed = @pressed[i]
        if pad.buttons[9].pressed
          return state.restart()
        for action in actions
          buttonState = pad.buttons[bindings[action]].pressed
          if buttonState and not pressed[action]
            pressed[action] = true
            parent[action] = true
            return
          else if not buttonState and pressed[action]
            pressed[action] = false
            parent[action] = false
            return
        continue unless state.phase is 'idle'
        if pad.buttons[0].pressed and parent.consideredMove
          parent.nextMove = parent.consideredMove
          parent.consideredMove = null
          return
        tmp.set pad.axes[0], pad.axes[1], 0
        continue unless tmp.manhattanLength() >= 0.8
        tmp.normalize()
        parent.keyboardInput = false
        parent.consideredMove =
          Object.keys moves
            .sort (a, b) ->
              a = tmpA.copy moves[a]
              b = tmpB.copy moves[b]
              if transform
                transform state, a
                transform state, b
                a.normalize()
                b.normalize()
              diff(a, tmp) - diff(b, tmp)
            .shift()
