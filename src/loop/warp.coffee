makeZ = require '../utils/make-z'

warp = (state, override) ->
  transform =
    if state.timer >= 1
      makeZ.snap
    else
      makeZ.lerp
  for scene in state.level.scenes
    for e in scene.children
      transform state, e.position, override

warpPhase = (state) ->
  unless state.timer
    state.sfx 'warp'
  state.timer += 0.1
  warp state
  if state.timer >= 1
    state.nextPhase = 'idle'
  return

warpPhase.warp = warp

module.exports = warpPhase
