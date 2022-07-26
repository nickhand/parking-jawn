<script setup>
import { ref } from "vue";

const props = defineProps(["description"]);
const showTooltip = ref(false);

function handleClick() {
  // On mobile only
  let notMobile = window.matchMedia(
    "(hover: hover) and (pointer: fine)"
  ).matches;
  if (!notMobile) {
    showTooltip.value = !showTooltip.value;
  }
}

function closeTooltip() {
  if (showTooltip.value) showTooltip.value = false;
}
</script>

<template>
  <div class="text-xl group">
    <font-awesome-icon
      class="hover:text-slate-500 hover:bg-white"
      icon="fa-solid fa-circle-question"
      @click="handleClick"
      v-click-outside="closeTooltip"
    />

    <!-- The tooltip -->
    <div
      class="tooltip z-50 ml-2 absolute group-hover:flex flex-col items-center -translate-x-1/2"
      :class="{ flex: showTooltip, hidden: !showTooltip }"
    >
      <font-awesome-icon class="-mb-4 text-3xl" icon="fa-solid fa-caret-up" />
      <div class="text-white p-2 rounded bg-slate-700 max-w-[250px] w-fit">
        <div class="text-sm">{{ description }}</div>
      </div>
    </div>
  </div>
</template>

<style></style>
