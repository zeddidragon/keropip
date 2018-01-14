{setMute} = require './bgm'
currentLevel = require './utils/current-level'
{setControls} = require './entities/keyboard-input'

menuList = document.getElementById 'menu-list'

toggleAttribute = (element, attribute, value) ->
  if value
    element.setAttribute attribute, value
  else
    element.removeAttribute attribute
  return

makeRadios = (namespace, items, opts={}) ->
  value = localStorage[opts.key or "settings.#{namespace}"]
  for item in items
    label = document.createElement 'label'
    label.innerHTML = item.label
    box = document.createElement 'input'
    box.type = 'radio'
    box.name = namespace
    box.value = item.value
    box.checked = true if value is item.value
    label.appendChild box
    box.addEventListener 'change', ({target}) ->
      functions[namespace]? target.value
    label

makeSelect = (namespace, items, opts={}) ->
  container = document.createElement 'select'
  value = '' + opts.value or localStorage[opts.key or "settings.#{namespace}"]
  container.addEventListener 'change', ({target}) ->
    functions[namespace]? target.value
  for item in items
    option = document.createElement 'option'
    option.innerHTML = item.label or item.value or item
    option.value = item.value or item.label or item
    toggleAttribute option, 'selected', value is '' + option.value
    toggleAttribute option, 'disabled', item.disabled
    option.dataset.namespace = namespace
    container.appendChild option
  container

inputTypes =
  radio: makeRadios
  select: makeSelect

makeItem = (type, namespace, items, opts={}) ->
  elements = inputTypes[type] namespace, items, opts
  listItem = document.createElement 'li'
  elements = [elements] unless Array.isArray elements
  listItem.appendChild el for el in elements
  menuList.appendChild listItem
  return

makeItem 'radio', 'mute', [
    label: '&#x1f50a;'
    value: 'false'
  ,
    label: '&#x1f507;'
    value: 'true'
  ]

makeItem 'radio', 'controls', [
    label: 'QWERTY'
    value: 'qwerty'
  ,
    label: 'DVORAK'
    value: 'dvorak'
  ]

maxLevel = Math.max 1, localStorage.level or 0
levels =
  for i in [1..26]
    label: "Level #{i}"
    value: i
    disabled: i > maxLevel

updateLevelSelector = (num) ->
  num = +num or 0
  localStorage.level = Math.max maxLevel, num
  maxLevel = +localStorage.level or 0
  for el in document.querySelectorAll '[data-namespace=level]'
    toggleAttribute el, 'selected', el.value is num + ''
    toggleAttribute el, 'disabled', el.value > maxLevel
  window.history.pushState {}, null, "?level=#{num}"
  return

makeItem 'select', 'level', levels,
  key: 'level'
  value: currentLevel()

setLevel = (value) ->
  $state?.despawn +value

functions =
  mute: setMute
  level: setLevel
  controls: setControls
  updateLevelSelector: updateLevelSelector

module.exports = functions
