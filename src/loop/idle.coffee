validMoves = require '../utils/valid-moves'
{actions} = require '../utils/actions'

makeMove = (moved, move) ->
  name: if moved.type is '@' then 'move' else 'push'
  entity: moved
  fromX: moved.x
  fromY: moved.y
  toX: moved.x + move.x
  toY: moved.y + move.y

idle = (state)->
  {input, level, player, sfx} = state
  for action in actions when input[action]
    state.nextPhase = action
    return state
  attempted = input.nextMove or input.heldMove
  return state unless attempted

  input.nextMove = null
  move = validMoves[level.mode][attempted]
  return state unless move and level.canMove player, move

  moves = [makeMove player, move]
  entities = level.entitiesAt player.x + move.x, player.y + move.y
  for entity in entities
    if entity.warp and entity.warp isnt level.mode
      moves.push
        name: 'warp'
        from: state.level.mode
        to: entity.warp
    else if entity.type is 'B'
      x = entity.x + move.x
      y = entity.y + move.y
      tile = level.tileAt x, y
      return state if tile is '#' or level.entityAt x, y, 'B'
      moves.push makeMove entity, move
      if tile is ' ' or not tile
        moves.push
          name: 'settle'
          entity: entity
    else if entity.type is '!'
      moves.push
        name: 'goal'

  sfx "sweep#{4 * Math.random() | 1}"

  state.turns.push moves
  state.nextPhase = 'start'
  state

module.exports = idle
