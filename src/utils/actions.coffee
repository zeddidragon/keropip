special =
  u: 'undo'
  i: 'invalidate'
  tab: 'zoom'
  space: 'peek'

actions = Object
  .keys special
  .map (k) -> special[k]

module.exports = {special, actions}
