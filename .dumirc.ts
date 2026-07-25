import { defineConfig } from 'dumi';
import { resolve } from 'path';

export default defineConfig({
  title: 'Vauid Components',
  locales: [
    { id: 'zh-CN', name: '中文' },
  ],
  outputPath: 'docs-dist',
  base: '/vauid-components/',
  themeConfig: {
    nav: [
      { title: '首页', link: '/' },
      { title: '组件', link: '/components/' },
      { title: '布局引擎', link: '/layout/' },
    ],
    sidebar: {
      '/components/': [
        {
          title: '通用',
          children: [
            '/components/button',
            '/components/tag',
            '/components/input',
            '/components/dropdown',
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
          children: [
            '/components/controller',
          ],
        },
        {
          title: '媒体',
          children: [
            '/components/video-tile',
            '/components/audio-tile',
            '/components/note-tile',
          ],
        },
      ],
      '/layout/': [
        {
          title: '布局引擎',
          children: [
            '/layout/overview',
            '/layout/api',
          ],
        },
      ],
    },
  },
  resolve: {
    atomDirs: [],
  },
  alias: {
    'vauid-components': resolve(__dirname, './components'),
  },
});
