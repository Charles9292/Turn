(function() {
  var Functional = {
      start: function() {
        if (!mis) {
          this.initContainerMis()
          this.preview(mis)
        } else {
          this.initContainerUser() // 初始化容器大小
          this.preview()
        }
        this.initEvent() // 初始化事件
      },
      cdnUrl: function() {
        var url = ''
        location.href.indexOf('www') != -1 ? url = '//cdn..com' : url = '//test..com'
        return url
      },
      initContainerUser: function() {
        $('#book-zoom').css('height', 350 * 1.6348)
      },
      initContainerMis: function() {
        this.initContainerUser()
        $('.front, .later').css('display', 'block').addClass('describe')
        $('#txtFront, #txtLater').css('display', 'block')
        $('#book-zoom').addClass('describe')
        $('.turnjs-slider').css({
          'float': 'left',
          'margin-left': '400px'
        })
        $('#canvas').css({
          'width': '1450px',
          'margin': '0 auto'
        })
        $('.editor').css('display', 'table').addClass('describe')
        $('#share, .share, #download').css('display', 'none')
        $('#rightPage, #leftPage').css('right', '-59%')
      },
      preview: function(mis) {
        var params = {}
        // mis = true
        if (!mis) {
          params = {
            
            _mis: 1,
            bookId: bookId
          }
        } else {
          params = {
            
            bookId: bookId
          }
        }
        $.get('/s/api', params, function(data) {
          if (data.err == 'ok') {
            Functional.initBook(data.res)
          } else {
            console.log(data.err)
          }
        })
      },
      previewPage: function(pageContent) {
        return promise = new Promise(function(res, rej) {
          $.post('/s/api', {
            pageContent: JSON.stringify(pageContent),
            bookId: bookId
          }, function(data) {
            if (data.err == 'ok') {
              res(data)
            } else {
              rej(data.err)
            }
          })
        })
      },
      initEvent: function() { // 初始化事件
        var hidden = false
        $('#modify').click(function() {
          $('.lay').css('display') == 'block' ? $('.lay').css('display', 'none') : ''
        })
        $('#save').click(function() {
          $('.lay').css('display') == 'none' ? $('.lay').css('display', 'block') : ''
        })
        $('#share').socialShare({
          url: location.href,
          title: Variable.doc.title,
          content: '',
          pic: ''
        })
        $('#share').click(function() {
          if (hidden) {
            $('.share').fadeIn()
            hidden = false
          } else {
            $('.share').fadeOut()
            hidden = true
          }
        })

        $('div').bind("selectstart", function() {
          return false
        })
      },
      initBook: function(data) {
        var Pages, Type // 偶数页为2, 奇数页为1
        Book = $('.sample-docs')
        Width = 700
        if (data.pageNum % 2 == 0) {
          Pages = data.pageNum + 4
          Type = 2
        } else {
          Pages = data.pageNum + 3
          Type = 1
        }

        Book.turn({
          width: Width,
          height: Width / 2 * 1.6348,
          pages: Pages,
          autoCenter: true,
          gradients: true,
          duration: 1000,
          elevation: 50,
          when: {
            missing: function(e, pages) {
              for (var i = 0, len = pages.length; i < len; i++) {
                var dataNumber, item = pages[i]
                // 为了保证翻页效果: 奇数页加三页空白页(2, 4, 倒数第2), 偶数页加四页(2, 4, 倒数第2, 倒数第3)
                // 奇数页: 绘制第三页实际请求第二页数据, 第5页至倒数第3页实际请求数据要减去2, 最后一页实际请求数据要减3页空白页
                // 偶数页: 绘制第三页实际请求第二页数据, 第5页至倒数第4页实际请求数据要减去2, 最后一页实际请求数据要减4页空白页
                if (Type == 1) { // 奇
                  if (item == 2 || item == 4 || item == Pages - 1) {
                    Functional.addBlankEle({
                      book: Book,
                      page: item,
                      pages: Pages
                    })
                  } else {
                    if (item == 3) {
                      dataNumber = 2
                    } else if (item >= 5 && item < Pages - 1) {
                      dataNumber = item - 2
                    } else if (item == Pages) {
                      dataNumber = item - 3
                    } else {
                      dataNumber = item
                    }
                    // (Book)容器, (dataNumber)实际请求数据编号, Pages(总页数), data.pages(书整体机构), item(实际绘制页码)
                    Functional.addEle({
                      book: Book, 
                      page: dataNumber, 
                      pages: Pages, 
                      data: data.pages, 
                      i: item
                    })
                  }
                } else { // 偶
                  if (item == 2 || item == 4 || item == Pages - 1 || item == Pages - 2) {
                    Functional.addBlankEle({
                      book: Book, 
                      page: item, 
                      pages: Pages
                    })
                  } else {
                    if (item == 3) {
                      dataNumber = 2
                    } else if (item >= 5 && item < Pages - 2) {
                      dataNumber = item - 2
                    } else if (item == Pages) {
                      dataNumber = item - 4
                    } else {
                      dataNumber = item
                    }
                    Functional.addEle({
                      book: Book, 
                      page: dataNumber, 
                      pages: Pages, 
                      data: data.pages, 
                      i: item
                    })
                  }
                }
              }
            },
            turned: function(e, page, view) {
              var book = $(this)
              $('#slider').slider('value', Functional.setSliderNumber(page))
              Functional.setPreview($('#slider').slider('value'))
              Functional.updatePreview(Type, Pages, view, data)
            }
          }
        })
        $('#book-zoom').css({
          'background-color': 'transparent',
          'padding-top': 0
        }).find('.loader').remove()
        $('.sample-docs').css('display', 'block')

        $("#slider").slider({
          min: 1,
          max: 100,
          start: function(event, ui) {

          },

          slide: function(event, ui) {
            Functional.setPreview(ui.value)
          },

          stop: function(event, ui) {
            $('.sample-docs').turn('page', ui.value == 1 ? 1 : (ui.value - 1) * 2)
          }
        })

        $('#slider').slider('option', 'max', Functional.setSliderMax(Book))

        var thumbPreview = $('<div />', {
          'id': 'pageNumber',
          'html': '封面'
        })
        $('#slider a').append(thumbPreview)

        $(document).keydown(function(e) {
          var previous = 37,
            next = 39
          switch (e.keyCode) {
            case previous:
              $('.sample-docs').turn('previous')
              break
            case next:
              $('.sample-docs').turn('next')
              break
          }
        })

        Book.addClass('animated')

        $('#leftPage').click(function() {
          Book.turn('next')
        })

        $('#rightPage').click(function() {
          Book.turn('previous')
        })
      },
      backDiv: function(page, Pages) {
        var element = $('<div />').css({
          'width': 350,
          'height': 350 * 1.6348,
          'background': '#fff',
          'position': 'relative'
        }).append('<div class="lay"></div>')
        if (page == 1 || page == 2 || page == Pages || page == Pages - 1) element.addClass('hard')

        if (page != 1 && page != Pages) element.append('<div class="gradient"></div>')
        return element
      },
      addBlankEle: function(params) {
        var element = Functional.backDiv(params.page, params.pages)
        params.book.turn('addPage', element, params.page)
      },
      updatePreview: function(Type, Pages, view, data) {
        // dataNumber(实际需要的数据页码)
        var dataNumber, page, htmlL, htmlR,
          front = $('.front'),
          later = $('.later'),
          txtFront = $('#txtFront'),
          txtLater = $('#txtLater')
        // 封面的时候 view 会返回 [0, 1] 扉页返回 [1, 2] 但是封面是需要view[1] 其他情况需要view[0]
        view[1] == 0 ? page = view[0] : page = view[1]
        if (Type == 1) { // 奇
          if (page >= 5 && page <= Pages - 1) {
            dataNumber = page - 2
          } else {
            front.html('')
            later.html('')
            txtFront.html('')
            txtLater.html('')
            return
          }
        } else { // 偶
          if (page >= 5 && page < Pages - 2) {
            dataNumber = page - 2
          } else {
            front.html('')
            later.html('')
            txtFront.html('')
            txtLater.html('')
            return
          }
        }

        if (!data.pages[dataNumber - 1].pageDiaryPreview) {
          htmlR = ''
        } else {
          htmlR = '<a href="' + Variable.cdn + '/s/img/' + data.pages[dataNumber - 1].pageDiaryPreview + '" target="_blank"> \
                    <img src="' + Variable.cdn + '/s/img/' + data.pages[dataNumber - 1].pageDiaryPreview + '" class="aBlock"> \
                  </a>'
        }

        if (!data.pages[dataNumber - 2].pageDiaryPreview) {
          htmlL = ''
        } else {
          htmlL = '<a href="' + Variable.cdn + '/s/img/' + data.pages[dataNumber - 2].pageDiaryPreview + '" target="_blank"> \
                    <img src="' + Variable.cdn + '/s/img/' + data.pages[dataNumber - 2].pageDiaryPreview + '" class="aBlock"> \
                  </a>'
        }

        front.html(htmlL)
        later.html(htmlR)
        txtFront.html(data.pages[dataNumber - 2].pageDiary)
        txtLater.html(data.pages[dataNumber - 1].pageDiary)
      },
      addEle: function(params) { // (Book)容器, (page)实际请求数据编号, pages(总页数), data(书整体机构), i(实际绘制页码)
        var element = this.backDiv(params.i, params.pages)
        params.book.turn('addPage', element, params.i)
        this.previewPage(params.data[params.page - 1]).then(function(singleData) {
          var isDisposeLacePen = false,
            bookWidth = 700 / 2,
            bookHeight = bookWidth * 1.6348,
            contentJson = singleData.res.contentJson,
            promiseArr = [],
            layerArr = [],
            canvasHeight,
            canvasWidth
          Variable.stepCounter[params.i] = 0

          if (!contentJson.hasOwnProperty('sys')) contentJson.datas.some(function(item) {
            if (item.hasOwnProperty('mImagePath')) {
              isDisposeLacePen = true
              return true
            }
          })

          if (contentJson.totalHeight == 1.6348) {
            canvasWidth = bookWidth
            canvasHeight = bookHeight
            element.append('<canvas id="c' + params.i + '" width="' + canvasWidth + '" height="' + canvasHeight + '"></canvas>')
          } else if (contentJson.totalHeight < 1.6348) {
            canvasWidth = bookWidth
            canvasHeight = canvasWidth * contentJson.totalHeight
            element.append('<div style="width: ' + canvasWidth + 'px;height: ' + canvasHeight + 'px "><canvas id="c' + params.i + '" width="' + canvasWidth + '" height="' + canvasHeight + '"></canvas></div>');
            var paddingTop = (bookHeight - canvasHeight) / 2
            $('#c' + params.i).parent().css('padding-top', paddingTop)
          } else if (contentJson.totalHeight > 1.6348) {
            canvasHeight = bookHeight - 20
            canvasWidth = canvasHeight / contentJson.totalHeight
            canvasHeight = canvasHeight + 10
            element.append('<div style="width: ' + canvasWidth + 'px;height: ' + canvasHeight + 'px; margin: 5px auto 0"><canvas id="c' + params.i + '" width="' + canvasWidth + '" height="' + canvasHeight + '"></canvas></div>');
          }

          if (mis) {
            var c = new fabric.StaticCanvas('c' + params.i)
          } else {
            var c = new fabric.Canvas('c' + params.i)
            c.on({
              'object:modified': function (e) {
                var element = e.target,
                    width = element.width * element.scaleX,
                    height = element.height * element.scaleY
                $.get('', {
                  bookId: bookId,
                  pageDiary: singleData.res.pageDiary,
                  dataId: element.id || 0,
                  xRate: element.left + width / 2,
                  yRate: element.top + height / 2,
                  width: width,
                  height: height
                }, function (data) {

                })
              }
            })
          }
          c.renderOnAddRemove = false
          $('#c' + params.i).css({ position: 'absolute', top: '-9999px' })
          // var start = new Date()
          if (contentJson.diaryBg) {
            if (contentJson.diaryBg.bodyImageSign) new Promise(function(resolve, rej) { // 背景平铺
              fabric.Image.fromURL(Variable.cdn + '/s/img/' + contentJson.diaryBg.bodyImageSign, function(oImg) {
                resolve(oImg)
              })
            }).then(function(oImg) {
              var width = oImg.width
              element.css({
                'width': bookWidth,
                'height': bookWidth * 1.6348,
                'background-image': 'url(' + Variable.cdn + '/s/img/' + contentJson.diaryBg.bodyImageSign + ')',
                'background-size': parseInt(width * element.width() / 1242),
                'background-repeat': 'repeat'
              })
            })

            if (contentJson.diaryBg.backgroundColor) element.css({
              'background-color': contentJson.diaryBg.backgroundColor
            })
          }

          if (contentJson.laces) {
            for (var a = 0, len = contentJson.laces.length; a < len; a++) Functional.drawLaces({
              item: contentJson.laces[a], 
              c: c, 
              book: $('#c' + params.i), 
              promiseArr: promiseArr, 
              layerArr: layerArr, 
              i: params.i, 
              isDisposeLacePen: isDisposeLacePen
            })
          }

          if (contentJson.datas) {
            for (var a = 0, len = contentJson.datas.length; a < len; a++) Functional.drawDatas({
              item: contentJson.datas[a], 
              c: c, 
              book: $('#c' + params.i), 
              promiseArr: promiseArr, 
              layerArr: layerArr, 
              i: params.i
            })
          }
          
          setTimeout(function() {
            if (Variable.stepCounter[params.i] == promiseArr.length) {
              Promise.all(promiseArr).then(function() {
                layerArr.sort(function(a, b) {
                  return a.index - b.index
                })

                for (var a = 0, len = layerArr.length; a < len; a++) {
                  c.moveTo(layerArr[a].img, a)
                }
                c.renderAll()
                
                $('#c' + params.i).css({ top: '0' })
              })
              return
            }
            setTimeout(arguments.callee, 300)
          }, 300)
        })
      },
      drawLaces: function(params) { 
        var standard = params.book.width()
        if (params.item.signs) {
          this.lacePen({
            item: params.item, 
            c: params.c, 
            standard: standard, 
            promiseArr: params.promiseArr, 
            layerArr: params.layerArr, 
            i: params.i, 
            isDisposeLacePen: params.isDisposeLacePen
          })
        } else {
          this.lightPen({
            item: params.item, 
            c: params.c, 
            standard: standard, 
            layerArr: params.layerArr
          })
        }
      },
      lacePen: function(params) {
        var originX = '',
            originY = ''
        if (params.isDisposeLacePen) {
          originX = 'left'
          originY = 'top'
        } else {
          originX = 'center'
          originY = 'center'
        }

        params.item.points.forEach(function(item, i) {
          if (!params.item.index) params.item.index = 0

          i += params.item.index // 第一个绘制的sign都是根据index的值来的

          if (i > (params.item.signs.length - 1)) { // 根据角标i去signs里面找sign,如果没有,就再从第一个sign开始
            i = i % (params.item.signs.length)
          }

          if (!params.item.signs[i]) return

          var promise = new Promise(function(res, rej) {
            var img = new Image()
            Variable.stepCounter[params.i]++
            img.onload = function() {
              res(img)
            }
            img.onerror = function () {
              Variable.stepCounter[params.i]--
            }
            img.src = Variable.cdn + '/s/img/' + params.item.signs[i]
          }).then(function(img) {
            var laceWidth
            if (params.item.laceWidth <= 0.001 || !params.item.laceWidth) {
              laceWidth = .05 * params.standard
            } else {
              laceWidth = params.item.laceWidth * params.standard
            }
            var obj,
              width = laceWidth,
              height = width / (img.width / img.height), // 根据比例求高度
              Img = new fabric.Image(img, {
                originX: originX,
                originY: originY,
                width: Math.round(width),
                height: Math.round(height),
                top: Math.round(item.y * params.standard),
                left: Math.round(item.x * params.standard)
              })
            params.c.add(Img)
            obj = Functional.adjustment(params.c, Img, -50)
            params.layerArr.push(obj)
            params.promiseArr.push(promise)
          })
        })
      },
      lightPen: function(params) {
        var txt = '',
            lineWidth = 0
        if (params.item.laceWidth <= 1) {
          lineWidth = params.item.laceWidth
          lineWidth *= params.standard
        } else {
          if (params.item.laceWidth == 16) {
            lineWidth = .05
            lineWidth *= params.standard
          } else {
            lineWidth = params.item.laceWidth
          }
        }
        params.item.points.forEach(function(point, pointI, points) {
          if (pointI % 3 == 0) {
            txt += 'C' + Math.round(point.x * params.standard) + ',' + Math.round(point.y * params.standard)
          } else {
            txt += ',' + Math.round(point.x * params.standard) + ',' + Math.round(point.y * params.standard)
          }
        })
        var str = txt.slice(0, txt.lastIndexOf('C')),
          obj = {},
          path = new fabric.Path(str)
        params.c.add(path.set({
          opacity: params.item.lightPen.lightAlpha, // 线条透明度
          stroke: params.item.lightPen.lightColor, // 颜色
          strokeLineCap: params.item.lightPen.lightShape, // 线头
          strokeWidth: lineWidth, // 线宽
          fill: false, // 填充透明
          strokeLineJoin: 'round' // 交点样式
        }))
        obj = Functional.adjustment(params.c, path, -50)
        params.layerArr.push(obj)
      },
      drawDatas: function(params) { // 绘制每个元素
        if (!params.item.imageSign) return

        if (params.item.imageSign.charAt(0) == '/') return this.drawImageText(params)

        var standard = params.book.width(), // 元素宽高都是以书本宽度为基准
            num = 0
        var promise = new Promise(function(res, rej) {
          var img = new Image()
          Variable.stepCounter[params.i]++
          img.onload = function() {
            res(img)
          }
          img.onerror = function () {
            Variable.stepCounter[params.i]--
          }
          img.src = Variable.cdn + '/s/img/' + params.item.imageSign;
        }).then(function(img) {
          var imgWidth = params.item.width * standard * params.item.scale,
              imgHeight = params.item.height * standard * params.item.scale
          Variable.signs.forEach(function(item) {
            if (params.item.imageSign == item) {
              var a = img.width / img.height,
                  b = params.item.width / params.item.height
              if (a > b) {
                imgHeight = imgWidth / a
              } else {
                imgWidth = imgHeight * a
              }
            }
          })
          var Img = new fabric.Image(img, {
            originX: 'center',
            originY: 'center',
            width: Math.round(imgWidth),
            height: Math.round(imgHeight),
            top: Math.round(params.item.yRate * standard),
            left: Math.round(params.item.xRate * standard),
            angle: Math.round(params.item.rotate),
          })
          if (params.item.reflectType == 1) {
            Img.setFlipX(true)
          } else if (params.item.reflectType == 2) {
            Img.setFlipY(true)
          }

          params.c.add(Img)
          if (params.item.zIndex < 0) {
            num = params.item.zIndex * 100
          } else {
            num = params.item.zIndex
          }
          var obj = Functional.adjustment(params.c, Img, num)
          params.layerArr.push(obj)
          params.promiseArr.push(promise)
        })
      },
      drawImageText: function(params) { // 绘制文字图片
        var standard = params.book.width(),
            zIndex = 0,
            promise = new Promise(function(res, rej) {
          var img = new Image()
          Variable.stepCounter[params.i]++
          img.onload = function() {
            res(img)
          }
          img.onerror = function () {
            Variable.stepCounter[params.i]--
          }
          img.src = Variable.cdn + params.item.imageSign
        }).then(function(img) {
          var Img = new fabric.Image(img, {
            originX: 'center',
            originY: 'center',
            width: Math.round(params.item.width * standard * params.item.scale),
            height: Math.round(params.item.height * standard * params.item.scale),
            top: Math.round(params.item.yRate * standard),
            left: Math.round(params.item.xRate * standard),
            angle: Math.round(params.item.rotate)
          })
          if (params.item.reflectType == 1) {
            Img.setFlipX(true)
          } else if (params.item.reflectType == 2) {
            Img.setFlipY(true)
          }

          params.c.add(Img)
          if (params.item.zIndex < 0) {
            zIndex = params.item.zIndex * 100
          } else {
            zIndex = params.item.zIndex
          }
          var obj = Functional.adjustment(params.c, Img, zIndex)
          params.layerArr.push(obj)
          params.promiseArr.push(promise)
        })
      },
      adjustment: function(canvas, img, index) {
        var obj = new Object()
        obj.canvas = canvas
        obj.img = img
        obj.index = index
        return obj
      },
      setSliderNumber: function(page) {
        return Math.ceil((page + 1) / 2)
      },
      setSliderMax: function(book) {
        return parseInt(book.turn('pages') / 2 + 1, 10)
      },
      setPreview: function(val) {
        var html = ''
        if (val == 1) {
          html = '封面'
        } else if (val == 2) {
          html = '扉页－' + (val * 2 - 1)
        } else if (val == $('#slider').slider('option', 'max')) {
          html = '封底'
        } else {
          html = ((val - 1) * 2) + '－' + (val * 2 - 1)
        }
        $('#pageNumber').html(html)
      }

    },
    Variable = {
      doc: document,
      stepCounter: {},
      cdn: Functional.cdnUrl(),
      signs: [
        'sijfklsdfkl12312'
      ]
    },
    Warehouse = {}
  Functional.start()
})()
