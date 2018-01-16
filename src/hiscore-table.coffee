classes = ['level', 'score', 'undo']

generateTable = ->
  body = document.getElementById 'hiscores-body'
  body.innerHTML = ''
  for i in [1..26]
    row = [
      i
      localStorage["hiscores.#{i}"]
      localStorage["hiscores.undos.#{i}"]
    ]
    rowNode = document.createElement 'tr'
    for cell, i in row
      node = document.createElement 'td'
      node.textContent = cell if cell
      node.classList.add classes[i]
      node.classList.add 'zero' if cell and not +cell
      rowNode.appendChild node
    body.appendChild rowNode
  return

document
  .getElementById 'hiscore-check'
  .addEventListener 'change', ({target}) ->
    generateTable() if target.checked

document
  .getElementById 'hiscores'
  .addEventListener 'click', ->
    document
      .getElementById 'hiscore-check'
      .checked = false
