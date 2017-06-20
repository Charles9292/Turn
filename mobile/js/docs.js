function initContainer() {
  var height = document.body.clientHeight; //height
  var width = $(window).width(); //width
  var ratio = height / width
  var w, h, marginTop

  if (ratio >= 1.6348) {
    w = width * .75
    h = w * 1.6348
  } else {
    h = height * .69
    w = h / 1.6348
  }
  $('.bg').css({
    'background-image': 'url(' + cdnUrl() + '/s/img/7c334730de5242655b1b775faa16b2a5)',
  })
  $('.flipbook-viewport').css({
    width: w,
    height: h,
  })
  $('.container').css('display', 'none')
}

function preview(mis) {
  var params = null
    // mis = true
  if (mis) {
    params = {
      cmd: 'Book.preview',
      ownerUserId: 0,
      _mis: 1,
      bookId: bookId,
      // bookId: 16882
      // bookId: 4846 // 偶数
      // bookId: 624 // 奇数
    }
  } else {
    params = {
      cmd: 'Book.preview',
      ownerUserId: 0,
      bookId: bookId,
      // bookId: 10147
      // bookId: 4846 // 偶数
      // bookId: 624 // 奇数
    }
  }
  $.get('/s/api', params, function(data) {
    if (data.err == 'ok') {
      start(data)
    } else {
      console.log(data.err)
    }
  })
}

function previewPage(pageContent) {
  return promise = new Promise(function(res, rej) {
    $.post('/s/api', {
      cmd: 'Book.previewPage',
      ownerUserId: '734937',
      pageContent: JSON.stringify(pageContent)
    }, function(data) {
      if (data.err == 'ok') {
        res(data)
      } else {
        rej(data.err)
      }
    })
  })
}

function start(data) {
  var w = $('.flipbook-viewport').width()
  h = $('.flipbook-viewport').height()
  allPage = data.res.pages // 书整体结构

  i = 0
  ele = $('<div></div>').css({
    width: w,
    height: h,
    'background-color': '#fff'
  })

  $('.pageNumber').html('1/' + allPage.length)

  $('.flipbook').css({
    width: w,
    height: h
  }).append(ele)
  previewPage(allPage[i]).then(function(singleData) {
    draw(singleData, i, allPage, ele, true)
  })
}

