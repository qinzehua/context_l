import * as React from 'react';

export type CompareProps<T extends React.ComponentType<any>> = (
  prevProps: Readonly<React.ComponentProps<T>>,
  nextProps: Readonly<React.ComponentProps<T>>,
) => boolean;


export default function createImmutable() {
  const ImmutableContext = React.createContext<number>(null);

  function useImmutableMark()  {
    return React.useContext(ImmutableContext);
  }

  function makeImmutable<T extends React.ComponentType<any>>(
    Component: T,
    shouldTriggerRender?: CompareProps<T>,
  ) {
    const ImmutableComponent = function(props: any, ref: any) {
      const renderTimesRef = React.useRef(0);
      const prevPropsRef = React.useRef(props);
      const mark = useImmutableMark();
      if (mark !== null) {
         return <Component {...props} ref={ref} />;
      }

      if(!shouldTriggerRender || shouldTriggerRender(prevPropsRef.current, props)) {
        renderTimesRef.current += 1;
      }

      prevPropsRef.current = props;

      return <ImmutableContext.Provider value={renderTimesRef.current}>
        <Component {...props}  ref={ref} />
      </ImmutableContext.Provider>;
    }
 
    return React.forwardRef(ImmutableComponent);
  }


  function responseImmutable<T extends React.ComponentType<any>>(
    Component: T,
    propsAreEqual?: CompareProps<T>,
  ) {

    const ImmutableComponent = function (props: any, ref: any) {
      useImmutableMark();
      return <Component {...props} ref={ref} />;
    };

    return React.memo(React.forwardRef(ImmutableComponent), propsAreEqual);
  }

  return {
    makeImmutable,
    responseImmutable,
    useImmutableMark,
  };
}