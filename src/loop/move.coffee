{warp} = require './warp'

move = (state) ->
  state.timer += 0.12 * state.speed
  if state.timer <= 1.12 and state.level.mode is 'jump'
    warp state
  for entity in state.level.entities when entity.moving
    entity.move? state
  if state.timer > 2 / state.speed
    state.nextPhase = 'stop'
  state

module.exports = move
