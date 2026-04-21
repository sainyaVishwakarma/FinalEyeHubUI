<script setup lang="ts">
import { computed, type PropType } from 'vue';
import { LoaderSize } from '@/types/LoaderSize';

const props = defineProps({
  size: {
    type: String as PropType<LoaderSize>,
    required: false,
    default: LoaderSize.small
  }
});

const sizeClassName = computed((): object => ({
  [`tp-loader_size_${props.size}`]: props.size
}));
</script>

<template>
  <div
    :class="{
      overlay: props.size !== LoaderSize.xsmall,
      'overlay-xs': props.size === LoaderSize.xsmall
    }"
  >
    <div class="loader">
      <svg
        :class="['tp-loader', sizeClassName]"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 101.5 93.65"
      >
        <path
          class="tp-loader__path"
          stroke-width="1.5"
          stroke-miterlimit="5"
          transform="translate(-0.25 -0.25)"
          d="M100.84,7c-0.51-.67-2.07-0.07-2.07-0.07-8.56,4.78-12.55,5.18-20.32,5.18-7.57,0-15.14-2.59-30.87-7C33,1,14.31-3.82,4.15,11.52,0.37,17.1-.23,24.47,3.56,30.24,11.92,43,42,41,42.2,40.6c0.2-.2-8.37,14.34-9.16,27.09C32,85.22,47.58,98,64.51,91.39,75.06,87.41,86,77.05,88,65.5c1.2-6.77-2-14.74-8.37-17.13C70.48,45,59.93,52.55,56.74,60.52c-2,3.65,1.55,4.14,2.34,2.75,4.78-8.17,19.54-17.41,22.56-6.13,2,11.35-10,29.08-22.11,31.27A15.72,15.72,0,0,1,47,85.22c-7.77-6.17-6.77-16.93-3.78-25.3a54.76,54.76,0,0,1,3-7.17c1.59-3.59,3.39-7,5.18-10.36,1.2-2.19,2.79-2,5.18-2.39a37.08,37.08,0,0,0,13.54-4.78c3-1.85,1.42-2.79-.6-2.59-0.4,0-8,1.59-14.74,2.59,4.78-6.77,6.57-10,9.36-13.35a0.44,0.44,0,0,0-.6-0.6l-8.56,1s-6,7.57-9.36,12.55c-27.09,1.2-34.86-5-35.26-12.75-0.4-7.57,5.58-11.15,11-11.35,7-.4,6.37.8,19.72,4.18,9.16,2.39,14.74,3.19,26.29,3.19,13.54,0,21.11-1.39,31.47-8,0,0,2.19-1.39,2.19-2.19A1.13,1.13,0,0,0,100.84,7"
        ></path>
      </svg>
    </div>
  </div>
</template>

<style src="./TPLoader.scss" lang="scss" scoped />
