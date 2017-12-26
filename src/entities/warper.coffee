makeZ = require '../utils/make-z.coffee'

module.exports =
  class Warper
    constructor: ->
      @mode = 'orto'
      @progress = 1

    update: (state) ->
      if state.level.mode isnt @mode
        @progress = 0
        @mode = state.level.mode
        for scene in state.level.scenes
          for e in scene.children
            e.position.z = makeZ[@mode] e.position
      return

