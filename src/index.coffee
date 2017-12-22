tmp = new THREE.Vector3

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

loadCounter = 0
resources =
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
  material:
    bird_arms: new THREE.MeshBasicMaterial color: 0xffff00
    bird_beak: new THREE.MeshBasicMaterial color: 0xffaa00
    frog_rim: new THREE.MeshBasicMaterial color: 0x84c914
    hex_pad: new THREE.MeshBasicMaterial
      color: 0x66ddff
      transparent: true
      opacity: 0.7

loaders =
  geometry: new THREE.JSONLoader
  material: new THREE.TextureLoader

load = (type, path, transforms) ->
  ++loadCounter
  loaders[type].load 'assets/models/' + path, (obj) ->
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

SCALE = 0.24
load 'geometry', 'bird/bird.json', [
  ['translate', [0, -5, 0]],
  ['scale', [SCALE, SCALE, SCALE]],
]
load 'material', 'bird/bird_face.png'
load 'material', 'bird/frog_eye.png'
load 'material', 'bird/frog_face.png'
load 'material', 'block.png'
load 'material', 'block2.png'
load 'material', 'block-debug.png'

loaded = ->
  return if --loadCounter
  level1 = level"
    ########\n
    #...#.!#\n
    #.@..###\n
    #......#\n
    #....H.#\n
    #......#\n
    ########\n
  "
  requestAnimationFrame -> animate init level1

class HexPad
  constructor: (@x, @y) ->
    @type = 'hex-pad'
    @geometry = resources.geometry.hex_pad
    @material = resources.material.hex_pad
    @mesh = new THREE.Mesh @geometry, @material
    @rollVector = new THREE.Vector3 1, 0.5, 2
      .normalize()

  update: (state) ->
    @mesh.rotateOnWorldAxis @rollVector, 0.05
    if state.level.mode isnt 'hex' and
      state.level.player.x is @x and
      state.level.player.y is @y
        state.cameraController.warp state, 'hex'
    return

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
      switch event.key.toLowerCase()
        when 'a' then @nextMove = 'a'
        when 'd' then @nextMove = 'd'
        when 's' then @nextMove = 's'
        when 'w' then @nextMove = 'w'
        when 'e' then @nextMove = 'e'
        when 'x' then @nextMove = 'x'
        when 'z' then @nextMove = 'z'
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
      @state = 'moving'
    return

  canMove: (state, move) ->
    state.level.tiles[@y + move.y]?[@x + move.x] isnt "#"

  moving: ->
    @progress += 0.12
    if @progress < 1
      @mesh.rotateOnWorldAxis @rollVector, (1 - @progress) * 0.3
      @mesh.position.lerpVectors @from, @to, @progress
    else
      @mesh.position.copy @to
      @state = 'idle'
    @mesh.position.z = @mesh.position.y - @mesh.position.x

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

entityMap =
  '@': Bird
  'H': HexPad

#  '!': type: 'goal'

createEntity = (char, x, y) ->
  klass = entityMap[char]
  return unless klass
  entity = new klass x, y
  entity.init?()
  entity

level = (parts) ->
  entities = []

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
      block.position.z = -(i + j)
      tileScene.add block

  for e in entities
    e.mesh.position.x = e.x
    e.mesh.position.y = -e.y
    e.mesh.position.z = -(e.x + e.y)
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
  camera.position.z = 1024
  camera.position.x = level.width / 2
  camera.position.y = -level.height / 2
  cameraController = new CameraController camera, level.player
  level.entities.push cameraController

  renderer = new THREE.WebGLRenderer antialias: true
  renderer.setSize window.innerWidth, window.innerHeight
  renderer.autoClear = false
  document.body.appendChild renderer.domElement

  window.block = resources.geometry.block
  window.state = {level, renderer, camera, resources, cameraController}

animate = (state) ->
  requestAnimationFrame -> animate state

  state.renderer.clear()
  for scene, i in state.level.scenes
    state.renderer.clearDepth() if i
    state.renderer.render scene, state.camera

  for ent in state.level.entities
    ent.update? state

