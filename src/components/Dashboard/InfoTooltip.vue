<script setup>
import { ref } from "vue";
const props = defineProps(["description"]);
const showTooltipOnMobile = ref(false);

function showOnMobile() {
  if (!window.matchMedia("@media (hover: hover) and (pointer: fine)")) {
    showTooltipOnMobile.value = !showTooltipOnMobile.value;
  }
}
</script>

<template>
  <div class="text-xl group">
    <font-awesome-icon
      class="hover:text-slate-500 hover:bg-white"
      icon="fa-solid fa-circle-question"
      @click="showOnMobile"
    />

    <!-- The tooltip -->
    <div
      class="tooltip z-50 ml-2 absolute hidden group-hover:flex group-hover:flex-col group-hover:items-center -translate-x-1/2"
      :class="{
        flex: showTooltipOnMobile,
        'flex-col': showTooltipOnMobile,
        'items-center': showTooltipOnMobile,
      }"
    >
      <font-awesome-icon class="-mb-4 text-3xl" icon="fa-solid fa-caret-up" />
      <div class="text-white p-2 rounded bg-slate-700 max-w-[250px] w-fit">
        <div class="text-sm">{{ description }}</div>
      </div>
    </div>
  </div>
</template>

<style></style>
