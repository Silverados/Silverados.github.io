# MongoDB的部分限制和阈值
## BSON document
- BSON document大小限制在**16MB**内。当超过这个值时使用GridFS相关的API。
- 最大嵌套等级为100。

## 数据库命名
- 不要依赖大小写
- Windows不要使用以下字符：`/\. "$*<>:|?`。Linux下不要使用以下字符：`/\. "$`
- 限制在64字符内

## 集合命名
- 集合应该以下划线开头或者字母开头
- 不要包含`$`，不能是空字符串，不能以`system.`开头
- `<db>.<collection>`的长度如果是分片的应该控制在235字节以下，否则在255字节以下。

## 字段
- 允许存储包含点(.)和美元符号($)的字段名。(但是最好不要)
- `_id`是系统保留字段


## 参考文献
https://www.mongodb.com/docs/manual/reference/limits