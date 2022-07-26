import { createApp } from "vue";
import App from "./App.vue";
import { createWebHistory, createRouter } from "vue-router";
import vClickOutside from "click-outside-vue3";
import "./index.css";
import Dashboard from "./components/Dashboard/index.vue";

// Font awesome
import { library } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import {
  faQuestionCircle,
  faRotateLeft,
  faCaretUp,
  faArrowUpRightFromSquare,
} from "@fortawesome/free-solid-svg-icons";
import {
  faGithub,
  faTwitter,
  faLinkedinIn,
} from "@fortawesome/free-brands-svg-icons";

/* add icons to the library */
library.add(
  faQuestionCircle,
  faRotateLeft,
  faCaretUp,
  faGithub,
  faTwitter,
  faLinkedinIn,
  faArrowUpRightFromSquare
);

const routes = [
  {
    path: "/:year/:month",
    component: Dashboard,
  },
  {
    path: "/",
    redirect: "/2017/1",
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

createApp(App)
  .use(router)
  .use(vClickOutside)
  .component("font-awesome-icon", FontAwesomeIcon)
  .mount("#app");
