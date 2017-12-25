tmpVe = new THREE.Vector3
tmpMat = new THREE.Matrix4

validMoves =
  orto:
    w: new THREE.Vector3 0, -1, 0
    d: new THREE.Vector3 1, 0, 0
    s: new THREE.Vector3 0, 1, 0
    a: new THREE.Vector3 -1, 0, 0
  hex:
    w: new THREE.Vector3 0, -1, 0
    e: new THREE.Vector3 1, -1, 0
    d: new THREE.Vector3 1, 0, 0
    x: new THREE.Vector3 0, 1, 0
    z: new THREE.Vector3 -1, 1, 0
    a: new THREE.Vector3 -1, 0, 0

charModes =
  'H': 'hex'
  'O': 'orto'

bgmNode = document.getElementById 'bgm'
bgmNode.volume = 0.5

loadCounter = 0
resources =
  sfx:
    bgm: bgmNode
  geometry:
    block: do ->
      block = new THREE.BoxGeometry 1, 1, 1

      block.faceVertexUvs[0][0][0].x = 1
      block.faceVertexUvs[0][0][1].x = 1
      block.faceVertexUvs[0][0][2].x = 0
      block.faceVertexUvs[0][1][0].x = 1
      block.faceVertexUvs[0][1][1].x = 0
      block.faceVertexUvs[0][1][2].x = 0

      block.faceVertexUvs[0][6][0].y = 0
      block.faceVertexUvs[0][6][1].y = 1
      block.faceVertexUvs[0][6][2].y = 0
      block.faceVertexUvs[0][7][0].y = 1
      block.faceVertexUvs[0][7][1].y = 1
      block.faceVertexUvs[0][7][2].y = 0

      block.uvsNeedUpdate = true
      block
    hex_pad: new THREE.CircleGeometry 0.5, 6
    orto_pad: new THREE.PlaneGeometry 0.8, 0.8, 1, 1
    goal: do ->
      dot = new THREE.SphereGeometry 0.12, 6, 6
      tmpMat.makeTranslation 0, -0.4, 0
      dot.applyMatrix tmpMat
      line = new THREE.CylinderGeometry 0.18, 0.10, 0.6, 6
      tmpMat.makeTranslation 0, 0.1, 0
      line.applyMatrix tmpMat
      dot.merge line
      dot
  material:
    bird_arms: new THREE.MeshBasicMaterial color: 0xffff00
    bird_beak: new THREE.MeshBasicMaterial color: 0xffaa00
    frog_rim: new THREE.MeshBasicMaterial color: 0x84c914
    hex_pad: new THREE.MeshBasicMaterial
      color: 0x66ddff
      transparent: true
      opacity: 0.7
    orto_pad: new THREE.MeshBasicMaterial
      color: 0xff6666
      transparent: true
      opacity: 0.7
    goal: new THREE.MeshBasicMaterial
      color: 0xf0e68c
      transparent: true
      opacity: 0.7

loaders =
  geometry: new THREE.JSONLoader
  material: new THREE.TextureLoader
  sfx: load: (path, cb) ->
    fetch path
      .then (response) -> response.json()
      .then (settings) ->
        settings.preload = true
        player = new Howl settings
        player.once 'load', -> cb player

load = (type, path, transforms) ->
  ++loadCounter
  loaders[type].load "assets/" + path, (obj) ->
    name = path
      .split '/'
      .pop()
      .split '.'
      .shift()
    if type is 'material'
      obj = new THREE.MeshBasicMaterial map: obj
    for [transform, args] in (transforms or [])
      obj[transform] ...args
    resources[type][name] = obj
    loaded()

loaded = ->
  return if --loadCounter
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

load 'geometry', 'bird/bird.json', [
  ['translate', [0, -5, 0]],
  ['scale', [0.24, 0.24, 0.24]],
]
load 'material', 'bird/bird_face.png'
load 'material', 'bird/frog_eye.png'
load 'material', 'bird/frog_face.png'
load 'material', 'block.png'
load 'material', 'block2.png'
load 'sfx', 'sfx.json'

class Goal
  constructor: (@x, @y) ->
    @type = 'goal'
    @geometry = resources.geometry.goal
    @material = resources.material.goal
    @mesh = new THREE.Mesh @geometry, @material
    @reached = false

  update: (state) ->
    return if @reached
    return unless state.player.x is @x and state.player.y and @y
    @reached = true
    state.sfx.play 'explosion'

class ModePad
  constructor: (@x, @y, char) ->
    @type = 'mode-pad'
    @mode = charModes[char]
    @geometry = resources.geometry["#{@mode}_pad"]
    @material = resources.material["#{@mode}_pad"]
    @mesh = new THREE.Mesh @geometry, @material
    @rollVector = new THREE.Vector3 1, 0.5, 2
      .normalize()

  update: (state) ->
    @mesh.rotateOnWorldAxis @rollVector, 0.05
    return if state.level.mode is @mode
    return unless state.player.x is @x and state.player.y is @y
    state.cameraController.warp state, @mode

