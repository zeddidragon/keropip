bgmNode = document.getElementById 'bgm'

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
    box.checked = true if item.checked
    label.appendChild box
    container.appendChild label
    box.addEventListener 'change', ({target}) ->
      functions[target.name]? target.value
  menuList.appendChild container

makeMenu 'mute', [
    label: '&#x1f50a;'
    value: 'false'
    checked: true
  ,
    label: '&#x1f507;'
    value: 'true'
  ]

makeMenu 'control-layout', [
    label: 'QWERTY'
    value: 'qwerty'
    checked: true
  ,
    label: 'DVORAK'
    value: 'dvorak'
  ]

setMute = (value) ->
  document.removeEventListener 'click', initialPlay if initialPlay
  muted = value is 'true'
  localStorage.muted = muted
  if muted
    bgmNode.pause()
  else
    bgmNode.play()
  return

functions =
  mute: setMute

if localStorage.muted is 'true'
  setMute 'true'
  document
    .querySelector '[name=mute][value=true]'
    .checked = true
else
  initialPlay = ->
    bgmNode.play()
    document.removeEventListener 'click', initialPlay

document.addEventListener 'click', initialPlay
