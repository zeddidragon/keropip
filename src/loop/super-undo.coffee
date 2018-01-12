undo = require './undo'

superUndo = (state) ->
  loop
    turn = undo state
    break if not turn or turn.length > 1
  state.nextPhase or= 'idle'
  return

module.exports = superUndo
