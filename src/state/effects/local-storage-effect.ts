import { AtomEffect, DefaultValue } from 'recoil';

type PersistenceOptions<T> = {
  defaultValue?: T | DefaultValue;
  key: string;
  isValid: (value: T | DefaultValue) => boolean;
};

export const localStorageEffect = <T>({ defaultValue, key, isValid }: PersistenceOptions<T>) =>
  (({ setSelf, onSet, trigger }) => {
    if (trigger === 'get') {
      let value: DefaultValue | T = new DefaultValue();
      try {
        const rawValue = localStorage.getItem(key) || '{}';
        const parsedValue = JSON.parse(rawValue);
        if (isValid(parsedValue)) {
          value = parsedValue;
        } else if (defaultValue) {
          value = defaultValue;
        }
      } catch (err) {
        console.error(`Can't JSON.parse value from`, key);
        localStorage.removeItem(key);
      }
      setSelf(value);
    }

    onSet((value, _, isReset) => {
      if (isReset || !isValid(value)) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, JSON.stringify(value));
      }
    });
  }) as AtomEffect<T>;
