
use wasm_bindgen::prelude::*;

use std::convert::TryInto;

// http://www.mindcontrol.org/~hplus/graphics/expand-bits.html
fn expand_n_to_8(v: u8, n: u8) -> u8 {
    (n << (8 - v)) | (n >> (v*2 - 8))
}

fn get_u16_be(src: &[u8], i: usize) -> u16 {
    u16::from_be_bytes(src[i..i+2].try_into().unwrap())
}

fn s3tcblend(a_: u8, b_: u8) -> u8 {
    // return (a*3 + b*5) / 8;
    let a = a_ as u32;
    let b = b_ as u32;
    let tmp = (((a << 1) + a) + ((b << 2) + b)) >> 3;
    return tmp as u8;
}

fn halfblend(a_: u8, b_: u8) -> u8 {
    let a = a_ as u32;
    let b = b_ as u32;
    let tmp = (a + b) >> 1;
    return tmp as u8;
}

trait TiledDecoder {
    fn decode_single_pixel(src: &[u8], src_offs: &mut usize, dst: &mut Vec<u8>, dst_offs: usize, write: bool);
    fn block_width() -> usize;
    fn block_height() -> usize;
}

fn decode_tiled<T: TiledDecoder>(src: &[u8], w: usize, h: usize) -> Vec<u8> {
    let mut src_offs: usize = 0;
    let mut dst = vec![0x00; w*h*4];

    let bw = T::block_width();
    let bh = T::block_height();
    for yy in (0..h).step_by(bh) {
        for xx in (0..w).step_by(bw) {
            for y in 0..bh {
                for x in 0..bw {
                    let dst_px = (yy + y) * w + (xx + x);
                    let dst_offs = dst_px * 4;
                    let write = xx + x < w && yy + y < h;
                    T::decode_single_pixel(src, &mut src_offs, &mut dst, dst_offs, write);
                }
            }
        }
    }

    dst
}

enum TiledDecoderI4 {}
impl TiledDecoder for TiledDecoderI4 {
    fn decode_single_pixel(src: &[u8], src_offs: &mut usize, dst: &mut Vec<u8>, dst_offs: usize, write: bool) {
        if write {
            let ii = src[*src_offs >> 1];
            let i4 = ii >> (if (*src_offs & 1) != 0 { 0 } else { 4 }) & 0x0F;
            let i = expand_n_to_8(4, i4);
            dst[dst_offs + 0] = i;
            dst[dst_offs + 1] = i;
            dst[dst_offs + 2] = i;
            dst[dst_offs + 3] = i;
        }

        *src_offs += 1;
    }

    fn block_width() -> usize { 8 }
    fn block_height() -> usize { 8 }
}

enum TiledDecoderI8 {}
impl TiledDecoder for TiledDecoderI8 {
    fn decode_single_pixel(src: &[u8], src_offs: &mut usize, dst: &mut Vec<u8>, dst_offs: usize, write: bool) {
        if write {
            let i = src[*src_offs];
            dst[dst_offs + 0] = i;
            dst[dst_offs + 1] = i;
            dst[dst_offs + 2] = i;
            dst[dst_offs + 3] = i;
        }

        *src_offs += 1;
    }

    fn block_width() -> usize { 8 }
    fn block_height() -> usize { 4 }
}

enum TiledDecoderIA4 {}
impl TiledDecoder for TiledDecoderIA4 {
    fn decode_single_pixel(src: &[u8], src_offs: &mut usize, dst: &mut Vec<u8>, dst_offs: usize, write: bool) {
        if write {
            let ia = src[*src_offs];
            let a = expand_n_to_8(4, ia >> 4);
            let i = expand_n_to_8(4, ia & 0x0F);
            dst[dst_offs + 0] = i;
            dst[dst_offs + 1] = i;
            dst[dst_offs + 2] = i;
            dst[dst_offs + 3] = a;
        }

        *src_offs += 1;
    }

    fn block_width() -> usize { 8 }
    fn block_height() -> usize { 4 }
}

