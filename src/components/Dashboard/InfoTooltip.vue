<script setup>
import { ref } from "vue";
const props = defineProps(["description"]);
const showTooltip = ref(false);
</script>

<template>
  <div
    class="text-xl group"
    @mouseover="showTooltip = true"
    @mouseleave="showTooltip = false"
  >
    <font-awesome-icon
      class="hover:text-slate-500 hover:bg-white"
      icon="fa-solid fa-circle-question"
    />

    <!-- The tooltip -->
    <div
      class="tooltip z-50 absolute flex flex-col items-start"
      :class="{
        hidden: !showTooltip,
      }"
    >
      <font-awesome-icon class="-mb-4 text-3xl" icon="fa-solid fa-caret-up" />
      <div class="text-white p-2 rounded bg-slate-700 max-w-sm">
        <div class="text-sm">{{ description }}</div>
      </div>
    </div>
  </div>
</template>

<style>
.tooltip .tooltip-text {
  visibility: hidden;
  text-align: center;
  padding: 2px 6px;
  position: absolute;
  z-index: 100;
}
.tooltip:hover .tooltip-text {
  visibility: visible;
}
</style>
