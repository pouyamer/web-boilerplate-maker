const prompt = require("prompt-sync")({ sigint: true })
const fs = require("fs")
const path = require("path")
const config = require("./config")
const TYPES = require("./types")

// To use default config, try:
//  npm start -- --default or npm start -- -d
const isDefault = process.argv[2] === "--default" || process.argv[2] === "-d" // If the user wants to use the default config (using the flag --default or -d))
const platform = process.platform

const allPossibleCSSExtensions = ["css", "scss", "sass"]
const allPossibleJSExtensions = ["js", "jsx", "ts"]
const allPossibleJSTypes = [TYPES.JS_NORMAL, TYPES.JS_CANVAS]
const allPossibleCSSTypes = [TYPES.CSS_NORMAL, TYPES.CSS_RESET]

const isReservedBySystem = (name, platform) => {
  const windowsIllegalCharacters = [
    "*",
    ".",
    '"',
    "/",
    "\\",
    "[",
    "]",
    ":",
    ";",
    "|",
    ",",
    ">",
    "<",
    "?"
  ]

  const windowsIllegalNames = [
    "CON",
    "PRN",
    "AUX",
    "NUL",
    "COM1",
    "COM2",
    "COM3",
    "COM4",
    "COM5",
    "COM6",
    "COM7",
    "COM8",
    "COM9",
    "LPT1",
    "LPT2",
    "LPT3",
    "LPT4",
    "LPT5",
    "LPT6",
    "LPT7",
    "LPT8",
    "LPT"
  ]

  const linuxIllegalCharacters = ["/"]

  if (platform === "win32") {
    return (
      windowsIllegalCharacters.some(char => name.includes(char)) ||
      windowsIllegalNames
        .map(name => name.toLowerCase())
        .includes(name.toLowerCase())
    )
  }
}

const createFile = (path = ".", fileName, fileExtension, content = "") => {
  fs.writeFile(`${path}/${fileName}.${fileExtension}`, content, err => {
    console.log(err)
    return
  })
}

const getContent = type => {
  switch (type) {
    case TYPES.JS_NORMAL:
      return ""
    case TYPES.JS_CANVAS:
      return `const canvas = document.querySelector(".canvas")
        const ctx = canvas.getContext("2d")
        const size={width: 300, height: 300}
        canvas.width = size.width
        canvas.height = size.height`
    case TYPES.CSS_NORMAL:
      return ""
    case TYPES.CSS_RESET:
      return `*,
*::after,
*::before {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
a {
  text-decoration: none;
}
a:focus {
  outline: none;
}
ul {
  list-style: none;
}`
  }
}

const getHTMLContent = config => {
  const { html, css, js } = config
  const { title, jsFileNames, cssFileNames } = html

  const cssConfigFiles = Array.isArray(css) ? css : [css]
  const jsConfigFiles = Array.isArray(js) ? js : [js]

  const jsFiles = jsFileNames.map(name =>
    jsConfigFiles.find(file => file.name === name)
  )

  const cssFiles = cssFileNames.map(name =>
    cssConfigFiles.find(file => file.name === name)
  )

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    ${
      cssFiles
        ?.map(
          file =>
            `<link rel="stylesheet" href="${file.path}/${file.name}.${file.extension}">`
        )
        .join("\n") || ""
    }
  </head>
  <body>

    ${
      jsFiles
        ?.map(
          file =>
            `<script src="${file.path}/${file.name}.${file.extension}"></script>`
        )
        .join("\n") || ""
    }
  </body>
</html>`
}

const getAvailablityObject = (message, isExtensionOrPath, fallBackValue) => {
  // if it's not isExtensionOrPath, it's a file name and we need to check if it's a reserved name
  // fallBackValue is the value to return if the user doesn't enter a value
  const text = prompt(message)
  return isExtensionOrPath
    ? { text: text || fallBackValue, available: true }
    : {
        text: text || fallBackValue,
        available: !isReservedBySystem(text, platform)
      }
}

const getName = (
  promptMessage,
  fallBackValue,
  isExtensionOrPath,
  allPossibleValues = [],
  allImpossibleValues = []
) => {
  let nameAvailable = false
  while (!nameAvailable) {
    const { text, available } = getAvailablityObject(
      `${promptMessage} (${fallBackValue}) `,
      isExtensionOrPath,
      fallBackValue
    )

    if (!available) console.log(`Name "${text}" is reserved by system`)
    else if (
      !allPossibleValues.includes(text) &&
      allPossibleValues.length > 0
    ) {
      console.log(`Name "${text} can't be used`)
      console.log(`Possible values: ${allPossibleValues.join(", ")}`)
    } else if (allImpossibleValues.includes(text)) {
      console.log(`Name "${text}" can't be used`)
      console.log(`Impossible values: ${allImpossibleValues.join(", ")}`)
    } else {
      nameAvailable = true
      return text
    }
  }
}

