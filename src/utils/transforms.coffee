module.exports =
  hex: (vec) ->
    vec.x += vec.y * 0.5
    vec
  diag: (vec) ->
    if vec.x is vec.y
      vec.x = 0
    else
      vec.y = 0
    vec
