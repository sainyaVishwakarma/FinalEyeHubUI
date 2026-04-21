<script lang="ts" setup>
import { RouteName } from '@/constants/RouteName'
import { RoutePath } from '@/constants/RoutePath'
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import DocumentsIcon from '@/assets/icons/DocumentsIcon.vue'
import CollapseIcon from '@/assets/icons/CollapseIcon.vue'
import router from '@/router'
import OrganizationIcon from '@/assets/icons/OrganizationIcon.vue'
import RoomsIcon from '@/assets/icons/RoomsIcon.vue'
import PlusIcon from '@/assets/icons/PlusIcon.vue'

const isCollapsed = ref(false)

const sideBarItems = [
  {
    label: RouteName.Dashboard,
    path: RoutePath.Dashboard,
    icon: DocumentsIcon,
  },
  {
    label: RouteName.Reports,
    path: RoutePath.Reports,
    icon: OrganizationIcon,
  },
  {
    label: RouteName.Viewer,
    path: RoutePath.Viewer,
    icon: RoomsIcon,
  },
  {
    label: RouteName.Txlf,
    path: RoutePath.Txlf,
    icon: DocumentsIcon,
  },
  {
    label: RouteName.Finalize,
    path: RoutePath.Finalize,
    icon: PlusIcon,
  },
]

const route = useRoute()

const isActive = (path: string) => {
  if (path === RoutePath.Dashboard && route.path === RoutePath.Root) {
    return true
  }
  return route.path === path || route.path.startsWith(`${path}/`)
}

const navigate = (path: string) => {
  router.push(path)
}

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
}
</script>

<template>
  <aside class="sidebar" :class="{ collapsed: isCollapsed }">
    <nav class="sidebar-nav">
      <button
        v-for="item in sideBarItems"
        :key="item.path"
        class="sidebar-item"
        :class="{ active: isActive(item.path) }"
        @click="navigate(item.path)"
      >
        <span class="sidebar-icon">
          <component :is="item.icon" />
        </span>
        <span v-if="!isCollapsed" class="sidebar-label">
          {{ item.label }}
        </span>
      </button>
    </nav>
    <button class="sidebar-collapse-btn" @click="toggleCollapse">
      <span class="collapse-icon" :class="{ rotated: isCollapsed }">
        <CollapseIcon />
      </span>
      <span v-if="!isCollapsed" class="collapse-text">Collapse</span>
    </button>
  </aside>
</template>

<style src="./Sidebar.scss" scoped></style>