function draw(singleData, i, allPage, ele, requestNextPage) { // singleData 单页数据, i 用于canvas id
  var isDisposeLacePen = null // 是否特殊处理花边笔
  var flipbook = $('.flipbook')
  var cdn = cdnUrl()
  var promiseArr = []
  var layerArr = []
  var res = singleData.res
  var canvasWidth, canvasHeight
    // var ratio = flipbook.height() / flipbook.width()
  stepCounter[i] = 0

  if (!res.contentJson.hasOwnProperty('sys')) {
    res.contentJson.datas.forEach(function(item, i) {
      if (item.hasOwnProperty('mImagePath')) {
        isDisposeLacePen = true
      }
    })
  }

  if (res.contentJson.totalHeight == 1.6348) {
    canvasWidth = flipbook.width()
    canvasHeight = flipbook.height()
    ele.append('<canvas id="c' + i + '" width="' + canvasWidth + '" height="' + canvasHeight + '"></canvas>')
  } else if (res.contentJson.totalHeight < 1.6348) {
    canvasWidth = flipbook.width()
    canvasHeight = canvasWidth * res.contentJson.totalHeight
    ele.append('<div style="width: ' + canvasWidth + 'px; height: ' + canvasHeight + 'px"><canvas id="c' + i + '" width="' + canvasWidth + '" height="' + canvasHeight + '"></canvas></div>');
    var paddingTop = (flipbook.height() - canvasHeight) / 2
    $('#c' + i).parent().css('padding-top', paddingTop)
  } else if (res.contentJson.totalHeight > 1.6348) {
    canvasHeight = flipbook.height() - 20
    canvasWidth = canvasHeight / res.contentJson.totalHeight
    canvasHeight = flipbook.height() + 10
    ele.append('<div style="width: ' + canvasWidth + 'px;margin: 5px auto 0"><canvas id="c' + i + '" width="' + canvasWidth + '" height="' + canvasHeight + '"></canvas></div>');
  }

  var c = new fabric.StaticCanvas('c' + i)

  if (res.contentJson.diaryBg) {
    if (res.contentJson.diaryBg.bodyImageSign) {
      var promise = new Promise(function(resolve, rej) { // 背景平铺
        stepCounter[i] += 1
        fabric.Image.fromURL(cdn + '/s/img/' + res.contentJson.diaryBg.bodyImageSign, function(oImg) {
          resolve(oImg)
        })
      })

      promise.then(function(oImg) {
        var width = oImg.width
        ele.css({
          'width': flipbook.width(),
          'height': flipbook.height(),
          'background-image': 'url(' + cdn + '/s/img/' + res.contentJson.diaryBg.bodyImageSign + ')',
          'background-size': parseInt(width * ele.width() / 1242),
          'background-repeat': 'repeat'
        })
        promiseArr.push(promise)
      })
    }

  }

  if (res.contentJson.laces) {
    res.contentJson.laces.forEach(function(lace, laceI) { // 绘制花边笔或荧光笔
      drawLaces(lace, c, $('#c' + i), promiseArr, layerArr, i, isDisposeLacePen)
    })
  }

  if (res.contentJson.datas) {
    res.contentJson.datas.forEach(function(datas, dataI) { // 绘制元素
      drawDatas(datas, c, $('#c' + i), promiseArr, layerArr, i)
    })
  }

  var int = setInterval(function() {
    // console.log(stepCounter[i], promiseArr.length)
    if (stepCounter[i] == promiseArr.length) {
      Promise.all(promiseArr).then(function() {
        clearTimeout(int)
        stepCounter[i] = 0

        layerArr.sort(function(a, b) {
          return a.index - b.index
        })

        layerArr.forEach(function(item, i) { // 每页所有元素绘制完成后调整z-index
          var canvas = item.canvas
          canvas.moveTo(item.img, i)
          canvas.renderAll()
        })

        if (i == allPage.length) stepCounter = undefined

        if (!requestNextPage) { // 是否请求下一页
          return
        }

        if (i >= 2) { // 说明第三页也已经绘制完成 开始初始化书
          initBook(allPage)
          return
        }

        i++
        previewPage(allPage[i]).then(function(singleData) {
          var element = $('<div />').css({
            width: flipbook.width(),
            height: flipbook.height(),
            'background-color': '#fff'
          })
          flipbook.append(element)
          draw(singleData, i, allPage, element, true)
        })
      })
    }
  }, 100)

}

function initBook(allPage) {
  var flipbook = $('.flipbook')
  var w = flipbook.width();
  var h = flipbook.height();
  flipbook.turn({
    pages: allPage.length,
    elevation: 50,
    display: 'single',
    gradients: true,
    autoCenter: true,
    when: {
      missing: function(e, pages) {
        var book = $(this)
        pages.forEach(function(item, i) {
          if (!book.turn('hasPage', item)) {
            var element = $('<div />').css({
              width: flipbook.width(),
              height: flipbook.height(),
              'background-color': '#fff'
            }).html('<div class="loader"></div>');
            if (book.turn('addPage', element, item)) {
              preload(item, allPage, element);
            }
          }
        })
      },
      start: function(e, page) {
        $('.pageNumber').html(page.next + '/' + allPage.length)
      }
    }
  })
  $('.container').css('display', 'block')
  $('#flipLeft').css('height', h)
  $('#flipRight').css('height', h)
}

function preload(page, allPage, ele) {
  previewPage(allPage[page - 1]).then(function(singleData) {
    ele.find('.loader').remove()
    draw(singleData, page - 1, allPage, ele, false)
  })
}

