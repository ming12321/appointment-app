<script setup>
const props = defineProps({
  service: {
    type: Object,
    required: true,
  },
  slots: {
    type: Array,
    required: true,
  },
  modelValue: {
    type: String,
    default: "",
  },
  isSubmitting: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue", "confirm"]);

function selectSlot(slot) {
  emit("update:modelValue", slot);
}

function handleConfirm() {
  if (!props.modelValue || props.isSubmitting) {
    return;
  }

  emit("confirm");
}
</script>

<template>
  <section class="booking-panel" aria-labelledby="booking-title">
    <div class="booking-summary">
      <p>已選擇服務</p>

      <h3 id="booking-title">
        {{ service.name }}
      </h3>

      <p>服務時間：{{ service.duration }}</p>
    </div>

    <fieldset class="slot-fieldset">
      <legend>選擇可預約時段</legend>

      <div class="slot-list">
        <label v-for="slot in slots" :key="slot" class="slot-option">
          <input
            type="radio"
            name="appointment-slot"
            :value="slot"
            :checked="modelValue === slot"
            @change="selectSlot(slot)"
          />

          <span>{{ slot }}</span>
        </label>
      </div>
    </fieldset>

    <button
      type="button"
      class="confirm-button"
      :disabled="!modelValue || isSubmitting"
      :aria-busy="isSubmitting"
      @click="handleConfirm"
    >
      {{ isSubmitting ? "預約處理中…" : "確認預約" }}
    </button>
  </section>
</template>
