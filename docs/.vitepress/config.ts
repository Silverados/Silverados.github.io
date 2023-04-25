import {defineConfig} from 'vitepress'
base: '/Silverados.github.io/'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Silverados",
  description: "Silverados的个人博客",
  lastUpdated: true,
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: nav(),

    sidebar: {
      'java/datastructure': sidebarJavaDataStructure(),
      'java/algorithms': sidebarAlgorithms(),
    },

    socialLinks: [
      {icon: 'github', link: 'https://github.com/Silverados/Silverados.github.io'}
    ],

    footer: {
      message: "Thanks to Vuepress."
    },

    editLink: {
      pattern: 'https://github.com/Silverados/Silverados.github.io/edit/main/docs/:path',
      text: 'Edit this page on GitHub'
    },
    lastUpdatedText: '上次更新的时间：',
    search: {
      provider: 'local',
    },
  }
})

function nav() {
  return [
    {
      text: 'Java',
      items: [
        {text: '数据结构', link: '/java/datastructure/ArrayList'},
        {text: 'Netty', link: '/java/netty/'},
        {text: '算法', link: '/java/algorithms/README', activeMatch: '/java/algorithms/',}
      ]
    }
  ]
}

function sidebarJavaDataStructure() {
  return [
    {
      text: '数据结构源码分析', items: [
        {text: 'ArrayList', link: '/java/datastructure/ArrayList'},
        {text: 'HashMap', link: '/java/datastructure/HashMap'},
      ]
    },
  ]
}

function sidebarAlgorithms() {
  return [
    {
      text: '排序算法',
      collapsed: false,
      link: '/java/algorithms/sorts/README',
      items: [
        {text: '插入排序', link: '/java/algorithms/sorts/InsertSort'},
        {text: '冒泡排序', link: '/java/algorithms/sorts/BubbleSort'},
        {text: '选择排序', link: '/java/algorithms/sorts/SelectSort'},
        {text: '计数排序', link: '/java/algorithms/sorts/CountSort'},
      ]
    },

  ]
}