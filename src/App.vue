<script setup>
import Button from 'primevue/button'
import Menubar from 'primevue/menubar'
import Popover from 'primevue/popover'
import { onBeforeMount, ref, watch } from 'vue'
import AuthService from '@/services/AuthService.js'
import router from './router'
import { useRoute } from 'vue-router'

const route = useRoute()

const op = ref()
const isLoggedIn = ref()

const items = ref([
  {
    label: 'Crawler Yönetim',
    icon: 'pi pi-home',
    link: '/',
    style: 'flex items-center i-menu-item',
  },
  {
    label: 'Ham Veri Yönetim',
    icon: 'pi pi-list',
    link: '/raw-data-manangement',
    style: 'flex items-center i-menu-item',
  },
  {
    label: 'İşlenmiş Profil Yönetim',
    icon: 'pi pi-id-card',
    link: '/processed-profiles-management',
    style: 'flex items-center i-menu-item',
  },
  {
    label: 'Yönetim Merkezi',
    icon: 'pi pi-wrench',
    style: 'flex items-center i-menu-item',
    items: [
      {
        label: 'Linkedin Hesapları',
        icon: 'pi pi-linkedin',
        link: '/linkedin-accounts-management',
        style: 'flex items-center i-menu-item-sub',
      },
      {
        label: 'Proxy Sunucuları',
        icon: 'pi pi-server',
        link: '/proxy-server-management',
        style: 'flex items-center i-menu-item-sub',
      },
      {
        label: 'Kullanıcı Yetkileri',
        icon: 'pi pi-users',
        link: '/user-authorization-management',
        style: 'flex items-center i-menu-item-sub',
      },
    ],
  },
])

onBeforeMount(() => {
  checkLoginStatus()
})

const checkLoginStatus = () => {
  // LocalStorage'dan user bilgisini kontrol et
  const user = AuthService.getCurrentUser()
  console.log(user)
  isLoggedIn.value = user != null
}

const toggle = event => {
  op.value.toggle(event)
}

const logout = () => {
  AuthService.logout()
  isLoggedIn.value = false
  router.push('/login')
}

// Tüm route değişikliklerini izle
watch(
  () => route.path,
  async newPath => {
    console.log('Route changed to:', newPath)
    await checkLoginStatus()
    if (isLoggedIn.value) {
      items.value = [...items.value]
    }
  },
  { immediate: true },
)
</script>
<template>
  <div class="flex-grow-1">
    <div class="flex-grow-1" v-show="isLoggedIn">
      <Menubar :model="items">
        <template #item="{ item, hasSubmenu, root }">
          <a :class="item.style">
            <span v-if="!hasSubmenu" class="menu-item2">
              <router-link :to="item.link">
                <span :class="item.icon" />
                {{ item.label }}
              </router-link>
            </span>
            <span v-else :class="item.style">
              <span :class="item.icon"></span>
              <span class="ml-2">{{ item.label }}</span>
            </span>

            <i
              v-if="hasSubmenu"
              :class="[
                'pi pi-angle-down green',
                {
                  'pi-angle-down ml-2': root,
                  'pi-angle-right ml-auto': !root,
                },
              ]"
            ></i>
          </a>
        </template>
        <template #end>
          <Button
            icon="pi pi-sign-out"
            class="m-2"
            label="Çıkış"
            severity="danger"
            text
            raised
            @click="logout"
          />
        </template>
      </Menubar>
    </div>
    <div class="flex-grow-1 align-items-center justify-content-center">
      <router-view />
    </div>
  </div>
</template>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  --p-menubar-item-focus-background: none;
}

nav {
  border-bottom: 1px solid #adadb1;
}

nav a {
  font-weight: bold;
  color: #2c3e50;
  padding: 10px;
  font-size: large;
}

.router-link-exact-active {
  color: #fff;
  background-color: #00bd7e;
  padding: auto;
}

.i-menu-item {
  font-weight: bold;
  /* padding-top: 3px;
  padding-bottom: 3px;
  padding-left: 10px;
  padding-right: 10px;*/
  font-size: large;
}
.i-menu-item-sub {
  font-weight: bold;
}
/*.p-menubar a {
  padding: 2px;
}*/
.menu-item2 a {
  /*padding-top: 10px;
  padding-bottom: 10px;
  padding-left: 10px;
  padding-right: 10px;*/
  padding: 8px;
}
/*.right-menu-item:hover {
  color: #fff;
  background-color: #00bd7e;
}*/
.right-menu-item {
  cursor: pointer;
  background-color: none;
}
</style>
