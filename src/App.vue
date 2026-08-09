<script setup>
import { onMounted, ref } from "vue";
import ServiceCard from "./components/ServiceCard.vue";
import BookingPanel from "./components/BookingPanel.vue";
import {
  createAppointment,
  getAppointments,
} from "./services/appointmentApi.js";
import { getServices } from "./services/serviceApi.js";
import { getAvailableSlots } from "./services/slotApi.js";
import AppointmentList from "./components/AppointmentList.vue";

const services = ref([]);
const servicesStatus = ref("loading");
const servicesErrorMessage = ref("");

const availableSlots = ref([]);
const slotsStatus = ref("idle");
const slotsErrorMessage = ref("");

const selectedService = ref(null);
const selectedSlot = ref("");
const bookingStatus = ref("idle");
const confirmedBooking = ref(null);
const errorMessage = ref("");
const appointments = ref([]);
const appointmentsStatus = ref("loading");
const appointmentsErrorMessage = ref("");

let latestRequestId = 0;
let latestSlotsRequestId = 0;

async function loadServices() {
  servicesStatus.value = "loading";
  servicesErrorMessage.value = "";

  try {
    services.value = await getServices();
    servicesStatus.value = "success";
  } catch {
    services.value = [];
    servicesStatus.value = "error";
    servicesErrorMessage.value = "服務載入失敗，請稍後再試。";
  }
}

async function loadAvailableSlots() {
  const requestId = ++latestSlotsRequestId;

  availableSlots.value = [];
  slotsStatus.value = "loading";
  slotsErrorMessage.value = "";

  try {
    const result = await getAvailableSlots();

    // 忽略已經過期的請求
    if (requestId !== latestSlotsRequestId) {
      return;
    }

    availableSlots.value = result;
    slotsStatus.value = "success";
  } catch (error) {
    if (requestId !== latestSlotsRequestId) {
      return;
    }

    availableSlots.value = [];
    slotsStatus.value = "error";
    slotsErrorMessage.value =
      error instanceof Error ? error.message : "無法載入可用時段，請稍後再試。";
  }
}

async function loadAppointments() {
  appointmentsStatus.value = "loading";
  appointmentsErrorMessage.value = "";

  try {
    appointments.value = await getAppointments();
    appointmentsStatus.value = "success";
  } catch (error) {
    appointments.value = [];
    appointmentsStatus.value = "error";
    appointmentsErrorMessage.value =
      error instanceof Error ? error.message : "無法載入預約紀錄，請稍後再試。";
  }
}

onMounted(() => {
  loadServices();
  loadAppointments();
});

function selectService(service) {
  // 讓先前仍在等待的預約請求失效
  latestRequestId += 1;

  selectedService.value = service;
  selectedSlot.value = "";
  bookingStatus.value = "idle";
  confirmedBooking.value = null;
  errorMessage.value = "";

  loadAvailableSlots();
}

async function confirmBooking() {
  if (
    !selectedService.value ||
    !selectedSlot.value ||
    bookingStatus.value === "submitting"
  ) {
    return;
  }

  const bookingData = {
    serviceId: selectedService.value.id,
    serviceName: selectedService.value.name,
    duration: selectedService.value.duration,
    slot: selectedSlot.value,
  };

  const requestId = ++latestRequestId;

  bookingStatus.value = "submitting";
  confirmedBooking.value = null;
  errorMessage.value = "";

  try {
    const result = await createAppointment(bookingData);

    // 如果這不是最新請求，就不更新畫面
    if (requestId !== latestRequestId) {
      return;
    }

    confirmedBooking.value = result;
    bookingStatus.value = "success";
    loadAppointments();
  } catch (error) {
    if (requestId !== latestRequestId) {
      return;
    }

    errorMessage.value =
      error instanceof Error ? error.message : "預約失敗，請稍後再試。";

    bookingStatus.value = "error";
  }
}

function retryBooking() {
  confirmBooking();
}

function resetBooking() {
  latestRequestId += 1;
  latestSlotsRequestId += 1;

  selectedService.value = null;
  selectedSlot.value = "";
  availableSlots.value = [];
  slotsStatus.value = "idle";
  slotsErrorMessage.value = "";
  confirmedBooking.value = null;
  errorMessage.value = "";
  bookingStatus.value = "idle";
}
</script>

