const _ImageTool = require('@editorjs/image')

const config = {
    uploader: {
        // uploadByFile(file) {
        //     return MyAjax.upload(file).then(() => {
        //         return {
        //             success: 1,
        //             file: {
        //                 url:
        //                     'https://codex.so/upload/redactor_images/o_80beea670e49f04931ce9e3b2122ac70.jpg',
        //                 // any other image data you want to store, such as width, height, color, extension, etc
        //             },
        //         }
        //     })
        // },
        // uploadByUrl(url) {
        //     return MyAjax.upload(file).then(() => {
        //         return {
        //             success: 1,
        //             file: {
        //                 url:
        //                     'https://codex.so/upload/redactor_images/o_e48549d1855c7fc1807308dd14990126.jpg',
        //                 // any other image data you want to store, such as width, height, color, extension, etc
        //             },
        //         }
        //     })
        // },
    },
}

export const ImageTool = {
    class: _ImageTool,
    config,
}
