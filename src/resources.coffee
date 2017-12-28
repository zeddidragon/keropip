bgmNode = document.getElementById 'bgm'
bgmNode.volume = 0.5

tmpMat = new THREE.Matrix4
loadCounter = 0
resources =
  sfx:
    bgm: bgmNode
  geometry:
    block: do ->
      block = new THREE.BoxGeometry 1, 1, 1

      block.faceVertexUvs[0][0][0].x = 1
      block.faceVertexUvs[0][0][1].x = 1
      block.faceVertexUvs[0][0][2].x = 0
      block.faceVertexUvs[0][1][0].x = 1
      block.faceVertexUvs[0][1][1].x = 0
      block.faceVertexUvs[0][1][2].x = 0

      block.faceVertexUvs[0][6][0].y = 0
      block.faceVertexUvs[0][6][1].y = 1
      block.faceVertexUvs[0][6][2].y = 0
      block.faceVertexUvs[0][7][0].y = 1
      block.faceVertexUvs[0][7][1].y = 1
      block.faceVertexUvs[0][7][2].y = 0

      block.uvsNeedUpdate = true
      block
    hex_pad: new THREE.CircleGeometry 0.5, 6
    orto_pad: new THREE.PlaneGeometry 0.8, 0.8, 1, 1
    goal: do ->
      dot = new THREE.SphereGeometry 0.12, 6, 6
      tmpMat.makeTranslation 0, -0.4, 0
      dot.applyMatrix tmpMat
      line = new THREE.CylinderGeometry 0.18, 0.10, 0.6, 6
      tmpMat.makeTranslation 0, 0.1, 0
      line.applyMatrix tmpMat
      dot.merge line
      dot
  material:
    bird_arms: new THREE.MeshBasicMaterial color: 0xffff00
    bird_beak: new THREE.MeshBasicMaterial color: 0xffaa00
    frog_rim: new THREE.MeshBasicMaterial color: 0x84c914
    hex_pad: new THREE.MeshBasicMaterial
      color: 0x66ddff
      transparent: true
      opacity: 0.7
    orto_pad: new THREE.MeshBasicMaterial
      color: 0xff6666
      transparent: true
      opacity: 0.7
    goal: new THREE.MeshBasicMaterial
      color: 0xf0e68c
      transparent: true
      opacity: 0.7
    highlight_block: new THREE.MeshBasicMaterial
      color: 0x3355ff
      transparent: true
      opacity: 0.5

loaders =
  geometry: new THREE.JSONLoader
  material: new THREE.TextureLoader
  sfx: load: (path, cb) ->
    fetch path
      .then (response) -> response.json()
      .then (settings) ->
        settings.preload = true
        player = new Howl settings
        player.once 'load', -> cb player

load = (type, path, transforms) ->
  ++loadCounter
  loaders[type].load "assets/" + path, (obj) ->
    name = path
      .split '/'
      .pop()
      .split '.'
      .shift()
    if type is 'material'
      obj = new THREE.MeshBasicMaterial map: obj
    for [transform, args] in (transforms or [])
      obj[transform] ...args
    resources[type][name] = obj
    loaded()

isLoaded = false
callback = null

loaded = ->
  return if --loadCounter
  isLoaded = true
  requestAnimationFrame -> callback? resources

resources.loaded = (cb) ->
  callback = cb
  requestAnimationFrame -> cb resources if isLoaded

load 'geometry', 'bird/bird.json', [
  ['translate', [0, -5, 0]],
  ['scale', [0.24, 0.24, 0.24]],
]
load 'material', 'bird/bird_face.png'
load 'material', 'bird/frog_eye.png'
load 'material', 'bird/frog_face.png'
load 'material', 'block.png'
load 'material', 'block2.png'
load 'sfx', 'sfx.json'

module.exports = resources
