TILE = 16

geometries = {}
materials = {}

class Entity
  constructor: (@x, @y)->
    @mesh = null

entityMap =
  '@':
    geometry: new THREE.SphereGeometry TILE / 2, 32, 32
    material: new THREE.MeshBasicMaterial color: 0xaa9933
    type: 'player'

#  '!': type: 'goal'
#  'H': type: 'hex-pad'

createEntity = (char, x, y) ->
  template = entityMap[char]
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
    e.mesh.name = e.type
    scene.add e.mesh

  scene

level1 = level'
  ********\n
  *...*.!*\n
  *.@..***\n
  *......*\n
  *....H.*\n
  ********\n
'

init = (level) ->
  ratio = window.innerWidth / window.innerHeight
  width = 240 * ratio
  height = 240
  console.log width, height

  camera = new THREE.OrthographicCamera -width, width, height, -height, 0.01, 2048
  camera.position.z = 512

  renderer = new THREE.WebGLRenderer antialias: true
  renderer.setSize window.innerWidth, window.innerHeight
  document.body.appendChild renderer.domElement

  window.state = {level, renderer, scene, camera}

animate = (state) ->
  requestAnimationFrame -> animate state

  state.renderer.render state.level.scene, state.camera

requestAnimationFrame -> animate init level1

