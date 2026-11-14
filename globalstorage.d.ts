import { Emitter } from 'metautil';

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

export interface KeyFiles {
  read(dir: string, filename: string): Promise<string | null>;
  write(dir: string, filename: string, content: string): Promise<void>;
}

export function memoizeLast<T>(fn: (pem: string) => T): (pem: string) => T;
export function loadKeyPair(
  files: KeyFiles,
  generateKeys: () => Promise<KeyPair>,
  basePath: string,
): Promise<KeyPair>;

export type CrdtDelta = Record<string, unknown>;

export interface CrdtStamp {
  readonly time: number;
  readonly replica: string;
}

export interface LwwRegister {
  readonly $lww: CrdtStamp & { readonly value: JSONSafe };
}

export type CrdtCounts = { readonly [replica: string]: number };

export interface CrdtCounter {
  readonly $counter: { readonly inc?: CrdtCounts; readonly dec?: CrdtCounts };
}

export type CrdtSetItem = string | number | boolean | null;

export type CrdtValue =
  LwwRegister | CrdtCounter | readonly CrdtSetItem[] | CrdtState;

export interface CrdtState {
  readonly [key: string]: CrdtValue;
}

export function diff(source: unknown, target: unknown): CrdtDelta;
export function merge(source: unknown, delta: unknown): unknown;
export function apply(source: unknown, deltas: readonly unknown[]): unknown;
export function materialize(state: unknown): unknown;
export function latestTime(state: unknown): number;
export function assign(
  fields: Record<string, unknown>,
  stamp: CrdtStamp,
): CrdtState;
export function increment(
  state: unknown,
  path: readonly string[],
  amount: number,
  replica: string,
): CrdtState;
export function isDelta(delta: unknown): delta is CrdtState;
export function emitError(emitter: Emitter, error: Error): void;

export interface Delta {
  readonly id: string;
  readonly entity: string;
  readonly target: string;
  readonly data: CrdtState;
}

export interface LogEntries {
  readonly deltas: readonly Delta[];
  readonly position: number;
}

export interface LogEvent extends LogEntries {
  readonly origin: string;
}

export interface Link {
  source: string;
  pulled: number;
  pushed: number;
}

export interface ReplicaOptions {
  path?: string;
  validate?: (delta: Delta) => boolean;
}

export class Replica extends Emitter {
  constructor(options?: ReplicaOptions);
  readonly id: string;
  readonly position: number;
  readonly size: number;
  readonly cleared: string[];

  open(): Promise<Replica>;
  get(target: string): Record<string, unknown> | null;
  state(target: string): CrdtState | null;
  keys(entity?: string): IterableIterator<string>;
  since(position?: number, limit?: number): LogEntries;
  origin(position: number): string;
  assign(
    entity: string,
    target: string,
    fields: Record<string, unknown>,
  ): Delta | null;
  increment(
    entity: string,
    target: string,
    path: readonly string[],
    amount?: number,
  ): Delta | null;
  merge(deltas: readonly unknown[], origin?: string): Delta[];
  getLink(name: string): Link;
  setLink(name: string, link: Link): void;
  clear(): Promise<void>;
  save(): Promise<void>;

  on(event: 'log', listener: (event: LogEvent) => void): void;
  on(event: 'clear', listener: () => void): void;
  on(event: 'error', listener: (error: Error) => void): void;
  on(event: string, listener: (...args: any[]) => void): void;
}

export interface Block<T = unknown> {
  prev: string;
  timestamp: number;
  data: T;
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
  chain?: Blockchain;
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
  { readonly [entityName: string]: SchemaEntity } | Map<string, SchemaEntity>;

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

export interface SyncEntries extends LogEntries {
  readonly source: string;
}

export interface PullReply extends SyncEntries {
  readonly more: boolean;
  readonly cleared: readonly string[];
}

export interface PushReply {
  readonly source: string;
  readonly position: number;
  readonly applied: number;
}

export interface SyncClient {
  emit(name: string, data: unknown): unknown;
  on(name: 'close', listener: () => void): void;
}

export interface SyncContext {
  client?: SyncClient | null;
}

export interface SyncApi {
  subscribe(args?: unknown, context?: SyncContext): Promise<boolean>;
  pull(args: { source?: string; position?: number }): Promise<PullReply>;
  push(args: { deltas: readonly unknown[] }): Promise<PushReply>;
}

export interface SyncServiceOptions {
  unit?: string;
  name?: string;
}

export class SyncService {
  constructor(replica: Replica, options?: SyncServiceOptions);
  readonly api: SyncApi;
  close(): void;
}

export interface MetacomUnitLike {
  on(name: string, listener: (data: never) => void): void;
  off(name: string, listener?: (data: never) => void): void;
  listeners(name: string): Function[];
  readonly [method: string]: unknown;
}

export interface MetacomLike {
  readonly active: boolean;
  readonly api: { readonly [unit: string]: MetacomUnitLike };
  load(...units: string[]): Promise<void>;
  on(name: 'open', listener: () => void): void;
  off(name: 'open', listener?: () => void): void;
}

export interface UplinkOptions {
  unit?: string;
  name?: string;
  clear?: 'follow' | 'resend';
}

export class Uplink extends Emitter {
  constructor(replica: Replica, metacom: MetacomLike, options?: UplinkOptions);
  readonly link: Link;
  start(): void;
  stop(): void;
  sync(): Promise<boolean>;
  pull(): Promise<boolean>;
  flush(): Promise<boolean>;
  on(event: 'error', listener: (error: Error) => void): void;
  on(event: string, listener: (...args: any[]) => void): void;
}

export interface Storage {
  readonly schema: Schema | null;
  readonly chain: Blockchain;

  saveData(
    id: string,
    data: unknown,
    options?: StorageDataOptions,
  ): Promise<void>;
  loadData(id: string): Promise<unknown | null>;
  validate(options?: { last?: number; from?: string }): Promise<boolean>;
  insert(data: unknown): Promise<string>;
  has(id: string): Promise<boolean>;
  get(id: string): Promise<unknown>;
  set(id: string, data: unknown): Promise<void>;
  delete(id: string): Promise<void>;
  update(id: string, delta: unknown): Promise<void>;
  swap(id: string, changes: unknown, prev: unknown): Promise<boolean>;
  record(id: string): Promise<Storage.StorageRecord>;
  hasRecord(id: string): boolean;
  referenceFields(type: string): string[];
}

export interface RecordUpdate {
  data: unknown;
  delta: Record<string, unknown>;
}

export interface GsRecord {
  readonly id: string;
  on(event: 'update', listener: (event: RecordUpdate) => void): void;
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
