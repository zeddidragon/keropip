require './menu'
State = require './state'
resources = require './resources'
level = require './level'
gameLoop = require './loop'
toggleMute = require './bgm'
currentLevel = require './utils/current-level'

DEBUG = true

currentState = ->
  states.find (state) -> !state.despawning

window.addEventListener 'keydown', (e) ->
  switch e.key.toLowerCase()
    when 'backspace'
      e.preventDefault()
      currentState()?.restart()
    when 'n' then currentState()?.next() if DEBUG
    when 'u' then currentState()?.undo()
    when 'i' then currentState()?.invalidate()
    when 'm' then toggleMute()

states = []

ohNoStage =
  "Please refresh\n" +
  "Something went wrong but don't worry; your progress is saved.\n" +
  "#####\n" +
  "#...#\n" +
  "#.@.#\n" +
  "#...#\n" +
  "#####"
  
startLevel = (n) ->
  fetch "levels/#{n}"
    .then (res) ->
      if res.ok
        res
      else
        ohNoStage
    .then (res) -> res.text?() or res
    .catch -> ohNoStage
    .then level
    .then (lv) -> states.push init lv, n

resources.loaded ->
  startLevel currentLevel()

renderer = new THREE.WebGLRenderer
  antialias: true
  canvas: document.getElementById 'canvas'
renderer.autoClear = false

init = (level, num) ->
  unless renderer.domElement.parentElement
    renderer.domElement.setAttribute 'touch-action', 'none'
    document.body.appendChild renderer.domElement
  state = new State renderer, level, +num, startLevel
  window.$state = state
  state.init()

animate = ->
  if states[0]?.done
    state = states.shift()
  requestAnimationFrame animate

  renderer.clear()

  for state in states
    gameLoop state
  return

requestAnimationFrame animate

