avatar = require './avatar'

class Entity
  constructor: (@x, @y) ->
    @avatar = null
    @type = null
    @warp = null
    @moving = false

  start: (state, action) ->
    {toX: @x, toY: @y} = action
    @avatar?.start state, action

  stop: (state, action) ->
    @avatar?.stop state, action

  move: (state) ->
    @avatar?.move state

  update: (state) ->
    @avatar?.update state

noop = ->

recipes =
  '@': noop
  'B': noop
  '!': noop
  H: (entity) -> entity.warp = 'hex'
  O: (entity) -> entity.warp = 'orto'
  D: (entity) -> entity.warp = 'diag'
  J: (entity) -> entity.warp = 'jump'
  S: (entity) -> entity.warp = 'skip'

module.exports = (char, x, y) ->
  return unless recipes[char]
  entity = new Entity x, y
  entity.type = char
  entity.avatar = avatar char, entity
  recipes[char] entity
  entity