function drawLaces(item, c, book, promiseArr, layerArr, i, isDisposeLacePen) { // 绘制花边笔或荧光笔
  var standard = book.width()
  if (item.signs) {
    lacePen(item, c, standard, promiseArr, layerArr, i, isDisposeLacePen)
  } else {
    lightPen(item, c, standard, promiseArr, layerArr, i)
  }
}

function lacePen(item, c, standard, promiseArr, layerArr, num, isDisposeLacePen) { // 花边笔
  var originX = null,
    originY = null
  if (isDisposeLacePen) {
    originX = 'left'
    originY = 'top'
  } else {
    originX = 'center'
    originY = 'center'
  }

  item.points.forEach(function(print, printIndex) {
    var i = printIndex + item.index // 第一个绘制的sign都是根据index的值来的
    if (i <= (item.signs.length - 1)) { // 根据角标i去signs里面找sign,如果没有,就再从第一个sign开始
      i = i
    } else {
      i = i % (item.signs.length)
    }
    if (!item.signs[i]) return
    var promise = new Promise(function(res, rej) {
      var img = new Image()
      stepCounter[num] += 1
      img.src = cdnUrl() + '/s/img/' + item.signs[i]
      img.onload = function() {
        res(img)
      }
    })


    promise.then(function(img) {
      var width = item.laceWidth * standard,
        obj
      height = width / img.width * img.height // 根据比例求高度
      Img = new fabric.Image(img, {
        originX: originX,
        originY: originY,
        width: Math.round(width),
        height: Math.round(height),
        top: Math.round(print.y * standard),
        left: Math.round(print.x * standard)
      })
      c.add(Img)
      obj = adjustment(c, Img, -50)
      layerArr.push(obj)
      promiseArr.push(promise)
    })

  })
}

function lightPen(item, c, standard, promiseArr, layerArr, i) { // 荧光笔
  var txt = '',
    lineWidth = 0
  if (item.laceWidth <= 1) {
    lineWidth = item.laceWidth
    lineWidth *= standard
  } else {
    if (item.laceWidth == 16) {
      lineWidth = .05
      lineWidth *= standard
    } else {
      lineWidth = item.laceWidth
    }
  }
  item.points.forEach(function(point, pointI, points) {
    if (!item.index) item.index = 0
    if (pointI % 3 == 0) {
      txt += 'C' + Math.round(point.x * standard) + ',' + Math.round(point.y * standard)
    } else {
      txt += ',' + Math.round(point.x * standard) + ',' + Math.round(point.y * standard)
    }
  })
  var str = txt.slice(0, txt.lastIndexOf('C')),
    obj
  path = new fabric.Path(str)
  c.add(path.set({
    opacity: item.lightPen.lightAlpha,
    stroke: item.lightPen.lightColor, // 颜色
    strokeLineCap: item.lightPen.lightShape, // 线头
    strokeWidth: lineWidth, // 线宽
    fill: false,
    strokeLineJoin: 'round', // 交点样式
    zIndex: -50
  }))
  obj = adjustment(c, path, -50)
  layerArr.push(obj)
}

