use std::{io::{Cursor, Seek, SeekFrom, Read}, convert::TryFrom};
use byteorder::{ReadBytesExt, LittleEndian};
use num_enum::{IntoPrimitive, TryFromPrimitive, TryFromPrimitiveError};

pub type Result<T> = std::result::Result<T, MapReaderError>;
pub type Pointer = u32;

#[derive(Debug, Clone)]
pub enum MapReaderError {
    IO(String),
    UnimplementedTag(String),
    InvalidTag(String),
}

impl From<std::io::Error> for MapReaderError {
    fn from(err: std::io::Error) -> Self {
        MapReaderError::IO(err.to_string())
    }
}

impl<T: TryFromPrimitive> From<TryFromPrimitiveError<T>> for MapReaderError {
    fn from(err: TryFromPrimitiveError<T>) -> Self {
        MapReaderError::IO(err.to_string())
    }
}

pub trait Deserialize {
    fn deserialize(data: &mut Cursor<Vec<u8>>) -> Result<Self> where Self: Sized;
}

#[derive(Debug, Clone)]
pub struct Block<T> {
    pub items: Option<Vec<T>>,
    base_pointer: Pointer,
    count: usize,
}

impl<T> Deserialize for Block<T> {
    fn deserialize(data: &mut Cursor<Vec<u8>>) -> Result<Self> where Self: Sized {
        let count = data.read_u32::<LittleEndian>()? as usize;
        let base_pointer = data.read_u32::<LittleEndian>()? as Pointer;
        data.seek(SeekFrom::Current(4))?;
        Ok(Block {
            count, 
            base_pointer,
            items: None,
        })
    }
}

impl<T: Deserialize> Block<T> {
    pub fn read_items(&mut self, data: &mut Cursor<Vec<u8>>, offset: i64) -> Result<()> {
        let mut items: Vec<T> = Vec::with_capacity(self.count as usize);
        if self.count > 0 {
            data.seek(SeekFrom::Start((self.base_pointer as i64 + offset) as u64))?;
            for _ in 0..self.count {
                items.push(T::deserialize(data)?);
            }
        }
        self.items = Some(items);
        Ok(())
    }
}

pub struct Vector3D {
    i: f32,
    j: f32,
    k: f32,
}

impl Deserialize for Vector3D {
    fn deserialize(data: &mut Cursor<Vec<u8>>) -> Result<Self> where Self: Sized {
        Ok(Vector3D {
            i: data.read_f32::<LittleEndian>()?,
            j: data.read_f32::<LittleEndian>()?,
            k: data.read_f32::<LittleEndian>()?,
        })
    }
}

pub struct TagDataOffset {
    size: u32,
    external: u32,
    file_offset: u32,
    pointer: u64,
}

pub struct Plane3D {
    norm: Vector3D,
    w: f32, // distance from origin (along normal)
}

pub struct Tri {
    v0: u16,
    v1: u16,
    v2: u16,
}

impl Deserialize for Tri {
    fn deserialize(data: &mut Cursor<Vec<u8>>) -> Result<Self> where Self: Sized {
        Ok(Tri {
            v0: data.read_u16::<LittleEndian>()?,
            v1: data.read_u16::<LittleEndian>()?,
            v2: data.read_u16::<LittleEndian>()?,
        })
    }
}
#[derive(Debug, Clone, Copy)]
pub struct ColorRGB {
    r: u8,
    g: u8,
    b: u8,
}

impl Deserialize for ColorRGB {
    fn deserialize(data: &mut Cursor<Vec<u8>>) -> Result<Self> where Self: Sized {
        Ok(ColorRGB {
            r: data.read_u8()?,
            g: data.read_u8()?,
            b: data.read_u8()?,
        })
    }
}

#[derive(Debug, Clone, Copy)]
pub struct ColorARGB {
    a: f32,
    r: f32,
    g: f32,
    b: f32,
}

impl Deserialize for ColorARGB {
    fn deserialize(data: &mut Cursor<Vec<u8>>) -> Result<Self> where Self: Sized {
        Ok(ColorARGB {
            a: data.read_f32::<LittleEndian>()?,
            r: data.read_f32::<LittleEndian>()?,
            g: data.read_f32::<LittleEndian>()?,
            b: data.read_f32::<LittleEndian>()?,
        })
    }
}
#[derive(Debug, Copy, Clone)]
pub struct Point2D {
    x: f32,
    y: f32,
}

impl Deserialize for Point2D {
    fn deserialize(data: &mut Cursor<Vec<u8>>) -> Result<Self> where Self: Sized {
        Ok(Point2D {
            x: data.read_f32::<LittleEndian>()?,
            y: data.read_f32::<LittleEndian>()?,
        })
    }
}

#[derive(Debug, Copy, Clone)]
pub struct Point2DInt {
    x: i16,
    y: i16,
}

impl Deserialize for Point2DInt {
    fn deserialize(data: &mut Cursor<Vec<u8>>) -> Result<Self> where Self: Sized {
        Ok(Point2DInt {
            x: data.read_i16::<LittleEndian>()?,
            y: data.read_i16::<LittleEndian>()?,
        })
    }
}

#[derive(Debug, Copy, Clone)]
pub struct Point3D {
    x: f32,
    y: f32,
    z: f32,
}

impl Deserialize for Point3D {
    fn deserialize(data: &mut Cursor<Vec<u8>>) -> Result<Self> where Self: Sized {
        Ok(Point3D {
            x: data.read_f32::<LittleEndian>()?,
            y: data.read_f32::<LittleEndian>()?,
            z: data.read_f32::<LittleEndian>()?,
        })
    }
}

#[derive(Debug, Clone, Copy)]
pub struct Euler3D {
    yaw: f32,
    pitch: f32,
    roll: f32,
}

impl Deserialize for Euler3D {
    fn deserialize(data: &mut Cursor<Vec<u8>>) -> Result<Self> where Self: Sized {
        Ok(Euler3D {
            yaw: data.read_f32::<LittleEndian>()?,
            pitch: data.read_f32::<LittleEndian>()?,
            roll: data.read_f32::<LittleEndian>()?,
        })
    }
}