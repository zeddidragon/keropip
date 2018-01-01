resources = require '../resources'
validMoves = require '../utils/valid-moves'
moving = require '../components/moving'

tmp = new THREE.Vector3

module.exports =
  class Box
    type: 'box'

    constructor: (@x, @y) ->
      @geometry = resources.geometry.block
      @active = resources.material.box
      @passive = resources.material.box_disabled
      @mesh = new THREE.Mesh @geometry, @active
      @initMoving()
      @nextState = null
      @state = 'idle'

    initMoving: moving.init

    push: (state, move) ->
      {level} = state
      return true if @nextState or @state is 'passive'
      tile = level.tileAt @x + move.x, @y + move.y
      return if tile is '#'
      for colliding in level.entitiesAt @x + move.x, @y + move.y
        return if colliding.type is 'box'
      @state = 'moving'
      @from.set @x, -@y, 0
      @x += move.x
      @y += move.y
      @to.set @x, -@y, 0
      state.sfx.play "push#{4 * Math.random() | 1}"
      if not tile or tile is ' '
        @nextState = 'passive'
        setTimeout (=> @settle state), 300
      state.sfx.play "push#{4 * Math.random() | 1}"
      true

    settle: (state) ->
      state.sfx.play "clang"
      state.level.setTile @x, @y, 'B'
      state.level.removeEntity this
      state.level.scenes[0].add @mesh
      @mesh.material = @passive

    moving: moving

    update: (state) ->
      this[@state]? state
