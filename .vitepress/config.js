import { defineConfig } from 'vitepress'

import { getPosts } from './theme/serverUtils'

// 每頁的文章數量
const pageSize = 10

// Google Analytics ID from environment variable
const googleAnalyticsId = process.env.GOOGLE_ANALYTICS_ID || ''

export default defineConfig({
  title: `evadzala's notes`,
  base: '/',
  outDir: 'dist',
  cacheDir: './node_modules/vitepress_cache',
  description:
    '我是evadzala，我會在這裡紀錄工作上的筆記、分享生活及想法',
  // https://vitepress.dev/zh/reference/default-theme-config#lastupdated
  lastUpdated: true,
  ignoreDeadLinks: true,
  srcExclude: ['README.md'],
  vite: {
    server: { port: 5000 },
  },
  markdown: {
    image: {
      lazyLoading: true,
    },
  },
  sitemap: {
    hostname: 'https://evadzala.github.io/',
  },

  head: [
    [
      'script',
      {
        async: true,
        src: `https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}`,
      },
    ],
    [
      'script',
      {},
      `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${googleAnalyticsId}');
      `,
    ],
  ],

  transformPageData(pageData) {
    const head = []
    // TODO: 應該作為參數
    const defaultOGImage = 'https://evadzala.github.io/logo.png'

    if (pageData.frontmatter.meta) {
      pageData.frontmatter.meta.forEach(item => {
        if (item.property && item.content) {
          head.push([
            'meta',
            { property: item.property, content: item.content },
          ])
        } else if (item.name && item.content) {
          head.push(['meta', { name: item.name, content: item.content }])
        }
      })
    } else {
      head.push([
        'meta',
        {
          property: 'og:image',
          content: defaultOGImage,
        },
      ])
    }

    if (head.length > 0) {
      pageData.frontmatter.head = (pageData.frontmatter.head || []).concat(head)
    }
  },

  themeConfig: {
    posts: await getPosts(pageSize),
    // copyright url
    siteUrl: 'https://evadzala.github.io',
    // copyright logo
    // footerLogo: 'logo.webp',
    // https://vitepress.dev/zh/reference/default-theme-nav
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Category', link: '/pages/category' },
      { text: 'Archives', link: '/pages/archives' },
      { text: 'Tags', link: '/pages/tags' },
      { text: 'About', link: '/pages/about' },
    ],
    socialLinks: [{ icon: 'github', link: 'https://github.com/evadzala' }],
    search: {
      provider: 'local',
    },
    // https://vitepress.dev/zh/reference/default-theme-config#outline
    outline: [1, 3],
    lastUpdated: {
      formatOptions: {
        dateStyle: 'short',
      },
    },
  },
})
