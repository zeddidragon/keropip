idle = require './idle'
start = require './start'
move = require './move'
stop = require './stop'
warp = require './warp'

genericPhase = (state) ->
  {phase} = state
  for entity in state.level.entities
    entity[phase]? state
  return

phases =
  idle: idle
  start: start
  move: move
  stop: stop
  warp: warp

gameLoop = (state) ->
  {input, renderer} = state
  input.update state

  loop
    phases[state.phase]? state
    break unless state.nextPhase
    state.phase = state.nextPhase
    state.nextPhase = null

  state.cameraController.update state

  for e in state.level.entities
    e.update state

  for e in state.level.effects
    e.update state

  for scene, i in state.level.scenes
    renderer.clearDepth()
    renderer.render scene, state.camera

  for p in state.particles
    p.vel.multiplyScalar 0.94
    p.vel.z -= 0.08
    p.pos.add p.vel

  state

module.exports = gameLoop
