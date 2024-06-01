import { AtomEffect } from 'recoil';

export const logEffect = <T>(msg?: string) =>
  (({ onSet }) => {
    onSet((value: T) => {
      console.log(msg || 'log:', value);
    });
  }) as AtomEffect<T>;
