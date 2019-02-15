# 📃 Vanilla Clipper

![](https://img.shields.io/npm/v/vanilla-clipper.svg?style=for-the-badge)
![](https://img.shields.io/bundlephobia/minzip/vanilla-clipper.svg?style=for-the-badge)

Vanilla Clipper is a Node.js library to _completely_ save a webpage to local with Puppeteer. You can save all the contents in the page such as **images, videos, CSS, web fonts, iframes, and Shadow DOMs** with one command.

## Dependencies

-   Node.js (>= 8.10)
-   Chrome or Chromium (Latest version)

## Installation

```sh
yarn global add vanilla-clipper
# or
npm i -g vanilla-clipper
```

## Usage

### CLI

Note: If it fails to launch, try adding `--no-sandbox` (`-n`) option.

-   Save https://example.com:

    ```sh
    vanilla-clipper https://example.com
    ```

-   Save `.timeline` element in https://example.com to `tech` directory (Set browser language to Japanese):

    ```sh
    vanilla-clipper -d tech -s .timeline -l ja-JP https://example.com
    ```

-   Login with `sub` account in the config file:

    ```sh
    vanilla-clipper -a sub https://example.com
    ```

See [here](/src/bin/clip.ts) for details of the options.

## 📂 Directory structure in ~/.vanilla-clipper

```
📂 .vanilla-clipper
   📂 pages
      📂 main
         📃 20190213-page1.html
         ︙
      📂 {SOME_FOLDER}
         📃 20190213-page2.html
         📃 20190214-page3.html
         ︙

   📂 resources
      📂 20190213
         📎 {ulid}.jpg
         📎 {ulid}.svg
         ︙
      📂 20190214
         📎 {ulid}.woff2
         ︙

   💎 resources.json
   💎 config.json
```

## ⚙️ Config file example

{YOUR_HOME_DIRECTORY}/.vanilla-clipper/config.js

```js
module.exports = {
    resource: { maxSize: 50 * 1024 * 1024 },
    sites: [
        {
            url: 'example.com', // site URL
            accounts: {
                default: {
                    // ↑ account label
                    username: 'main', // or () => 'main'
                    password: 'password1',
                },
                sub: {
                    // ↑ account label
                    username: 'sub_account',
                    password: 'password2',
                },
            },
            login: [
                // [action, arg1, arg2, ...]
                [
                    'goto',
                    'https://example.com/login', // URL
                ],
                [
                    'input',
                    'input[name="session[username_or_email]"]', // selector
                    '$username', // -> accounts.{ACCOUNT_LABEL}.username
                ],
                [
                    'input',
                    'input[name="session[password]"]', // selector
                    '$password', // -> accounts.{ACCOUNT_LABEL}.password
                ],
                [
                    'submit',
                    '[role=button]', // selector
                ],
            ],
        },
    ],
}
```
