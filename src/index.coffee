class Entity
  constructor: (@x, @y)->

entities =
  '@': type: 'player'
  '!': type: 'goal'
  'H': type: 'hex-pad'

entity = (char, x, y) ->
  template = entities[char]
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
        e = entity char, i, j
        if e
          entities.push e
        else
          char

  mode: 'normal'
  width: tiles[0].length
  height: tiles.length
  entities: entities
  tiles: tiles
  scene: scene tiles

scene = (tiles) ->
  geometry = new THREE.BoxGeometry 16, 16, 16
  ground = new THREE.MeshBasicMaterial color: 0x232300
  solid = new THREE.MeshBasicMaterial color: 0xafaf30
  scene = new THREE.Scene

  offsetX = tiles[0].length * 8
  offsetY = tiles.length * 8
  offsetZ = (offsetX + offsetY) / 2

  for row, j in tiles
    for tile, i in row
      block = new THREE.Mesh geometry, if tile is '*' then solid else ground
      scene.add block
      block.position.x = i * 16 - offsetX
      block.position.y = j * -16 + offsetY
      block.position.z = (i + j) * -16 - offsetZ

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
  width = window.innerWidth
  height = window.innerHeight
  ratio = width & height
  camera = new THREE.OrthographicCamera -240, 240, 240, -240, 0.01, 2048
  camera.position.z = 512

  renderer = new THREE.WebGLRenderer antialias: true
  renderer.setSize window.innerWidth, window.innerHeight
  document.body.appendChild renderer.domElement

  window.state = {level, renderer, scene, camera}

animate = (state) ->
  requestAnimationFrame -> animate state

  state.renderer.render state.level.scene, state.camera

requestAnimationFrame -> animate init level1

