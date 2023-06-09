# Docsify博客定制化
这里讲几个思路:
1. 直接用文档里的[**定制化**](https://docsify.js.org/#/zh-cn/configuration)，看需要什么就引入什么。这里我给的跳转链接是到配置项的，还有主题、插件列表等，也支持自己开发。
2. 查看[awesome-docsify](https://docsify.js.org/#/zh-cn/awesome)中其他人的博客，然后按F12查看`index.html`的源码，copy他们的实现。
3. 搜索引擎。

## 添加“鸣谢docsify”
> 这里我就是直接看`https://docsify.js.org/#`的实现copy过来的。

打开`index.html`，在原本的基础上加个`plugins`:
```html
  <script>
    window.$docsify = {
      name: '',
      repo: '',
      loadSidebar: true,
      subMaxLevel: 2,
      plugins: [
        function (hook, vm) {
          hook.beforeEach(function (html) {
            return html +
              '\n\n----\n\n' +
              '<a href="https://docsify.js.org" target="_blank" style="color: inherit; font-weight: normal; text-decoration: none;">Powered by <span style="color:green;text-decoration:underline;">docsify</span></a>'
          })
        }
      ]
    }
  </script>
```

## 添加访问量统计
我在看[春建的文档箱](https://www.yangchunjian.com/docbook/#/?id=%E6%98%A5%E5%BB%BA%E7%9A%84%E6%96%87%E6%A1%A3%E7%AE%B1)这个博客时发现他有个人数统计的功能，研究了一些发现是使用[不蒜子](https://busuanzi.ibruce.info/)来做，这里可以直接通过链接跳转到官网，这个是相关的文档:[API](http://ibruce.info/2015/04/04/busuanzi/)。

顺着这个思路，谷歌一下可以查到目前主要的实现有3种，大家可以试验和权衡下使用：
1. 不蒜子
2. 百度统计
3. 谷歌分析

这里用不蒜子，首先引入依赖:
```html
<script async src="//busuanzi.ibruce.info/busuanzi/2.3/busuanzi.pure.mini.js"></script>
```

极简：
```html
本站总访问量<span id="busuanzi_value_site_pv"></span>次
本站访客数<span id="busuanzi_value_site_uv"></span>人次
本文总阅读量<span id="busuanzi_value_page_pv"></span>次
```

数据没回来之前不显示标签：
```html
<span id="busuanzi_container_site_pv" style='display:none'>
    本站总访问量<span id="busuanzi_value_site_pv"></span>次
</span>
```

例如可以在`README.md`中直接添加上面的行。


## 添加最后更新时间
文档中提供了配置[最后更新时间](https://docsify.js.org/#/zh-cn/configuration?id=formatupdated), 需要注意的是这里提供了**{docsify-updated<span>}</span>**需要在代码中使用。

例如结合上面说的`鸣谢docsify`中使用：
```html
  <script>
    window.$docsify = {
      name: '',
      repo: '',
      loadSidebar: true,
      subMaxLevel: 2,
      plugins: [
        function (hook, vm) {
          hook.beforeEach(function (html) {
            return html +
              '\n\n----\n\n' +
              '<a href="https://docsify.js.org" target="_blank" style="color: inherit; font-weight: normal; text-decoration: none;">Powered by <span style="color:green;text-decoration:underline;">docsify</span></a>' + '<em style="float: right">上次更新于: {docsify-updated} </em>'
          })
        }
      ]
    }
  </script>

```

在实际的使用过程中我发现所有页面的更新时间都是一样的。查看了一些资料例如：https://github.com/pfeak/docsify-updated/blob/master/zh-README.md 。 文中描述说CI/CD的过程可能会导致文档的时间被重置为deploy的时间。
虽然有提供一个解决方案，但是我没有尝试，我想了下应该从github中获得数据。

```html
  <script>
    window.$docsify = {
        name: '',
        repo: '',
        loadSidebar: true,
        subMaxLevel: 2,
        plugins: [
            function (hook, vm) {
                hook.beforeEach(function (html) {
                    var url = 'https://github.com/Silverados/Silverados.github.io/blob/main/docs/' + vm.route.file;
                    var editHtml = '[📝 EDIT DOCUMENT](' + url + ')\n';

                    var lastUpdated = '{docsify-updated}'
                    var updateUrl = 'https://api.github.com/repos/Silverados/Silverados.github.io/commits?path=docs/' + vm.route.file + '&per_page=1'
                    fetch(updateUrl)
                        .then(response => response.json())
                        .then(data => {
                            lastUpdated = new Date(data[0].commit.author.date);
                            document.getElementById("updateTime").textContent = lastUpdated.toLocaleString()
                        });

                    return (
                        editHtml +
                        html +
                        '\n----\n' +
                        '<span id="busuanzi_container_site_pv" style="display:none"> 🙆‍♂️本站总访客数:<span id="busuanzi_value_site_uv"></span> 人</span>\n' +
                        '<em style="float: right">上次更新于: <span id="updateTime">' + lastUpdated + '</span></em>' +
                        '<div><a href="https://docsify.js.org" target="_blank" style="color: inherit; font-weight: normal; text-decoration: none;">Powered by <span style="color:green;text-decoration:underline;">docsify</span></a></div>'
                    );
                });
            },
        ]
    }
</script>


```

## 分页(上/下一篇)
引入依赖即可使用：
```html
<script src="//cdn.jsdelivr.net/npm/docsify-pagination/dist/docsify-pagination.min.js"></script>
```

使用下面这段代码可以跨章节下一篇：
```html
  <script>
    window.$docsify = {
        pagination: {
            crossChapter: true,
            crossChapterText: true,
        },
    }
</script>
```

## 字体支持
需要什么引入什么：https://docsify.js.org/#/zh-cn/language-highlight

例如引入`java`:
```html
<script src="//cdn.jsdelivr.net/npm/prismjs@1/components/prism-java.min.js"></script>
```

