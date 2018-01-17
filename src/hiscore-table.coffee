classes = ['level', 'score', 'undo']

devScores = [
  12
  22
  31
  29
  54
  59
  14
  151
  75
  43
  16
  11
  22
  17
  77
  41
  55
  46
  22
  179
  78
  61
  41
  112
  129
  372
]

generateTable = ->
  body = document.getElementById 'hiscores-body'
  body.innerHTML = ''
  for i in [1..26]
    score = +localStorage["hiscores.#{i}"]
    par = devScores[i - 1] or Infinity
    row = [
      i
      score
      localStorage["hiscores.undos.#{i}"]
      par
    ]
    rowNode = document.createElement 'tr'
    if (score or Infinity) <= par
      rowNode.classList.add 'par'
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

module.exports = generateTable
