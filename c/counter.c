// program.c
// Minimal counter program in C for Solana BPF

#include "solana_sdk.h"

typedef struct {
    uint64_t count;
} CounterAccount;

extern uint64_t entrypoint(const uint8_t *input) {
    SolParameters params = {0};

    if (!sol_deserialize(input, &params, SOL_ARRAY_SIZE(params.ka))) {
        sol_log_("Failed to deserialize parameters");
        return ERROR_INVALID_ARGUMENT;
    }

    if (params.ka_num < 1) {
        sol_log_("Not enough accounts");
        return ERROR_NOT_ENOUGH_ACCOUNT_KEYS;
    }

    SolAccountInfo *counter_ai = &params.ka[0];

    if (!counter_ai->is_writable) {
        sol_log_("Counter account not writable");
        return ERROR_ACCOUNT_NOT_WRITABLE;
    }

    if (counter_ai->data_len < sizeof(CounterAccount)) {
        sol_log_("Counter account too small");
        return ERROR_INVALID_ACCOUNT_DATA;
    }

    // Parse increment amount from instruction data (LE u64), default = 1
    uint64_t inc = 1;
    if (params.data_len >= sizeof(uint64_t)) {
        // NOTE: Solana is little-endian on-chain; copy to avoid alignment issues.
        uint64_t tmp = 0;
        sol_memcpy(&tmp, params.data, sizeof(uint64_t));
        inc = tmp;
    }

    CounterAccount *state = (CounterAccount *)counter_ai->data;
    uint64_t before = state->count;
    state->count = before + inc;

    sol_log_("Counter incremented");
    return SUCCESS;
}
