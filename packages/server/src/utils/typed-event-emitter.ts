import { EventEmitter } from 'node:events';

type EventMap = Record<string | symbol, (...args: any[]) => any>;
type EventKey<T extends EventMap> = Extract<keyof T, string | symbol> | string | symbol;

export class TypedEventEmitter<T extends EventMap = {}> extends EventEmitter {
  addListener<K extends EventKey<T>>(eventName: K, listener: T[K]): this {
    return super.addListener(eventName, listener);
  }

  on<K extends EventKey<T>>(eventName: K, listener: T[K]): this {
    return super.on(eventName, listener);
  }

  once<K extends EventKey<T>>(eventName: K, listener: T[K]): this {
    return super.once(eventName, listener);
  }

  removeListener<K extends EventKey<T>>(eventName: K, listener: T[K]): this {
    return super.removeListener(eventName, listener);
  }

  off<K extends EventKey<T>>(eventName: K, listener: T[K]): this {
    return super.off(eventName, listener);
  }

  removeAllListeners<K extends EventKey<T>>(event?: K): this {
    return super.removeAllListeners(event);
  }

  listeners<K extends EventKey<T>>(eventName: K): T[K][] {
    return super.listeners(eventName) as T[K][];
  }

  rawListeners<K extends EventKey<T>>(eventName: K): T[K][] {
    return super.rawListeners(eventName) as T[K][];
  }

  emit<K extends EventKey<T>>(eventName: K, ...args: Parameters<T[K]>): boolean {
    return super.emit(eventName, ...args);
  }

  listenerCount<K extends EventKey<T>>(eventName: K): number {
    return super.listenerCount(eventName);
  }

  prependListener<K extends EventKey<T>>(eventName: K, listener: T[K]): this {
    return super.prependListener(eventName, listener);
  }

  prependOnceListener<K extends EventKey<T>>(eventName: K, listener: T[K]): this {
    return super.prependOnceListener(eventName, listener);
  }
}
