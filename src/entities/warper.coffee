makeZ = require '../utils/make-z'

tmp = new THREE.Vector3

module.exports =
  class Warper
    constructor: ->
      @mode = 'orto'
      @progress = 1

    update: (state) ->
      if state.level.mode isnt @mode or state.player.startMove and @mode is 'jump'
        @progress = 0
        @mode = state.level.mode
      else if @progress < 1
        @progress += 0.03
        transform = if @progress >= 1 then makeZ.snap else makeZ.lerp
        for scene in state.level.scenes
          for e in scene.children
            transform state, e.position
      return

