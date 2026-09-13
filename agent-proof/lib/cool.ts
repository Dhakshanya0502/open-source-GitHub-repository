import { CooL, verifyEvidence } from "cool-nwc"

/**
 * The application identity stamped into every receipt this demo produces.
 */
export const APPLICATION_ID = "agentproof-demo"

/**
 * Create a fresh CooL client.
 *
 * No `attestation.provider` and no `security.requireAttestation` are set, so the
 * client runs the built-in *simulated* evidence plane — the same code path as
 * hardware, clearly labelled `simulated` in every receipt and verdict. We never
 * set `requireHardware`/`requireAttestation: true` in this demo.
 */
export function createCooL(): CooL {
  return new CooL({ applicationId: APPLICATION_ID })
}

export { verifyEvidence }
