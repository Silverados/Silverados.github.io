# MySQL调优

## 概览
优化一般分为数据库层面和硬件层面。

数据库层面考虑以下几个问题：
- 表结构是否合理？例如列的声明是否用了合适的数据类型；将某些列放在一张表中是否合理。
- 索引设置的是否合理？
- 存储引擎是否恰当？例如非事务性可以使用MyISAM存储引擎。
- 表是否使用恰当的行格式？例如压缩表。
- 应用程序是否使用了恰当的锁策略。
- 是否所有内存区域缓存大小恰当。也就是说，大到足以容纳频繁访问的数据，但又不至于大到使物理内存过载并导致分页。例如设置InnoDB的buff pool。

硬件层面考虑：
- 硬盘搜寻。
- 硬盘读写。
- CPU周期。
- 内存带宽。

## SQL优化
### SELECT优化
优化查询考虑：
- 添加索引。可以用EXPLAIN分析。
- 隔离和调优查询中花费过多时间的任何部分，例如函数调用。
- 减少全表查询的次数。
- 通过定期使用ANALYZE table语句使表统计信息保持最新，这样优化器就可以获得构建有效执行计划所需的信息。
- 了解特定于每个表的存储引擎的调优技术、索引技术和配置参数。
- 避免以难以理解的方式转换查询，特别是当优化器自动执行一些相同的转换时。
- 如果性能问题不能通过基本准则之一轻松解决，请通过阅读EXPLAIN计划和调整索引、WHERE子句、连接子句等来调查特定查询的内部细节。(当您达到一定的专业水平时，阅读EXPLAIN计划可能是您处理每个查询的第一步。)
- 调整MySQL用于缓存的内存区域的大小和属性。通过有效地使用InnoDB缓冲池、MyISAM键缓存和MySQL查询缓存，重复查询运行得更快，因为结果在第二次和以后的时间都是从内存中检索的。
- 即使对于使用缓存内存区域快速运行的查询，您仍然可以进一步优化，以便它们需要更少的缓存内存，从而使应用程序更具可伸缩性。可伸缩性意味着您的应用程序可以处理更多的并发用户、更大的请求等等，而不会出现性能的大幅下降。
- 处理锁定问题，其中查询的速度可能会受到同时访问表的其他会话的影响。