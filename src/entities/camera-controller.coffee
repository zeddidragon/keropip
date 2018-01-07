{LERP_FACTOR} = require '../utils/make-z'
tmpVec = new THREE.Vector3

offsets =
  orto: new THREE.Vector3 0, 0, 24
  hex: new THREE.Vector3 16, -16, 16
  diag: new THREE.Vector3 12, -12, 16
  jump: new THREE.Vector3 0, 0, 18
  skip: new THREE.Vector3 0, -12, 16

ups =
  orto: new THREE.Vector3 0, 1, 0
  hex: new THREE.Vector3 0, 1, 0
  diag: new THREE.Vector3 0, 0, 1
  jump: new THREE.Vector3 -8, 12, 0
  skip: new THREE.Vector3 0, 1, 1

module.exports =
  class CameraController
    constructor: (@camera) ->
      @state = 'tracking'
      @offset = new THREE.Vector3()
        .copy offsets.orto
      @from = new THREE.Vector3
      @to = new THREE.Vector3
      @progress = 0

    warp: (state, mode) ->
      @state = 'warping'
      @from.copy @offset
      @progress = 0
      state.level.mode = mode
      state.sfx.play 'warp'
      @to.copy offsets[mode]
      @camera.up.copy ups[mode]

    tracking: (state) ->
      return if state.phase is 'goal'
      {position} = state.level.player.avatar.mesh
      tmpVec.addVectors position, @offset
      @camera.position.lerp tmpVec, LERP_FACTOR
      @camera.lookAt position

    warping: (state) ->
      @progress += 0.01
      if @progress < 1
        @offset.lerp @to, LERP_FACTOR
      else
        @offset.copy @to
        @state = 'tracking'
      @tracking state

    update: (state) ->
      this[@state]? state
