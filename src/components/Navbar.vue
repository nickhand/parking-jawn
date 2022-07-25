<script setup>
import * as dc from "dc";
import { showResetAllButton } from "./Dashboard/updateDashboard.js";

function resetAllFilters() {
  dc.filterAll();
  dc.redrawAll();
}
</script>

<template>
  <div class="sticky top-0 z-50 bg-ppa-blue h-18" role=" navigation">
    <div class="flex flex-col md:flex-row md:justify-between md:items-start">
      <!-- Logo and name-->
      <div
        class="flex flex-col md:flex-row justify-start items-start text-white uppercase text-6xl ml-2 py-3"
      >
        <!-- Logo -->
        <div class="flex flex-col md:flex-row ml-2">
          <span class="font-['Montserrat Light'] text-[4.25rem]">Parking</span>
          <span class="ml-0 md:ml-4 font-['Oswald']">Jawn</span>
        </div>

        <!-- Name -->
        <div
          class="md:ml-8 mt-6 md:mt-0 ml-2 text-2xl font-['Oswald'] hover:underline"
        >
          <a href="https://www.nickhand.dev">By Nick Hand</a>
        </div>
      </div>

      <!-- Reset button -->
      <button
        class="mt-3 max-w-md mb-3 md:mb-0 ml-2 text-white bg-transparent rounded mr-5 uppercase text-sm border-[2px] border-solid border-white p-2 transition-all ease-in-out delay-100 tracking-[2px] disabled:opacity-25 disabled:cursor-not-allowed disabled:bg-transparent disabled:text-white hover:bg-white hover:text-ppa-blue"
        @click="resetAllFilters"
        :disabled="!showResetAllButton"
      >
        Reset All Filters
      </button>
    </div>
  </div>
</template>

>

<style>
@import url("https://fonts.googleapis.com/css2?family=Oswald");
@import url("https://fonts.googleapis.com/css2?family=Montserrat");
</style>
