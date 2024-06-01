import { Cell, Dictionary, DictionaryValue, Slice } from '@ton/core';
import { sha256 } from '@ton/crypto';
import { JettonMetadata } from './types';

const OFFCHAIN_CONTENT_PREFIX = 0x01;
const SNAKE_PREFIX = 0x00;

const dictSnakeBufferValue: DictionaryValue<Buffer> = {
  parse: (slice) => {
    const buffer = Buffer.from('');

    const sliceToVal = (s: Slice, v: Buffer, isFirst: boolean) => {
      if (isFirst && s.loadUint(8) !== SNAKE_PREFIX) {
        throw new Error('Only snake format is supported');
      }

      v = Buffer.concat([v, s.loadBuffer(s.remainingBits / 8)]);
      if (s.remainingRefs === 1) {
        v = sliceToVal(s.loadRef().beginParse(), v, false);
      }

      return v;
    };

    return sliceToVal(slice.loadRef().beginParse() as any, buffer, true);
  },
  serialize: () => {
    // pass
  },
};

const jettonOnChainMetadataSpec: {
  [key in keyof JettonMetadata]: 'utf8' | 'ascii' | undefined;
} = {
  uri: 'ascii',
  name: 'utf8',
  description: 'utf8',
  image: 'ascii',
  symbol: 'utf8',
  decimals: 'utf8',
};

export async function getJettonMetadata(content: Cell) {
  let metadata: JettonMetadata | undefined = undefined;

  const slice = content.asSlice();
  const prefix = slice.loadUint(8);

  if (prefix === OFFCHAIN_CONTENT_PREFIX) {
    const bytes = readSnakeBytes(slice);
    const contentUri = bytes.toString('utf-8');
    // console.log('fetchJettonOffchainMetadata');
    // metadata = await fetchJettonOffchainMetadata(contentUri);
  } else {
    // On-chain content
    metadata = await parseJettonOnchainMetadata(slice);
    if (metadata.uri) {
      // console.log('fetchJettonOffchainMetadata');
      // Semi-chain content
      // const offchainMetadata = await fetchJettonOffchainMetadata(metadata.uri);
      // metadata = { ...offchainMetadata, ...metadata };
    }
  }

  return metadata;
}

export async function parseJettonOnchainMetadata(slice: Slice): Promise<JettonMetadata> {
  const dict = slice.loadDict(Dictionary.Keys.Buffer(32), dictSnakeBufferValue);

  const res: { [s in keyof JettonMetadata]?: string } = {};

  for (const [key, value] of Object.entries(jettonOnChainMetadataSpec)) {
    const sha256Key = Buffer.from(await sha256(Buffer.from(key, 'ascii')));
    const val = dict.get(sha256Key)?.toString(value);

    if (val) {
      res[key as keyof JettonMetadata] = val;
    }
  }

  return res as JettonMetadata;
}

// export async function fetchJettonOffchainMetadata(uri: string): Promise<JettonMetadata> {
//   const metadata = await fetchJsonMetadata(uri);
//   return pick(metadata, ['name', 'description', 'symbol', 'decimals', 'image', 'image_data']);
// }

function readSnakeBytes(slice: Slice) {
  let buffer = Buffer.alloc(0);

  while (slice.remainingBits >= 8) {
    buffer = Buffer.concat([buffer, slice.loadBuffer(slice.remainingBits / 8)]);
    if (slice.remainingRefs) {
      slice = slice.loadRef().beginParse();
    } else {
      break;
    }
  }

  return buffer;
}
