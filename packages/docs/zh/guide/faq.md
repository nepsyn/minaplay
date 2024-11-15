# FAQ

### 忘记 ROOT 用户密码

MinaPlay 的 ROOT 用户密码**仅会在首次启动**时打印一次， 忘记 ROOT 用户密码可通过添加 `APP_ROOT_USER_RESET=1` 即可在启动时重置
ROOT 用户密码，并在控制台打印。

docker 或 docker compose 用户可直接在启动参数中添加 `APP_ROOT_USER_RESET`，本地部署用户可参考：

```shell
# 本地启动
APP_ROOT_USER_RESET=1 node dist/main
```

如果上述方法不能解决问题，可以考虑清除 MinaPlay 数据库中 ROOT 用户信息，MinaPlay 在下次启动时会重新创建 ROOT 用户。

### 启动报错 `Uncaught rejection: Error: [pid: xx, code: 40, signal: null]`

此报错信息为 Mediasoup 依赖未正确安装导致，可以通过下面的两种方式解决：

1. 重新安装 Mediasoup 依赖。

   ```shell
   # 使用 docker 部署的情况下先进入容器
   docker exec -it minaplay /bin/sh
   # 进入应用程序目录
   cd /app
   # 重新安装依赖
   pnpm install
   ```

2. 删除 Mediasoup 可执行文件，完全禁用放映室语音功能。

   ```shell
   # 使用 docker 部署的情况下先进入容器
   docker exec -it minaplay /bin/sh
   # 进入应用程序目录
   cd /app
   # 删除可执行文件 (Windows下为 mediasoup-worker.exe)
   rm node_modules/mediasoup/worker/out/Release/mediasoup-worker
   ```

### MinaPlay 启动后没有任何内容

MinaPlay 本身不提供任何内容，用户需要自行添加订阅源、订阅规则等信息。

### 启动报错 `Unable to connect to the database`

出现错误的原因是 MinaPlay 无法链接到指定的数据库，请检查数据库配置或尝试更换数据库版本。
