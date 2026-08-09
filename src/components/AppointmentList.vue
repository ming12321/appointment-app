<script setup>
defineProps({
  appointments: {
    type: Array,
    required: true,
  },
  status: {
    type: String,
    default: "idle",
  },
  errorMessage: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["retry"]);

function formatCreatedAt(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "建立時間不明";
  }

  return new Intl.DateTimeFormat("zh-TW", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function retryLoading() {
  emit("retry");
}
</script>

<template>
  <section
    id="appointments"
    class="appointments-section"
    aria-labelledby="appointments-title"
  >
    <div class="section-heading">
      <p class="section-label">預約管理</p>
      <h2 id="appointments-title">目前的預約紀錄</h2>
    </div>

    <div
      v-if="status === 'loading'"
      class="appointment-feedback"
      role="status"
      aria-live="polite"
    >
      <p>正在載入預約紀錄…</p>
    </div>

    <div
      v-else-if="status === 'error'"
      class="appointment-feedback"
      role="alert"
    >
      <p>{{ errorMessage }}</p>

      <button type="button" class="confirm-button" @click="retryLoading">
        重新載入
      </button>
    </div>

    <div
      v-else-if="appointments.length === 0"
      class="appointment-feedback"
    >
      <p>目前沒有預約紀錄。</p>
    </div>

    <ul v-else class="appointment-list">
      <li v-for="appointment in appointments" :key="appointment.id">
        <article class="appointment-card">
          <h3>{{ appointment.serviceName }}</h3>

          <dl>
            <div>
              <dt>預約時段</dt>
              <dd>{{ appointment.slot }}</dd>
            </div>

            <div>
              <dt>服務時間</dt>
              <dd>{{ appointment.durationMinutes }} 分鐘</dd>
            </div>

            <div>
              <dt>建立時間</dt>
              <dd>
                <time :datetime="appointment.createdAt">
                  {{ formatCreatedAt(appointment.createdAt) }}
                </time>
              </dd>
            </div>
          </dl>
        </article>
      </li>
    </ul>
  </section>
</template>