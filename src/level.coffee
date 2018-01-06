MoveIndicator = require './entities/move-indicator'
Warper = require './entities/warper'
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

  addEntity: (e) ->
    @entities.push e

  removeEntity: (e) ->
    index = @entities.indexOf e
    @entities.splice index, 1 if ~index

module.exports = (str) ->
  new Level str

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

  for e in entities when e.avatar
    addMesh e, e.avatar.mesh

  [tileScene, entityScene, overlayScene]

