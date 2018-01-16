zoom = (state) ->
  {input, cameraController} = state
  if cameraController.zoom < 2
    cameraController.zoom = 2
  unless input.zoom
    cameraController.zoom = 1
    state.nextPhase = 'idle'
  return state

module.exports = zoom
