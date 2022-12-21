
import { BitmapFormat, HaloBitmapMetadata, HaloSceneManager, HaloBitmap } from "../../rust/pkg";
import { TextureMapping } from "../TextureHolder";
import { makeSolidColorTexture2D } from "../gfx/helpers/TextureHelpers";
import { GfxDevice, GfxTextureDimension, GfxTextureUsage } from "../gfx/platform/GfxPlatform";
import { GfxFormat } from "../gfx/platform/GfxPlatformFormat";
import { GfxSampler, GfxTexture } from "../gfx/platform/GfxPlatformImpl";
import { wasm } from "./scenes";
import ArrayBufferSlice from "../ArrayBufferSlice";

const P8Palette = [
    0xFF,0x7A,0x19,0xCC,0xFF,0x7E,0x19,0xCC,0xFF,0x80,0x19,0xCC,0xFF,0x81,0x19,0xCC,0xFF,0x85,0x19,0xCC,0xFF,0x74,0x2F,0xE2,0xFF,0x7A,0x2F,0xE2,0xFF,0x7E,0x2F,0xE2,0xFF,0x80,0x2F,0xE2,0xFF,0x81,0x2F,0xE2,0xFF,0x85,0x2F,0xE2,0xFF,0x8B,0x2F,0xE2,0xFF,0x6B,0x42,0xED,0xFF,0x74,0x42,0xEE,0xFF,0x7A,0x42,0xEF,0xFF,0x7E,0x42,0xEF,
    0xFF,0x80,0x42,0xEF,0xFF,0x81,0x42,0xEF,0xFF,0x85,0x42,0xEF,0xFF,0x8B,0x42,0xEE,0xFF,0x94,0x42,0xED,0xFF,0x60,0x52,0xF2,0xFF,0x6B,0x52,0xF5,0xFF,0x74,0x52,0xF6,0xFF,0x7A,0x52,0xF7,0xFF,0x7E,0x52,0xF7,0xFF,0x80,0x52,0xF7,0xFF,0x81,0x52,0xF7,0xFF,0x85,0x52,0xF7,0xFF,0x8B,0x52,0xF6,0xFF,0x94,0x52,0xF5,0xFF,0x9F,0x52,0xF2,
    0xFF,0x52,0x60,0xF2,0xFF,0x60,0x60,0xF7,0xFF,0x6B,0x60,0xF9,0xFF,0x74,0x60,0xFB,0xFF,0x7A,0x60,0xFB,0xFF,0x7E,0x60,0xFB,0xFF,0x80,0x60,0xFB,0xFF,0x81,0x60,0xFB,0xFF,0x85,0x60,0xFB,0xFF,0x8B,0x60,0xFB,0xFF,0x94,0x60,0xF9,0xFF,0x9F,0x60,0xF7,0xFF,0xAD,0x60,0xF2,0xFF,0x42,0x6B,0xED,0xFF,0x52,0x6B,0xF5,0xFF,0x60,0x6B,0xF9,
    0xFF,0x6B,0x6B,0xFC,0xFF,0x74,0x6B,0xFD,0xFF,0x7A,0x6B,0xFD,0xFF,0x7E,0x6B,0xFD,0xFF,0x80,0x6B,0xFD,0xFF,0x81,0x6B,0xFD,0xFF,0x85,0x6B,0xFD,0xFF,0x8B,0x6B,0xFD,0xFF,0x94,0x6B,0xFC,0xFF,0x9F,0x6B,0xF9,0xFF,0xAD,0x6B,0xF5,0xFF,0xBD,0x6B,0xED,0xFF,0x2F,0x74,0xE2,0xFF,0x42,0x74,0xEE,0xFF,0x52,0x74,0xF6,0xFF,0x60,0x74,0xFB,
    0xFF,0x6B,0x74,0xFD,0xFF,0x74,0x74,0xFE,0xFF,0x7A,0x74,0xFE,0xFF,0x7E,0x74,0xFE,0xFF,0x80,0x74,0xFE,0xFF,0x81,0x74,0xFE,0xFF,0x85,0x74,0xFE,0xFF,0x8B,0x74,0xFE,0xFF,0x94,0x74,0xFD,0xFF,0x9F,0x74,0xFB,0xFF,0xAD,0x74,0xF6,0xFF,0xBD,0x74,0xEE,0xFF,0xD0,0x74,0xE2,0xFF,0x19,0x7A,0xCC,0xFF,0x2F,0x7A,0xE2,0xFF,0x42,0x7A,0xEF,
    0xFF,0x52,0x7A,0xF7,0xFF,0x60,0x7A,0xFB,0xFF,0x6B,0x7A,0xFD,0xFF,0x74,0x7A,0xFE,0xFF,0x7A,0x7A,0xFF,0xFF,0x7E,0x7A,0xFF,0xFF,0x80,0x7A,0xFF,0xFF,0x81,0x7A,0xFF,0xFF,0x85,0x7A,0xFF,0xFF,0x8B,0x7A,0xFE,0xFF,0x94,0x7A,0xFD,0xFF,0x9F,0x7A,0xFB,0xFF,0xAD,0x7A,0xF7,0xFF,0xBD,0x7A,0xEF,0xFF,0xD0,0x7A,0xE2,0xFF,0xE5,0x7A,0xCC,
    0xFF,0x19,0x7E,0xCC,0xFF,0x2F,0x7E,0xE2,0xFF,0x42,0x7E,0xEF,0xFF,0x52,0x7E,0xF7,0xFF,0x60,0x7E,0xFB,0xFF,0x6B,0x7E,0xFD,0xFF,0x74,0x7E,0xFE,0xFF,0x7A,0x7E,0xFF,0xFF,0x7E,0x7E,0xFF,0xFF,0x80,0x7E,0xFF,0xFF,0x81,0x7E,0xFF,0xFF,0x85,0x7E,0xFF,0xFF,0x8B,0x7E,0xFE,0xFF,0x94,0x7E,0xFD,0xFF,0x9F,0x7E,0xFB,0xFF,0xAD,0x7E,0xF7,
    0xFF,0xBD,0x7E,0xEF,0xFF,0xD0,0x7E,0xE2,0xFF,0xE5,0x7E,0xCC,0xFF,0x19,0x80,0xCC,0xFF,0x2F,0x80,0xE2,0xFF,0x42,0x80,0xEF,0xFF,0x52,0x80,0xF7,0xFF,0x60,0x80,0xFB,0xFF,0x6B,0x80,0xFD,0xFF,0x74,0x80,0xFE,0xFF,0x7A,0x80,0xFF,0xFF,0x7E,0x80,0xFF,0xFF,0x80,0x80,0xFF,0xFF,0x81,0x80,0xFF,0xFF,0x85,0x80,0xFF,0xFF,0x8B,0x80,0xFE,
    0xFF,0x94,0x80,0xFD,0xFF,0x9F,0x80,0xFB,0xFF,0xAD,0x80,0xF7,0xFF,0xBD,0x80,0xEF,0xFF,0xD0,0x80,0xE2,0xFF,0xE5,0x80,0xCC,0xFF,0x19,0x81,0xCC,0xFF,0x2F,0x81,0xE2,0xFF,0x42,0x81,0xEF,0xFF,0x52,0x81,0xF7,0xFF,0x60,0x81,0xFB,0xFF,0x6B,0x81,0xFD,0xFF,0x74,0x81,0xFE,0xFF,0x7A,0x81,0xFF,0xFF,0x7E,0x81,0xFF,0xFF,0x80,0x81,0xFF,
    0xFF,0x81,0x81,0xFF,0xFF,0x85,0x81,0xFF,0xFF,0x8B,0x81,0xFE,0xFF,0x94,0x81,0xFD,0xFF,0x9F,0x81,0xFB,0xFF,0xAD,0x81,0xF7,0xFF,0xBD,0x81,0xEF,0xFF,0xD0,0x81,0xE2,0xFF,0xE5,0x81,0xCC,0xFF,0x19,0x85,0xCC,0xFF,0x2F,0x85,0xE2,0xFF,0x42,0x85,0xEF,0xFF,0x52,0x85,0xF7,0xFF,0x60,0x85,0xFB,0xFF,0x6B,0x85,0xFD,0xFF,0x74,0x85,0xFE,
    0xFF,0x7A,0x85,0xFF,0xFF,0x7E,0x85,0xFF,0xFF,0x80,0x85,0xFF,0xFF,0x81,0x85,0xFF,0xFF,0x85,0x85,0xFF,0xFF,0x8B,0x85,0xFE,0xFF,0x94,0x85,0xFD,0xFF,0x9F,0x85,0xFB,0xFF,0xAD,0x85,0xF7,0xFF,0xBD,0x85,0xEF,0xFF,0xD0,0x85,0xE2,0xFF,0xE5,0x85,0xCC,0xFF,0x2F,0x8B,0xE2,0xFF,0x42,0x8B,0xEE,0xFF,0x52,0x8B,0xF6,0xFF,0x60,0x8B,0xFB,
    0xFF,0x6B,0x8B,0xFD,0xFF,0x74,0x8B,0xFE,0xFF,0x7A,0x8B,0xFE,0xFF,0x7E,0x8B,0xFE,0xFF,0x80,0x8B,0xFE,0xFF,0x81,0x8B,0xFE,0xFF,0x85,0x8B,0xFE,0xFF,0x8B,0x8B,0xFE,0xFF,0x94,0x8B,0xFD,0xFF,0x9F,0x8B,0xFB,0xFF,0xAD,0x8B,0xF6,0xFF,0xBD,0x8B,0xEE,0xFF,0xD0,0x8B,0xE2,0xFF,0x42,0x94,0xED,0xFF,0x52,0x94,0xF5,0xFF,0x60,0x94,0xF9,
    0xFF,0x6B,0x94,0xFC,0xFF,0x74,0x94,0xFD,0xFF,0x7A,0x94,0xFD,0xFF,0x7E,0x94,0xFD,0xFF,0x80,0x94,0xFD,0xFF,0x81,0x94,0xFD,0xFF,0x85,0x94,0xFD,0xFF,0x8B,0x94,0xFD,0xFF,0x94,0x94,0xFC,0xFF,0x9F,0x94,0xF9,0xFF,0xAD,0x94,0xF5,0xFF,0xBD,0x94,0xED,0xFF,0x52,0x9F,0xF2,0xFF,0x60,0x9F,0xF7,0xFF,0x6B,0x9F,0xF9,0xFF,0x74,0x9F,0xFB,
    0xFF,0x7A,0x9F,0xFB,0xFF,0x7E,0x9F,0xFB,0xFF,0x80,0x9F,0xFB,0xFF,0x81,0x9F,0xFB,0xFF,0x85,0x9F,0xFB,0xFF,0x8B,0x9F,0xFB,0xFF,0x94,0x9F,0xF9,0xFF,0x9F,0x9F,0xF7,0xFF,0xAD,0x9F,0xF2,0xFF,0x60,0xAD,0xF2,0xFF,0x6B,0xAD,0xF5,0xFF,0x74,0xAD,0xF6,0xFF,0x7A,0xAD,0xF7,0xFF,0x7E,0xAD,0xF7,0xFF,0x80,0xAD,0xF7,0xFF,0x81,0xAD,0xF7,
    0xFF,0x85,0xAD,0xF7,0xFF,0x8B,0xAD,0xF6,0xFF,0x94,0xAD,0xF5,0xFF,0x9F,0xAD,0xF2,0xFF,0x6B,0xBD,0xED,0xFF,0x74,0xBD,0xEE,0xFF,0x7A,0xBD,0xEF,0xFF,0x7E,0xBD,0xEF,0xFF,0x80,0xBD,0xEF,0xFF,0x81,0xBD,0xEF,0xFF,0x85,0xBD,0xEF,0xFF,0x8B,0xBD,0xEE,0xFF,0x94,0xBD,0xED,0xFF,0x74,0xD0,0xE2,0xFF,0x7A,0xD0,0xE2,0xFF,0x7E,0xD0,0xE2,
    0xFF,0x80,0xD0,0xE2,0xFF,0x81,0xD0,0xE2,0xFF,0x85,0xD0,0xE2,0xFF,0x8B,0xD0,0xE2,0xFF,0x7A,0xE5,0xCC,0xFF,0x7E,0xE5,0xCC,0xFF,0x80,0xE5,0xCC,0xFF,0x81,0xE5,0xCC,0xFF,0x85,0xE5,0xCC,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x80,0x80,0xFF
];

