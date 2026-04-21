<script setup lang="ts">
import GlobalLinkIcon from '@/assets/icons/GlobalLinkIcon.vue'
import { RouteName } from '@/constants/RouteName'
import TheHeaderProfileButton from './TheHeaderProfileButton.vue'

</script>

<template>
  <div class="header">
    <div class="left">
      <RouterLink :to="{ path: RouteName.Root }" aria-label="Home page" class="home-link">
        <GlobalLinkIcon class="icon" />
        <span class="appName">Final Eye Hub</span>
      </RouterLink>
    </div>
    <nav>
      <ul class="navigation">
        <template >
          <li class="item">
            <TheHeaderProfileButton />
          </li>

        </template>
      </ul>
    </nav>
  </div>
</template>

<style src="./TheHeader.scss" scoped>


</style>
