<template>
  <div
    class="flex flex-col items-center justify-center h-fit bg-[#cfcfcf] pb-20 pt-20"
  >
    <SocialIcons />
    <div>© Nick Hand 2022</div>
    <div>
      Data via
      <a
        href="https://www.opendataphilly.org/dataset/parking-violations"
        class="hover:underline hover:text-ppa-blue"
        target="_blank"
        >Open Data Philly
        <font-awesome-icon
          class="ml-1"
          icon="fa-solid fa-arrow-up-right-from-square" /></a
      >.
    </div>
  </div>
</template>

<script setup>
import SocialIcons from "./SocialIcons.vue";
</script>