const makeDonePromptOnYesOrNo = (
  message,
  cancelMessage,
  InvalidMessage,
  onYes = () => {},
  onNo = () => {},
  onInvalid = () => {}
) => {
  let isInputValid = false
  while (!isInputValid) {
    const okAnswer = prompt(message)
    if (okAnswer === "y") {
      isInputValid = true
      onYes()
    } else if (okAnswer === "n") {
      isInputValid = true
      onNo()
      console.log("\n")
      console.log(cancelMessage)
    } else {
      onInvalid()
      console.log(`\n${InvalidMessage}`)
    }
  }
}

const setCssConfigBasedOnPrompts = () => {
  let isSettingDone = false
  let cssFiles = []

  while (!isSettingDone) {
    const cssNames = cssFiles.map(file => file.name.toLowerCase())
    console.log({ cssNames })
    const name = getName(
      "Name of the css file:",
      "style",
      false,
      [],
      cssNames
    ).toLowerCase()
    const path = getName("Path of the css file:", ".", true)

    const type = getName(
      "Type of the css file:",
      "css-normal",
      false,
      allPossibleCSSTypes
    )
    const extension = getName(
      "Extension of the css file:",
      "css",
      true,
      allPossibleCSSExtensions
    )

    console.log("\n")

    // Asks if the user is done with the current CSS file
    makeDonePromptOnYesOrNo(
      `Name: ${name} \nPath: ${path} \nType: ${type} \nExtension: ${extension} \nAre you sure? (y/n) `,
      "cancelled",
      "Invalid answer",
      () => {
        cssFiles.push({
          name,
          path,
          type,
          extension
        })
      }
    )

    console.log("\n")
    console.log({ cssFiles })

    // Asks if the user is done with all CSS files
    makeDonePromptOnYesOrNo(
      "Add another File? (y/n) ",
      "Cancelled",
      "Didn't catch that. Try again Later",
      () => {},
      () => {
        isSettingDone = true
      }
    )
  }
  return cssFiles
}

const setJSConfigBasedOnPrompts = () => {
  let isSettingDone = false
  let jsFiles = []

  while (!isSettingDone) {
    const jsNames = jsFiles.map(file => file.name.toLowerCase())
    console.log({ jsNames })
    const name = getName(
      "Name of the js file:",
      "script",
      false,
      [],
      jsNames
    ).toLowerCase()
    const path = getName("Path of the js file:", ".", true)
    const type = getName(
      "Type of the js file:",
      TYPES.JS_NORMAL,
      false,
      allPossibleJSTypes
    )
    const extension = getName(
      "Extension of the js file:",
      "js",
      true,
      allPossibleJSExtensions
    )

    console.log("\n")

    // Asks if the user is done with the current CSS file
    makeDonePromptOnYesOrNo(
      `Name: ${name} \nPath: ${path} \nType: ${type} \nExtension: ${extension} \nAre you sure? (y/n) `,
      "cancelled",
      "Invalid answer\n",
      () => {
        jsFiles.push({
          name,
          path,
          type,
          extension
        })
      }
    )

    console.log("\n")
    console.log({ jsFiles })

    // Asks if the user is done with all CSS files
    makeDonePromptOnYesOrNo(
      "Add another File? (y/n) ",
      "Cancelled",
      "Didn't catch that. Try again Later",
      () => {},
      () => {
        isSettingDone = true
      }
    )
  }
  return jsFiles
}

const createAllFiles = config => {
  const { html, css, js } = config
  // if it's not an array make it with one member
  const htmlFiles = Array.isArray(html) ? html : [html]
  const cssFiles = Array.isArray(css) ? css : [css]
  const jsFiles = Array.isArray(js) ? js : [js]

  jsFiles.forEach(file =>
    createFile(file.path, file.name, file.extension, getContent(file.type))
  )

  cssFiles.forEach(file =>
    createFile(file.path, file.name, file.extension, getContent(file.type))
  )

  htmlFiles.forEach(file =>
    createFile(file.path, file.name, file.extension, getHTMLContent(config))
  )
}

// App Starts here:
if (isDefault) createAllFiles(config)
else {
  const newConfig = {
    css: setCssConfigBasedOnPrompts(),
    js: setJSConfigBasedOnPrompts()
  }

  // make needed directories
  // check if directory exists
  // if not create it

  console.log({ ...config, ...newConfig })
  createAllFiles({ ...config, ...newConfig })
}
// createAllFiles(config)

// TODO: Add "directory doesn't exist, do you want to create it?"
// TODO: Add setHTMLConfigBasedOnPrompts()
