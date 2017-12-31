CameraController = require './entities/camera-controller'
resources = require './resources'
level = require './level'

DEBUG = true

currentState = ->
  states.find (state) -> !state.despawning

window.addEventListener 'keydown', (e) ->
  switch e.key.toLowerCase()
    when 'r'
      currentState().restart() if DEBUG
    when 'n'
      currentState().next()

states = []

startLevel = (n) ->
  fetch "levels/#{n}"
    .then (res) -> res.text()
    .then level
    .then (lv) -> states.push init lv, n

resources.loaded ->
  startLevel 1

renderer = new THREE.WebGLRenderer antialias: true
renderer.autoClear = false

class Particle
  constructor: (@pos, @vel) ->

init = (level, num) ->

  camera = new THREE.PerspectiveCamera 45, window.innerWidth / window.innerHeight, 0.01, 2048
  camera.position.set -1000, -1000, 16
  camera.up
    .set 0, 1, 1
    .normalize()
  cameraController = new CameraController camera, level.player
  level.entities.push cameraController

  onResize = ->
    width = window.innerWidth
    height = window.innerHeight

    renderer.setSize width, height

    size = Math.max 6, Math.max(level.width, level.height) / 2
    if width > height
      ratio = width / height
      height = size
      width = size * ratio
    else
      ratio = height / width
      width = size
      height = size * ratio

    camera.aspect = width / height
    camera.updateProjectionMatrix()

  window.addEventListener 'resize', onResize

  onResize()

  unless renderer.domElement.parentElement
    document.body.appendChild renderer.domElement

  window.block = resources.geometry.block

  particles = []

  despawn = (offset) ->
    return if state.despawning
    state.despawning = true
    resources.sfx.sfx.play 'explosion'
    level.player.state = 'goal'
    setTimeout (-> startLevel num + (offset or 0)), 1000
    setTimeout (-> state.done = true), 5000
    window.removeEventListener 'resize', onResize
    oldCamera = state.camera
    {width, height} = state.level

    for scene in state.level.scenes
      for e in scene.children
        biasX = e.position.x / width - 0.5
        biasY = e.position.y / height - 0.5
        vec = new THREE.Vector3 Math.random() + biasX, Math.random() + biasY, -Math.random()
        particles.push new Particle e.position, vec

    for entity in state.level.entities
      entity.deinit? state

  state =
    done: false
    despawning: false
    level: level
    levelNumber: num
    player: level.player
    camera: camera
    resources: resources
    sfx: resources.sfx.sfx
    cameraController: cameraController
    renderer: renderer
    element: renderer.domElement
    particles: particles
    next: -> despawn 1
    restart: -> despawn 0

  for entity in level.entities
    entity.init? state

  window.$state = state
  state

animate = ->
  if states[0]?.done
    state = states.shift()
  requestAnimationFrame animate

  renderer.clear()

  for state in states
    for scene, i in state.level.scenes
      renderer.clearDepth() if i
      renderer.render scene, state.camera

    for ent in state.level.entities
      ent.update? state

    for p in state.particles
      p.vel.z -= 0.08
      p.vel.multiplyScalar 0.94
      p.pos.add p.vel

requestAnimationFrame animate
