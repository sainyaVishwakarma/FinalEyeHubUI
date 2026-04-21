<script lang="ts" setup>
// import { useAuthStore } from '@/stores/authModule'
import { ref } from 'vue'
import TheHeaderProfileDropdownMenu from './TheHeaderProfileDropdownMenu.vue'

// const authModule = useAuthStore()

const isDropdownMenuVisible = ref(false)

const toggleDropdownMenuVisibility = () => {
  isDropdownMenuVisible.value = !isDropdownMenuVisible.value
}

const hideDropdownMenu = () => {
  isDropdownMenuVisible.value = false
}
</script>
<template>
  <div class="profile-button">
    <button
      class="profile-button__trigger button"
      :class="isDropdownMenuVisible ? 'active' : ''"
      @click.stop="toggleDropdownMenuVisibility"
      @keydown.enter.prevent="toggleDropdownMenuVisibility"
      @keydown.space.prevent="toggleDropdownMenuVisibility"
    >
      <!-- <div class="profile-button__avatar user-initial">
        {{ authModule.userInitials }}
      </div> -->
    </button>
    <TheHeaderProfileDropdownMenu
      class="dropdownMenu"
      :is-visible="isDropdownMenuVisible"
      @click-outside="hideDropdownMenu"
    />
  </div>
</template>

<style src="./TheHeaderProfileButton.scss" scoped></style>
