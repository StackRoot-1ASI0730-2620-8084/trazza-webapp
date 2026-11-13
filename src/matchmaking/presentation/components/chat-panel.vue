<script setup>
import {nextTick, onBeforeUnmount, onMounted, ref} from "vue";
import {useI18n} from "vue-i18n";
import useMatchmakingStore from "../../application/matchmaking.store.js";
import {useErrorHandler} from "../../../shared/presentation/composables/use-error-handler.js";
import {formatDateTime} from "../../../shared/presentation/formatters.js";

/**
 * Temporary chat between the carrier and the merchant of a proposal. It refreshes every 10 seconds.
 */
const props = defineProps({
  proposalId: { type: String, required: true },
  open: { type: Boolean, default: true },
  counterpart: { type: String, default: '' }
});
const { t, locale } = useI18n();
const store = useMatchmakingStore();
const { showError } = useErrorHandler();
const messages = ref([]);
const draft = ref('');
const list = ref();
let timer = null;

const scrollDown = () => nextTick(() => { if (list.value) list.value.scrollTop = list.value.scrollHeight; });

const load = async () => {
  try {
    const count = messages.value.length;
    messages.value = await store.listMessages(props.proposalId);
    if (messages.value.length !== count) scrollDown();
  } catch (error) {
    clearInterval(timer);
    showError(error);
  }
};

const send = async () => {
  if (!draft.value.trim()) return;
  try {
    await store.sendMessage(props.proposalId, draft.value.trim());
    draft.value = '';
    await load();
  } catch (error) {
    showError(error);
  }
};

onMounted(() => {
  load();
  timer = setInterval(load, 10000);
});
onBeforeUnmount(() => clearInterval(timer));
</script>

<template>
  <div class="trazza-panel flex flex-column gap-2">
    <h2 class="mt-0 mb-0 text-lg">{{ t('chat.title') }}</h2>
    <small class="trazza-muted">{{ t('chat.retention-hint') }}</small>
    <div ref="list" class="chat-list flex flex-column gap-2">
      <p v-if="!messages.length" class="trazza-muted text-sm m-0">{{ t('chat.empty') }}</p>
      <div v-for="message in messages" :key="message.id" class="chat-bubble" :class="{ mine: message.isMine }">
        <div class="text-xs trazza-muted">{{ message.isMine ? t('chat.me') : (message.senderName || counterpart) }} · {{ formatDateTime(message.sentAt, locale) }}</div>
        <div class="white-space-normal">{{ message.content }}</div>
      </div>
    </div>
    <form v-if="open" class="flex gap-2" @submit.prevent="send">
      <label for="chat-input" class="sr-only">{{ t('chat.placeholder') }}</label>
      <pv-input-text id="chat-input" v-model="draft" class="flex-1" maxlength="2000" :placeholder="t('chat.placeholder')"/>
      <pv-button type="submit" icon="pi pi-send" :aria-label="t('chat.send')"/>
    </form>
    <small v-else class="trazza-muted">{{ t('chat.closed') }}</small>
  </div>
</template>

<style scoped>
.chat-list {
  max-height: 22rem;
  overflow-y: auto;
  padding: 0.25rem;
}

.chat-bubble {
  max-width: 80%;
  padding: 0.5rem 0.75rem;
  border-radius: 10px;
  background: #f1f3f9;
  align-self: flex-start;
  overflow-wrap: anywhere;
}

.chat-bubble.mine {
  background: var(--trazza-soft);
  align-self: flex-end;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}
</style>
