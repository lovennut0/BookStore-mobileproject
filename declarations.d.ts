// Allow importing image files in TypeScript files
declare module '*.png' {
  const value: any;
  export default value;
}

declare module '*.jpg' {
  const value: any;
  export default value;
}

declare module '*.jpeg' {
  const value: any;
  export default value;
}

declare module '*.gif' {
  const value: any;
  export default value;
}

// For SVGs you may want a different shape depending on your setup.
declare module '*.svg' {
  const content: any;
  export default content;
}
