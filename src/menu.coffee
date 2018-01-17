toggleMute = require './bgm'
currentLevel = require './utils/current-level'
{setControls} = require './entities/keyboard-input'
require './hiscore-table'

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

makeCheckbox = (namespace, item) ->
  value = selectedValue namespace, item
  label = document.createElement 'label'
  label.innerHTML = item.label
  box = document.createElement 'input'
  box.type = 'checkbox'
  box.name = namespace
  box.checked = value is true or value is 'true'
  label.appendChild box
  box.addEventListener 'change', ({target}) ->
    val = if target.checked then 'true' else 'false'
    functions[namespace]? val
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

makeSlider = (namespace, item) ->
  value = selectedValue namespace, item
  label = document.createElement 'label'
  label.innerHTML = item.label
  slider = document.createElement 'input'
  slider.type = 'range'
  slider.name = namespace
  slider.value = value || 0
  label.appendChild slider
  slider.addEventListener 'change', ({target}) ->
    functions[namespace]? target.value
  label

inputTypes =
  radio: makeRadios
  select: makeSelect
  toggle: makeCheckbox
  slider: makeSlider

makeItem = (type, namespace, items, opts={}) ->
  elements = inputTypes[type] namespace, items, opts
  listItem = document.createElement 'li'
  elements = [elements] unless Array.isArray elements
  listItem.appendChild el for el in elements
  menuList.appendChild listItem
  return

makeItem 'toggle', 'mute',
  label: 'Mute BGM &#x1f39c;'
  default: 'false'

makeItem 'toggle', 'mutesfx',
  label: 'Mute SFX &#x1f507;'
  default: 'false'

makeItem 'toggle', 'fullscreen',
  label: 'Fullscreen &#x26f6;'
  default: 'false'

makeItem 'toggle', 'labels',
  label: 'Labels &#x1f3f7;'
  default: 'false'

makeItem 'radio', 'controls', [
    label: 'Qwerty'
    value: 'qwerty'
  ,
    label: 'Dvorak'
    value: 'dvorak'
  ],
  default: 'qwerty'

makeItem 'slider', 'speed',
  label: 'Speed'
  default: 0

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

setLabels = (value) ->
  localStorage['settings.labels'] = value
  if value is 'true'
    document.body.classList.add 'show-labels'
  else
    document.body.classList.remove 'show-labels'

setLabels 'true' if localStorage['settings.labels'] is 'true'

setSpeed = (value) ->
  localStorage['settings.speed'] = value
  $state?.speed = 1 + +value / 100

muteSfx = (value) ->
  localStorage['settings.mutesfx'] = value

functions =
  mute: toggleMute.setMute
  mutesfx: muteSfx
  level: setLevel
  controls: setControls
  fullscreen: setFullscreen
  labels: setLabels
  speed: setSpeed
  updateLevelSelector: updateLevelSelector

if localStorage['settings.fullscreen'] is 'true'
  document
    .querySelector '[name=fullscreen]'
    .checked = true
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
      return unless window.isDebug
      closeMenu()
      $state.next()
    when 'm'
      toggleMute()
      muted = localStorage['settings.mute'] is 'true'
      document
        .querySelector "[name=mute]"
        .checked = muted

module.exports = functions
