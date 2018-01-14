bgmNode = document.getElementById 'bgm'

toggleMute = ->
  if localStorage['settings.mute'] is 'true'
    setMute 'false'
  else
    setMute 'true'
  return

setMute = (value) ->
  document.removeEventListener 'click', initialPlay if initialPlay
  muted = value is 'true'
  localStorage['settings.mute'] = muted
  if muted
    bgmNode.pause()
  else
    bgmNode.play()
  return

if localStorage['settings.mute'] is 'true'
  setMute 'true'
else
  initialPlay = ->
    bgmNode.play()
    document.removeEventListener 'click', initialPlay

document.addEventListener 'click', initialPlay

toggleMute.setMute = setMute

module.exports = toggleMute
