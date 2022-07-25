<script setup>
const props = defineProps(["description"]);
</script>

<template>
  <div class="group">
    <font-awesome-icon
      class="hover:text-slate-500 hover:bg-white"
      icon="fa-solid fa-circle-question"
    />

    <div
      class="z-50 hidden absolute group-hover:flex group-hover:flex-col group-hover:items-start"
    >
      <font-awesome-icon class="-mb-4 text-3xl" icon="fa-solid fa-caret-up" />
      <div class="text-white p-2 rounded bg-slate-700 max-w-sm">
        <span class="text-sm">{{ description }}</span>
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
