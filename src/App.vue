<script setup>
import Navbar from "./components/Navbar.vue";
import Footer from "./components/Footer.vue";
import Loader from "./components/Loader.vue";
</script>

<template>
  <Navbar />
  <Suspense>
    <router-view />
    <template #fallback><Loader /></template>
  </Suspense>
  <Footer />
</template>

<style>
#app {
  color: #474a4d;
  font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
}
</style>
