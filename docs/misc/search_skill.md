# 谷歌搜索技巧

## 在某个网站内搜索
用`site:xxx`限定：
> KCP site:github.com

## 查找链接到某个网站的网站
用`link:xxx`限定：
> link:Silverados.github.io

## 特定类型
用`filetype`限定：
> "Java并发编程实战" filetype:pdf

## 完全匹配
用双引号将内容框住，例如：
> "Native性能优化之Native transports"

## 模糊匹配
用`*`，例如以下这种写法可能会出现我的世界、平凡的世界、不抱怨的世界等:
> "*的世界"

用`~`搜索同义词，例如健康的食谱结果可能包含低热量食谱、有营养的食谱等。
> "~健康食谱"

## 排除搜索
用`-`去掉不想相关的内容，例如：
> 动物 -狗

## 或
用`OR`分隔，例如：
> 猫 OR 狗

## 全部匹配可分隔
用`allintext:`，这个和完全匹配的区别在于文本可以分隔（文本中的所有字符都会出现但是可能不会连在一起）。
> allintext:天天向上

用`allintitle:`，这个限定网页标题。
> allintitle:天天向上

用`allinurl:`，这个限定网页链接。
> allintitle:天天向上

## 查单词
用`define`:
> define:apple

## 限定地址
用`location`:
> 动物园 location:China

## 相关网站
用`related:`:
> related:baidu.com
