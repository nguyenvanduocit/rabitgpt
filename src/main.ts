import { createApp } from 'vue'
import ElementPlus from 'element-plus'

import './styles/modern-normalize.css'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import '@vue-flow/controls/dist/style.css'
import '@vue-flow/node-resizer/dist/style.css'
import 'element-plus/dist/index.css'
import './styles/index.styl'

// @ts-ignore-next-line
import App from './App.vue'

createApp(App).use(ElementPlus).mount('#app')
