最近做了一个翻书效果的项目, 来总结一下实现过程和遇到的一些问题, 供自己以后快速解决问题, 希望也能帮到同样遇到此类问题的同学, 如果有更好的方法,希望你能分享给我
> **插件:**

**[Turn.js](http://www.turnjs.com/)**, **[Fabric.js](http://fabricjs.com/)**, **[Touch.js](https://www.awesomes.cn/repo/Clouda-team/touchjs)**, **[jQuery.js](http://jquery.com/)**, **[jQuery-ui.js](http://jqueryui.com/)**, **[ES6-Promise](https://github.com/stefanpenner/es6-promise)**


----------
问题都是些自己觉的比较难解决的, 比较片面, 如有其他疑问可以留言交流或者[Bing](http://cn.bing.com/)
 >**Turn.js**

当你从Turn官网下载下来文件后它里面会提供5种事例代码, 根据需求我用的是**docs**, 先看一段简单的事例代码:
- **HTML**
```
<div id="flipbook"></div>
```
- **JS**
```
$('#flipbook').turn({
  width: width,
  height: height,
  pages: length,
  autoCenter: true,
  when: { // 处理事件
    missing: function(e, pages) { // e:(event), pages:(type:arr,需要添加的页数)
      var book = $(this)
      pages.forEach(function(item, i) {
        addPage(item, i, data)
      })
    }
  }
})
```
把你的内容放在**flipbook**下面, 然后通过**turn(object)**来初始化你的数据, 当然你也可以使用**DOM**添加数据, 然后再初始化数据.区别可能是通过**missing**事件监听可以及时知道数据变化, 而通过**DOM**则不能(只是猜想没有验证).
> **Fabric.js**

这里每一页内容都是由图片, 文字, 线段组成的, 所以用了**canvas**.

**第一个问题**是背景平铺问题, 因为在Fabric文档中好像不支持背景平铺, 也可能是我没有找到, 所以就用了这种方式, 直接给画布加背景:
```
$('#canvas').css({
  'background-image':'url(' + url + ')',
  'background-size': 'size'
})
```
**第二个问题**是绘制贝塞尔曲线问题, 在绘制贝塞尔曲线用的是**Path**方法, 先看段代码:
```
var path = new fabric.Path('C43,128,28,143,17,153C14,156,12,158,12,158z', {
  opacity: .5, // 线条透明度
  stroke: '#e4393c', // 颜色
  strokeLineCap: 'round', // 线头样式
  strokeWidth: 3, // 线宽
  fill: false, // 填充透明
  strokeLineJoin: 'round' // 交点样式
})
canvas.add(path) // 添加到canvas上
```
你可以通过这种方式来加曲线, 其实完整写法是
`new Path('M0,0L100,100C50,50,60,60,70,70z', {})`
其中字母也可以小写, 逗号可以用空格代替或者短横线, 应该也支持其他的(我没试过)**M**代表将点移动那里然后**L**画出一条线, **C**代表开始画贝塞尔曲线, 是三次贝赛尔曲线(还有二次的,不知道Bing下), 三次贝塞尔曲线需要4个点来控制, 第一个点就是代码里面的**(100,100)**, 紧接着是第一个控制点**(50,50)**, 第二个控制点**(60,60)**, 最后一个点**(70,70)**结束点**z**封闭一下. 你想在**C**后面加8个数? 别试了, 我试过没用. 在绘制过程中你会发现绘制出来的曲线总是首尾相连,如果不合需求你在绘制的最后就不能加**z**, 同时把**fill**设置为**false**.

**第三个问题**是层级问题, 你想文字在图片上面, 你想小的logo在最顶部但是往往绘制出来并不是你想要的效果, 这是因为图片和logo大部分都是图片, 请求是异步的, 你把异步拿来的图片画上去设置**zindex**并不能达到预期的效果, 先看代码:
```
var stepCounter = {}, layerArr = [], promiseArr = []

function adjustment(canvas, img, index) {
  var obj = new Object()
  obj.canvas = canvas
  obj.img = img
  obj.index = index
  return obj
}

function draw() {
    var promise = new Promise(function(res, rej) {
      var img = new Image()
      stepCounter[num] += 1
      img.src = url
      img.onload = function() {
        res(img)
      }
    })
    
    promise.then(function(img) {
      Img = new fabric.Image(img, {
        ... // 设置一些属性
      })
      canvas.add(Img)
      obj = adjustment(canvas, Img, -50)
      layerArr.push(obj)
      promiseArr.push(promise)
    })
}

setTimeout(function() {
  if (stepCounter[i] == promiseArr.length) {
    Promise.all(promiseArr).then(function() {
      layerArr.sort(function(a, b) {
        return a.index - b.index
      })
      layerArr.forEach(function(item, i) {
        var c = item.canvas
        c.moveTo(item.img, i)
        c.renderAll()
      })
    })
    return
  }
  setTimeout(arguments.callee, 50)
}, 50)
```
整体思路是这样的:
1. 用`Promise`加载图片, 同时将`promise`push到数组`promiseArr`中, 可以用来判断图片是否都下载完和做对比判断.
2. 假设第一页有20个图片, 每创建一个`Promise`就在`stepCounter`中对应的属性记录一下, 对比判断.
3. 把图片的`zIndex`和一些必要信息放在一个数组中`(layerArr)`, 图片下载完调整`zIndex`. 
**最后**用`setTimeout`检测当页绘制的图片与`promise.length`是否相同, 相同就证明所有图片都在加载中, 再用`Promise.all()`确定图片加载完成后就可以调整图片的`zIndex`了, 我参考了[stackoverflow0](http://stackoverflow.com/questions/6939782/fabric-js-problem-with-drawing-multiple-images-zindex), [stackoverflow1](http://stackoverflow.com/questions/26638984/fabric-js-add-images-order), 考虑到`Promise`的兼容性, 需要引入[ES6-Promise](https://github.com/stefanpenner/es6-promise)
>**翻书区域**
用了Touchjs模拟, 就不多说了, 很简单.
> **分享**

原来用的是**jiathis**分享, https后不能用了, 可能是不支持.
```
var qzone = 'http://sns.qzone.qq.com/cgi-bin/qzshare/cgi_qzshare_onekey?url={url}&title={title}&pics={pic}&summary={content}';
var sina = 'http://service.weibo.com/share/share.php?url={url}&title={title}&pic={pic}&searchPic=false';
var weixin = 'http://qr.liantu.com/api.php?text={url}';
```
所以直接调接口自己写了个
