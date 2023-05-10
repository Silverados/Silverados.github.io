import { getThemeConfig, defineConfig} from '@sugarat/theme/node'

const blogTheme = getThemeConfig({
  // 文章默认作者
  author: 'Silverados',
  // 友链
  friend: [
    {
      nickname: '粥里有勺糖',
      des: 'Vitepress theme',
      avatar:
        'https://img.cdn.sugarat.top/mdImg/MTY3NDk5NTE2NzAzMA==674995167030',
      url: 'https://sugarat.top'
    },
    {
      nickname: 'Vitepress',
      des: 'Vite & Vue Powered Static Site Generator',
      avatar:
        'https://img.cdn.sugarat.top/mdImg/MTY3NDk5NTI2NzY1Ng==674995267656',
      url: 'https://vitepress.vuejs.org/'
    }
  ],
  recommend: {
    showSelf: true
  },
  // 开启离线的全文搜索支持（如构建报错可注释下面的配置再次尝试）
  search: 'pagefind',
  // popover: {
  //   title: '公告',
  //   body: [
  //     {
  //       type: 'text',
  //       content: 'QQ交流群：681489336 🎉🎉'
  //     },
  //     { type: 'text', content: '👇公众号👇---👇 微信 👇' },
  //     {
  //       type: 'image',
  //       src: 'https://img.cdn.sugarat.top/mdImg/MTYxNTAxODc2NTIxMA==615018765210'
  //     },
  //     {
  //       type: 'text',
  //       content: '欢迎大家加群&私信交流'
  //     },
  //     {
  //       type: 'button',
  //       content: '博客',
  //       link: 'https://sugarat.top'
  //     }
  //   ],
  //   duration: 0
  // }
})

// https://vitepress.dev/reference/site-config
export default defineConfig({
  extends: blogTheme,
  vite: {
    optimizeDeps: {
      include: ['element-plus'],
      exclude: ['@sugarat/theme']
    }
  },
  title: "Silverados",
  description: "Silverados的个人博客",
  lastUpdated: true,
  head: [
    ['link', {rel: "icon", type: "image/png", href: `/favicon2.ico`}],
  ],
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: nav(),

    sidebar: {
      'java/datastructure': sidebarJavaDataStructure(),
      'java/algorithms': sidebarAlgorithms(),
      'java/netty': sidebarNetty(),
      'misc': sidebarMisc(),
      'blog': sidebarMisc(),
    },

    socialLinks: [
      {icon: 'github', link: 'https://github.com/Silverados/Silverados.github.io'}
    ],

    footer: {
      message: "Powered by Vitepress."
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
        {text: 'Netty', link: '/java/netty/Netty性能优化_Native_Transports'},
        {text: '算法', link: '/java/algorithms/README', activeMatch: '/java/algorithms/',}
      ]
    }, {
      text: '杂谈',
      link: '/misc/README'
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
        {text: '归并排序', link: '/java/algorithms/sorts/MergeSort'},
        {text: '快速排序', link: '/java/algorithms/sorts/QuickSort'},
      ]
    },

  ]
}

function sidebarMisc() {
  return [
    {
      text: '博客搭建',
      collapsed: false,
      items: [
        {text: 'Docsify博客搭建', link: '/blog/Docsify博客搭建.md'},
        {text: 'Docsify博客定制化', link: '/blog/Docsify博客定制化.md'},
        {text: '博客体验', link: '/blog/博客体验.md'},
      ]
    },
  ]
}

function sidebarNetty() {
  return [
    {
      text: 'Netty',
      collapsed: false,
      items: [
        {text: 'Native Transports', link: '/java/netty/Netty性能优化_Native_Transports.md'},
        {text: 'Netty TLS', link: '/java/netty/Netty_TLS'},
        {text: 'Netty案例一 EchoServer', link: '/java/netty/demo/demo1_echo'},
        {text: 'Netty ChannelOption', link: '/java/netty/Netty_ChannelOption'},
        {text: 'Netty ChannelOption拓展', link: '/java/netty/Netty_ChannelOption_extend'},
      ]
    },
  ]
}