function p8ToRGBA(p8: number): number[] {
    const offset = p8 * 4;
    return [
        P8Palette[offset + 1],
        P8Palette[offset + 2],
        P8Palette[offset + 3],
        P8Palette[offset + 0],
    ];
}

function getImageFormatBPP(fmt: GfxFormat): number {
    switch (fmt) {
        case GfxFormat.U8_RGBA_NORM: return 4;
        case GfxFormat.U16_RGB_565: return 2;
        default:
            throw new Error(`don't recognize format ${GfxFormat[fmt]}`);
    }
}

function isimageFormatCompressed(format: GfxFormat): boolean {
    return format === GfxFormat.BC1 || format === GfxFormat.BC2 || format === GfxFormat.BC3;
}

function getBitmapTextureFormat(format: BitmapFormat): GfxFormat {
    switch (format) {
        case wasm().BitmapFormat.Dxt1: return GfxFormat.BC1;
        case wasm().BitmapFormat.Dxt3: return GfxFormat.BC2;
        case wasm().BitmapFormat.Dxt5: return GfxFormat.BC3;
        case wasm().BitmapFormat.X8r8g8b8: return GfxFormat.U8_RGBA_NORM;
        case wasm().BitmapFormat.A8r8g8b8: return GfxFormat.U8_RGBA_NORM;
        case wasm().BitmapFormat.A8: return GfxFormat.U8_RGBA_NORM;
        case wasm().BitmapFormat.R5g6b5: return GfxFormat.U16_RGB_565;
        case wasm().BitmapFormat.P8: return GfxFormat.U8_RGBA_NORM;
        case wasm().BitmapFormat.P8Bump: return GfxFormat.U8_RGBA_NORM;
        case wasm().BitmapFormat.Y8: return GfxFormat.U8_RGBA_NORM;
        default:
            throw new Error(`couldn't recognize bitmap format ${wasm().BitmapFormat[format]}`);
    }
}

