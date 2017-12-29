resources = require '../resources'
validMoves = require '../utils/valid-moves'

tmp = new THREE.Vector3
tmpA = new THREE.Vector3
tmpB = new THREE.Vector3

diff = (a, b) ->
  a
    .sub b
    .lengthSq()

module.exports =
  class TouchInput
    constructor: ->
      @touch = false
      @x = 0
      @y = 0

    init: ({element}) ->
      @onTouch = (event) =>
        return if event.button
        event.preventDefault()
        touch = event.changedTouches?[0] or event
        @touch = true
        @x = event.x
        @y = event.y
      element.addEventListener 'click', @onTouch

    deinit: ({element}) ->
      element.removeEventListener 'click', @onTouch

    update: (state) ->
      return unless @touch
      @touch = false
      tmp
        .set @x - window.innerWidth * 0.5, @y - window.innerHeight * 0.5, 0
        .normalize()
      {mode} = state.level
      moves = validMoves[mode]
      state.player.nextMove =
        Object.keys moves
          .sort (a, b) ->
            a = tmpA.copy moves[a]
            b = tmpB.copy moves[b]
            if mode is 'hex'
              a.x += a.y * 0.5
              b.x += b.y * 0.5
              a.normalize()
              b.normalize()
            diff(a, tmp) - diff(b, tmp)
          .shift()

