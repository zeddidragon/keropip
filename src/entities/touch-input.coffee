validMoves = require '../utils/valid-moves'
transforms = require '../utils/transforms'
{actions} = require '../utils/actions'

tmp = new THREE.Vector3
tmpA = new THREE.Vector3
tmpB = new THREE.Vector3

diff = (a, b) ->
  a
    .sub b
    .lengthSq()

document
  .getElementById 'menu'
  .addEventListener 'click', (e) ->
    e.stopPropagation()


module.exports =
  class TouchInput
    constructor: ->
      @x = 0
      @y = 0
      @held = false
      for action in actions
        this[action] = false
        this["#{action}Pressed"] = false
        this["#{action}Released"] = false
      @listeners = []
      @undoButton = null

    addAction: (id, action) ->
      element = document.getElementById id
      return unless element
      action or= id
      press = (e) =>
        this[action] = true
        this["#{action}Pressed"] = true
      release = (e) =>
        return unless this[action]
        this[action] = false
        this["#{action}Released"] = true
      @listeners.push
        element: element
        events: ['pointerdown']
        func: press
      @listeners.push
        element: element
        events: ['pointerup', 'pointerleave', 'pointercancel']
        func: release
      element.addEventListener 'pointerdown', press
      element.addEventListener 'pointerup', release
      element.addEventListener 'pointerleave', release
      element.addEventListener 'pointercancel', release

    init: (state, parent) ->
      {level, element} = state
      @parent = parent
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

      for action in actions
        @addAction action
      return

    deinit: ({element}) ->
      for listener in @listeners
        for event in listener.events
          listener.element.removeEventListener event, listener.func
      return

    update: (state) ->
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
