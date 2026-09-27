# Council — The GPU Scientist

*Technically serious ideation on the Learned Representation Pyramid. Central claim: the level contract is not downsampling — it is a falsifiable constraint measured in macro representation space, JEPA-flavored.*

## 1. The contract: levels are constraints, not resolutions

Let the pyramid be L0 (40×20 macro tokens: flow vector field, beat/energy scalar, coarse semantic class per cell — 800 tokens total), L1 (mid grid, e.g. 110×62), L2 (terminal glyph texture, e.g. 220×124). The defining move: **L0 is not a summary of L2. L0 is a generative constraint on L2.**

Formalize with a frozen macro encoder E0 (trained first, RAFT-style, on the fleet's clips). For any render x at L2, the contract is:

**d(E0(x), L0) ≤ ε**, where d is expected endpoint error plus beat-energy divergence in L0 embedding space.

This is JEPA's discipline applied structurally: fidelity is measured in representation space, not pixel space. Pixels are free to vary; the macro field is not. Three conditioning mechanisms, in order of recommendation:

1. **Cross-attention with spatial anchoring.** The L2 decoder (a small transformer over glyph tokens) attends to the 800 L0 tokens; each L2 cell's attention is initialized/biased toward its containing L0 cell plus its 8 neighbors. This is the global information channel — everything else stays local-window.
2. **Flow-conditioned priors.** Learn an explicit histogram prior p(glyph | L0-cell class, motion bin) from the render corpus — "what does an up-left, high-beat 40×20 cell usually become at terminal resolution?" Use it to initialize logits; the network refines from there.
3. **Energy minimization where L0 is the energy source.** H(x) = λ₁·d(E0(x),L0)² + λ₂·local-prior NLL + λ₃·temporal-divergence. The transformer is an *amortized solver* for H; the RL agent does explicit iterative descent. This is where the quilt metaphor becomes math: **wave-function-collapse is constraint propagation on a grid, and here the adjacency rules are learned rather than hand-authored, with L0 as the propagated evidence.** CTRL/CoNZ-style ASCII conversion is the degenerate case — one fixed filter, no learned field, no contract to violate.

## 2. Prior art, mechanism by mechanism

- **Laplacian pyramids**: steal predict-coarse/add-residual; replace fixed Gaussian filters with learned residual quantizers.
- **RAFT**: iterative flow refinement via correlation-volume lookup — at 40×20 output the all-pairs volume is 800×800, trivial. E0 is RAFT-lite.
- **RQ-VAE**: levels-as-codebooks is the exact formalism. L0 tokens quantize motion/beat into a small codebook (~512 entries); L1 quantizes the residual L0 can't express; the L2 "codebook" is the glyph alphabet itself. EMA commitment updates keep codebooks alive.
- **JEPA**: the contract loss *is* prediction in representation space. Elephant-lineage inheritance, not analogy.
- **WFC**: the RL agent's edit loop is propagation; the transformer is the learned tile set.

## 3. What trains on 6GB — honest arithmetic

RTX 4050, bf16, FlashAttention-2. E0 (RAFT-lite, ~4M params): trains comfortably at reduced input res. L2 transformer (~15-25M params, dim 512, 8 layers, causal over rows with local window, cross-attn to L0): weights 50MB, AdamW states ~300MB, activations bounded by gradient checkpointing and 2-4k token rows — fits with batch 4-8. Full-attention over 27k glyph tokens is off the table; local windows + L0 cross-attention is the architecture that makes 6GB sufficient rather than limiting. Alternative: masked discrete diffusion over glyphs (3-8 denoise steps) — worth a spike; autoregressive rows is the safe default.

Distillation: cloud LLM judges score candidate L1/L2 patch pairs (offline, no GPU cost to us) → Bradley-Terry reward model, ~5M params → tiny student policy trains against the RM. Teacher never touches the GPU. Dataset is the fleet's own clips plus The Tap's render history: thousands of minutes, augmented by time-warp, palette-swap, beat-resample. Small by video-model standards, *exactly* right for a 20M-param conditional model.

## 4. exoJ as RL environment

- **Observation**: L0 field + current glyph grid + tool registry with typed arg schemas + last-k action results. ~2-4k tokens.
- **Actions**: `seek(t)`, `hold(cells)`, `park(look)`, `splice(a, b, t)`, `re-skin(palette, glyphset)`, `commit`, `rollback`. Discrete-typed.
- **Episode**: one edit pass over a 10-30s segment; terminates on commit.
- **Reward**: r = w₁·RM(human-pair score) − w₂·max_t contract_violation − w₃·edit_cost. The contract term prevents the agent from buying preference with macro unfaithfulness.
- **Key design claim**: the RL policy and the LLM operator share *one* action space — the exoJ interface. Editing data collected from LLM operators pretrains the RL agent (offline RL), closing the loop between "any LLM can operate the studio" and "the studio trains its own operator."

## 5. Failure taxonomy

1. **Plausible-but-unfaithful emergence (the 2029 problem)**: x satisfies the frozen E0 but humans see drifted motion — Goodharting the proxy. Mitigate: ensemble of E0 checkpoints (contract must hold for all members), scheduled human audits of contract-satisfying renders, keep E0 architectures heterogeneous.
2. **Mode collapse to one look**: conditional glyph distribution collapses regardless of L0. Mitigate: per-L0-bin glyph entropy bonus, VQ codebook-usage losses, multiple LoRA style adapters sampled per render; track renders-per-L0-class diversity as a first-class metric.
3. **Temporal flicker at level boundaries**: L0 re-quantizes per frame; boundaries snap. Mitigate: beat-aligned L0 segmentation (quantize on downbeats, not fixed windows), recurrent E0 so the encoder itself is temporally smooth, condition L2 on the previous frame's glyph state.

**Build order**: (1) E0 + contract metric on fleet clips — this defines truth; (2) L2 transformer with L0 cross-attention, teacher-forced; (3) exoJ gym wrapper + preference collection at The Tap. Everything else descends from those three.

*— GPU Scientist, Tessera council*
