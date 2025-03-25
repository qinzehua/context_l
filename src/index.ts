import type { SelectorContext } from './context';
import { createContext, useContext } from './context';
import createImmutable from './Immutable';

const { makeImmutable, responseImmutable, useImmutableMark } = createImmutable();

export {
  createContext,
  useContext,
  createImmutable,
  makeImmutable,
  responseImmutable,
  useImmutableMark,
};
export type { SelectorContext };