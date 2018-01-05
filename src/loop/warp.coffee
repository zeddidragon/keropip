makeZ = require '../utils/make-z'

warp = (state) ->
  transform =
    if state.timer >= 1
      makeZ.snap
    else
      makeZ.lerp
  for scene in state.level.scenes
    for e in scene.children
      transform state, e.position

warpPhase = (state) ->
  state.timer += 0.1
  warp state
  if state.timer >= 1
    state.nextPhase = 'idle'
  return

warpPhase.warp = warp

module.exports = warpPhase
