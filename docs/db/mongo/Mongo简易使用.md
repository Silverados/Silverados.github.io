# MongoDB的简易使用教程

首先为了避免因为旧的读法印象了读者的阅读，这些叫法偶尔会混用，请不要追究。

|      SQL       |    MongoDB     |
|:--------------:|:--------------:|
| 数据库 (database) | 数据库 (database) | 
|    表(table)    | 集合(collection) |
| 行(row) |  文档(document)  |
| 列(column) |   属性(field)    |

## 数据库操作
### 查询现有数据库
```shell
> show dbs
```
或者：
```shell
> show databases
```

例如默认结果：
```shell
admin                     180.00 KiB
config                    108.00 KiB
local                      40.00 KiB
```

### 切换/创建数据库
切换到一个已有数据库：
```shell
> use config
switched to db config
```

如果切换到一个不存在的数据库：
```shell
> use test
switched to db test
```

这时用上面的查看命令不会出现这个数据库。只有给这个数据库插入数据后才会真正创建数据库。
```shell
> db.foo.insertOne({id: 1})
{
  acknowledged: true,
  insertedId: ObjectId("64d7afbdc7ed0d55de720027")
}
```


## 集合操作
### 查看集合
```shell
> show tables
foo
```

### 创建集合
例如上文中的直接插入数据或者插入索引可以直接创建集合。也可以利用语句创建：
```shell
> db.createCollection('bar')
{ ok: 1 }
```
显式创建集合可以在创建时指定一些选项，例如指定集合的大小等。如有必要也可以隐式创建后修改。

### 集合限制
和SQL的表结构不同，集合没有表头字段。
例如再插入一条数据，然后查看集合内容：
```shell
> db.foo.insertOne({'name':'wyw'})
> db.foo.find()
{
  _id: ObjectId("64d7afbdc7ed0d55de720027"),
  id: 1
}
{
  _id: ObjectId("64d7b777c7ed0d55de720028"),
  name: 'wyw'
}
```

# 参考文献
https://www.mongodb.com/docs/manual/core/databases-and-collections/