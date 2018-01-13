undo = require './undo'

superUndo = (state) ->
  loop
    turn = undo state
    break if not turn or turn.length > 1
  state.sfx.play 'rewind' if state.nextPhase isnt 'idle'
  return

module.exports = superUndo
