validMoves = require '../utils/valid-moves'

module.exports =
  class TouchInput
    constructor: ->
      @geometry = resources.geometry.block
      @material = resources.material.highlight_block
      @blocks = []
      @touch = false
      @x = 0
      @y = 0

    init: ({element}) ->
      @onTouch = (event) =>
        touch = event.changedTouches?[0] or event
        @touch = true
        @x = event.x
        @y = event.y
        console.log('touched',  x: @x, y: @y)
      element.addEventListener 'click', @onTouch
      element.addEventListener 'touchstart', @onTouch

    deinit: ({element}) ->
      element.removeEventListener 'click', @onTouch
      element.removeEventListener 'touchstart', @onTouch
