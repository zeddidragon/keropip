resources = require '../resources'
makeZ = require '../utils/make-z'

actions =
  move: (state, action) ->
    action.entity.start state,
      name: action.name
      entity: action.entity
      fromX: action.toX
      fromY: action.toY
      toX: action.fromX
      toY: action.fromY
    action.entity.moving = true
  push: (state, action) ->
    actions.move state, action
  warp: (state, {from}) ->
    state.nextMode = from
  settle: (state, action) ->
    {level} = state
    {entity} = action
    {mesh} = entity.avatar
    mesh.material = resources.material.box
    level.scenes[1].add mesh
    level.setTile entity.x, entity.y, ' '
    level.addEntity entity

undo = (state) ->
  turn = state.turns.pop() or []
  for action in turn by -1
    actions[action.name]? state, action
  state.nextPhase = 'move'
  state.timer = 0
  return turn

module.exports = undo
