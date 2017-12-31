makeZ = require '../utils/make-z'
tmp = new THREE.Vector3

moving = (state) ->
  @progress += 0.14
  oldZ = @mesh.position.z
  if @progress < 2
    @mesh.position.lerpVectors @from, @to, 1.1 * Math.sin @progress
  else
    @mesh.position.copy @to
    @state = 'idle'
    @progress = 0
  tmp.set @x, -@y, oldZ
  makeZ.snap state, tmp
  @mesh.position.z = tmp.z

moving.init = ->
  @from = new THREE.Vector3
  @to = new THREE.Vector3
  @progress = 0

module.exports = moving
