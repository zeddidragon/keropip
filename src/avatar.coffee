makeZ = require './utils/make-z'
resources = require './resources'

class Avatar
  constructor: (@mesh) ->
    @from = new THREE.Vector3
    @to = new THREE.Vector3
    @from.copy @mesh.position
    @rollVector = new THREE.Vector3 1, 0, 0
    @idleRoll = 0
    @activeRoll = 0

  move: ({timer}) ->
    oldZ = @mesh.position.z
    @mesh.position.lerpVectors @from, @to, 1.1 * Math.sin timer
    return unless @activeRoll
    @mesh.rotateOnWorldAxis @rollVector, @activeRoll * Math.cos timer

  stop: ->
    @mesh.position.copy @to

  start: (state, {fromX, fromY, toX, toY}) ->
    @rollVector
      .set toY - fromY, toX - fromX, 0
      .normalize()
    @from.set fromX, -fromY, 0
    makeZ.snap state, @from
    @to.set toX, -toY, 0
    makeZ.snap state, @to

  update: ->
    return unless @idleRoll
    @mesh.rotateOnWorldAxis @rollVector, @idleRoll

makeAvatar = (geo, mat) ->
  geometry = resources.geometry[geo]
  material = resources.material[mat or geo]
  mesh = new THREE.Mesh geometry, material
  new Avatar mesh

makePad = (type) ->
  avatar = makeAvatar "#{type}_pad"
  avatar
    .rollVector
    .set 1, 1, 0
    .normalize()
  avatar.idleRoll = 0.05
  avatar

recipes =
  '@': ->
    geometry = resources.geometry.bird
    material = [
      resources.material.bird_arms,
      resources.material.bird_face,
      resources.material.frog_rim,
      resources.material.frog_face,
      resources.material.bird_beak,
      resources.material.frog_eye,
    ]
    mesh = new THREE.Mesh geometry, material
    avatar = new Avatar mesh
    avatar.activeRoll = 0.24
    avatar

  '!': -> makeAvatar 'goal'
  'B': -> makeAvatar 'block', 'box'
  'H': -> makePad 'hex'
  'O': -> makePad 'orto'
  'D': -> makePad 'diag'
  'J': -> makePad 'jump'
  'S': -> makePad 'skip'

module.exports = (type) ->
  recipes[type]?()