enum TiledDecoderIA8 {}
impl TiledDecoder for TiledDecoderIA8 {
    fn decode_single_pixel(src: &[u8], src_offs: &mut usize, dst: &mut Vec<u8>, dst_offs: usize, write: bool) {
        if write {
            let a = src[*src_offs + 0];
            let i = src[*src_offs + 1];
            dst[dst_offs + 0] = i;
            dst[dst_offs + 1] = i;
            dst[dst_offs + 2] = i;
            dst[dst_offs + 3] = a;
        }

        *src_offs += 2;
    }

    fn block_width() -> usize { 4 }
    fn block_height() -> usize { 4 }
}

enum TiledDecoderRGB565 {}
impl TiledDecoder for TiledDecoderRGB565 {
    fn decode_single_pixel(src: &[u8], src_offs: &mut usize, dst: &mut Vec<u8>, dst_offs: usize, write: bool) {
        if write {
            let p = get_u16_be(src, *src_offs);
            dst[dst_offs + 0] = expand_n_to_8(5, ((p >> 11) & 0x1F) as u8);
            dst[dst_offs + 1] = expand_n_to_8(6, ((p >>  5) & 0x3F) as u8);
            dst[dst_offs + 2] = expand_n_to_8(5, ((p >>  0) & 0x1F) as u8);
            dst[dst_offs + 3] = 0xFF;
        }

        *src_offs += 2;
    }

    fn block_width() -> usize { 4 }
    fn block_height() -> usize { 4 }
}

enum TiledDecoderRGB5A3 {}
impl TiledDecoder for TiledDecoderRGB5A3 {
    fn decode_single_pixel(src: &[u8], src_offs: &mut usize, dst: &mut Vec<u8>, dst_offs: usize, write: bool) {
        if write {
            let p = get_u16_be(src, *src_offs);
            if (p & 0x8000) != 0 {
                // RGB5
                dst[dst_offs + 0] = expand_n_to_8(5, ((p >> 10) & 0x1F) as u8);
                dst[dst_offs + 1] = expand_n_to_8(5, ((p >>  5) & 0x1F) as u8);
                dst[dst_offs + 2] = expand_n_to_8(5, ((p >>  0) & 0x1F) as u8);
                dst[dst_offs + 3] = 0xFF;
            } else {
                // A3RGB4
                dst[dst_offs + 0] = expand_n_to_8(4, ((p >> 11) & 0x0F) as u8);
                dst[dst_offs + 1] = expand_n_to_8(4, ((p >>  5) & 0x0F) as u8);
                dst[dst_offs + 2] = expand_n_to_8(4, ((p >>  0) & 0x0F) as u8);
                dst[dst_offs + 3] = expand_n_to_8(3, ((p >> 12) & 0x07) as u8);
            }
        }

        *src_offs += 2;
    }

    fn block_width() -> usize { 4 }
    fn block_height() -> usize { 4 }
}

fn decode_rgba8(src: &[u8], w: usize, h: usize) -> Vec<u8> {
    let mut src_offs = 0;
    let mut dst = vec![0x00; w*h*4];

    // RGBA8 is a bit special, so we hand-code this one.
    let bh = 4;
    let bw = 4;
    for yy in (0..h).step_by(bh) {
        for xx in (0..h).step_by(bh) {
            for y in 0..bh {
                for x in 0..bw {
                    let write = xx + x < w && yy + y < h;

                    if write {
                        let dst_px = (yy + y) * w + (xx + x);
                        let dst_offs = dst_px * 4;
                        dst[dst_offs + 3] = src[src_offs + 0x00];
                        dst[dst_offs + 0] = src[src_offs + 0x01];
                    }

                    src_offs += 2;
                }
            }

            for y in 0..bh {
                for x in 0..bw {
                    let write = xx + x < w && yy + y < h;

                    if write {
                        let dst_px = (yy + y) * w + (xx + x);
                        let dst_offs = dst_px * 4;
                        dst[dst_offs + 1] = src[src_offs + 0x00];
                        dst[dst_offs + 2] = src[src_offs + 0x01];
                    }

                    src_offs += 2;
                }
            }
        }
    }

    dst
}

