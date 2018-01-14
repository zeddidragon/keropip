{setControls} = require './entities/keyboard-input'
{setMute} = require './bgm'

menuList = document.getElementById 'menu-list'

makeMenu = (namespace, items) ->
  container = document.createElement 'li'
  for item in items
    label = document.createElement 'label'
    label.innerHTML = item.label
    box = document.createElement 'input'
    box.type = 'radio'
    box.name = namespace
    box.value = item.value
    box.checked = true if localStorage["settings.#{namespace}"] is item.value
    label.appendChild box
    container.appendChild label
    box.addEventListener 'change', ({target}) ->
      functions[target.name]? target.value
  menuList.appendChild container

makeMenu 'mute', [
    label: '&#x1f50a;'
    value: 'false'
  ,
    label: '&#x1f507;'
    value: 'true'
  ]

makeMenu 'controls', [
    label: 'QWERTY'
    value: 'qwerty'
  ,
    label: 'DVORAK'
    value: 'dvorak'
  ]


functions =
  mute: setMute
  controls: setControls

module.exports = functions
