import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { schema } from './schema';
import { migrations } from './migrations';
import { Project } from '../models/Project';
import { TimeEntry } from '../models/TimeEntry';
import { DailyReport } from '../models/DailyReport';
import { PunchListItem } from '../models/PunchListItem';
import { SafetyIncident } from '../models/SafetyIncident';
import { Inspection } from '../models/Inspection';
import { JsaRecord } from '../models/JsaRecord';
import { Permit } from '../models/Permit';
import { ConcretePour } from '../models/ConcretePour';
import { ConcreteTestRecord } from '../models/ConcreteTestRecord';
import { RoofingSystem } from '../models/RoofingSystem';
import { RoofingQaRecord } from '../models/RoofingQaRecord';
import { FramingInspection } from '../models/FramingInspection';
import { FramingCorrectionItem } from '../models/FramingCorrectionItem';
import { ElectricalPanel } from '../models/ElectricalPanel';
import { ElectricalCircuit } from '../models/ElectricalCircuit';
import { PlumbingSystem } from '../models/PlumbingSystem';
import { PlumbingFixture } from '../models/PlumbingFixture';
import { SafetyCertification } from '../models/SafetyCertification';
import { CompanyAsset } from '../models/CompanyAsset';

const modelClasses = [
  Project, TimeEntry, DailyReport, PunchListItem, SafetyIncident,
  Inspection, SafetyCertification, CompanyAsset, JsaRecord, Permit, ConcretePour, ConcreteTestRecord,
  RoofingSystem, RoofingQaRecord, FramingInspection, FramingCorrectionItem,
  ElectricalPanel, ElectricalCircuit, PlumbingSystem, PlumbingFixture,
];

// This module is evaluated at startup (App → AppNavigator → sync → database).
// If adapter creation throws here it kills the app instantly with no UI. Guard
// it: try JSI, fall back to the (slower) non-JSI bridge adapter, and as a last
// resort export a stub that throws a readable error only when actually used —
// so the app still boots and the failure is visible instead of a silent crash.
function build(jsi: boolean): Database {
  const adapter = new SQLiteAdapter({
    schema,
    // Without this a schema version bump UNSAFE-RESETS the local DB, destroying
    // unsynced `pending` rows. Every schema bump needs a migration step.
    migrations,
    jsi,
    onSetUpError: (error) => {
      console.error('WatermelonDB setup error:', error);
    },
  });
  return new Database({ adapter, modelClasses });
}

export let databaseInitError: Error | null = null;

function init(): Database {
  // NOTE: jsi:true makes a native (C++) call at startup. If the JSI install
  // isn't right it hard-crashes the process before any JS runs — uncatchable,
  // app just closes. Use the bridge adapter (jsi:false) which fails as a normal
  // JS error we can surface. Revisit jsi once the app is confirmed stable.
  try {
    return build(false);
  } catch (bridgeError) {
    databaseInitError = bridgeError as Error;
    console.error('WatermelonDB bridge init failed:', bridgeError);
    // Stub: app boots; any DB access throws a clear, surfaced error.
    return new Proxy({} as Database, {
      get() {
        throw new Error(
          `WatermelonDB failed to initialize: ${(bridgeError as Error)?.message ?? bridgeError}`
        );
      },
    });
  }
}

export const database = init();
