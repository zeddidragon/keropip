require './menu'
State = require './state'
resources = require './resources'
level = require './level'
gameLoop = require './loop'
currentLevel = require './utils/current-level'

states = []

ohNoStage =
  "Please refresh\n" +
  "Something went wrong but don't worry; your progress is saved.\n" +
  "#####\n" +
  "#...#\n" +
  "#.@.#\n" +
  "#...#\n" +
  "#####"

levelCache = {}

fetchLevel = (n) ->
  return Promise.resolve levelCache[n] if levelCache[n]
  fetch "levels/#{n}"
    .then (res) ->
      throw new Error 'failed to load level' unless res.ok
      res.text()
    .then (level) ->
      levelCache[n] = level
    .catch ->
      delete levelCache[n]
      ohNoStage
  
startLevel = (n) ->
  fetchLevel n
    .then (lv) ->
      fetchLevel +n + 1
      lv = level lv
      states.push init lv, n

resources.loaded ->
  requestAnimationFrame animate
  startLevel currentLevel destructive: true

renderer = new THREE.WebGLRenderer
  antialias: true
  canvas: document.getElementById 'canvas'
renderer.autoClear = false

init = (level, num) ->
  state = new State renderer, level, +num, startLevel
  window.$state = state
  state.init()

turns = 0
undos = 0
turnElement = document.getElementById 'turns'

animate = ->
  if states[0]?.done
    state = states.shift()
  requestAnimationFrame animate

  renderer.clear()

  for state in states
    gameLoop state

  if $state and (turns isnt $state.turns.length or undos isnt $state.undos)
    turns = $state.turns.length
    undos = $state.undos
    str = turns
    str += " (+#{undos})" if undos
    turnElement.textContent = str
  return

if navigator.serviceWorker and not navigator.serviceWorker.controller
  navigator.serviceWorker.register 'sw.js', scope: './'
  
