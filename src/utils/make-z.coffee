LERP_FACTOR = 0.12

map =
  LERP_FACTOR: LERP_FACTOR
  orto: ({z})-> 0
  hex: ({x, y}) -> y - x
  diagOdd: ({x, y}) -> Math.abs(x + y) % 2
  diagEven: ({x, y}) -> 1 - Math.abs(x + y) % 2
  snap: (state, pos) ->
    pos.z = map[state.level.mode] pos
  lerp: (state, pos) ->
    target = map[state.level.mode] pos
    pos.z = THREE.Math.lerp pos.z, target, 0.24

module.exports = map
