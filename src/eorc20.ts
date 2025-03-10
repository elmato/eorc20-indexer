import { createHash } from "crypto";
import { Address, Hex, TransactionSerializableLegacy, fromHex, parseTransaction } from "viem";

export type Ticker = string;

export interface OpCode {
    p: string;      // 'eorc20'
    tick: Ticker;   // 'eoss'
}

export interface MintOpCode extends OpCode {
    op: "mint";
    amt: string;    // '10000'
}

export interface TransferOpCode extends OpCode {
    op: "transfer";
    amt: string;    // '10000'
}

export interface DeployOpCode extends OpCode {
    op: "deploy";
    max: string;    // '210000000000'
    lim?: string;    // '10000'
    prec?: number;    // 0
}

export type AnyOpCode = MintOpCode | TransferOpCode | DeployOpCode;

export function rlptxToTransaction(rlptx: Hex) {
    let tx: TransactionSerializableLegacy
    try {
        tx = parseTransaction(rlptx);
    } catch (e) {
        return null;
    }
    if ( !tx.to) return null;
    if ( !tx.data) return null;
    // nonce can be undefined or 0
    return tx;
}

// const str = fromHex(data, 'string');

export function parseOpCodeFromHex(data: Hex) {
    return parseOpCode(fromHex(data, 'string'));
}

export function parseOpCode(content: string): TransferOpCode | MintOpCode | DeployOpCode | null {
    const opCode = content.split(/data:[application\/json]?,/)[1];
    if ( !opCode ) return null;
    try {
        const parsedOp = JSON.parse(opCode);
        const { p, tick, op, amt, max } = parsedOp;

        // valid eorc-20 operations
        if ( !p || !tick || !op ) return null;
        if ( p !== "eorc20" ) return null;
        if ( !["deploy", "mint", "transfer"].includes(op) ) return null;

        // required fields
        if ( ["transfer", "mint"].includes(op)) {
            if ( !isValidAmount(amt) ) return null;
        }
        if ( op === "deploy") {
            if ( !isValidAmount(max) ) return null;
        }

        return parsedOp;
    } catch (e) {
        return null;
    }
}

export function contentUriToSha256(content_uri: string) {
    return createHash('sha256').update(content_uri, 'utf8').digest("hex")
}

export function isValidAmount(amt: string) {
    try {
        const value = BigInt(amt);
        // cannot be negative
        if ( value < 0n ) return false;
    } catch (e) {
        return false;
    }
    return true;
}