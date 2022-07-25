<template>
  <div
    class="absolute left-0 top-0 opacity-95 z-50 h-full w-full bg-[#cfcfcf] flex justify-center items-start"
  >
    <span
      class="mt-[200px] loader border-b-ppa-blue w-20 h-20 border-8 border-solid border-white inline-block rounded-full"
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
