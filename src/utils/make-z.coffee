LERP_FACTOR = 0.12

map =
  LERP_FACTOR: LERP_FACTOR
  orto: ->
    0
  hex: (state, {x, y}) ->
    y - x
  diag: (state, {x, y}) ->
    -(Math.abs(x + y) % 2)
  jump: ({player}, {x, y}) ->
    # https://stackoverflow.com/a/35968663
    x = Math.abs x - player.x
    y = Math.abs y + player.y
    [x, y] = [y, x] if y < x

    special = specialCases[x]?[y]

    # Special case
    z =
      if special?
        special
      # Vertical case
      else if y >= x * 2
        col = Math.abs 1 - x
        row = y - 2 * col - 2
        row % 4 + col + 1 + 2 *Math.floor row / 4
      # Secondary diagonal
      else if (x - y) % 2
        1 + 2 * Math.floor ((x + y) / 2 + 1) / 3
      # Primary diagonal
      else
        2 * Math.floor ((x + y) / 2 + 2) / 3

    -0.6 * z
  skip: ({player}, {x, y}) ->
    x = Math.abs x - player.x
    y = Math.abs y + player.y
    -(x % 2 or y % 2)
  snap: (state, pos) ->
    pos.z = map[state.level.mode] state, pos
  lerp: (state, pos) ->
    target = map[state.level.mode] state, pos
    pos.z = THREE.Math.lerp pos.z, target, 0.24

module.exports = map

specialCases =
  0:
    0: 0
    1: 3
    2: 2
    3: 3
  1: 1: 2
  2: 2: 4
  3: 3: 2
