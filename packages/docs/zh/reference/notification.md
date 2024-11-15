# 通知服务

MinaPlay 的通知系统可高度个性化，并提供了拓展能力。

目前 MinaPlay 内置了4种通知服务：

- 客户端(web)通知。
- 邮件通知。
- [ServerChan](https://sct.ftqq.com/) 通知。
- Telegram 机器人通知。

## 通知内容

MinaPlay 使用 [Handlebars](https://handlebarsjs.com/zh/guide/) 为大部分通知服务创建了默认通知模板，如媒体文件更新的邮件通知：

[new-media.handlebars](https://github.com/nepsyn/minaplay/blob/master/packages/server/src/modules/notification/adapters/email/templates/new-media.handlebars)

```handlebars
<p>Hello!</p>
<br />
<p>
    Welcome to MinaPlay. A new media <strong>{{media.name}}</strong> updated.
</p>
<br />
<p>MinaPlay</p>
```

这意味着用户可以直接修改模板文件个性化自己的通知内容，回到上面的默认模板，我们可以在媒体文件更新通知中加上媒体文件的描述：

```handlebars
<p>Hello!</p>
<br />
<p>
    Welcome to MinaPlay. A new media <strong>{{media.name}}</strong> updated.
</p>
<p>
    Description: {{media.description}}
</p>
<br />
<p>MinaPlay</p>
```

对于每种通知类型 MinaPlay
传入的信息是统一的，可以在 [notification-event.interface.ts](https://github.com/nepsyn/minaplay/blob/master/packages/server/src/modules/notification/notification-event.interface.ts)
中查看。

## 添加通知服务

MinaPlay 为通知服务提供了一套统一的接口，如果需要添加新的通知服务，可以参考以下的步骤。

1. 在 notification/adapters 目录下创建一个新的通知服务目录，比如 `console` 。

   ```shell
   cd src/modules/notification/adapters
   mkdir console
   cd console
   ```

2. 创建通知服务所需的文件。

   ```text
   ├── console.adapter.ts       // 通知服务的实现
   ├── console.config.ts        // 通知服务针对每个用户的配置
   └── templates                // 通知消息模板（可选）      
     ├── new-episode.handlebars
     ├── new-media.handlebars
   ```

3. 添加通知服务类型。

   ```typescript {8}
   // notification-service.enum.ts
   // see: https://github.com/nepsyn/minaplay/blob/master/packages/server/src/enums/notification-service.enum.ts
   export enum NotificationServiceEnum {
     EMAIL = 'EMAIL',
     WS = 'WS',
     SERVER_CHAN = 'SERVER_CHAN',
     TELEGRAM = 'TELEGRAM',
     CONSOLE = 'CONSOLE',  // add here
   }
   ```

4. 实现必要的通知逻辑

   ```typescript
   // console.config.ts
   export class ConsoleConfig {}
   ```
   
   ```typescript
   // console.adapter.ts （省略 imports）
   @Injectable()
   export class ConsoleAdapter implements NotificationServiceAdapter<ConsoleConfig> {
     adapterServiceType = NotificationServiceEnum.CONSOLE;
     adapterConfigType = ConsoleConfig;
     
     isEnabled() {
       return true;
     }
     
     notify<T extends NotificationEventEnum>(event: T, data: NotificationEventMap[T], userId: number, _config: ConsoleConfig) {
       console.log(`event received, type: ${event} data: ${JSON.stringify(data)}`);
     }
     
     async test(user: User, _config: ConsoleConfig) {
       console.log('test notification');
     }
   }
   ```

5. 将新的 adapter 注册到通知服务模块中。

   ```typescript {13}
   // notification.module.ts
   // see: https://github.com/nepsyn/minaplay/blob/master/packages/server/src/modules/notification/notification.module.ts
   @Module({
     imports: [/** ... */],
     providers: [
       NotificationService,
       NotificationMetaService,
       EmailAdapter,
       NotificationGateway,
       WsAdapter,
       ServerChanAdapter,
       TelegramAdapter,
       ConsoleAdapter,  // <-- add here
       NotificationConsumer,
     ],
     controllers: [/** ... */],
     exports: [/** ... */],
   })
   export class NotificationModule extends NotificationConfigurableModule {
     declare static register: typeof NotificationConfigurableModule.register;
     declare static registerAsync: typeof NotificationConfigurableModule.registerAsync;
   }
   ```
