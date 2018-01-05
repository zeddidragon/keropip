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
  class TouchInput
    constructor: ->
      @touch = false
      @x = 0
      @y = 0
      @held = false

    init: (state, parent) ->
      {level, element} = state
      @onTouch = (event) =>
        return if event.button or @held
        @held = true

        parent.nextMove = @adjustCourse event
        parent.keyboardInput = false

      @adjustCourse = (event) =>
        return unless @held
        x = event.clientX
        y = event.clientY
        tmp
          .set x - window.innerWidth * 0.5, y - window.innerHeight * 0.5, 0
          .normalize()
        {mode} = level
        moves = validMoves[mode]
        transform = transforms[mode]
        parent.heldMove =
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

      @onRelease = (event) =>
        # Workaround for mousedown firing if you tap
        @held = false
        parent.heldMove = null

      element.addEventListener 'pointerdown', @onTouch
      element.addEventListener 'pointermove', @adjustCourse
      element.addEventListener 'pointerup', @onRelease

    deinit: ({element}) ->
      element.removeEventListener 'pointerdown', @onTouch
      element.removeEventListener 'pointermove', @adjustCourse
      element.removeEventListener 'pointerup', @onRelease

