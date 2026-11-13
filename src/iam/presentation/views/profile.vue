<script setup>
import {computed, onMounted, reactive, watch} from "vue";
import {useI18n} from "vue-i18n";
import useIamStore from "../../application/iam.store.js";
import {UserRole} from "../../domain/model/user-role.value-object.js";
import {Phone} from "../../domain/model/phone.value-object.js";
import {Ruc} from "../../domain/model/ruc.value-object.js";
import {useErrorHandler} from "../../../shared/presentation/composables/use-error-handler.js";
import {formatDateTime, statusKey, statusSeverity} from "../../../shared/presentation/formatters.js";

const { t, locale } = useI18n();
const store = useIamStore();
const { showError, showSuccess } = useErrorHandler();
const user = computed(() => store.state.currentUser);

const identity = reactive({ fullName: '', phone: '' });
const business = reactive({ businessName: '', businessType: '' });
const newMerchant = reactive({ businessName: '', ruc: '', businessType: '' });

const fill = () => {
  identity.fullName = user.value?.fullName ?? '';
  identity.phone = user.value?.phone ?? '';
  business.businessName = user.value?.merchantProfile?.businessName ?? '';
  business.businessType = user.value?.merchantProfile?.businessType ?? '';
};
watch(user, fill, { immediate: true });

onMounted(async () => {
  try {
    await Promise.all([store.refreshAccount(), store.fetchVerifications()]);
  } catch (error) {
    showError(error);
  }
});

const attempt = async (action, successKey) => {
  try {
    await action();
    showSuccess(successKey);
  } catch (error) {
    showError(error);
  }
};

const saveIdentity = () => attempt(() => store.updateIdentity({ fullName: identity.fullName, phone: new Phone(identity.phone).value }),
    'profile.identity-saved');
const saveBusiness = () => attempt(() => store.updateMerchantProfile(business), 'profile.business-saved');
const addCarrierRole = () => attempt(() => store.addRole(UserRole.CARRIER), 'profile.role-added');
const addMerchantRole = () => attempt(() => store.addRole(UserRole.MERCHANT,
    { businessName: newMerchant.businessName, ruc: new Ruc(newMerchant.ruc).value, businessType: newMerchant.businessType }),
    'profile.role-added');
const verify = () => attempt(() => store.submitVerification(), 'profile.verification-sent');
</script>

<template>
  <div class="trazza-page" v-if="user">
    <div class="trazza-page-header mb-4">
      <h1>{{ t('profile.title') }}</h1>
      <p>{{ t('profile.subtitle') }}</p>
    </div>
    <div class="grid">
      <div class="col-12 lg:col-6">
        <div class="trazza-panel h-full">
          <h2 class="mt-0 text-lg">{{ t('profile.account') }}</h2>
          <p class="m-0"><span class="trazza-label">{{ t('fields.email') }}:</span> {{ user.email }}</p>
          <p><span class="trazza-label">{{ t('fields.dni') }}:</span> {{ user.dniMasked }}</p>
          <div class="flex flex-wrap gap-2 align-items-center">
            <span class="trazza-label">{{ t('profile.roles') }}:</span>
            <pv-tag v-for="role in user.roles" :key="role" :value="t(`roles.${role.toLowerCase()}`)"/>
          </div>
          <pv-divider/>
          <h3 class="mt-0 text-base">{{ t('profile.identity') }}</h3>
          <div class="flex align-items-center gap-2 mb-3">
            <pv-tag :value="t(`statuses.${statusKey(user.kycStatus)}`)" :severity="statusSeverity(user.kycStatus)"/>
            <pv-button v-if="!user.isIdentityValidated" :label="t('profile.verify-identity')" size="small" outlined
                       :loading="store.state.processing" @click="verify"/>
          </div>
          <p class="text-sm trazza-muted mt-0">{{ t('profile.verify-hint') }}</p>
          <div v-for="verification in store.state.verifications" :key="verification.id" class="text-sm mb-1">
            {{ formatDateTime(verification.submittedAt, locale) }} · {{ verification.provider }} ·
            <pv-tag :value="t(`statuses.${statusKey(verification.status)}`)" :severity="statusSeverity(verification.status)"/>
            <span v-if="verification.rejectionReason" class="trazza-muted"> {{ verification.rejectionReason }}</span>
          </div>
        </div>
      </div>
      <div class="col-12 lg:col-6">
        <form class="trazza-panel h-full flex flex-column gap-3" @submit.prevent="saveIdentity">
          <h2 class="mt-0 mb-0 text-lg">{{ t('profile.contact') }}</h2>
          <div class="flex flex-column gap-1">
            <label for="full-name" class="trazza-label">{{ t('fields.full-name') }}</label>
            <pv-input-text id="full-name" v-model="identity.fullName"/>
          </div>
          <div class="flex flex-column gap-1">
            <label for="phone" class="trazza-label">{{ t('fields.phone') }}</label>
            <pv-input-text id="phone" v-model="identity.phone"/>
          </div>
          <pv-button type="submit" :label="t('actions.save')" class="align-self-start" :loading="store.state.processing"/>
        </form>
      </div>
      <div class="col-12 lg:col-6" v-if="user.isMerchant">
        <form class="trazza-panel flex flex-column gap-3" @submit.prevent="saveBusiness">
          <h2 class="mt-0 mb-0 text-lg">{{ t('profile.business') }}</h2>
          <p class="m-0"><span class="trazza-label">{{ t('fields.ruc') }}:</span> {{ user.merchantProfile?.ruc }}</p>
          <div class="flex flex-column gap-1">
            <label for="business-name" class="trazza-label">{{ t('fields.business-name') }}</label>
            <pv-input-text id="business-name" v-model="business.businessName"/>
          </div>
          <div class="flex flex-column gap-1">
            <label for="business-type" class="trazza-label">{{ t('fields.business-type') }}</label>
            <pv-input-text id="business-type" v-model="business.businessType"/>
          </div>
          <pv-button type="submit" :label="t('actions.save')" class="align-self-start"/>
        </form>
      </div>
      <div class="col-12 lg:col-6" v-if="!user.isCarrier">
        <div class="trazza-panel">
          <h2 class="mt-0 text-lg">{{ t('profile.become-carrier') }}</h2>
          <p class="trazza-muted">{{ t('profile.become-carrier-hint') }}</p>
          <pv-button :label="t('profile.add-carrier-role')" icon="pi pi-truck" @click="addCarrierRole"/>
        </div>
      </div>
      <div class="col-12 lg:col-6" v-if="!user.isMerchant">
        <form class="trazza-panel flex flex-column gap-3" @submit.prevent="addMerchantRole">
          <h2 class="mt-0 mb-0 text-lg">{{ t('profile.become-merchant') }}</h2>
          <div class="flex flex-column gap-1">
            <label for="new-business-name" class="trazza-label">{{ t('fields.business-name') }}</label>
            <pv-input-text id="new-business-name" v-model="newMerchant.businessName"/>
          </div>
          <div class="flex flex-column gap-1">
            <label for="new-ruc" class="trazza-label">{{ t('fields.ruc') }}</label>
            <pv-input-text id="new-ruc" v-model="newMerchant.ruc" maxlength="11"/>
          </div>
          <div class="flex flex-column gap-1">
            <label for="new-business-type" class="trazza-label">{{ t('fields.business-type') }}</label>
            <pv-input-text id="new-business-type" v-model="newMerchant.businessType"/>
          </div>
          <pv-button type="submit" :label="t('profile.add-merchant-role')" icon="pi pi-shopping-bag" class="align-self-start"/>
        </form>
      </div>
    </div>
  </div>
</template>
