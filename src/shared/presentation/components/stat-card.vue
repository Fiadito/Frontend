<script setup>
/**
 * Summary card with a round icon, a label, a big value and a note (mockup cards).
 */
defineProps({
  icon: {type: String, required: true},
  label: {type: String, required: true},
  value: {type: String, required: true},
  note: {type: String, default: ''},
  tone: {type: String, default: 'info'},
  valueTone: {type: String, default: ''}
});
</script>

<template>
  <article class="stat" :class="`stat--${tone}`">
    <span class="stat__icon"><i :class="icon" aria-hidden="true"></i></span>
    <div class="stat__body">
      <p class="stat__label">{{ label }}</p>
      <p class="stat__value" :class="valueTone ? `stat__value--${valueTone}` : ''">{{ value }}</p>
      <slot/>
      <p v-if="note" class="stat__note">{{ note }}</p>
    </div>
  </article>
</template>

<style scoped>
.stat {
  display: flex;
  gap: 1rem;
  align-items: center;
  background: var(--fi-card);
  border: 1px solid var(--fi-line);
  border-radius: var(--fi-radius);
  box-shadow: var(--fi-shadow);
  padding: 1.1rem 1.2rem;
  min-width: 0;
}

.stat__icon {
  flex: none;
  width: 54px;
  height: 54px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 1.3rem;
}

.stat--info .stat__icon {
  background: var(--fi-primary-soft);
  color: var(--fi-primary);
}

.stat--bad .stat__icon {
  background: var(--fi-bad-soft);
  color: var(--fi-bad);
}

.stat--ok .stat__icon {
  background: var(--fi-ok-soft);
  color: var(--fi-ok);
}

.stat--violet .stat__icon {
  background: var(--fi-violet-soft);
  color: var(--fi-violet);
}

.stat--muted .stat__icon {
  background: #e2e8f0;
  color: var(--fi-muted);
}

.stat__body {
  min-width: 0;
}

.stat__label {
  margin: 0;
  color: var(--fi-muted);
  font-size: .9rem;
}

.stat__value {
  margin: .1rem 0 0;
  font-size: 1.55rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  overflow-wrap: anywhere;
}

.stat__value--primary {
  color: var(--fi-primary);
}

.stat__value--bad {
  color: var(--fi-bad);
}

.stat__value--ok {
  color: var(--fi-ok);
}

.stat__note {
  margin: .15rem 0 0;
  font-size: .82rem;
  color: var(--fi-soft);
}
</style>
