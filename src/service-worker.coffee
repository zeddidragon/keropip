if navigator.serviceWorker and not window.isDebug
  unless navigator.serviceWorker.controller
    navigator.serviceWorker.register 'sw.js', scope: './'
