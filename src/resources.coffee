bgmNode = document.getElementById 'bgm'

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
    hex_pad: new THREE.CylinderGeometry 0.4, 0.4, 0.1, 6
    orto_pad: new THREE.BoxGeometry 0.5, 0.5, 0.5
    diag_pad: new THREE.TetrahedronGeometry 0.5
    jump_pad: do ->
      z = new THREE.BoxGeometry 0.2, 0.2, 0.2
      line = z.clone()
      tmpMat.makeTranslation -0.2, 0.2, 0
      z.applyMatrix tmpMat
      tmpMat.makeTranslation 0.2, -0.2, 0
      line.applyMatrix tmpMat
      z.merge line
      line = new THREE.BoxGeometry 0.2, 0.6, 0.2
      z.merge line
      z
    skip_pad: do ->
      cross = new THREE.BoxGeometry 0.2, 0.2, 0.8
      vertical = new THREE.BoxGeometry 0.8, 0.2, 0.2
      cross.merge vertical
      cross
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
      wireframe: true
    orto_pad: new THREE.MeshBasicMaterial
      color: 0xff6666
      wireframe: true
    diag_pad: new THREE.MeshBasicMaterial
      color: 0xffff66
      wireframe: true
    jump_pad: new THREE.MeshBasicMaterial
      color: 0xff66ff
      wireframe: true
    skip_pad: new THREE.MeshBasicMaterial
      color: 0x66ff66
      wireframe: true
    goal: new THREE.MeshBasicMaterial
      color: 0xf0e68c
    highlight_block: new THREE.MeshBasicMaterial
      color: 0x3355ff
      transparent: true
      opacity: 0.3
      depthWrite: false
    highlight_block_bad: new THREE.MeshBasicMaterial
      color: 0xff5533
      transparent: true
      opacity: 0.3
      depthWrite: false
    box: new THREE.MeshBasicMaterial color: 0xdada33
    box_disabled: new THREE.MeshBasicMaterial color: 0xaaaaaa

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

load = (type, path, opts={}) ->
  ++loadCounter
  loaders[type].load "assets/" + path, (obj) ->
    name = path
      .split '/'
      .pop()
      .split '.'
      .shift()
    if type is 'material'
      if opts.pixelated
        obj.minFilter = THREE.LinearMipMapFilter
        obj.magFilter = THREE.NearestFilter
      args = Object.assign {}, opts.material, map: obj
      obj = new THREE.MeshBasicMaterial args
    for [transform, args] in (opts.transforms or [])
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

load 'geometry', 'bird/bird.json', transforms: [
  ['translate', [0, -5, 0]],
  ['scale', [0.24, 0.24, 0.24]],
]
load 'material', 'bird/bird_face.png'
load 'material', 'bird/frog_eye.png'
load 'material', 'bird/frog_face.png'
load 'material', 'block.png'
load 'material', 'block2.png'
load 'material', 'block-fade.png',
  material:
    color: 0x484848
load 'material', 'letters.png',
  pixelated: true
  material: transparent: true
load 'sfx', 'sfx.json'

letters = 'zxc\nasd\nqwe'
  .split '\n'
  .map (row) -> row.split ''
for row, j in letters
  y = 1/3 * j
  y2 = y + 1/3
  for c, i in row
    x = 1/3 * i
    x2 = x + 1/3

    size = 0.2

    quad = new THREE.Geometry
    quad.vertices.push new THREE.Vector3 -size, -size, 0
    quad.vertices.push new THREE.Vector3  size, -size, 0
    quad.vertices.push new THREE.Vector3 -size,  size, 0
    quad.vertices.push new THREE.Vector3  size,  size, 0

    quad.faces.push new THREE.Face3 0, 1, 2
    quad.faces.push new THREE.Face3 1, 3, 2

    quad.faceVertexUvs[0].push [
      new THREE.Vector2 x, y
      new THREE.Vector2 x2, y
      new THREE.Vector2 x, y2
    ]
    quad.faceVertexUvs[0].push [
      new THREE.Vector2 x2, y
      new THREE.Vector2 x2, y2
      new THREE.Vector2 x, y2
    ]

    resources.geometry[c] = quad

module.exports = resources
