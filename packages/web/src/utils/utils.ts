import { MinaPlayMessage } from '@/api/interfaces/message.interface';

export function openUrl(url: string) {
  const a = document.createElement('a');
  a.href = url;
  a.target = '_blank';
  a.referrerPolicy = 'noreferrer';
  a.click();
}

export function debounce<T extends (...args: any[]) => any>(fn: T, delay: number, immediate = false) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let isInvoke = false;

  function _debounce(this: ThisType<T>, ...args: Parameters<T>) {
    if (timer) clearTimeout(timer);

    if (immediate && !isInvoke) {
      fn.apply(this, args);
      isInvoke = true;
      timer = setTimeout(() => {
        isInvoke = false;
      }, delay);
    } else {
      timer = setTimeout(() => {
        fn.apply(this, args);
        isInvoke = false;
      }, delay);
    }
  }

  _debounce.cancel = function () {
    if (timer) clearTimeout(timer);
    timer = undefined;
    isInvoke = false;
  };

  return _debounce;
}

export function copyContent(content: string) {
  return navigator.clipboard.writeText(content);
}

export function selectFile(accept: string, multiple: boolean, onSelected: (files: File[]) => any) {
  const el = document.createElement('input');
  el.accept = accept;
  el.type = 'file';
  el.multiple = multiple;
  el.onchange = async (e) => {
    const files = (e.target as any).files;
    if (files && files.length > 0) {
      await onSelected(files);
    }
  };
  el.click();
}

export function getFullUrl(uri: string) {
  return uri.startsWith('/') ? `${window.origin}${uri}` : uri;
}

export function canRender(message: MinaPlayMessage) {
  return [
    'Text',
    'NetworkImage',
    'Base64Image',
    'ConsumableGroup',
    'Action',
    'Timeout',
    'Pending',
    'ResourceSeries',
    'ResourceMedia',
  ].includes(message.type);
}
