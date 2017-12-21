generateBlock = ->
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

loadCounter = 0
resources =
  geometry:
    block: generateBlock()
  material:
    bird_arms: new THREE.MeshBasicMaterial color: 0xffff00
    bird_beak: new THREE.MeshBasicMaterial color: 0xffaa00
    frog_rim: new THREE.MeshBasicMaterial color: 0x84c914

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
  level1 = level'
    ########\n
    #...#.!#\n
    #.@..###\n
    #......#\n
    #....H.#\n
    ########\n
  '
  requestAnimationFrame -> animate init level1

class Bird
  constructor: (@x, @y)->
    scale: 3
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
    @nextMove = new THREE.Vector3
    @from = new THREE.Vector3
    @to = new THREE.Vector3
    @progress = 0
    @rollVector = new THREE.Vector3

  init: ->
    document.addEventListener 'keydown', (event) =>
      switch event.key.toLowerCase()
        when 'a', 'h' then @nextMove.set -1, 0, 0
        when 'd', 'l' then @nextMove.set 1, 0, 0
        when 's', 'j' then @nextMove.set 0, 1, 0
        when 'w', 'k' then @nextMove.set 0, -1, 0
      return

  deinit: ->

  update: (state) ->
    this[@state]? state

  idle: (state) ->
    if @nextMove.manhattanLength() and @canMove state, @nextMove
      @from.set @x, -@y, 0
      @x += @nextMove.x
      @y += @nextMove.y
      @to.set @x, -@y, 0
      @progress = 0
      @rollVector.set @nextMove.y, @nextMove.x, 0
      @nextMove.set 0, 0, 0
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
    @mesh.position.z = -(@mesh.position.x + @mesh.position.y)


entityMap =
  '@': Bird

#  '!': type: 'goal'
#  'H': type: 'hex-pad'

createEntity = (char, x, y) ->
  klass = entityMap[char]
  return unless klass
  entity = new klass x, y
  entity.init?()
  entity

level = (parts) ->
  entities = []

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
          e.x = i
          e.y = j
        else
          char

  mode: 'normal'
  width: tiles[0].length
  height: tiles.length
  entities: entities
  tiles: tiles
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
  size = Math.max(level.width, level.height) / 2
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

  renderer = new THREE.WebGLRenderer antialias: true
  renderer.setSize window.innerWidth, window.innerHeight
  renderer.autoClear = false
  document.body.appendChild renderer.domElement

  window.block = resources.geometry.block
  window.state = {level, renderer, camera, resources}

animate = (state) ->
  requestAnimationFrame -> animate state

  state.renderer.clear()
  for scene, i in state.level.scenes
    state.renderer.clearDepth() if i
    state.renderer.render scene, state.camera

  for ent in state.level.entities
    ent.update? state

