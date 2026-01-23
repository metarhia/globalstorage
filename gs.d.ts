export interface KeyPair {
  publicKey: string;
  privateKey: string;
}

export function generateKeys(): Promise<KeyPair>;
export function encrypt(data: unknown, publicKey: string): string;
export function decrypt(data: string, privateKey: string): unknown;
export function loadKeys(basePath: string): Promise<KeyPair>;

export interface Block {
  prev: string;
  timestamp: number;
  data: unknown;
}

export interface ChainInfo {
  tailHash: string;
}

export function calculateHash(data: unknown): string;

export class Blockchain {
  constructor(basePath: string);
  path: string;
  tailHash: string;

  writeChain(): Promise<void>;
  addBlock(data: unknown): Promise<string>;
  writeBlock(block: Block): Promise<string>;
  readBlock(hash: string): Promise<Block>;
  validate(options?: { last?: number; from?: string }): Promise<boolean>;
}

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

  static save(name: string, chain: Blockchain, proc: Function): Promise<string>;
  static load(hash: string, context: ContractContext): Promise<SmartContract>;
}

export type SchemaEntity = { [fieldName: string]: unknown };
export type SchemaEntities =
  | { [entityName: string]: SchemaEntity }
  | Map<string, SchemaEntity>;

export interface Schema {
  entities?: SchemaEntities;
  [key: string]: unknown;
}

export interface StorageOptions {
  path?: string;
  schema?: Schema;
}

export class Collection {
  constructor(storage: Storage, name: string);
  readonly name: string;
  insert(data: unknown): Promise<Record>;
  get(id: string): Promise<unknown>;
  delete(id: string): Promise<void>;
  update(id: string, delta: unknown): Promise<void>;
  record(id: string): Promise<Record>;
}

export interface StorageDataOptions {
  encrypted?: boolean;
}

export interface StorageEntry {
  data: unknown;
  encrypted: boolean;
  timestamp: number;
  block: string;
}

export class Record {
  constructor(id: string, storage: Storage);
  readonly id: string;
  on(event: 'update', listener: (data: unknown, delta: unknown) => void): void;
  data(): Promise<unknown>;
  delta(): { [key: string]: unknown };
  save(): Promise<void>;
  delete(): Promise<void>;
}

export interface Node {
  type: 'uplink' | 'downlink';
  url: string;
  token?: string;
  enabled: boolean;
  lastSync: number;
}

export interface NodeData {
  url: string;
  type: 'uplink' | 'downlink';
  token?: string;
}

export class SyncManager {
  constructor(basePath: string);
  addNode(nodeData: NodeData): Promise<void>;
  removeNode(url: string): Promise<void>;
  listNodes(): Node[];
  start(): Promise<void>;
}

export class Storage {
  constructor(options?: StorageOptions);
  readonly schema: Schema | null;
  readonly sync: SyncManager;

  saveData(
    id: string,
    data: unknown,
    options?: StorageDataOptions,
  ): Promise<void>;
  loadData(id: string): Promise<unknown>;
  validate(
    idOrOptions: string | { last?: number; from?: string },
    data?: unknown,
    blockHash?: string,
  ): Promise<boolean>;
  insert(data: unknown): Promise<string>;
  has(id: string): Promise<boolean>;
  get(id: string): Promise<unknown>;
  set(id: string, data: unknown): Promise<void>;
  delete(id: string): Promise<void>;
  update(id: string, delta: unknown): Promise<void>;
  swap(id: string, changes: unknown, prev: unknown): Promise<boolean>;
  record(id: string): Promise<Record>;
  getCachedData(id: string): unknown | null;
  hasRecord(id: string): boolean;
  addUpdate(update: {
    type: string;
    id: string;
    timestamp: number;
    data: unknown;
  }): void;
}

export function open(options?: StorageOptions): Promise<Storage>;
