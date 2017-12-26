resources = require '../resources.coffee'

class Particle
  constructor: (@pos, @vel) ->

module.exports =
  class Goal
    constructor: (@x, @y) ->
      @state = 'idle'
      @geometry = resources.geometry.goal
      @material = resources.material.goal
      @mesh = new THREE.Mesh @geometry, @material
      @particles = []

    update: (state) ->
      this[@state]? state

    idle: (state) ->
      return unless state.player.x is @x and state.player.y is @y
      state.player.state = 'goal'
      @state = 'reached'
      state.sfx.play 'explosion'
      {width, height} = state.level
      for scene in state.level.scenes
        for e in scene.children
          biasX = e.position.x / width - 0.5
          biasY = e.position.y / height - 0.5
          vec = new THREE.Vector3 Math.random() + biasX, Math.random() + biasY, -Math.random()
          @particles.push new Particle e.position, vec
      return

    reached: (state) ->
      for p in @particles
        p.vel.z -= 0.08
        p.vel.multiplyScalar 0.94
        p.pos.add p.vel
      return

