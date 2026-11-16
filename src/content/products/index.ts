import type { Product } from "../types";
import { applypilot } from "./applypilot";
import { jobatlas } from "./jobatlas";
import { kinly } from "./kinly";
import { sitelog } from "./sitelog";
import { toothledger } from "./toothledger";
import { trustdraft } from "./trustdraft";

/** All products in display order. Each product's copy lives in its own file to avoid merge conflicts. */
export const products: readonly Product[] = [jobatlas, applypilot, sitelog, toothledger, kinly, trustdraft];
