{warp} = require './warp'

peek = (state) ->
  {input, cameraController} = state
  target = if state.level.mode is 'hex' then 'orto' else 'hex'
  if cameraController.mode isnt 'target'
    state.timer = 0
    cameraController.warp state, target
  if state.timer <= 1
    state.timer += 0.1
    warp state, target
  unless input.peek
    cameraController.warp state, state.level.mode
    state.timer = 0
    state.nextPhase = 'warp'
  return state

module.exports = peek
