{LERP_FACTOR} = require '../utils/make-z'
tmpVec = new THREE.Vector3

offsets =
  orto: new THREE.Vector3 0, 0, 24
  hex: new THREE.Vector3 16, -16, 16
  diag: new THREE.Vector3 0, 0, 26
  jump: new THREE.Vector3 0, 0, 28
  skip: new THREE.Vector3 0, 0, 30
  zoom: new THREE.Vector3 0, 0, 50

ups =
  orto: new THREE.Vector3 0, 1, 0
  hex: new THREE.Vector3 0, 1, 0
  diag: new THREE.Vector3 -1, 1, 0
  jump: new THREE.Vector3 0, 1, 0
  skip: new THREE.Vector3 0, 1, 0
  zoom: new THREE.Vector3 0, 1, 0

module.exports =
  class CameraController
    constructor: (@camera) ->
      @state = 'tracking'
      @offset = new THREE.Vector3()
        .copy offsets.orto
      @offsetOverride = null
      @from = new THREE.Vector3
      @to = new THREE.Vector3
      @progress = 0
      @zoom = 1

    warp: (state, mode) ->
      @state = 'warping'
      @from.copy @offset
      @progress = 0
      state.sfx.play 'warp'
      @to.copy offsets[mode]
      @camera.up.copy ups[mode]

    tracking: (state) ->
      return if state.phase is 'goal'
      {position} = state.level.player.avatar.mesh
      tmpVec
        .copy @offsetOverride or @offset
        .multiplyScalar @zoom
        .add position
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