class Bird
  constructor: (@x, @y)->
    @type = 'player'
    @geometry = resources.geometry.bird
    @material = [
      resources.material.bird_arms,
      resources.material.bird_face,
      resources.material.frog_rim,
      resources.material.frog_face,
      resources.material.bird_beak,
      resources.material.frog_eye,
    ]
    @mesh = new THREE.Mesh @geometry, @material
    @state = 'idle'
    @nextMove = null
    @from = new THREE.Vector3
    @to = new THREE.Vector3
    @progress = 0
    @rollVector = new THREE.Vector3

  init: ->
    @onKeyDown = (event) =>
      key = event.key.toLowerCase()
      @nextMove = key if 'adswexz'.includes(key)
      return
    document.addEventListener 'keydown', @onKeyDown

  deinit: ->
    document.removeEventListener 'keydown', @onKeyDown

  update: (state) ->
    this[@state]? state

  idle: (state) ->
    if @nextMove
      move = validMoves[state.level.mode][@nextMove]
      @nextMove = null
      return unless move and @canMove state, move
      @from.set @x, -@y, 0
      @x += move.x
      @y += move.y
      @to.set @x, -@y, 0
      @progress = 0
      @rollVector
        .set move.y, move.x, 0
        .normalize()
      state.sfx.play "sweep#{4 * Math.random() | 1}"
      @state = 'moving'
    return

  canMove: (state, move) ->
    state.level.tiles[@y + move.y]?[@x + move.x] isnt "#"

  moving: ->
    @progress += 0.14
    if @progress < 2
      @mesh.rotateOnWorldAxis @rollVector, 0.24 * Math.cos @progress
      @mesh.position.lerpVectors @from, @to, 1.1 * Math.sin @progress
    else
      @mesh.position.copy @to
      @state = 'idle'
    @mesh.position.z = makeZ[state.level.mode] @mesh.position

class CameraController
  constructor: (@camera, @player) ->
    @state = 'tracking'
    @offset = new THREE.Vector3 0, 0, 512
    @from = new THREE.Vector3
    @to = new THREE.Vector3
    @progress = 0

  warp: (state, mode) ->
    @state = 'warping'
    @from.copy @offset
    @progress = 0
    state.level.mode = mode
    state.sfx.play 'warp'
    switch mode
      when 'orto' then @to.set 0, 0, 512
      when 'hex' then @to.set 512, -512, 512
    return

  tracking: ->
    @camera.position.addVectors @player.mesh.position, @offset
    @camera.lookAt @player.mesh.position

  warping: ->
    @progress += 0.06
    if @progress < 1
      @offset.lerpVectors @from, @to, @progress
    else
      @offset.copy @to
      @state = 'tracking'
    @tracking()

  update: (state) ->
    this[@state]? state

makeZ =
  orto: ({z})-> z
  hex: ({x, y}) -> y - x

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

entityMap =
  '@': Bird
  'H': ModePad
  'O': ModePad
  '!': Goal

createEntity = (char, x, y) ->
  klass = entityMap[char]
  return unless klass
  entity = new klass x, y, char
  entity.init?()
  entity

level = (parts) ->
  entities = [new Warper]

  player = null
  tiles = parts
    .join "\n"
    .trim()
    .split "\n"
    .map (str) -> str.trim().split ""
    .map (row, j) ->
      row.map (char, i) ->
        e = createEntity char, i, j
        if e
          entities.push e
          player = e if e.type is 'player'
          e.x = i
          e.y = j
        else
          char

  mode: 'orto'
  width: tiles[0].length
  height: tiles.length
  entities: entities
  tiles: tiles
  player: player
  scenes: createScene tiles, entities

createScene = (tiles, entities) ->
  geometry = resources.geometry.block
  ground = resources.material.block
  solid = resources.material.block2
  tileScene = new THREE.Scene
  entityScene = new THREE.Scene

  for row, j in tiles
    for tile, i in row
      block = new THREE.Mesh geometry, if tile is '#' then solid else ground
      block.position.x = i
      block.position.y = -j
      tileScene.add block

  for e in entities when e.mesh
    e.mesh.position.x = e.x
    e.mesh.position.y = -e.y
    e.mesh.name = e.type
    entityScene.add e.mesh

  [tileScene, entityScene]

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

  camera = new THREE.OrthographicCamera -width, width, height, -height, 0.01, 2048
  # camera = new THREE.PerspectiveCamera 45, width / height, 0.01, 2048
  camera.position.z = 512
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

