CameraController = require './entities/camera-controller.coffee'

resources = require './resources.coffee'
level = require './level.coffee'

resources.loaded ->
  level1 = level"
    ########\n
    #...#O!#\n
    #.@..###\n
    #......#\n
    #....H.#\n
    #......#\n
    ########\n
  "
  level2 = level"
    ##########\n
    #........#\n
    #.###..#.#\n
    #@#..###.#\n
    ##.#O###.#\n
    #!#H.....#\n
    ##########\n
  "
  requestAnimationFrame -> animate init level1

init = (level) ->
  width = window.innerWidth
  height = window.innerHeight
  size = Math.max 6, Math.max(level.width, level.height) / 2
  if width > height
    ratio = width / height
    height = size
    width = size * ratio
  else
    ratio = height / width
    width = size
    height = size * ratio

  # camera = new THREE.OrthographicCamera -width, width, height, -height, 0.01, 2048
  camera = new THREE.PerspectiveCamera 45, width / height, 0.01, 2048
  camera.position.z = 16
  camera.position.x = level.width / 2
  camera.position.y = -level.height / 2
  cameraController = new CameraController camera, level.player
  level.entities.push cameraController

  renderer = new THREE.WebGLRenderer antialias: true
  renderer.setSize window.innerWidth, window.innerHeight
  renderer.autoClear = false
  document.body.appendChild renderer.domElement

  window.block = resources.geometry.block
  window.state =
    level: level
    player: level.player
    renderer: renderer
    camera: camera
    resources: resources
    sfx: resources.sfx.sfx
    cameraController: cameraController

animate = (state) ->
  requestAnimationFrame -> animate state

  state.renderer.clear()
  for scene, i in state.level.scenes
    state.renderer.clearDepth() if i
    state.renderer.render scene, state.camera

  for ent in state.level.entities
    ent.update? state

