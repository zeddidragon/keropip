MoveIndicator = require './entities/move-indicator'
createEntity = require './entity'

resources = require './resources'

title = document.getElementById 'title'
description = document.getElementById 'description'

class Level
  constructor: (str) ->
    @mode = 'orto'
    @effects = [
      new MoveIndicator
    ]
    @entities = []

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
            @player = e if e.type is '@'
            e.x = i
            e.y = j
            '.'
          else
            char

    @scenes = createScene @tiles, @entities

  init: (state) ->
    for effect in @effects
      effect.init? state
    return

  canMove: (entity, move) ->
    x = entity.x + move.x
    y = entity.y + move.y
    tile = @tileAt entity.x + move.x, entity.y + move.y
    return false if not tile or tile is '#' or tile is ' '
    pushed = @entityAt x, y, 'B'
    not pushed or @canMoveBox pushed, move

  canMoveBox: (entity, move) ->
    x = entity.x + move.x
    y = entity.y + move.y
    return false if '#' is @tileAt x, y
    return false if @entityAt x, y, 'B'
    true

  setTile: (x, y, tile) ->
    @tiles[y] = [] unless @tiles[y]
    @tiles[y][x] = tile

  tileAt: (x, y) ->
    @tiles[y]?[x]

  entityAt: (x, y, type) ->
    @entities.find (e) ->
      e.x is x and e.y is y and e.type is type

  entitiesAt: (x, y) ->
    @entities.filter (e) ->
      e.x is x and e.y is y

  addEntity: (e) ->
    @entities.push e

  removeEntity: (e) ->
    index = @entities.indexOf e
    @entities.splice index, 1 if ~index

module.exports = (str) ->
  new Level str

makeGroundVariants = ->
  return resources.material.block_shade if resources.material.block_shade
  shaded = resources.material.block.clone()
  shaded.color.multiplyScalar 0.8
  resources.material.block_shade = shaded

  shaded

bevel = "
11111
11110
11110
11100
10000
"
  .split " "
  .map (row) ->
    row
      .split ""
      .map Number

createScene = (tiles, entities) ->
  geometry = resources.geometry.block
  ground = resources.material.block
  darkerGround = makeGroundVariants resources
  solid = resources.material.block2
  faded = resources.material['block-fade']
  tileScene = new THREE.Scene
  entityScene = new THREE.Scene
  overlayScene = new THREE.Scene
  height = tiles.length
  width = tiles
    .map (row) -> row.length
    .reduce (a, b) -> Math.max a, b

  for j in [-5..(height + 4)]
    row = tiles[j] or []
    for i in [-5..(width + 4)]
      if (i < 0 or i >= width) and (j < 0 or j >= height)
        iOffset = if i < 0 then -i - 1 else i - width
        jOffset = if j < 0 then -j - 1 else j - height
        continue unless bevel[jOffset][iOffset]
      tile = row?[i]
      material =
        if not tile or tile is ' '
          faded
        else if tile is '#'
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

  for e in entities when e.avatar
    addMesh e, e.avatar.mesh

  [tileScene, entityScene, overlayScene]

