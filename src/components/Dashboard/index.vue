<script setup>
import { ref, reactive, watch } from "vue";
import WelcomeMessage from "./WelcomeMessage.vue";
import DataSelection from "./DataSelection.vue";
import Loader from "../Loader.vue";
import * as d3 from "d3";
import { updateDashboard } from "./updateDashboard.js";
import "leaflet/dist/leaflet.css";
import ChartHeader from "./ChartHeader.vue";
import { useRouter, useRoute } from "vue-router";

// Define route and router
const router = useRouter();
const route = useRoute();

// Data years
const dataYears = reactive([2012, 2013, 2014, 2015, 2016, 2017]);

const dataMonths = reactive([
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]);

function handleSubmit() {
  let month = dataMonths.indexOf(selectedMonth) + 1;

  // Current route
  let y = parseInt(route.params["year"]);
  let m = parseInt(route.params["month"]);

  // Go!
  if (y !== selectedYear || m !== month) {
    router.push(`/${selectedYear}/${month}`);
  }
}

async function AWSFetch(year, month_str) {
  /* Fetch data from AWS s3 */

  let month_int = dataMonths.indexOf(month_str) + 1;
  let url = `https://parking-jawn.s3.amazonaws.com/${year}-${month_int}.json`;
  try {
    const response = await fetch(url);
    let data = await response.json();
    return data;
  } catch (e) {
    console.error(e);
  }
}

// Selected values
let selectedYear = parseInt(route.params["year"]);
let selectedMonth = dataMonths[parseInt(route.params["month"]) - 1];

// Navigate to new data path
watch(
  () => route.params,
  async () => {
    selectedYear = parseInt(route.params["year"]);
    selectedMonth = dataMonths[parseInt(route.params["month"]) - 1];
    await getData();
  }
);

// Set up parameters
let isLoading = ref(true);
let data = ref(null);

// Define the help messages
const helpMessages = reactive({
  "hot-spot-table":
    "This table gives the top 10 most common ticket locations for the currently selected data. " +
    "The table is automatically updated as filters are applied to the charts below.",
  "time-chart":
    "This chart plots the number of tickets per hour as a function of the date. " +
    "Individual date ranges can be selected via a sliding window — click on the chart and drag the filter over the desired date range.",
  "zipcode-row-chart":
    "This chart gives the number of tickets as a function of zip code. " +
    "Individual zip codes can be selected by clicking on specific bars of the chart. " +
    "When hovering over a bar, the corresponding zip code will be highlighted on the map.",
  "day-hour-chart":
    "This chart shows the number of tickets as a function of hour (y axis) and day of week (x axis). " +
    "Filter by time and day of week by clicking on the desired square. " +
    "Clicking on an axis label will select the entire row or column. " +
    "Hover over a square to show the total number of tickets issued.",
  map:
    "A density map of tickets across Philadelphia. " +
    "Individual ZIP codes can be selected by clicking on the highlighted area on the map. ",
  "ticket-type-row-chart":
    "This chart shows the number of tickets as a function of the violation type. " +
    "Individual types can be selected by clicking on specific bars of the chart.",
  "agency-row-chart":
    "This chart gives the number of tickets as a function of the issuing agency. " +
    "Select a specific issuing agency by clicking on the desired bar of the chart. " +
    "Note that the x axis is shown on a log scale.",
});

async function getData() {
  // Set loading
  isLoading.value = true;

  // Fetch the data from s3
  let newData = await AWSFetch(selectedYear, selectedMonth);
  // Format the timestamp
  let parseTime = d3.timeParse("%Y-%m-%d %H:%M:%S");
  newData.forEach((d) => {
    d["timestamp"] = parseTime(d["timestamp"]);
  });
  data.value = newData;

  setTimeout(() => {
    updateDashboard(newData);
    isLoading.value = false;
  }, 100);
}

function handleMonthUpdate(month) {
  selectedMonth = month;
}

function handleYearUpdate(year) {
  selectedYear = year;
}

// Get the data initially
await getData();
</script>

