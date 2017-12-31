resources = require '../resources'
makeZ = require '../utils/make-z'
validMoves = require '../utils/valid-moves'

tmp = new THREE.Vector3

module.exports =
  class Bird
    constructor: (@x, @y) ->
      @type = 'player'
      @geometry = resources.geometry.bird
      @material = [
        resources.material.bird_arms,
        resources.material.bird_face,
        resources.material.frog_rim,
        resources.material.frog_face,
        resources.material.bird_beak,
        resources.material.frog_eye,
      ]
      @mesh = new THREE.Mesh @geometry, @material
      @state = 'idle'
      @nextMove = null
      @heldMove = null
      @from = new THREE.Vector3
      @to = new THREE.Vector3
      @progress = 0
      @rollVector = new THREE.Vector3

    update: (state) ->
      this[@state]? state
      return if @state is 'goal'
      tmp.set @x, -@y, @mesh.position.z
      makeZ.lerp state, tmp
      @mesh.position.z = tmp.z

    idle: (state) ->
      if @nextMove or @heldMove
        level = state.level
        move = validMoves[level.mode][@nextMove or @heldMove]
        @nextMove = null
        return unless move and level.canMove this, move
        pushed = level.entityAt @x + move.x, @y + move.y
        return if pushed?.push and not pushed.push state, move
        @from.set @x, -@y, 0
        @x += move.x
        @y += move.y
        @to.set @x, -@y, 0
        @progress = 0
        @rollVector
          .set move.y, move.x, 0
          .normalize()
        state.sfx.play "sweep#{4 * Math.random() | 1}"
        @state = 'moving'
      return

    moving: (state) ->
      @progress += 0.14
      oldZ = @mesh.position.z
      if @progress < 2
        @mesh.rotateOnWorldAxis @rollVector, 0.24 * Math.cos @progress
        @mesh.position.lerpVectors @from, @to, 1.1 * Math.sin @progress
      else
        @mesh.position.copy @to
        @state = 'idle'
        if @heldMove
          @nextMove = @heldMove
          @idle state
      @mesh.position.z = oldZ