function getImageFormatByteLength(fmt: GfxFormat, width: number, height: number): number {
    if (isimageFormatCompressed(fmt)) {
        width = Math.max(width, 4);
        height = Math.max(height, 4);
        const count = ((width * height) / 16);
        if (fmt === GfxFormat.BC1)
            return count * 8;
        else if (fmt === GfxFormat.BC2)
            return count * 16;
        else if (fmt === GfxFormat.BC3)
            return count * 16;
        else
            throw new Error(`unrecognized compressed format ${GfxFormat[fmt]}`)
    } else {
        return (width * height) * getImageFormatBPP(fmt);
    }
}

function convertP8Data(p8Data: Uint8Array): Uint8Array {
    const result = new Uint8Array(p8Data.byteLength * 4);
    for (let i=0; i<p8Data.byteLength; i++) {
        let [r, g, b, a] = p8ToRGBA(p8Data[i]);
        result[4*i+0] = r;
        result[4*i+1] = g;
        result[4*i+2] = b;
        result[4*i+3] = a;
    }
    return result;
}

function convertA8Data(input: Uint8Array): Uint8Array {
    const result = new Uint8Array(input.byteLength * 4);
    for (let i=0; i<input.byteLength; i++) {
        result[4*i+0] = 0xFF;
        result[4*i+1] = 0xFF;
        result[4*i+2] = 0xFF;
        result[4*i+3] = input[i];
    }
    return result;
}

