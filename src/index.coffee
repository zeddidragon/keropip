CameraController = require './entities/camera-controller'
resources = require './resources'
level = require './level'

DEBUG = true

currentState = ->
  states.find (state) -> !state.despawning

restart = ->
  currentState()?.restart()

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
  .addEventListener 'click', restart

muteNode.addEventListener 'click', toggleMute

window.addEventListener 'keydown', (e) ->
  switch e.key.toLowerCase()
    when 'backspace'
      e.preventDefault()
      restart()
    when 'n' then currentState().next() if DEBUG
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

class Particle
  constructor: (@pos, @vel) ->

init = (level, num) ->

  camera = new THREE.PerspectiveCamera 45, window.innerWidth / window.innerHeight, 0.01, 2048
  camera.position.set -1000, -1000, 16
  camera.up
    .set 0, 1, 1
    .normalize()
  cameraController = new CameraController camera, level.player
  level.entities.push cameraController

  onResize = ->
    width = window.innerWidth
    height = window.innerHeight

    renderer.setSize width, height

    camera.aspect = width / height
    camera.fov =
      if width > height
        camera.fov = 45 / camera.aspect
      else
        camera.fov = 35
    camera.fov = Math.max 20, Math.min 360, camera.fov + Math.log height

    camera.updateProjectionMatrix()

  window.addEventListener 'resize', onResize

  onResize()

  unless renderer.domElement.parentElement
    renderer.domElement.setAttribute 'touch-action', 'none'
    document.body.appendChild renderer.domElement

  window.block = resources.geometry.block

  particles = []

  despawn = (offset) ->
    return if state.despawning
    state.despawning = true
    resources.sfx.sfx.play 'explosion'
    level.player.state = 'goal'
    setTimeout (-> startLevel num + (offset or 0)), 1000
    setTimeout (-> state.done = true), 5000
    window.removeEventListener 'resize', onResize
    oldCamera = state.camera
    {width, height} = level

    for scene in state.level.scenes
      for e in scene.children
        biasX = e.position.x / width - 0.5
        biasY = e.position.y / height - 0.5
        vec = new THREE.Vector3 Math.random() + biasX, Math.random() + biasY, -Math.random()
        particles.push new Particle e.position, vec

    for entity in state.level.entities
      entity.deinit? state

  state =
    done: false
    despawning: false
    level: level
    levelNumber: num
    player: level.player
    camera: camera
    resources: resources
    sfx: resources.sfx.sfx
    cameraController: cameraController
    renderer: renderer
    element: renderer.domElement
    particles: particles
    next: ->
      maxLevel = +localStorage.level or 0
      localStorage.level = Math.max maxLevel, +num + 1
      window.history.pushState {}, null, "?level=#{+num + 1}"
      despawn 1
    restart: -> despawn 0

  for entity in level.entities
    entity.init? state

  window.$state = state
  state

animate = ->
  if states[0]?.done
    state = states.shift()
  requestAnimationFrame animate

  renderer.clear()

  for state in states
    for scene, i in state.level.scenes
      renderer.clearDepth() if i
      renderer.render scene, state.camera

    for ent in state.level.entities
      ent.update? state

    for p in state.particles
      p.vel.z -= 0.08
      p.vel.multiplyScalar 0.94
      p.pos.add p.vel

requestAnimationFrame animate

