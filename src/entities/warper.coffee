makeZ = require '../utils/make-z'

module.exports =
  class Warper
    constructor: ->
      @mode = 'orto'
      @progress = 1

    update: (state) ->
      if state.level.mode isnt @mode or state.phase is 'start' and @mode is 'jump'
        @progress = 0
        @mode = state.level.mode
      else if @progress < 1
        @progress += 0.1
        transform = if @progress >= 1 then makeZ.snap else makeZ.lerp
        for scene in state.level.scenes
          for e in scene.children
            transform state, e.position
      return

