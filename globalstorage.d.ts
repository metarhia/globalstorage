export type JSONSafe =
  | string
  | number
  | boolean
  | null
  | { readonly [key: string]: JSONSafe }
  | readonly JSONSafe[];

export interface KeyPair {
  readonly publicKey: string;
  readonly privateKey: string;
}

export function generateKeys(): Promise<KeyPair>;
export function encrypt(data: unknown, publicKey: string): string;
export function decrypt(data: string, privateKey: string): unknown;
export function loadKeys(basePath: string): Promise<KeyPair>;

export type CrdtDelta = Record<string, unknown>;

export type CrdtHistoryRecord =
  | { type: 'write'; id?: string; timestamp?: number; data?: unknown }
  | { type: 'delta'; data: unknown }
  | { type: 'delete'; key: string }
  | { type: 'inc'; key: string; value: number }
  | { type: 'dec'; key: string; value: number };

export function diff(source: unknown, target: unknown): CrdtDelta;
export function merge(source: unknown, delta: unknown): unknown;
export function apply(
  source: unknown,
  history: readonly CrdtHistoryRecord[],
): unknown;

export interface Block<T = unknown> {
  prev: string;
  timestamp: number;
  data: T;
}

export interface ChainDataEntry {
  id: string;
  hash: string;
}

export function calculateHash(data: JSONSafe): string;

export interface Blockchain {
  readonly path: string;
  tailHash: string;

  writeChain(): Promise<void>;
  addBlock(data: unknown): Promise<string>;
  writeBlock(block: Block): Promise<string>;
  readBlock(hash: string): Promise<Block>;
  validate(options?: { last?: number; from?: string }): Promise<boolean>;
}

export interface BlockchainConstructor {
  readonly prototype: Blockchain;
  new (basePath: string): Promise<Blockchain>;
}

export const Blockchain: BlockchainConstructor;

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

export type ContractExecuteArgs = { id: string } & Record<string, unknown>;

export type ContractProcedure = (
  reader: DataReader,
  args: ContractExecuteArgs,
) => unknown | Promise<unknown>;

export class DataReader {
  constructor(storage: Storage);
  get(id: string): Promise<unknown>;
}

export class SmartContract {
  constructor(name: string, proc: ContractProcedure, context: ContractContext);
  readonly name: string;

  execute(args: ContractExecuteArgs): Promise<unknown>;

  static save(
    name: string,
    chain: Blockchain,
    proc: ContractProcedure,
  ): Promise<string>;
  static load(hash: string, context: ContractContext): Promise<SmartContract>;
}

export type SchemaEntity = { readonly [fieldName: string]: unknown };
export type SchemaEntities =
  | { readonly [entityName: string]: SchemaEntity }
  | Map<string, SchemaEntity>;

export interface Schema {
  entities?: SchemaEntities;
  readonly [key: string]: unknown;
}

export interface StorageOptions {
  path?: string;
  name?: string;
  schema?: Schema;
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

export interface SyncManager {
  addNode(nodeData: NodeData): Promise<void>;
  removeNode(url: string): Promise<void>;
  listNodes(): Node[];
  start(): Promise<void>;
}

export interface SyncManagerConstructor {
  readonly prototype: SyncManager;
  new (
    basePath?: string,
    storage?: Storage,
    chain?: Blockchain,
  ): Promise<SyncManager>;
}

export const SyncManager: SyncManagerConstructor;

export interface StorageUpdate {
  type: string;
  id: string;
  timestamp: number;
  data: unknown;
}

export interface Storage {
  readonly schema: Schema | null;
  readonly sync: SyncManager;

  saveData(
    id: string,
    data: unknown,
    options?: StorageDataOptions,
  ): Promise<void>;
  loadData(id: string): Promise<unknown | null>;
  validate(options: { last?: number; from?: string }): Promise<boolean>;
  validate(id: string, data: unknown, blockHash: string): Promise<boolean>;
  insert(data: unknown): Promise<string>;
  has(id: string): Promise<boolean>;
  get(id: string): Promise<unknown>;
  set(id: string, data: unknown): Promise<void>;
  delete(id: string): Promise<void>;
  update(id: string, delta: unknown): Promise<void>;
  swap(id: string, changes: unknown, prev: unknown): Promise<boolean>;
  record(id: string): Promise<Storage.StorageRecord>;
  getCachedData(id: string): unknown | null;
  hasRecord(id: string): boolean;
  addUpdate(update: StorageUpdate): void;
}

export interface GsRecord {
  readonly id: string;
  on(event: 'update', listener: (data: unknown, delta: unknown) => void): void;
  data(): Promise<unknown>;
  delta(): Record<string, unknown>;
  save(): Promise<void>;
  delete(): Promise<void>;
}

declare class GsCollection {
  constructor(storage: Storage, name: string);
  readonly name: string;
  insert(data: unknown): Promise<GsRecord>;
  get(id: string): Promise<unknown | null>;
  delete(id: string): Promise<void>;
  update(id: string, delta: unknown): Promise<void>;
  record(id: string): Promise<GsRecord>;
}

declare const GsRecordCtor: {
  readonly prototype: GsRecord;
  new (id: string, storage: Storage): Promise<GsRecord>;
};

export interface StorageConstructor {
  readonly prototype: Storage;
  new (options?: StorageOptions): Promise<Storage>;
  Collection: typeof GsCollection;
  Record: typeof GsRecordCtor;
}

export const Storage: StorageConstructor;

export namespace Storage {
  export type StorageRecord = GsRecord;
  export type StorageCollection = GsCollection;
}

export function open(options?: StorageOptions): Promise<Storage>;
