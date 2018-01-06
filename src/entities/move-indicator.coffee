resources = require '../resources'
validMoves = require '../utils/valid-moves'
makeZ = require '../utils/make-z'

module.exports =
  class MoveIndicator
    constructor: ->
      @geometry = resources.geometry.block
      @material = resources.material.highlight_block
      @letterMaterial = resources.material.letters
      @blocks = []
      @letters = []
      for i in [1..8]
        block = new THREE.Mesh @geometry, @material
        @blocks.push block
        letter = new THREE.Mesh resources.geometry.w, @letterMaterial
        @letters.push letter

    init: (state) ->
      for block, i in @blocks
        state.level.scenes[2].add block
        state.level.scenes[2].add @letters[i]

    update: (state) ->
      {level, player, input} = state
      mode = level.mode
      moves = validMoves[mode]
      keys = if state.phase is 'goal' then [] else Object.keys validMoves[mode]
      for block, i in @blocks
        key = keys[i]
        move = moves[key]
        letter = @letters[i]
        if key and move and level.canMove player, move
          block.position.set player.x + move.x, -(player.y + move.y), 0
          block.position.z = makeZ[level.mode] state, block.position
          block.visible = true unless block.visible
          if input.keyboardInput or input.consideredMove is key
            key = 'a' if input.consideredMove is key
            geometry = resources.geometry[key]
            letter.position.copy block.position
            letter.visible = true unless letter.visible
            letter.geometry = geometry unless block.geometry is geometry
            letter.up.copy state.camera.up
            letter.lookAt state.camera.position
          else if letter.visible
            letter.visible = false
        else
          block.visible = false if block.visible
          letter.visible = false if letter.visible
      return

