CameraController = require './entities/camera-controller'

resources = require './resources'
level = require './level'

states = []

startLevel = (n) ->
  fetch "level#{n}"
    .then (res) -> res.text()
    .then level
    .then (lv) -> states.push init lv, n

resources.loaded ->
  startLevel 1

renderer = new THREE.WebGLRenderer antialias: true
renderer.autoClear = false

init = (level ,num) ->

  camera = new THREE.PerspectiveCamera 45, window.innerWidth / window.innerHeight, 0.01, 2048
  camera.position.z = 16
  camera.position.x = -1000
  camera.position.y = -1000
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
  state =
    done: false
    level: level
    levelNumber: num
    player: level.player
    camera: camera
    resources: resources
    sfx: resources.sfx.sfx
    cameraController: cameraController
    renderer: renderer
    element: renderer.domElement
    next: ->
      startLevel num + 1
      window.removeEventListener 'resize', onResize

  for entity in level.entities
    entity.init? state

  window.$state = state
  state

animate = ->
  if states[0]?.done
    state = states.shift()
    for entity in state.level.entities
      entity.deinit? state
  requestAnimationFrame animate

  renderer.clear()

  for state in states
    for scene, i in state.level.scenes
      renderer.clearDepth() if i
      renderer.render scene, state.camera

    for ent in state.level.entities
      ent.update? state

requestAnimationFrame animate
