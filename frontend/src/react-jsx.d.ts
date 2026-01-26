/* Quick JSX shim for editor when @types/react isn't installed yet */
import * as React from 'react'

declare global {
  namespace JSX {
    type Element = React.ReactElement | null
    interface IntrinsicAttributes extends React.Attributes {}
    interface IntrinsicClassAttributes<T> {}
    interface IntrinsicElements {
      [elemName: string]: any
    }
  }
}

export {}
