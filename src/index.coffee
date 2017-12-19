TILE = 16

generateBlock = ->
  block = new THREE.BoxGeometry TILE, TILE, TILE

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
  material: {}

loaders =
  geometry: new THREE.JSONLoader
  material: new THREE.TextureLoader

load = (type, path) ->
  ++loadCounter
  loaders[type].load 'assets/models/' + path, (obj) ->
    name = path
      .split '/'
      .pop()
      .split '.'
      .shift()
    if type is 'material'
      obj = new THREE.MeshBasicMaterial map: obj
    resources[type][name] = obj
    loaded()

load 'geometry', 'bird/bird.json'
load 'material', 'bird/bird_face.png'
load 'material', 'bird/frog_eye.png'
load 'material', 'bird/frog_face.png'
load 'material', 'block.png'
load 'material', 'block2.png'
load 'material', 'block-debug.png'

loaded = ->
  return if --loadCounter
  level1 = level'
    ********\n
    *...*.!*\n
    *.@..***\n
    *......*\n
    *....H.*\n
    ********\n
  '
  requestAnimationFrame -> animate init level1


class Entity
  constructor: (@x, @y)->
    @mesh = null

entityMap =
  '@': ->
    geometry: resources.geometry.bird
    material: [
      new THREE.MeshBasicMaterial(color: 0xffff00),
      resources.material.bird_face,
      resources.material.frog_face,
      resources.material.frog_face,
      new THREE.MeshBasicMaterial(color: 0xffaa00),
      resources.material.frog_eye,
    ]
    type: 'player'
    scale: 3

#  '!': type: 'goal'
#  'H': type: 'hex-pad'

createEntity = (char, x, y) ->
  template = entityMap[char]?()
  return unless template
  entity = new Entity x, y
  Object.assign entity, template

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
  scene: createScene tiles, entities

createScene = (tiles, entities) ->
  geometry = resources.geometry.block
  ground = resources.material.block
  solid = resources.material.block2
  scene = new THREE.Scene

  scene.position.x = -96
  scene.rotation.x = Math.PI * -0.125
  scene.rotation.y = Math.PI * -0.25


  for row, j in tiles
    for tile, i in row
      block = new THREE.Mesh geometry, if tile is '*' then solid else ground
      block.position.x = i * TILE
      block.position.y = j * -TILE
      block.position.z = (i + j) * -TILE
      scene.add block

  for e in entities
    e.mesh = new THREE.Mesh e.geometry, e.material
    e.mesh.position.x = e.x * TILE
    e.mesh.position.y = e.y * -TILE
    e.mesh.position.z = ((e.x + e.y) / 2) * -TILE
    e.mesh.scale.multiplyScalar e.scale if e.scale
    e.mesh.name = e.type
    scene.add e.mesh

  scene

init = (level) ->
  width = window.innerWidth
  height = window.innerHeight
  size = 128
  if width > height
    ratio = width / height
    height = size
    width = size * ratio
  else
    ratio = height / width
    width = size
    height = size * ratio

  camera = new THREE.OrthographicCamera -width, width, height, -height, 0.01, 2048
  camera.position.z = 512

  renderer = new THREE.WebGLRenderer antialias: true
  renderer.setSize window.innerWidth, window.innerHeight
  document.body.appendChild renderer.domElement

  window.block = resources.geometry.block
  window.state = {level, renderer, camera, resources}

animate = (state) ->
  requestAnimationFrame -> animate state

  state.renderer.render state.level.scene, state.camera
