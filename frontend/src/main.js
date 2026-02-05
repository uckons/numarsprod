import { createApp } from "vue"
import { createPinia } from "pinia"
import App from "./App.vue"
import router from "./router"

import "./theme/black-gold.css"
import "./assets/theme.css"
// Tambahkan import tema swal di sini:
import '@/styles/swal-theme.css'
import Swal from "sweetalert2"
window.Swal = Swal
const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount("#app")