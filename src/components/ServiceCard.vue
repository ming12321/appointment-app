<script setup>
const props = defineProps({
  service: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["select"]);

function handleSelect() {
  emit("select", props.service);
}
</script>

<template>
  <article class="service-card">
    <p class="service-duration">
      {{ service.duration }}
    </p>

    <h3>{{ service.name }}</h3>

    <p>{{ service.description }}</p>

    <button type="button" @click="handleSelect">選擇時段</button>
  </article>
</template>
