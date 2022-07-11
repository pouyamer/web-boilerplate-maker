const config = {
  html: {
    name: "index",
    extension: "html", // "html" / htm
    path: "./test",
    title: "Document", // Title in the Title tag
    jsFileNames: ["script"], // Array of js files (file names) to include in the html
    cssFileNames: ["style"] // Array of css files (file names) to include in the html
  },
  css: {
    name: "style",
    extension: "css", // "css" / scss / sass
    path: "./test",
    type: "css-normal" // "css-normal" / css-reset (See types.js)
  },
  js: {
    name: "script",
    extension: "js", // "js" / ts
    path: "./test",
    type: "js-normal" // "js-normal" / js-canvas (See types.js)
  }
}

module.exports = config
