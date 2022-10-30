type JsxNode = any;

export interface Root {
  render(children: JsxNode): void;
}

let virtualDom = null;

export const createRoot = (container: Element) => {
  const render = (children: JsxNode) => {
    virtualDom = children.cloneNode(true);
    console.dir(virtualDom);
    console.dir(children);
    container.appendChild(children);
  };

  const root: Root = {
    render,
  };

  return root;
};

type UpdateFunction<T> = (prevValue: T) => T;
type SetStateParam<T> = T | UpdateFunction<T>;

const isUpdateFunction = <T>(
  valueOrFunction: SetStateParam<T>
): valueOrFunction is UpdateFunction<T> => {
  return typeof valueOrFunction === 'function';
};

export const useState = <T = any>(initValue?: T) => {
  let value = initValue;

  return [
    value,
    (input) => {
      if (isUpdateFunction(input)) {
        value = input(value);
        console.log('updated with fn', value);
      } else {
        value = input;
        console.log('updated with value', value);
      }
    },
  ] as [T, (newValue: any) => void];
};
