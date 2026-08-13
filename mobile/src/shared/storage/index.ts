export { type KeyValueStorage, readJson, secureKeyValueStorage, writeJson } from './keyValueStorage';
export {
    clearLocalData,
    type LocalDataParticipant,
    type LocalDataSummary,
    measureLocalData,
    registerLocalDataParticipant,
    resetLocalDataRegistryForTests,
} from './localDataRegistry';
