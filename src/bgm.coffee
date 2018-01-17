bgmNode = document.getElementById 'bgm'
bgmNode.volume = localStorage['settings.volumebgm'] / 100 or 0.5

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

setVolume = (value) ->
  localStorage['settings.volumebgm'] = value
  bgmNode.volume = value / 100

if localStorage['settings.mute'] is 'true'
  setMute 'true'
else
  initialPlay = ->
    bgmNode.play()
    document.removeEventListener 'click', initialPlay

document.addEventListener 'click', initialPlay

toggleMute.setMute = setMute
toggleMute.setVolume = setVolume

module.exports = toggleMute