<template>
  <!-- Loading -->
  <Loader v-if="isLoading" />

  <!-- Dashboard -->
  <div class="p-2 bg-[#cfcfcf]" :key="`${selectedYear}-${selectedMonth}`">
    <div class="grid grid-cols-4 gap-4">
      <!-- Panel #1: Welcome message -->
      <WelcomeMessage
        class="order-1 col-span-4 md:col-span-2 p-4 bg-white rounded-lg"
      />

      <!-- Top 10 most common tickets -->
      <div
        class="md:order-2 order-5 col-span-4 md:col-span-2 row-span-2 md:row-span-3 py-2 bg-white rounded-lg"
      >
        <ChartHeader
          title="Top 10 Most Common Tickets"
          chartId="hot-spot-table"
          :showReset="false"
          :helpMessage="helpMessages['hot-spot-table']"
        />
        <div class="w-full h-full p-2 pb-14">
          <table class="table w-full h-full text-left hot-spot-table"></table>
        </div>
      </div>

      <!-- Dropdown selections -->
      <DataSelection
        class="md:order-3 order-2 col-span-2 md:col-span-1 row-span-2 p-4 bg-white rounded-lg"
        :dataYears="dataYears"
        :dataMonths="dataMonths"
        :defaultMonth="selectedMonth"
        :defaultYear="selectedYear"
        @update-month="handleMonthUpdate"
        @update-year="handleYearUpdate"
        @submit="handleSubmit"
      />

      <!-- Number of tickets -->
      <div
        class="md:order-4 order-3 col-span-2 md:col-span-1 py-2 bg-white rounded-lg"
      >
        <div class="px-2 text-lg border-b-2">Number of Tickets</div>
        <div class="flex flex-col items-start justify-center">
          <div id="number-records-nd" class="p-2 text-[3vw]"></div>
        </div>
      </div>

      <!-- Total revenue -->
      <div
        class="md:order-5 order-4 col-span-2 md:col-span-1 py-2 bg-white rounded-lg"
      >
        <div class="px-2 text-lg border-b-2">Total Revenue</div>
        <div class="flex flex-col items-start justify-center">
          <div id="number-revenue-nd" class="p-2 text-[3vw]"></div>
        </div>
      </div>

      <!-- Time series -->
      <div class="order-6 col-span-4 py-2 bg-white rounded-lg">
        <ChartHeader
          title="Tickets per Hour"
          chartId="time-chart"
          :showReset="true"
          :helpMessage="helpMessages['time-chart']"
        />
        <div id="time-chart" class="p-2"></div>
      </div>

      <!-- Tickets by ZIP code -->
      <div
        class="order-7 h-full row-span-2 col-span-2 md:col-span-1 py-2 bg-white rounded-lg"
      >
        <ChartHeader
          title="Tickets by ZIP Code"
          chartId="zipcode-row-chart"
          :showReset="true"
          :helpMessage="helpMessages['zipcode-row-chart']"
        />
        <div id="zipcode-row-chart" class="p-2"></div>
      </div>

      <!-- Weekday heatmap -->
      <div
        class="order-8 h-full row-span-2 col-span-2 md:col-span-1 py-2 bg-white rounded-lg"
      >
        <ChartHeader
          title="Hourly Ticket by Weekday"
          chartId="day-hour-chart"
          :showReset="true"
          :helpMessage="helpMessages['day-hour-chart']"
        />
        <div id="day-hour-chart" class="mx-5"></div>
      </div>

      <!-- Map -->
      <div class="order-9 col-span-4 md:col-span-2 py-2 bg-white rounded-lg">
        <ChartHeader
          title="Density of Tickets across Philadelphia"
          chartId="zipcode-row-chart"
          :showReset="true"
          :helpMessage="helpMessages['map']"
        />
        <div id="map"></div>
      </div>

      <!-- Types of tickets -->
      <div
        class="order-10 col-span-2 md:col-span-1 h-full py-2 bg-white rounded-lg"
      >
        <ChartHeader
          title="Types of Tickets"
          chartId="ticket-type-row-chart"
          :showReset="true"
          :helpMessage="helpMessages['ticket-type-row-chart']"
        />
        <div id="ticket-type-row-chart" class="h-full p-2"></div>
      </div>

      <!-- Issuing agency -->
      <div
        class="order-11 col-span-2 md:col-span-1 h-full py-2 bg-white rounded-lg"
      >
        <ChartHeader
          title="Issuing Agency"
          chartId="agency-row-chart"
          :showReset="true"
          :helpMessage="helpMessages['agency-row-chart']"
        />
        <div id="agency-row-chart" class="p-2"></div>
      </div>
    </div>
  </div>
</template>

<style>
#ticket-type-row-chart text.row {
  font-size: 12px !important;
  fill: #2c3e50 !important;
}

#agency-row-chart text.row {
  font-size: 12px !important;
  fill: #2c3e50 !important;
}

#zipcode-row-chart text.row {
  font-size: 0.9rem !important;
  fill: #2c3e50 !important;
}

#zipcode-row-chart g.axis text {
  font-size: 0.9rem !important;
  fill: #2c3e50 !important;
}

#day-hour-chart text {
  font-size: 0.9rem !important;
  fill: #2c3e50 !important;
}

#map {
  position: inherited;
  float: left;
  height: 450px;
  width: 100%;
  z-index: 1;
}

/* Heat map hexbin */
.hexbin-hexagon {
  stroke: #000;
  stroke-width: 0.5px;
}
.hexbin-tooltip {
  padding: 8px;
  border-radius: 4px;
  border: 1px solid black;
  background-color: white;
}
.info {
  padding: 6px 8px;
  font: 14px/16px Arial, Helvetica, sans-serif;
  background: white;
  background: rgba(255, 255, 255, 1);
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.2);
  border-radius: 5px;
}

.info h4 {
  margin: 0 0 5px;
  color: #777;
}

.hot-spot-table tr {
  border-bottom: 1px solid rgb(229, 231, 235);
}
</style>
