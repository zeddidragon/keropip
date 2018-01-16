makeZ = require '../utils/make-z'

actions =
  move: (state, action) ->
    action.entity.start state, action
    action.entity.moving = true
  push: (state, action) ->
    actions.move state, action
    state.sfx "push#{4 * Math.random() | 1}"
  warp: (state, {to}) ->
    state.nextMode = to

start = (state) ->
  {turns: [..., turn]} = state
  for action in turn
    actions[action.name]? state, action
  state.phase = 'move'
  state.timer = 0
  return

module.exports = start