function drawDatas(item, c, book, promiseArr, layerArr, i) { // 绘制每个元素
  if (!item.imageSign) return
  if (item.imageSign[0] != '/') {
    var standard = book.width(); // 元素宽高都是以书本宽度为基准
    var num
    var promise = new Promise(function(res, rej) {
      var img = new Image();
      stepCounter[i] += 1
      img.src = cdnUrl() + '/s/img/' + item.imageSign;
      img.onload = function() {
        res(img)
      }
    })
    promise.then(function(img) {
      var imgWidth = item.width * standard * item.scale
      var imgHeight = item.height * standard * item.scale
      imgSingArr = [
        '02b6838508a7b2d3016c5417a99f3009',
        '0fb96a0a0c9bf24a3f761c0223ebe8e0',
        'c1946943c38e9bfb067423d60c6841c6',
        'c568d280827044a96891536eca77940d',
        'd452c848e1f0739b39824f86aace4080',
        '1e48131f01f3ec0710d519b30547cb28',
        'de8855f3dea91a181f185cc10ee70ca2',
        '8672df01b36b3d998bf0edb18674b2ad',
        '4ce1fcfa0f580d16a73ed0766e5f8df1',
        'df863b88fe19a305e2d539f2b02cd198',
        '121ff6b85f76f704c924387b8c5bcd88',
        '3e111f6993d0c0d736cfbb6661c1e257'
      ]
      imgSingArr.forEach(function(imgItem) {
        if (item.imageSign == imgItem) {
          var a = img.width / img.height,
            b = item.width / item.height
          if (a > b) {
            imgHeight = imgWidth / a
          } else {
            imgWidth = imgHeight * a
          }
        }
      })
      var obj, Img = new fabric.Image(img, {
        originX: 'center',
        originY: 'center',
        width: Math.round(imgWidth),
        height: Math.round(imgHeight),
        top: Math.round(item.yRate * standard),
        left: Math.round(item.xRate * standard),
        angle: Math.round(item.rotate),
      })
      if (item.reflectType == 1) {
        Img.setFlipX(true)
      } else if (item.reflectType == 2) {
        Img.setFlipY(true)
      }
      c.add(Img)
      if (item.zIndex < 0) {
        num = item.zIndex * 100
      } else {
        num = item.zIndex
      }
      obj = adjustment(c, Img, num)
      layerArr.push(obj)
      promiseArr.push(promise)
    })
  } else {
    drawImageText(item, c, book, promiseArr, layerArr, i)
  }
}

function drawImageText(item, c, book, promiseArr, layerArr, i) { // 绘制文字图片
  if (!item.imageSign) return
  var standard = book.width()
  var num
  var promise = new Promise(function(res, rej) {
    var img = new Image();
    stepCounter[i] += 1
    img.src = cdnUrl() + item.imageSign;
    img.onload = function() {
      res(img)
    }
  })
  promise.then(function(img) {
    var obj, Img = new fabric.Image(img, {
      originX: 'center',
      originY: 'center',
      width: Math.round(item.width * standard * item.scale),
      height: Math.round(item.height * standard * item.scale),
      top: Math.round(item.yRate * standard),
      left: Math.round(item.xRate * standard),
      angle: Math.round(item.rotate),
    })
    if (item.reflectType == 1) {
      Img.setFlipX(true)
    } else if (item.reflectType == 2) {
      Img.setFlipY(true)
    }
    c.add(Img)
    if (item.zIndex < 0) {
      num = item.zIndex * 100
    } else {
      num = item.zIndex
    }
    obj = adjustment(c, Img, num)
    layerArr.push(obj)
    promiseArr.push(promise)
  })
}

function adjustment(canvas, img, index) {
  var obj = new Object()
  obj.canvas = canvas
  obj.img = img
  obj.index = index
  return obj
}

function Touch() {
  var flipbook = $('.flipbook')
  touch.config({
    tap: true, //tap类事件开关, 默认为true
    doubleTap: true, //doubleTap事件开关， 默认为true
    hold: true, //hold事件开关, 默认为true
    holdTime: 650, //hold时间长度
    swipe: true, //swipe事件开关
    swipeTime: 300, //触发swipe事件的最大时长
    swipeMinDistance: 18, //swipe移动最小距离
    swipeFactor: 5, //加速因子, 值越大变化速率越快
    drag: true, //drag事件开关
    pinch: true, //pinch类事件开关
  });
  touch.on('.flipbook-viewport', 'swipeleft', function() {
    flipbook.turn('next')
  })
  touch.on('.flipbook-viewport', 'swiperight', function() {
    flipbook.turn('previous')
  })
  touch.on('#flipRight', 'tap', function() {
    flipbook.turn('next')
  })
  touch.on('#flipLeft', 'tap', function() {
    flipbook.turn('previous')
  })
}

