const _Embed = require('@editorjs/embed')

const regex = new RegExp(`https?:\\/\\/${location.host}\\/articles\\/(\\w+)`)

const config = {
    services: {
        fraisArticle: {
            regex,
            embedUrl: '<%= remote_id %>',
            html: '<div class="article-embed"></div>',
            // height: 300,
            // width: 600,
            // id: groups => groups.join('/embed/'),
        },
    },
}

export const Embed = {
    class: _Embed,
    config,
}
