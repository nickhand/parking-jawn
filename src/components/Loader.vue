<template>
  <div
    class="fixed opacity-95 z-50 h-full w-full bg-[#cfcfcf] flex justify-center items-center"
  >
    <span
      class="loader border-b-ppa-blue w-20 h-20 border-8 border-solid border-white inline-block rounded-full"
    ></span>
  </div>
</template>

<style>
.loader {
  box-sizing: border-box;
  animation: rotation 1s linear infinite;
}

@keyframes rotation {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
