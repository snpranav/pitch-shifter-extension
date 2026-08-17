/// <reference types="vite/client" />

// CSS imported with `?inline` comes back as a raw string, which we inject
// directly into the content-script Shadow DOM.
declare module '*.css?inline' {
  const content: string;
  export default content;
}
