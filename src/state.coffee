resources = require './resources'
level = require './level'
Input = require './input'
CameraController = require './entities/camera-controller'

class Particle
  constructor: (@pos, @vel) ->

class State
  constructor: (@renderer, @level, @levelNumber, @callback) ->
    @camera = new THREE.PerspectiveCamera 45, 1, 0.01, 2048
    @camera.position.set -1000, -1000, 16
    @camera.up
      .set 0, 1, 1
      .normalize()
    @cameraController = new CameraController @camera
    @_onResize = @onResize.bind this
    @despawning = false
    @phase = 'idle'
    @nextPhase = null
    @nextMode = null
    @timer = 0
    @done = false
    @player = @level.player
    @element = @renderer.domElement
    @particles = []
    @turns = []
    @input = new Input
    @sfx = resources.sfx.sfx

  init: ->
    window.addEventListener 'resize', @_onResize
    @onResize()
    for entity in @level.entities
      entity.init? this
    @input.init this
    @level.init this
    this

  onResize: ->
    width = window.innerWidth
    height = window.innerHeight
    @renderer.setSize width, height
    @camera.aspect = width / height
    @camera.fov =
      if width > height
        @camera.fov = 45 / @camera.aspect + 2 * Math.log height
      else
        @camera.fov = 30 + 3 * Math.log height
    @camera.fov = Math.max 20, Math.min 120, @camera.fov
    @camera.updateProjectionMatrix()

  despawn: (offset) ->
    return if @despawning
    @nextPhase = 'goal'
    @despawning = true
    @sfx.play 'explosion'
    @input.deinit this
    setTimeout (=> @callback @levelNumber + (offset or 0)), 1000
    setTimeout (=> @done = true), 5000
    window.removeEventListener 'resize', @_onResize
    {width, height} = @level

    for scene in @level.scenes
      for e in scene.children
        biasX = e.position.x / width - 0.5
        biasY = e.position.y / height - 0.5
        vec = new THREE.Vector3 Math.random() + biasX, Math.random() + biasY, -Math.random()
        @particles.push new Particle e.position, vec

    for entity in @level.entities
      entity.deinit? this

  next: ->
    num = @levelNumber
    maxLevel = +localStorage.level or 0
    localStorage.level = Math.max maxLevel, +num + 1
    window.history.pushState {}, null, "?level=#{+num + 1}"
    @despawn 1

  restart: ->
    @despawn 0

  undo: ->
    @nextPhase = 'undo' if @phase is 'idle'

  invalidate: ->
    @nextPhase = 'invalidate' if @phase is 'idle'

module.exports = State