<template>
  <div class="app-shell">
    <header class="site-header">
      <a href="/" class="brand">預約好幫手</a>

      <nav aria-label="主要導覽">
        <a href="#services">服務項目</a>
        <a href="#about">關於我們</a>
      </nav>

      <button type="button" class="login-button">登入</button>
    </header>

    <main>
      <section class="hero" aria-labelledby="hero-title">
        <p class="hero-label">線上預約系統</p>
        <h1 id="hero-title">提前安排你的專屬服務</h1>
        <p>選擇適合你的服務項目，查看可用時段並完成預約。</p>
        <a href="#services" class="primary-button"> 查看服務 </a>
      </section>

      <section
        id="services"
        class="services-section"
        aria-labelledby="services-title"
      >
        <div class="section-heading">
          <p class="section-label">服務項目</p>
          <h2 id="services-title">選擇你需要的服務</h2>
        </div>

        <div
          v-if="servicesStatus === 'loading'"
          class="service-feedback"
          role="status"
          aria-live="polite"
        >
          <p>正在載入服務項目…</p>
        </div>

        <div
          v-else-if="servicesStatus === 'error'"
          class="service-feedback"
          role="alert"
        >
          <p>{{ servicesErrorMessage }}</p>

          <button type="button" class="confirm-button" @click="loadServices">
            重新載入
          </button>
        </div>

        <div v-else-if="services.length === 0" class="service-feedback">
          <p>目前沒有可預約的服務。</p>
        </div>

        <div v-else class="service-list">
          <ServiceCard
            v-for="service in services"
            :key="service.id"
            :service="service"
            @select="selectService"
          />
        </div>
      </section>

      <section
        v-if="selectedService && slotsStatus === 'loading'"
        class="service-feedback slot-feedback"
        role="status"
        aria-live="polite"
      >
        <p>正在載入可用時段…</p>
      </section>

      <section
        v-else-if="selectedService && slotsStatus === 'error'"
        class="service-feedback slot-feedback"
        role="alert"
      >
        <p>{{ slotsErrorMessage }}</p>

        <button
          type="button"
          class="confirm-button"
          @click="loadAvailableSlots"
        >
          重新載入時段
        </button>
      </section>

      <section
        v-else-if="
          selectedService &&
          slotsStatus === 'success' &&
          availableSlots.length === 0
        "
        class="service-feedback slot-feedback"
        role="status"
        aria-live="polite"
      >
        <p>目前沒有可用時段，請稍後再試。</p>
      </section>

      <BookingPanel
        v-else-if="
          selectedService &&
          slotsStatus === 'success' &&
          availableSlots.length > 0 &&
          bookingStatus !== 'success' &&
          bookingStatus !== 'error'
        "
        v-model="selectedSlot"
        :service="selectedService"
        :slots="availableSlots"
        :is-submitting="bookingStatus === 'submitting'"
        @confirm="confirmBooking"
      />

      <section
        v-if="bookingStatus === 'error' && selectedService"
        class="booking-error"
        role="alert"
        aria-labelledby="error-title"
      >
        <p class="section-label">預約失敗</p>

        <h2 id="error-title">這次沒有完成預約</h2>

        <p>{{ errorMessage }}</p>

        <p class="booking-error-selection">
          已保留：{{ selectedService.name }}・{{ selectedSlot }}
        </p>

        <button type="button" class="confirm-button" @click="retryBooking">
          重新嘗試
        </button>
      </section>

      <section
        v-if="bookingStatus === 'success' && confirmedBooking"
        class="booking-success"
        role="status"
        aria-live="polite"
        aria-labelledby="success-title"
      >
        <p class="section-label">預約完成</p>

        <h2 id="success-title">你的預約已建立</h2>

        <p>我們已收到預約資料，請依照預約時間準時使用服務。</p>

        <dl class="booking-success-details">
          <div>
            <dt>服務項目</dt>
            <dd>{{ confirmedBooking.serviceName }}</dd>
          </div>

          <div>
            <dt>預約時段</dt>
            <dd>{{ confirmedBooking.slot }}</dd>
          </div>
        </dl>

        <button type="button" class="confirm-button" @click="resetBooking">
          預約其他服務
        </button>
      </section>

      <AppointmentList
        :appointments="appointments"
        :status="appointmentsStatus"
        :error-message="appointmentsErrorMessage"
        @retry="loadAppointments"
      />

      <section id="about" class="about-section" aria-labelledby="about-title">
        <h2 id="about-title">簡單、清楚、好操作</h2>
        <p>從選擇服務、查看時段到完成預約， 每一步都讓你清楚知道目前的狀態。</p>
      </section>
    </main>
  </div>
</template>