function convertY8Data(input: Uint8Array): Uint8Array {
    const result = new Uint8Array(input.byteLength * 4);
    for (let i=0; i<input.byteLength; i++) {
        result[4*i+0] = input[i];
        result[4*i+1] = input[i];
        result[4*i+2] = input[i];
        result[4*i+3] = 0xFF;
    }
    return result;
}

function getAndConvertBitmap(mgr: HaloSceneManager, bitmap: HaloBitmap, submap = 0): [HaloBitmapMetadata, Uint8Array] {
    const bitmapMetadata = bitmap.get_metadata_for_index(submap);
    let bitmapData = mgr.get_bitmap_data(bitmap, submap);
    if (bitmapMetadata.format === wasm().BitmapFormat.P8 || bitmapMetadata.format === wasm().BitmapFormat.P8Bump) {
        bitmapData = convertP8Data(bitmapData);
    } else if (bitmapMetadata.format === wasm().BitmapFormat.A8) {
        bitmapData = convertA8Data(bitmapData);
    } else if (bitmapMetadata.format === wasm().BitmapFormat.Y8) {
        bitmapData = convertY8Data(bitmapData);
    }
    return [bitmapMetadata, bitmapData];
}

function getTextureDimension(type: number): GfxTextureDimension {
    if (type === wasm().BitmapDataType.CubeMap)
        return GfxTextureDimension.Cube;
    else if (type === wasm().BitmapDataType.Tex2D)
        return GfxTextureDimension.n2D;
    else
        throw "whoops";
}

