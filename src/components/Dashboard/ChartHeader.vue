<script setup>
import { resetChart, resetFlags } from "./updateDashboard.js";
import InfoTooltip from "./InfoTooltip.vue";

const props = defineProps(["chartId", "title", "showReset", "helpMessage"]);
</script>

<template>
  <div
    class="flex flex-row items-center justify-between px-2 text-lg border-b-2"
  >
    <div class="flex">
      <span>{{ title }}</span>
      <InfoTooltip class="ml-2" :description="helpMessage" />
    </div>
    <button
      v-if="showReset"
      class="text-[#2c3e50] rounded mr-5 mb-2 uppercase text-xs border-[1px] border-solid border-[#2c3e50] py-1 px-2 transition-all ease-in-out delay-100 tracking-[1px] hover:bg-[#2c3e50] hover:text-white disabled:opacity-25 disabled:cursor-not-allowed disabled:bg-transparent disabled:text-[#2c3e50]"
      @click="resetChart(props.chartId)"
      :disabled="!resetFlags[props.chartId]"
    >
      Reset
    </button>
  </div>
</template>
