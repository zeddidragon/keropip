resources = require '../resources'
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
rotate.diag = rotate.orto

initial =
  orto: new THREE.Vector3 1, 0, 0
  hex: new THREE.Vector3 1, 0, 0
  diag: new THREE.Vector3 1, 1, 0

module.exports =
  class MoveIndicator
    constructor: ->
      @geometry = resources.geometry.block
      @material = resources.material.highlight_block
      @meshes = []
      for i in [1..6]
        block = new THREE.Mesh @geometry, @material
        @meshes.push block

    update: (state) ->
      mode = state.level.mode
      show = state.player.state isnt 'goal'
      tmp.copy initial[mode]
      for block, i in @meshes
        if show and (i < 4 or mode is 'hex') and state.player.canMove state, tmp
          block.position
            .set state.player.x, state.player.y, 0
            .add tmp
          block.position.y = -block.position.y
          block.position.z = makeZ[state.level.mode] block.position
          block.visible = true
        else
          block.visible = false
        rotate[state.level.mode] tmp
      return

