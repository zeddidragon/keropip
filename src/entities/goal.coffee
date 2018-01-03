resources = require '../resources'

module.exports =
  class Goal
    constructor: (@x, @y) ->
      @state = 'idle'
      @geometry = resources.geometry.goal
      @material = resources.material.goal
      @mesh = new THREE.Mesh @geometry, @material

    update: (state) ->
      this[@state]? state

    idle: (state) ->
      return unless state.player.x is @x and state.player.y is @y
      @state = 'reached'
      setTimeout state.next, 200

