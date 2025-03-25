import useEvent from 'rc-util/lib/hooks/useEvent';
import useLayoutEffect from 'rc-util/lib/hooks/useLayoutEffect';
import isEqual from 'rc-util/lib/isEqual';
import * as React from 'react';
import { unstable_batchedUpdates } from 'react-dom';

export interface Selector<ContextProps, SelectorProps = ContextProps> {
  (value: ContextProps): SelectorProps;
}

export interface Trigger<ContextProps> {
  (value: ContextProps): void;
}

export type Listeners<ContextProps> = Set<Trigger<ContextProps>>

export interface Context<ContextProps> {
  getValues: () => ContextProps;
  listeners: Listeners<ContextProps>;
}

export interface ContextSelectorProviderProps<ContextProps> {
  value: ContextProps;
  children: React.ReactNode;
}

export interface SelectorContext<ContextProps>{
  Context: React.Context<Context<ContextProps>>;
  Provider: React.ComponentType<ContextSelectorProviderProps<ContextProps>>;
  defaultValue: ContextProps;
}

export function createContext<ContextProps>(defaultValue: ContextProps): SelectorContext<ContextProps>{
   const Context = React.createContext<Context<ContextProps>>(undefined);
   
   const Provider = ({children, value}: ContextSelectorProviderProps<ContextProps>) => {
    const valueRef = React.useRef(value);
    valueRef.current = value;
    const [context] = React.useState<Context<ContextProps>>(() => ({
      getValues: () => valueRef.current,
      listeners: new Set(),
    }));

    useLayoutEffect(() => {
      unstable_batchedUpdates(() => {
        context.listeners.forEach(listener => {
          listener(value);
        });
      });
    }, [value]);

    return <Context.Provider value={context}>{children}</Context.Provider>
   }

    return {
      Context,
      Provider,
      defaultValue,
    }
}

export function useContext<ContextProps>(
  holder: SelectorContext<ContextProps>
): ContextProps;

export function useContext<ContextProps, SelectorValue>(
  holder: SelectorContext<ContextProps>,
  selector: Selector<ContextProps, SelectorValue>
): SelectorValue;

export function useContext<ContextProps, SelectorValue extends Partial<ContextProps>>(
  holder: SelectorContext<ContextProps>,
  selector: (keyof SelectorValue) []
): SelectorValue;

export function useContext<ContextProps, PropName extends keyof ContextProps>(
  holder: SelectorContext<ContextProps>,
  selector: PropName
): ContextProps[PropName];

export function useContext<ContextProps, SelectorValue>(
  holder: SelectorContext<ContextProps>,
  selector?: Selector<ContextProps, SelectorValue> | (keyof ContextProps) [] | keyof ContextProps
) {

  const eventSelector = useEvent<Selector<ContextProps, any>>(
    typeof selector === 'function' 
    ? 
    selector 
    : 
    (ctx) => {
      if(!selector) {
        return ctx;
      }

      if(!Array.isArray(selector)){
        return ctx[selector];
      }

      const result: any = {} as SelectorValue;
      selector.forEach(key => {
        (result as any)[key] = ctx[key];
      }
      )
      return result;
    }
  )

  const context = React.useContext(holder.Context);
  const { getValues, listeners } = context;
  const value = eventSelector(getValues() ?? holder.defaultValue);
  const [, forceUpdate] = React.useState({});

  useLayoutEffect(() => {
    if(!context)
      return;

    function trigger(nextValue: ContextProps) {
      const newValue = eventSelector(nextValue);
      if(!isEqual(value, newValue, true)) {
        forceUpdate({});
      }
    }

    listeners.add(trigger);

    return () => {
      listeners.delete(trigger);
    }
  }, [context, value])

  return value;
}