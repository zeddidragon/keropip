module.exports =
  class CameraController
    constructor: (@camera, @player) ->
      @state = 'tracking'
      @offset = new THREE.Vector3 0, 0, 16
      @from = new THREE.Vector3
      @to = new THREE.Vector3
      @progress = 0

    warp: (state, mode) ->
      @state = 'warping'
      @from.copy @offset
      @progress = 0
      state.level.mode = mode
      state.sfx.play 'warp'
      switch mode
        when 'orto' then @to.set 0, 0, 16
        when 'hex' then @to.set 16, -16, 16
      return

    tracking: ->
      return if @player.state is 'goal'
      @camera.position.addVectors @player.mesh.position, @offset
      @camera.lookAt @player.mesh.position

    warping: ->
      @progress += 0.03
      if @progress < 1
        @offset.lerpVectors @from, @to, @progress
      else
        @offset.copy @to
        @state = 'tracking'
      @tracking()

    update: (state) ->
      this[@state]? state
