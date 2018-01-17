if navigator.serviceWorker and not window.isDebug
  if navigator.serviceWorker.controller
    navigator.serviceWorker.controller.postMessage 'check-ready'
  else
    navigator.serviceWorker.register 'sw.js', scope: './'
    
  navigator.serviceWorker.addEventListener 'message', (event) ->
    document
      .getElementById 'sw-status'
      ?.classList.add 'ready'

