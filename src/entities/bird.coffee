resources = require '../resources'

makeZ = require '../utils/make-z'
validMoves = require '../utils/valid-moves'

module.exports =
  class Bird
    constructor: (@x, @y)->
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
      @from = new THREE.Vector3
      @to = new THREE.Vector3
      @progress = 0
      @rollVector = new THREE.Vector3

    init: ->
      @onKeyDown = (event) =>
        key = event.key.toLowerCase()
        @nextMove = key if 'adswexz'.includes(key)
        @nextMove = 'z' if key is 'y'
        return
      document.addEventListener 'keydown', @onKeyDown

    deinit: ->
      document.removeEventListener 'keydown', @onKeyDown

    update: (state) ->
      this[@state]? state

    idle: (state) ->
      if @nextMove
        move = validMoves[state.level.mode][@nextMove]
        @nextMove = null
        return unless move and @canMove state, move
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

    canMove: (state, move) ->
      state.level.tiles[@y + move.y]?[@x + move.x] isnt "#"

    moving: (state) ->
      @progress += 0.14
      if @progress < 2
        @mesh.rotateOnWorldAxis @rollVector, 0.24 * Math.cos @progress
        @mesh.position.lerpVectors @from, @to, 1.1 * Math.sin @progress
      else
        @mesh.position.copy @to
        @state = 'idle'
      @mesh.position.z = makeZ[state.level.mode] @mesh.position