function makeTexture(device: GfxDevice, bitmap: HaloBitmap, mgr: HaloSceneManager, submap = 0): GfxTexture {
    const [bitmapMetadata, bitmapData] = getAndConvertBitmap(mgr, bitmap, submap);
    const format = getBitmapTextureFormat(bitmapMetadata.format);
    const mipmapCount = Math.max(bitmapMetadata.mipmap_count, 1);

    const dimension = getTextureDimension(bitmapMetadata.bitmap_type);
    let depth = 1;
    if (dimension === GfxTextureDimension.Cube)
        depth *= 6;

    const textureDescriptor = {
        dimension,
        pixelFormat: format,
        width: bitmapMetadata.width,
        height: bitmapMetadata.height,
        numLevels: mipmapCount,
        depth,
        usage: GfxTextureUsage.Sampled,
    };

    const texture = device.createTexture(textureDescriptor!);
    const levelDatas = [];
    let byteOffset = 0;
    let w = bitmapMetadata.width;
    let h = bitmapMetadata.height;
    for (let i = 0; i < mipmapCount; i++) {
        const sliceByteLength = getImageFormatByteLength(format, w, h);

        let buffer = new ArrayBufferSlice(bitmapData.buffer, byteOffset, sliceByteLength * depth);
        if (dimension === GfxTextureDimension.Cube) {
            // Rearrange cubemaps. Need to swap 1st and 2nd face.
            // TODO: Maybe it makes more sense to do this in Rust?

            const newData = new Uint8Array(buffer.copyToBuffer());

            const face1Offs = 1 * sliceByteLength;
            const face2Offs = 2 * sliceByteLength;
            newData.set(buffer.subarray(face2Offs, sliceByteLength).createTypedArray(Uint8Array), face1Offs);
            newData.set(buffer.subarray(face1Offs, sliceByteLength).createTypedArray(Uint8Array), face2Offs);

            buffer = new ArrayBufferSlice(newData.buffer);
        }

        let levelData: ArrayBufferView;
        if (format === GfxFormat.U16_RGB_565) {
            levelData = buffer.createTypedArray(Uint16Array);
        } else {
            levelData = buffer.createTypedArray(Uint8Array);
        }

        levelDatas.push(levelData);

        byteOffset += sliceByteLength * depth;
        w = Math.max(w >>> 1, 1);
        h = Math.max(h >>> 1, 1);
    }

    device.uploadTextureData(texture, 0, levelDatas);
    return texture;
}

export class TextureCache {
    public textures: Map<string, GfxTexture>;
    public default2DTexture: GfxTexture;

    constructor(public device: GfxDevice, public gfxSampler: GfxSampler, public mgr: HaloSceneManager) {
        this.textures = new Map();
        this.default2DTexture = makeSolidColorTexture2D(this.device, {
            r: 0.5,
            g: 0.5,
            b: 0.5,
            a: 1.0,
        });
    }

    public getTexture(bitmap: HaloBitmap | undefined, submap = 0): GfxTexture {
        if (!bitmap) {
            return this.default2DTexture;
        }

        const key: string = `${bitmap.get_tag_id()}_${submap}`;
        if (this.textures.has(key)) {
            return this.textures.get(key)!;
        } else {
            const texture = makeTexture(this.device, bitmap, this.mgr, submap);
            this.textures.set(key, texture);
            return texture;
        }
    }

    public getTextureMapping(bitmap: HaloBitmap | undefined, submap = 0): TextureMapping {
        const mapping = new TextureMapping();
        mapping.gfxTexture = this.getTexture(bitmap, submap);
        mapping.gfxSampler = this.gfxSampler;
        return mapping;
    }

    public destroy(device: GfxDevice) {
        device.destroyTexture(this.default2DTexture);
        for (let tex of this.textures.values()) {
            device.destroyTexture(tex);
        }
    }
}
