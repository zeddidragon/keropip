validMoves = require '../utils/valid-moves'
transforms = require '../utils/transforms'

tmp = new THREE.Vector3
tmpA = new THREE.Vector3
tmpB = new THREE.Vector3

diff = (a, b) ->
  a
    .sub b
    .lengthSq()

module.exports =
  class GamepadInput
    update: ({player, level: {mode}}) ->
      return unless player.state is 'idle'
      pads = navigator.getGamepads?()
      moves = validMoves[mode]
      transform = transforms[mode]
      for pad in pads
        continue unless pad
        tmp.set pad.axes[0], pad.axes[1], 0
        continue unless tmp.manhattanLength() >= 0.8
        tmp.normalize()
        player.nextMove =
          Object.keys moves
            .sort (a, b) ->
              a = tmpA.copy moves[a]
              b = tmpB.copy moves[b]
              if transform
                transform a
                a.normalize()
                transform b
                b.normalize()
              diff(a, tmp) - diff(b, tmp)
            .shift()