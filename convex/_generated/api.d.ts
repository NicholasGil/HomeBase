/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as commandCenter from "../commandCenter.js";
import type * as concierge from "../concierge.js";
import type * as dashboard from "../dashboard.js";
import type * as documents from "../documents.js";
import type * as esign from "../esign.js";
import type * as explainer from "../explainer.js";
import type * as idv from "../idv.js";
import type * as journey from "../journey.js";
import type * as lib_audit from "../lib/audit.js";
import type * as lib_authz from "../lib/authz.js";
import type * as lib_classifyDocument from "../lib/classifyDocument.js";
import type * as lib_commandCenter from "../lib/commandCenter.js";
import type * as lib_dashboardView from "../lib/dashboardView.js";
import type * as lib_documentAccess from "../lib/documentAccess.js";
import type * as lib_esign from "../lib/esign.js";
import type * as lib_esignSandbox from "../lib/esignSandbox.js";
import type * as lib_idv from "../lib/idv.js";
import type * as lib_idvSandbox from "../lib/idvSandbox.js";
import type * as lib_journeyLogic from "../lib/journeyLogic.js";
import type * as lib_validators from "../lib/validators.js";
import type * as me from "../me.js";
import type * as offers from "../offers.js";
import type * as orgs from "../orgs.js";
import type * as seed from "../seed.js";
import type * as seedPlan from "../seedPlan.js";
import type * as tasks from "../tasks.js";
import type * as tours from "../tours.js";
import type * as transactions from "../transactions.js";
import type * as lib_driveTimes from "../lib/driveTimes.js";
import type * as lib_offerModel from "../lib/offerModel.js";
import type * as lib_tourOptimizer from "../lib/tourOptimizer.js";
import type * as lib_vendors from "../lib/vendors.js";
import type * as lib_vendorAccess from "../lib/vendorAccess.js";
import type * as vendors from "../vendors.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  commandCenter: typeof commandCenter;
  concierge: typeof concierge;
  dashboard: typeof dashboard;
  documents: typeof documents;
  esign: typeof esign;
  explainer: typeof explainer;
  idv: typeof idv;
  journey: typeof journey;
  "lib/audit": typeof lib_audit;
  "lib/authz": typeof lib_authz;
  "lib/classifyDocument": typeof lib_classifyDocument;
  "lib/commandCenter": typeof lib_commandCenter;
  "lib/dashboardView": typeof lib_dashboardView;
  "lib/documentAccess": typeof lib_documentAccess;
  "lib/esign": typeof lib_esign;
  "lib/esignSandbox": typeof lib_esignSandbox;
  "lib/idv": typeof lib_idv;
  "lib/idvSandbox": typeof lib_idvSandbox;
  "lib/journeyLogic": typeof lib_journeyLogic;
  "lib/validators": typeof lib_validators;
  me: typeof me;
  offers: typeof offers;
  orgs: typeof orgs;
  seed: typeof seed;
  seedPlan: typeof seedPlan;
  tasks: typeof tasks;
  tours: typeof tours;
  transactions: typeof transactions;
  "lib/driveTimes": typeof lib_driveTimes;
  "lib/offerModel": typeof lib_offerModel;
  "lib/tourOptimizer": typeof lib_tourOptimizer;
  "lib/vendors": typeof lib_vendors;
  "lib/vendorAccess": typeof lib_vendorAccess;
  vendors: typeof vendors;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
