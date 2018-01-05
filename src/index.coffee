State = require './state'
resources = require './resources'
level = require './level'
gameLoop = require './loop'

DEBUG = true

currentState = ->
  states.find (state) -> !state.despawning

restart = ->
  currentState()?.restart()

undo = ->
  currentState()?.undo()

bgmNode = document.getElementById 'bgm'
muteNode = document.getElementById 'mute'
muted = false
toggleMute = ->
  document.removeEventListener 'click', initialPlay if initialPlay
  muted = not muted or muted is 'false'
  localStorage.muted = muted
  if muted
    bgmNode.pause()
    muteNode.innerHTML = '&#x1f50a;'
  else
    bgmNode.play()
    muteNode.innerHTML = '&#x1f507;'

if localStorage.muted is 'true'
  toggleMute()
else
  initialPlay = ->
    bgmNode.play()
    document.removeEventListener 'click', initialPlay
  document.addEventListener 'click', initialPlay

document
  .getElementById 'restart'
  .addEventListener 'click', ->
    if confirm 'Really restart?' then restart()
document
  .getElementById 'undo'
  .addEventListener 'click', undo

muteNode.addEventListener 'click', toggleMute

window.addEventListener 'keydown', (e) ->
  switch e.key.toLowerCase()
    when 'backspace'
      e.preventDefault()
      restart()
    when 'n' then currentState().next() if DEBUG
    when 'u' then undo()
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
      if res.status is 404
        n = 1
        fetch "levels/1"
      else if res.ok
        res
      else
        ohNoStage
    .then (res) -> res.text?() or res
    .catch -> ohNoStage
    .then level
    .then (lv) -> states.push init lv, n

resources.loaded ->
  if location.search
    [key, num] = location
      .search
      .slice 1
      .split '&'
      .map (str) -> str.split '='
      .find ([key, val]) -> key is 'level'
  startLevel +num or localStorage.level or 1

renderer = new THREE.WebGLRenderer antialias: true
renderer.autoClear = false

init = (level, num) ->
  unless renderer.domElement.parentElement
    renderer.domElement.setAttribute 'touch-action', 'none'
    document.body.appendChild renderer.domElement
  state = new State renderer, level, num, startLevel
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

