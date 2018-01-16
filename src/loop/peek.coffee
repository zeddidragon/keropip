peek = (state) ->
  {input} = state
  unless input.peek
    state.nextPhase = 'idle'
  return state

module.exports = peek
