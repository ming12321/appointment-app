<script setup>
import { ref } from "vue";
import ServiceCard from "./components/ServiceCard.vue";
import BookingPanel from "./components/BookingPanel.vue";

const services = [
  {
    id: 1,
    name: "一般諮詢",
    duration: "30 分鐘",
    description: "適合第一次了解服務內容的使用者。",
  },
  {
    id: 2,
    name: "專業諮詢",
    duration: "60 分鐘",
    description: "由專業人員提供完整的需求評估。",
  },
  {
    id: 3,
    name: "回訪服務",
    duration: "45 分鐘",
    description: "適合已使用過服務，需要後續追蹤的使用者。",
  },
];

const availableSlots = ["上午 09:00", "上午 10:30", "下午 02:00", "下午 03:30"];

const selectedService = ref(null);
const selectedSlot = ref("");
const bookingStatus = ref("idle");
const confirmedBooking = ref(null);

function selectService(service) {
  selectedService.value = service;
  selectedSlot.value = "";
  bookingStatus.value = "idle";
  confirmedBooking.value = null;
}

function wait(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
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

  bookingStatus.value = "submitting";

  // 暫時模擬 API 回應時間
  await wait(800);

  // 若等待期間使用者改選服務，就取消舊結果
  if (bookingStatus.value !== "submitting") {
    return;
  }

  confirmedBooking.value = bookingData;
  bookingStatus.value = "success";
}

function resetBooking() {
  selectedService.value = null;
  selectedSlot.value = "";
  confirmedBooking.value = null;
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

        <div class="service-list">
          <ServiceCard
            v-for="service in services"
            :key="service.id"
            :service="service"
            @select="selectService"
          />
        </div>
      </section>

      <BookingPanel
        v-if="selectedService && bookingStatus !== 'success'"
        v-model="selectedSlot"
        :service="selectedService"
        :slots="availableSlots"
        :is-submitting="bookingStatus === 'submitting'"
        @confirm="confirmBooking"
      />

      <section
        v-else-if="confirmedBooking"
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

      <section id="about" class="about-section" aria-labelledby="about-title">
        <h2 id="about-title">簡單、清楚、好操作</h2>
        <p>從選擇服務、查看時段到完成預約， 每一步都讓你清楚知道目前的狀態。</p>
      </section>
    </main>
  </div>
</template>
