# ChangeLog

## v0.2.1 [2024-05-14]

### feature

- [server] Add `savePath` in `RuleFileDescriptor` for custom media save path
- [server] Add rule hook delegates for plugin parsers

### change

- [server] Do not exit program on unhandled rejection
- [server&web] Optimize notification service APIs & Add test APIs

### fix

- [web] Multi-items loader did not work properly
- [server&web] Minor bugs fix

## v0.2.0 [2024-04-29]

### feature

- [server] Add `ServerChan` notification service
- [server] Add `Telegram` notification service
- [server&web] Add plugin parser for 3rd-party RSS sources

### change

- [web] Change layout of left-side navigation bar

### fix

- [web] Service worker is not working properly
- [server&web] Minor bugs fix


## v0.1.1 [2024-04-12]

### feature

- [server] Add PluginParser for sources parsing in MinaPlay plugins
- [server&web] Add `MarkdownText` message type
- [server] Add MinaPlay update check API
- [server] Add `Network` & `Local` file sources
- [server] Add version update check

### change

- [server&web] Remove `ConsumableFeedback` message type
- [server] Remove enum types in db models
- [web] Redesign colors in dark mode

### fix

- [server&web] Minor bugs fix
