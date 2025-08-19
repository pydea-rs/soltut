## Build
# Path to the C headers (adjust to your setup)
SDK_INC="$HOME/.local/share/solana/install/releases/*/solana-release/bin/../sdk/bpf/c/inc"
# If you cloned the repo, something like: SDK_INC="$HOME/solana/sdk/bpf/c/inc"

clang \
  -O2 -g \
  -target bpfel-unknown-unknown \
  -ffunction-sections -fdata-sections -fno-builtin \
  -I "$SDK_INC" \
  -c program.c -o program.o


* That produces an ELF object (program.o) ready to deploy as a Solana program.

* (Tip: you can also write a tiny Makefile that sets SDK_INC and the flags above.)

## Deploy
# Configure a payer if you haven't:
solana-keygen new -o payer.json
solana config set --keypair payer.json
solana config set --url https://api.devnet.solana.com

# Airdrop on devnet
solana airdrop 2

# Deploy the program
solana program deploy program.o
# Capture the Program Id printed here, e.g.:
# Program Id: 7h...xyz

## Extra Explanations:
Check this out: <a href="https://chatgpt.com/share/68a3cf6c-ebec-8001-b48c-8236ef010d11">CHATGPT: Sample Solana Program With C/C++</a>
