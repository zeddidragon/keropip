resources = require '../resources'
validMoves = require '../utils/valid-moves'
makeZ = require '../utils/make-z'

tmp = new THREE.Vector3

rotate =
  orto: (vec) ->
    {x, y} = vec
    vec.x = -y
    vec.y = x
  hex: (vec) ->
    {x, y, z} = vec
    vec.x = -y
    vec.y = -z
    vec.z = -x
  jump: (vec) ->
    {x, y, z} = vec
    if z
      vec.x = -y
      vec.y = -x
    else
      vec.x = -x
    vec.z = 1 - z
    vec
rotate.diag = rotate.orto

initial =
  orto: new THREE.Vector3 1, 0, 0
  hex: new THREE.Vector3 0, 1, -1
  diag: new THREE.Vector3 1, 1, 0
  jump: new THREE.Vector3 -1, -2, 0

module.exports =
  class MoveIndicator
    constructor: ->
      @geometry = resources.geometry.block
      @material = resources.material.highlight_block
      @meshes = []
      for i in [1..8]
        block = new THREE.Mesh @geometry, @material
        @meshes.push block

    update: (state) ->
      {level, player} = state
      mode = level.mode
      show = player.state isnt 'goal'
      tmp.copy initial[mode]
      count = Object.keys validMoves[mode]
        .length
      for block, i in @meshes
        if show and i < count and level.canMove player, tmp
          block.position
            .set player.x, player.y, 0
            .add tmp
          block.position.y = -block.position.y
          block.position.z = makeZ[level.mode] state, block.position
          block.visible = true
        else
          block.visible = false
        rotate[level.mode] tmp
      return

