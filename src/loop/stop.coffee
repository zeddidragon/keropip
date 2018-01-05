resources = require '../resources'

actions =
  settle: (state, action) ->
    {level} = state
    {entity} = action
    {mesh} = entity.avatar
    state.sfx.play 'clang'
    mesh.material = resources.material.box_disabled
    level.scenes[0].add mesh
    level.setTile entity.x, entity.y, 'B'
    entity.stop state
    level.removeEntity entity
  goal: (state) ->
    state.next()

stop = (state) ->
  {turns: [..., turn]} = state
  for action in turn
    actions[action.name]? state, action
  for entity in state.level.entities when entity.moving
    entity.stop? state
    entity.moving = false
  if state.nextMode
    state.nextPhase = 'warp'
    state.cameraController.warp state, state.nextMode
    state.level.mode = state.nextMode
    state.nextMode = null
    state.timer = 0
  else if not state.nextPhase
    state.nextPhase = 'idle'
  state

module.exports = stop
