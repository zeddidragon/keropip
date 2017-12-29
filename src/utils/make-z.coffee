LERP_FACTOR = 0.12

map =
  LERP_FACTOR: LERP_FACTOR
  orto: ({z})-> 0
  hex: ({x, y}) -> y - x
  snap: (state, pos) ->
    pos.z = map[state.level.mode] pos
  lerp: (state, pos) ->
    target = map[state.level.mode] pos
    pos.z = THREE.Math.lerp pos.z, target, 0.24

module.exports = map
