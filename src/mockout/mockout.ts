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

type Subscribable = Computed | Observable;

interface Binding {
  name: string;
  type: 'text';
  element: Element;
  subscribable: Subscribable;
  dependencies: string[];
}

export type ViewModel = Record<string, Subscribable>;

type BindingRecord = Record<string, Binding>;

const bindingRecord: BindingRecord = {};

/**
 * This is the "core" algorithm that uses Breadth First Search
 * to update dependencies. Its iterates through the `bindingRecord`,
 * to update elements, then adds all the dependencies to the update queue.
 */
const updateBindings = (bindingsToUpdate: string[]) => {
  const updateQueue = [...bindingsToUpdate];
  while (updateQueue.length > 0) {
    const binding = bindingRecord[updateQueue.shift()!];
    const { dependencies, element, subscribable } = binding;
    updateQueue.push(...dependencies);

    if (element) {
      element.innerHTML = String(subscribable());
    }
  }
};

/**
 * Initializes the binding record with all the dependencies.
 */
const mapAllDependencies = () => {
  /**
   * This just searches variable names in the function text.
   * It's most definitely the wrong way to determine dependencies.
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

  Object.values(bindingRecord).forEach(({ subscribable }) => {
    // Base observables have no dependencies,
    // but need to be setup for initial updates.
    if (subscribable._type === 'observable') {
      bindingsToUpdate.push(subscribable._id);
      return;
    }

    addDependency(subscribable);
  });

  updateBindings(bindingsToUpdate);
};

/**
 * Rough equivalent of `ko.applyBindings`. Currently only accepts `text` bindings.
 */
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
      type: 'text',
      element,
      subscribable: binding,
      dependencies: [],
    };
  });

  mapAllDependencies();
};

/**
 * Rough equivalent of `ko.observable`.
 * Will be exported as `observable`, but is named differently here
 * to prevent ambiguity.
 */
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

/**
 * Rough equivalent of `ko.computed`.
 * This implementation searches through the actual function `toString` contents
 * to determine dependencies, which is **very** incorrect, but is good enough
 * for demo purposes.
 */
export const createComputed = <T = any>(fn: () => T) => {
  const computed = (() => {
    return fn();
  }) as Computed<T>;

  computed._id = uuid();
  computed._type = 'computed';
  computed._fnString = fn.toString();

  return computed;
};
