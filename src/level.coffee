ModePad = require './entities/mode-pad.coffee'
Warper = require './entities/warper.coffee'
Bird = require './entities/bird.coffee'
Goal = require './entities/goal.coffee'

resources = require './resources.coffee'

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

module.exports = level

entityMap =
  '@': Bird
  'H': ModePad
  'O': ModePad
  'D': ModePad
  '!': Goal

createEntity = (char, x, y) ->
  klass = entityMap[char]
  return unless klass
  entity = new klass x, y, char
  entity.init?()
  entity

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

