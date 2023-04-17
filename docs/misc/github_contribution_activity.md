# Github中Contribution activity不展示commit相关的信息
这个原因通常是我们的邮箱地址不对应，检查当前项目的邮箱地址：
```shell
git config --local user.email
```

确保这个邮箱和登录`github`的邮箱一致。

如果不一致设置它：
```shell
git config --lcoal user.email xxxx
```

这里用的是`local`，因为通常这种情况下可能是你在公司提交代码用的是公司邮箱的地址，这里限制只改这个仓库的。
还有其他全局的选项，例如：
- global
- system