function css() {
  var deviceWidth = document.documentElement.clientWidth;
  if (deviceWidth > 720) deviceWidth = 720;
  document.documentElement.style.fontSize = deviceWidth / 7.2 + 'px';
}

function cdnUrl() {
  var domain = ''
  if (window.location.href.search('www.mycolordiary.com') >= 0) {
    domain = 'https://cdn.mycolordiary.com'
  } else {
    domain = 'https://test.mycolordiary.com'
  }
  return domain
}

function initEve() { // 下载
  $('.footer-btn').on('click', function() {
    var url = getColorDownloadUrl()
    window.open(url)
  });

  $('.musicIcon').on('click', function() { // 音乐
    if ($('.musicIconShade').css('display') == 'none') {
      $('.musicIconShade').css('display', 'block')
    } else {
      $('.musicIconShade').css('display', 'none')
    }
  });

  $(window).resize(function() {
    css();
  });
}

function getColorDownloadUrl(ch, p) {
  var browser = {
    versions: function() {
      var u = navigator.userAgent,
        app = navigator.appVersion;
      ul = u.toLowerCase();
      return {
        ios: !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/),
        android: u.indexOf('Android') > -1 || u.indexOf('Linux') > -1,
        isWX: ul.indexOf('micromessenger') > -1
      }
    }()
  }

  if (!ch || ch == null || ch == undefined || ch == 'null' || ch == '') {
    ch = '110';
  }
  var iosUrl = "https://itunes.apple.com/cn/app/id1018142904?mt=8";
  var iosWxUrl = "http://a.app.qq.com/o/simple.jsp?pkgname=com.cxwx.girldiary";
  var androidUrl = 'http://cdn.mycolordiary.com/download/android/Color.' + ch + '.apk';
  if (ch == 'fensitong') { // 新浪粉丝通
    iosUrl = 'http://click.hm.baidu.com/app.gif?ap=182732&ch=37297';
    androidUrl = 'http://www.mycolordiary.com/html/color/channels/colordownloadfensitong.html';
  } else if (ch == 'mmmanhua') { // 漫漫漫画
    iosUrl = 'http://click.hm.baidu.com/app.gif?ap=182732&ch=37314';
    androidUrl = 'http://h5.color365.com';
  } else if (ch == 'h5') {
    iosUrl = 'http://click.hm.baidu.com/app.gif?ap=182732&ch=37344';
  } else if (ch == 'zazhi') {
    iosUrl = 'http://click.hm.baidu.com/app.gif?ap=182732&ch=37667';
  } else if (ch == 'bookseller') {
    iosUrl = 'http://click.hm.baidu.com/app.gif?ap=182732&ch=38393';
  } else if (ch == 'liwen') {
    iosUrl = 'http://click.hm.baidu.com/app.gif?ap=182732&ch=38940';
  }
  // var androidWxUrl = "http://dd.myapp.com/16891/01F018B991EFD40C11A1DBC21DF94961.apk?mkey=55e06385d33eda87&f=4ca5&fsname=com.cxwx.girldiary_1.0.0_2015082814.apk&asr=02f1&p=.apk";
  var androidWxUrl = "http://a.app.qq.com/o/simple.jsp?pkgname=com.cxwx.girldiary";

  // var androidWxUrl = "http://cdn.mycolordiary.com/download/android/Color.h5.apk";
  if (browser.versions.ios || (p && p == 'ios')) {
    if (browser.versions.isWX) {
      return iosWxUrl;
    } else {
      return iosUrl;
    }
  } else if (browser.versions.android) {
    if (browser.versions.isWX) {
      return androidWxUrl;
    } else {
      return androidUrl;
    }
  }
  return androidWxUrl;
}
