var express = require('express')
var proxy = require('http-proxy-middleware')

var app = express()

var proxyTable = {
  target: 'https://test.mycolordiary.com',
  changeOrigin: true,
  pathRewrite: {
    '^/s/api': '/s/api',
    '^/print/api': '/print/api'
  }
}

app.use('/s/api', proxy(proxyTable))
app.use(express.static(__dirname))

app.listen(4000, function () {
  console.log('server is running at 4000')
})
