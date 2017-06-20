var express = require('express')
var proxy = require('http-proxy-middleware')

var app = express()

var proxyTable = {
  target: 'https://www.mycolordiary.com',
  changeOrigin: true,
  pathRewrite: {
    '^/s/api': '/s/api'
  }
}

app.use('/s/api', proxy(proxyTable))
app.use(express.static(__dirname))

app.listen(3000, function () {
  console.log('server is running at 3000')
})
