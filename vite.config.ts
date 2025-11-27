// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
// ========== 1. 定义模拟 Vue DevTools 的 Vite 插件 ==========
import type { PluginOption, ViteDevServer } from 'vite'
const mockVueDevTools = (options?: any): PluginOption => {
return {
name: 'mock-vite-plugin-vue-devtools',
// （可选）在 Vite 开发服务器启动时打印提示
configureServer(server: ViteDevServer) {
console.log('🎭 Mock Vue DevTools enabled (浏览器需安装对应扩展)')
// 这里可以写一些服务端中间件、热更新逻辑等，示例仅打印日志
},
// （可选）JSX / Vue SFC 转换时的钩子（这里演示返回 null 表示不转换）
transform(code, id) {
// 若你需要对特定文件做 AST 变换，可在此编写逻辑；否则返回 null 表示跳过
return null
}
// 也可以根据需要添加其他 Vite 插件钩子，比如 handleHotUpdate、buildStart 等
}
}
// ========== 2. 导出 Vite 配置 ==========
export default defineConfig({
plugins: [
vue(), // Vue 基础插件
vueJsx(), // Vue JSX 支持
mockVueDevTools() // 我们自定义的“模拟 Vue DevTools”插件
],
// 其他 Vite 配置项（如 resolve、build、server...）按需添加
server: {
port: 3000, // 开发服务器端口
open: true // 启动后自动打开浏览器
},
build: {
outDir: 'dist' // 生产构建输出目录
}
})