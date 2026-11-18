import type { Product } from "../types";
import { acorn } from "./acorn";
import { joined } from "./joined";
import { senioraiplans } from "./senioraiplans";
import { sitelog } from "./sitelog";
import { toothledger } from "./toothledger";
import { trustdraft } from "./trustdraft";

/** All products in display order. Each product's copy lives in its own file to avoid merge conflicts. */
export const products: readonly Product[] = [joined, acorn, sitelog, toothledger, senioraiplans, trustdraft];