fn decode_cmpr(src: &[u8], w: usize, h: usize) -> Vec<u8> {
    // CMPR swizzles macroblocks to be in a 2x2 grid of UL, UR, BL, BR.
    let mut src_offs = 0;
    let mut dst = vec![0x00; w*h*4];

    for yy in (0..h).step_by(8) {
        for xx in (0..w).step_by(8) {
            for yb in (0..8).step_by(4) {
                for xb in (0..8).step_by(4) {
                    let src_offs_idx = src_offs;
                    src_offs += 0x08;

                    if xx + xb >= w || yy + yb >= h {
                        continue;
                    }

                    // CMPR difference: Big-endian color1/2
                    let color1 = get_u16_be(src, src_offs_idx + 0x00);
                    let color2 = get_u16_be(src, src_offs_idx + 0x02);

                    // Fill in first two colors in color table.
                    let mut color_table = [0x00; 16];

                    color_table[0] = expand_n_to_8(5, ((color1 >> 11) & 0x1F) as u8);
                    color_table[1] = expand_n_to_8(6, ((color1 >> 5) & 0x3F) as u8);
                    color_table[2] = expand_n_to_8(5, (color1 & 0x1F) as u8);
                    color_table[3] = 0xFF;

                    color_table[4] = expand_n_to_8(5, ((color2 >> 11) & 0x1F) as u8);
                    color_table[5] = expand_n_to_8(6, ((color2 >> 5) & 0x3F) as u8);
                    color_table[6] = expand_n_to_8(5, (color2 & 0x1F) as u8);
                    color_table[7] = 0xFF;

                    if color1 > color2 {
                        // Predict gradients.
                        color_table[8]  = s3tcblend(color_table[4], color_table[0]);
                        color_table[9]  = s3tcblend(color_table[5], color_table[1]);
                        color_table[10] = s3tcblend(color_table[6], color_table[2]);
                        color_table[11] = 0xFF;

                        color_table[12] = s3tcblend(color_table[0], color_table[4]);
                        color_table[13] = s3tcblend(color_table[1], color_table[5]);
                        color_table[14] = s3tcblend(color_table[2], color_table[6]);
                        color_table[15] = 0xFF;
                    } else {
                        color_table[8] =  halfblend(color_table[0], color_table[4]);
                        color_table[9] =  halfblend(color_table[1], color_table[5]);
                        color_table[10] = halfblend(color_table[2], color_table[6]);
                        color_table[11] = 0xFF;

                        // CMPR difference: GX fills with an alpha 0 midway point here.
                        color_table[12] = color_table[8];
                        color_table[13] = color_table[9];
                        color_table[14] = color_table[10];
                        color_table[15] = 0x00;
                    }

                    for y in 0..4 {
                        let mut bits = src[src_offs_idx + 0x04 + y];
                        for x in 0..4 {
                            let dst_px = (yy + yb + y) * w + (xx + xb + x);
                            let dst_offs = dst_px * 4;
                            let color_idx = ((bits >> 6) & 0x03) as usize;
                            let color_table_offs = color_idx * 4;
                            dst[dst_offs..dst_offs + 4].copy_from_slice(&color_table[color_table_offs..color_table_offs + 4]);
                            bits <<= 2;
                        }
                    }
                }
            }
        }
    }

    dst
}

#[wasm_bindgen]
pub enum PixelFormat {
    I4,
    I8,
    IA4,
    IA8,
    RGB565,
    RGB5A3,
    RGBA8,
    CMPR,
}

#[wasm_bindgen]
pub fn decode_texture(fmt: PixelFormat, src: &[u8], w: usize, h: usize) -> Vec<u8> {
    match fmt {
        PixelFormat::I4 => decode_tiled::<TiledDecoderI4>(src, w, h),
        PixelFormat::I8 => decode_tiled::<TiledDecoderI8>(src, w, h),
        PixelFormat::IA4 => decode_tiled::<TiledDecoderIA4>(src, w, h),
        PixelFormat::IA8 => decode_tiled::<TiledDecoderIA8>(src, w, h),
        PixelFormat::RGB565 => decode_tiled::<TiledDecoderRGB565>(src, w, h),
        PixelFormat::RGB5A3 => decode_tiled::<TiledDecoderRGB5A3>(src, w, h),
        PixelFormat::RGBA8 => decode_rgba8(src, w, h),
        PixelFormat::CMPR => decode_cmpr(src, w, h),
    }
}
