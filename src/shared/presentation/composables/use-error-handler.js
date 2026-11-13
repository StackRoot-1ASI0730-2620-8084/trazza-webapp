import {useI18n} from "vue-i18n";
import {useToast} from "primevue";

/**
 * Composable that translates domain and infrastructure errors into toast messages.
 *
 * @returns {{describeError: function(Error): string, showError: function(Error): void, showSuccess: function(string, Object=): void}}
 */
export function useErrorHandler() {
    const { t, te } = useI18n();
    const toast = useToast();

    /**
     * @param {Error} error - Error thrown by a domain object, a store or the HTTP client.
     * @returns {string} Translated message.
     */
    const describeError = error => {
        const problem = error?.response?.data;
        if (problem?.code && te(`api-errors.${problem.code}`)) return t(`api-errors.${problem.code}`);
        if (problem?.detail) return problem.detail;
        if (problem?.errors) return t('errors.invalid-request');
        const key = error?.message ?? '';
        if (te(key)) return t(key);
        if (error?.isAxiosError) return t(error.response ? 'errors.server' : 'errors.network');
        return t('errors.unexpected');
    };

    /**
     * @param {Error} error - Error to display.
     * @returns {void}
     */
    const showError = error => {
        console.error(error);
        toast.add({ severity: 'error', summary: t('errors.title'), detail: describeError(error), life: 4500 });
    };

    /**
     * @param {string} key - I18n key of the message.
     * @param {Object} [params={}] - Interpolation parameters.
     * @returns {void}
     */
    const showSuccess = (key, params = {}) => {
        toast.add({ severity: 'success', summary: t('messages.done'), detail: t(key, params), life: 3000 });
    };

    return { describeError, showError, showSuccess };
}
