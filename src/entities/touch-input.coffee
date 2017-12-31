resources = require '../resources'
validMoves = require '../utils/valid-moves'

tmp = new THREE.Vector3
tmpA = new THREE.Vector3
tmpB = new THREE.Vector3

diff = (a, b) ->
  a
    .sub b
    .lengthSq()

transforms =
  hex: (vec) ->
    vec.x += vec.y * 0.5
    vec
  diag: (vec) ->
    if vec.x is vec.y
      vec.x = 0
    else
      vec.y = 0
    vec

module.exports =
  class TouchInput
    constructor: ->
      @touch = false
      @x = 0
      @y = 0
      @held = false

    init: ({level, element, player}) ->
      @onTouch = (event) =>
        return if event.button
        @held = true

        player.nextMove = @adjustCourse event

      @adjustCourse = (event) =>
        return unless @held
        touch = event.changedTouches?[0] or event
        x = touch.clientX
        y = touch.clientY
        tmp
          .set x - window.innerWidth * 0.5, y - window.innerHeight * 0.5, 0
          .normalize()
        {mode} = level
        moves = validMoves[mode]
        transform = transforms[mode]
        player.heldMove =
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

      @onRelease = (event) =>
        @held = false
        player.heldMove = null

      element.addEventListener 'mousedown', @onTouch
      element.addEventListener 'mousemove', @adjustCourse
      element.addEventListener 'touchstart', @onTouch, passive: true
      element.addEventListener 'touchmove', @adjustCourse, passive: true

      element.addEventListener 'mouseup', @onRelease
      element.addEventListener 'touchend', @onRelease

    deinit: ({element}) ->
      element.removeEventListener 'mousedown', @onTouch
      element.removeEventListener 'mousemove', @onTouch
      element.removeEventListener 'touchstart', @onTouch
      element.removeEventListener 'touchmove', @onTouch

      element.removeEventListener 'mouseup', @onRelease
      element.removeEventListener 'touchend', @onRelease

