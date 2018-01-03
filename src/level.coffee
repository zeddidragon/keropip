MoveIndicator = require './entities/move-indicator'
KeyboardInput = require './entities/keyboard-input'
GamepadInput = require './entities/gamepad-input'
TouchInput = require './entities/touch-input'
ModePad = require './entities/mode-pad'
Warper = require './entities/warper'
Bird = require './entities/bird'
Goal = require './entities/goal'
Box = require './entities/box'

resources = require './resources'

title = document.getElementById 'title'
description = document.getElementById 'description'

class Level
  constructor: (str) ->
    @mode = 'orto'
    @entities = [
      new Warper
      new TouchInput
      new GamepadInput
      new KeyboardInput
      new MoveIndicator
    ]

    [title.textContent, description.textContent] = str.split "\n"

    @player = null
    @tiles = str
      .split "\n"
      .slice 2
      .map (str) -> str.split ""
      .map (row, j) =>
        row.map (char, i) =>
          e = createEntity char, i, j
          if e
            @entities.push e
            @player = e if e.type is 'player'
            e.x = i
            e.y = j
            '.'
          else
            char

    @width = @tiles[0].length
    @height = @tiles.length

    @scenes = createScene @tiles, @entities

  canMove: (entity, move) ->
    tile = @tileAt entity.x + move.x, entity.y + move.y
    tile and tile isnt '#' and tile isnt ' '

  setTile: (x, y, tile) ->
    @tiles[y] = [] unless @tiles[y]
    @tiles[y][x] = tile

  tileAt: (x, y) ->
    @tiles[y]?[x]

  entitiesAt: (x, y) ->
    @entities.filter (e) ->
      e.x is x and e.y is y

  removeEntity: (e) ->
    index = @entities.indexOf e
    @entities.splice index, 1 if ~index

module.exports = (str) ->
  new Level str

entityMap =
  '@': Bird
  'H': ModePad
  'O': ModePad
  'D': ModePad
  'J': ModePad
  '!': Goal
  'B': Box

createEntity = (char, x, y) ->
  klass = entityMap[char]
  return unless klass
  entity = new klass x, y, char
  entity

makeDarkerGround = ->
  return resources.material.block_shade if resources.material.block_shade
  shaded = resources.material.block.clone()
  shaded.color.multiplyScalar 0.8
  resources.material.block_shade = shaded

createScene = (tiles, entities) ->
  geometry = resources.geometry.block
  ground = resources.material.block
  darkerGround = makeDarkerGround resources
  solid = resources.material.block2
  tileScene = new THREE.Scene
  entityScene = new THREE.Scene
  overlayScene = new THREE.Scene

  for row, j in tiles
    for tile, i in row
      continue if tile is ' '
      material =
        if tile is '#'
          solid
        else if (i + j) % 2
          ground
        else
          darkerGround
      block = new THREE.Mesh geometry, material
      block.position.x = i
      block.position.y = -j
      tileScene.add block

  addMesh = (e, mesh) ->
    mesh.position.x = e.x
    mesh.position.y = -e.y
    mesh.name = e.type
    entityScene.add mesh

  for e in entities when e.mesh
    addMesh e, e.mesh

  [tileScene, entityScene, overlayScene]

