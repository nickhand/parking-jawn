<script setup>
import Dropdown from "../Dropdown.vue";

// Props
const props = defineProps([
  "dataYears",
  "defaultYear",
  "dataMonths",
  "defaultMonth",
]);
</script>

<template>
  <div>
    <Dropdown
      class="w-full"
      label="Month"
      :options="dataMonths"
      :defaultOption="defaultMonth"
      @update="$emit('update-month', $event)"
    />

    <Dropdown
      class="w-full mt-3"
      label="Year"
      :options="dataYears"
      :defaultOption="defaultYear"
      @update="$emit('update-year', $event)"
    />

    <button
      type="submit"
      class="btn-default w-full mt-5"
      @click="$emit('submit')"
    >
      Submit
    </button>
  </div>
</template>
