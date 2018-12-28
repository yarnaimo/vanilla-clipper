# 📃 Vanilla Clipper

![](https://img.shields.io/npm/v/vanilla-clipper.svg?style=for-the-badge)
![](https://img.shields.io/bundlephobia/minzip/vanilla-clipper.svg?style=for-the-badge)

> Vanilla Clipper is a Node.js library to save a _complete_ web page into a _standalone_ HTML file using Puppeteer.

-   All CSS stylesheets in the page will be embedded in `<style>` tags.
-   External resources (images, fonts, ...) will be embedded as **Base64** encoded strings.
-   Contents of `<iframe>` elements will be recursively clipped and embedded in the `srcdoc` attribute.

## Dependencies

-   Node.js (>= 8.10)
-   Chrome or Chromium (Latest version)

## Installation

```sh
yarn add vanilla-clipper
# or
npm i -S vanilla-clipper
```

## Usage

Note: If it fails to launch, try adding no-sandbox option (`-n`).

### CLI

-   Save https://github.com:

    ```sh
    vanilla-clipper https://github.com
    ```

-   Save `.tr-ItemList` element of https://qiita.com to `./clip` directory (Set browser language to Japanese):

    ```sh
    vanilla-clipper -s .tr-ItemList -d ./clip -l ja-JP https://qiita.com
    ```

-   Save https://twitter.com

    -   Login with `default` account in the config file:

        ```sh
        vanilla-clipper https://twitter.com
        ```

    -   Login with `sub` account in the config file:
        ```sh
        vanilla-clipper -a sub https://twitter.com
        ```

## Config file example

{YOUR_HOME_DIRECTORY}/.vanilla-clipper/config.js

```js
module.exports = {
    sites: [
        {
            url: 'twitter.com',
            accounts: {
                default: {
                    username: 'main', // or () => 'main'
                    password: 'password1',
                },
                sub: {
                    username: 'sub',
                    password: 'password2',
                },
            },
            login: [
                // [action, arg1, arg2, ...]
                ['goto', 'https://twitter.com/login'],
                [
                    'input',
                    'form.signin [type=text]', // selector
                    '$username', // => accounts.{SPECIFIED_ACCOUNT_LABEL}.username
                ],
                [
                    'input',
                    'form.signin [type=password]',
                    '$password', // => accounts.{SPECIFIED_ACCOUNT_LABEL}.password
                ],
                ['submit', 'form.signin [type=submit]'],
            ],
        },
    ],
}
```
