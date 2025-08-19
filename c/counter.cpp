// program.cpp
#include "solana_sdk.h"

struct CounterAccount {
    uint64_t count;
};

extern "C" uint64_t entrypoint(const uint8_t *input) {
    SolParameters params = {0};
    if (!sol_deserialize(input, &params, SOL_ARRAY_SIZE(params.ka))) {
        sol_log_("deserialize failed");
        return ERROR_INVALID_ARGUMENT;
    }

    if (params.ka_num < 1) return ERROR_NOT_ENOUGH_ACCOUNT_KEYS;

    SolAccountInfo *ai = &params.ka[0];
    if (!ai->is_writable) return ERROR_ACCOUNT_NOT_WRITABLE;
    if (ai->data_len < sizeof(CounterAccount)) return ERROR_INVALID_ACCOUNT_DATA;

    uint64_t inc = 1;
    if (params.data_len >= sizeof(uint64_t)) {
        uint64_t tmp = 0;
        sol_memcpy(&tmp, params.data, sizeof(uint64_t));
        inc = tmp;
    }

    CounterAccount *st = reinterpret_cast<CounterAccount*>(ai->data);
    st->count += inc;

    sol_log_("ok");
    return SUCCESS;
}
