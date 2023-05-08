## 一款扑克牌游戏,包括 [炸金花](https://baike.sogou.com/v50792859.htm?fromTitle=%E7%82%B8%E9%87%91%E8%8A%B1) 和[比鸡](https://baike.sogou.com/v73721340.htm?fromTitle=%E6%AF%94%E9%B8%A1)

### 部署方式：

#### 必须软件
> node:14~16
> 
> mysql

#### 数据库初始化
> 1.创建数据库poker-system
> 
> 2.修改system/pool.js中的数据库用户名密码
> 
> 3.导入初始化数据system/init.sql

#### 运行项目

 ```shell
 git clone https://github.com/ahnuchen/fried-chicken.git
 cd fried-chicken
 npm i -g pnpm
 pnpm i -r --shamefully-hoist
 pnpm run -C admin build
 pnpm run -C applet build
 node ./system/bin/www # 推荐使用pm2持久化部署->
# pm2 start ./system/bin/www
 ```

#### 访问项目

> 1.管理后台 ip:3040/poker/admin 初始账号/密码 admin/admin
> 2.客户端 ip:3040/poker/applet
