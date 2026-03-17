import { useMemo } from "react";
import { useAccessStore, useAppConfig } from "../store";
import { collectModelsWithDefaultModel, matchesModelSpecifier } from "./model";

export function useAllModels() {
  const accessStore = useAccessStore();
  const configStore = useAppConfig();
  const models = useMemo(() => {
    const availableModels = collectModelsWithDefaultModel(
      configStore.models,
      [configStore.customModels, accessStore.customModels].join(","),
      accessStore.defaultModel,
    );

    if (!accessStore.fixedModel) {
      return availableModels;
    }

    const fixedModels = availableModels
      .filter(
        (model) =>
          model.available &&
          matchesModelSpecifier(model, accessStore.fixedModel),
      )
      .map((model, index) => ({
        ...model,
        isDefault: index === 0,
      }));

    return fixedModels.length > 0 ? fixedModels : availableModels;
  }, [
    accessStore.customModels,
    accessStore.defaultModel,
    accessStore.fixedModel,
    configStore.customModels,
    configStore.models,
  ]);

  return models;
}
