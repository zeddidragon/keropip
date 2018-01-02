module.exports =
  hex: (state, vec) ->
    vec.x += vec.y * 0.5
    vec
  diag: (state, vec) ->
    if vec.x is vec.y
      vec.x = 0
    else
      vec.y = 0
    vec
  jump: (state, vec) ->
    vec.applyMatrix4 state.camera.matrix
