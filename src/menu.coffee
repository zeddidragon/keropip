toggleMute = require './bgm'
currentLevel = require './utils/current-level'
{setControls} = require './entities/keyboard-input'

DEBUG = false
menuList = document.getElementById 'menu-list'

document
  .getElementById 'credits'
  .addEventListener 'click', ->
    document
      .getElementById 'credits-check'
      .checked = false

toggleAttribute = (element, attribute, value) ->
  if value
    element.setAttribute attribute, value
  else
    element.removeAttribute attribute
  return

selectedValue = (namespace, opts={}) ->
  '' + (
    opts.value or
    localStorage[opts.key or "settings.#{namespace}"] or
    opts.default or
    ''
  )

makeRadios = (namespace, items, opts={}) ->
  value = selectedValue namespace, opts
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
  value = selectedValue namespace, opts
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
    label: 'Bgm &#x1f50a;'
    value: 'false'
  ,
    label: 'Mute &#x1f507;'
    value: 'true'
  ],
  default: 'false'

makeItem 'radio', 'fullscreen', [
    label: 'Full &#x26f6;'
    value: 'true'
  ,
    label: 'Win &#x1f5d6;'
    value: 'false'
  ],
  default: 'false'

makeItem 'radio', 'controls', [
    label: 'Qwerty'
    value: 'qwerty'
  ,
    label: 'Dvorak'
    value: 'dvorak'
  ],
  default: 'qwerty'

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
  return

makeItem 'select', 'level', levels,
  key: 'level'
  value: currentLevel()
  default: 1

setLevel = (value) ->
  closeMenu()
  $state?.despawn +value

setFullscreen = (value) ->
  localStorage['settings.fullscreen'] = value
  $state?.setFullscreen value is 'true'

document
  .getElementById 'restart'
  .addEventListener 'click', ->
    $state.restart()
    closeMenu()

functions =
  mute: toggleMute.setMute
  level: setLevel
  controls: setControls
  fullscreen: setFullscreen
  updateLevelSelector: updateLevelSelector

if localStorage['settings.fullscreen'] is 'true'
  initialFullscreen = ->
    setFullscreen 'true'
    document.removeEventListener 'click', initialFullscreen
  document.addEventListener 'click', initialFullscreen

closeMenu = ->
  for el in document.querySelectorAll '.dropdown-check' when el.checked
    el.checked = false
  return

window.addEventListener 'keydown', (e) ->
  return unless $state
  switch e.key.toLowerCase()
    when 'backspace'
      e.preventDefault()
      closeMenu()
      $state.restart()
    when 'n'
      return unless DEBUG
      closeMenu()
      $state.next()
    when 'u' then $state.undo()
    when 'i' then $state.invalidate()
    when 'm'
      toggleMute()
      muted = localStorage['settings.mute']
      document
        .querySelector "[name=mute][value=#{muted}]"
        .checked = true

module.exports = functions
