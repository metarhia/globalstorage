// Submodule: utils

export const toBool: [() => boolean, () => boolean];
export function exists(path: string): Promise<boolean>;
export function ensureDirectory(path: string): Promise<boolean>;

// Submodule: keys

export interface KeyPair {
  publicKey: string;
  privateKey: string;
}

export function generateKeys(): Promise<KeyPair>;
export function encrypt(data: unknown, publicKey: string): string;
export function decrypt(data: string, privateKey: string): unknown;
export function loadKeys(basePath: string): Promise<KeyPair>;

// Submodule: chain

export interface Block {
  id: string;
  prev: string;
  timestamp: number;
  data: unknown;
}

export interface ChainInfo {
  tailHash: string;
  nextId: number;
}

export interface BlockResult {
  id: number;
  hash: string;
}

export function calculateHash(data: unknown): string;

export class Blockchain {
  constructor(basePath: string);
  path: string;
  tailHash: string;
  nextId: number;

  writeChain(): Promise<void>;
  addBlock(data: unknown): Promise<BlockResult>;
  writeBlock(block: Block): Promise<string>;
  readBlock(hash: string): Promise<Block>;
  isValid(options?: { last?: number; from?: string }): Promise<boolean>;
}

// Submodule: contract

export interface ContractContext {
  storage: Storage;
  chain: Blockchain;
}

export interface ContractBlock {
  type: 'smart contract';
  name: string;
  source: string;
}

export interface ErrorBlock {
  contract: string;
  args: unknown;
  error: string;
  timestamp: number;
}

export class DataReader {
  constructor(storage: Storage);
  get(id: string): Promise<unknown>;
}

export class SmartContract {
  constructor(name: string, proc: Function, context: ContractContext);
  name: string;

  execute(args: { id: string; [key: string]: unknown }): Promise<unknown>;

  static save(
    name: string,
    chain: Blockchain,
    proc: Function,
  ): Promise<BlockResult>;
  static load(hash: string, context: ContractContext): Promise<SmartContract>;
}

// Submodule: storage

export interface StorageOptions {
  encrypted?: boolean;
}

export interface StorageEntry {
  data: unknown;
  encrypted: boolean;
  timestamp: number;
  block: string;
}

export class Storage {
  constructor(basePath: string, blockchain: Blockchain, keys?: KeyPair);

  saveData(id: string, data: unknown, options?: StorageOptions): Promise<void>;
  loadData(id: string): Promise<unknown>;
  validate(id: string, data: unknown, blockHash: string): Promise<boolean>;
}
