resources = require '../resources'

charModes =
  H: 'hex'
  O: 'orto'
  D: 'diag'

module.exports =
  class ModePad
    constructor: (@x, @y, char) ->
      @type = 'mode-pad'
      @mode = charModes[char]
      @geometry = resources.geometry["#{@mode}_pad"]
      @material = resources.material["#{@mode}_pad"]
      @mesh = new THREE.Mesh @geometry, @material
      if @mode is 'diag'
        @mode = if (@x + @y) % 2 then 'diagOdd' else 'diagEven'
      @rollVector = new THREE.Vector3 1, 1, 0
        .normalize()

    update: (state) ->
      @mesh.rotateOnWorldAxis @rollVector, 0.05
      return if state.level.mode is @mode
      return unless state.player.x is @x and state.player.y is @y
      console.log 'switching to ' + @mode
      state.cameraController.warp state, @mode
