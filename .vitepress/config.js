import { defineConfig } from 'vitepress'
import { getPosts } from './theme/serverUtils'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// 解決 ESM 環境下沒有 __dirname 的問題
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 每頁的文章數量
const pageSize = 10

// Google Analytics ID from environment variable
const googleAnalyticsId = process.env.GOOGLE_ANALYTICS_ID || ''

export default defineConfig({
  title: `evadzala's Blog`,
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
    config: (md) => {
      const defaultRender = md.renderer.rules.image || function (tokens, idx, options, env, self) {
        return self.renderToken(tokens, idx, options);
      };

      md.renderer.rules.image = (tokens, idx, options, env, self) => {
        const token = tokens[idx];
        const srcIndex = token.attrIndex('src');
        const url = token.attrs[srcIndex][1];
        const alt = token.content;

        // 匹配 HackMD 網址結構
        const hackMDMatch = url.match(/https:\/\/hackmd\.io\/_uploads\/([a-zA-Z0-9_-]+\.(jpg|jpeg|png|gif|webp))/);

        if (hackMDMatch) {
          const fileName = hackMDMatch[1];
          // 指向你專案中的 public/images 資料夾
          // 注意：路徑需根據你 config.js 的實際位置調整，通常是 ../public/images
          const localFilePath = path.resolve(__dirname, '../public/images', fileName);
          
          // 檢查檔案是否存在
          const exists = fs.existsSync(localFilePath);
          const finalSrc = exists ? `/images/${fileName}` : '/images/NoImage.png';

          return `<img src="${finalSrc}" alt="${alt}" loading="lazy">`;
        }

        return defaultRender(tokens, idx, options, env, self);
      };
    }
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
    socialLinks: [{ icon: 'github', link: 'https://github.com/evadzala/evadzala.github.io' }],
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
