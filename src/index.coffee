require('colors')
cloneDeep = require('lodash/cloneDeep')

global.puts = console.log.bind console
inspect = (x) -> puts x; x

player = (x, y) ->
  x: x
  y: y
  sign: '@'.green
  priority: 1
  type: 'player'

goal = (x, y) ->
  x: x
  y: y
  sign: '!'.yellow
  priority: 0
  type: 'goal'

hexPad = (x, y) ->
  x: x
  y: y
  sign: 'H'.cyan
  priority: 0
  type: 'hex-pad'

render = (map) ->
  display = cloneDeep map.tiles
  for e in map.entities
    display[e.y][e.x] = e.sign
  str = display
    .map (row) -> row.join ''
    .join '\n'
    .replace /\./g, '.'.gray
  puts '\x1Bc' + str

entity = (char, x, y) ->
  type =
    switch char
      when '@' then player
      when '!' then goal
      when 'H' then hexPad
  type? x, y

level = (parts) ->
  entities = []

  tiles = parts
    .join "\n"
    .trim()
    .split "\n"
    .map (str) -> str.trim().split ""
    .map (row, j) ->
      row.map (char, i) ->
        e = entity char, i, j
        if e
          entities.push e
          '.'
        else
          char

  width: tiles[0].length
  height: tiles.length
  entities: entities
  tiles: tiles

level1 = level'
  **************\n
  *......*..!..*\n
  *..@...****.**\n
  *.........**.*\n
  *.......H....*\n
  **************\n
'

render level1
