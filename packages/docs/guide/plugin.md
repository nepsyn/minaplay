<script setup>
import {useData, withBase} from 'vitepress';
const data = useData();
</script>

# 插件

## 概述

MinaPlay 提供了简单的插件系统，用以拓展 MinaPlay 的基础功能。MinaPlay 插件本质上是一个 [NestJS Module](https://docs.nestjs.com/modules)，不认识它也没关系，普通用户可以直接使用插件控制台作为插件提供的用户接口。

## 插件控制台

:::warning 注意
使用插件控制台需要当前登录用户具有 `超级管理员(root)` 权限。
:::

插件控制台是 MinaPlay 插件与用户交互的方式。
用户可以像使用控制台一样通过命令文本调用 MinaPlay 插件提供的各项服务，配合 MinaPlay 提供的消息格式构建一个简单的 Shell 终端。

<img :src="data.isDark.value ? withBase('/plugin-console-dark.png') : withBase('/plugin-console.png')" alt="plugin console">

通过 MinaPlay 插件系统，用户可以拓展 MinaPlay 的各种功能，并通过插件控制台调用这些插件服务。

## 内置插件命令

MinaPlay 提供了一些必要的内置插件，用户无需额外下载安装即可使用。
内置插件版本会随着 MinaPlay 更新，无需手动更新。

:::tip 提示
MinaPlay 中的内置插件可以被禁用，但无法卸载。
:::

### help

```shell
# usage
help                [help] - show commands in MinaPlay plugin console
Usage: help|man [options] [bin]

show commands in MinaPlay plugin console

Options:
  -h, --help  display help for command
```

基础的帮助插件，用于展示 MinaPlay 中现有的插件命令和命令的具体使用方式。

### plugin-manager

```shell
#usage
pm                  [plugin-manager] - manage plugins in MinaPlay
Usage: pm|plugin-manager [options] [command]

manage plugins in MinaPlay

Options:
  -h, --help                       display help for command

Commands:
  enable|e <id>
  disable|d <id>
  install|add [options] <id>
  uninstall|remove [options] <id>
```

插件管理插件，用于安装 / 卸载 / 启用 / 禁用 MinaPlay 中的插件。

### user-manager

```shell
# usage
um                  [user-manager] - manage users in MinaPlay
Usage: um|user-manager [options] [command]

manage users in MinaPlay

Options:
  -h, --help                           display help for command

Commands:
  add [options] <username> <password>
  grant <username> <group>
  del|delete <username>
```

用户管理插件，用于创建 / 删除 / 授权用户。

## 安装新插件

### 命令安装

在插件控制台中输入由内置插件 `plugin-manager` 提供的命令直接安装位于 NPM Registry 中的插件，插件安装后会自动加载。

```shell
pm add xxx # xxx 为待安装插件的 ID
```

### 手动安装

下载插件源码文件，并移动到 MinaPlay 插件目录下。

```shell
# 克隆插件仓库地址或手动下载插件源码
$ git clone https://xxx.git
# 移动插件到 MinaPlay 插件目录
$ mv xxx data/plugin/xxx
# 重启 MinaPlay 应用插件
$ docker restart minaplay
```

## 卸载插件

使用内置插件 `plugin-manager` 提供的命令卸载插件。

```shell
pm del xxx # xxx 为待卸载插件的 ID
```

:::tip 提示
由于 [NestJS](https://docs.nestjs.com) 的框架特性，MinaPlay 在卸载插件时无法卸载插件对应的 Module ，插件的卸载逻辑应由插件作者自行编写。
:::