makeZ = require '../utils/make-z'

moving = (state) ->
  @progress += 0.14
  oldZ = @mesh.position.z
  if @progress < 2
    @mesh.position.lerpVectors @from, @to, 1.1 * Math.sin @progress
  else
    @mesh.position.copy @to
    @state = 'idle'
    @progress = 0
  @mesh.position.z = oldZ
  makeZ.snap state, @mesh.position

moving.init = ->
  @from = new THREE.Vector3
  @to = new THREE.Vector3
  @progress = 0

module.exports = moving
