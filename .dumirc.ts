import { defineConfig } from 'dumi';
import type { IThemeConfig } from 'dumi/dist/client/theme-api/types';
import { resolve } from 'path';

const isProd = process.env.NODE_ENV === 'production';

/**
 * dumi 的 ISidebarItem 类型仅收录 { title, link } 对象（title 必填），
 * 运行时实际支持 string 简写（自动取文档 frontmatter.title）。
 * 这里用宽松类型维护配置，themeConfig.sidebar 处单点断言回正。
 */
type SidebarItem = string | { title?: string; link: string };
type SidebarGroup = { title?: string; children: SidebarItem[] };

const SIDEBAR: Record<string, SidebarGroup[]> = {
  '/components/': [
    {
      title: '通用',
      children: [
        '/components/button',
        '/components/tag',
        '/components/input',
        '/components/dropdown',
        '/components/select',
        '/components/trigger',
      ],
    },
    {
      title: '参会者',
      children: [
        '/components/participant-item',
        '/components/avatar',
        '/components/role',
        '/components/participant-name',
        '/components/participant-num',
      ],
    },
    {
      title: '状态',
      children: [
        '/components/during',
        '/components/focus',
        '/components/fullscreen',
        '/components/raisehand',
        '/components/network',
      ],
    },
    {
      title: '控制器',
      children: ['/components/controller'],
    },
    {
      title: '媒体',
      children: [
        '/components/video-tile',
        '/components/audio-tile',
        '/components/note-tile',
      ],
    },
    {
      title: '远程协作',
      children: ['/components/remote-support'],
    },
  ],
  '/layout/': [
    {
      title: '布局引擎',
      children: [
        '/layout/overview',
        '/layout/api',
        '/layout/custom-layout',
        '/layout/thumbnail',
      ],
    },
  ],
  '/ctx/': [
    {
      title: '上下文',
      children: ['/ctx'],
    },
  ],
};

export default defineConfig({
  title: 'Vauid Components',
  locales: [
    { id: 'zh-CN', name: '中文' },
  ],
  outputPath: 'docs-dist',
  base: isProd ? '/vauid-components/' : '/',
  publicPath: isProd ? '/vauid-components/' : '/',
  // 注入 SVG favicon，替换浏览器默认请求的 /favicon.ico
  links: [
    {
      rel: 'icon',
      type: 'image/svg+xml',
      href: isProd ? '/vauid-components/favicon.svg' : '/favicon.svg',
    },
    {
      rel: 'alternate icon',
      type: 'image/svg+xml',
      href: isProd ? '/vauid-components/favicon.svg' : '/favicon.svg',
    },
    {
      rel: 'apple-touch-icon',
      type: 'image/svg+xml',
      href: isProd ? '/vauid-components/favicon.svg' : '/favicon.svg',
    },
  ],
  themeConfig: {
    prefersColor: { default: 'dark', switch: true },
    logo: '/favicon.svg',
    nav: [
      { title: '首页', link: '/' },
      { title: '组件', link: '/components/' },
      { title: '布局引擎', link: '/layout/' },
      { title: '上下文', link: '/ctx/' },
    ],
    sidebar: SIDEBAR as unknown as IThemeConfig['sidebar'],
  },
  resolve: {
    atomDirs: [],
  },
  alias: {
    'vauid-components': resolve(__dirname, './components'),
  },
});
