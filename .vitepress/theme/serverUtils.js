import fs from 'fs-extra'
import { globby } from 'globby'
import matter from 'gray-matter'
import { resolve } from 'path'
import axios from 'axios'
import path from 'path'

async function getPosts(pageSize) {
  const paths = await globby(['posts/**.md'])
  const publicImagesDir = resolve('./public/images')
  const defaultImage = '/images/NoImage.png' // 預設圖片路徑

  // 確保圖片資料夾存在
  await fs.ensureDir(publicImagesDir)

  const posts = await Promise.all(
    paths.map(async (item) => {
      let content = await fs.readFile(item, 'utf-8')
      
      // 1. 匹配 HackMD 圖片的 Regex
      const hackMDImgRegex = /https:\/\/hackmd\.io\/_uploads\/([a-zA-Z0-9]+\.(jpg|jpeg|png|gif|webp))/g
      
      // 2. 找出所有匹配的圖片並進行處理（下載或確認存在）
      const matches = [...content.matchAll(hackMDImgRegex)]
      
      for (const match of matches) {
        const fullUrl = match[0]
        const fileName = match[1]
        const localPath = path.join(publicImagesDir, fileName)

        // 如果本地沒有這張圖，嘗試下載
        if (!(await fs.pathExists(localPath))) {
          // console.log(`正在下載新圖片: ${fileName}...`)
          try {
            const response = await axios.get(fullUrl, { 
              responseType: 'arraybuffer',
              timeout: 5000 // 設定超時，避免卡死
            })
            await fs.writeFile(localPath, response.data)
            console.log(`下載成功: ${fileName}`)
          } catch (err) {
            // console.error(`下載失敗: ${fullUrl}，將使用預設圖。錯誤: ${err.message}`)
            // 下載失敗不需特別處理，下方的替換邏輯會檢查檔案是否存在
          }
        }
      }

      // 3. 關鍵：動態替換內容中的網址
      // 我們使用 replace 的 callback 形式來逐一檢查檔案是否真的存在於本地
      const updatedContent = content.replace(hackMDImgRegex, (match, fileName) => {
        const localFilePath = path.join(publicImagesDir, fileName)
        
        // 同步檢查檔案是否存在 (因為 replace callback 不支援 async)
        // 或是我們剛才已經盡力下載了，若現在本地有檔案就用本地路徑，否則用 NoImage
        if (fs.existsSync(localFilePath)) {
          return `/images/${fileName}`
        } else {
          return defaultImage
        }
      })

      const { data } = matter(updatedContent)
      data.date = _convertDate(data.date)

      return {
        frontMatter: data,
        regularPath: `/${item.replace('.md', '.html')}`,
      }
    }),
  )
  
  posts.sort(_compareDate)

  // 生成分頁頁面
  const total = posts.length
  await generatePaginationPages(total, pageSize)

  return posts
}

async function generatePaginationPages(total, pageSize) {
  const pagesNum =
    total % pageSize === 0 ? total / pageSize : parseInt(total / pageSize) + 1
  const paths = resolve('./')
  if (total > 0) {
    for (let i = 1; i < pagesNum + 1; i++) {
      const page = `
---
page: true
title: ${i === 1 ? '' : 'page ' + i}
aside: false
---
<script setup>
import Page from "./.vitepress/theme/components/Page.vue";
import { useData } from "vitepress";
const { theme } = useData();
const posts = theme.value.posts.slice(${pageSize * (i - 1)},${pageSize * i})
</script>
<Page :posts="posts" :pageCurrent="${i}" :pagesNum="${pagesNum}" />
`.trim()
      const file = paths + `/page_${i}.md`
      await fs.writeFile(file, page)
    }
  }
  await fs.move(paths + '/page_1.md', paths + '/index.md', { overwrite: true })
}

function _convertDate(date = new Date().toString()) {
  const json_date = new Date(date).toJSON()
  return json_date.split('T')[0]
}

function _compareDate(obj1, obj2) {
  return obj1.frontMatter.date < obj2.frontMatter.date ? 1 : -1
}

export { getPosts }