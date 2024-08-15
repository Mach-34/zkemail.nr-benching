import circuit from './circuits/target/noir_zkemail_benchmarks.json' assert { type: 'json' };
import {
  BarretenbergBackend,
  UltraHonkBackend,
} from '@noir-lang/backend_barretenberg';
import { Noir } from '@noir-lang/noir_js';
import { emailCircuitInput } from './constants.js';

const calcAvg = (aggTime, iterations) => {
  return {
    proofGenerationTime: aggTime.proofGenerationTime / iterations,
    proofVerificationTime: aggTime.proofVerificationTime / iterations,
    totalTime: aggTime.totalTime / iterations,
    witnessGenerationTime: aggTime.witnessGenerationTime / iterations,
  };
};

const prove = async (proveWith) => {
  let backend = undefined;
  if (proveWith === 'ultrahonk') {
    backend = new UltraHonkBackend(circuit);
  } else {
    backend = new BarretenbergBackend(circuit);
  }
  const noir = new Noir(circuit);
  const start = new Date().getTime() / 1000;
  const { witness } = await noir.execute(emailCircuitInput);
  const postWitnessGenerationTime = new Date().getTime() / 1000;
  const proof = await backend.generateProof(witness);
  const postProofGenerationTime = new Date().getTime() / 1000;
  await backend.verifyProof(proof);
  const postVerifyTime = new Date().getTime() / 1000;
  return {
    proofGenerationTime: postProofGenerationTime - postWitnessGenerationTime,
    proofVerificationTime: postVerifyTime - postProofGenerationTime,
    totalTime: postVerifyTime - start,
    witnessGenerationTime: postWitnessGenerationTime - start,
  };
};

const updateTotalTime = (total, iteration) => {
  total.proofGenerationTime += iteration.proofGenerationTime;
  total.proofVerificationTime += iteration.proofVerificationTime;
  total.totalTime += iteration.totalTime;
  total.witnessGenerationTime += iteration.witnessGenerationTime;
};

(async () => {
  const iterations = 10;

  const ultraHonkTimeAgg = {
    proofGenerationTime: 0,
    proofVerificationTime: 0,
    totalTime: 0,
    witnessGenerationTime: 0,
  };

  const ultraPlonkTimeAgg = {
    proofGenerationTime: 0,
    proofVerificationTime: 0,
    totalTime: 0,
    witnessGenerationTime: 0,
  };

  for (let i = 0; i < iterations; i++) {
    // update ultrahonk times
    updateTotalTime(ultraHonkTimeAgg, await prove('ultrahonk'));

    // update ultraplonk times
    updateTotalTime(ultraPlonkTimeAgg, await prove('ultraplonk'));
  }

  console.log(
    'Plonk averages: ',
    calcAvg(ultraPlonkTimeAgg, iterations),
    '\n\n'
  );
  console.log('Honk averages: ', calcAvg(ultraHonkTimeAgg, iterations));

  process.exit(0);
})();
