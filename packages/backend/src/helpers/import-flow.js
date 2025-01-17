import Crypto from 'crypto';
import Step from '../models/step.js';

const importFlow = async (user, flowData) => {
  const newFlowId = Crypto.randomUUID();
  const steps = flowData.steps || [];

  const newFlow = await user.$relatedQuery('flows').insertAndFetch({
    id: newFlowId,
    name: flowData.name,
    active: false,
  });

  const stepIdMap = {};

  // Generate new step IDs and insert steps without parameters
  for (const step of steps) {
    const newStepId = Crypto.randomUUID();
    stepIdMap[step.id] = newStepId;

    await Step.query().insert({
      id: newStepId,
      flowId: newFlowId,
      key: step.key,
      name: step.name,
      appKey: step.appKey,
      type: step.type,
      parameters: {},
      position: step.position,
      webhookPath: step.webhookPath?.replace(flowData.id, newFlowId),
    });
  }

  // Update steps with correct parameters
  for (const step of steps) {
    const newStepId = stepIdMap[step.id];

    await Step.query().patchAndFetchById(newStepId, {
      parameters: updateParameters(step.parameters, stepIdMap),
    });
  }

  return await newFlow.$query().withGraphFetched('steps');
};

const updateParameters = (parameters, stepIdMap) => {
  if (!parameters) return parameters;

  const stringifiedParameters = JSON.stringify(parameters);
  let updatedParameters = stringifiedParameters;

  Object.entries(stepIdMap).forEach(([oldStepId, newStepId]) => {
    updatedParameters = updatedParameters.replace(
      `{{step.${oldStepId}.`,
      `{{step.${newStepId}.`
    );
  });

  return JSON.parse(updatedParameters);
};

export default importFlow;
