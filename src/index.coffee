TILE = 16

loadCounter = 0
resources =
  geometry: {}
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
  scene: scene tiles, entities

scene = (tiles, entities) ->
  geometry = new THREE.BoxGeometry TILE, TILE, TILE
  ground = new THREE.MeshBasicMaterial color: 0x232300
  solid = new THREE.MeshBasicMaterial color: 0xafaf30
  scene = new THREE.Scene

  for row, j in tiles
    for tile, i in row
      block = new THREE.Mesh geometry, if tile is '*' then solid else ground
      block.position.x = i * TILE
      block.position.y = j * -TILE
      block.position.z = (i + j) * -TILE
      scene.add block

  for e in entities
    e.mesh = new THREE.Mesh e.geometry, e.material
    e.mesh.position.x = (e.x + 0.5) * TILE
    e.mesh.position.y = (e.y + 0.5) * -TILE
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

  window.state = {level, renderer, scene, camera}

animate = (state) ->
  requestAnimationFrame -> animate state

  state.renderer.render state.level.scene, state.camera
