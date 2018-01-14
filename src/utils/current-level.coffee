currentLevel = ->
  if location.search
    [key, num] = location
      .search
      .slice 1
      .split '&'
      .map (str) -> str.split '='
      .find ([key, val]) -> key is 'level'
    window.history.replaceState {}, null, location.pathname
  +num or localStorage.level or 1

module.exports = currentLevel
