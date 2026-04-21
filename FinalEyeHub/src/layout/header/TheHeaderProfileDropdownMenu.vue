<script lang="ts" setup>
import SignOutIcon from '@/assets/icons/SignOutIcon.vue'
import { authorizationService } from '@/services/auth'

import { computed, ref } from 'vue'
import { onClickOutside } from '@vueuse/core'

const props = defineProps({
  isVisible: {
    type: Boolean,
    required: false,
  },
})

const menu = ref(null)

const emit = defineEmits<{
  (e: 'click-outside'): void
}>()

const logout = () => {
  authorizationService.logout()
}

onClickOutside(menu, (event:any) => {
  if (props.isVisible) {
    event.stopPropagation()
    emit('click-outside')
  }
})
</script>

<template>
  <Transition name="fade">
    <div v-if="props.isVisible" class="wrapper" ref="menu">
      <div class="header">
        <div class="icon">ABC</div>
        <div class="name">
          Full name
        </div>
        <div class="email">
          email
        </div>
        <ul class="menu">
          <li class="divider"></li>
          <li class="item">
            <button class="signout-button" @click="logout">
              <SignOutIcon class="signout-icon" />
              <div class="name">Sign Out</div>
            </button>
          </li>
        </ul>
      </div>
    </div>
  </Transition>
</template>

<style src="./TheHeaderProfileDropdownMenu.scss" scoped></style>
