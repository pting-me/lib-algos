import { v4 as uuid } from 'uuid';

interface MockoutElement extends Element {
  dataset: {
    bind: string;
  };
}

export interface PublicObservable<T = any> {
  (): T;
  (s: T): void;
}

interface Observable<T = any> extends PublicObservable<T> {
  _id: string;
  _type: 'observable';
}

export interface PublicComputed<T = any> {
  (): T;
  (callback: () => T): void;
}

export interface Computed<T = any> extends PublicComputed<T> {
  _id: string;
  _type: 'computed';
  _fnString: string;
}

type Reactive = Computed | Observable;

interface Binding {
  name: string;
  element: Element;
  getValue: Reactive;
  dependencies: string[];
}

export type ViewModel = Record<string, Reactive>;

type BindingRecord = Record<string, Binding>;

const bindingRecord: BindingRecord = {};

const mapAllDependencies = () => {
  /**
   * This just searches variable names in the function text.
   * It's most definiely the wrong way to determine dependencies.
   * Knockout uses a combination of `arguments`, and requires dependencies
   * to be linked via `this`.
   */
  const addDependency = (computed: Computed) => {
    Object.entries(bindingRecord).forEach(([id, { name }]) => {
      const isMatch = computed._fnString?.match(`${name}()`) !== null;

      if (isMatch) {
        bindingRecord[id].dependencies.push(computed._id);
      }
    });
  };

  const bindingsToUpdate: string[] = [];

  Object.values(bindingRecord).forEach(({ getValue }) => {
    // Base observables have no dependencies
    // But set them up to be updated
    if (getValue._type === 'observable') {
      bindingsToUpdate.push(getValue._id);
      return;
    }

    addDependency(getValue);
  });

  updateBindings(bindingsToUpdate);
};

/**
 * Breadth First Search for updating dependencies
 */
const updateBindings = (bindingsToUpdate: string[]) => {
  const queue = [...bindingsToUpdate];
  while (queue.length > 0) {
    const binding = bindingRecord[queue.shift()!];
    const { dependencies, element, getValue } = binding;
    queue.push(...dependencies);

    if (element) {
      element.innerHTML = String(getValue());
    }
  }
};

export const applyBindings = (vm: ViewModel) => {
  const elementsWithDataBind =
    document.querySelectorAll<MockoutElement>('[data-bind]');

  Array.from(elementsWithDataBind).forEach((element) => {
    const [[, bindingName]] = [
      ...element.dataset.bind.matchAll(/text:\s*([A-Za-z$_][A-Za-z$_0-9]*)/g),
    ];

    const binding = vm[bindingName];

    if (binding === undefined) {
      throw new Error(`Binding with name "${bindingName}" cannot be found.`);
    }

    bindingRecord[binding._id] = {
      name: bindingName,
      element,
      getValue: binding,
      dependencies: [],
    };
  });

  mapAllDependencies();
};

export const createObservable = <T = any>(initValue?: T) => {
  let currentValue: T | undefined = initValue;
  const _id = uuid();

  const observable = ((...args: T[]) => {
    if (args.length === 0) {
      return currentValue;
    } else if (args.length === 1) {
      const [value] = args;
      currentValue = value;

      updateBindings([_id, ...bindingRecord[_id].dependencies]);
      return;
    }

    throw new Error('Too many parameters');
  }) as Observable<T>;

  observable._id = _id;
  observable._type = 'observable';

  return observable;
};

export const createComputed = <T = any>(fn: () => T) => {
  const computed = (() => {
    return fn();
  }) as Computed<T>;

  computed._id = uuid();
  computed._type = 'computed';
  computed._fnString = fn.toString();

  return computed;
};
